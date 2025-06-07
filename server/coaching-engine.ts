import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ConversationAnalysis {
  stage: 'discovery' | 'presentation' | 'demo' | 'objection-handling' | 'closing' | 'follow-up';
  prospectType: 'new' | 'existing' | 'referral' | 'inbound' | 'cold';
  productInterest: string[];
  painPoints: string[];
  budget?: string;
  timeline?: string;
  decisionMaker?: boolean;
  engagementLevel: number;
  closingSignals: number;
  objections: string[];
  questionsAsked: number;
  nextSteps: string[];
}

export interface CoachingTip {
  id: string;
  type: 'opportunity' | 'warning' | 'insight' | 'next-step';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'discovery' | 'presentation' | 'objection' | 'closing' | 'follow-up';
  confidence: number;
  suggestedAction?: string;
  relatedDocs?: string[];
  timestamp: Date;
}

export interface SalesMetrics {
  callDuration: number;
  questionsAsked: number;
  objections: number;
  nextSteps: number;
  engagementScore: number;
  closingSignals: number;
  talkToListenRatio: number;
  discoveryCompleteness: number;
}

export class CoachingEngine {
  private conversationHistory: string[] = [];
  private currentAnalysis: ConversationAnalysis | null = null;
  private activeMetrics: SalesMetrics;

  constructor() {
    this.activeMetrics = {
      callDuration: 0,
      questionsAsked: 0,
      objections: 0,
      nextSteps: 0,
      engagementScore: 0,
      closingSignals: 0,
      talkToListenRatio: 0,
      discoveryCompleteness: 0
    };
  }

  async analyzeConversation(conversationText: string): Promise<ConversationAnalysis> {
    const prompt = `Analyze this sales conversation and extract key information:

Conversation: ${conversationText}

Return a JSON analysis with:
- stage: current sales stage (discovery, presentation, demo, objection-handling, closing, follow-up)
- prospectType: type of prospect (new, existing, referral, inbound, cold)
- productInterest: array of products/services mentioned
- painPoints: array of pain points discovered
- budget: budget information if mentioned
- timeline: timeline if discussed
- decisionMaker: true/false if they are the decision maker
- engagementLevel: 1-100 score based on prospect engagement
- closingSignals: number of buying signals detected
- objections: array of objections raised
- questionsAsked: number of discovery questions asked by agent
- nextSteps: array of agreed next steps

Focus on merchant services, payment processing, TracerPay, TracerFlex, TracerAuto, and related financial solutions.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      this.currentAnalysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return this.getDefaultAnalysis();
    }
  }

  async generateCoachingTips(analysis: ConversationAnalysis, conversationText: string): Promise<CoachingTip[]> {
    const prompt = `Based on this sales conversation analysis, generate 3-5 real-time coaching tips for the sales agent:

Analysis: ${JSON.stringify(analysis)}
Recent conversation: ${conversationText.slice(-1000)}

Generate actionable coaching tips focusing on:
1. Missed discovery opportunities
2. Objection handling improvements
3. Closing signal recognition
4. Next step recommendations
5. Product positioning opportunities

Each tip should include:
- type: opportunity, warning, insight, or next-step
- title: brief descriptive title
- message: specific guidance
- priority: low, medium, high, or critical
- category: discovery, presentation, objection, closing, or follow-up
- confidence: 1-100 score
- suggestedAction: specific words/questions to use
- relatedDocs: relevant TracerPay/TracerFlex/TracerAuto documentation

Return JSON array of coaching tips.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tips = JSON.parse(jsonMatch[0]);
        return tips.map((tip: any, index: number) => ({
          ...tip,
          id: `tip_${Date.now()}_${index}`,
          timestamp: new Date()
        }));
      }
      
