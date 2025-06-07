import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ContentFilterResult {
  isRelevant: boolean;
  confidence: number;
  reasoning: string;
  categories: string[];
  safetyFlags: string[];
}

export class ContentSafetyFilter {
  private merchantServicesKeywords = [
    'payment', 'merchant', 'processing', 'pos', 'terminal', 'transaction', 
    'gateway', 'acquiring', 'commerce', 'fintech', 'card', 'credit', 'debit', 
    'interchange', 'settlement', 'rate sheet', 'pricing', 'compliance', 'pci', 
    'api', 'integration', 'sdk', 'developer', 'documentation', 'security', 
    'fraud', 'chargeback', 'iso', 'reseller', 'partner', 'emv', 'contactless',
    'mobile payments', 'digital wallet', 'tokenization', 'encryption', 'moto',
    'card not present', 'point of sale', 'merchant services', 'payment processor',
    'acquiring bank', 'issuing bank', 'authorization', 'capture', 'void', 'refund'
  ];

  private excludedKeywords = [
    'adult', 'porn', 'xxx', 'escort', 'gambling', 'casino', 'bet', 'politics', 
    'political', 'election', 'candidate', 'religion', 'religious', 'church', 
    'mosque', 'temple', 'drugs', 'illegal', 'weapon', 'gun', 'violence', 'hate',
    'discrimination', 'racist', 'terrorism', 'extremist', 'explicit', 'nsfw',
    'marijuana', 'cannabis', 'cbd', 'thc', 'alcohol', 'tobacco', 'dating',
    'hookup', 'cryptocurrency scam', 'pyramid scheme', 'mlm'
  ];

  private businessRelevantTerms = [
    'revenue', 'growth', 'expansion', 'acquisition', 'merger', 'ipo', 'funding',
    'partnership', 'collaboration', 'product launch', 'feature update', 'security update',
    'compliance', 'regulation', 'industry news', 'market trends', 'competition',
    'customer success', 'case study', 'white paper', 'webinar', 'conference',
    'certification', 'award', 'recognition', 'leadership change', 'executive',
    'quarterly results', 'earnings', 'financial', 'investment', 'innovation'
  ];

  async filterContent(content: string, title: string, url: string): Promise<ContentFilterResult> {
    try {
      // Quick keyword-based pre-filtering
      const quickFilter = this.performQuickFilter(content, title);
      if (!quickFilter.passed) {
        return {
          isRelevant: false,
          confidence: quickFilter.confidence,
          reasoning: quickFilter.reasoning,
          categories: [],
          safetyFlags: quickFilter.safetyFlags
        };
      }

      // AI-powered content analysis for edge cases
      const aiAnalysis = await this.performAIAnalysis(content, title, url);
      
      return {
        isRelevant: aiAnalysis.isRelevant && quickFilter.passed,
        confidence: Math.min(quickFilter.confidence, aiAnalysis.confidence),
        reasoning: aiAnalysis.reasoning,
        categories: aiAnalysis.categories,
        safetyFlags: quickFilter.safetyFlags
      };
    } catch (error) {
      console.error('Content filtering error:', error);
      // Fail-safe: if filtering fails, err on the side of caution
      return {
        isRelevant: false,
        confidence: 0.1,
        reasoning: 'Content filtering failed - excluded for safety',
        categories: [],
        safetyFlags: ['filtering_error']
      };
    }
  }

