import { db } from './db';
import { documentChunks } from '@shared/schema';
import { like, or, ilike, and } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnhancedSearchResult {
  id: string;
  score: number;
  documentId: string;
  content: string;
  highlightedContent: string;
  metadata: {
    documentName: string;
    relevanceScore: number;
    semanticMatch: boolean;
    keywordMatches: string[];
    contextualInfo: string;
    chunkIndex: number;
    mimeType: string;
  };
}

export class AdvancedSearchService {
  
  // Enhanced query expansion with semantic understanding
  private async expandSearchQuery(query: string): Promise<string[]> {
    const synonymMapping = {
      'pricing': ['rates', 'fees', 'costs', 'charges', 'price', 'payment'],
      'clearent': ['clearent', 'clereant', 'clearant', 'clerent'],
      'tsys': ['tsys', 't-sys', 'total system services', 'global payments'],
      'equipment': ['hardware', 'terminal', 'device', 'pos', 'reader'],
      'restaurant': ['dining', 'food service', 'hospitality', 'eatery'],
      'retail': ['merchant', 'store', 'shop', 'business'],
      'support': ['help', 'assistance', 'service', 'contact', 'phone'],
      'integration': ['connect', 'api', 'sync', 'interface', 'link']
    };

    const expandedTerms = [query.toLowerCase()];
    
    // Add direct synonyms
    for (const [key, synonyms] of Object.entries(synonymMapping)) {
      if (query.toLowerCase().includes(key)) {
        expandedTerms.push(...synonyms);
      }
    }

    // Add fuzzy matches for common typos
    const commonTypos = {
      'clereant': 'clearent',
      'clearant': 'clearent',
      'clerent': 'clearent',
      'prcing': 'pricing',
      'equipement': 'equipment'
    };

    for (const [typo, correct] of Object.entries(commonTypos)) {
      if (query.toLowerCase().includes(typo)) {
        expandedTerms.push(correct);
      }
    }

    return [...new Set(expandedTerms)];
  }

  // Generate semantic embedding for query
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.log('Embedding generation failed, using keyword search fallback');
      return [];
    }
  }

  // Advanced search with multiple strategies
  async performAdvancedSearch(query: string, userId: string): Promise<EnhancedSearchResult[]> {
    console.log(`🔍 Advanced search for: "${query}"`);
    
    const expandedTerms = await this.expandSearchQuery(query);
    console.log(`📝 Expanded search terms: ${expandedTerms.join(', ')}`);

    let results: any[] = [];

    // Strategy 1: Exact phrase matching (highest priority)
    try {
      const exactMatches = await db
        .select()
        .from(documentChunks)
        .where(ilike(documentChunks.content, `%${query}%`))
        .limit(10);

      if (exactMatches.length > 0) {
        console.log(`✅ Found ${exactMatches.length} exact matches`);
        results.push(...exactMatches.map(chunk => ({
          ...chunk,
          score: 0.95,
          matchType: 'exact'
        })));
      }
    } catch (error) {
      console.log('Exact matching failed:', error);
    }

    // Strategy 2: Expanded term matching
    if (results.length < 5) {
      try {
        const expandedConditions = expandedTerms.map(term => 
          ilike(documentChunks.content, `%${term}%`)
        );

        const expandedMatches = await db
          .select()
          .from(documentChunks)
          .where(or(...expandedConditions))
          .limit(15);

        console.log(`📚 Found ${expandedMatches.length} expanded term matches`);
        
        const newMatches = expandedMatches.filter(match => 
          !results.some(existing => existing.id === match.id)
        );

        results.push(...newMatches.map(chunk => ({
          ...chunk,
          score: 0.8,
          matchType: 'expanded'
        })));
      } catch (error) {
        console.log('Expanded term matching failed:', error);
      }
    }

    // Strategy 3: Partial word matching for complex queries
    if (results.length < 3) {
      const queryWords = query.toLowerCase().split(/\s+/);
      
      try {
        const partialConditions = queryWords
          .filter(word => word.length > 2)
          .map(word => ilike(documentChunks.content, `%${word}%`));

        const partialMatches = await db
          .select()
          .from(documentChunks)
          .where(or(...partialConditions))
          .limit(20);

        console.log(`🔤 Found ${partialMatches.length} partial word matches`);
        
        const newMatches = partialMatches.filter(match => 
          !results.some(existing => existing.id === match.id)
        );

        results.push(...newMatches.map(chunk => ({
          ...chunk,
          score: 0.6,
          matchType: 'partial'
        })));
      } catch (error) {
        console.log('Partial matching failed:', error);
      }
    }

    // Sort by relevance score and convert to enhanced results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return this.convertToEnhancedResults(sortedResults, query, expandedTerms);
  }

  private convertToEnhancedResults(
    results: any[], 
    originalQuery: string, 
    expandedTerms: string[]
  ): EnhancedSearchResult[] {
    return results.map(result => {
      const keywordMatches = this.findKeywordMatches(result.content, expandedTerms);
      const highlightedContent = this.highlightSearchTerms(result.content, keywordMatches);
      
      return {
        id: result.id,
        score: result.score,
        documentId: result.documentId,
        content: result.content,
        highlightedContent,
        metadata: {
          documentName: result.metadata?.documentName || 'Document',
          relevanceScore: result.score,
          semanticMatch: result.matchType === 'expanded',
          keywordMatches,
          contextualInfo: this.generateContextualInfo(result.content, originalQuery),
          chunkIndex: result.chunkIndex || 0,
          mimeType: result.metadata?.mimeType || 'application/pdf'
        }
      };
    });
  }

  private findKeywordMatches(content: string, searchTerms: string[]): string[] {
    const contentLower = content.toLowerCase();
    return searchTerms.filter(term => 
      contentLower.includes(term.toLowerCase())
    );
  }

  private highlightSearchTerms(content: string, keywordMatches: string[]): string {
    let highlighted = content;
    
    keywordMatches.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  }

  private generateContextualInfo(content: string, query: string): string {
    // Extract a relevant snippet around the first match
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const matchIndex = contentLower.indexOf(queryLower);
    
    if (matchIndex === -1) {
      return content.substring(0, 150) + '...';
    }
    
    const start = Math.max(0, matchIndex - 75);
    const end = Math.min(content.length, matchIndex + query.length + 75);
    
    return content.substring(start, end) + '...';
  }

  // Auto-suggest functionality
  async generateSearchSuggestions(query: string): Promise<string[]> {
    const suggestions = [];
    
    // Common search patterns
    const patterns = [
      `${query} pricing`,
      `${query} support`,
      `${query} equipment`,
      `${query} integration`,
      `${query} contact`
    ];
    
    // Add processor-specific suggestions
    if (query.toLowerCase().includes('clear')) {
      suggestions.push('Clearent pricing', 'Clearent support', 'Clearent equipment');
    }
    
    if (query.toLowerCase().includes('tsys')) {
      suggestions.push('TSYS rates', 'TSYS contact', 'TSYS integration');
    }
    
    return [...suggestions, ...patterns].slice(0, 5);
  }
}

export const advancedSearchService = new AdvancedSearchService();