import { db } from './db';
import { processorPricing, interchangeRates, processorMarkups } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { interchangeManager } from './interchange-rates';

export interface MerchantProfile {
  businessType: string; // restaurant, retail, ecommerce, hotel, etc.
  monthlyVolume: number;
  averageTicket: number;
  transactionMix: {
    creditPercent: number;
    debitPercent: number;
    cardPresentPercent: number;
    ecommercePercent: number;
    keyedPercent: number;
  };
  currentProcessor?: string;
  currentRate?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ProcessorRecommendation {
  processorName: string;
  estimatedRate: number;
  monthlyFees: number;
  setupFees: number;
  totalMonthlyCost: number;
  annualSavings: number;
  competitivePosition: string;
  confidenceLevel: number;
  reasoning: string[];
  breakdown: {
    interchangeCost: number;
    processorMarkup: number;
    assessmentFees: number;
    monthlyFees: number;
    transactionFees: number;
  };
}

export class IntelligentPricingEngine {
  
  async generateProcessorRecommendations(merchant: MerchantProfile): Promise<ProcessorRecommendation[]> {
    try {
      // Get current interchange rates
      const interchangeRates = await interchangeManager.getCurrentInterchangeRates();
      
      // Estimate interchange category based on merchant profile
      const primaryCategory = this.estimateInterchangeCategory(merchant);
      const baseInterchangeCost = interchangeRates[primaryCategory] || 1.80;
      
      // Get processor markups from database
      const markups = await this.getProcessorMarkups(merchant);
      
      // Generate recommendations for each processor
      const recommendations: ProcessorRecommendation[] = [];
      
      for (const markup of markups) {
        const recommendation = await this.calculateProcessorRecommendation(
          merchant,
          markup,
          baseInterchangeCost
        );
        recommendations.push(recommendation);
      }
      
      // Sort by total monthly cost (best value first)
      return recommendations.sort((a, b) => a.totalMonthlyCost - b.totalMonthlyCost);
      
    } catch (error) {
      console.error('Error generating processor recommendations:', error);
      return [];
    }
  }

  private async getProcessorMarkups(merchant: MerchantProfile): Promise<any[]> {
    try {
      const volumeTier = this.getVolumeTier(merchant.monthlyVolume);
      
      const markups = await db.select()
        .from(processorMarkups)
        .where(
          and(
            eq(processorMarkups.merchantType, merchant.businessType),
            eq(processorMarkups.volumeTier, volumeTier)
          )
        );

      // If no specific markups found, get general markups
      if (markups.length === 0) {
        return await db.select()
          .from(processorMarkups)
          .where(eq(processorMarkups.volumeTier, volumeTier));
      }

      return markups;
    } catch (error) {
      console.error('Error fetching processor markups:', error);
      return [];
    }
  }

