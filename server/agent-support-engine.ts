import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AgentQuery {
  question: string;
  context?: string;
  urgency: 'low' | 'medium' | 'high';
  category: 'pricing' | 'technical' | 'policy' | 'vendor' | 'process' | 'compliance';
}

export interface QuickAnswer {
  answer: string;
  confidence: number;
  sources: string[];
  followUpQuestions?: string[];
  escalationNeeded?: boolean;
}

export class AgentSupportEngine {
  // Handle common repetitive questions that interrupt management
  async answerCommonQuestion(query: AgentQuery): Promise<QuickAnswer> {
    const { VendorRecommendationEngine } = await import('./vendor-recommendation-engine');
    
    // Check if this is a vendor recommendation question
    if (this.isVendorQuestion(query.question)) {
      return this.handleVendorRecommendation(query.question);
    }

    // Check if this is a pricing question
    if (this.isPricingQuestion(query.question)) {
      return this.handlePricingQuestion(query.question);
    }

    // Check if this is a technical integration question
    if (this.isTechnicalQuestion(query.question)) {
      return this.handleTechnicalQuestion(query.question);
    }

    // For complex questions, use AI analysis
    return this.handleComplexQuestion(query);
  }

  private isVendorQuestion(question: string): boolean {
    const vendorKeywords = [
      'what vendor', 'which processor', 'who offers', 'best pos', 'recommend',
      'integration', 'quantic', 'clearent', 'trx', 'micamp', 'shift4', 'hubwallet'
    ];
    return vendorKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  private isPricingQuestion(question: string): boolean {
    const pricingKeywords = ['fee', 'cost', 'price', 'rate', 'pricing', 'how much'];
    return pricingKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  private isTechnicalQuestion(question: string): boolean {
    const technicalKeywords = ['integrate', 'api', 'setup', 'configure', 'install', 'support'];
    return technicalKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  private async handleVendorRecommendation(question: string): Promise<QuickAnswer> {
    const { VendorRecommendationEngine } = await import('./vendor-recommendation-engine');
    
    // Extract business type from question
    let businessType = 'general';
    let industry = 'general';
    
    if (question.toLowerCase().includes('restaurant')) {
      industry = 'restaurant';
      businessType = 'restaurant';
    } else if (question.toLowerCase().includes('retail')) {
      industry = 'retail';
      businessType = 'retail';
    } else if (question.toLowerCase().includes('salon')) {
      industry = 'salon';
      businessType = 'salon';
    } else if (question.toLowerCase().includes('food truck')) {
      businessType = 'mobile';
      industry = 'restaurant';
    }

    const recommendations = VendorRecommendationEngine.getRecommendationsByIndustry(industry);
    const nicheRecs = VendorRecommendationEngine.getSpecificNicheRecommendations();
    
    let answer = '';
    let sources = [];

    if (recommendations.length > 0) {
      answer = `For ${industry} businesses, I recommend: `;
      answer += recommendations.slice(0, 3).map(rec => {
        const contact = rec.contactInfo ? ` (Contact: ${rec.contactInfo})` : '';
        return `**${rec.vendor}**: ${rec.strengths[0]}${contact}`;
      }).join('\n\n');
      
      sources = recommendations.slice(0, 3).map(rec => rec.vendor);
    } else {
      answer = 'Based on your question, here are the general recommendations:\n\n';
      answer += '**Quantic**: Best for retail and e-commerce\n';
      answer += '**HubWallet**: Great for restaurants and mobile businesses\n';
      answer += '**MiCamp**: Excellent for software integrations';
      sources = ['Vendor Database', 'Q&A Knowledge Base'];
    }

    return {
      answer,
      confidence: 95,
      sources,
      followUpQuestions: [
        'What specific features do they need?',
        'What\'s their monthly processing volume?',
        'Do they need any specific integrations?'
      ]
    };
  }

  private async handlePricingQuestion(question: string): Promise<QuickAnswer> {
    const commonPricingAnswers = {
      'quantic fees': 'Quantic pricing: Rep quotes processing rates, Quantic quotes hardware based on merchant needs.',
      'clearent mobile fees': 'Contact Clearent directly for mobile solution pricing including reader costs.',
      'swipe simple fees': 'SwipeSimple: $20 monthly fee.',
      'general pricing': 'Pricing varies by processor and merchant needs. Rep quotes processing rates, processor quotes equipment.'
    };

    const lowerQuestion = question.toLowerCase();
    let answer = '';
    let sources = ['Pricing Database'];

    if (lowerQuestion.includes('quantic')) {
      answer = commonPricingAnswers['quantic fees'];
    } else if (lowerQuestion.includes('clearent') && lowerQuestion.includes('mobile')) {
      answer = commonPricingAnswers['clearent mobile fees'];
    } else if (lowerQuestion.includes('swipe simple')) {
      answer = commonPricingAnswers['swipe simple fees'];
    } else {
      answer = commonPricingAnswers['general pricing'];
    }

    return {
      answer,
      confidence: 90,
      sources,
      followUpQuestions: [
        'What\'s the merchant\'s monthly volume?',
        'What type of business is it?',
        'Do they need any specific hardware?'
      ]
    };
  }

  private async handleTechnicalQuestion(question: string): Promise<QuickAnswer> {
    const technicalAnswers = {
      'quickbooks integration': 'QuickBooks integration available via TRX and Clearent through Hyfin.',
      'epicor integration': 'Epicor integration: Yes, via MiCamp.',
      'roommaster integration': 'Roommaster/InnQuest integration: Yes, via MiCamp.',
      'aloha integration': 'Aloha integration: Clearent, MiCamp (Freedom pay or Connected payments w/ NCR for EMV).',
      'epro integration': 'Epro integration: No, they use Fluid Pay Direct.',
      'support contacts': 'Support numbers: Clearent: 866.435.0666 Option 1, TRX: 888-933-8797 Option 2, TSYS: 877-608-6599'
    };

    const lowerQuestion = question.toLowerCase();
    let answer = '';
    let sources = ['Technical Documentation'];

    if (lowerQuestion.includes('quickbooks')) {
      answer = technicalAnswers['quickbooks integration'];
    } else if (lowerQuestion.includes('epicor')) {
      answer = technicalAnswers['epicor integration'];
    } else if (lowerQuestion.includes('roommaster') || lowerQuestion.includes('innquest')) {
      answer = technicalAnswers['roommaster integration'];
    } else if (lowerQuestion.includes('aloha')) {
      answer = technicalAnswers['aloha integration'];
    } else if (lowerQuestion.includes('epro')) {
      answer = technicalAnswers['epro integration'];
    } else if (lowerQuestion.includes('support') || lowerQuestion.includes('contact')) {
      answer = technicalAnswers['support contacts'];
    } else {
      answer = 'For technical integrations, MiCamp handles most software integrations. For specific questions, contact the processor directly.';
    }

    return {
      answer,
      confidence: 95,
      sources,
      followUpQuestions: [
        'Do you need specific integration details?',
        'What software are they using?',
        'Is this for a new or existing merchant?'
      ]
    };
  }

  private async handleComplexQuestion(query: AgentQuery): Promise<QuickAnswer> {
    const prompt = `As an expert merchant services consultant, answer this agent's question concisely and accurately:

Question: ${query.question}
Context: ${query.context || 'None provided'}
Category: ${query.category}
Urgency: ${query.urgency}

Provide a clear, actionable answer based on merchant services knowledge. Include:
1. Direct answer to the question
2. Any relevant vendor recommendations
3. Next steps or follow-up actions needed
4. Whether this requires escalation to management

Focus on practical guidance that helps the agent assist their client immediately.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Determine if escalation is needed
      const escalationNeeded = query.urgency === 'high' || 
        content.toLowerCase().includes('escalat') ||
        content.toLowerCase().includes('management') ||
        content.toLowerCase().includes('complex');

      return {
        answer: content,
        confidence: 85,
        sources: ['AI Analysis', 'Knowledge Base'],
        escalationNeeded,
        followUpQuestions: [
          'Does this fully answer your question?',
          'Do you need additional details?',
          'Should I escalate this to management?'
        ]
      };
    } catch (error) {
      console.error('Error handling complex question:', error);
      return {
        answer: 'I need more information to provide an accurate answer. Please provide additional context or escalate to management.',
        confidence: 60,
        sources: ['System'],
        escalationNeeded: true
      };
    }
  }

  // Quick reference for common questions
  getQuickReference(): { [key: string]: string } {
    return {
      'Restaurant POS': 'Shift4 (SkyTab), MiCamp, HubWallet',
      'Retail POS': 'Quantic, Clover, HubWallet',
      'Food Truck': 'HubWallet, Quantic',
      'Salon POS': 'HubWallet',
      'High Risk': 'TRX, Payment Advisors',
      'Mobile Processing': 'TRX, Clearent, MiCamp',
      'Gift Cards': 'Valutec, Factor4, Shift4, Quantic',
      'ACH Services': 'TRX, ACI, Clearent',
      'QuickBooks Integration': 'TRX and Clearent through Hyfin',
      'SwipeSimple Fees': '$20 monthly',
      'Rectangle Health': 'TSYS VAR via TRX, Clearent or MiCamp'
    };
  }

  // Categories for organizing common questions
  getQuestionCategories(): { [key: string]: string[] } {
    return {
      'Vendor Recommendations': [
        'What POS is best for restaurants?',
        'Who offers mobile processing?',
        'Best processor for high risk?',
        'Which vendor for retail POS?'
      ],
      'Pricing': [
        'What are Quantic fees?',
        'SwipeSimple pricing?',
        'Clearent mobile costs?'
      ],
      'Technical': [
        'QuickBooks integration options?',
        'Aloha POS integration?',
        'Support contact numbers?'
      ],
      'Services': [
        'Who offers gift cards?',
        'ACH processing options?',
        'High ticket processing?'
      ]
    };
  }
}

export const agentSupport = new AgentSupportEngine();