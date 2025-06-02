import Anthropic from '@anthropic-ai/sdk';
import { pineconeVectorService, type VectorSearchResult } from "./pinecone-vector";
import { perplexitySearchService, type ExternalSearchResult } from "./perplexity-search";
import { aiEnhancedSearchService } from "./ai-enhanced-search";
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
  actionItems?: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: string;
    category: string;
  }>;
  followupTasks?: Array<{
    task: string;
    timeframe: string;
    type: 'call' | 'email' | 'meeting' | 'document' | 'other';
  }>;
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
          conversationHistory,
          {
            searchResults: documentResults,
            userRole: 'Sales Agent'
          }
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
      // Find the last user message in the conversation
      const lastUserMessage = messages.slice().reverse().find(msg => msg.role === 'user');
      if (!lastUserMessage) {
        throw new Error('No user message found in conversation');
      }

      // Use provided search results from context or search documents
      let searchResults = context?.searchResults || [];
      let webSearchResults = null;
      
      // If no search results provided, search documents
      if (searchResults.length === 0) {
        try {
          searchResults = await this.searchDocuments(lastUserMessage.content);
          console.log(`Found ${searchResults.length} document matches for: "${lastUserMessage.content}"`);
        } catch (error) {
          console.log("Document search failed");
          searchResults = [];
        }
      }
      
      // STEP 2: Double-check with alternative search strategies if no results
      if (searchResults.length === 0) {
        console.log("Step 2: No documents found, trying comprehensive alternative searches...");
        
        const alternativeQueries = this.generateAlternativeQueries(lastUserMessage.content);
        
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
          webSearchResults = await perplexitySearchService.searchWeb(lastUserMessage.content);
          console.log("Web search completed successfully - no internal documents found");
          
          // Log the web search usage
          await this.logWebSearchUsage(lastUserMessage.content, webSearchResults.content, webSearchReason, context);
        } catch (error) {
          console.log("Web search failed, proceeding without web results");
        }
      } else {
        console.log("Using internal documents, web search not needed");
      }
      
      // Create context from search results
      const documentContext = this.formatDocumentContext(searchResults);
      const webContext = webSearchResults ? `\nWEB SEARCH RESULTS:\n${webSearchResults.content}\n${webSearchResults.citations.length > 0 ? `Sources: ${webSearchResults.citations.join(', ')}` : ''}` : '';
      
      // Create document examples for response (show top 3)
      const documentExamples = searchResults.slice(0, 3).map(doc => 
        `📄 **${doc.metadata?.documentName || 'Document'}** - ${doc.content.substring(0, 100)}...\n🔗 [View Document](/documents/${doc.documentId}) | [Download](/api/documents/${doc.documentId}/download)`
      ).join('\n\n');
      
      // Enhanced system prompt with document and web context
      const systemPrompt = `You are JACC, an AI assistant for merchant services sales agents.

**RESPONSE STYLE: Keep responses SHORT and CONCISE (2-3 paragraphs maximum)**

**DOCUMENT-FIRST APPROACH:**
When relevant documents are found in our internal storage:
1. **Give a brief answer** (1-2 sentences)
2. **Show document previews with clickable links** using this exact format:
${documentExamples ? `\n${documentExamples}\n` : ''}

**DOCUMENT PREVIEW FORMAT:**
📄 **[Document Name]** - [Brief excerpt...]
🔗 [View Document](/documents/[document-id]) | [Download](/api/documents/[document-id]/download)

**RULES:**
- ALWAYS prioritize internal documents over general knowledge
- Keep explanations brief - let users click through to full documents
- Include working document links when documents are found
- Only give detailed explanations when NO internal documents exist

User context: ${context?.userRole || 'Merchant Services Sales Agent'}

DOCUMENT CONTEXT:
${documentContext}

ACTION ITEMS AND TASK EXTRACTION:
- **AUTOMATICALLY IDENTIFY**: Extract action items, follow-up tasks, and deadlines from transcriptions and conversations
- **CATEGORIZE TASKS**: Organize by type (Client Communication, Documentation, Internal Process, Scheduling)
- **PRIORITY ASSESSMENT**: Assign priority levels (high, medium, low) based on urgency indicators
- **FOLLOW-UP TRACKING**: Identify callback requirements, meeting schedules, and document preparation needs
- **TASK FORMATTING**: Present action items with clear assignees, due dates, and next steps

When appropriate, suggest actions like saving payment processing information to folders, downloading rate comparisons, creating merchant proposals, and tracking action items from conversations.`;

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
      
      // Extract action items and follow-up tasks
      const actionItems = this.extractActionItems(content);
      const followupTasks = this.extractFollowupTasks(content);
      
      // Parse response for potential actions
      const actions = this.extractActions(content);
      
      // Format document sources
      const sources = this.formatSources(searchResults);

      // Generate reasoning explanation
      const reasoning = searchResults.length > 0 
        ? `Found ${searchResults.length} relevant documents in your knowledge base`
        : "No relevant documents found in internal database";

      return {
        message: content,
        actions: actions.length > 0 ? actions : undefined,
        sources: sources.length > 0 ? sources : undefined,
        reasoning,
        actionItems: actionItems.length > 0 ? actionItems : undefined,
        followupTasks: followupTasks.length > 0 ? followupTasks : undefined,
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
    type: 'save_to_folder' | 'download' | 'create_proposal' | 'find_documents' | 'action_items' | 'schedule_followup';
    label: string;
    data?: any;
  }> {
    const actions = [];

    // Extract action items from content
    const actionItems = this.extractActionItems(content);
    if (actionItems.length > 0) {
      actions.push({
        type: 'action_items' as const,
        label: `${actionItems.length} Action Items Identified`,
        data: { actionItems }
      });
    }

    // Extract follow-up tasks
    const followupTasks = this.extractFollowupTasks(content);
    if (followupTasks.length > 0) {
      actions.push({
        type: 'schedule_followup' as const,
        label: 'Schedule Follow-up Tasks',
        data: { tasks: followupTasks }
      });
    }

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

  private extractActionItems(content: string): Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: string;
    category: string;
  }> {
    const actionItems = [];
    const actionPatterns = [
      /(?:need to|must|should|will|action item:?|task:?|todo:?)\s+([^.!?]+)/gi,
      /(?:follow up|follow-up|callback|contact)\s+([^.!?]+)/gi,
      /(?:send|email|call|schedule|prepare|create|update|review)\s+([^.!?]+)/gi,
      /(?:by|before|due)\s+([^.!?]+)/gi
    ];

    const priorityKeywords = {
      high: ['urgent', 'asap', 'immediately', 'critical', 'priority'],
      medium: ['soon', 'important', 'this week'],
      low: ['eventually', 'when possible', 'low priority']
    };

    const categoryKeywords = {
      'Client Communication': ['call', 'email', 'contact', 'follow up', 'callback'],
      'Documentation': ['send', 'prepare', 'create document', 'proposal'],
      'Internal Process': ['review', 'update', 'check', 'verify'],
      'Scheduling': ['schedule', 'meeting', 'appointment', 'calendar']
    };

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const task = match[1].trim();
        if (task.length > 10) { // Filter out very short matches
          
          // Determine priority
          let priority: 'high' | 'medium' | 'low' = 'medium';
          for (const [level, keywords] of Object.entries(priorityKeywords)) {
            if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
              priority = level as 'high' | 'medium' | 'low';
              break;
            }
          }

          // Determine category
          let category = 'General';
          for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => task.toLowerCase().includes(keyword))) {
              category = cat;
              break;
            }
          }

          // Extract assignee if mentioned
          const assigneeMatch = content.match(/(?:assign|delegate|give to|for)\s+(\w+)/i);
          const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

          // Extract due date if mentioned
          const dateMatch = content.match(/(?:by|before|due)\s+([\w\s,]+?)(?:\.|$)/i);
          const dueDate = dateMatch ? dateMatch[1].trim() : undefined;

          actionItems.push({
            task,
            priority,
            assignee,
            dueDate,
            category
          });
        }
      }
    }

    return actionItems.slice(0, 5); // Limit to top 5 action items
  }

  private extractFollowupTasks(content: string): Array<{
    task: string;
    timeframe: string;
    type: 'call' | 'email' | 'meeting' | 'document' | 'other';
  }> {
    const followupTasks = [];
    const followupPatterns = [
      /(?:follow up|callback|call back)\s+([^.!?]+)/gi,
      /(?:schedule|set up|arrange)\s+([^.!?]+)/gi,
      /(?:next steps?:?|action:?)\s+([^.!?]+)/gi
    ];

    const timeframePatterns = [
      /(?:in|within)\s+(\d+\s+(?:days?|weeks?|months?))/gi,
      /(?:next|this)\s+(week|month|quarter)/gi,
      /(tomorrow|today|asap|soon)/gi
    ];

    for (const pattern of followupPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const task = match[1].trim();
        if (task.length > 5) {
          
          // Determine task type
          let type: 'call' | 'email' | 'meeting' | 'document' | 'other' = 'other';
          if (/call|phone|telephone/i.test(task)) type = 'call';
          else if (/email|send|message/i.test(task)) type = 'email';
          else if (/meeting|meet|appointment/i.test(task)) type = 'meeting';
          else if (/document|proposal|send|prepare/i.test(task)) type = 'document';

          // Extract timeframe
          let timeframe = 'Not specified';
          for (const timePattern of timeframePatterns) {
            const timeMatch = timePattern.exec(content);
            if (timeMatch) {
              timeframe = timeMatch[1] || timeMatch[0];
              break;
            }
          }

          followupTasks.push({
            task,
            timeframe,
            type
          });
        }
      }
    }

    return followupTasks.slice(0, 3); // Limit to top 3 follow-up tasks
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
      const documents = await storage.getUserDocuments('simple-user-001');
      
      let matchingDocs: any[] = [];
      
      // Enhanced document search with multiple strategies
      for (const searchTerm of searchTerms) {
        console.log(`🔍 Searching for: "${searchTerm}"`);
        
        // Strategy 1: Search document content chunks
        const { documentChunks } = await import('../shared/schema');
        const { db } = await import('./db');
        const { like, or, ilike } = await import('drizzle-orm');
        
        try {
          const contentMatches = await db
            .select()
            .from(documentChunks)
            .where(
              or(
                ilike(documentChunks.content, `%${searchTerm}%`),
                ilike(documentChunks.content, `%clearent%`),
                ilike(documentChunks.content, `%tsys%`),
                ilike(documentChunks.content, `%processing%`),
                ilike(documentChunks.content, `%rates%`),
                ilike(documentChunks.content, `%pricing%`),
                ilike(documentChunks.content, `%equipment%`),
                ilike(documentChunks.content, `%genesis%`),
                ilike(documentChunks.content, `%merchant%`)
              )
            )
            .limit(20);

          if (contentMatches.length > 0) {
            console.log(`📄 Found ${contentMatches.length} content matches for "${searchTerm}"`);
            
            const chunkResults = contentMatches.map(chunk => ({
              id: chunk.id,
              score: 0.9,
              documentId: chunk.documentId,
              content: chunk.content.substring(0, 500) + (chunk.content.length > 500 ? '...' : ''),
              metadata: {
                documentName: chunk.metadata?.documentName || 'Document',
                chunkIndex: chunk.chunkIndex,
                mimeType: chunk.metadata?.mimeType || 'application/pdf'
              }
            }));
            
            return chunkResults;
          }
        } catch (error) {
          console.log(`Error searching chunks: ${error}`);
        }
        
        // Strategy 2: Enhanced document name and metadata matching
        const termMatches = documents.filter(doc => {
          const searchText = `${doc.name} ${doc.originalName} ${doc.description || ''}`.toLowerCase();
          const termLower = searchTerm.toLowerCase();
          
          // Comprehensive keyword matching
          const processorMatches = [
            searchText.includes('clearent') && (termLower.includes('clearent') || termLower.includes('pricing')),
            searchText.includes('tsys') && (termLower.includes('tsys') || termLower.includes('support')),
            searchText.includes('voyager') && termLower.includes('voyager'),
            searchText.includes('shift') && (termLower.includes('shift') || termLower.includes('shift4')),
            searchText.includes('genesis') && (termLower.includes('genesis') || termLower.includes('merchant')),
            searchText.includes('first') && termLower.includes('first'),
            searchText.includes('global') && termLower.includes('global')
          ];
          
          const serviceMatches = [
            searchText.includes('pricing') && (termLower.includes('pricing') || termLower.includes('rates')),
            searchText.includes('equipment') && (termLower.includes('equipment') || termLower.includes('terminal')),
            searchText.includes('support') && termLower.includes('support'),
            searchText.includes('merchant') && termLower.includes('merchant'),
            searchText.includes('statement') && termLower.includes('statement'),
            searchText.includes('processing') && termLower.includes('processing')
          ];
          
          const directMatches = [
            searchText.includes(termLower),
            termLower.split(' ').some(word => word.length > 2 && searchText.includes(word))
          ];
          
          return [...processorMatches, ...serviceMatches, ...directMatches].some(match => match);
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