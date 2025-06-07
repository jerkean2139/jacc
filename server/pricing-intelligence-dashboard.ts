import { db } from './db';
import { processorPricing, interchangeRates, processorMarkups } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { intelligentPricingEngine } from './intelligent-pricing-engine';
import { interchangeManager } from './interchange-rates';

export interface MarketIntelligence {
  interchangeUpdate: {
    lastUpdate: string;
    nextUpdate: string;
    recentChanges: Array<{
      category: string;
      oldRate: number;
      newRate: number;
      impact: string;
    }>;
  };
  processorCompetitiveness: Array<{
    processorName: string;
    overallRating: number;
    strengthAreas: string[];
    pricingPosition: string;
    marketShare: string;
  }>;
  industryTrends: {
    averageRates: Record<string, number>;
    pricingTransparency: string;
    competitiveLandscape: string;
  };
}

export class PricingIntelligenceDashboard {
  
  async getMarketIntelligence(): Promise<MarketIntelligence> {
    try {
      const interchangeRates = await interchangeManager.getCurrentInterchangeRates();
      const processorMarkups = await this.getProcessorMarkups();
      
      return {
        interchangeUpdate: this.getInterchangeUpdateInfo(),
        processorCompetitiveness: this.analyzeProcessorCompetitiveness(processorMarkups),
        industryTrends: this.analyzeIndustryTrends(interchangeRates, processorMarkups)
      };
    } catch (error) {
      console.error('Error generating market intelligence:', error);
      throw error;
    }
  }

  private getInterchangeUpdateInfo() {
    // Visa/MC updates rates in April and October
    const now = new Date();
    const currentYear = now.getFullYear();
    const aprilUpdate = new Date(currentYear, 3, 1); // April 1st
    const octoberUpdate = new Date(currentYear, 9, 1); // October 1st
    
    let lastUpdate: Date;
    let nextUpdate: Date;
    
    if (now >= octoberUpdate) {
      lastUpdate = octoberUpdate;
      nextUpdate = new Date(currentYear + 1, 3, 1);
    } else if (now >= aprilUpdate) {
      lastUpdate = aprilUpdate;
      nextUpdate = octoberUpdate;
    } else {
      lastUpdate = new Date(currentYear - 1, 9, 1);
      nextUpdate = aprilUpdate;
    }

    return {
      lastUpdate: lastUpdate.toISOString().split('T')[0],
      nextUpdate: nextUpdate.toISOString().split('T')[0],
      recentChanges: [
        {
          category: 'CPS/eCommerce Basic',
          oldRate: 1.65,
          newRate: 1.80,
          impact: 'Moderate increase affecting online retailers'
        },
        {
          category: 'Visa Traditional Rewards',
          oldRate: 1.58,
          newRate: 1.65,
          impact: 'Small increase for rewards cards'
        }
      ]
    };
  }

  private async getProcessorMarkups(): Promise<any[]> {
    try {
      return await db.select().from(processorMarkups);
    } catch (error) {
      return [];
    }
  }

  private analyzeProcessorCompetitiveness(markups: any[]) {
    const processorGroups = this.groupByProcessor(markups);
    
    return Object.entries(processorGroups).map(([processorName, data]: [string, any]) => {
      const avgMarkup = data.reduce((sum: number, item: any) => 
        sum + parseFloat(item.creditMarkup), 0) / data.length;
      
      const competitiveScore = this.calculateCompetitiveScore(avgMarkup, data);
      
      return {
        processorName,
        overallRating: competitiveScore,
        strengthAreas: this.identifyStrengths(processorName, data),
        pricingPosition: this.determinePricingPosition(avgMarkup),
        marketShare: this.estimateMarketShare(processorName)
      };
    });
  }

  private groupByProcessor(markups: any[]): Record<string, any[]> {
    return markups.reduce((groups, markup) => {
      const processor = markup.processorName;
      if (!groups[processor]) groups[processor] = [];
      groups[processor].push(markup);
      return groups;
    }, {});
  }

  private calculateCompetitiveScore(avgMarkup: number, data: any[]): number {
    // Lower markup = higher score (more competitive)
    const markupScore = Math.max(0, 10 - (avgMarkup * 20)); // 0.35% markup = 3 points
    const confidenceScore = data.reduce((sum, item) => sum + item.confidenceLevel, 0) / data.length;
    
    return Math.round((markupScore + confidenceScore) / 2);
  }

  private identifyStrengths(processorName: string, data: any[]): string[] {
    const strengths: string[] = [];
    
    const avgMarkup = data.reduce((sum, item) => sum + parseFloat(item.creditMarkup), 0) / data.length;
    if (avgMarkup < 0.30) strengths.push('Competitive Pricing');
    
    const hasAggressivePositions = data.some(item => item.competitivePosition === 'aggressive');
    if (hasAggressivePositions) strengths.push('Market Leadership');
    
    const highConfidence = data.every(item => item.confidenceLevel >= 7);
    if (highConfidence) strengths.push('Reliable Data');
    
    // Processor-specific strengths
    switch (processorName.toLowerCase()) {
      case 'clearent':
        strengths.push('Transparent Pricing', 'No Hidden Fees');
        break;
      case 'first data':
      case 'fiserv':
        strengths.push('Enterprise Grade', 'Established Network');
        break;
      case 'tsys':
        strengths.push('Technology Innovation', 'Large Volume Discounts');
        break;
      case 'worldpay':
        strengths.push('Global Reach', 'Omnichannel Solutions');
        break;
    }
    
    return strengths.slice(0, 3); // Limit to top 3
  }

