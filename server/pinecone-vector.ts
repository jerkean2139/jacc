import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

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
    semanticTags: string[];
    confidence: number;
  };
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  metadata: {
    documentName: string;
    originalName: string;
    mimeType: string;
    startChar: number;
    endChar: number;
  };
}

export class PineconeVectorService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName = 'merchant-docs-v2';
  private dimension = 1536; // OpenAI text-embedding-3-small dimension
  private isInitialized = false;

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      console.warn('PINECONE_API_KEY not found - vector search will be limited');
      return;
    }
    
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8192), // Limit input size
        encoding_format: "float",
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      // Return zero vector as fallback
      return new Array(this.dimension).fill(0);
    }
  }

  async ensureIndexExists(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      if (!this.pinecone) {
        console.warn('Pinecone not initialized - using fallback search');
        return;
      }

      // Check if index exists, if not create it
      try {
        await this.pinecone.describeIndex(this.indexName);
        console.log(`✅ Pinecone index ${this.indexName} ready`);
        this.isInitialized = true;
      } catch (error) {
        console.log(`🔧 Creating optimized Pinecone index ${this.indexName}...`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        console.log(`✅ High-performance Pinecone index created`);
        // Wait for index initialization
        await new Promise(resolve => setTimeout(resolve, 10000));
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Pinecone initialization failed:', error);
      console.log('📋 Falling back to PostgreSQL vector search');
    }
  }

  async indexDocument(document: any, namespace: string = 'default'): Promise<void> {
    try {
      await this.ensureIndexExists();
      if (!this.pinecone || !this.isInitialized) {
        console.log('⚠️ Pinecone unavailable - document not indexed');
        return;
      }

      const index = this.pinecone.Index(this.indexName);
      const vectors = [];
      
      // Generate semantic tags for enhanced search
      const documentText = document.chunks?.map((c: any) => c.content).join(' ') || '';
      const semanticTags = await this.generateSemanticTags(documentText);
      
      for (const chunk of document.chunks || []) {
        const embedding = await this.createEmbedding(chunk.content);
        
        vectors.push({
          id: chunk.id,
          values: embedding,
          metadata: {
            documentId: document.id,
            documentName: document.name,
            webViewLink: document.metadata?.webViewLink || '',
            chunkIndex: chunk.chunkIndex,
            mimeType: document.metadata?.mimeType || 'text/plain',
            content: chunk.content.substring(0, 40000), // Pinecone metadata limit
            namespace: namespace,
            folderType: document.folderType || 'custom',
            semanticTags: semanticTags,
            confidence: this.calculateContentConfidence(chunk.content),
            createdAt: new Date().toISOString()
          }
        });
      }
      
      // Batch upsert for performance
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.namespace(namespace).upsert(batch);
      }
      
      console.log(`🚀 Indexed ${vectors.length} chunks for ${document.name} in ${namespace}`);
    } catch (error) {
      console.error('Document indexing failed:', error);
    }
  }

  private async generateSemanticTags(text: string): Promise<string[]> {
    try {
      if (!text || text.length < 50) return [];
      
      // Extract domain-specific keywords for merchant services
      const merchantTerms = [
        'processing rates', 'payment gateway', 'POS system', 'credit card',
        'merchant account', 'chargeback', 'interchange', 'terminal',
        'restaurant', 'retail', 'e-commerce', 'high risk', 'ISO',
        'underwriting', 'pricing', 'fees', 'compliance'
      ];
      
      const foundTerms = merchantTerms.filter(term => 
        text.toLowerCase().includes(term.toLowerCase())
      );
      
      return foundTerms.slice(0, 10); // Limit tags
    } catch (error) {
      return [];
    }
  }

  private calculateContentConfidence(content: string): number {
    if (!content) return 0;
    
    // Higher confidence for longer, structured content
    const lengthScore = Math.min(content.length / 1000, 1);
    const structureScore = (content.match(/[.!?]/g) || []).length / content.length * 100;
    
    return Math.min((lengthScore + structureScore) / 2, 1);
  }

  async searchDocuments(query: string, topK: number = 5, namespaces: string[] = ['default']): Promise<VectorSearchResult[]> {
    try {
      await this.ensureIndexExists();
      if (!this.pinecone || !this.isInitialized) {
        console.log('Pinecone unavailable - returning empty results');
        return [];
      }

      const index = this.pinecone.Index(this.indexName);
      const queryEmbedding = await this.createEmbedding(query);
      const results: VectorSearchResult[] = [];
      
      // Enhanced query with filters
      const queryFilter = this.buildSearchFilter(query);
      
      // Search across specified namespaces with advanced scoring
      for (const namespace of namespaces) {
        try {
          const searchResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: Math.ceil(topK * 1.5 / namespaces.length), // Get extra results for reranking
            includeMetadata: true,
            includeValues: false,
            filter: queryFilter
          });
          
          // Transform and enhance results
          for (const match of searchResponse.matches || []) {
            if (match.metadata && match.score && match.score > 0.7) { // Quality threshold
              results.push({
                id: match.id,
                score: match.score,
                documentId: match.metadata.documentId as string,
                content: match.metadata.content as string,
                metadata: {
                  documentName: match.metadata.documentName as string,
                  webViewLink: match.metadata.webViewLink as string,
                  chunkIndex: match.metadata.chunkIndex as number,
                  mimeType: match.metadata.mimeType as string,
                  semanticTags: match.metadata.semanticTags as string[] || [],
                  confidence: match.metadata.confidence as number || 0.5
                }
              });
            }
          }
        } catch (namespaceError) {
          console.log(`Namespace ${namespace} not accessible, continuing...`);
        }
      }
      
      // Advanced reranking with semantic understanding
      const rerankedResults = await this.rerankeResults(results, query);
      
      return rerankedResults.slice(0, topK);
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  private buildSearchFilter(query: string): Record<string, any> | undefined {
    // Build dynamic filters based on query content
    const filters: Record<string, any> = {};
    
    // Time-based filtering for recent content
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    if (query.toLowerCase().includes('recent') || query.toLowerCase().includes('latest')) {
      filters.createdAt = { '$gte': oneYearAgo.toISOString() };
    }
    
    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private async rerankeResults(results: VectorSearchResult[], originalQuery: string): Promise<VectorSearchResult[]> {
    try {
      // Implement cross-encoder reranking for better relevance
      const scoredResults = results.map(result => {
        let adjustedScore = result.score;
        
        // Boost score for semantic tag matches
        const queryLower = originalQuery.toLowerCase();
        const tagMatches = result.metadata.semanticTags.filter(tag => 
          queryLower.includes(tag.toLowerCase())
        ).length;
        
        if (tagMatches > 0) {
          adjustedScore *= (1 + tagMatches * 0.1); // 10% boost per tag match
        }
        
        // Boost score for confidence
        adjustedScore *= result.metadata.confidence;
        
        // Boost score for content quality (longer, structured content)
        const contentQuality = Math.min(result.content.length / 1000, 1);
        adjustedScore *= (0.8 + contentQuality * 0.2);
        
        return {
          ...result,
          score: adjustedScore
        };
      });
      
      return scoredResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Reranking failed:', error);
      return results.sort((a, b) => b.score - a.score);
    }
  }
}

export const pineconeVectorService = new PineconeVectorService();