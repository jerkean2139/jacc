import { generateChatResponse } from "./openai";
import { smartRoutingService, QueryClassification } from "./smart-routing";
import { pineconeVectorService, VectorSearchResult } from "./pinecone-vector";
import { perplexitySearchService } from "./perplexity-search";

export interface ChainStep {
  step: number;
  prompt: string;
  response: string;
  reasoning: string;
  nextAction?: 'search_documents' | 'web_search' | 'synthesize' | 'complete';
  searchNamespaces?: string[];
  searchResults?: VectorSearchResult[];
}

export interface ChainedResponse {
  steps: ChainStep[];
  finalResponse: string;
  sources: Array<{
    name: string;
    url: string;
    relevanceScore: number;
    snippet: string;
    type: string;
  }>;
  reasoning: string;
  confidence: number;
}

export class PromptChainService {
  
  async executeChain(
    query: string, 
    userId: string, 
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<ChainedResponse> {
    
    const steps: ChainStep[] = [];
    
    // Step 1: Query Classification and Intent Recognition
    const classificationStep = await this.classifyQueryIntent(query, conversationHistory);
    steps.push(classificationStep);
    
    // Extract JSON from response that might contain markdown code blocks
    const cleanClassificationResponse = classificationStep.response.replace(/```json\n?|\n?```/g, '').trim();
    const classification = JSON.parse(cleanClassificationResponse) as QueryClassification;
    
    // Step 2: Smart Folder Routing
    const routingStep = await this.determineFolderRouting(classification, userId);
    steps.push(routingStep);
    
    // Extract JSON from response that might contain markdown code blocks
    const cleanRoutingResponse = routingStep.response.replace(/```json\n?|\n?```/g, '').trim();
    const namespaces = JSON.parse(cleanRoutingResponse).suggestedNamespaces;
    
    // Step 3: Document Search with Smart Routing
    const searchStep = await this.executeSmartDocumentSearch(query, namespaces);
    steps.push(searchStep);
    
    // Step 4: Synthesize Final Response
    const synthesisStep = await this.synthesizeFinalResponse(
      query, 
      searchStep.searchResults || [], 
      conversationHistory,
      classification
    );
    steps.push(synthesisStep);
    
    return {
      steps,
      finalResponse: synthesisStep.response,
      sources: this.extractSources(searchStep.searchResults || []),
      reasoning: this.buildReasoningChain(steps),
      confidence: this.calculateConfidence(steps)
    };
  }
  
  private async classifyQueryIntent(
    query: string, 
    history: Array<{role: string, content: string}>
  ): Promise<ChainStep> {
    
    const contextualPrompt = `
You are a merchant services expert AI analyzing user queries. Classify this query and extract key information.

CONVERSATION HISTORY:
${history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}

CURRENT QUERY: "${query}"

Analyze and respond with JSON containing:
{
  "intent": "processor_info|gateway_info|hardware_info|sales_material|rate_comparison|general",
  "processors": ["list", "of", "mentioned", "processors"],
  "gateways": ["list", "of", "mentioned", "gateways"],
  "hardwareTypes": ["list", "of", "hardware", "types"],
  "confidence": 0.0-1.0,
  "suggestedNamespaces": ["list", "of", "folder", "namespaces"],
  "reasoning": "explain your classification logic"
}

Key merchant services processors: TSYS, Clearent, Shift4, First Data, WorldPay, Square, Stripe, Chase PaymenTech
Key gateways: Authorize.Net, Stripe, PayPal, Braintree, Square
Key hardware: Terminals, Mobile Readers, PINpads, Virtual Terminals
`;

    const response = await generateChatResponse([
      { role: 'system', content: contextualPrompt },
      { role: 'user', content: query }
    ]);
    
    return {
      step: 1,
      prompt: contextualPrompt,
      response: response.message,
      reasoning: "Classified user query intent and extracted key entities",
      nextAction: 'search_documents'
    };
  }
  
  private async determineFolderRouting(
    classification: QueryClassification,
    userId: string
  ): Promise<ChainStep> {
    
    const routes = await smartRoutingService.getFolderRoutes(userId, classification);
    
    const routingPrompt = `
Based on the query classification, determine the optimal folder routing strategy.

CLASSIFICATION: ${JSON.stringify(classification, null, 2)}
AVAILABLE ROUTES: ${JSON.stringify(routes, null, 2)}

Respond with JSON:
{
  "suggestedNamespaces": ["prioritized", "list", "of", "namespaces"],
  "searchStrategy": "focused|broad|fallback",
  "reasoning": "explain routing decision"
}
`;

    const namespaces = routes.slice(0, 3).map(r => r.namespace);
    
    return {
      step: 2,
      prompt: routingPrompt,
      response: JSON.stringify({
        suggestedNamespaces: namespaces,
        searchStrategy: namespaces.length > 0 ? 'focused' : 'broad',
        reasoning: `Selected top ${namespaces.length} namespaces based on classification confidence and folder priorities`
      }),
      reasoning: "Determined optimal folder routing strategy",
      nextAction: 'search_documents',
      searchNamespaces: namespaces
    };
  }
  
  private async executeSmartDocumentSearch(
    query: string,
    namespaces: string[]
  ): Promise<ChainStep> {
    
    let searchResults: VectorSearchResult[] = [];
    
    try {
      // Search in prioritized namespaces first
      if (namespaces.length > 0) {
        searchResults = await pineconeVectorService.searchDocuments(query, 10, namespaces);
      }
      
      // If no results, try broader search
      if (searchResults.length === 0) {
        searchResults = await pineconeVectorService.searchDocuments(query, 10, ['default']);
      }
      
    } catch (error) {
      console.log('Document search failed, will use web search fallback');
    }
    
    const searchPrompt = `
Execute document search with smart routing strategy.

QUERY: "${query}"
NAMESPACES: ${JSON.stringify(namespaces)}
RESULTS FOUND: ${searchResults.length}

Search strategy: ${namespaces.length > 0 ? 'Namespace-focused' : 'Broad'} search
`;

    return {
      step: 3,
      prompt: searchPrompt,
      response: `Found ${searchResults.length} relevant documents across ${namespaces.length} namespaces`,
      reasoning: "Executed smart document search with namespace routing",
      nextAction: searchResults.length > 0 ? 'synthesize' : 'web_search',
      searchResults
    };
  }
  
  private async synthesizeFinalResponse(
    query: string,
    searchResults: VectorSearchResult[],
    history: Array<{role: string, content: string}>,
    classification: QueryClassification
  ): Promise<ChainStep> {
    
    const systemPrompt = this.buildEnhancedSystemPrompt(classification);
    const documentContext = this.formatDocumentContext(searchResults);
    
    let webContext = '';
    if (searchResults.length === 0) {
      try {
        const webSearch = await perplexitySearchService.searchWeb(query);
        webContext = `WEB SEARCH RESULTS:\n${webSearch.content}\n\nCITATIONS:\n${webSearch.citations.join('\n')}`;
      } catch (error) {
        console.log('Web search also failed, providing general response');
      }
    }
    
    const synthesisPrompt = `
${systemPrompt}

CONVERSATION HISTORY:
${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}

DOCUMENT CONTEXT:
${documentContext}

${webContext}

USER QUERY: "${query}"

Provide a comprehensive, expert response using the available context. If using documents, cite them properly. If using web search, acknowledge the sources.
`;

    const response = await generateChatResponse([
      { role: 'system', content: synthesisPrompt },
      { role: 'user', content: query }
    ]);
    
    return {
      step: 4,
      prompt: synthesisPrompt,
      response: response.message,
      reasoning: "Synthesized final response using available context and domain expertise",
      nextAction: 'complete'
    };
  }
  
  private buildEnhancedSystemPrompt(classification: QueryClassification): string {
    const basePrompt = `You are JACC (Just Another Credit Card) AI Assistant, a specialized expert in merchant services, payment processing, and sales support.`;
    
    const intentPrompts = {
      processor_info: `Focus on processor-specific information including rates, features, application processes, and technical requirements.`,
      gateway_info: `Emphasize gateway integration, API capabilities, security features, and technical specifications.`,
      hardware_info: `Provide detailed hardware specifications, compatibility, pricing, and deployment considerations.`,
      sales_material: `Focus on sales enablement, competitive advantages, ROI calculations, and client presentation materials.`,
      rate_comparison: `Prioritize accurate rate analysis, cost breakdowns, fee structures, and competitive positioning.`,
      general: `Provide comprehensive merchant services guidance across all areas.`
    };
    
    return `${basePrompt}

SPECIALIZED FOCUS: ${intentPrompts[classification.intent]}

KEY PRINCIPLES:
- Always prioritize internal document knowledge over web search
- Provide specific, actionable information with exact details
- Include relevant rates, fees, and technical specifications when available
- Cite document sources when using internal knowledge
- Be honest about limitations and suggest next steps when needed
- Use merchant services terminology appropriately for the audience level`;
  }
  
  private formatDocumentContext(results: VectorSearchResult[]): string {
    if (results.length === 0) return 'No relevant internal documents found.';
    
    return results.map((result, index) => {
      return `DOCUMENT ${index + 1}: ${result.metadata.documentName}
RELEVANCE: ${(result.score * 100).toFixed(1)}%
CONTENT: ${result.content.substring(0, 500)}...
SOURCE: ${result.metadata.webViewLink}
`;
    }).join('\n\n');
  }
  
  private extractSources(results: VectorSearchResult[]) {
    return results.map(result => ({
      name: result.metadata.documentName,
      url: result.metadata.webViewLink,
      relevanceScore: result.score,
      snippet: result.content.substring(0, 200) + '...',
      type: result.metadata.mimeType.includes('pdf') ? 'PDF Document' : 'Document'
    }));
  }
  
  private buildReasoningChain(steps: ChainStep[]): string {
    return steps.map((step, index) => 
      `Step ${step.step}: ${step.reasoning}`
    ).join(' → ');
  }
  
  private calculateConfidence(steps: ChainStep[]): number {
    // Calculate confidence based on successful steps and search results
    const hasDocuments = steps.some(step => step.searchResults && step.searchResults.length > 0);
    const completedSteps = steps.filter(step => step.response).length;
    
    let confidence = (completedSteps / 4) * 0.7; // Base confidence from completed steps
    if (hasDocuments) confidence += 0.3; // Bonus for having document sources
    
    return Math.min(confidence, 1.0);
  }
}

export const promptChainService = new PromptChainService();