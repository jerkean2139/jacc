import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface DealPrediction {
  dealId: string;
  closeProbability: number;
  predictedCloseDate: string;
  predictedValue: number;
  riskFactors: string[];
  accelerators: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface MarketIntelligence {
  industryTrends: string[];
  competitiveMoves: string[];
  pricingPressures: string[];
  opportunityAlerts: string[];
  threatWarnings: string[];
}

export interface ProactiveAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'follow-up' | 'competitive' | 'budget-cycle';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  suggestedAction: string;
  deadline?: string;
  prospectName?: string;
}

export class PredictiveSalesAnalytics {
  private dealHistory: Map<string, any[]> = new Map();
  private marketSignals: string[] = [];

  async analyzeDealProbability(
    conversationData: string[],
    prospectProfile: any,
    dealStage: string
  ): Promise<DealPrediction> {
    const prompt = `As an expert sales data analyst, predict deal outcomes based on conversation analysis:

Conversation Data: ${conversationData.slice(-5).join('\n')}
Prospect Profile: ${JSON.stringify(prospectProfile)}
Current Deal Stage: ${dealStage}

Analyze and predict:
1. Close probability (0-100%)
2. Likely close date
3. Predicted deal value
4. Risk factors that could kill the deal
5. Accelerators that could speed closure
6. Specific actions to increase win rate
7. Confidence in prediction

Consider merchant services sales cycles, decision-making patterns, and industry standards.
Return detailed JSON analysis.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const prediction = JSON.parse(jsonMatch[0]);
        return {
          dealId: `deal_${Date.now()}`,
          closeProbability: prediction.closeProbability || 50,
          predictedCloseDate: prediction.predictedCloseDate || 'TBD',
          predictedValue: prediction.predictedValue || 0,
          riskFactors: prediction.riskFactors || [],
          accelerators: prediction.accelerators || [],
          recommendedActions: prediction.recommendedActions || [],
          confidence: prediction.confidence || 70
        };
      }
    } catch (error) {
      console.error('Error analyzing deal probability:', error);
    }

    return this.getDefaultPrediction();
  }

  async generateProactiveAlerts(
    activeDeals: any[],
    marketData: string[]
  ): Promise<ProactiveAlert[]> {
    const alerts: ProactiveAlert[] = [];
    const currentDate = new Date();

    // Budget cycle alerts
    const quarterEnd = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0);
    const daysToQuarterEnd = Math.ceil((quarterEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToQuarterEnd <= 30) {
      alerts.push({
        id: `budget_${Date.now()}`,
        type: 'budget-cycle',
        priority: 'high',
        title: 'Quarter-End Budget Push Opportunity',
        message: `Q${Math.floor(currentDate.getMonth() / 3) + 1} ends in ${daysToQuarterEnd} days. Prospects may have budget urgency.`,
        suggestedAction: 'Contact warm prospects about expedited implementation to capture remaining budget'
      });
    }

    // Follow-up alerts for stale deals
    activeDeals.forEach(deal => {
      const lastContact = new Date(deal.lastContact || Date.now() - 7 * 24 * 60 * 60 * 1000);
      const daysSinceContact = Math.ceil((currentDate.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceContact >= 7) {
        alerts.push({
          id: `followup_${deal.id}`,
          type: 'follow-up',
          priority: daysSinceContact >= 14 ? 'high' : 'medium',
          title: `Follow-up Required: ${deal.prospectName}`,
          message: `No contact for ${daysSinceContact} days. Deal momentum at risk.`,
          suggestedAction: 'Send value-add follow-up with industry insights or case study',
          prospectName: deal.prospectName
        });
      }
    });

    // Competitive intelligence alerts
    const competitiveKeywords = ['new processor', 'rate reduction', 'competitor launch', 'acquisition'];
    marketData.forEach(signal => {
      competitiveKeywords.forEach(keyword => {
        if (signal.toLowerCase().includes(keyword)) {
          alerts.push({
            id: `competitive_${Date.now()}_${Math.random()}`,
            type: 'competitive',
            priority: 'medium',
            title: 'Competitive Market Movement',
            message: signal,
            suggestedAction: 'Review active deals for competitive threats and proactively address'
          });
        }
      });
    });

    return alerts.slice(0, 10); // Limit to top 10 alerts
  }

  async predictMarketTrends(industryData: string[]): Promise<MarketIntelligence> {
    const prompt = `Analyze merchant services market trends and predict future developments:

Recent Industry Data: ${industryData.join('\n')}

Provide intelligence on:
1. Emerging industry trends
2. Competitive landscape changes
3. Pricing pressure indicators
4. New opportunity areas
5. Potential market threats

Focus on payment processing, merchant services, and fintech developments.
Return actionable market intelligence in JSON format.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const intelligence = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        industryTrends: intelligence.industryTrends || [],
        competitiveMoves: intelligence.competitiveMoves || [],
        pricingPressures: intelligence.pricingPressures || [],
        opportunityAlerts: intelligence.opportunityAlerts || [],
        threatWarnings: intelligence.threatWarnings || []
      };
    } catch (error) {
      console.error('Error predicting market trends:', error);
      return this.getDefaultMarketIntelligence();
    }
  }

  async generateDealStrategy(
    dealPrediction: DealPrediction,
    competitiveIntel: string[]
  ): Promise<{
    strategy: string;
    tactics: string[];
    timeline: string;
    resources: string[];
  }> {
    const prompt = `Design a winning deal strategy based on predictive analytics:

Deal Prediction: ${JSON.stringify(dealPrediction)}
Competitive Intelligence: ${competitiveIntel.join(', ')}

Create a comprehensive strategy including:
1. Overall approach strategy
2. Specific tactical actions
3. Recommended timeline
4. Resources needed

Focus on merchant services deal closure and relationship building.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Extract strategy components
      const strategyMatch = content.match(/Strategy[:\s]*([^\n]+)/i);
      const tacticsMatches = content.match(/tactics?[:\s]*[\n-]*(.*?)(?=timeline|resources|$)/si);
      const timelineMatch = content.match(/timeline[:\s]*([^\n]+)/i);
      const resourcesMatches = content.match(/resources?[:\s]*[\n-]*(.*?)$/si);

      return {
        strategy: strategyMatch ? strategyMatch[1].trim() : 'Multi-touch relationship building approach',
        tactics: tacticsMatches ? 
          tacticsMatches[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•*]\s*/, '').trim()) :
          ['Build stakeholder consensus', 'Address competitive concerns', 'Demonstrate ROI'],
        timeline: timelineMatch ? timelineMatch[1].trim() : '30-45 day close cycle',
        resources: resourcesMatches ?
          resourcesMatches[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•*]\s*/, '').trim()) :
          ['Case studies', 'ROI calculator', 'Technical demo']
      };
    } catch (error) {
      console.error('Error generating deal strategy:', error);
      return this.getDefaultStrategy();
    }
  }

  async analyzeConversationSentiment(messages: string[]): Promise<{
    overallSentiment: 'positive' | 'neutral' | 'negative';
    engagementLevel: number;
    buyingSignals: string[];
    concernIndicators: string[];
    momentumDirection: 'increasing' | 'stable' | 'declining';
  }> {
    const prompt = `Analyze conversation sentiment and buying signals:

Recent Messages: ${messages.slice(-10).join('\n')}

Analyze:
1. Overall sentiment (positive/neutral/negative)
2. Engagement level (0-100)
3. Buying signals detected
4. Concern indicators
5. Deal momentum direction

Return JSON analysis focusing on merchant services sales indicators.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        overallSentiment: analysis.overallSentiment || 'neutral',
        engagementLevel: analysis.engagementLevel || 50,
        buyingSignals: analysis.buyingSignals || [],
        concernIndicators: analysis.concernIndicators || [],
        momentumDirection: analysis.momentumDirection || 'stable'
      };
    } catch (error) {
      console.error('Error analyzing conversation sentiment:', error);
      return this.getDefaultSentiment();
    }
  }

  private getDefaultPrediction(): DealPrediction {
    return {
      dealId: `deal_${Date.now()}`,
      closeProbability: 50,
      predictedCloseDate: 'TBD',
      predictedValue: 0,
      riskFactors: ['Insufficient discovery information'],
      accelerators: ['Continue relationship building'],
      recommendedActions: ['Gather more prospect information'],
      confidence: 60
    };
  }

  private getDefaultMarketIntelligence(): MarketIntelligence {
    return {
      industryTrends: ['Digital payment adoption increasing'],
      competitiveMoves: ['Monitor competitive landscape'],
      pricingPressures: ['Rate competition intensifying'],
      opportunityAlerts: ['Explore new market segments'],
      threatWarnings: ['Stay competitive on pricing']
    };
  }

  private getDefaultStrategy() {
    return {
      strategy: 'Consultative relationship building approach',
      tactics: ['Focus on value over price', 'Build stakeholder consensus', 'Address specific pain points'],
      timeline: '30-60 day sales cycle',
      resources: ['Industry case studies', 'ROI analysis', 'Technical specifications']
    };
  }

  private getDefaultSentiment() {
    return {
      overallSentiment: 'neutral' as const,
      engagementLevel: 50,
      buyingSignals: [],
      concernIndicators: [],
      momentumDirection: 'stable' as const
    };
  }
}

export const predictiveAnalytics = new PredictiveSalesAnalytics();