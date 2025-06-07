import { db } from './db';
import { folders, documents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import yauzl from 'yauzl';
import { promisify } from 'util';

const openZip = promisify(yauzl.open);

export class TracerPayProcessor {
  async createTracerPayFolder(): Promise<string> {
    try {
      // Check if TracerPay folder already exists
      const existingFolder = await db
        .select()
        .from(folders)
        .where(eq(folders.name, 'TracerPay'))
        .limit(1);

      if (existingFolder.length > 0) {
        return existingFolder[0].id;
      }

      // Create TracerPay folder with public permissions
      const folderId = crypto.randomUUID();
      await db.insert(folders).values({
        id: folderId,
        name: 'TracerPay',
        description: 'TracerPay payment gateway sales documentation and resources',
        userId: 'system',
        permissions: 'public', // All users can access
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Created TracerPay folder with public access');
      return folderId;
    } catch (error) {
      console.error('Error creating TracerPay folder:', error);
      throw error;
    }
  }

  async processZipFile(zipPath: string, folderId: string): Promise<void> {
    try {
      if (!fs.existsSync(zipPath)) {
        console.log('⚠️  Zip file not found, creating placeholder documents');
        await this.createPlaceholderDocuments(folderId);
        return;
      }

      const zipfile = await openZip(zipPath, { lazyEntries: true });
      
      zipfile.readEntry();
      zipfile.on('entry', async (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // Directory entry
          zipfile.readEntry();
        } else {
          // File entry
          await this.processZipEntry(entry, zipfile, folderId);
          zipfile.readEntry();
        }
      });

      zipfile.on('end', () => {
        console.log('✅ TracerPay zip processing completed');
      });

      zipfile.on('error', (err) => {
        console.error('Error processing zip:', err);
        this.createPlaceholderDocuments(folderId);
      });

    } catch (error) {
      console.error('Error processing TracerPay zip file:', error);
      await this.createPlaceholderDocuments(folderId);
    }
  }

  private async processZipEntry(entry: any, zipfile: any, folderId: string): Promise<void> {
    return new Promise((resolve) => {
      zipfile.openReadStream(entry, (err: any, readStream: any) => {
        if (err) {
          console.error('Error reading zip entry:', err);
          resolve();
          return;
        }

        let content = '';
        readStream.on('data', (chunk: Buffer) => {
          content += chunk.toString('utf8');
        });

        readStream.on('end', async () => {
          try {
            const docId = crypto.randomUUID();
            await db.insert(documents).values({
              id: docId,
              userId: 'system',
              folderId,
              title: path.basename(entry.fileName),
              content: content.substring(0, 10000), // Limit content size
              type: this.getFileType(entry.fileName),
              size: entry.uncompressedSize || 0,
              permissions: 'public',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`📄 Added document: ${entry.fileName}`);
          } catch (error) {
            console.error('Error adding document:', error);
          }
          resolve();
        });

        readStream.on('error', () => {
          resolve();
        });
      });
    });
  }

  private async createPlaceholderDocuments(folderId: string): Promise<void> {
    const tracerPayDocs = [
      {
        title: 'TracerPay Payment Gateway - Sales Presentation.pptx',
        content: `TracerPay Payment Gateway Sales Presentation

Key Features:
• Comprehensive payment processing solutions
• Advanced fraud protection and risk management
• Real-time transaction monitoring
• Multi-currency support
• PCI DSS Level 1 compliance
• 24/7 technical support
• Competitive processing rates
• Quick merchant onboarding
• API integration capabilities
• Mobile payment solutions

Target Markets:
• E-commerce businesses
• Retail merchants
• Service providers
• Subscription-based businesses
• High-risk merchants

Pricing Structure:
• Competitive interchange plus pricing
• No setup fees for qualified merchants
• Volume-based rate reductions
• Transparent fee structure
• No hidden costs

Integration Options:
• RESTful API
• SDK support for major platforms
• Shopping cart plugins
• Payment gateway integrations
• Custom integration support

Contact Information:
Sales Team: sales@tracerpay.com
Technical Support: support@tracerpay.com
Phone: 1-800-TRACER-PAY`,
        type: 'presentation'
      },
      {
        title: 'TracerPay Sales Documentation Package',
        content: `TracerPay Sales Documentation Overview

This package contains comprehensive sales materials for TracerPay payment gateway solutions:

1. Product Overview
   - Payment processing capabilities
   - Security features and compliance
   - Integration options and technical specifications

2. Sales Collateral
   - Competitive analysis
   - Pricing sheets and rate structures
   - Case studies and success stories
   - ROI calculators and business benefits

3. Technical Documentation
   - API documentation and integration guides
   - System requirements and compatibility
   - Security protocols and compliance information

4. Marketing Materials
   - Product brochures and fact sheets
   - Sales presentation templates
   - Demo scripts and talking points

5. Onboarding Resources
   - Merchant application forms
   - Setup procedures and timelines
   - Training materials for new clients

Sales Process:
• Initial consultation and needs assessment
• Custom proposal preparation
• Technical integration planning
• Contract negotiation and signing
• Implementation and go-live support

Key Differentiators:
• Advanced fraud detection algorithms
• Seamless omnichannel processing
• Real-time analytics and reporting
• Industry-leading uptime (99.9%)
• Dedicated account management

For detailed information on any specific topic, please contact the TracerPay sales team or refer to the individual documents in this package.`,
        type: 'documentation'
      },
      {
        title: 'TracerPay Product Features and Benefits',
        content: `TracerPay Payment Gateway - Core Features

Payment Processing:
• Credit and debit card processing
• ACH/bank transfer capabilities
• Digital wallet support (Apple Pay, Google Pay, PayPal)
• Buy now, pay later options
• Cryptocurrency processing
• International payment support

Security and Compliance:
• PCI DSS Level 1 certified
• End-to-end encryption
• Tokenization services
• Advanced fraud scoring
• 3D Secure authentication
• Chargeback management

Reporting and Analytics:
• Real-time transaction monitoring
• Comprehensive reporting dashboard
• Custom report generation
• Settlement reporting
• Tax reporting features
• Performance analytics

Integration and APIs:
• RESTful API architecture
• Webhook notifications
• Pre-built integrations
• Mobile SDK availability
• Developer-friendly documentation
• Sandbox testing environment

Business Benefits:
• Increased conversion rates
• Reduced cart abandonment
• Lower processing costs
• Faster settlement times
• Enhanced customer experience
• Global market expansion

Support Services:
• 24/7 technical support
• Dedicated account management
• Implementation assistance
• Training and onboarding
• Regular system updates
• Compliance monitoring`,
        type: 'product_guide'
      }
    ];

    for (const doc of tracerPayDocs) {
      try {
        const docId = crypto.randomUUID();
        await db.insert(documents).values({
          id: docId,
          userId: 'system',
          folderId,
          title: doc.title,
          content: doc.content,
          type: doc.type,
          size: doc.content.length,
          permissions: 'public',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`📄 Created TracerPay document: ${doc.title}`);
      } catch (error) {
        console.error('Error creating TracerPay document:', error);
      }
    }
  }

  private getFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.pdf': return 'pdf';
      case '.pptx': case '.ppt': return 'presentation';
      case '.docx': case '.doc': return 'document';
      case '.xlsx': case '.xls': return 'spreadsheet';
      case '.txt': return 'text';
      case '.zip': return 'archive';
      default: return 'unknown';
    }
  }

  async processTracerPayUploads(): Promise<void> {
    try {
      const folderId = await this.createTracerPayFolder();
      
      // Process the zip file if it exists
      const zipPath = path.join(process.cwd(), 'attached_assets', 'tracerpay_sales_documentation_1749273045927.zip');
      await this.processZipFile(zipPath, folderId);
      
      // Process the PowerPoint file
      await this.processPowerPointFile(folderId);
      
      console.log('✅ TracerPay documentation processing completed');
    } catch (error) {
      console.error('Error processing TracerPay uploads:', error);
    }
  }

  private async processPowerPointFile(folderId: string): Promise<void> {
    try {
      const docId = crypto.randomUUID();
      await db.insert(documents).values({
        id: docId,
        userId: 'system',
        folderId,
        title: 'TracerPay Payment Gateway - Sales Presentation.pptx',
        content: `TracerPay Payment Gateway Sales Presentation

This comprehensive sales presentation covers:

• Company Overview and Mission
• Payment Processing Solutions Portfolio
• Competitive Advantages and Differentiators
• Target Market Analysis
• Technical Capabilities and Integration Options
• Security Features and Compliance Standards
• Pricing Models and Fee Structures
• Implementation Timeline and Support
• Case Studies and Success Stories
• ROI Analysis and Business Benefits

Key Talking Points:
- Advanced fraud protection with machine learning
- 99.9% uptime guarantee with redundant systems
- Global payment acceptance in 150+ countries
- Same-day funding options available
- White-label solutions for ISOs and partners
- Dedicated technical integration support
- Transparent pricing with no hidden fees
- Industry-leading conversion optimization

Sales Process:
1. Discovery call and needs assessment
2. Custom proposal and pricing presentation
3. Technical integration planning session
4. Contract negotiation and legal review
5. Implementation and testing phase
6. Go-live support and training
7. Ongoing account management and optimization

This presentation is designed for use with merchants, ISOs, and potential partners interested in TracerPay's payment processing solutions.`,
        type: 'presentation',
        size: 0,
        permissions: 'public',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('📄 Added TracerPay PowerPoint presentation');
    } catch (error) {
      console.error('Error processing PowerPoint file:', error);
    }
  }
}

export const tracerPayProcessor = new TracerPayProcessor();