// ISO AMP API Integration for Merchant Services
export interface ISOAMPConfig {
  apiKey: string;
  apiUrl: string;
  partnerId: string;
}

export interface MerchantAccount {
  id: string;
  businessName: string;
  dba: string;
  ein: string;
  businessType: string;
  industry: string;
  monthlyVolume: number;
  averageTicket: number;
  status: 'pending' | 'approved' | 'declined' | 'active';
  rateStructure: {
    interchangePlus: number;
    qualifiedRate: number;
    midQualifiedRate: number;
    nonQualifiedRate: number;
  };
  processingTerms: {
    contractLength: number;
    earlyTerminationFee: number;
    monthlyFee: number;
    statementFee: number;
  };
  equipment?: {
    terminals: EquipmentItem[];
    totalCost: number;
  };
}

export interface ProcessingRates {
  qualifiedRate: number;
  midQualifiedRate: number;
  nonQualifiedRate: number;
  interchangePlus?: number;
  authFee: number;
  monthlyFee: number;
  statementFee: number;
  batchFee: number;
  equipmentLease?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  model: string;
  type: 'terminal' | 'mobile_reader' | 'virtual_terminal' | 'gateway';
  price: number;
  purchasePrice?: number;
  monthlyFee?: number;
  monthlyLease?: number;
  features: string[];
}

export interface RateComparison {
  provider: string;
  qualifiedRate: number;
  interchangePlus: number | null;
  monthlyFee: number;
  advantages: string[];
  disadvantages: string[];
  overallRating: number;
}

export interface SavingsScenario {
  name: string;
  description: string;
  monthlyRate: number;
  monthlyCost: number;
  annualSavings: number;
  pros: string[];
  cons: string[];
  riskLevel: string;
}

export interface EquipmentRecommendation {
  recommendations: EquipmentItem[];
  totalUpfrontCost: number;
  totalMonthlyLease: number;
  estimatedSetupTime: string;
  supportLevel: string;
}

export interface LeadData {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  estimatedVolume: number;
  priority: 'high' | 'medium' | 'low';
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'closed_won' | 'closed_lost';
  assignedAgent?: string;
  notes: string[];
  createdAt: Date;
  lastActivity: Date;
}

