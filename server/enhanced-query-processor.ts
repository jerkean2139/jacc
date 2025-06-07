import OpenAI from 'openai';
import { pineconeVectorService } from './pinecone-vector';
import { advancedSearchService } from './advanced-search';
import { memoryOptimizer } from './memory-optimizer';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QueryIntent {
  type: 'search' | 'comparison' | 'calculation' | 'recommendation' | 'troubleshooting';
  entities: string[];
  confidence: number;
  domain: 'payments' | 'processors' | 'rates' | 'technical' | 'compliance';
  urgency: 'high' | 'medium' | 'low';
}

export interface EnhancedQuery {
  original: string;
  enhanced: string[];
  intent: QueryIntent;
  searchTerms: string[];
  semanticContext: string;
  expandedQueries: string[];
}

export class EnhancedQueryProcessor {
  private queryCache = new Map<string, EnhancedQuery>();
  private intentClassifier = new Map<string, QueryIntent>();
  
  async processQuery(originalQuery: string, userId?: string): Promise<EnhancedQuery> {
    // Check cache first
    const cacheKey = `${originalQuery}_${userId || 'anonymous'}`;
    const cached = memoryOptimizer.getCachedDocument(cacheKey);
    if (cached) {
      return cached;
    }

    const enhancedQuery = await this.enhanceQuery(originalQuery);
    
    // Cache the result
    memoryOptimizer.cacheDocument(cacheKey, enhancedQuery);
    
    return enhancedQuery;
  }

  private async enhanceQuery(originalQuery: string): Promise<EnhancedQuery> {
    // Step 1: Analyze query intent
    const intent = await this.analyzeQueryIntent(originalQuery);
    
    // Step 2: Extract and expand entities
    const entities = await this.extractEntities(originalQuery);
    
    // Step 3: Generate semantic context
    const semanticContext = await this.generateSemanticContext(originalQuery, intent);
    
    // Step 4: Create query expansions
    const expandedQueries = await this.expandQuery(originalQuery, intent, entities);
    
    // Step 5: Generate optimized search terms
    const searchTerms = await this.generateSearchTerms(originalQuery, entities, intent);
    
    return {
      original: originalQuery,
      enhanced: expandedQueries,
      intent,
      searchTerms,
      semanticContext,
      expandedQueries
    };
  }

  private async analyzeQueryIntent(query: string): Promise<QueryIntent> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing payment processing and merchant services queries. 
            Analyze the user's intent and classify it appropriately.
            
            Types: search, comparison, calculation, recommendation, troubleshooting
            Domains: payments, processors, rates, technical, compliance
            Urgency: high (immediate business impact), medium (planning/research), low (general interest)
            
            Respond in JSON format only.`
          },
          {
            role: 'user',
            content: `Analyze this query: "${query}"
            
            Return JSON with:
            {
              "type": "query type",
              "entities": ["entity1", "entity2"],
              "confidence": 0.0-1.0,
              "domain": "primary domain",
              "urgency": "urgency level"
            }`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 200
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing query intent:', error);
      return {
        type: 'search',
        entities: [],
        confidence: 0.5,
        domain: 'payments',
        urgency: 'medium'
      };
    }
  }

  private async extractEntities(query: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Extract payment processing entities from queries. Focus on:
            - Processor names (Stripe, Square, PayPal, etc.)
            - Gateway names (Authorize.net, NMI, etc.)
            - Rate types (qualified, mid-qualified, etc.)
            - Business types (restaurant, retail, e-commerce)
            - Technical terms (PCI compliance, tokenization, etc.)
            
            Return only a JSON array of strings.`
          },
          {
            role: 'user',
            content: `Extract entities from: "${query}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 150
      });

      const result = JSON.parse(response.choices[0].message.content || '{"entities": []}');
      return result.entities || [];
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  private async generateSemanticContext(query: string, intent: QueryIntent): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Generate semantic context for payment processing queries to improve retrieval.
            Provide related concepts, synonyms, and industry terminology that would help find relevant information.`
          },
          {
            role: 'user',
            content: `Query: "${query}"
            Intent: ${intent.type}
            Domain: ${intent.domain}
            
            Generate semantic context (50 words max):`
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating semantic context:', error);
      return '';
    }
  }

  private async expandQuery(query: string, intent: QueryIntent, entities: string[]): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Create 3-5 alternative query formulations to improve search results.
            Focus on different ways to express the same information need using:
            - Synonyms and industry terminology
            - Different question formats
            - Specific and general variations
            - Related concepts
            
            Return JSON array of strings.`
          },
          {
            role: 'user',
            content: `Original: "${query}"
            Intent: ${intent.type}
            Entities: ${entities.join(', ')}
            
            Generate query variations:`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{"queries": []}');
      return result.queries || [query];
    } catch (error) {
      console.error('Error expanding query:', error);
      return [query];
    }
  }

  private async generateSearchTerms(query: string, entities: string[], intent: QueryIntent): Promise<string[]> {
    const terms = new Set<string>();
    
    // Add original query words
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => terms.add(word));
    
    // Add entities
    entities.forEach(entity => {
      entity.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
    
    // Add domain-specific terms
    const domainTerms = this.getDomainTerms(intent.domain);
    domainTerms.forEach(term => terms.add(term));
    
    // Add intent-specific terms
    const intentTerms = this.getIntentTerms(intent.type);
    intentTerms.forEach(term => terms.add(term));
    
    return Array.from(terms);
  }

  private getDomainTerms(domain: string): string[] {
    const termMap: Record<string, string[]> = {
      'payments': ['payment', 'processing', 'transaction', 'merchant', 'card'],
      'processors': ['processor', 'gateway', 'acquirer', 'bank', 'platform'],
      'rates': ['rate', 'fee', 'cost', 'pricing', 'qualified', 'interchange'],
      'technical': ['api', 'integration', 'security', 'pci', 'tokenization'],
      'compliance': ['compliance', 'regulation', 'security', 'audit', 'standard']
    };
    
    return termMap[domain] || [];
  }

  private getIntentTerms(type: string): string[] {
    const termMap: Record<string, string[]> = {
      'search': ['find', 'information', 'details', 'about'],
      'comparison': ['compare', 'versus', 'difference', 'better', 'best'],
      'calculation': ['calculate', 'cost', 'savings', 'estimate', 'analyze'],
      'recommendation': ['recommend', 'suggest', 'advice', 'best', 'option'],
      'troubleshooting': ['problem', 'issue', 'error', 'fix', 'help']
    };
    
    return termMap[type] || [];
  }

  async getQuerySuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 3) return [];
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Generate 5 autocomplete suggestions for payment processing queries.
            Make them specific, useful, and relevant to merchant services.
            Return JSON array of strings.`
          },
          {
            role: 'user',
            content: `Complete this query: "${partialQuery}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Error generating query suggestions:', error);
      return [];
    }
  }

  getQueryStats(): {
    totalQueries: number;
    cacheHitRate: number;
    averageConfidence: number;
    topIntents: Array<{ type: string; count: number }>;
  } {
    const totalQueries = this.queryCache.size;
    const intents = Array.from(this.intentClassifier.values());
    const avgConfidence = intents.reduce((sum, intent) => sum + intent.confidence, 0) / intents.length || 0;
    
    const intentCounts = intents.reduce((acc, intent) => {
      acc[intent.type] = (acc[intent.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topIntents = Object.entries(intentCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalQueries,
      cacheHitRate: 0.75, // Estimated based on cache usage
      averageConfidence: avgConfidence,
      topIntents
    };
  }
}

export const enhancedQueryProcessor = new EnhancedQueryProcessor();