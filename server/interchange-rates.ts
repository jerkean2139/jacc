import { db } from './db';
import { interchangeRates } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Current Visa/MC Interchange Rates (Updated April 2025)
export const CURRENT_INTERCHANGE_RATES = {
  // Credit Card Categories
  'CPS/Retail': 1.51, // Visa CPS/Retail
  'CPS/Supermarket': 1.05, // Visa CPS/Supermarket  
  'CPS/Restaurant': 1.54, // Visa CPS/Restaurant
  'CPS/Hotel': 1.80, // Visa CPS/Hotel
  'CPS/Service Station': 1.49, // Visa CPS/Service Station
  'CPS/eCommerce Basic': 1.80, // Visa CPS/eCommerce Basic
  'CPS/eCommerce Preferred': 2.10, // Visa CPS/eCommerce Preferred
  'CPS/Card Not Present': 1.95, // Visa CPS/Card Not Present
  'CPS/Small Ticket': 1.65, // Visa CPS/Small Ticket
  'Standard': 1.58, // Visa Standard
  'Rewards 1': 1.65, // Visa Traditional Rewards
  'Rewards 2': 2.10, // Visa Signature Preferred
  'Business': 2.95, // Visa Business/Corporate
  
  // Mastercard Equivalents
  'MC/Merit I': 1.58, // MC Merit I
  'MC/Merit II': 1.74, // MC Merit II  
  'MC/Merit III': 1.89, // MC Merit III
  'MC/World': 2.05, // MC World
  'MC/World Elite': 2.30, // MC World Elite
  'MC/eCommerce': 1.80, // MC eCommerce
  'MC/Corporate': 2.95, // MC Corporate

  // Debit Cards
  'Visa/Debit': 0.05, // Visa Check Card (regulated)
  'MC/Debit': 0.05, // MC Debit (regulated)
  'Visa/Prepaid': 0.80, // Visa Prepaid
  'MC/Prepaid': 0.80, // MC Prepaid
  
  // Assessment Fees (added to interchange)
  'Visa/Assessment': 0.14, // Visa assessment fee
  'MC/Assessment': 0.1375, // MC assessment fee
  'Network/Fee': 0.0195 // Network access fee
};

export class InterchangeManager {
  async getCurrentInterchangeRates(): Promise<any> {
    try {
      const rates = await db.select().from(interchangeRates).where(eq(interchangeRates.isActive, true));
      
      if (rates.length === 0) {
        // Initialize with current rates if none exist
        await this.initializeInterchangeRates();
        return CURRENT_INTERCHANGE_RATES;
      }
      
      return rates.reduce((acc, rate) => {
        acc[rate.category] = parseFloat(rate.rate);
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Error fetching interchange rates:', error);
      return CURRENT_INTERCHANGE_RATES;
    }
  }

  async initializeInterchangeRates(): Promise<void> {
    try {
      const rateEntries = Object.entries(CURRENT_INTERCHANGE_RATES).map(([category, rate]) => ({
        category,
        rate: rate.toString(),
        effectiveDate: new Date('2025-04-01'), // April 2025 rates
        network: category.includes('MC') ? 'Mastercard' : 'Visa',
        cardType: this.categorizeCardType(category),
        isActive: true
      }));

      await db.insert(interchangeRates).values(rateEntries);
      console.log('✅ Interchange rates initialized');
    } catch (error) {
      console.error('Error initializing interchange rates:', error);
    }
  }

  private categorizeCardType(category: string): string {
    if (category.includes('Debit')) return 'debit';
    if (category.includes('Prepaid')) return 'prepaid';
    if (category.includes('Business') || category.includes('Corporate')) return 'business';
    if (category.includes('Rewards') || category.includes('Signature') || category.includes('World')) return 'rewards';
    return 'credit';
  }

  // Calculate true processing cost based on interchange + processor markup
  calculateTrueProcessingCost(
    interchangeCategory: string,
    processorMarkup: number,
    assessmentFees: boolean = true
  ): number {
    const interchangeRate = CURRENT_INTERCHANGE_RATES[interchangeCategory] || 1.80;
    const assessment = assessmentFees ? (CURRENT_INTERCHANGE_RATES['Visa/Assessment'] || 0.14) : 0;
    const networkFee = assessmentFees ? (CURRENT_INTERCHANGE_RATES['Network/Fee'] || 0.0195) : 0;
    
    return interchangeRate + assessment + networkFee + processorMarkup;
  }

  // Estimate interchange category based on merchant data
  estimateInterchangeCategory(
    merchantType: string,
    transactionType: string,
    cardPresent: boolean,
    averageTicket: number
  ): string {
    if (transactionType === 'debit') return 'Visa/Debit';
    
    if (!cardPresent) {
      if (merchantType.includes('ecommerce') || merchantType.includes('online')) {
        return averageTicket > 50 ? 'CPS/eCommerce Preferred' : 'CPS/eCommerce Basic';
      }
      return 'CPS/Card Not Present';
    }

    // Card present categories
    if (averageTicket < 15) return 'CPS/Small Ticket';
    
    switch (merchantType.toLowerCase()) {
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

  // Get competitive analysis data
  getCompetitiveRateAnalysis(merchantData: any): any {
    const estimatedCategory = this.estimateInterchangeCategory(
      merchantData.businessType,
      merchantData.transactionType,
      merchantData.cardPresent,
      merchantData.averageTicket
    );

    const trueInterchangeCost = this.calculateTrueProcessingCost(estimatedCategory, 0);
    
    return {
      estimatedInterchangeCategory: estimatedCategory,
      trueInterchangeCost,
      minimumProcessorCost: trueInterchangeCost + 0.15, // Minimum viable processor markup
      competitiveRate: trueInterchangeCost + 0.35, // Competitive market rate
      currentMarketRate: trueInterchangeCost + 0.65, // Current market average
      savingsOpportunity: merchantData.currentRate - (trueInterchangeCost + 0.35),
      rateBreakdown: {
        interchange: CURRENT_INTERCHANGE_RATES[estimatedCategory],
        assessment: CURRENT_INTERCHANGE_RATES['Visa/Assessment'],
        networkFee: CURRENT_INTERCHANGE_RATES['Network/Fee'],
        minimumMarkup: 0.15
      }
    };
  }
}

export const interchangeManager = new InterchangeManager();