      return this.getDefaultTips();
    } catch (error) {
      console.error('Error generating coaching tips:', error);
      return this.getDefaultTips();
    }
  }

  async analyzeRealTimeMessage(message: string, speaker: 'agent' | 'prospect'): Promise<{
    urgentTips: CoachingTip[];
    metricsUpdate: Partial<SalesMetrics>;
    stageChange?: string;
  }> {
    this.conversationHistory.push(`${speaker}: ${message}`);
    
    // Keep only last 20 messages for performance
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    const recentConversation = this.conversationHistory.join('\n');
    
    // Analyze for urgent coaching opportunities
    const urgentPrompt = `Analyze this latest message in the sales conversation for immediate coaching opportunities:

Recent conversation: ${recentConversation}
Latest message: ${speaker}: ${message}

Look for:
1. Missed opportunities to ask discovery questions
2. Objections that need immediate handling
3. Buying signals that should be recognized
4. Product positioning opportunities
5. Critical mistakes to correct

Return urgent coaching tips only if there's something actionable right now. Return empty array if no urgent action needed.

JSON format: [{"type":"...", "title":"...", "message":"...", "priority":"...", "suggestedAction":"..."}]`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: urgentPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{"tips": []}');
      const urgentTips = (result.tips || []).map((tip: any, index: number) => ({
        ...tip,
        id: `urgent_${Date.now()}_${index}`,
        timestamp: new Date(),
        confidence: tip.confidence || 85,
        category: tip.category || 'discovery'
      }));

      // Update metrics based on message analysis
      const metricsUpdate: Partial<SalesMetrics> = {};
      
      if (speaker === 'agent' && message.includes('?')) {
        metricsUpdate.questionsAsked = (this.activeMetrics.questionsAsked || 0) + 1;
      }

      if (speaker === 'prospect' && (
        message.toLowerCase().includes('not sure') ||
        message.toLowerCase().includes('but') ||
        message.toLowerCase().includes('concern')
      )) {
        metricsUpdate.objections = (this.activeMetrics.objections || 0) + 1;
      }

      if (speaker === 'prospect' && (
        message.toLowerCase().includes('when') ||
        message.toLowerCase().includes('how much') ||
        message.toLowerCase().includes('timeline') ||
        message.toLowerCase().includes('implement')
      )) {
        metricsUpdate.closingSignals = (this.activeMetrics.closingSignals || 0) + 1;
      }

      return {
        urgentTips,
        metricsUpdate,
        stageChange: this.detectStageChange(message, speaker)
      };

    } catch (error) {
      console.error('Error analyzing real-time message:', error);
      return {
        urgentTips: [],
        metricsUpdate: {}
      };
    }
  }

  private detectStageChange(message: string, speaker: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('demo') || lowerMessage.includes('show me')) {
      return 'demo';
    }
    
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return 'presentation';
    }
    
    if (lowerMessage.includes('when can we start') || lowerMessage.includes('next steps')) {
      return 'closing';
    }
    
    if (lowerMessage.includes('follow up') || lowerMessage.includes('think about it')) {
      return 'follow-up';
    }
    
    return undefined;
  }

  async getProductRecommendations(analysis: ConversationAnalysis): Promise<string[]> {
    const { painPoints, productInterest, stage, prospectType } = analysis;
    
    // Import vendor recommendation engine
    const { VendorRecommendationEngine } = await import('./vendor-recommendation-engine');
    
    // Determine business scenario from conversation analysis
    const businessScenario = {
      industry: this.extractIndustryFromAnalysis(analysis),
      businessType: this.extractBusinessTypeFromAnalysis(analysis),
      needs: productInterest,
      painPoints: painPoints
    };
    
    // Get smart recommendations based on actual Q&A database
    const smartRecs = VendorRecommendationEngine.getSmartRecommendations(businessScenario);
    
    const recommendations = [];
    
    // Primary vendor recommendations with context
    smartRecs.primary.forEach(vendor => {
      const relevantProducts = vendor.products.filter(product => 
        productInterest.some(interest => 
          product.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(product.toLowerCase())
        )
      );
      
      if (relevantProducts.length > 0) {
        recommendations.push(`${vendor.vendor}: ${relevantProducts.join(', ')}`);
      } else {
        recommendations.push(`${vendor.vendor}: ${vendor.strengths[0] || vendor.products[0]}`);
      }
      
      // Add contact info if available and in presentation/closing stage
      if (vendor.contactInfo && (stage === 'presentation' || stage === 'closing')) {
        recommendations.push(`Contact: ${vendor.contactInfo}`);
      }
    });
    
    // Add specific niche recommendations
    const nicheRecs = VendorRecommendationEngine.getSpecificNicheRecommendations();
    const detectedNiche = this.detectBusinessNiche(analysis);
    
    if (detectedNiche && nicheRecs[detectedNiche]) {
      recommendations.push(`${detectedNiche} specialists: ${nicheRecs[detectedNiche].join(', ')}`);
    }
    
    // Add integration-specific recommendations
    if (painPoints.some(p => p.toLowerCase().includes('integration') || p.toLowerCase().includes('software'))) {
      recommendations.push('MiCamp: Best for software integrations (Epicor, Roommaster, Aloha)');
      recommendations.push('TRX: QuickBooks integration via Hyfin');
      recommendations.push('Clearent: Hyfin QuickBooks integration');
    }
    
    // Add mobile processing recommendations
    if (painPoints.some(p => p.toLowerCase().includes('mobile') || p.toLowerCase().includes('portable'))) {
      recommendations.push('Mobile Solutions: TRX, Clearent, MiCamp');
      recommendations.push('Food Truck POS: HubWallet, Quantic');
    }
    
    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }
  
  private extractIndustryFromAnalysis(analysis: ConversationAnalysis): string {
    const { painPoints, productInterest } = analysis;
    const allText = [...painPoints, ...productInterest].join(' ').toLowerCase();
    
    if (allText.includes('restaurant') || allText.includes('food') || allText.includes('dining')) {
      return 'restaurant';
    }
    if (allText.includes('retail') || allText.includes('store') || allText.includes('shop')) {
      return 'retail';
    }
    if (allText.includes('salon') || allText.includes('beauty') || allText.includes('spa')) {
      return 'salon';
    }
    if (allText.includes('healthcare') || allText.includes('medical') || allText.includes('dental')) {
      return 'healthcare';
    }
    if (allText.includes('ecommerce') || allText.includes('online') || allText.includes('web')) {
      return 'ecommerce';
    }
    
    return 'general';
  }
  
  private extractBusinessTypeFromAnalysis(analysis: ConversationAnalysis): string {
    const { painPoints, productInterest } = analysis;
    const allText = [...painPoints, ...productInterest].join(' ').toLowerCase();
    
    if (allText.includes('mobile') || allText.includes('truck') || allText.includes('portable')) {
      return 'mobile';
    }
    if (allText.includes('high risk') || allText.includes('specialized')) {
      return 'high risk';
    }
    if (allText.includes('high ticket') || allText.includes('expensive') || allText.includes('luxury')) {
      return 'high ticket';
    }
    if (allText.includes('multi-location') || allText.includes('chain') || allText.includes('franchise')) {
      return 'multi-location';
    }
    
    return 'standard';
  }
  
  private detectBusinessNiche(analysis: ConversationAnalysis): string | null {
    const { painPoints, productInterest } = analysis;
    const allText = [...painPoints, ...productInterest].join(' ').toLowerCase();
    
    const niches = {
      'Archery Business': ['archery', 'bow', 'shooting'],
      'Food Truck': ['food truck', 'mobile food', 'truck'],
      'Salon': ['salon', 'beauty', 'hair', 'spa'],
      'Liquor Store': ['liquor', 'alcohol', 'wine', 'spirits'],
      'Restaurant - Full Service': ['full service', 'sit down', 'table service'],
      'Restaurant - Quick Service': ['quick service', 'fast food', 'qsr'],
      'High Risk': ['high risk', 'adult', 'gambling', 'cbd'],
      'High Ticket': ['high ticket', 'luxury', 'expensive'],
      'Healthcare': ['healthcare', 'medical', 'dental', 'clinic'],
      'E-commerce': ['ecommerce', 'online', 'website', 'internet']
    };
    
    for (const [niche, keywords] of Object.entries(niches)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        return niche;
      }
    }
    
    return null;
  }

  updateMetrics(updates: Partial<SalesMetrics>): void {
    this.activeMetrics = { ...this.activeMetrics, ...updates };
  }

  getMetrics(): SalesMetrics {
    return { ...this.activeMetrics };
  }

  private getDefaultAnalysis(): ConversationAnalysis {
    return {
      stage: 'discovery',
      prospectType: 'new',
      productInterest: [],
      painPoints: [],
      engagementLevel: 50,
      closingSignals: 0,
      objections: [],
      questionsAsked: 0,
      nextSteps: []
    };
  }

  private getDefaultTips(): CoachingTip[] {
    return [
      {
        id: 'default_1',
        type: 'opportunity',
        title: 'Start Discovery Process',
        message: 'Begin with open-ended questions to understand their current payment processing setup.',
        priority: 'medium',
        category: 'discovery',
        confidence: 80,
        suggestedAction: 'Ask: "Tell me about your current payment processing setup and any challenges you\'re facing."',
        relatedDocs: ['Discovery Question Bank', 'TracerPay Overview'],
        timestamp: new Date()
      }
    ];
  }
}

export const coachingEngine = new CoachingEngine();