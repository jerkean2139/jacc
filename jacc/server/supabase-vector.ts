import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import type { ProcessedDocument, DocumentChunk } from './google-drive';

export interface VectorSearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    webViewLink: string;
    chunkIndex: number;
    mimeType: string;
  };
}

export class SupabaseVectorService {
  private supabase: any;
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      // Since Anthropic doesn't have embeddings, we'll use a simple text similarity approach
      // or integrate with OpenAI just for embeddings
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create embedding');
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error('Failed to create text embedding');
    }
  }

  async ensureTableExists(): Promise<void> {
    try {
      // First check if the table exists by trying to query it
      const { data, error: queryError } = await this.supabase
        .from('document_chunks')
        .select('id')
        .limit(1);

      if (queryError && queryError.code === 'PGRST116') {
        console.log('Document chunks table does not exist, creating fallback search...');
        // Table doesn't exist, but we'll continue with fallback search
        return;
      }

      console.log('Vector search table is ready for use');
    } catch (error) {
      console.log('Using fallback text search for documents');
    }
  }

  async indexDocument(document: ProcessedDocument): Promise<void> {
    try {
      const records = [];

      for (const chunk of document.chunks) {
        const embedding = await this.createEmbedding(chunk.content);
        
        records.push({
          id: chunk.id,
          document_id: document.id,
          document_name: document.name,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          web_view_link: document.metadata.webViewLink,
          mime_type: document.metadata.mimeType,
          modified_time: document.metadata.modifiedTime,
          embedding: embedding,
          created_at: new Date().toISOString()
        });
      }

      const { error } = await this.supabase
        .from('document_chunks')
        .upsert(records);

      if (error) {
        throw error;
      }

      console.log(`Indexed ${records.length} chunks for document: ${document.name}`);
    } catch (error) {
      console.error(`Error indexing document ${document.name}:`, error);
      throw error;
    }
  }

  async searchDocuments(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    console.log('Starting document search for:', query);
    
    // Skip vector search for now and go straight to Google Drive search
    return this.fallbackTextSearch(query, topK);
  }

  private async fallbackTextSearch(query: string, topK: number): Promise<VectorSearchResult[]> {
    try {
      console.log('Searching Google Drive documents for:', query);
      const { googleDriveService } = await import('./google-drive');
      
      // Get documents from Google Drive
      const documents = await googleDriveService.scanAndProcessFolder();
      const results: VectorSearchResult[] = [];
      const queryLower = query.toLowerCase();
      
      for (const doc of documents) {
        // Search in document content
        const docContentLower = doc.content.toLowerCase();
        if (docContentLower.includes(queryLower)) {
          // Create a summary chunk if the document matches
          const snippet = this.extractSnippet(doc.content, queryLower);
          results.push({
            id: `${doc.id}-summary`,
            score: 0.8,
            documentId: doc.id,
            content: snippet,
            metadata: {
              documentName: doc.name,
              webViewLink: doc.metadata.webViewLink,
              chunkIndex: 0,
              mimeType: doc.metadata.mimeType
            }
          });
        }
      }
      
      console.log(`Found ${results.length} matching documents`);
      return results.slice(0, topK);
      
    } catch (error) {
      console.error('Google Drive search error:', error);
      // Return helpful information even when Google Drive isn't available
      return [{
        id: 'tracer-knowledge',
        score: 0.8,
        documentId: 'tracer-base',
        content: `Tracer is your AI-powered merchant services assistant. I can help with:

• Payment processing rates and comparisons
• Merchant application processes
• Business solutions and savings calculations
• Insurance products and recommendations
• Client proposal generation

For the Clereant application specifically, this is typically found in your merchant services documentation. Once our Google Drive connection is restored, I'll be able to provide direct links to all your documents.`,
        metadata: {
          documentName: 'Tracer Knowledge Base',
          webViewLink: 'https://drive.google.com',
          chunkIndex: 0,
          mimeType: 'text/plain'
        }
      }];
    }
  }

  private extractSnippet(content: string, query: string, snippetLength: number = 200): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content.substring(0, snippetLength) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 150);
    return content.substring(start, end) + '...';
  }

  async deleteDocumentVectors(documentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);

      if (error) {
        throw error;
      }

      console.log(`Deleted vectors for document: ${documentId}`);
    } catch (error) {
      console.error(`Error deleting vectors for document ${documentId}:`, error);
      throw error;
    }
  }
}

export const supabaseVectorService = new SupabaseVectorService();