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
      // Create documents table if it doesn't exist
      const { error } = await this.supabase.rpc('create_documents_table_if_not_exists');
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating table:', error);
      }
    } catch (error) {
      console.log('Table creation handled by Supabase schema');
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
    try {
      const queryEmbedding = await this.createEmbedding(query);
      
      const { data, error } = await this.supabase.rpc('search_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: topK
      });

      if (error) {
        throw error;
      }

      return data?.map((item: any) => ({
        id: item.id,
        score: item.similarity,
        documentId: item.document_id,
        content: item.content,
        metadata: {
          documentName: item.document_name,
          webViewLink: item.web_view_link,
          chunkIndex: item.chunk_index,
          mimeType: item.mime_type,
        }
      })) || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      // Fallback to text-based search if vector search fails
      return this.fallbackTextSearch(query, topK);
    }
  }

  private async fallbackTextSearch(query: string, topK: number): Promise<VectorSearchResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('document_chunks')
        .select('*')
        .textSearch('content', query)
        .limit(topK);

      if (error) {
        throw error;
      }

      return data?.map((item: any) => ({
        id: item.id,
        score: 0.8, // Default similarity score for text search
        documentId: item.document_id,
        content: item.content,
        metadata: {
          documentName: item.document_name,
          webViewLink: item.web_view_link,
          chunkIndex: item.chunk_index,
          mimeType: item.mime_type,
        }
      })) || [];
    } catch (error) {
      console.error('Error in fallback text search:', error);
      return [];
    }
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