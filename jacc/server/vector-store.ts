import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
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

export class VectorStoreService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string;

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.indexName = process.env.PINECONE_INDEX_NAME || 'jacc-documents';
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw new Error('Failed to create text embedding');
    }
  }

  async indexDocument(document: ProcessedDocument): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      const vectors = [];

      for (const chunk of document.chunks) {
        const embedding = await this.createEmbedding(chunk.content);
        
        vectors.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            documentId: document.id,
            documentName: document.name,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            webViewLink: document.metadata.webViewLink,
            mimeType: document.metadata.mimeType,
            modifiedTime: document.metadata.modifiedTime,
          }
        });
      }

      // Batch upsert vectors
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }

      console.log(`Indexed ${vectors.length} chunks for document: ${document.name}`);
    } catch (error) {
      console.error(`Error indexing document ${document.name}:`, error);
      throw error;
    }
  }

  async searchDocuments(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    try {
      const queryEmbedding = await this.createEmbedding(query);
      const index = this.pinecone.index(this.indexName);
      
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      return searchResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        documentId: match.metadata?.documentId as string,
        content: match.metadata?.content as string,
        metadata: {
          documentName: match.metadata?.documentName as string,
          webViewLink: match.metadata?.webViewLink as string,
          chunkIndex: match.metadata?.chunkIndex as number,
          mimeType: match.metadata?.mimeType as string,
        }
      })) || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  async deleteDocumentVectors(documentId: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      // Query for all vectors with this document ID
      const listResponse = await index.listPaginated({
        prefix: documentId
      });

      if (listResponse.vectors && listResponse.vectors.length > 0) {
        const vectorIds = listResponse.vectors.map(v => v.id);
        await index.deleteMany(vectorIds);
        console.log(`Deleted ${vectorIds.length} vectors for document: ${documentId}`);
      }
    } catch (error) {
      console.error(`Error deleting vectors for document ${documentId}:`, error);
      throw error;
    }
  }

  async ensureIndexExists(): Promise<void> {
    try {
      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-ada-002 dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        console.log(`Created Pinecone index: ${this.indexName}`);
        
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (error) {
      console.error('Error ensuring index exists:', error);
      throw error;
    }
  }
}

export const vectorStoreService = new VectorStoreService();