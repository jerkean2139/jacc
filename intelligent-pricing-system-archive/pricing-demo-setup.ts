import { db } from './db';
import { processorPricing, processorMarkups, interchangeRates } from '@shared/schema';
import { intelligentPricingEngine } from './intelligent-pricing-engine';
import { interchangeManager } from './interchange-rates';

export class PricingDemoSetup {
  
  async initializeTRXTracerPayDemo(): Promise<void> {
    try {
      // Initialize interchange rates
      await interchangeManager.initializeInterchangeRates();
      
      // Add TRX processor pricing data
      await this.setupTRXPricing();
      
      // Add TracerPay processor pricing data  
      await this.setupTracerPayPricing();
      
      // Add competitive processor markups
      await this.setupProcessorMarkups();
      
      console.log('✅ TRX and TracerPay pricing demo data initialized');
    } catch (error) {
      console.error('Error setting up pricing demo:', error);
    }
  }

  private async setupTRXPricing(): Promise<void> {
    const trxPricing = {
      processorName: 'TRX',
      pricingType: 'interchange_plus',
      qualifiedRate: '1.95', // Interchange + 0.15% markup
      midQualifiedRate: '2.25',
      nonQualifiedRate: '2.75',
      interchangePlus: '0.15', // 15 basis points over interchange
      authFee: '0.07',
      monthlyFee: '11.95',
      statementFee: '7.95',
      batchFee: '0.18',
      gatewayFee: '7.00',
      pciFee: '7.95',
      setupFee: '0.00', // No setup fee
      earlyTerminationFee: '0.00', // No ETF
      contractLength: 12,
      features: [
        'Transparent interchange-plus pricing',
        'No hidden fees',
        'ISO partnership focused',
        '24/7 customer support',
        'Real-time reporting',
        'Mobile payment acceptance'
      ],
      compatibleHardware: [
        'Ingenico terminals',
        'Verifone terminals', 
        'PAX terminals',
        'Clover systems',
        'Mobile card readers'
      ],
      isActive: true,
      updatedBy: 'system'
    };

    await db.insert(processorPricing).values(trxPricing).onConflictDoNothing();
  }

  private async setupTracerPayPricing(): Promise<void> {
    const tracerPayPricing = {
      processorName: 'TracerPay',
      pricingType: 'interchange_plus',
      qualifiedRate: '1.89', // Interchange + 0.09% markup (very competitive)
      midQualifiedRate: '2.19',
      nonQualifiedRate: '2.69',
      interchangePlus: '0.09', // 9 basis points over interchange
      authFee: '0.06',
      monthlyFee: '9.95',
      statementFee: '6.95',
      batchFee: '0.15',
      gatewayFee: '5.00',
      pciFee: '6.95',
      setupFee: '0.00', // No setup fee
      earlyTerminationFee: '0.00', // No ETF
      contractLength: 12,
      features: [
        'Industry-leading interchange-plus rates',
        'White-label gateway integration',
        'Accept Blue partnership',
        'Advanced fraud protection',
        'Same-day funding available',
        'Omnichannel processing',
        'API-first architecture'
      ],
      compatibleHardware: [
        'Accept Blue terminals',
        'Ingenico Move/5000',
        'PAX A920/A80',
        'Clover systems',
        'TracerFlex mobile solutions',
        'Custom integration hardware'
      ],
      isActive: true,
      updatedBy: 'system'
    };

    await db.insert(processorPricing).values(tracerPayPricing).onConflictDoNothing();
  }

  private async setupProcessorMarkups(): Promise<void> {
    const markupData = [
      // TRX markups by merchant type and volume
      {
        processorName: 'TRX',
        merchantType: 'retail',
        volumeTier: '10k-50k',
        creditMarkup: '0.15',
        debitMarkup: '0.08',
        authFeeMarkup: '0.07',
        averageEffectiveRate: '2.78',
        competitivePosition: 'competitive',
        dataSource: 'market_research',
        confidenceLevel: 8,
        updatedBy: 'system'
      },
      {
        processorName: 'TRX',
        merchantType: 'restaurant',
        volumeTier: '10k-50k',
        creditMarkup: '0.18',
        debitMarkup: '0.08',
        authFeeMarkup: '0.07',
        averageEffectiveRate: '2.81',
        competitivePosition: 'competitive',
        dataSource: 'market_research',
        confidenceLevel: 8,
        updatedBy: 'system'
      },
      // TracerPay markups - very aggressive pricing
      {
        processorName: 'TracerPay',
        merchantType: 'retail',
        volumeTier: '10k-50k',
        creditMarkup: '0.09',
        debitMarkup: '0.05',
        authFeeMarkup: '0.06',
        averageEffectiveRate: '2.65',
        competitivePosition: 'aggressive',
        dataSource: 'partner_data',
        confidenceLevel: 9,
        updatedBy: 'system'
      },
      {
        processorName: 'TracerPay',
        merchantType: 'restaurant',
        volumeTier: '10k-50k',
        creditMarkup: '0.12',
        debitMarkup: '0.05',
        authFeeMarkup: '0.06',
        averageEffectiveRate: '2.68',
        competitivePosition: 'aggressive',
        dataSource: 'partner_data',
        confidenceLevel: 9,
        updatedBy: 'system'
      },
      {
        processorName: 'TracerPay',
        merchantType: 'ecommerce',
        volumeTier: '50k-250k',
        creditMarkup: '0.08',
        debitMarkup: '0.05',
        authFeeMarkup: '0.05',
        averageEffectiveRate: '2.58',
        competitivePosition: 'aggressive',
        dataSource: 'partner_data',
        confidenceLevel: 9,
        updatedBy: 'system'
      },
      // Competitive comparisons
      {
        processorName: 'Clearent',
        merchantType: 'retail',
        volumeTier: '10k-50k',
        creditMarkup: '0.35',
        debitMarkup: '0.15',
        authFeeMarkup: '0.08',
        averageEffectiveRate: '2.85',
        competitivePosition: 'competitive',
        dataSource: 'market_research',
        confidenceLevel: 8,
        updatedBy: 'system'
      },
      {
        processorName: 'First Data',
        merchantType: 'retail',
        volumeTier: '10k-50k',
        creditMarkup: '0.45',
        debitMarkup: '0.20',
        authFeeMarkup: '0.10',
        averageEffectiveRate: '2.95',
        competitivePosition: 'premium',
        dataSource: 'industry_report',
        confidenceLevel: 7,
        updatedBy: 'system'
      }
    ];

    for (const markup of markupData) {
      await db.insert(processorMarkups).values(markup).onConflictDoNothing();
    }
  }