  private async calculateProcessorRecommendation(
    merchant: MerchantProfile,
    markup: any,
    baseInterchangeCost: number
  ): Promise<ProcessorRecommendation> {
    
    // Calculate weighted average processing cost
    const creditCost = baseInterchangeCost + parseFloat(markup.creditMarkup);
    const debitCost = 0.05 + parseFloat(markup.debitMarkup); // Debit interchange is regulated at ~$0.05
    
    const weightedProcessingCost = 
      (creditCost * merchant.transactionMix.creditPercent / 100) +
      (debitCost * merchant.transactionMix.debitPercent / 100);

    // Add assessment fees (Visa ~0.14%, MC ~0.1375%)
    const assessmentFees = 0.14; // Average assessment fee
    
    // Calculate transaction volume costs
    const monthlyTransactions = merchant.monthlyVolume / merchant.averageTicket;
    const authFees = monthlyTransactions * parseFloat(markup.authFeeMarkup);
    
    // Get processor-specific monthly fees
    const processor = await this.getProcessorDetails(markup.processorName);
    const monthlyFees = processor ? parseFloat(processor.monthlyFee) + parseFloat(processor.statementFee) : 25;
    
    // Calculate total costs
    const processingCosts = merchant.monthlyVolume * (weightedProcessingCost + assessmentFees) / 100;
    const totalMonthlyCost = processingCosts + authFees + monthlyFees;
    
    // Calculate savings vs current processor
    const currentMonthlyCost = merchant.currentRate ? 
      (merchant.monthlyVolume * merchant.currentRate / 100) + monthlyFees : 
      totalMonthlyCost * 1.3; // Assume 30% higher if no current rate
    
    const annualSavings = (currentMonthlyCost - totalMonthlyCost) * 12;
    
    return {
      processorName: markup.processorName,
      estimatedRate: weightedProcessingCost + assessmentFees,
      monthlyFees,
      setupFees: processor?.setupFee ? parseFloat(processor.setupFee) : 0,
      totalMonthlyCost,
      annualSavings: Math.max(0, annualSavings),
      competitivePosition: markup.competitivePosition,
      confidenceLevel: markup.confidenceLevel,
      reasoning: this.generateRecommendationReasoning(merchant, markup, totalMonthlyCost),
      breakdown: {
        interchangeCost: baseInterchangeCost,
        processorMarkup: parseFloat(markup.creditMarkup),
        assessmentFees,
        monthlyFees,
        transactionFees: authFees
      }
    };
  }

  private async getProcessorDetails(processorName: string): Promise<any> {
    try {
      const [processor] = await db.select()
        .from(processorPricing)
        .where(eq(processorPricing.processorName, processorName));
      return processor;
    } catch (error) {
      return null;
    }
  }

  private estimateInterchangeCategory(merchant: MerchantProfile): string {
    const { businessType, averageTicket, transactionMix } = merchant;
    
    // If mostly card not present
    if (transactionMix.ecommercePercent > 70) {
      return averageTicket > 50 ? 'CPS/eCommerce Preferred' : 'CPS/eCommerce Basic';
    }
    
    if (transactionMix.keyedPercent > 50) {
      return 'CPS/Card Not Present';
    }
    
    // Small ticket transactions
    if (averageTicket < 15) {
      return 'CPS/Small Ticket';
    }
    
    // Business type specific categories
    switch (businessType.toLowerCase()) {
      case 'restaurant':
      case 'food_service':
        return 'CPS/Restaurant';
      case 'hotel':
      case 'lodging':
        return 'CPS/Hotel';
      case 'gas_station':
      case 'fuel':
        return 'CPS/Service Station';
      case 'grocery':
      case 'supermarket':
        return 'CPS/Supermarket';
      case 'retail':
      default:
        return 'CPS/Retail';
    }
  }

  private getVolumeTier(monthlyVolume: number): string {
    if (monthlyVolume < 10000) return '0-10k';
    if (monthlyVolume < 50000) return '10k-50k';
    if (monthlyVolume < 250000) return '50k-250k';
    return '250k+';
  }

  private generateRecommendationReasoning(
    merchant: MerchantProfile,
    markup: any,
    totalCost: number
  ): string[] {
    const reasons: string[] = [];
    
    if (markup.competitivePosition === 'aggressive') {
      reasons.push('Highly competitive pricing with below-market markups');
    }
    
    if (merchant.monthlyVolume > 100000) {
      reasons.push('Volume qualifies for preferred pricing tier');
    }
    
    if (merchant.riskLevel === 'low') {
      reasons.push('Low-risk profile enables best available rates');
    }
    
    if (merchant.transactionMix.debitPercent > 40) {
      reasons.push('High debit mix reduces overall processing costs');
    }
    
    if (markup.confidenceLevel >= 8) {
      reasons.push('Pricing data verified through recent market analysis');
    }
    
    return reasons;
  }

