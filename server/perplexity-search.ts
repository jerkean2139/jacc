interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ExternalSearchResult {
  content: string;
  citations: string[];
  confidence: number;
  searchType: 'real-time' | 'industry-specific';
  timestamp: Date;
}

export class PerplexitySearchService {
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  
  async searchIndustryIntelligence(query: string): Promise<ExternalSearchResult> {
    try {
      const enhancedQuery = this.enhanceQueryForIndustry(query);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a payment processing industry expert. Provide current, accurate information about merchant services, payment processors, and industry trends. Focus on practical details like pricing, features, and contact information.'
            },
            {
              role: 'user',
              content: enhancedQuery
            }
          ],
          max_tokens: 800,
          temperature: 0.2,
          top_p: 0.9,
          search_recency_filter: 'month',
          return_images: false,
          return_related_questions: false,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data: PerplexityResponse = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || 'No results found',
        citations: data.citations || [],
        confidence: this.calculateConfidence(data),
        searchType: 'real-time',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Perplexity search error:', error);
      throw new Error('External search temporarily unavailable');
    }
  }
  
  private enhanceQueryForIndustry(query: string): string {
    // Add industry-specific context to improve search results
    const industryKeywords = [
      'payment processing', 'merchant services', 'credit card processing',
      'POS systems', 'payment gateway', 'transaction fees', 'interchange rates'
    ];
    
    const queryLower = query.toLowerCase();
    const hasIndustryContext = industryKeywords.some(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
    
    if (!hasIndustryContext) {
      return `${query} payment processing merchant services`;
    }
    
    return query;
  }
  
  private calculateConfidence(data: PerplexityResponse): number {
    // Calculate confidence based on citations and response quality
    const citationCount = data.citations?.length || 0;
    const hasContent = data.choices[0]?.message?.content?.length > 50;
    
    let confidence = 0.5; // Base confidence
    
    if (citationCount > 0) confidence += 0.2;
    if (citationCount > 2) confidence += 0.1;
    if (hasContent) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }
  
  async searchCompetitorAnalysis(processorName: string): Promise<ExternalSearchResult> {
    const query = `${processorName} payment processor reviews pricing fees complaints 2024 2025`;
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Analyze this payment processor objectively. Include current pricing, customer reviews, strengths, weaknesses, and any recent news or complaints.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
          search_recency_filter: 'month',
          stream: false
        })
      });
      
      const data: PerplexityResponse = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || 'No analysis available',
        citations: data.citations || [],
        confidence: this.calculateConfidence(data),
        searchType: 'industry-specific',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Competitor analysis error:', error);
      throw new Error('Competitor analysis unavailable');
    }
  }
  
  async searchPricingIntelligence(query: string): Promise<ExternalSearchResult> {
    const enhancedQuery = `current ${query} pricing rates fees interchange costs 2024 2025`;
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Provide current pricing information for payment processing services. Include specific rates, fees, and any recent changes in pricing structures.'
            },
            {
              role: 'user',
              content: enhancedQuery
            }
          ],
          max_tokens: 600,
          temperature: 0.1,
          search_recency_filter: 'week',
          stream: false
        })
      });
      
      const data: PerplexityResponse = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || 'No pricing data available',
        citations: data.citations || [],
        confidence: this.calculateConfidence(data),
        searchType: 'real-time',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Pricing intelligence error:', error);
      throw new Error('Pricing data unavailable');
    }
  }

  async searchWeb(query: string): Promise<ExternalSearchResult> {
    try {
      console.log(`🌐 Executing web search via Perplexity: "${query}"`);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Provide current, accurate information based on real-time web search. Focus on factual details including pricing, features, contact information, and recent updates. Cite sources when available.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          top_p: 0.9,
          search_recency_filter: 'month',
          return_images: false,
          return_related_questions: false,
          stream: false
        })
      });
      
      if (!response.ok) {
        console.error(`Perplexity API error: ${response.status} - ${response.statusText}`);
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data: PerplexityResponse = await response.json();
      console.log(`✅ Web search completed successfully - ${data.choices[0]?.message?.content?.length || 0} characters returned`);
      
      return {
        content: data.choices[0]?.message?.content || 'No results found',
        citations: data.citations || [],
        confidence: this.calculateConfidence(data),
        searchType: 'real-time',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const perplexitySearchService = new PerplexitySearchService();