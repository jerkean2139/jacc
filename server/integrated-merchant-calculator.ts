import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MerchantProfile {
  businessName: string;
  dba?: string;
  industry: string;
  businessType: 'retail' | 'restaurant' | 'ecommerce' | 'service' | 'healthcare' | 'automotive' | 'other';
  monthlyVolume: number;
  averageTicket: number;
  transactionCount: number;
  cardPresentPercentage: number;
  seasonalVariation?: number;
  riskFactors?: string[];
}

export interface ProcessorData {
  name: string;
  type: 'interchange_plus' | 'tiered' | 'flat_rate' | 'subscription';
  pricing: {
    qualifiedRate: number;
    midQualifiedRate?: number;
    nonQualifiedRate?: number;
    interchangePlus?: number;
    authFee: number;
    monthlyFee: number;
    statementFee: number;
    batchFee: number;
    gatewayFee?: number;
    pciFee?: number;
  };
  equipment: {
    terminalLease?: number;
    gatewayFee?: number;
    setupFee?: number;
  };
  contractTerms: {
    length: number;
    earlyTerminationFee: number;
    cancellationPeriod: number;
  };
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
}

export interface CostAnalysis {
  monthlyProcessingCosts: number;
  monthlyFees: number;
  monthlyEquipment: number;
  totalMonthlyCost: number;
  annualCost: number;
  effectiveRate: number;
  breakdown: {
    qualifiedVolume: number;
    midQualifiedVolume: number;
    nonQualifiedVolume: number;
    qualifiedCost: number;
    midQualifiedCost: number;
    nonQualifiedCost: number;
  };
}

export interface SavingsComparison {
  currentProcessor: ProcessorData;
  proposedProcessor: ProcessorData;
  currentCosts: CostAnalysis;
  proposedCosts: CostAnalysis;
  monthlySavings: number;
  annualSavings: number;
  paybackPeriod: number;
  roi: number;
  savingsPercentage: number;
  recommendations: string[];
}

export interface EquipmentOption {
  id: string;
  name: string;
  category: 'terminal' | 'mobile' | 'virtual' | 'gateway' | 'pos_system';
  manufacturer: string;
  model: string;
  price: number;
  monthlyLease?: number;
  features: string[];
  compatibility: string[];
  bestFor: string[];
  specifications: Record<string, any>;
}

export class IntegratedMerchantCalculator {
  private processors: ProcessorData[] = [
    {
      name: 'TracerPay',
      type: 'interchange_plus',
      pricing: {
        qualifiedRate: 0.0189,
        interchangePlus: 0.0025,
        authFee: 0.10,
        monthlyFee: 15,
        statementFee: 5,
        batchFee: 0.00,
        gatewayFee: 10,
        pciFee: 8.95
      },
      equipment: {
        terminalLease: 25,
        gatewayFee: 10,
        setupFee: 0
      },
      contractTerms: {
        length: 12,
        earlyTerminationFee: 295,
        cancellationPeriod: 30
      },
      strengths: ['Competitive interchange-plus pricing', 'No setup fees', 'Local support'],
      weaknesses: ['Newer processor', 'Limited equipment options'],
      bestFor: ['Small to medium businesses', 'Retail', 'Restaurants']
    },
    {
      name: 'Accept Blue',
      type: 'interchange_plus',
      pricing: {
        qualifiedRate: 0.0205,
        interchangePlus: 0.0035,
        authFee: 0.12,
        monthlyFee: 19.95,
        statementFee: 7.95,
        batchFee: 0.00,
        gatewayFee: 15,
        pciFee: 9.95
      },
      equipment: {
        terminalLease: 29.95,
        gatewayFee: 15,
        setupFee: 99
      },
      contractTerms: {
        length: 24,
        earlyTerminationFee: 395,
        cancellationPeriod: 30
      },
      strengths: ['Established processor', 'Good equipment selection', 'Multi-channel support'],
      weaknesses: ['Higher monthly fees', 'Setup costs'],
      bestFor: ['Multi-location businesses', 'E-commerce', 'High volume merchants']
    },
    {
      name: 'Square',
      type: 'flat_rate',
      pricing: {
        qualifiedRate: 0.0265,
        authFee: 0.00,
        monthlyFee: 0,
        statementFee: 0,
        batchFee: 0.00
      },
      equipment: {
        terminalLease: 0,
        setupFee: 0
      },
      contractTerms: {
        length: 0,
        earlyTerminationFee: 0,
        cancellationPeriod: 0
      },
      strengths: ['No monthly fees', 'Easy setup', 'Integrated POS'],
      weaknesses: ['Higher effective rates', 'Limited customization'],
      bestFor: ['New businesses', 'Low volume', 'Simple needs']
    },
    {
      name: 'Stripe',
      type: 'flat_rate',
      pricing: {
        qualifiedRate: 0.0290,
        authFee: 0.30,
        monthlyFee: 0,
        statementFee: 0,
        batchFee: 0.00
      },
      equipment: {
        terminalLease: 0,
        setupFee: 0
      },
      contractTerms: {
        length: 0,
        earlyTerminationFee: 0,
        cancellationPeriod: 0
      },
      strengths: ['Developer-friendly', 'Global reach', 'Advanced features'],
      weaknesses: ['Higher per-transaction costs', 'Online-focused'],
      bestFor: ['E-commerce', 'SaaS businesses', 'International sales']
    },
    {
      name: 'First Data',
      type: 'tiered',
      pricing: {
        qualifiedRate: 0.0289,
        midQualifiedRate: 0.0325,
        nonQualifiedRate: 0.0395,
        authFee: 0.15,
        monthlyFee: 25,
        statementFee: 10,
        batchFee: 0.25,
        gatewayFee: 20,
        pciFee: 12.95
      },
      equipment: {
        terminalLease: 35,
        gatewayFee: 20,
        setupFee: 199
      },
      contractTerms: {
        length: 36,
        earlyTerminationFee: 495,
        cancellationPeriod: 30
      },
      strengths: ['Enterprise-grade', 'Extensive equipment', 'Global processing'],
      weaknesses: ['Higher costs', 'Complex pricing', 'Long contracts'],
      bestFor: ['Large businesses', 'Enterprise', 'Multi-national']
    }
  ];

