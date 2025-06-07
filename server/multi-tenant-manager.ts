import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { memoryOptimizer } from './memory-optimizer';

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  features: string[];
  limits: {
    users: number;
    documents: number;
    apiCalls: number;
    storage: number; // in MB
  };
  settings: {
    branding: {
      logo?: string;
      primaryColor: string;
      secondaryColor: string;
    };
    security: {
      mfaRequired: boolean;
      passwordPolicy: string;
      sessionTimeout: number;
    };
    features: {
      vendorIntelligence: boolean;
      calculator: boolean;
      documentProcessing: boolean;
      apiAccess: boolean;
    };
  };
  created: Date;
  lastActivity: Date;
}

export class MultiTenantManager {
  private tenantCache = new Map<string, TenantConfig>();
  private userTenantMap = new Map<string, string>();

  async getTenantForUser(userId: string): Promise<TenantConfig | null> {
    // Check cache first
    const cachedTenantId = this.userTenantMap.get(userId);
    if (cachedTenantId) {
      const cachedTenant = this.tenantCache.get(cachedTenantId);
      if (cachedTenant) return cachedTenant;
    }

    // For now, return default enterprise tenant
    // In production, this would query tenant database
    const defaultTenant: TenantConfig = {
      id: 'default-enterprise',
      name: 'JACC Enterprise',
      domain: 'enterprise.jacc.ai',
      features: ['vendor-intelligence', 'calculator', 'document-processing', 'api-access'],
      limits: {
        users: 1000,
        documents: 50000,
        apiCalls: 100000,
        storage: 10000 // 10GB
      },
      settings: {
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af'
        },
        security: {
          mfaRequired: false,
          passwordPolicy: 'standard',
          sessionTimeout: 8 * 60 * 60 * 1000 // 8 hours
        },
        features: {
          vendorIntelligence: true,
          calculator: true,
          documentProcessing: true,
          apiAccess: true
        }
      },
      created: new Date(),
      lastActivity: new Date()
    };

    // Cache the result
    this.tenantCache.set(defaultTenant.id, defaultTenant);
    this.userTenantMap.set(userId, defaultTenant.id);
    
    return defaultTenant;
  }

  async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    // Check cache first
    for (const tenant of this.tenantCache.values()) {
      if (tenant.domain === domain) {
        return tenant;
      }
    }

    // For development, return default tenant
    if (domain.includes('localhost') || domain.includes('replit')) {
      return this.getTenantForUser('development-user');
    }

    return null;
  }

  async validateTenantAccess(tenantId: string, userId: string, feature: string): Promise<boolean> {
    const tenant = await this.getTenantForUser(userId);
    if (!tenant || tenant.id !== tenantId) {
      return false;
    }

    // Check feature access
    switch (feature) {
      case 'vendor-intelligence':
        return tenant.settings.features.vendorIntelligence;
      case 'calculator':
        return tenant.settings.features.calculator;
      case 'document-processing':
        return tenant.settings.features.documentProcessing;
      case 'api-access':
        return tenant.settings.features.apiAccess;
      default:
        return false;
    }
  }

  async checkTenantLimits(tenantId: string, resource: 'users' | 'documents' | 'apiCalls' | 'storage'): Promise<{
    current: number;
    limit: number;
    available: number;
    withinLimits: boolean;
  }> {
    const tenant = this.tenantCache.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Mock current usage - in production, query actual usage
    const mockUsage = {
      users: 45,
      documents: 1250,
      apiCalls: 8500,
      storage: 650 // MB
    };

    const current = mockUsage[resource];
    const limit = tenant.limits[resource];
    const available = limit - current;

    return {
      current,
      limit,
      available,
      withinLimits: available > 0
    };
  }

  async updateTenantActivity(tenantId: string): Promise<void> {
    const tenant = this.tenantCache.get(tenantId);
    if (tenant) {
      tenant.lastActivity = new Date();
      this.tenantCache.set(tenantId, tenant);
    }
  }

  async getTenantSettings(tenantId: string): Promise<TenantConfig['settings'] | null> {
    const tenant = this.tenantCache.get(tenantId);
    return tenant?.settings || null;
  }

  async updateTenantSettings(tenantId: string, settings: Partial<TenantConfig['settings']>): Promise<void> {
    const tenant = this.tenantCache.get(tenantId);
    if (tenant) {
      tenant.settings = { ...tenant.settings, ...settings };
      this.tenantCache.set(tenantId, tenant);
    }
  }

  getTenantStats(): {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    cacheSize: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const activeTenants = Array.from(this.tenantCache.values())
      .filter(tenant => tenant.lastActivity.getTime() > oneHourAgo)
      .length;

    return {
      totalTenants: this.tenantCache.size,
      activeTenants,
      totalUsers: this.userTenantMap.size,
      cacheSize: this.tenantCache.size + this.userTenantMap.size
    };
  }

  // Middleware for tenant isolation
  createTenantMiddleware() {
    return async (req: any, res: any, next: any) => {
      const domain = req.get('host') || 'localhost';
      const tenant = await this.getTenantByDomain(domain);
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Attach tenant to request
      req.tenant = tenant;
      
      // Update activity
      await this.updateTenantActivity(tenant.id);
      
      next();
    };
  }

  // Memory optimization for multi-tenant
  optimizeTenantMemory(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    // Remove inactive tenant cache entries
    for (const [tenantId, tenant] of this.tenantCache.entries()) {
      if (tenant.lastActivity.getTime() < oneHourAgo) {
        this.tenantCache.delete(tenantId);
      }
    }

    console.log(`Tenant cache optimized: ${this.tenantCache.size} active tenants`);
  }

  shutdown(): void {
    this.tenantCache.clear();
    this.userTenantMap.clear();
  }
}

export const multiTenantManager = new MultiTenantManager();