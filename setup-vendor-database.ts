import { db } from './server/db';
import { vendors } from './shared/schema';
import { randomUUID } from 'crypto';

const realVendorData = [
  {
    id: 'fiserv-first-data',
    name: 'Fiserv (First Data)',
    companyType: 'processor',
    baseUrl: 'https://www.fiserv.com',
    documentPortalUrl: 'https://www.fiserv.com/en/merchant-acquiring/resources.html',
    supportUrl: 'https://www.fiserv.com/en/support.html',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'monday',
    priority: 1,
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="download"], .resource-link, .blog-post, .news-item, .announcement',
      title: 'h1, .document-title, .resource-title, .blog-title, .news-headline',
      lastModified: '.date, .last-updated, time, .publish-date'
    },
    documentPaths: [
      '/en/merchant-acquiring/resources.html',
      '/en/developer/apis.html',
      '/en/support/documentation.html',
      '/en/compliance/pci-resources.html',
      '/blog',
      '/news',
      '/press-releases'
    ],
    documentTypes: ['pdf', 'sales_flyer', 'product_announcement', 'blog_post', 'news', 'promotion'],
    contentFilters: {
      requiredKeywords: ['payment', 'merchant', 'processing', 'pos', 'terminal', 'transaction', 'gateway', 'acquiring', 'commerce', 'fintech', 'card', 'credit', 'debit', 'interchange', 'settlement'],
      excludedKeywords: ['adult', 'porn', 'xxx', 'politics', 'political', 'religion', 'religious', 'casino', 'gambling', 'drugs', 'illegal'],
      businessRelevantTerms: ['rate sheet', 'pricing', 'compliance', 'pci', 'api', 'integration', 'sdk', 'developer', 'documentation', 'security', 'fraud', 'chargeback', 'iso', 'reseller', 'partner']
    },
    apiEndpoints: [
      'https://developer.fiserv.com/product/CommerceHub',
      'https://developer.fiserv.com/product/Clover'
    ],
    contactInfo: {
      sales: '1-800-FISERV-1',
      support: '1-800-FISERV-2',
      integration: 'developer@fiserv.com'
    }
  },
  {
    id: 'chase-paymentech',
    name: 'Chase Paymentech',
    companyType: 'processor',
    baseUrl: 'https://www.chasepaymentech.com',
    documentPortalUrl: 'https://www.chasepaymentech.com/resources',
    supportUrl: 'https://www.chasepaymentech.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'tuesday',
    priority: 1,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .download-link, .resource-item a',
      title: 'h1, .page-title, .document-name',
      lastModified: '.publish-date, .updated'
    },
    documentPaths: [
      '/resources/documentation',
      '/resources/rate-sheets',
      '/resources/integration-guides',
      '/resources/compliance'
    ],
    apiEndpoints: [
      'https://developer.chasepaymentech.com/docs/api'
    ],
    contactInfo: {
      sales: '1-800-MERCHANT',
      support: '1-877-PAYMENTECH',
      integration: 'api-support@chase.com'
    }
  },
  {
    id: 'worldpay-fis',
    name: 'Worldpay (FIS)',
    companyType: 'processor',
    baseUrl: 'https://worldpay.com',
    documentPortalUrl: 'https://worldpay.com/us/developer',
    supportUrl: 'https://worldpay.com/us/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'wednesday',
    priority: 1,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .developer-resource a, .guide-link',
      title: 'h1, .resource-title, .guide-title',
      lastModified: '.last-updated, .version-date'
    },
    documentPaths: [
      '/us/developer/api-documentation',
      '/us/developer/integration-guides',
      '/us/support/resources',
      '/us/merchant-services/pricing'
    ],
    apiEndpoints: [
      'https://developer.worldpay.com/docs/wpg',
      'https://developer.worldpay.com/docs/access-checkout'
    ],
    contactInfo: {
      sales: '1-888-WORLDPAY',
      support: '1-800-WORLDPAY',
      integration: 'devsupport@worldpay.com'
    }
  },
  {
    id: 'tsys-global-payments',
    name: 'TSYS (Global Payments)',
    companyType: 'processor',
    baseUrl: 'https://www.tsys.com',
    documentPortalUrl: 'https://www.tsys.com/resources',
    supportUrl: 'https://www.tsys.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'thursday',
    priority: 1,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .resource-download, .documentation-link',
      title: 'h1, .resource-heading, .doc-title',
      lastModified: '.date-updated, .revision-date'
    },
    documentPaths: [
      '/resources/documentation',
      '/resources/technical-guides',
      '/resources/rate-information',
      '/resources/compliance-resources'
    ],
    apiEndpoints: [
      'https://developer.globalpay.com/api',
      'https://developer.tsys.com/docs'
    ],
    contactInfo: {
      sales: '1-800-TSYS-4-BIZ',
      support: '1-800-TSYS-HELP',
      integration: 'developer@tsys.com'
    }
  },
  {
    id: 'elavon-us-bank',
    name: 'Elavon (U.S. Bank)',
    companyType: 'processor',
    baseUrl: 'https://www.elavon.com',
    documentPortalUrl: 'https://www.elavon.com/resources',
    supportUrl: 'https://www.elavon.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'friday',
    priority: 2,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .resource-item a, .guide-download',
      title: 'h1, .content-title, .resource-name',
      lastModified: '.updated-date, .publish-date'
    },
    documentPaths: [
      '/resources/merchant-guides',
      '/resources/integration-documentation',
      '/resources/pricing-guides',
      '/resources/security-compliance'
    ],
    apiEndpoints: [
      'https://developer.elavon.com/docs'
    ],
    contactInfo: {
      sales: '1-800-ELAVON',
      support: '1-800-ELAVON-HELP',
      integration: 'integration@elavon.com'
    }
  },
  {
    id: 'shift4-skytab',
    name: 'Shift4 (SkyTab)',
    companyType: 'pos',
    baseUrl: 'https://www.shift4.com',
    documentPortalUrl: 'https://www.shift4.com/resources',
    supportUrl: 'https://www.shift4.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'monday',
    priority: 1,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .resource-download, .documentation-link',
      title: 'h1, .resource-title, .doc-heading',
      lastModified: '.updated-date, .publish-date'
    },
    documentPaths: [
      '/resources/documentation',
      '/resources/api-guides',
      '/resources/pos-integration',
      '/resources/skytab-guides'
    ],
    apiEndpoints: [
      'https://developer.shift4.com/docs',
      'https://www.shift4.com/api-documentation'
    ],
    contactInfo: {
      sales: '1-888-675-2427',
      support: '1-888-674-4382',
      integration: 'developer@shift4.com'
    }
  },
  {
    id: 'clover-fiserv',
    name: 'Clover (Fiserv)',
    companyType: 'pos',
    baseUrl: 'https://www.clover.com',
    documentPortalUrl: 'https://docs.clover.com',
    supportUrl: 'https://help.clover.com',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'tuesday',
    priority: 1,
    selectors: {
      documentLinks: '.docs-link, a[href*="/docs/"], .api-reference a',
      title: 'h1, .docs-title, .guide-heading',
      lastModified: '.last-updated, .version-date'
    },
    documentPaths: [
      '/docs/api-reference',
      '/docs/build',
      '/docs/launch',
      '/docs/merchant-pricing'
    ],
    apiEndpoints: [
      'https://docs.clover.com/reference',
      'https://docs.clover.com/docs/ecommerce-api'
    ],
    contactInfo: {
      sales: '1-855-853-8340',
      support: '1-855-853-8340',
      integration: 'developer@clover.com'
    }
  },
  {
    id: 'quantic-pos',
    name: 'Quantic POS',
    companyType: 'pos',
    baseUrl: 'https://www.quanticpos.com',
    documentPortalUrl: 'https://www.quanticpos.com/resources',
    supportUrl: 'https://www.quanticpos.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'wednesday',
    priority: 2,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .resource-item a, .documentation-link',
      title: 'h1, .page-title, .resource-heading',
      lastModified: '.date-updated, .last-modified'
    },
    documentPaths: [
      '/resources/documentation',
      '/resources/integration-guides',
      '/resources/api-documentation',
      '/support/technical-guides'
    ],
    apiEndpoints: [
      'https://api.quanticpos.com/docs'
    ],
    contactInfo: {
      sales: '1-800-QUANTIC',
      support: '1-855-QUANTIC',
      integration: 'api@quanticpos.com'
    }
  },

  {
    id: 'authorize-net',
    name: 'Authorize.Net (Visa)',
    companyType: 'gateway',
    baseUrl: 'https://www.authorize.net',
    documentPortalUrl: 'https://developer.authorize.net',
    supportUrl: 'https://support.authorize.net',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'friday',
    priority: 2,
    selectors: {
      documentLinks: '.api-doc a, a[href*=".pdf"], .guide-download',
      title: 'h1, .api-title, .guide-heading',
      lastModified: '.last-updated, .version'
    },
    documentPaths: [
      '/developer/api/reference',
      '/developer/integration-guides',
      '/developer/sample-code',
      '/support/merchant-pricing'
    ],
    apiEndpoints: [
      'https://developer.authorize.net/api/reference',
      'https://developer.authorize.net/api/webhooks'
    ],
    contactInfo: {
      sales: '1-888-323-4289',
      support: '1-877-447-3938',
      integration: 'developer@authorize.net'
    }
  },

  {
    id: 'cybersource-visa',
    name: 'CyberSource (Visa)',
    companyType: 'gateway',
    baseUrl: 'https://www.cybersource.com',
    documentPortalUrl: 'https://developer.cybersource.com',
    supportUrl: 'https://support.cybersource.com',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'friday',
    priority: 2,
    selectors: {
      documentLinks: '.developer-resource a, a[href*=".pdf"], .api-doc-link',
      title: 'h1, .resource-title, .api-heading',
      lastModified: '.updated-date, .version-info'
    },
    documentPaths: [
      '/developer/documentation',
      '/developer/api-reference',
      '/developer/integration-guides',
      '/support/resources'
    ],
    apiEndpoints: [
      'https://developer.cybersource.com/api/reference',
      'https://developer.cybersource.com/docs'
    ],
    contactInfo: {
      sales: '1-888-330-2300',
      support: '1-800-530-9095',
      integration: 'developer@cybersource.com'
    }
  },
  {
    id: 'nmi-gateway',
    name: 'Network Merchants Inc (NMI)',
    companyType: 'gateway',
    baseUrl: 'https://www.nmi.com',
    documentPortalUrl: 'https://www.nmi.com/resources',
    supportUrl: 'https://www.nmi.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'friday',
    priority: 2,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .resource-download, .documentation-link',
      title: 'h1, .resource-heading, .doc-title',
      lastModified: '.date-updated, .last-modified'
    },
    documentPaths: [
      '/resources/documentation',
      '/resources/api-guides',
      '/resources/integration-manuals',
      '/support/technical-resources'
    ],
    apiEndpoints: [
      'https://www.nmi.com/api-documentation'
    ],
    contactInfo: {
      sales: '1-847-352-4007',
      support: '1-847-352-4007',
      integration: 'support@nmi.com'
    }
  },
  {
    id: 'payment-express',
    name: 'Payment Express (Windcave)',
    companyType: 'gateway',
    baseUrl: 'https://www.windcave.com',
    documentPortalUrl: 'https://www.windcave.com/developer-e-commerce',
    supportUrl: 'https://www.windcave.com/support-centre',
    active: true,
    crawlFrequency: 'daily',
    priority: 3,
    selectors: {
      documentLinks: '.developer-resource a, a[href*=".pdf"], .guide-link',
      title: 'h1, .page-title, .resource-title',
      lastModified: '.updated-date, .version-date'
    },
    documentPaths: [
      '/developer-e-commerce/api-reference',
      '/developer-e-commerce/integration-guides',
      '/support-centre/documentation',
      '/developer-e-commerce/sdks'
    ],
    apiEndpoints: [
      'https://www.windcave.com/developer-e-commerce/api-reference'
    ],
    contactInfo: {
      sales: 'sales@windcave.com',
      support: 'support@windcave.com',
      integration: 'developer@windcave.com'
    }
  },

  {
    id: 'lightspeed-pos',
    name: 'Lightspeed POS',
    companyType: 'pos',
    baseUrl: 'https://www.lightspeedhq.com',
    documentPortalUrl: 'https://developers.lightspeedhq.com',
    supportUrl: 'https://www.lightspeedhq.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'thursday',
    priority: 2,
    selectors: {
      documentLinks: '.developer-link a, a[href*="/docs/"], .api-doc-link',
      title: 'h1, .developer-title, .api-heading',
      lastModified: '.updated-date, .version-date'
    },
    documentPaths: [
      '/developers/ecom',
      '/developers/retail',
      '/developers/restaurant',
      '/support/api-documentation'
    ],
    apiEndpoints: [
      'https://developers.lightspeedhq.com/ecom/introduction',
      'https://developers.lightspeedhq.com/retail/introduction'
    ],
    contactInfo: {
      sales: '1-855-932-0422',
      support: '1-855-932-0422',
      integration: 'api@lightspeedhq.com'
    }
  },
  {
    id: 'revel-pos',
    name: 'Revel Systems',
    companyType: 'pos',
    baseUrl: 'https://revelsystems.com',
    documentPortalUrl: 'https://revelsystems.com/resources',
    supportUrl: 'https://revelsystems.com/support',
    active: true,
    crawlFrequency: 'weekly',
    scanDay: 'friday',
    priority: 3,
    selectors: {
      documentLinks: 'a[href*=".pdf"], .resource-item a, .documentation-link',
      title: 'h1, .resource-title, .page-heading',
      lastModified: '.updated-date, .publish-date'
    },
    documentPaths: [
      '/resources/documentation',
      '/resources/api-guides',
      '/resources/integration-manuals',
      '/support/technical-resources'
    ],
    apiEndpoints: [
      'https://revelsystems.com/api-documentation'
    ],
    contactInfo: {
      sales: '1-415-598-7375',
      support: '1-415-598-7375',
      integration: 'api@revelsystems.com'
    }
  },

];