  private equipmentCatalog: EquipmentOption[] = [
    {
      id: 'pax_a920_pro',
      name: 'PAX A920 Pro',
      category: 'terminal',
      manufacturer: 'PAX',
      model: 'A920 Pro',
      price: 299,
      monthlyLease: 25,
      features: ['EMV', 'NFC', 'WiFi', 'LTE', '5" Touchscreen', 'Camera', 'Printer'],
      compatibility: ['TracerPay', 'Accept Blue', 'First Data'],
      bestFor: ['Retail', 'Restaurants', 'Mobile businesses'],
      specifications: {
        display: '5 inch color touchscreen',
        connectivity: 'WiFi, Bluetooth, LTE',
        payment_methods: 'EMV, NFC, Magnetic stripe',
        battery: 'All-day battery life',
        printer: 'Built-in thermal printer'
      }
    },
    {
      id: 'ingenico_move5000',
      name: 'Ingenico Move/5000',
      category: 'terminal',
      manufacturer: 'Ingenico',
      model: 'Move/5000',
      price: 249,
      monthlyLease: 22,
      features: ['EMV', 'NFC', 'WiFi', 'Bluetooth', '2.8" Display', 'Printer'],
      compatibility: ['TracerPay', 'Accept Blue', 'First Data'],
      bestFor: ['Retail', 'Small businesses', 'Counter service'],
      specifications: {
        display: '2.8 inch color display',
        connectivity: 'WiFi, Bluetooth',
        payment_methods: 'EMV, NFC, Magnetic stripe',
        battery: '8+ hours continuous use',
        printer: 'Integrated receipt printer'
      }
    },
    {
      id: 'clover_flex',
      name: 'Clover Flex',
      category: 'pos_system',
      manufacturer: 'Clover',
      model: 'Flex',
      price: 169,
      monthlyLease: 18,
      features: ['EMV', 'NFC', 'WiFi', 'LTE', 'Barcode Scanner', 'Camera', 'POS Software'],
      compatibility: ['First Data'],
      bestFor: ['Restaurants', 'Retail', 'Service businesses'],
      specifications: {
        display: '7 inch HD touchscreen',
        connectivity: 'WiFi, LTE, Bluetooth',
        payment_methods: 'EMV, NFC, Magnetic stripe',
        features: 'Inventory management, Employee management',
        software: 'Full POS system included'
      }
    },
    {
      id: 'square_reader',
      name: 'Square Reader for Magstripe',
      category: 'mobile',
      manufacturer: 'Square',
      model: 'Reader',
      price: 0,
      features: ['Magnetic stripe', 'Mobile app', 'Free card reader'],
      compatibility: ['Square'],
      bestFor: ['Mobile businesses', 'Startups', 'Occasional sales'],
      specifications: {
        connectivity: '3.5mm audio jack',
        payment_methods: 'Magnetic stripe only',
        app: 'Square Point of Sale app',
        cost: 'Free with account'
      }
    }
  ];

