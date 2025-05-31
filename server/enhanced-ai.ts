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
  needsExternalSearchPermission?: boolean;
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
      console.log(`🔍 Step 1: Searching internal document database for user ${userId}`);
      
      // Step 1: Search internal documents only
      const documentResults = await this.searchDocuments(message);
      
      if (documentResults.length > 0) {
        console.log(`✅ Found ${documentResults.length} relevant documents in internal database`);
        
        // Generate response with document context
        return await this.generateResponseWithDocuments(
          message,
          documentResults,
          conversationHistory,
          userId
        );
      } else {
        console.log(`❌ No relevant documents found in internal database`);
        
        // Return response indicating no documents found and asking for permission to search externally
        return {
          message: "I searched our internal document database but didn't find specific information about your query. Would you like me to search external sources for additional information?",
          sources: [],
          reasoning: "No relevant documents found in internal database",
          suggestions: ["Search external sources", "Try a different search term", "Upload relevant documents"],
          actions: [{ type: 'external_search_request', query: message }],
          needsExternalSearchPermission: true
        };
      }
      
    } catch (error) {
      console.error('Document search failed, falling back to standard response:', error);
      return await this.generateStandardResponse(message, conversationHistory, userId);
    }
  }

  async generateStandardResponse(
    message: string,
    conversationHistory: ChatMessage[],
    userId?: string
  ): Promise<EnhancedAIResponse> {
    // Step 1: Get user's custom prompt if available
    let customPrompt = null;
    if (userId) {
      const { storage } = await import('./storage');
      customPrompt = await storage.getUserDefaultPrompt(userId);
    }

    // Step 2: Use ZenBot knowledge base guided document search (PRIORITIZED)
    const searchResults = await this.searchDocuments(message);
    
    if (searchResults.length > 0) {
      console.log(`📋 Found ${searchResults.length} documents using ZenBot guidance for: "${message}"`);
      const messages = [...conversationHistory, { role: 'user' as const, content: message }];
      return await this.generateResponseWithDocuments(messages, { searchResults, customPrompt });
    }
    
    // Step 3: If no internal documents found, still use custom prompt for general response
    const messages = [...conversationHistory, { role: 'user' as const, content: message }];
    return await this.generateResponseWithDocuments(messages, { customPrompt });
  }

  async generateResponseWithDocuments(
    messages: ChatMessage[],
    context?: {
      searchResults?: VectorSearchResult[];
      customPrompt?: any;
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
  `${index + 1}. [${result.metadata.documentName}](${result.metadata.webViewLink}) ${result.metadata.mimeType?.includes('pdf') ? '📄' : '📊'}`
).join('\n')}

