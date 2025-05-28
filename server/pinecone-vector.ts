import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';

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

export class PineconeVectorService {
  private pinecone: Pinecone;
  private anthropic: Anthropic;
  private indexName = 'merchant-docs';

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    // Create a simple embedding using text similarity
    // This is a fallback since we don't have embedding API
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    for (let i = 0; i < words.length && i < 384; i++) {
      embedding[i] = words[i].charCodeAt(0) / 255;
    }
    
    return embedding;
  }

  async indexDocument(document: any): Promise<void> {
    try {
      const index = this.pinecone.Index(this.indexName);
      
      const vectors = [];
      for (const chunk of document.chunks) {
        const embedding = await this.createEmbedding(chunk.content);
        
        vectors.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            documentId: document.id,
            documentName: document.name,
            webViewLink: document.metadata.webViewLink,
            chunkIndex: chunk.chunkIndex,
            mimeType: document.metadata.mimeType,
            content: chunk.content
          }
        });
      }
      
      await index.upsert(vectors);
      console.log(`Indexed ${vectors.length} chunks for document: ${document.name}`);
    } catch (error) {
      console.error('Error indexing document:', error);
    }
  }

  async searchDocuments(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    try {
      const index = this.pinecone.Index(this.indexName);
      const queryEmbedding = await this.createEmbedding(query);
      
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      });
      
      return searchResults.matches?.map(match => ({
        id: match.id!,
        score: match.score!,
        documentId: match.metadata!.documentId as string,
        content: match.metadata!.content as string,
        metadata: {
          documentName: match.metadata!.documentName as string,
          webViewLink: match.metadata!.webViewLink as string,
          chunkIndex: match.metadata!.chunkIndex as number,
          mimeType: match.metadata!.mimeType as string,
        }
      })) || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export const pineconeVectorService = new PineconeVectorService();