  async calculateCosts(merchantProfile: MerchantProfile, processor: ProcessorData): Promise<CostAnalysis> {
    const { monthlyVolume, cardPresentPercentage } = merchantProfile;
    
    // Calculate transaction mix based on business type and card present percentage
    const qualifiedPercentage = this.getQualifiedPercentage(merchantProfile, processor);
    const midQualifiedPercentage = processor.type === 'tiered' ? 0.20 : 0;
    const nonQualifiedPercentage = processor.type === 'tiered' ? (1 - qualifiedPercentage - midQualifiedPercentage) : 0;
    
    const qualifiedVolume = monthlyVolume * qualifiedPercentage;
    const midQualifiedVolume = monthlyVolume * midQualifiedPercentage;
    const nonQualifiedVolume = monthlyVolume * nonQualifiedPercentage;
    
    // Calculate processing costs based on processor type
    let qualifiedCost = 0;
    let midQualifiedCost = 0;
    let nonQualifiedCost = 0;
    
    if (processor.type === 'tiered') {
      qualifiedCost = qualifiedVolume * processor.pricing.qualifiedRate;
      midQualifiedCost = midQualifiedVolume * (processor.pricing.midQualifiedRate || 0);
      nonQualifiedCost = nonQualifiedVolume * (processor.pricing.nonQualifiedRate || 0);
    } else if (processor.type === 'interchange_plus') {
      // Simulate interchange costs + markup
      const avgInterchangeRate = 0.0165; // Industry average
      qualifiedCost = monthlyVolume * (avgInterchangeRate + processor.pricing.interchangePlus!);
    } else {
      // Flat rate
      qualifiedCost = monthlyVolume * processor.pricing.qualifiedRate;
    }
    
    const monthlyProcessingCosts = qualifiedCost + midQualifiedCost + nonQualifiedCost;
    
    // Add per-transaction fees
    const transactionFees = merchantProfile.transactionCount * processor.pricing.authFee;
    
    // Monthly fees
    const monthlyFees = processor.pricing.monthlyFee + 
                       processor.pricing.statementFee + 
                       (processor.pricing.gatewayFee || 0) + 
                       (processor.pricing.pciFee || 0);
    
    // Equipment costs
    const monthlyEquipment = processor.equipment.terminalLease || 0;
    
    const totalMonthlyCost = monthlyProcessingCosts + transactionFees + monthlyFees + monthlyEquipment;
    const effectiveRate = totalMonthlyCost / monthlyVolume;
    
    return {
      monthlyProcessingCosts: monthlyProcessingCosts + transactionFees,
      monthlyFees,
      monthlyEquipment,
      totalMonthlyCost,
      annualCost: totalMonthlyCost * 12,
      effectiveRate,
      breakdown: {
        qualifiedVolume,
        midQualifiedVolume,
        nonQualifiedVolume,
        qualifiedCost,
        midQualifiedCost,
        nonQualifiedCost
      }
    };
  }

  private getQualifiedPercentage(merchant: MerchantProfile, processor: ProcessorData): number {
    let baseQualified = 0.70; // Default 70%
    
    // Adjust based on business type
    switch (merchant.businessType) {
      case 'retail':
        baseQualified = 0.75;
        break;
      case 'restaurant':
        baseQualified = 0.65;
        break;
      case 'ecommerce':
        baseQualified = 0.60;
        break;
      case 'service':
        baseQualified = 0.80;
        break;
    }
    
    // Adjust based on card present percentage
    if (merchant.cardPresentPercentage > 90) {
      baseQualified += 0.10;
    } else if (merchant.cardPresentPercentage < 50) {
      baseQualified -= 0.15;
    }
    
    // Adjust based on average ticket
    if (merchant.averageTicket > 100) {
      baseQualified += 0.05;
    } else if (merchant.averageTicket < 25) {
      baseQualified -= 0.05;
    }
    
    return Math.max(0.4, Math.min(0.9, baseQualified));
  }

