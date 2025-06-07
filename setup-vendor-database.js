const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require("ws");
const schema = require("./shared/schema.ts");

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

const realVendorData = [
  {
    id: 'fiserv-first-data',
    name: 'Fiserv (First Data)',
    companyType: 'processor',
    baseUrl: 'https://www.fiserv.com',
    documentPortalUrl: 'https://www.fiserv.com/en/merchant-acquiring/resources.html',
    supportUrl: 'https://www.fiserv.com/en/support.html',
    active: true,
    crawlFrequency: 'daily',
    priority: 1,
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="download"], .resource-link',
      title: 'h1, .document-title, .resource-title',
      lastModified: '.date, .last-updated, time'
    },
    documentPaths: [
      '/en/merchant-acquiring/resources.html',
      '/en/developer/apis.html',
      '/en/support/documentation.html',
      '/en/compliance/pci-resources.html'
    ],
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
    crawlFrequency: 'daily',
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
    crawlFrequency: 'daily',
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
    crawlFrequency: 'daily',
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
    crawlFrequency: 'daily',
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
    id: 'square',
    name: 'Square',
    companyType: 'processor',
    baseUrl: 'https://squareup.com',
    documentPortalUrl: 'https://developer.squareup.com/docs',
    supportUrl: 'https://squareup.com/help',
    active: true,
    crawlFrequency: 'daily',
    priority: 2,
    selectors: {
      documentLinks: '.doc-link, a[href*="/docs/"], .guide-item a',
      title: 'h1, .doc-title, .guide-heading',
      lastModified: '.last-updated, .version-info'
    },
    documentPaths: [
      '/developer/docs/api',
      '/developer/docs/webhooks',
      '/developer/docs/terminal',
      '/help/us/en/merchant-pricing'
    ],
    apiEndpoints: [
      'https://developer.squareup.com/reference/square',
      'https://developer.squareup.com/docs/terminal-api'
    ],
    contactInfo: {
      sales: '1-855-700-6000',
      support: '1-855-700-6000',
      integration: 'developer@squareup.com'
    }
  },
  {
    id: 'stripe',
    name: 'Stripe',
    companyType: 'processor',
    baseUrl: 'https://stripe.com',
    documentPortalUrl: 'https://stripe.com/docs',
    supportUrl: 'https://support.stripe.com',
    active: true,
    crawlFrequency: 'daily',
    priority: 2,
    selectors: {
      documentLinks: '.docs-link, a[href*="/docs/"], .api-reference a',
      title: 'h1, .docs-title, .page-heading',
      lastModified: '.last-updated, .version-date'
    },
    documentPaths: [
      '/docs/api',
      '/docs/payments',
      '/docs/terminal',
      '/docs/connect',
      '/pricing'
    ],
    apiEndpoints: [
      'https://stripe.com/docs/api',
      'https://stripe.com/docs/terminal/sdk'
    ],
    contactInfo: {
      sales: 'sales@stripe.com',
      support: 'support@stripe.com',
      integration: 'developer@stripe.com'
    }
  },
  {
    id: 'paypal-braintree',
    name: 'PayPal (Braintree)',
    companyType: 'processor',
    baseUrl: 'https://www.braintreepayments.com',
    documentPortalUrl: 'https://developer.paypal.com/braintree/docs',
    supportUrl: 'https://developer.paypal.com/braintree/help',
    active: true,
    crawlFrequency: 'daily',
    priority: 2,
    selectors: {
      documentLinks: '.docs-link, a[href*="/docs/"], .guide-link',
      title: 'h1, .doc-heading, .guide-title',
      lastModified: '.updated, .version-info'
    },
    documentPaths: [
      '/braintree/docs/guides',
      '/braintree/docs/reference',
      '/braintree/articles',
      '/us/business/merchant-fees'
    ],
    apiEndpoints: [
      'https://developer.paypal.com/braintree/docs/reference/overview',
      'https://developer.paypal.com/braintree/docs/guides/webhooks'
    ],
    contactInfo: {
      sales: '1-877-434-2894',
      support: '1-877-434-2894',
      integration: 'bt_developer@paypal.com'
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
    crawlFrequency: 'daily',
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
    id: 'adyen',
    name: 'Adyen',
    companyType: 'processor',
    baseUrl: 'https://www.adyen.com',
    documentPortalUrl: 'https://docs.adyen.com',
    supportUrl: 'https://www.adyen.com/support',
    active: true,
    crawlFrequency: 'daily',
    priority: 2,
    selectors: {
      documentLinks: '.docs-link, a[href*="/docs/"], .api-reference a',
      title: 'h1, .docs-title, .api-heading',
      lastModified: '.last-updated, .version-date'
    },
    documentPaths: [
      '/docs/api-explorer',
      '/docs/development-resources',
      '/docs/point-of-sale',
      '/pricing'
    ],
    apiEndpoints: [
      'https://docs.adyen.com/api-explorer',
      'https://docs.adyen.com/point-of-sale/design-and-deployment'
    ],
    contactInfo: {
      sales: 'sales@adyen.com',
      support: 'support@adyen.com',
      integration: 'developer@adyen.com'
    }
  }
];

async function seedVendorDatabase() {
  try {
    console.log('🔄 Starting vendor database seeding...');
    
    // Insert vendors
    for (const vendor of realVendorData) {
      try {
        await db.insert(schema.vendors).values({
          id: vendor.id,
          name: vendor.name,
          companyType: vendor.companyType,
          baseUrl: vendor.baseUrl,
          documentPortalUrl: vendor.documentPortalUrl,
          supportUrl: vendor.supportUrl,
          active: vendor.active,
          crawlFrequency: vendor.crawlFrequency,
          priority: vendor.priority,
          selectors: vendor.selectors,
          documentPaths: vendor.documentPaths,
          apiEndpoints: vendor.apiEndpoints,
          contactInfo: vendor.contactInfo,
          scanStatus: 'pending',
          errorCount: 0
        }).onConflictDoUpdate({
          target: schema.vendors.id,
          set: {
            name: vendor.name,
            companyType: vendor.companyType,
            baseUrl: vendor.baseUrl,
            documentPortalUrl: vendor.documentPortalUrl,
            supportUrl: vendor.supportUrl,
            selectors: vendor.selectors,
            documentPaths: vendor.documentPaths,
            apiEndpoints: vendor.apiEndpoints,
            contactInfo: vendor.contactInfo,
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Seeded vendor: ${vendor.name}`);
      } catch (error) {
        console.error(`❌ Error seeding vendor ${vendor.name}:`, error.message);
      }
    }
    
    console.log('🎉 Vendor database seeding completed successfully!');
    console.log(`📊 Total vendors processed: ${realVendorData.length}`);
    
    // Display summary by company type
    const processorCount = realVendorData.filter(v => v.companyType === 'processor').length;
    const gatewayCount = realVendorData.filter(v => v.companyType === 'gateway').length;
    
    console.log(`📈 Processors: ${processorCount}, Gateways: ${gatewayCount}`);
    console.log('🔍 Ready for document scanning and monitoring');
    
  } catch (error) {
    console.error('💥 Fatal error during vendor database seeding:', error);
    process.exit(1);
  }
}

// Run the seeder
seedVendorDatabase().then(() => {
  console.log('✨ Vendor intelligence system is ready');
  process.exit(0);
}).catch(error => {
  console.error('💥 Vendor seeding failed:', error);
  process.exit(1);
});