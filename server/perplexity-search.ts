export interface PerplexityResponse {
  content: string;
  citations: string[];
}

export class PerplexitySearchService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY environment variable is required');
    }
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async searchWeb(query: string): Promise<PerplexityResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Be precise and concise. Focus on merchant services, payment processing, and business solutions.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        citations: data.citations || []
      };
    } catch (error) {
      console.error('Perplexity search error:', error);
      throw new Error('Web search temporarily unavailable');
    }
  }
}

export const perplexitySearchService = new PerplexitySearchService();