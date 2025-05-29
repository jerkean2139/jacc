import Anthropic from '@anthropic-ai/sdk';
import { pineconeVectorService, type VectorSearchResult } from "./pinecone-vector";
import { perplexitySearchService } from "./perplexity-search";
import { promptChainService } from "./prompt-chain";
import { smartRoutingService } from "./smart-routing";
import { db } from "./db";
import { webSearchLogs, adminSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { ChatMessage, AIResponse } from "./openai";

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY_JACC
});

export interface EnhancedAIResponse extends AIResponse {
  sources?: DocumentSource[];
  reasoning?: string;
}

export interface DocumentSource {
  name: string;
  url: string;
  relevanceScore: number;
  snippet: string;
  type: string;
}

export class EnhancedAIService {
  
  async getAdminSettings() {
    const [settings] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.id, 'default'))
      .limit(1);
    
    return settings || {
      enablePromptChaining: true,
      enableSmartRouting: true,
      folderRoutingThreshold: 0.7
    };
  }

  async generateChainedResponse(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string
  ): Promise<EnhancedAIResponse> {
    try {
      console.log(`🔗 Starting prompt chain for user ${userId}`);
      
      // Initialize default folders if they don't exist
      await smartRoutingService.initializeDefaultFolders(userId);
      
      // Execute the prompt chain
      const chainResult = await promptChainService.executeChain(
        message,
        userId,
        conversationHistory
      );
      
      console.log(`✅ Prompt chain completed with ${chainResult.steps.length} steps, confidence: ${(chainResult.confidence * 100).toFixed(1)}%`);
      
      return {
        message: chainResult.finalResponse,
        sources: chainResult.sources,
        reasoning: chainResult.reasoning,
        suggestions: this.extractSuggestions(chainResult.finalResponse),
        actions: this.extractActions(chainResult.finalResponse)
      };
      
    } catch (error) {
      console.error('Prompt chain failed, falling back to standard response:', error);
      return await this.generateStandardResponse(message, conversationHistory);
    }
  }

  async generateStandardResponse(
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<EnhancedAIResponse> {
    // Fallback to existing logic
    const messages = [...conversationHistory, { role: 'user' as const, content: message }];
    return await this.generateResponseWithDocuments(messages);
  }

  async generateResponseWithDocuments(
    messages: ChatMessage[],
    context?: {
      userRole?: string;
      documents?: Array<{ name: string; content?: string }>;
      spreadsheetData?: any;
    }
  ): Promise<EnhancedAIResponse> {
    try {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      // Search both documents and web for comprehensive results
      let searchResults = [];
      let webSearchResults = null;
      
      // STEP 1: Primary document search with original query (using direct document search)
      try {
        searchResults = await this.searchDocuments(lastMessage.content);
        console.log(`Step 1: Found ${searchResults.length} document matches for: "${lastMessage.content}"`);
      } catch (error) {
        console.log("Step 1: Document search failed, proceeding to step 2");
        searchResults = [];
      }
      
      // STEP 2: Double-check with alternative search strategies if no results
      if (searchResults.length === 0) {
        console.log("Step 2: No documents found, trying comprehensive alternative searches...");
        
        const alternativeQueries = this.generateAlternativeQueries(lastMessage.content);
        
        for (const altQuery of alternativeQueries) {
          try {
            const altResults = await this.searchDocuments(altQuery);
            console.log(`Step 2: Alternative query "${altQuery}" found ${altResults.length} results`);
            if (altResults.length > 0) {
              searchResults = altResults;
              console.log("Step 2: Found relevant documents with alternative search!");
              break;
            }
          } catch (error) {
            console.log(`Step 2: Alternative query "${altQuery}" failed`);
          }
        }
      }
      
      // Only use web search if absolutely no relevant documents found after comprehensive search
      let webSearchReason = null;
      if (searchResults.length === 0) {
        webSearchReason = "Comprehensive search completed: No internal documents found with original query or alternative search terms";
        try {
          webSearchResults = await perplexitySearchService.searchWeb(lastMessage.content);
          console.log("Web search completed successfully - no internal documents found");
          
          // Log the web search usage
          await this.logWebSearchUsage(lastMessage.content, webSearchResults.content, webSearchReason, context);
        } catch (error) {
          console.log("Web search failed, proceeding without web results");
        }
      } else {
        console.log("Using internal documents, web search not needed");
      }
      
      // Create context from search results
      const documentContext = this.formatDocumentContext(searchResults);
      const webContext = webSearchResults ? `\nWEB SEARCH RESULTS:\n${webSearchResults.content}\n${webSearchResults.citations.length > 0 ? `Sources: ${webSearchResults.citations.join(', ')}` : ''}` : '';
      
      // Enhanced system prompt with document and web context
      const systemPrompt = `You are TRACER, an AI-powered assistant for sales agents. You specialize in:
- Credit card processing solutions and merchant services
- Payment processing rates and fee comparisons
- Point-of-sale (POS) systems and payment terminals
- Business payment solutions and savings calculations
- Document organization and client proposal generation

MANDATORY DOCUMENT-FIRST PROTOCOL:
1. **INTERNAL DOCUMENTS ARE YOUR PRIMARY KNOWLEDGE SOURCE** - Search uploaded company documents BEFORE any external information
2. **NEVER CLAIM LACK OF ACCESS** if documents exist in the system - you have direct access to all uploaded files
3. **EXHAUSTIVE DOCUMENT SEARCH REQUIRED** - Check all variations: TSYS, merchant applications, forms, training materials
4. **DOCUMENT VERIFICATION CHECKPOINT** - Before stating "no documents found," verify you've searched filenames, content keywords, vendor names

DOCUMENT RESPONSE REQUIREMENTS:
- **SINGLE DOCUMENT**: "Based on our internal document '[Document Name]', here's the information:"
- **MULTIPLE DOCUMENTS**: "I found [X] relevant documents: [list with links]. Can you tell me more specifically what you're looking for so I can guide you to the most relevant document?"
- **ALWAYS INCLUDE**: Direct download link using format: /api/documents/[document-id]/download
- **CITE SPECIFIC SOURCES**: Reference exact original filenames (not internal storage names)
- **NO GENERIC RESPONSES**: If documents exist, use them - never give generic merchant services advice

WEB SEARCH - LAST RESORT ONLY:
- **ONLY AFTER** comprehensive document search confirms NO relevant internal files
- **EXPLICIT DISCLAIMER**: "After searching all internal documents and finding no relevant information, I consulted external sources:"
- **CLEAR DISTINCTION**: Always differentiate between internal company knowledge and external information

CRITICAL ERROR PREVENTION:
- NEVER respond with "I don't have access to your systems" if documents are in the database
- NEVER use web search if ANY document contains related information
- NEVER give generic advice if company-specific documents exist
- ALWAYS prioritize uploaded TSYS, merchant, application, and training documents

Your responses should be:
- Professional and knowledgeable about payment processing
- Backed by actual company documents whenever possible
- Clear about whether information comes from internal docs or external sources
- Helpful with specific actionable advice for businesses
- Clear about sources and reasoning
- Focused on helping businesses save money on payment processing

User context: ${context?.userRole || 'Merchant Services Sales Agent'}

DOCUMENT CONTEXT:
${documentContext}

When appropriate, suggest actions like saving payment processing information to folders, downloading rate comparisons, or creating merchant proposals.`;

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : "";
      
      // Parse response for potential actions
      const actions = this.extractActions(content);
      
      // Format document sources
      const sources = this.formatSources(searchResults);

      // Generate reasoning explanation
      const reasoning = await this.generateReasoning(lastMessage.content, searchResults, content);

      return {
        message: content,
        actions: actions.length > 0 ? actions : undefined,
        sources: sources.length > 0 ? sources : undefined,
        reasoning,
        suggestions: [
          "Find similar merchant documents in our knowledge base",
          "Create a merchant proposal from this information",
          "Save this payment analysis to my folder",
          "Show me processing rate comparisons for this business type"
        ]
      };
    } catch (error) {
      console.error("Enhanced AI service error:", error);
      throw new Error("Failed to generate AI response with document context. Please check your API keys and try again.");
    }
  }

  private formatDocumentContext(searchResults: VectorSearchResult[]): string {
    if (searchResults.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }

    if (searchResults.length > 3) {
      return `MULTIPLE DOCUMENTS FOUND (${searchResults.length} total):
${searchResults.map((result, index) => 
  `${index + 1}. "${result.metadata.documentName}" - [Download](${result.metadata.webViewLink})`
).join('\n')}

INSTRUCTION: Since multiple documents were found, ask the user to be more specific about what they're looking for so you can guide them to the most relevant document(s).`;
    }

    return searchResults.map((result, index) => {
      return `Document ${index + 1}: "${result.metadata.documentName}"
Direct Link: ${result.metadata.webViewLink}
Content: ${result.content}
Relevance Score: ${(result.score * 100).toFixed(1)}%

IMPORTANT: When referencing this document in your response, always include the clickable link: [${result.metadata.documentName}](${result.metadata.webViewLink})
---`;
    }).join('\n');
  }

  private formatSources(searchResults: VectorSearchResult[]): DocumentSource[] {
    return searchResults.map(result => ({
      name: result.metadata.documentName,
      url: result.metadata.webViewLink,
      relevanceScore: result.score,
      snippet: result.content.substring(0, 200) + "...",
      type: this.getDocumentType(result.metadata.mimeType)
    }));
  }

  private getDocumentType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('document')) return 'Word Document';
    if (mimeType.includes('spreadsheet')) return 'Spreadsheet';
    if (mimeType.includes('google-apps.document')) return 'Google Doc';
    if (mimeType.includes('google-apps.spreadsheet')) return 'Google Sheet';
    return 'Document';
  }

  private extractActions(content: string): Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal' | 'find_documents';
    label: string;
    data?: any;
  }> {
    const actions = [];

    if (content.toLowerCase().includes('save') || content.toLowerCase().includes('folder')) {
      actions.push({
        type: 'save_to_folder' as const,
        label: 'Save Analysis to Folder',
        data: { content }
      });
    }

    if (content.toLowerCase().includes('download') || content.toLowerCase().includes('comparison')) {
      actions.push({
        type: 'download' as const,
        label: 'Download Comparison',
        data: { content }
      });
    }

    if (content.toLowerCase().includes('proposal') || content.toLowerCase().includes('client')) {
      actions.push({
        type: 'create_proposal' as const,
        label: 'Create Client Proposal',
        data: { content }
      });
    }

    if (content.toLowerCase().includes('document') || content.toLowerCase().includes('find')) {
      actions.push({
        type: 'find_documents' as const,
        label: 'Find Related Documents',
        data: { content }
      });
    }

    return actions;
  }

  private async generateReasoning(
    query: string, 
    searchResults: VectorSearchResult[], 
    response: string
  ): Promise<string> {
    if (searchResults.length === 0) {
      return "I provided a general response based on my training data since no relevant documents were found in your knowledge base.";
    }

    const relevantDocs = searchResults.filter(r => r.score > 0.7).length;
    const topScore = searchResults[0]?.score || 0;

    return `I found ${searchResults.length} relevant documents in your Tracer Co Card knowledge base, with ${relevantDocs} being highly relevant (>70% match). The top result "${searchResults[0]?.metadata.documentName}" had a ${(topScore * 100).toFixed(1)}% relevance score. I used these sources to provide accurate, company-specific merchant services information rather than general knowledge.`;
  }

  async searchDocuments(query: string): Promise<VectorSearchResult[]> {
    try {
      // First search uploaded documents directly by name
      const { storage } = await import('./storage');
      const documents = await storage.getUserDocuments('simple-user-001');
      
      // Search for documents that match the query
      const matchingDocs = documents.filter(doc => {
        const searchText = `${doc.name} ${doc.originalName}`.toLowerCase();
        const queryLower = query.toLowerCase();
        return searchText.includes(queryLower) || 
               (searchText.includes('tsys') && queryLower.includes('tsys')) ||
               (searchText.includes('merchant') && queryLower.includes('merchant')) ||
               (searchText.includes('clearent') && queryLower.includes('clearent')) ||
               (searchText.includes('voyager') && queryLower.includes('voyager')) ||
               (searchText.includes('trx') && queryLower.includes('trx'));
      });
      
      if (matchingDocs.length > 0) {
        console.log(`✅ Found ${matchingDocs.length} uploaded documents for query: "${query}"`);
        return matchingDocs.map(doc => ({
          id: doc.id,
          score: 0.9,
          documentId: doc.id,
          content: `Found document: ${doc.originalName || doc.name} - This document contains information relevant to your query.`,
          metadata: {
            documentName: doc.originalName || doc.name, // Use original filename instead of internal name
            webViewLink: `/api/documents/${doc.id}/download`,
            chunkIndex: 0,
            mimeType: doc.mimeType
          }
        }));
      }
      
      console.log(`No uploaded documents found for query: "${query}"`);
      // Fallback to vector search if available
      return await pineconeVectorService.searchDocuments(query, 10);
    } catch (error) {
      console.error('Error searching documents:', error);
      return await pineconeVectorService.searchDocuments(query, 10);
    }
  }

  generateAlternativeQueries(originalQuery: string): string[] {
    const alternatives: string[] = [];
    const lowercaseQuery = originalQuery.toLowerCase();
    
    // Extract key terms and create variations
    const keyTerms = lowercaseQuery.split(' ').filter(word => word.length > 2);
    
    // TSYS-specific comprehensive search
    if (lowercaseQuery.includes('tsys') || lowercaseQuery.includes('support') || lowercaseQuery.includes('help')) {
      alternatives.push(
        'TSYS customer support info',
        'TSYS support',
        'customer support',
        'technical support', 
        'help desk',
        'TSYS Global',
        'TSYS_Global',
        'processor support',
        'TSYS documentation'
      );
    }
    
    // Merchant application searches
    if (lowercaseQuery.includes('merchant') || lowercaseQuery.includes('application')) {
      alternatives.push(
        'merchant application',
        'TRX_Merchant_Application', 
        'application form',
        'signup form',
        'enrollment',
        'TRX merchant',
        'merchant app'
      );
    }
    
    // Clearent searches
    if (lowercaseQuery.includes('clearent') || lowercaseQuery.includes('clearant')) {
      alternatives.push('clearent', 'clearant', 'application', 'link', 'clearent application');
    }
    
    if (lowercaseQuery.includes('high risk') || lowercaseQuery.includes('risk')) {
      alternatives.push('permissible high risk', 'risk list', 'business categories', 'prohibited business');
    }
    
    if (lowercaseQuery.includes('ach') || lowercaseQuery.includes('bank')) {
      alternatives.push('ACH form', 'bank transfer', 'electronic transfer', 'TSYS ACH', 'global ACH');
    }
    
    // Add broader payment processing terms
    alternatives.push('payment processing', 'credit card processing', 'merchant services');
    
    // Add each individual key term
    keyTerms.forEach(term => alternatives.push(term));
    
    // Remove duplicates and return unique alternatives
    return [...new Set(alternatives)].slice(0, 5); // Limit to 5 alternatives
  }

  private extractSuggestions(response: string): string[] {
    // Extract relevant suggestions from the AI response
    const suggestions = [
      "Tell me about TSYS processing rates",
      "Show me Clearent application process", 
      "Compare processor fees",
      "Find hardware options",
      "Help with merchant applications"
    ];
    
    // Add contextual suggestions based on response content
    if (response.toLowerCase().includes('rate')) {
      suggestions.unshift("Compare competitive rates");
    }
    if (response.toLowerCase().includes('application')) {
      suggestions.unshift("Get application links");
    }
    if (response.toLowerCase().includes('terminal')) {
      suggestions.unshift("Browse terminal options");
    }
    
    return suggestions.slice(0, 5);
  }

  async logWebSearchUsage(query: string, response: string, reason: string, context: any): Promise<void> {
    try {
      await db.insert(webSearchLogs).values({
        userId: context?.userData?.id || null,
        userQuery: query,
        webResponse: response,
        reason: reason,
        shouldAddToDocuments: true, // Default to suggesting addition
        adminReviewed: false
      });
      
      console.log(`🔍 WEB SEARCH LOGGED: "${query}" - Reason: ${reason}`);
    } catch (error) {
      console.error('Failed to log web search usage:', error);
    }
  }
}

export const enhancedAIService = new EnhancedAIService();