export interface VendorRecommendation {
  vendor: string;
  products: string[];
  niches: string[];
  strengths: string[];
  contactInfo?: string;
}

export interface BusinessScenario {
  industry: string;
  businessType: string;
  needs: string[];
  painPoints: string[];
}

export class VendorRecommendationEngine {
  private static readonly VENDOR_DATABASE: VendorRecommendation[] = [
    // POS Systems by Niche
    {
      vendor: 'Quantic',
      products: ['POS Systems', 'Hardware', 'Retail Solutions'],
      niches: ['Retail', 'E-commerce', 'Liquor Stores', 'Archery Business'],
      strengths: ['Best for retail businesses', 'Custom hardware quotes', 'TSYS platform integration'],
      contactInfo: 'Nick Vitucci, nvitucci@getquantic.com'
    },
    {
      vendor: 'HubWallet',
      products: ['Restaurant POS', 'Salon POS', 'Food Truck POS', 'Clover Integration'],
      niches: ['Restaurants', 'Salons', 'Food Trucks', 'Mobile Businesses'],
      strengths: ['Versatile POS solutions', 'Mobile-friendly', 'Industry-specific features']
    },
    {
      vendor: 'Shift4',
      products: ['Restaurant POS', 'SkyTab', 'Gift Cards'],
      niches: ['Restaurants', 'Full-service dining', 'Multi-location restaurants'],
      strengths: ['Enterprise restaurant solutions', 'Integrated gift card programs', 'SkyTab POS system'],
      contactInfo: '800-201-0461 Option 1'
    },
    {
      vendor: 'Clover',
      products: ['Retail POS', 'Restaurant POS', 'Tabit Integration'],
      niches: ['Small to medium retail', 'Quick service restaurants', 'General business'],
      strengths: ['User-friendly interface', 'App marketplace', 'Flexible hardware options']
    },

    // Integration Specialists
    {
      vendor: 'MiCamp',
      products: ['Software Integrations', 'POS Solutions', 'Mobile Processing', 'PAX Terminals'],
      niches: ['Software integrations', 'Hospitality', 'Restaurants', 'High ticket merchants'],
      strengths: ['Epicor integration', 'Roommaster/InnQuest integration', 'Aloha POS integration', 'Dual pricing solutions'],
      contactInfo: 'Micamp@cocard.net'
    },
    {
      vendor: 'TRX',
      products: ['Gateway Solutions', 'High Risk Processing', 'ACH Services', 'Mobile Solutions'],
      niches: ['High risk merchants', 'High ticket transactions', 'QuickBooks integration', 'Business loans'],
      strengths: ['High risk processing', 'TuaPay loan services', 'QuickBooks integration via Hyfin', 'Mobile cash discount'],
      contactInfo: '888-933-8797 Option 2, customersupport@trxservices.com'
    },
    {
      vendor: 'Clearent',
      products: ['Gateway Solutions', 'Mobile Processing', 'PAX Terminals', 'ACH Services'],
      niches: ['Mobile businesses', 'Aloha POS users', 'Small to medium businesses', 'QuickBooks users'],
      strengths: ['Best mobile solutions', 'Competitive PAX terminal pricing', 'Aloha integration', 'Hyfin QuickBooks integration'],
      contactInfo: '866.435.0666 Option 1, customersupport@clearent.com'
    },

    // Specialized Services
    {
      vendor: 'TSYS',
      products: ['Payment Processing', 'Gateway Services', 'Enterprise Solutions'],
      niches: ['Large enterprises', 'Multi-location businesses', 'High volume processing'],
      strengths: ['Enterprise-grade processing', 'Quantic POS boarding', 'Reliable infrastructure'],
      contactInfo: '877-608-6599, bf_partnersalessupport@globalpay.com'
    },
    {
      vendor: 'Payment Advisors',
      products: ['High Risk Processing', 'Specialized Merchant Services'],
      niches: ['High risk merchants', 'Specialized industries'],
      strengths: ['High risk expertise', 'Industry specialization']
    },

    // Gateway Providers
    {
      vendor: 'Authorize.net',
      products: ['Payment Gateway', 'E-commerce Solutions'],
      niches: ['E-commerce', 'Online businesses', 'Recurring billing'],
      strengths: ['Reliable gateway', 'E-commerce integration', 'Developer-friendly APIs']
    },
    {
      vendor: 'Fluid Pay',
      products: ['Payment Gateway', 'Direct Processing'],
      niches: ['Direct processing', 'Custom integrations'],
      strengths: ['Direct processing capabilities', 'Custom solutions']
    },
    {
      vendor: 'Accept Blue',
      products: ['Payment Gateway', 'Processing Services'],
      niches: ['General processing', 'Gateway services'],
      strengths: ['Reliable processing', 'Gateway solutions']
    },

    // Gift Card & Value-Added Services
    {
      vendor: 'Valutec',
      products: ['Gift Card Solutions'],
      niches: ['Retail', 'Restaurants', 'Multi-location businesses'],
      strengths: ['Comprehensive gift card programs', 'Multi-location support']
    },
    {
      vendor: 'Factor4',
      products: ['Gift Card Solutions'],
      niches: ['Small businesses', 'Restaurants'],
      strengths: ['Simple gift card solutions', 'Easy implementation']
    },
    {
      vendor: 'Rectangle Health',
      products: ['Healthcare Payment Solutions'],
      niches: ['Healthcare', 'Medical practices', 'Dental offices'],
      strengths: ['Healthcare-specific solutions', 'HIPAA compliance'],
      contactInfo: 'sdwyer@rectanglehealth.com, Sallie Dwyer'
    },

    // Additional Processors
    {
      vendor: 'Merchant Lynx',
      products: ['Payment Processing', 'Merchant Services'],
      niches: ['General processing', 'Small to medium businesses'],
      strengths: ['Competitive rates', 'Small business focus'],
      contactInfo: '844-200-8996 Option 2'
    },
    {
      vendor: 'ACI',
      products: ['ACH Services', 'Electronic Payments'],
      niches: ['ACH processing', 'Recurring payments'],
      strengths: ['ACH expertise', 'Electronic payment solutions']
    }
  ];

