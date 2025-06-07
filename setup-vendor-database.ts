import { db } from './server/db';
import { vendors } from './shared/schema';

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
  }
];

async function seedVendorDatabase() {
  try {
    console.log('Starting vendor database seeding...');
    
    for (const vendor of realVendorData) {
      try {
        await db.insert(vendors).values({
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
          target: vendors.id,
          set: {
            name: vendor.name,
            updatedAt: new Date()
          }
        });
        
        console.log(`Seeded vendor: ${vendor.name}`);
      } catch (error) {
        console.error(`Error seeding vendor ${vendor.name}:`, error);
      }
    }
    
    console.log('Vendor database seeding completed');
    
  } catch (error) {
    console.error('Error during vendor database seeding:', error);
    throw error;
  }
}

export { seedVendorDatabase };