async function seedVendorDatabase() {
  try {
    console.log('Starting vendor database seeding...');
    
    for (const vendor of realVendorData) {
      try {
        await db.insert(vendors).values({
          id: randomUUID(),
          name: vendor.name,
          type: vendor.companyType, // Map companyType to required type field
          category: vendor.companyType,
          description: `${vendor.name} - ${vendor.companyType}`,
          website: vendor.baseUrl,
          contactInfo: JSON.stringify(vendor.contactInfo),
          isActive: vendor.active,
          priority: vendor.priority
        });
        
        console.log(`Seeded vendor: ${vendor.name}`);
      } catch (error) {
        console.error(`Error seeding vendor ${vendor.name}:`, error);
      }
    }
    
    console.log(`Vendor database seeding completed - ${realVendorData.length} vendors processed`);
    
    // Display summary by company type
    const processorCount = realVendorData.filter(v => v.companyType === 'processor').length;
    const gatewayCount = realVendorData.filter(v => v.companyType === 'gateway').length;
    const posCount = realVendorData.filter(v => v.companyType === 'pos').length;
    
    console.log(`Payment Processors: ${processorCount}, Gateways: ${gatewayCount}, POS Systems: ${posCount}`);
    
  } catch (error) {
    console.error('Error during vendor database seeding:', error);
    throw error;
  }
}

export { seedVendorDatabase };