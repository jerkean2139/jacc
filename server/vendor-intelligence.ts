import { db } from "./db";
import { vendors, vendorDocuments, documentChanges } from "@shared/schema";
import * as cheerio from "cheerio";
import crypto from "crypto";
import { eq, desc, and } from "drizzle-orm";

interface VendorSite {
  id: string;
  name: string;
  baseUrl: string;
  documentPaths: string[];
  selectors: {
    documentLinks: string;
    title: string;
    lastModified?: string;
  };
  crawlFrequency: 'hourly' | 'daily' | 'weekly';
  active: boolean;
}

interface DocumentChangeDetection {
  url: string;
  title: string;
  contentHash: string;
  lastModified?: string;
  changeType: 'new' | 'updated' | 'removed';
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

// Major payment processors and vendors to monitor
const VENDOR_SITES: VendorSite[] = [
  {
    id: 'first-data',
    name: 'First Data (Fiserv)',
    baseUrl: 'https://www.fiserv.com',
    documentPaths: ['/merchant-services', '/resources', '/documentation'],
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="document"], a[href*="resource"]',
      title: 'title, h1, .document-title',
      lastModified: '.last-modified, .date-updated'
    },
    crawlFrequency: 'daily',
    active: true
  },
  {
    id: 'chase-paymentech',
    name: 'Chase Paymentech',
    baseUrl: 'https://www.chasepaymentech.com',
    documentPaths: ['/resources', '/support', '/documentation'],
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="download"]',
      title: 'title, h1, .resource-title',
      lastModified: '.published-date'
    },
    crawlFrequency: 'daily',
    active: true
  },
  {
    id: 'worldpay',
    name: 'Worldpay',
    baseUrl: 'https://www.worldpay.com',
    documentPaths: ['/us/support', '/us/resources'],
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="guide"]',
      title: 'title, h1, .guide-title'
    },
    crawlFrequency: 'daily',
    active: true
  },
  {
    id: 'tsys',
    name: 'TSYS (Global Payments)',
    baseUrl: 'https://www.tsys.com',
    documentPaths: ['/merchant-solutions', '/resources'],
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="resource"]',
      title: 'title, h1'
    },
    crawlFrequency: 'daily',
    active: true
  },
  {
    id: 'elavon',
    name: 'Elavon',
    baseUrl: 'https://www.elavon.com',
    documentPaths: ['/resources', '/support'],
    selectors: {
      documentLinks: 'a[href*=".pdf"], a[href*="download"]',
      title: 'title, h1'
    },
    crawlFrequency: 'daily',
    active: true
  }
];

