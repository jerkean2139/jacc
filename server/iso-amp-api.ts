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

export interface EquipmentItem {
  id: string;
  name: string;
  model: string;
  type: 'terminal' | 'mobile_reader' | 'virtual_terminal' | 'gateway';
  price: number;
  monthlyFee?: number;
  features: string[];
}

export interface RateComparison {
  provider: string;
  qualifiedRate: number;
  interchangePlus: number;
  monthlyFee: number;
  advantages: string[];
  disadvantages: string[];
  overallRating: number;
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
      apiUrl: process.env.ISO_AMP_API_URL || 'https://api.isoamp.com/v1',
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
      // Return sample data structure for development
      return [
        {
          provider: 'Tracer Co Card',
          qualifiedRate: 2.65,
          interchangePlus: 0.15,
          monthlyFee: 25,
          advantages: ['Competitive rates', '24/7 support', 'Local presence'],
          disadvantages: [],
          overallRating: 4.8
        }
      ];
    }
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