  // Initialize processor markup data with industry intelligence
  async initializeProcessorMarkups(): Promise<void> {
    try {
      const markupData = [
        // Clearent - Transparent pricing, competitive
        {
          processorName: 'Clearent',
          merchantType: 'retail',
          volumeTier: '10k-50k',
          creditMarkup: 0.35,
          debitMarkup: 0.15,
          authFeeMarkup: 0.08,
          averageEffectiveRate: 2.85,
          competitivePosition: 'competitive',
          dataSource: 'market_research',
          confidenceLevel: 8,
          updatedBy: 'system'
        },
        {
          processorName: 'Clearent',
          merchantType: 'restaurant',
          volumeTier: '10k-50k',
          creditMarkup: 0.32,
          debitMarkup: 0.15,
          authFeeMarkup: 0.08,
          averageEffectiveRate: 2.82,
          competitivePosition: 'competitive',
          dataSource: 'market_research',
          confidenceLevel: 8,
          updatedBy: 'system'
        },
        // First Data/Fiserv - Premium but established
        {
          processorName: 'First Data',
          merchantType: 'retail',
          volumeTier: '50k-250k',
          creditMarkup: 0.45,
          debitMarkup: 0.20,
          authFeeMarkup: 0.10,
          averageEffectiveRate: 2.95,
          competitivePosition: 'premium',
          dataSource: 'industry_report',
          confidenceLevel: 9,
          updatedBy: 'system'
        },
        // TSYS - Competitive for larger volumes
        {
          processorName: 'TSYS',
          merchantType: 'retail',
          volumeTier: '250k+',
          creditMarkup: 0.25,
          debitMarkup: 0.12,
          authFeeMarkup: 0.07,
          averageEffectiveRate: 2.65,
          competitivePosition: 'aggressive',
          dataSource: 'client_analysis',
          confidenceLevel: 9,
          updatedBy: 'system'
        }
      ];

      for (const markup of markupData) {
        await db.insert(processorMarkups).values(markup).onConflictDoNothing();
      }

      console.log('✅ Processor markup intelligence initialized');
    } catch (error) {
      console.error('Error initializing processor markups:', error);
    }
  }

  // Competitive analysis for sales presentations
  async generateCompetitiveAnalysis(merchant: MerchantProfile): Promise<any> {
    const recommendations = await this.generateProcessorRecommendations(merchant);
    
    if (recommendations.length === 0) {
      return { error: 'Unable to generate competitive analysis' };
    }

    const bestOption = recommendations[0];
    const currentCost = merchant.currentRate ? 
      merchant.monthlyVolume * merchant.currentRate / 100 : 
      bestOption.totalMonthlyCost * 1.3;

    return {
      currentSituation: {
        processor: merchant.currentProcessor || 'Current Processor',
        estimatedMonthlyCost: currentCost,
        estimatedAnnualCost: currentCost * 12
      },
      recommendedSolution: bestOption,
      competitiveComparison: recommendations.slice(0, 3),
      marketIntelligence: {
        averageMarketRate: this.calculateMarketAverage(recommendations),
        yourPosition: this.assessCompetitivePosition(bestOption, recommendations),
        savingsOpportunity: bestOption.annualSavings
      },
      implementationPlan: {
        setupTimeframe: '7-14 business days',
        requiredDocuments: ['Voided check', 'Business license', 'Recent statements'],
        ongoingSupport: '24/7 customer service and dedicated account management'
      }
    };
  }

  private calculateMarketAverage(recommendations: ProcessorRecommendation[]): number {
    const totalCosts = recommendations.reduce((sum, rec) => sum + rec.totalMonthlyCost, 0);
    return totalCosts / recommendations.length;
  }

  private assessCompetitivePosition(
    recommended: ProcessorRecommendation,
    allOptions: ProcessorRecommendation[]
  ): string {
    const averageCost = this.calculateMarketAverage(allOptions);
    const savings = ((averageCost - recommended.totalMonthlyCost) / averageCost) * 100;
    
    if (savings > 15) return 'Excellent - significantly below market average';
    if (savings > 5) return 'Good - below market average';
    if (savings > -5) return 'Competitive - at market rate';
    return 'Premium - above market average but with additional value';
  }
}

export const intelligentPricingEngine = new IntelligentPricingEngine();