  private performQuickFilter(content: string, title: string): {
    passed: boolean;
    confidence: number;
    reasoning: string;
    safetyFlags: string[];
  } {
    const fullText = `${title} ${content}`.toLowerCase();
    const safetyFlags: string[] = [];

    // Check for excluded content
    for (const excluded of this.excludedKeywords) {
      if (fullText.includes(excluded.toLowerCase())) {
        safetyFlags.push(`excluded_keyword_${excluded}`);
        return {
          passed: false,
          confidence: 0.9,
          reasoning: `Content contains excluded keyword: ${excluded}`,
          safetyFlags
        };
      }
    }

    // Check for merchant services relevance
    let relevanceScore = 0;
    let matchedKeywords: string[] = [];

    for (const keyword of this.merchantServicesKeywords) {
      if (fullText.includes(keyword.toLowerCase())) {
        relevanceScore += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Check for business relevance
    let businessScore = 0;
    for (const term of this.businessRelevantTerms) {
      if (fullText.includes(term.toLowerCase())) {
        businessScore += 0.5;
        matchedKeywords.push(term);
      }
    }

    const totalScore = relevanceScore + businessScore;
    const confidence = Math.min(0.95, totalScore / 5); // Normalize to 0-0.95

    if (totalScore >= 1) {
      return {
        passed: true,
        confidence,
        reasoning: `Relevant content with keywords: ${matchedKeywords.slice(0, 5).join(', ')}`,
        safetyFlags
      };
    }

    return {
      passed: false,
      confidence: 0.8,
      reasoning: 'Content does not contain sufficient merchant services keywords',
      safetyFlags
    };
  }

  private async performAIAnalysis(content: string, title: string, url: string): Promise<{
    isRelevant: boolean;
    confidence: number;
    reasoning: string;
    categories: string[];
  }> {
    const prompt = `Analyze this content for relevance to merchant services and payment processing:

Title: ${title}
URL: ${url}
Content: ${content.substring(0, 2000)}

Determine if this content is relevant for sales representatives and staff in the merchant services/payment processing industry. Consider:

1. Is this about payment processing, merchant services, POS systems, or financial technology?
2. Would this information help sales reps understand industry trends, competitor updates, or product changes?
3. Is this business news that affects the payment processing industry?

Exclude content about:
- Adult/explicit material
- Politics, religion, or controversial social topics
- Gambling, illegal activities, or harmful content
- Generic business news unrelated to payments
- Personal blogs or opinion pieces without industry relevance

Respond in JSON format:
{
  "isRelevant": boolean,
  "confidence": number (0-1),
  "reasoning": "brief explanation",
  "categories": ["category1", "category2"] (e.g., ["product_update", "industry_news", "compliance", "partnership"])
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        isRelevant: result.isRelevant || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        reasoning: result.reasoning || 'AI analysis completed',
        categories: Array.isArray(result.categories) ? result.categories : []
      };
    } catch (error) {
      console.error('AI content analysis error:', error);
      return {
        isRelevant: false,
        confidence: 0.1,
        reasoning: 'AI analysis failed',
        categories: []
      };
    }
  }

  // Utility method to check if content should trigger immediate rejection
  isExplicitlyBanned(content: string, title: string): boolean {
    const fullText = `${title} ${content}`.toLowerCase();
    
    const bannedTerms = [
      'xxx', 'porn', 'adult', 'escort', 'prostitution', 'drugs', 'marijuana',
      'casino', 'gambling', 'bet', 'wager', 'political campaign', 'election fraud',
      'hate speech', 'racism', 'terrorism', 'violence', 'weapon', 'gun'
    ];

    return bannedTerms.some(term => fullText.includes(term));
  }

  // Get scanning schedule for distributed vendor monitoring
  getVendorScanSchedule(): Record<string, string[]> {
    return {
      monday: ['fiserv-first-data', 'shift4-skytab'],
      tuesday: ['chase-paymentech', 'clover-fiserv'],
      wednesday: ['worldpay-fis', 'quantic-pos'],
      thursday: ['tsys-global-payments', 'lightspeed-pos'],
      friday: ['elavon-us-bank', 'revel-systems', 'authorize-net', 'cybersource-visa', 'nmi']
    };
  }

  // Get vendors to scan for current day
  getVendorsForToday(): string[] {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const schedule = this.getVendorScanSchedule();
    
    return schedule[today] || [];
  }
}

export const contentSafetyFilter = new ContentSafetyFilter();