export class VendorIntelligenceService {
  private isRunning = false;

  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log("Vendor monitoring already running");
      return;
    }

    this.isRunning = true;
    console.log("🕵️ Starting vendor intelligence monitoring...");

    // Run initial scan
    await this.performFullScan();

    // Schedule regular monitoring
    this.scheduleMonitoring();
  }

  async stopMonitoring(): Promise<void> {
    this.isRunning = false;
    console.log("⏹️ Stopping vendor intelligence monitoring");
  }

  private scheduleMonitoring(): void {
    // Check every hour for changes
    setInterval(async () => {
      if (!this.isRunning) return;
      
      console.log("🔍 Running scheduled vendor document check...");
      await this.performIncrementalScan();
    }, 60 * 60 * 1000); // Every hour
  }

  async performFullScan(): Promise<DocumentChangeDetection[]> {
    const allChanges: DocumentChangeDetection[] = [];

    for (const vendor of VENDOR_SITES) {
      if (!vendor.active) continue;

      try {
        console.log(`🏢 Scanning ${vendor.name}...`);
        const changes = await this.scanVendorSite(vendor);
        allChanges.push(...changes);
        
        // Rate limiting to be respectful to vendor sites
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ Error scanning ${vendor.name}:`, error);
      }
    }

    return allChanges;
  }

  async performIncrementalScan(): Promise<DocumentChangeDetection[]> {
    const changes: DocumentChangeDetection[] = [];

    for (const vendor of VENDOR_SITES) {
      if (!vendor.active) continue;

      try {
        const vendorChanges = await this.checkVendorForChanges(vendor);
        if (vendorChanges.length > 0) {
          console.log(`📄 Found ${vendorChanges.length} changes for ${vendor.name}`);
          changes.push(...vendorChanges);
        }
      } catch (error) {
        console.error(`❌ Error checking ${vendor.name}:`, error);
      }
    }

    if (changes.length > 0) {
      await this.notifyTeamOfChanges(changes);
    }

    return changes;
  }

  private async scanVendorSite(vendor: VendorSite): Promise<DocumentChangeDetection[]> {
    const changes: DocumentChangeDetection[] = [];

    for (const path of vendor.documentPaths) {
      try {
        const url = vendor.baseUrl + path;
        const content = await this.fetchPage(url);
        const $ = cheerio.load(content);

        // Find all document links
        const documentLinks = $(vendor.selectors.documentLinks);
        
        for (let i = 0; i < documentLinks.length; i++) {
          const link = documentLinks.eq(i);
          const href = link.attr('href');
          
          if (!href) continue;

          const documentUrl = href.startsWith('http') ? href : vendor.baseUrl + href;
          const title = link.text().trim() || $(vendor.selectors.title).first().text().trim();
          
          // Get document content hash
          const docContent = await this.fetchDocument(documentUrl);
          const contentHash = this.generateContentHash(docContent);

          // Check if this is a new or changed document
          const existingDoc = await this.getExistingDocument(vendor.id, documentUrl);
          
          if (!existingDoc) {
            // New document
            changes.push({
              url: documentUrl,
              title,
              contentHash,
              changeType: 'new',
              changes: { added: ['New document discovered'], removed: [], modified: [] }
            });

            await this.saveVendorDocument(vendor.id, documentUrl, title, contentHash);
          } else if (existingDoc.contentHash !== contentHash) {
            // Document updated
            const documentChanges = await this.analyzeDocumentChanges(
              existingDoc.content || '',
              docContent
            );

            changes.push({
              url: documentUrl,
              title,
              contentHash,
              changeType: 'updated',
              changes: documentChanges
            });

            await this.updateVendorDocument(existingDoc.id, contentHash, docContent);
          }
        }
      } catch (error) {
        console.error(`Error scanning path ${path} for ${vendor.name}:`, error);
      }
    }

    return changes;
  }

  private async checkVendorForChanges(vendor: VendorSite): Promise<DocumentChangeDetection[]> {
    // Get all known documents for this vendor
    const existingDocs = await db
      .select()
      .from(vendorDocuments)
      .where(eq(vendorDocuments.vendorId, vendor.id));

    const changes: DocumentChangeDetection[] = [];

    for (const doc of existingDocs) {
      try {
        // Re-fetch the document
        const currentContent = await this.fetchDocument(doc.url);
        const currentHash = this.generateContentHash(currentContent);

        if (currentHash !== doc.contentHash) {
          const documentChanges = await this.analyzeDocumentChanges(
            doc.content || '',
            currentContent
          );

          changes.push({
            url: doc.url,
            title: doc.title,
            contentHash: currentHash,
            changeType: 'updated',
            changes: documentChanges
          });

          // Update the stored document
          await this.updateVendorDocument(doc.id, currentHash, currentContent);
          
          // Log the change
          await this.logDocumentChange(doc.id, 'updated', documentChanges);
        }
      } catch (error) {
        console.error(`Error checking document ${doc.url}:`, error);
      }
    }

    return changes;
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JACC-Intelligence-Bot/1.0 (Merchant Services Document Monitor)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    
    return response.text();
  }

  private async fetchDocument(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'JACC-Intelligence-Bot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document ${url}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/pdf')) {
        // For PDFs, we'll get metadata and basic info
        return `PDF Document - ${url} - Size: ${response.headers.get('content-length')} bytes`;
      } else {
        return response.text();
      }
    } catch (error) {
      console.error(`Error fetching document ${url}:`, error);
      return '';
    }
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async analyzeDocumentChanges(
    oldContent: string, 
    newContent: string
  ): Promise<{ added: string[]; removed: string[]; modified: string[] }> {
    // Simple line-by-line diff analysis
    const oldLines = oldContent.split('\n').filter(line => line.trim());
    const newLines = newContent.split('\n').filter(line => line.trim());

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Find new lines
    for (const line of newLines) {
      if (!oldLines.includes(line)) {
        added.push(line.substring(0, 200)); // Truncate for storage
      }
    }

    // Find removed lines
    for (const line of oldLines) {
      if (!newLines.includes(line)) {
        removed.push(line.substring(0, 200));
      }
    }

    return { added, removed, modified };
  }

  private async getExistingDocument(vendorId: string, url: string) {
    const [doc] = await db
      .select()
      .from(vendorDocuments)
      .where(and(
        eq(vendorDocuments.vendorId, vendorId),
        eq(vendorDocuments.url, url)
      ));
    
    return doc;
  }

  private async saveVendorDocument(
    vendorId: string, 
    url: string, 
    title: string, 
    contentHash: string
  ): Promise<void> {
    await db.insert(vendorDocuments).values({
      id: crypto.randomUUID(),
      vendorId,
      url,
      title,
      contentHash,
      discoveredAt: new Date(),
      lastChecked: new Date()
    });
  }

  private async updateVendorDocument(
    docId: string, 
    contentHash: string, 
    content: string
  ): Promise<void> {
    await db
      .update(vendorDocuments)
      .set({
        contentHash,
        content,
        lastChecked: new Date(),
        lastModified: new Date()
      })
      .where(eq(vendorDocuments.id, docId));
  }

  private async logDocumentChange(
    documentId: string,
    changeType: string,
    changes: any
  ): Promise<void> {
    await db.insert(documentChanges).values({
      id: crypto.randomUUID(),
      documentId,
      changeType,
      changeDetails: JSON.stringify(changes),
      detectedAt: new Date()
    });
  }

  private async notifyTeamOfChanges(changes: DocumentChangeDetection[]): Promise<void> {
    console.log(`🚨 VENDOR INTELLIGENCE ALERT: ${changes.length} document changes detected!`);
    
    for (const change of changes) {
      console.log(`
📄 ${change.changeType.toUpperCase()}: ${change.title}
🔗 URL: ${change.url}
${change.changeType === 'updated' ? `
📝 Changes:
  ✅ Added: ${change.changes.added.length} items
  ❌ Removed: ${change.changes.removed.length} items
  🔄 Modified: ${change.changes.modified.length} items
` : ''}
      `);
    }

    // Here you would integrate with notification systems:
    // - Slack webhooks
    // - Email alerts
    // - Teams notifications
    // - In-app notifications
  }

  async getVendorStats(): Promise<any> {
    const totalVendors = VENDOR_SITES.filter(v => v.active).length;
    
    const totalDocuments = await db
      .select({ count: vendorDocuments.id })
      .from(vendorDocuments);

    const recentChanges = await db
      .select()
      .from(documentChanges)
      .orderBy(desc(documentChanges.detectedAt))
      .limit(10);

    return {
      totalVendors,
      totalDocuments: totalDocuments.length,
      recentChanges: recentChanges.length,
      lastScan: new Date().toISOString(),
      isMonitoring: this.isRunning
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const vendorIntelligenceService = new VendorIntelligenceService();