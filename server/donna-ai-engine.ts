import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ProspectProfile {
  id: string;
  companyName: string;
  industry: string;
  decisionMaker: string;
  businessModel: string;
  revenue: string;
  painPoints: string[];
  previousInteractions: string[];
  competitiveIntel: string[];
  personalDetails: string[];
  preferredCommunication: string;
  urgency: 'low' | 'medium' | 'high';
  budget: string;
  timeline: string;
  stakeholders: string[];
}

export interface DealIntelligence {
  competitorAnalysis: string[];
  priceAnchoring: string[];
  valueProposition: string[];
  objectionHandling: string[];
  closingStrategy: string[];
  followUpPlan: string[];
}

export interface SalesContext {
  dealStage: string;
  prospectProfile: ProspectProfile;
  conversationHistory: string[];
  marketConditions: string[];
  competitiveLandscape: string[];
}

export class DonnaAIEngine {
  private prospectProfiles: Map<string, ProspectProfile> = new Map();
  private marketIntelligence: string[] = [];
  private competitiveIntel: Map<string, string[]> = new Map();

  // Donna-level prospect profiling and research
  async buildProspectProfile(companyName: string, conversationData: string[]): Promise<ProspectProfile> {
    const prompt = `As an expert sales intelligence analyst, create a comprehensive prospect profile based on available information:

Company: ${companyName}
Conversation Data: ${conversationData.join('\n')}

Analyze and extract:
1. Industry and business model
2. Decision-making structure
3. Revenue indicators and business size
4. Specific pain points and challenges
5. Budget indicators and purchasing authority
6. Timeline and urgency signals
7. Stakeholder involvement
8. Communication preferences
9. Competitive landscape position
10. Personal details about contacts (professional background, interests)

Return detailed JSON profile with actionable insights for sales approach.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const profileData = JSON.parse(jsonMatch[0]);
        const profile: ProspectProfile = {
          id: `prospect_${Date.now()}`,
          companyName,
          industry: profileData.industry || 'Unknown',
          decisionMaker: profileData.decisionMaker || 'TBD',
          businessModel: profileData.businessModel || 'Standard',
          revenue: profileData.revenue || 'Unknown',
          painPoints: profileData.painPoints || [],
          previousInteractions: conversationData,
          competitiveIntel: profileData.competitiveIntel || [],
          personalDetails: profileData.personalDetails || [],
          preferredCommunication: profileData.preferredCommunication || 'email',
          urgency: profileData.urgency || 'medium',
          budget: profileData.budget || 'TBD',
          timeline: profileData.timeline || 'TBD',
          stakeholders: profileData.stakeholders || []
        };

        this.prospectProfiles.set(companyName, profile);
        return profile;
      }
    } catch (error) {
      console.error('Error building prospect profile:', error);
    }

    return this.getDefaultProfile(companyName);
  }

  // Advanced deal intelligence and strategy
  async generateDealIntelligence(profile: ProspectProfile, dealStage: string): Promise<DealIntelligence> {
    const prompt = `As a master sales strategist, analyze this prospect and provide comprehensive deal intelligence:

Prospect Profile:
Company: ${profile.companyName}
Industry: ${profile.industry}
Decision Maker: ${profile.decisionMaker}
Pain Points: ${profile.painPoints.join(', ')}
Budget: ${profile.budget}
Timeline: ${profile.timeline}
Deal Stage: ${dealStage}

Provide strategic intelligence including:
1. Competitor analysis - who else they're likely considering
2. Price anchoring strategies - how to position pricing
3. Value proposition alignment - benefits that resonate most
4. Objection handling - anticipated concerns and responses
5. Closing strategy - best approach for this prospect type
6. Follow-up plan - optimal touchpoint sequence

Focus on payment processing, merchant services, and financial technology solutions.
Return actionable strategies in JSON format.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const intelligence = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        competitorAnalysis: intelligence.competitorAnalysis || [],
        priceAnchoring: intelligence.priceAnchoring || [],
        valueProposition: intelligence.valueProposition || [],
        objectionHandling: intelligence.objectionHandling || [],
        closingStrategy: intelligence.closingStrategy || [],
        followUpPlan: intelligence.followUpPlan || []
      };
    } catch (error) {
      console.error('Error generating deal intelligence:', error);
      return this.getDefaultIntelligence();
    }
  }

  // Proactive opportunity identification
  async identifyOpportunities(conversationText: string, profile?: ProspectProfile): Promise<string[]> {
    const prompt = `As an expert sales opportunity analyst, identify hidden opportunities and strategic openings in this conversation:

Conversation: ${conversationText}
${profile ? `Prospect Context: ${JSON.stringify(profile)}` : ''}

Look for:
1. Upselling opportunities (additional services, higher-tier solutions)
2. Cross-selling possibilities (complementary products)
3. Expansion opportunities (other locations, departments)
4. Timing advantages (budget cycles, contract renewals)
5. Referral potential (other companies, decision makers)
6. Partnership opportunities (strategic alliances)
7. Implementation consulting (training, setup services)
8. Competitive displacement opportunities

Return specific, actionable opportunities with reasoning.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Extract opportunities from response
      const opportunities = content.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(line => line.length > 10);

      return opportunities.slice(0, 8);
    } catch (error) {
      console.error('Error identifying opportunities:', error);
      return ['Review conversation for expansion opportunities'];
    }
  }

  // Strategic conversation guidance
  async generateStrategicGuidance(
    conversationHistory: string[], 
    currentMessage: string, 
    profile?: ProspectProfile
  ): Promise<{
    nextBestAction: string;
    strategicQuestions: string[];
    powerMoves: string[];
    riskMitigation: string[];
  }> {
    const prompt = `As a master sales strategist (think Donna from Suits), analyze this sales conversation and provide strategic guidance:

Conversation History: ${conversationHistory.join('\n')}
Current Message: ${currentMessage}
${profile ? `Prospect Profile: ${JSON.stringify(profile)}` : ''}

Provide strategic guidance:
1. Next Best Action - single most impactful thing to do right now
2. Strategic Questions - 3-4 questions that advance the sale
3. Power Moves - bold actions that demonstrate value and expertise
4. Risk Mitigation - potential threats to the deal and how to address them

Focus on payment processing expertise, relationship building, and deal advancement.
Be specific and actionable.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const guidance = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        nextBestAction: guidance.nextBestAction || 'Continue discovery to understand needs better',
        strategicQuestions: guidance.strategicQuestions || [],
        powerMoves: guidance.powerMoves || [],
        riskMitigation: guidance.riskMitigation || []
      };
    } catch (error) {
      console.error('Error generating strategic guidance:', error);
      return this.getDefaultGuidance();
    }
  }

  // Market intelligence and competitive positioning
  async analyzeCompetitiveLandscape(industry: string, painPoints: string[]): Promise<string[]> {
    const prompt = `Analyze the competitive landscape for payment processing in the ${industry} industry:

Key Pain Points: ${painPoints.join(', ')}

Provide insights on:
1. Main competitors likely being considered
2. Competitive strengths and weaknesses
3. Differentiation opportunities
4. Positioning strategies
5. Pricing competitive advantages
6. Service level differentiators

Focus on merchant services, payment gateways, and POS systems.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      const insights = content.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(line => line.length > 10);

      this.competitiveIntel.set(industry, insights);
      return insights.slice(0, 6);
    } catch (error) {
      console.error('Error analyzing competitive landscape:', error);
      return ['Analyze competitive positioning for this industry'];
    }
  }

  // Relationship intelligence and rapport building
  async generateRapportStrategy(profile: ProspectProfile): Promise<string[]> {
    const strategies = [];
    
    // Personal connection strategies
    if (profile.personalDetails.length > 0) {
      strategies.push(`Personal connection: Reference ${profile.personalDetails[0]} to build rapport`);
    }
    
    // Industry expertise demonstration
    strategies.push(`Industry expertise: Share relevant ${profile.industry} case studies and benchmarks`);
    
    // Communication style adaptation
    strategies.push(`Communication: Match their ${profile.preferredCommunication} preference and pace`);
    
    // Value alignment
    if (profile.painPoints.length > 0) {
      strategies.push(`Value focus: Address their key concern about ${profile.painPoints[0]}`);
    }
    
    // Authority positioning
    strategies.push(`Authority: Position as the go-to expert for ${profile.industry} payment solutions`);
    
    return strategies;
  }

  // Deal timing and urgency optimization
  async optimizeDealTiming(profile: ProspectProfile, marketConditions: string[]): Promise<{
    urgencyFactors: string[];
    timingStrategy: string;
    deadlineApproach: string;
  }> {
    const urgencyFactors = [];
    
    // Budget cycle urgency
    if (profile.timeline.toLowerCase().includes('end of') || profile.timeline.toLowerCase().includes('deadline')) {
      urgencyFactors.push('Budget deadline pressure');
    }
    
    // Competitive pressure
    if (profile.competitiveIntel.length > 0) {
      urgencyFactors.push('Competitive evaluation timeline');
    }
    
    // Business impact urgency
    profile.painPoints.forEach(pain => {
      if (pain.toLowerCase().includes('losing') || pain.toLowerCase().includes('cost')) {
        urgencyFactors.push(`Business impact: ${pain}`);
      }
    });
    
    return {
      urgencyFactors,
      timingStrategy: profile.urgency === 'high' ? 'Fast-track decision process' : 'Build value before timeline',
      deadlineApproach: 'Create mutual timeline with milestone check-ins'
    };
  }

  getProspectProfile(companyName: string): ProspectProfile | undefined {
    return this.prospectProfiles.get(companyName);
  }

  private getDefaultProfile(companyName: string): ProspectProfile {
    return {
      id: `prospect_${Date.now()}`,
      companyName,
      industry: 'Unknown',
      decisionMaker: 'TBD',
      businessModel: 'Standard',
      revenue: 'Unknown',
      painPoints: [],
      previousInteractions: [],
      competitiveIntel: [],
      personalDetails: [],
      preferredCommunication: 'email',
      urgency: 'medium',
      budget: 'TBD',
      timeline: 'TBD',
      stakeholders: []
    };
  }

  private getDefaultIntelligence(): DealIntelligence {
    return {
      competitorAnalysis: ['Research competitive landscape'],
      priceAnchoring: ['Establish value before price discussion'],
      valueProposition: ['Focus on ROI and business impact'],
      objectionHandling: ['Prepare for common merchant services objections'],
      closingStrategy: ['Build consensus among stakeholders'],
      followUpPlan: ['Schedule regular check-ins']
    };
  }

  private getDefaultGuidance() {
    return {
      nextBestAction: 'Continue discovery to understand needs better',
      strategicQuestions: [
        'What specific challenges are you facing with your current setup?',
        'How is this impacting your business operations?',
        'What would an ideal solution look like for you?'
      ],
      powerMoves: ['Share relevant case study', 'Provide industry benchmark data'],
      riskMitigation: ['Address any concerns proactively', 'Maintain regular communication']
    };
  }
}

export const donnaAI = new DonnaAIEngine();