  static getRecommendationsByIndustry(industry: string): VendorRecommendation[] {
    const lowerIndustry = industry.toLowerCase();
    return this.VENDOR_DATABASE.filter(vendor => 
      vendor.niches.some(niche => niche.toLowerCase().includes(lowerIndustry))
    );
  }

  static getRecommendationsByBusinessType(businessType: string): VendorRecommendation[] {
    const lowerType = businessType.toLowerCase();
    return this.VENDOR_DATABASE.filter(vendor => 
      vendor.niches.some(niche => niche.toLowerCase().includes(lowerType)) ||
      vendor.products.some(product => product.toLowerCase().includes(lowerType))
    );
  }

  static getRecommendationsByPainPoints(painPoints: string[]): VendorRecommendation[] {
    const recommendations = new Set<VendorRecommendation>();
    
    painPoints.forEach(painPoint => {
      const lowerPain = painPoint.toLowerCase();
      
      // Map pain points to vendor strengths
      if (lowerPain.includes('integration') || lowerPain.includes('software')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'MiCamp')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'TRX')!);
      }
      
      if (lowerPain.includes('mobile') || lowerPain.includes('food truck') || lowerPain.includes('portable')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'HubWallet')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Clearent')!);
      }
      
      if (lowerPain.includes('high risk') || lowerPain.includes('specialized')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'TRX')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Payment Advisors')!);
      }
      
      if (lowerPain.includes('restaurant') || lowerPain.includes('pos')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Shift4')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'HubWallet')!);
      }
      
      if (lowerPain.includes('retail') || lowerPain.includes('inventory')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Quantic')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Clover')!);
      }
      
      if (lowerPain.includes('e-commerce') || lowerPain.includes('online')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Authorize.net')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Quantic')!);
      }
      
      if (lowerPain.includes('gift card') || lowerPain.includes('loyalty')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Valutec')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Shift4')!);
      }
      
      if (lowerPain.includes('quickbooks') || lowerPain.includes('accounting')) {
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'TRX')!);
        recommendations.add(this.VENDOR_DATABASE.find(v => v.vendor === 'Clearent')!);
      }
    });
    
    return Array.from(recommendations).filter(Boolean);
  }

  static getSmartRecommendations(scenario: BusinessScenario): {
    primary: VendorRecommendation[];
    secondary: VendorRecommendation[];
    reasoning: string[];
  } {
    const industryRecs = this.getRecommendationsByIndustry(scenario.industry);
    const typeRecs = this.getRecommendationsByBusinessType(scenario.businessType);
    const painPointRecs = this.getRecommendationsByPainPoints(scenario.painPoints);
    
    // Combine and score recommendations
    const scoredRecs = new Map<string, { vendor: VendorRecommendation; score: number; reasons: string[] }>();
    
    [...industryRecs, ...typeRecs, ...painPointRecs].forEach(vendor => {
      if (!scoredRecs.has(vendor.vendor)) {
        scoredRecs.set(vendor.vendor, { vendor, score: 0, reasons: [] });
      }
      
      const entry = scoredRecs.get(vendor.vendor)!;
      
      // Score based on matches
      if (industryRecs.includes(vendor)) {
        entry.score += 3;
        entry.reasons.push(`Industry match: ${scenario.industry}`);
      }
      
      if (typeRecs.includes(vendor)) {
        entry.score += 2;
        entry.reasons.push(`Business type fit: ${scenario.businessType}`);
      }
      
      if (painPointRecs.includes(vendor)) {
        entry.score += 1;
        entry.reasons.push(`Addresses specific pain points`);
      }
    });
    
    // Sort by score
    const sortedRecs = Array.from(scoredRecs.values()).sort((a, b) => b.score - a.score);
    
    return {
      primary: sortedRecs.slice(0, 3).map(r => r.vendor),
      secondary: sortedRecs.slice(3, 6).map(r => r.vendor),
      reasoning: sortedRecs.slice(0, 3).flatMap(r => r.reasons)
    };
  }

  static getSpecificNicheRecommendations(): { [key: string]: string[] } {
    return {
      'Archery Business': ['Quantic', 'Clover', 'HubWallet'],
      'Food Truck': ['HubWallet', 'Quantic'],
      'Salon': ['HubWallet'],
      'Liquor Store': ['Quantic'],
      'Restaurant - Full Service': ['Shift4', 'MiCamp', 'HubWallet'],
      'Restaurant - Quick Service': ['Clover', 'HubWallet'],
      'High Risk': ['TRX', 'Payment Advisors'],
      'High Ticket': ['TRX', 'MiCamp'],
      'Mobile Processing': ['TRX', 'Clearent', 'MiCamp'],
      'E-commerce': ['Authorize.net', 'Quantic'],
      'Healthcare': ['Rectangle Health via TSYS VAR/TRX/Clearent/MiCamp'],
      'Retail': ['Quantic', 'Clover', 'HubWallet']
    };
  }
}

export const vendorRecommendationEngine = new VendorRecommendationEngine();