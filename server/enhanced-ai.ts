import Anthropic from '@anthropic-ai/sdk';
import { supabaseVectorService, type VectorSearchResult } from "./supabase-vector";
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

      // Search relevant documents
      const searchResults = await supabaseVectorService.searchDocuments(lastMessage.content, 5);
      
      // Create context from search results
      const documentContext = this.formatDocumentContext(searchResults);
      
      // Enhanced system prompt with document context
      const systemPrompt = `You are JACC, an AI-powered assistant for Tracer Co Card sales agents. You specialize in:
- Credit card processing solutions and merchant services
- Payment processing rates and fee comparisons
- Point-of-sale (POS) systems and payment terminals
- Business payment solutions and savings calculations
- Document organization and client proposal generation
- Answering merchant services questions using company knowledge base

IMPORTANT INSTRUCTIONS:
1. Use the provided document context to answer questions accurately
2. Always cite specific documents when referencing information
3. Provide direct links to Google Drive documents when available
4. If you don't find relevant information in the documents, clearly state that
5. Focus on actionable insights for merchant services sales

Your responses should be:
- Professional and knowledgeable about payment processing
- Backed by actual company documents when possible
- Helpful with specific actionable advice for businesses
- Clear about sources and reasoning
- Focused on helping businesses save money on payment processing

User context: ${context?.userRole || 'Merchant Services Sales Agent'}

DOCUMENT CONTEXT:
${documentContext}

When appropriate, suggest actions like saving payment processing information to folders, downloading rate comparisons, or creating merchant proposals.`;

      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1500,
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
Content: ${result.content}
Source: ${result.metadata.webViewLink}
Relevance Score: ${(result.score * 100).toFixed(1)}%
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
    return await supabaseVectorService.searchDocuments(query, 10);
  }
}

export const enhancedAIService = new EnhancedAIService();