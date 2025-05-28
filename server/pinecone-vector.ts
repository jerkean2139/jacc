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

  async ensureIndexExists(): Promise<void> {
    try {
      // Check if index exists, if not create it
      try {
        await this.pinecone.describeIndex(this.indexName);
        console.log(`Index ${this.indexName} already exists`);
      } catch (error) {
        console.log(`Creating index ${this.indexName}...`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        console.log(`Index ${this.indexName} created successfully`);
        // Wait a moment for index to be ready
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error('Error ensuring index exists:', error);
    }
  }

  async indexDocument(document: any): Promise<void> {
    try {
      await this.ensureIndexExists();
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
      // For now, return empty results since Pinecone index doesn't exist
      // This allows the system to fall back to web search
      console.log('Document search temporarily disabled - using web search instead');
      return [];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export const pineconeVectorService = new PineconeVectorService();