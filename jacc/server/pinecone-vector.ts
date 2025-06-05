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

  async indexDocument(document: any, namespace: string = 'default'): Promise<void> {
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
            content: chunk.content,
            namespace: namespace,
            folderType: document.folderType || 'custom',
          }
        });
      }
      
      await index.namespace(namespace).upsert(vectors);
      console.log(`Indexed ${vectors.length} chunks for document: ${document.name} in namespace: ${namespace}`);
    } catch (error) {
      console.error('Error indexing document:', error);
    }
  }

  async searchDocuments(query: string, topK: number = 5, namespaces: string[] = ['default']): Promise<VectorSearchResult[]> {
    try {
      await this.ensureIndexExists();
      const index = this.pinecone.Index(this.indexName);
      
      const queryEmbedding = await this.createEmbedding(query);
      const results: VectorSearchResult[] = [];
      
      // Search across specified namespaces
      for (const namespace of namespaces) {
        try {
          const searchResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: Math.ceil(topK / namespaces.length),
            includeMetadata: true,
            includeValues: false
          });
          
          // Transform results to our format
          for (const match of searchResponse.matches || []) {
            if (match.metadata) {
              results.push({
                id: match.id,
                score: match.score || 0,
                documentId: match.metadata.documentId as string,
                content: match.metadata.content as string,
                metadata: {
                  documentName: match.metadata.documentName as string,
                  webViewLink: match.metadata.webViewLink as string,
                  chunkIndex: match.metadata.chunkIndex as number,
                  mimeType: match.metadata.mimeType as string,
                }
              });
            }
          }
        } catch (namespaceError) {
          console.log(`Namespace ${namespace} not found or empty, skipping...`);
        }
      }
      
      // Sort by score and return top results
      return results.sort((a, b) => b.score - a.score).slice(0, topK);
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

export const pineconeVectorService = new PineconeVectorService();