  private determinePricingPosition(avgMarkup: number): string {
    if (avgMarkup < 0.25) return 'Aggressive';
    if (avgMarkup < 0.35) return 'Competitive';
    if (avgMarkup < 0.50) return 'Market Rate';
    return 'Premium';
  }

  private estimateMarketShare(processorName: string): string {
    // Industry estimates based on market research
    const marketShares: Record<string, string> = {
      'First Data': 'Large (15-20%)',
      'Fiserv': 'Large (15-20%)',
      'Chase Paymentech': 'Large (10-15%)',
      'Worldpay': 'Medium (5-10%)',
      'TSYS': 'Medium (5-10%)',
      'Heartland': 'Medium (3-7%)',
      'Clearent': 'Small (1-3%)',
      'North American Bancard': 'Small (1-3%)',
      'MiCamp': 'Small (<1%)',
      'Priority Payments': 'Small (<1%)',
      'TRX': 'Small (<1%)',
      'Total Merchant Services': 'Small (<1%)',
      'PayBright': 'Small (<1%)'
    };
    
    return marketShares[processorName] || 'Emerging (<1%)';
  }

  private analyzeIndustryTrends(interchangeRates: any, markups: any[]) {
    const avgRates: Record<string, number> = {};
    
    // Calculate average effective rates by merchant type
    const merchantTypes = ['retail', 'restaurant', 'ecommerce', 'hotel'];
    
    merchantTypes.forEach(type => {
      const typeMarkups = markups.filter(m => m.merchantType === type);
      if (typeMarkups.length > 0) {
        const avgMarkup = typeMarkups.reduce((sum, m) => 
          sum + parseFloat(m.averageEffectiveRate), 0) / typeMarkups.length;
        avgRates[type] = Math.round(avgMarkup * 100) / 100;
      }
    });

    return {
      averageRates: avgRates,
      pricingTransparency: 'Increasing - More processors adopting interchange-plus models',
      competitiveLandscape: 'Highly competitive with focus on technology and transparency'
    };
  }

  // Generate merchant-specific pricing recommendations
  async generateMerchantRecommendation(merchantData: any): Promise<any> {
    try {
      const profile = {
        businessType: merchantData.businessType || 'retail',
        monthlyVolume: parseFloat(merchantData.monthlyVolume) || 50000,
        averageTicket: parseFloat(merchantData.averageTicket) || 75,
        transactionMix: {
          creditPercent: merchantData.creditPercent || 70,
          debitPercent: merchantData.debitPercent || 30,
          cardPresentPercent: merchantData.cardPresentPercent || 80,
          ecommercePercent: merchantData.ecommercePercent || 20,
          keyedPercent: merchantData.keyedPercent || 10
        },
        currentProcessor: merchantData.currentProcessor,
        currentRate: parseFloat(merchantData.currentRate),
        riskLevel: merchantData.riskLevel || 'low'
      };

      const recommendations = await intelligentPricingEngine.generateProcessorRecommendations(profile);
      const competitiveAnalysis = await intelligentPricingEngine.generateCompetitiveAnalysis(profile);
      
      return {
        merchantProfile: profile,
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        competitiveAnalysis,
        implementationGuidance: this.generateImplementationGuidance(recommendations[0]),
        nextSteps: this.generateNextSteps(profile, recommendations[0])
      };
    } catch (error) {
      console.error('Error generating merchant recommendation:', error);
      throw error;
    }
  }

  private generateImplementationGuidance(topRecommendation: any) {
    return {
      timeframe: '7-14 business days',
      requiredDocuments: [
        'Last 3 months processing statements',
        'Business license or articles of incorporation',
        'Voided business check',
        'Government-issued photo ID'
      ],
      setupProcess: [
        'Submit application with required documents',
        'Underwriting review (1-3 business days)',
        'Equipment programming and testing',
        'Go-live with support team monitoring'
      ],
      potentialChallenges: [
        'Underwriting may require additional documentation for high-risk industries',
        'Equipment compatibility should be verified before switching',
        'Staff training on new payment processes may be needed'
      ]
    };
  }

  private generateNextSteps(profile: any, recommendation: any) {
    const steps = [
      'Review the competitive analysis with decision makers',
      'Gather required documentation for application'
    ];

    if (profile.currentProcessor) {
      steps.push('Review current contract terms and early termination fees');
      steps.push('Plan transition timeline to minimize business disruption');
    }

    steps.push('Schedule implementation call with recommended processor');
    steps.push('Coordinate equipment testing and staff training');

    return steps;
  }
}

export const pricingIntelligenceDashboard = new PricingIntelligenceDashboard();