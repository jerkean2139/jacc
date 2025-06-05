import OpenAI from 'openai';
import { db } from './db';
import { documents, documentChunks } from '@shared/schema';
import { eq, sql, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EnhancedSearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  metadata: {
    documentName: string;
    relevanceScore: number;
    semanticMatch: boolean;
    extractedInsights: string[];
    suggestedQuestions: string[];
  };
}

export class AIEnhancedSearchService {
  
  async intelligentDocumentSearch(query: string): Promise<EnhancedSearchResult[]> {
    console.log(`🧠 AI Enhanced Search for: "${query}"`);
    
    // Step 1: Generate semantic embeddings for the query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Step 2: Expand query with AI-generated synonyms and related terms
    const expandedQueries = await this.expandQuery(query);
    
    // Step 3: Search document chunks with vector similarity
    const vectorResults = await this.vectorSimilaritySearch(queryEmbedding);
    
    // Step 4: Apply AI-powered relevance scoring
    const scoredResults = await this.scoreResultsWithAI(query, vectorResults);
    
    // Step 5: Extract key insights and generate follow-up questions
    const enhancedResults = await this.enhanceResultsWithInsights(scoredResults);
    
    return enhancedResults.slice(0, 10); // Return top 10 results
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // Latest and most efficient embedding model
        input: text,
        encoding_format: "float",
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }
  
  private async expandQuery(originalQuery: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert in payment processing and merchant services. Generate 5 related search terms and synonyms for the given query. Focus on industry-specific terminology.
            
            Return only a JSON array of strings, no other text.`
          },
          {
            role: "user",
            content: `Original query: "${originalQuery}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 200
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{"terms": []}');
      return result.terms || [originalQuery];
    } catch (error) {
      console.error('Error expanding query:', error);
      return [originalQuery];
    }
  }
  
  private async vectorSimilaritySearch(embedding: number[]): Promise<any[]> {
    if (embedding.length === 0) return [];
    
    try {
      // Use PostgreSQL's vector similarity search (requires pgvector extension)
      const results = await db.execute(sql`
        SELECT 
          dc.*,
          d.name as document_name,
          d.original_name,
          (dc.embedding <-> ${JSON.stringify(embedding)}::vector) as distance
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.embedding IS NOT NULL
        ORDER BY dc.embedding <-> ${JSON.stringify(embedding)}::vector
        LIMIT 20
      `);
      
      return results.rows || [];
    } catch (error) {
      console.log('Vector search not available, falling back to text search');
      return [];
    }
  }
  
  private async scoreResultsWithAI(query: string, results: any[]): Promise<any[]> {
    if (results.length === 0) return [];
    
    try {
      const scoringPrompt = `
        Rate the relevance of each document chunk for the query: "${query}"
        
        Chunks:
        ${results.map((r, i) => `${i}: ${r.content?.substring(0, 200)}...`).join('\n')}
        
        Return a JSON object with chunk indices as keys and relevance scores (0-100) as values.
      `;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "You are an expert at evaluating document relevance for payment processing queries. Rate each chunk's relevance from 0-100."
          },
          { role: "user", content: scoringPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 500
      });
      
      const scores = JSON.parse(response.choices[0].message.content || '{}');
      
      return results.map((result, index) => ({
        ...result,
        aiScore: scores[index.toString()] || 50
      }));
    } catch (error) {
      console.error('Error scoring results:', error);
      return results.map(r => ({ ...r, aiScore: 50 }));
    }
  }
  
  private async enhanceResultsWithInsights(results: any[]): Promise<EnhancedSearchResult[]> {
    const enhanced: EnhancedSearchResult[] = [];
    
    for (const result of results.slice(0, 5)) { // Enhance top 5 results
      try {
        const insightResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Extract 3 key insights and suggest 3 follow-up questions from this payment processing document. Return JSON with 'insights' and 'questions' arrays."
            },
            {
              role: "user", 
              content: `Document content: ${result.content?.substring(0, 1000)}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 300
        });
        
        const insights = JSON.parse(insightResponse.choices[0].message.content || '{"insights": [], "questions": []}');
        
        enhanced.push({
          id: result.id || `result-${enhanced.length}`,
          score: result.aiScore || 50,
          documentId: result.document_id || result.documentId,
          content: result.content || '',
          metadata: {
            documentName: result.document_name || result.documentName || 'Unknown',
            relevanceScore: result.aiScore || 50,
            semanticMatch: result.distance < 0.3,
            extractedInsights: insights.insights || [],
            suggestedQuestions: insights.questions || []
          }
        });
      } catch (error) {
        console.error('Error enhancing result:', error);
        enhanced.push({
          id: result.id || `result-${enhanced.length}`,
          score: result.aiScore || 50,
          documentId: result.document_id || result.documentId,
          content: result.content || '',
          metadata: {
            documentName: result.document_name || result.documentName || 'Unknown',
            relevanceScore: result.aiScore || 50,
            semanticMatch: false,
            extractedInsights: [],
            suggestedQuestions: []
          }
        });
      }
    }
    
    return enhanced.sort((a, b) => b.score - a.score);
  }
  
  async generateSmartSummary(searchResults: EnhancedSearchResult[], originalQuery: string): Promise<string> {
    try {
      const context = searchResults.map(r => r.content).join('\n\n');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a payment processing expert. Create a comprehensive summary answering the user's question based on the provided documents. Be specific about rates, fees, and contact information when available."
          },
          {
            role: "user",
            content: `Question: ${originalQuery}\n\nRelevant documents:\n${context}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });
      
      return response.choices[0].message.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary generation unavailable.';
    }
  }
}

export const aiEnhancedSearchService = new AIEnhancedSearchService();