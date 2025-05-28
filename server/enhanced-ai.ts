import Anthropic from '@anthropic-ai/sdk';
import { pineconeVectorService, type VectorSearchResult } from "./pinecone-vector";
import { perplexitySearchService } from "./perplexity-search";
import { db } from "./db";
import { webSearchLogs } from "@shared/schema";
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
      
      // Try document search first
      try {
        searchResults = await pineconeVectorService.searchDocuments(lastMessage.content, 5);
        console.log(`Found ${searchResults.length} document matches`);
      } catch (error) {
        console.log("Document search failed, proceeding without document context");
        searchResults = [];
      }
      
      // Only use web search if no relevant documents found
      let webSearchReason = null;
      if (searchResults.length === 0) {
        webSearchReason = "No internal documents found matching the query";
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

CRITICAL SEARCH PRIORITY:
1. **ALWAYS search internal documents FIRST** before using any web information
2. **PROVIDE DIRECT LINKS** to internal documents when they contain relevant information
3. Only use web search results if NO internal documents match the query
4. When internal documents are found, format responses as: "Based on [Document Name](internal_link), here's what I found..."

DOCUMENT RESPONSE FORMAT:
- **ALWAYS include**: "📄 **Source:** [Document Name](direct_internal_link)" at the end
- **PRIORITIZE**: Company-specific information from uploaded documents
- **INCLUDE**: Direct clickable links to Google Drive or internal document storage
- **HIGHLIGHT**: Specific sections, page numbers, or relevant details from documents

WEB SEARCH USAGE:
- Only use when NO internal documents contain relevant information
- Clearly state: "Since this information wasn't found in our internal documents, I searched current web sources..."
- Mention web sources are external and may need verification

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
    return await pineconeVectorService.searchDocuments(query, 10);
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