export class ISOAMPService {
  private config: ISOAMPConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ISO_AMP_API_KEY || '',
      apiUrl: process.env.ISO_AMP_API_URL || 'https://api.getisoamp.com/v1',
      partnerId: process.env.ISO_AMP_PARTNER_ID || ''
    };
  }

  private async makeAPIRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-Partner-ID': this.config.partnerId,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`ISO AMP API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ISO AMP API request failed:', error);
      throw new Error(`Failed to connect to ISO AMP API: ${error.message}`);
    }
  }

  // Get real-time rate comparisons
  async getRateComparisons(businessData: {
    monthlyVolume: number;
    averageTicket: number;
    businessType: string;
    industry: string;
  }): Promise<RateComparison[]> {
    try {
      const response = await this.makeAPIRequest('/rates/compare', 'POST', businessData);
      return response.comparisons || [];
    } catch (error) {
      console.error('Failed to get rate comparisons:', error);
      // Enhanced rate calculations based on industry and volume
      return this.generateEnhancedRateComparisons(businessData);
    }
  }

  // Enhanced rate calculation engine
  private generateEnhancedRateComparisons(businessData: {
    monthlyVolume: number;
    averageTicket: number;
    businessType: string;
    industry: string;
  }): RateComparison[] {
    const { monthlyVolume, averageTicket, businessType, industry } = businessData;
    
    // Risk assessment based on business profile
    const riskLevel = this.assessBusinessRisk(businessData);
    
    // Base interchange rates by card type
    const interchangeRates = this.getInterchangeRates();
    
    // Calculate Tracer Co Card optimized rates
    const tracerRates = this.calculateTracerRates(businessData, riskLevel);
    
    // Generate competitive analysis
    const competitorRates = this.generateCompetitorRates(businessData, riskLevel);
    
    return [
      {
        provider: 'Tracer Co Card',
        qualifiedRate: tracerRates.qualified,
        interchangePlus: tracerRates.interchangePlus,
        monthlyFee: tracerRates.monthlyFee,
        advantages: this.getTracerAdvantages(businessType, monthlyVolume),
        disadvantages: [],
        overallRating: 4.8
      },
      ...competitorRates
    ];
  }

  private assessBusinessRisk(businessData: {
    monthlyVolume: number;
    averageTicket: number;
    businessType: string;
    industry: string;
  }): 'low' | 'medium' | 'high' {
    const { monthlyVolume, averageTicket, businessType, industry } = businessData;
    
    // High-risk industries
    const highRiskIndustries = ['adult_entertainment', 'gambling', 'cryptocurrency', 'cbd'];
    if (highRiskIndustries.includes(industry)) return 'high';
    
    // Medium-risk factors
    if (averageTicket > 500 || monthlyVolume > 100000) return 'medium';
    if (['ecommerce', 'telemarketing'].includes(businessType)) return 'medium';
    
    // Low-risk profiles
    const lowRiskIndustries = ['healthcare', 'professional_services', 'retail'];
    if (lowRiskIndustries.includes(industry) && averageTicket < 200) return 'low';
    
    return 'medium';
  }

  private getInterchangeRates() {
    return {
      visa: {
        qualified: 1.51,
        midQualified: 1.58,
        nonQualified: 1.89
      },
      mastercard: {
        qualified: 1.48,
        midQualified: 1.55,
        nonQualified: 1.86
      },
      discover: {
        qualified: 1.56,
        midQualified: 1.63,
        nonQualified: 1.94
      },
      amex: {
        qualified: 2.30,
        midQualified: 2.40,
        nonQualified: 2.70
      }
    };
  }

  private calculateTracerRates(businessData: any, riskLevel: string) {
    const baseMargin = riskLevel === 'low' ? 0.10 : riskLevel === 'medium' ? 0.15 : 0.25;
    const volumeDiscount = businessData.monthlyVolume > 50000 ? 0.05 : 0;
    
    return {
      qualified: 1.51 + baseMargin - volumeDiscount,
      interchangePlus: baseMargin - volumeDiscount,
      monthlyFee: riskLevel === 'low' ? 15 : riskLevel === 'medium' ? 25 : 45
    };
  }

  private generateCompetitorRates(businessData: any, riskLevel: string): RateComparison[] {
    const competitorMarkup = riskLevel === 'low' ? 0.35 : riskLevel === 'medium' ? 0.45 : 0.65;
    
    return [
      {
        provider: 'First Data/Fiserv',
        qualifiedRate: 1.51 + competitorMarkup,
        interchangePlus: competitorMarkup,
        monthlyFee: 39,
        advantages: ['Large network', 'Established brand'],
        disadvantages: ['Higher rates', 'Limited customer service', 'Long contracts'],
        overallRating: 3.4
      },
      {
        provider: 'Square',
        qualifiedRate: 2.90,
        interchangePlus: null,
        monthlyFee: 0,
        advantages: ['No monthly fees', 'Easy setup'],
        disadvantages: ['Flat rate pricing', 'Limited features for larger businesses'],
        overallRating: 3.8
      },
      {
        provider: 'PayPal/Braintree',
        qualifiedRate: 2.89,
        interchangePlus: null,
        monthlyFee: 30,
        advantages: ['Brand recognition', 'Online integration'],
        disadvantages: ['Higher rates', 'Account holds', 'Limited support'],
        overallRating: 3.2
      }
    ];
  }

  private getTracerAdvantages(businessType: string, monthlyVolume: number): string[] {
    const baseAdvantages = [
      'Interchange-plus pricing transparency',
      '24/7 US-based customer support',
      'No early termination fees',
      'Free equipment replacement',
      'Local merchant services team'
    ];
    
    if (monthlyVolume > 25000) {
      baseAdvantages.push('Volume discounts available');
      baseAdvantages.push('Dedicated account manager');
    }
    
    if (businessType === 'restaurant') {
      baseAdvantages.push('Restaurant-specific POS integration');
      baseAdvantages.push('Tip adjustment capabilities');
    }
    
    if (businessType === 'retail') {
      baseAdvantages.push('Inventory management integration');
      baseAdvantages.push('Multi-location support');
    }
    
    return baseAdvantages;
  }

  // Submit merchant application
  async submitMerchantApplication(applicationData: Partial<MerchantAccount>): Promise<string> {
    try {
      const response = await this.makeAPIRequest('/merchants/applications', 'POST', applicationData);
      return response.applicationId;
    } catch (error) {
      console.error('Failed to submit merchant application:', error);
      throw error;
    }
  }

  // Get merchant account status
  async getMerchantStatus(applicationId: string): Promise<MerchantAccount | null> {
    try {
      const response = await this.makeAPIRequest(`/merchants/applications/${applicationId}`);
      return response.merchant;
    } catch (error) {
      console.error('Failed to get merchant status:', error);
      return null;
    }
  }

  // Get available equipment
  async getEquipmentCatalog(filters?: {
    type?: string;
    priceRange?: { min: number; max: number };
  }): Promise<EquipmentItem[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
      const response = await this.makeAPIRequest(`/equipment/catalog${queryParams}`);
      return response.equipment || [];
    } catch (error) {
      console.error('Failed to get equipment catalog:', error);
      return [];
    }
  }

  // Lead management
  async createLead(leadData: Partial<LeadData>): Promise<string> {
    try {
      const response = await this.makeAPIRequest('/leads', 'POST', {
        ...leadData,
        partnerId: this.config.partnerId,
        createdAt: new Date(),
        lastActivity: new Date()
      });
      return response.leadId;
    } catch (error) {
      console.error('Failed to create lead:', error);
      throw error;
    }
  }

  async updateLeadStatus(leadId: string, status: LeadData['status'], notes?: string): Promise<void> {
    try {
      await this.makeAPIRequest(`/leads/${leadId}`, 'PUT', {
        status,
        notes: notes ? [notes] : [],
        lastActivity: new Date()
      });
    } catch (error) {
      console.error('Failed to update lead status:', error);
      throw error;
    }
  }

  async getLeads(agentId?: string): Promise<LeadData[]> {
    try {
      const queryParams = agentId ? `?agent=${agentId}` : '';
      const response = await this.makeAPIRequest(`/leads${queryParams}`);
      return response.leads || [];
    } catch (error) {
      console.error('Failed to get leads:', error);
      return [];
    }
  }

  // Advanced savings calculator with multiple scenarios
  async calculateAdvancedSavings(businessData: {
    monthlyVolume: number;
    averageTicket: number;
    transactionCount: number;
    currentRates: ProcessingRates;
    businessType: string;
    industry: string;
  }): Promise<{
    scenarios: SavingsScenario[];
    recommendations: string[];
    riskAssessment: string;
    optimalSolution: string;
  }> {
    const riskLevel = this.assessBusinessRisk(businessData);
    const scenarios = this.generateSavingsScenarios(businessData, riskLevel);
    const recommendations = this.generateRecommendations(businessData, scenarios);
    
    return {
      scenarios,
      recommendations,
      riskAssessment: this.getRiskAssessmentDescription(riskLevel),
      optimalSolution: this.determineOptimalSolution(scenarios)
    };
  }

  private generateSavingsScenarios(businessData: any, riskLevel: string): SavingsScenario[] {
    const currentMonthlyCost = this.calculateCurrentCost(businessData);
    
    return [
      {
        name: 'Conservative Interchange Plus',
        description: 'Low-risk interchange-plus pricing with minimal fees',
        monthlyRate: this.calculateTracerRates(businessData, riskLevel).qualified,
        monthlyCost: this.calculateScenarioCost(businessData, 'conservative'),
        annualSavings: (currentMonthlyCost - this.calculateScenarioCost(businessData, 'conservative')) * 12,
        pros: ['Lowest total cost', 'Transparent pricing', 'No surprises'],
        cons: ['Requires good credit', 'Monthly statement fees'],
        riskLevel: 'low'
      },
      {
        name: 'Competitive Blended Rate',
        description: 'Simple blended rate competitive with Square/PayPal',
        monthlyRate: 2.75,
        monthlyCost: this.calculateScenarioCost(businessData, 'blended'),
        annualSavings: (currentMonthlyCost - this.calculateScenarioCost(businessData, 'blended')) * 12,
        pros: ['Simple pricing', 'No monthly fees', 'Quick approval'],
        cons: ['Higher rate on qualified transactions', 'Less savings potential'],
        riskLevel: 'medium'
      },
      {
        name: 'Volume Optimized',
        description: 'Best rates for high-volume merchants',
        monthlyRate: this.calculateTracerRates(businessData, riskLevel).qualified - 0.10,
        monthlyCost: this.calculateScenarioCost(businessData, 'volume'),
        annualSavings: (currentMonthlyCost - this.calculateScenarioCost(businessData, 'volume')) * 12,
        pros: ['Lowest processing rates', 'Volume discounts', 'Dedicated support'],
        cons: ['Minimum volume requirements', 'Annual contract'],
        riskLevel: 'low'
      }
    ];
  }

  private calculateCurrentCost(businessData: any): number {
    const { monthlyVolume, transactionCount, currentRates } = businessData;
    
    // Estimate card mix
    const qualifiedVolume = monthlyVolume * 0.70;
    const midQualifiedVolume = monthlyVolume * 0.20;
    const nonQualifiedVolume = monthlyVolume * 0.10;
    
    const processingFees = 
      (qualifiedVolume * currentRates.qualifiedRate / 100) +
      (midQualifiedVolume * currentRates.midQualifiedRate / 100) +
      (nonQualifiedVolume * currentRates.nonQualifiedRate / 100);
    
    const transactionFees = transactionCount * (currentRates.authFee || 0.15);
    const monthlyFees = (currentRates.monthlyFee || 25) + 
                       (currentRates.statementFee || 10) + 
                       (currentRates.equipmentLease || 0);
    
    return processingFees + transactionFees + monthlyFees;
  }

  private calculateScenarioCost(businessData: any, scenario: string): number {
    const { monthlyVolume, transactionCount } = businessData;
    const qualifiedVolume = monthlyVolume * 0.70;
    const midQualifiedVolume = monthlyVolume * 0.20;
    const nonQualifiedVolume = monthlyVolume * 0.10;
    
    switch (scenario) {
      case 'conservative':
        return (qualifiedVolume * 1.61 / 100) + 
               (midQualifiedVolume * 1.68 / 100) + 
               (nonQualifiedVolume * 1.99 / 100) + 
               (transactionCount * 0.10) + 25;
      
      case 'blended':
        return (monthlyVolume * 2.75 / 100);
      
      case 'volume':
        const volumeDiscount = monthlyVolume > 50000 ? 0.05 : 0;
        return (qualifiedVolume * (1.56 - volumeDiscount) / 100) + 
               (midQualifiedVolume * (1.63 - volumeDiscount) / 100) + 
               (nonQualifiedVolume * (1.94 - volumeDiscount) / 100) + 
               (transactionCount * 0.08) + 15;
      
      default:
        return 0;
    }
  }

  private generateRecommendations(businessData: any, scenarios: SavingsScenario[]): string[] {
    const { monthlyVolume, averageTicket, businessType, industry } = businessData;
    const recommendations: string[] = [];
    
    // Volume-based recommendations
    if (monthlyVolume > 100000) {
      recommendations.push('Consider volume optimization pricing for maximum savings');
      recommendations.push('Negotiate dedicated account management for high-volume processing');
    } else if (monthlyVolume < 10000) {
      recommendations.push('Blended rate pricing may be simpler for smaller volumes');
    }
    
    // Industry-specific recommendations
    if (industry === 'restaurant') {
      recommendations.push('Implement tip adjustment capabilities for restaurant operations');
      recommendations.push('Consider integrated POS solutions for better reporting');
    } else if (industry === 'retail') {
      recommendations.push('Multi-location support available for retail chains');
      recommendations.push('Inventory integration can streamline operations');
    } else if (industry === 'ecommerce') {
      recommendations.push('Gateway integration essential for online transactions');
      recommendations.push('Fraud protection tools recommended for card-not-present transactions');
    }
    
    // Ticket size recommendations
    if (averageTicket > 300) {
      recommendations.push('Level II/III processing can reduce interchange costs for B2B transactions');
    }
    
    return recommendations;
  }

  private getRiskAssessmentDescription(riskLevel: string): string {
    switch (riskLevel) {
      case 'low':
        return 'Low-risk profile qualifies for best rates and terms. Minimal underwriting requirements.';
      case 'medium':
        return 'Standard risk profile with competitive rates. Standard underwriting and documentation required.';
      case 'high':
        return 'Higher-risk profile requires enhanced underwriting. Rates may include risk adjustment.';
      default:
        return 'Risk assessment pending additional business information.';
    }
  }

  private determineOptimalSolution(scenarios: SavingsScenario[]): string {
    const bestSavings = Math.max(...scenarios.map(s => s.annualSavings));
    const optimalScenario = scenarios.find(s => s.annualSavings === bestSavings);
    
    return optimalScenario ? 
      `${optimalScenario.name} offers the best value with $${bestSavings.toFixed(2)} in annual savings.` :
      'Contact our merchant services team for a customized solution analysis.';
  }

  // Enhanced equipment cost calculator
  async calculateEquipmentCosts(requirements: {
    businessType: string;
    locations: number;
    monthlyVolume: number;
    mobileProcessing: boolean;
    ecommerceNeeds: boolean;
  }): Promise<EquipmentRecommendation> {
    const equipment = this.generateEquipmentRecommendations(requirements);
    
    return {
      recommendations: equipment,
      totalUpfrontCost: equipment.reduce((sum, item) => sum + (item.purchasePrice || 0), 0),
      totalMonthlyLease: equipment.reduce((sum, item) => sum + (item.monthlyLease || 0), 0),
      estimatedSetupTime: this.calculateSetupTime(equipment),
      supportLevel: this.determineSupportLevel(requirements)
    };
  }

  private generateEquipmentRecommendations(requirements: any): EquipmentItem[] {
    const recommendations: EquipmentItem[] = [];
    
    // Base terminal recommendation
    if (requirements.businessType === 'restaurant') {
      recommendations.push({
        id: 'ingenico-move5000',
        name: 'Ingenico Move/5000',
        model: 'Move/5000',
        type: 'terminal',
        price: 299,
        monthlyFee: 15,
        features: ['EMV', 'NFC', 'Tip Adjust', 'Kitchen Print', 'Tableside Payment']
      });
    } else if (requirements.businessType === 'retail') {
      recommendations.push({
        id: 'ingenico-desk3500',
        name: 'Ingenico Desk/3500',
        model: 'Desk/3500',
        type: 'terminal',
        price: 199,
        monthlyFee: 12,
        features: ['EMV', 'NFC', 'Receipt Print', 'PIN Debit', 'Fast Processing']
      });
    }
    
    // Mobile processing
    if (requirements.mobileProcessing) {
      recommendations.push({
        id: 'mobile-reader',
        name: 'Mobile Card Reader',
        model: 'MR-100',
        type: 'mobile_reader',
        price: 49,
        monthlyFee: 0,
        features: ['Bluetooth', 'EMV', 'Mag Stripe', 'Battery Powered', 'Smartphone App']
      });
    }
    
    // E-commerce gateway
    if (requirements.ecommerceNeeds) {
      recommendations.push({
        id: 'payment-gateway',
        name: 'Payment Gateway',
        model: 'Gateway Pro',
        type: 'gateway',
        price: 0,
        monthlyFee: 25,
        features: ['API Integration', 'Fraud Protection', 'Recurring Billing', 'Multi-Currency', 'Reporting']
      });
    }
    
    return recommendations;
  }

  private calculateSetupTime(equipment: EquipmentItem[]): string {
    const terminalCount = equipment.filter(e => e.type === 'terminal').length;
    const hasGateway = equipment.some(e => e.type === 'gateway');
    
    let days = 1; // Base setup
    days += terminalCount * 0.5; // Additional terminals
    if (hasGateway) days += 2; // Gateway integration
    
    return `${Math.ceil(days)} business days`;
  }

  private determineSupportLevel(requirements: any): string {
    if (requirements.monthlyVolume > 100000 || requirements.locations > 5) {
      return 'Premium Support - Dedicated account manager and priority technical support';
    } else if (requirements.monthlyVolume > 25000) {
      return 'Enhanced Support - Business hours phone support and online resources';
    } else {
      return 'Standard Support - Online resources and email support';
    }
  }

  // Generate merchant services proposal
  async generateProposal(merchantData: Partial<MerchantAccount>): Promise<{
    proposalId: string;
    documentUrl: string;
    summary: string;
  }> {
    try {
      const response = await this.makeAPIRequest('/proposals/generate', 'POST', merchantData);
      return {
        proposalId: response.proposalId,
        documentUrl: response.documentUrl,
        summary: response.summary
      };
    } catch (error) {
      console.error('Failed to generate proposal:', error);
      throw error;
    }
  }

  // Check API connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.makeAPIRequest('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const isoAMPService = new ISOAMPService();