  // Generate sample merchant recommendation for demo
  async generateSampleRecommendation(): Promise<any> {
    const sampleMerchant = {
      businessType: 'restaurant',
      monthlyVolume: 75000,
      averageTicket: 45,
      creditPercent: 75,
      debitPercent: 25,
      cardPresentPercent: 90,
      ecommercePercent: 10,
      keyedPercent: 5,
      currentProcessor: 'First Data',
      currentRate: 2.95,
      riskLevel: 'low'
    };

    const recommendations = await intelligentPricingEngine.generateProcessorRecommendations(sampleMerchant);
    const competitiveAnalysis = await intelligentPricingEngine.generateCompetitiveAnalysis(sampleMerchant);

    return {
      merchantProfile: sampleMerchant,
      recommendations: recommendations.slice(0, 3),
      competitiveAnalysis,
      demoInsights: {
        tracerPayAdvantage: this.calculateTracerPayAdvantage(recommendations),
        trxComparison: this.calculateTRXComparison(recommendations),
        marketPosition: this.analyzeMarketPosition(recommendations)
      }
    };
  }

  private calculateTracerPayAdvantage(recommendations: any[]): any {
    const tracerPay = recommendations.find(r => r.processorName === 'TracerPay');
    const competitors = recommendations.filter(r => r.processorName !== 'TracerPay');
    
    if (!tracerPay || competitors.length === 0) return null;

    const avgCompetitorCost = competitors.reduce((sum, r) => sum + r.totalMonthlyCost, 0) / competitors.length;
    const savings = avgCompetitorCost - tracerPay.totalMonthlyCost;
    const savingsPercent = (savings / avgCompetitorCost) * 100;

    return {
      monthlySavings: Math.round(savings),
      annualSavings: Math.round(savings * 12),
      savingsPercent: Math.round(savingsPercent * 10) / 10,
      competitiveAdvantages: [
        'Lowest interchange markup in the industry (0.09%)',
        'Accept Blue white-label partnership',
        'Advanced API integration capabilities',
        'Same-day funding available'
      ]
    };
  }

  private calculateTRXComparison(recommendations: any[]): any {
    const trx = recommendations.find(r => r.processorName === 'TRX');
    const tracerPay = recommendations.find(r => r.processorName === 'TracerPay');
    
    if (!trx || !tracerPay) return null;

    const costDifference = trx.totalMonthlyCost - tracerPay.totalMonthlyCost;
    const rateDifference = trx.estimatedRate - tracerPay.estimatedRate;

    return {
      costDifference: Math.round(costDifference),
      rateDifference: Math.round(rateDifference * 10000) / 100, // basis points
      trxStrengths: [
        'ISO partnership focus',
        'Transparent pricing model',
        'No hidden fees',
        'Strong customer support'
      ],
      tracerPayAdvantages: [
        'Lower interchange markup',
        'More advanced technology platform',
        'Better gateway integration',
        'Superior API capabilities'
      ]
    };
  }

  private analyzeMarketPosition(recommendations: any[]): any {
    const sortedByRate = recommendations.sort((a, b) => a.estimatedRate - b.estimatedRate);
    const marketAverage = recommendations.reduce((sum, r) => sum + r.estimatedRate, 0) / recommendations.length;

    return {
      marketLeader: sortedByRate[0]?.processorName,
      marketAverage: Math.round(marketAverage * 100) / 100,
      competitiveSpread: Math.round((sortedByRate[sortedByRate.length - 1]?.estimatedRate - sortedByRate[0]?.estimatedRate) * 100) / 100,
      industryInsights: [
        'TracerPay offers the most competitive interchange-plus pricing',
        'TRX provides excellent value with transparent fee structure',
        'Traditional processors like First Data charge premium rates',
        'Savings opportunity ranges from $200-800+ monthly for mid-market merchants'
      ]
    };
  }
}

export const pricingDemoSetup = new PricingDemoSetup();