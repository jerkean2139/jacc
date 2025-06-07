import { db } from './db';
import { processorPricing, hardwareOptions, type ProcessorPricing, type HardwareOption } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface ProcessorPricingData {
  id?: string;
  processorName: string;
  pricingType: 'interchange_plus' | 'tiered' | 'flat_rate' | 'subscription';
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
  setupFee?: number;
  earlyTerminationFee?: number;
  contractLength: number;
  isActive: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

export interface HardwareOptionData {
  id?: string;
  name: string;
  category: 'terminal' | 'mobile' | 'virtual' | 'gateway' | 'pos_system';
  manufacturer: string;
  model: string;
  purchasePrice: number;
  monthlyLease?: number;
  setupFee?: number;
  features: string[];
  compatibleProcessors: string[];
  specifications: Record<string, any>;
  isActive: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

export class PricingManager {
  // Processor pricing management
  async getAllProcessorPricing(): Promise<ProcessorPricingData[]> {
    try {
      const pricing = await db.select().from(processorPricing).where(eq(processorPricing.isActive, true));
      return pricing.map(p => ({
        ...p,
        features: p.features || [],
        compatibleHardware: p.compatibleHardware || []
      }));
    } catch (error) {
      console.error('Error fetching processor pricing:', error);
      return [];
    }
  }

  async getProcessorPricing(processorName: string): Promise<ProcessorPricingData | null> {
    try {
      const [pricing] = await db.select()
        .from(processorPricing)
        .where(eq(processorPricing.processorName, processorName));
      
      if (!pricing) return null;
      
      return {
        ...pricing,
        features: pricing.features || [],
        compatibleHardware: pricing.compatibleHardware || []
      };
    } catch (error) {
      console.error('Error fetching processor pricing:', error);
      return null;
    }
  }

  async upsertProcessorPricing(data: ProcessorPricingData): Promise<ProcessorPricingData> {
    try {
      const [result] = await db.insert(processorPricing)
        .values({
          ...data,
          lastUpdated: new Date(),
          features: data.features || [],
          compatibleHardware: data.compatibleHardware || []
        })
        .onConflictDoUpdate({
          target: processorPricing.processorName,
          set: {
            ...data,
            lastUpdated: new Date(),
            features: data.features || [],
            compatibleHardware: data.compatibleHardware || []
          }
        })
        .returning();

      return {
        ...result,
        features: result.features || [],
        compatibleHardware: result.compatibleHardware || []
      };
    } catch (error) {
      console.error('Error upserting processor pricing:', error);
      throw new Error('Failed to save processor pricing');
    }
  }

  async deleteProcessorPricing(processorName: string): Promise<boolean> {
    try {
      await db.update(processorPricing)
        .set({ isActive: false, lastUpdated: new Date() })
        .where(eq(processorPricing.processorName, processorName));
      return true;
    } catch (error) {
      console.error('Error deleting processor pricing:', error);
      return false;
    }
  }

  // Hardware management
  async getAllHardwareOptions(): Promise<HardwareOptionData[]> {
    try {
      const hardware = await db.select().from(hardwareOptions).where(eq(hardwareOptions.isActive, true));
      return hardware.map(h => ({
        ...h,
        features: h.features || [],
        compatibleProcessors: h.compatibleProcessors || [],
        specifications: h.specifications || {}
      }));
    } catch (error) {
      console.error('Error fetching hardware options:', error);
      return [];
    }
  }

  async getHardwareByCategory(category: string): Promise<HardwareOptionData[]> {
    try {
      const hardware = await db.select()
        .from(hardwareOptions)
        .where(eq(hardwareOptions.category, category as any));
      
      return hardware.map(h => ({
        ...h,
        features: h.features || [],
        compatibleProcessors: h.compatibleProcessors || [],
        specifications: h.specifications || {}
      }));
    } catch (error) {
      console.error('Error fetching hardware by category:', error);
      return [];
    }
  }

  async upsertHardwareOption(data: HardwareOptionData): Promise<HardwareOptionData> {
    try {
      const [result] = await db.insert(hardwareOptions)
        .values({
          ...data,
          lastUpdated: new Date(),
          features: data.features || [],
          compatibleProcessors: data.compatibleProcessors || [],
          specifications: data.specifications || {}
        })
        .onConflictDoUpdate({
          target: hardwareOptions.id,
          set: {
            ...data,
            lastUpdated: new Date(),
            features: data.features || [],
            compatibleProcessors: data.compatibleProcessors || [],
            specifications: data.specifications || {}
          }
        })
        .returning();

      return {
        ...result,
        features: result.features || [],
        compatibleProcessors: result.compatibleProcessors || [],
        specifications: result.specifications || {}
      };
    } catch (error) {
      console.error('Error upserting hardware option:', error);
      throw new Error('Failed to save hardware option');
    }
  }

  // Pricing calculations with database data
  async calculateWithDatabasePricing(merchantProfile: any, processorName: string, selectedHardware: string[] = []): Promise<any> {
    try {
      const processorData = await this.getProcessorPricing(processorName);
      if (!processorData) {
        throw new Error(`Processor pricing not found: ${processorName}`);
      }

      const hardwareData = selectedHardware.length > 0 ? 
        await Promise.all(selectedHardware.map(id => this.getHardwareById(id))) : 
        [];

      // Calculate base processing costs
      const monthlyVolume = merchantProfile.monthlyVolume;
      const transactionCount = merchantProfile.transactionCount || Math.round(monthlyVolume / merchantProfile.averageTicket);
      
      let processingCosts = 0;
      
      if (processorData.pricingType === 'interchange_plus') {
        const avgInterchangeRate = 0.0165; // Industry average
        processingCosts = monthlyVolume * (avgInterchangeRate + (processorData.interchangePlus || 0));
      } else if (processorData.pricingType === 'tiered') {
        const qualifiedVolume = monthlyVolume * 0.70;
        const midQualifiedVolume = monthlyVolume * 0.20;
        const nonQualifiedVolume = monthlyVolume * 0.10;
        
        processingCosts = (qualifiedVolume * processorData.qualifiedRate) +
                         (midQualifiedVolume * (processorData.midQualifiedRate || 0)) +
                         (nonQualifiedVolume * (processorData.nonQualifiedRate || 0));
      } else {
        // Flat rate
        processingCosts = monthlyVolume * processorData.qualifiedRate;
      }

      // Add transaction fees
      const transactionFees = transactionCount * processorData.authFee;

      // Calculate monthly fees
      const monthlyFees = processorData.monthlyFee + 
                         processorData.statementFee + 
                         (processorData.gatewayFee || 0) + 
                         (processorData.pciFee || 0);

      // Calculate hardware costs
      const hardwareCosts = hardwareData.reduce((sum, hardware) => {
        if (!hardware) return sum;
        return sum + (hardware.monthlyLease || 0);
      }, 0);

      const totalMonthlyCost = processingCosts + transactionFees + monthlyFees + hardwareCosts;
      const effectiveRate = totalMonthlyCost / monthlyVolume;

      return {
        processor: processorData,
        hardware: hardwareData.filter(Boolean),
        costs: {
          processingCosts: processingCosts + transactionFees,
          monthlyFees,
          hardwareCosts,
          totalMonthlyCost,
          annualCost: totalMonthlyCost * 12,
          effectiveRate
        },
        breakdown: {
          baseProcessing: processingCosts,
          transactionFees,
          monthlyFees,
          hardwareCosts,
          setupCosts: (processorData.setupFee || 0) + 
                     hardwareData.reduce((sum, h) => sum + (h?.setupFee || 0), 0)
        }
      };
    } catch (error) {
      console.error('Error calculating with database pricing:', error);
      throw error;
    }
  }

  private async getHardwareById(id: string): Promise<HardwareOptionData | null> {
    try {
      const [hardware] = await db.select()
        .from(hardwareOptions)
        .where(eq(hardwareOptions.id, id));
      
      if (!hardware) return null;
      
      return {
        ...hardware,
        features: hardware.features || [],
        compatibleProcessors: hardware.compatibleProcessors || [],
        specifications: hardware.specifications || {}
      };
    } catch (error) {
      console.error('Error fetching hardware by ID:', error);
      return null;
    }
  }

  // Bulk import/export functionality
  async exportPricingData(): Promise<{ processors: ProcessorPricingData[], hardware: HardwareOptionData[] }> {
    const [processors, hardware] = await Promise.all([
      this.getAllProcessorPricing(),
      this.getAllHardwareOptions()
    ]);

    return { processors, hardware };
  }

  async importPricingData(data: { processors?: ProcessorPricingData[], hardware?: HardwareOptionData[] }, updatedBy: string): Promise<boolean> {
    try {
      if (data.processors) {
        for (const processor of data.processors) {
          await this.upsertProcessorPricing({ ...processor, updatedBy });
        }
      }

      if (data.hardware) {
        for (const hardware of data.hardware) {
          await this.upsertHardwareOption({ ...hardware, updatedBy });
        }
      }

      return true;
    } catch (error) {
      console.error('Error importing pricing data:', error);
      return false;
    }
  }
}

export const pricingManager = new PricingManager();