INSTRUCTION: Since multiple documents were found, ask the user to be more specific about what they're looking for so you can guide them to the most relevant document(s).`;
    }

    return searchResults.map((result, index) => {
      return `Document ${index + 1}: [${result.metadata.documentName}](${result.metadata.webViewLink}) ${result.metadata.mimeType?.includes('pdf') ? '📄' : '📊'}
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

  async searchZenBotKnowledgeBase(query: string): Promise<VectorSearchResult[]> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const knowledgeBasePath = path.join(process.cwd(), 'uploads', 'zenbot-knowledge-base.csv');
      
      if (!fs.existsSync(knowledgeBasePath)) {
        console.log('ZenBot knowledge base not found at:', knowledgeBasePath);
        return [];
      }

      const csvContent = fs.readFileSync(knowledgeBasePath, 'utf8');
      const lines = csvContent.split('\n').slice(1); // Skip header
      
      const queryLower = query.toLowerCase();
      const matchingEntries = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Handle CSV parsing properly - split on commas but handle quoted text
        const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!columns || columns.length < 2) continue;
        
        const question = columns[0].replace(/"/g, '').trim();
        const answer = columns[1].replace(/"/g, '').trim();
        
        if (!question || !answer) continue;

        const questionLower = question.toLowerCase();
        
        // Check for keyword matches in the question
        const keywordMatches = [
          questionLower.includes(queryLower),
          this.checkKeywordRelevance(queryLower, questionLower),
          this.checkProcessorMatches(queryLower, questionLower),
          this.checkPOSMatches(queryLower, questionLower),
          this.checkIntegrationMatches(queryLower, questionLower)
        ];

        if (keywordMatches.some(match => match)) {
          matchingEntries.push({
            question: question.replace(/"/g, ''),
            answer: answer.replace(/"/g, ''),
            relevance: this.calculateRelevance(queryLower, questionLower)
          });
        }
      }

      if (matchingEntries.length === 0) {
        return [];
      }

      // Sort by relevance and return top matches
      matchingEntries.sort((a, b) => b.relevance - a.relevance);
      
      return matchingEntries.slice(0, 3).map((entry, index) => ({
        id: `zenbot-${index}`,
        score: entry.relevance,
        documentId: '2dc361a6-0507-469e-86b2-c0caeed94259',
        content: `Q: ${entry.question}\nA: ${entry.answer}`,
        metadata: {
          documentName: 'ZenBot Knowledge Base - Q&A Reference',
          webViewLink: '/api/documents/2dc361a6-0507-469e-86b2-c0caeed94259/view',
          downloadLink: '/api/documents/2dc361a6-0507-469e-86b2-c0caeed94259/download',
          previewLink: '/api/documents/2dc361a6-0507-469e-86b2-c0caeed94259/preview',
          chunkIndex: index,
          mimeType: 'text/csv'
        }
      }));
    } catch (error) {
      console.error('Error searching ZenBot knowledge base:', error);
      return [];
    }
  }

  private checkKeywordRelevance(query: string, question: string): boolean {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    return queryWords.some(word => question.includes(word));
  }

  private checkProcessorMatches(query: string, question: string): boolean {
    const processors = ['tsys', 'clearent', 'trx', 'shift4', 'micamp', 'voyager', 'merchant lynx'];
    return processors.some(processor => 
      query.includes(processor) && question.includes(processor)
    );
  }

  private checkPOSMatches(query: string, question: string): boolean {
    const posTerms = ['pos', 'point of sale', 'quantic', 'clover', 'skytab', 'hubwallet', 'aloha'];
    const restaurantTerms = ['restaurant', 'food', 'dining', 'cafe', 'bar'];
    
    // Direct POS term matches
    const directMatch = posTerms.some(term => 
      query.includes(term) && question.includes(term)
    );
    
    // Restaurant + POS combination matches
    const restaurantPOSMatch = restaurantTerms.some(restTerm => query.includes(restTerm)) && 
                              question.includes('restaurant') && question.includes('pos');
    
    return directMatch || restaurantPOSMatch;
  }

  private checkIntegrationMatches(query: string, question: string): boolean {
    const integrationTerms = ['integrate', 'quickbooks', 'epicor', 'aloha', 'roommaster'];
    return integrationTerms.some(term => 
      query.includes(term) && question.includes(term)
    );
  }

  private calculateRelevance(query: string, question: string): number {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const questionWords = question.split(' ');
    
    let matches = 0;
    for (const queryWord of queryWords) {
      if (questionWords.some(qWord => qWord.includes(queryWord))) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  async searchDocuments(query: string): Promise<VectorSearchResult[]> {
    try {
      // PRIORITY 1: Search ZenBot Knowledge Base for internal guidance (not user-facing)
      const knowledgeBaseGuidance = await this.searchZenBotKnowledgeBase(query);
      let searchTerms = [query]; // Start with original query
      
      if (knowledgeBaseGuidance.length > 0) {
        console.log(`✅ Found guidance in ZenBot Knowledge Base for: "${query}"`);
        // Extract search terms from the knowledge base answers to guide document search
        searchTerms = this.extractSearchTermsFromGuidance(knowledgeBaseGuidance, query);
        console.log(`🔍 Using enhanced search terms: ${searchTerms.join(', ')}`);
      }

      // PRIORITY 2: Search uploaded documents using guidance from knowledge base
      const { storage } = await import('./storage');
      const documents = await storage.getUserDocuments('dev-user-123');
      
      let matchingDocs: any[] = [];
      
      // Search using each search term from knowledge base guidance
      for (const searchTerm of searchTerms) {
        const termMatches = documents.filter(doc => {
          const searchText = `${doc.name} ${doc.originalName}`.toLowerCase();
          const termLower = searchTerm.toLowerCase();
          
          // Enhanced keyword matching using guided terms
          const keywordMatches = [
            // Direct term match
            searchText.includes(termLower),
            // Processor names from knowledge base
            (searchText.includes('tsys') && termLower.includes('tsys')),
            (searchText.includes('clearent') && termLower.includes('clearent')),
            (searchText.includes('voyager') && termLower.includes('voyager')),
            (searchText.includes('trx') && termLower.includes('trx')),
            (searchText.includes('shift') && (termLower.includes('shift') || termLower.includes('shift4'))),
            (searchText.includes('skytab') && (termLower.includes('skytab') || termLower.includes('sky tab'))),
            (searchText.includes('clover') && termLower.includes('clover')),
            (searchText.includes('micamp') && termLower.includes('micamp')),
            (searchText.includes('hubwallet') && termLower.includes('hubwallet')),
            (searchText.includes('quantic') && termLower.includes('quantic')),
            // Service types from knowledge base
            (searchText.includes('restaurant') && termLower.includes('restaurant')),
            (searchText.includes('pos') && (termLower.includes('pos') || termLower.includes('point of sale'))),
            (searchText.includes('processing') && termLower.includes('processing')),
            (searchText.includes('rates') && (termLower.includes('rates') || termLower.includes('pricing')))
          ];
          
          return keywordMatches.some(match => match);
        });
        
        matchingDocs.push(...termMatches);
      }
      
      // Remove duplicates
      matchingDocs = Array.from(new Map(matchingDocs.map(doc => [doc.id, doc])).values());
      
      if (matchingDocs.length > 0) {
        console.log(`✅ Found ${matchingDocs.length} uploaded documents for query: "${query}"`);
        return matchingDocs.map(doc => ({
          id: doc.id,
          score: 0.9,
          documentId: doc.id,
          content: `Found document: ${doc.originalName || doc.name} - This document contains information relevant to your query.`,
          metadata: {
            documentName: doc.originalName || doc.name,
            webViewLink: `/api/documents/${doc.id}/view`,
            downloadLink: `/api/documents/${doc.id}/download`,
            previewLink: `/api/documents/${doc.id}/preview`,
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

  private extractSearchTermsFromGuidance(knowledgeBaseResults: VectorSearchResult[], originalQuery: string): string[] {
    const searchTerms = [originalQuery]; // Always include original query
    
    // Extract key terms from knowledge base answers
    knowledgeBaseResults.forEach(result => {
      const content = result.content.toLowerCase();
      
      // Extract company/provider names mentioned in knowledge base
      const providers = ['shift4', 'skytab', 'micamp', 'clover', 'hubwallet', 'quantic', 'clearent', 'trx', 'tsys', 'authorize.net', 'fluid pay', 'accept blue'];
      providers.forEach(provider => {
        if (content.includes(provider)) {
          searchTerms.push(provider);
        }
      });
      
      // Extract product/service types
      const services = ['restaurant pos', 'pos system', 'point of sale', 'payment processing', 'terminal', 'gateway', 'ach', 'gift cards', 'mobile solution'];
      services.forEach(service => {
        if (content.includes(service)) {
          searchTerms.push(service);
        }
      });
    });
    
    // Remove duplicates and return
    return [...new Set(searchTerms)];
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