  async compareProcessors(merchantProfile: MerchantProfile, currentProcessor?: ProcessorData): Promise<SavingsComparison[]> {
    const comparisons: SavingsComparison[] = [];
    
    for (const processor of this.processors) {
      if (currentProcessor && processor.name === currentProcessor.name) continue;
      
      const currentCosts = currentProcessor ? 
        await this.calculateCosts(merchantProfile, currentProcessor) : 
        { totalMonthlyCost: 0, annualCost: 0 } as CostAnalysis;
      
      const proposedCosts = await this.calculateCosts(merchantProfile, processor);
      
      const monthlySavings = currentCosts.totalMonthlyCost - proposedCosts.totalMonthlyCost;
      const annualSavings = monthlySavings * 12;
      
      // Calculate setup costs for payback period
      const setupCosts = processor.equipment.setupFee || 0;
      const paybackPeriod = monthlySavings > 0 ? setupCosts / monthlySavings : 0;
      
      const roi = annualSavings > 0 ? (annualSavings - setupCosts) / setupCosts * 100 : 0;
      const savingsPercentage = currentCosts.totalMonthlyCost > 0 ? 
        (monthlySavings / currentCosts.totalMonthlyCost) * 100 : 0;
      
      const recommendations = await this.generateRecommendations(merchantProfile, processor, proposedCosts);
      
      comparisons.push({
        currentProcessor: currentProcessor!,
        proposedProcessor: processor,
        currentCosts,
        proposedCosts,
        monthlySavings,
        annualSavings,
        paybackPeriod,
        roi,
        savingsPercentage,
        recommendations
      });
    }
    
    // Sort by monthly savings (highest first)
    return comparisons.sort((a, b) => b.monthlySavings - a.monthlySavings);
  }

  async generateRecommendations(merchant: MerchantProfile, processor: ProcessorData, costs: CostAnalysis): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Volume-based recommendations
    if (merchant.monthlyVolume > 100000 && processor.type === 'flat_rate') {
      recommendations.push('Consider interchange-plus pricing for better rates at your volume level');
    }
    
    if (merchant.monthlyVolume < 10000 && processor.pricing.monthlyFee > 20) {
      recommendations.push('High monthly fees relative to volume - consider flat-rate pricing');
    }
    
    // Business type recommendations
    if (merchant.businessType === 'ecommerce' && !processor.strengths.includes('E-commerce')) {
      recommendations.push('This processor may not be optimized for e-commerce transactions');
    }
    
    if (merchant.businessType === 'restaurant' && costs.effectiveRate > 0.035) {
      recommendations.push('Effective rate is high for restaurant industry - negotiate better terms');
    }
    
    // Contract recommendations
    if (processor.contractTerms.length > 24) {
      recommendations.push('Long contract term - ensure you understand early termination fees');
    }
    
    if (processor.contractTerms.earlyTerminationFee > 300) {
      recommendations.push('High early termination fee - factor into switching decision');
    }
    
    return recommendations;
  }

  getCompatibleEquipment(processorName: string, category?: string): EquipmentOption[] {
    return this.equipmentCatalog.filter(equipment => {
      const isCompatible = equipment.compatibility.includes(processorName);
      const matchesCategory = !category || equipment.category === category;
      return isCompatible && matchesCategory;
    });
  }

  async generateProposal(merchantProfile: MerchantProfile, selectedProcessor: ProcessorData, selectedEquipment?: EquipmentOption[]): Promise<string> {
    const costs = await this.calculateCosts(merchantProfile, selectedProcessor);
    const equipmentCost = selectedEquipment?.reduce((sum, eq) => sum + (eq.monthlyLease || 0), 0) || 0;
    
    const prompt = `Generate a professional merchant services proposal for:

Business: ${merchantProfile.businessName}
Industry: ${merchantProfile.industry}
Monthly Volume: $${merchantProfile.monthlyVolume.toLocaleString()}
Average Ticket: $${merchantProfile.averageTicket}

Proposed Processor: ${selectedProcessor.name}
Monthly Cost: $${costs.totalMonthlyCost.toFixed(2)}
Effective Rate: ${(costs.effectiveRate * 100).toFixed(2)}%

Include:
1. Executive summary
2. Pricing breakdown
3. Equipment recommendations
4. Implementation timeline
5. Benefits and value proposition
6. Next steps

Format as professional business proposal.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a merchant services expert creating professional proposals. Write in a clear, professional tone with specific financial details."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      return response.choices[0].message.content || 'Proposal generation failed';
    } catch (error) {
      console.error('Proposal generation error:', error);
      return 'Unable to generate proposal at this time';
    }
  }

  getProcessors(): ProcessorData[] {
    return this.processors;
  }

  getEquipmentCatalog(): EquipmentOption[] {
    return this.equipmentCatalog;
  }
}

export const integratedCalculator = new IntegratedMerchantCalculator();