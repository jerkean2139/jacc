import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import robotsParser from 'robots-parser';
import { db } from './db';
import { documents, vendors, vendorIntelligence, type InsertVendorIntelligence } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VendorUpdate {
  vendorName: string;
  updateType: 'pricing' | 'feature' | 'news' | 'partnership' | 'acquisition';
  content: string;
  sourceUrl: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;
}

interface VendorIntelligence {
  vendorName: string;
  website: string;
  blogUrl?: string;
  pressUrl?: string;
  lastCrawled: Date;
  updates: VendorUpdate[];
  competitiveMetrics: {
    marketShare: number;
    growthRate: number;
    customerSentiment: number;
  };
}

export class VendorIntelligenceEngine {
  private crawlConfig = [
    // Processors with real crawling configurations
    { 
      name: 'Clearent', 
      type: 'processor',
      website: 'https://clearent.com', 
      blogUrl: 'https://clearent.com/blog',
      pricingUrl: 'https://clearent.com/pricing',
      newsSelectors: { title: 'h2.post-title', content: '.post-content', date: '.post-date', link: 'a.post-link' }
    },
    { 
      name: 'First Data (Fiserv)', 
      type: 'processor',
      website: 'https://fiserv.com', 
      blogUrl: 'https://fiserv.com/insights',
      newsSelectors: { title: 'h3.card-title', content: '.card-description', date: '.publish-date', link: 'a.card-link' }
    },
    { 
      name: 'TSYS', 
      type: 'processor',
      website: 'https://tsys.com', 
      blogUrl: 'https://tsys.com/news-events',
      newsSelectors: { title: '.news-title', content: '.news-excerpt', date: '.news-date', link: '.news-link' }
    },
    { 
      name: 'Worldpay', 
      type: 'processor',
      website: 'https://worldpay.com', 
      blogUrl: 'https://worldpay.com/us/insights',
      newsSelectors: { title: 'h3.insight-title', content: '.insight-summary', date: '.publish-date', link: 'a.insight-link' }
    },
    { 
      name: 'Heartland', 
      type: 'processor',
      website: 'https://heartlandpaymentsystems.com', 
      blogUrl: 'https://heartlandpaymentsystems.com/blog',
      newsSelectors: { title: '.blog-title', content: '.blog-excerpt', date: '.blog-date', link: '.blog-link' }
    },
    { 
      name: 'Maverick', 
      type: 'processor',
      website: 'https://maverickpayments.com', 
      blogUrl: 'https://maverickpayments.com/news',
      newsSelectors: { title: '.news-headline', content: '.news-content', date: '.news-timestamp', link: '.news-url' }
    },
    { 
      name: 'Chase Paymentech', 
      type: 'processor',
      website: 'https://chase.com/business/payments', 
      blogUrl: 'https://chase.com/business/insights',
      newsSelectors: { title: 'h3.article-title', content: '.article-summary', date: '.article-date', link: 'a.article-link' }
    },
    { 
      name: 'North American Bancard', 
      type: 'processor',
      website: 'https://nabancard.com', 
      blogUrl: 'https://nabancard.com/news',
      newsSelectors: { title: '.press-title', content: '.press-summary', date: '.press-date', link: '.press-link' }
    },
    { 
      name: 'MiCamp', 
      type: 'processor',
      website: 'https://micamp.com', 
      blogUrl: 'https://micamp.com/blog',
      newsSelectors: { title: 'h2.entry-title', content: '.entry-summary', date: '.entry-date', link: 'a.entry-link' }
    },
    { 
      name: 'Priority Payments', 
      type: 'processor',
      website: 'https://prioritypayments.com', 
      blogUrl: 'https://prioritypayments.com/news',
      newsSelectors: { title: '.update-title', content: '.update-content', date: '.update-date', link: '.update-link' }
    },
    { 
      name: 'TRX', 
      type: 'processor',
      website: 'https://trxpayments.com', 
      blogUrl: 'https://trxpayments.com/blog',
      newsSelectors: { title: 'h3.post-title', content: '.post-excerpt', date: '.post-meta', link: 'a.post-permalink' }
    },
    { 
      name: 'Total Merchant Services', 
      type: 'processor',
      website: 'https://totalmerchantservices.com', 
      blogUrl: 'https://totalmerchantservices.com/blog',
      newsSelectors: { title: '.blog-post-title', content: '.blog-post-excerpt', date: '.blog-post-date', link: 'a.blog-post-link' }
    },
    { 
      name: 'PayBright', 
      type: 'processor',
      website: 'https://paybright.com', 
      blogUrl: 'https://paybright.com/news',
      newsSelectors: { title: '.announcement-title', content: '.announcement-body', date: '.announcement-date', link: '.announcement-link' }
    },

    // Gateways with enhanced configurations
    { 
      name: 'Stripe', 
      type: 'gateway',
      website: 'https://stripe.com', 
      blogUrl: 'https://stripe.com/blog',
      newsSelectors: { title: 'h3.BlogPostCard__title', content: '.BlogPostCard__excerpt', date: '.BlogPostCard__date', link: 'a.BlogPostCard__link' }
    },
    { 
      name: 'ACI Worldwide', 
      type: 'gateway',
      website: 'https://aciworldwide.com', 
      blogUrl: 'https://aciworldwide.com/insights',
      newsSelectors: { title: '.insight-title', content: '.insight-excerpt', date: '.insight-date', link: 'a.insight-link' }
    },
    { 
      name: 'TracerPay', 
      type: 'gateway',
      website: 'https://tracerpay.com', 
      blogUrl: 'https://tracerpay.com/news',
      newsSelectors: { title: '.news-title', content: '.news-summary', date: '.news-date', link: 'a.news-link' }
    },
    { 
      name: 'TracerFlex', 
      type: 'gateway',
      website: 'https://tracerflex.com', 
      blogUrl: 'https://tracerflex.com/updates',
      newsSelectors: { title: '.update-headline', content: '.update-content', date: '.update-timestamp', link: 'a.update-link' }
    },
    { 
      name: 'Adyen', 
      type: 'gateway',
      website: 'https://adyen.com', 
      blogUrl: 'https://adyen.com/blog',
      newsSelectors: { title: 'h3.blog-title', content: '.blog-excerpt', date: '.blog-date', link: 'a.blog-link' }
    },
    { 
      name: 'Payline Data', 
      type: 'gateway',
      website: 'https://paylinedata.com', 
      blogUrl: 'https://paylinedata.com/blog',
      newsSelectors: { title: '.post-title', content: '.post-excerpt', date: '.post-date', link: 'a.post-link' }
    },
    { 
      name: 'CSG Forte', 
      type: 'gateway',
      website: 'https://forte.net', 
      blogUrl: 'https://forte.net/blog',
      newsSelectors: { title: 'h2.blog-title', content: '.blog-summary', date: '.blog-published', link: 'a.blog-permalink' }
    },
    { 
      name: 'Accept Blue', 
      type: 'gateway',
      website: 'https://acceptblue.com', 
      blogUrl: 'https://acceptblue.com/news',
      newsSelectors: { title: '.announcement-title', content: '.announcement-text', date: '.announcement-date', link: 'a.announcement-link' }
    },
    { 
      name: 'Authorize.net', 
      type: 'gateway',
      website: 'https://authorize.net', 
      blogUrl: 'https://authorize.net/blog',
      newsSelectors: { title: 'h3.entry-title', content: '.entry-content', date: '.entry-date', link: 'a.entry-link' }
    },
    { 
      name: 'NMI', 
      type: 'gateway',
      website: 'https://nmi.com', 
      blogUrl: 'https://nmi.com/blog',
      newsSelectors: { title: '.blog-post-title', content: '.blog-post-content', date: '.blog-post-date', link: 'a.blog-post-link' }
    },
    { 
      name: 'PayPal', 
      type: 'gateway',
      website: 'https://paypal.com', 
      blogUrl: 'https://newsroom.paypal-corp.com',
      newsSelectors: { title: '.press-title', content: '.press-summary', date: '.press-date', link: 'a.press-link' }
    },
    { 
      name: 'Square', 
      type: 'gateway',
      website: 'https://squareup.com', 
      blogUrl: 'https://squareup.com/townsquare',
      newsSelectors: { title: 'h2.article-title', content: '.article-excerpt', date: '.article-date', link: 'a.article-link' }
    },
    { name: 'Square', website: 'https://squareup.com', blogUrl: 'https://squareup.com/us/en/press' },

    // Hardware
    { name: 'Clover', website: 'https://clover.com', blogUrl: 'https://blog.clover.com' },
    { name: 'Verifone', website: 'https://verifone.com', blogUrl: 'https://verifone.com/en/newsroom' },
    { name: 'Ingenico', website: 'https://ingenico.com', blogUrl: 'https://ingenico.com/press' },
    { name: 'NCR Corporation', website: 'https://ncr.com', blogUrl: 'https://ncr.com/news' },
    { name: 'PAX Technology', website: 'https://pax.us', blogUrl: 'https://pax.us/news' },
    { name: 'Lightspeed', website: 'https://lightspeedhq.com', blogUrl: 'https://lightspeedhq.com/blog' },
    { name: 'Elo Touch Solutions', website: 'https://elotouch.com', blogUrl: 'https://elotouch.com/news-events' },
    { name: 'Datacap Systems', website: 'https://datacapsystems.com', blogUrl: 'https://datacapsystems.com/news' },
    { name: 'Tabit', website: 'https://tabit.cloud', blogUrl: 'https://tabit.cloud/blog' },
    { name: 'rPower', website: 'https://rpower.com', blogUrl: 'https://rpower.com/blog' },
    { name: 'TouchBistro', website: 'https://touchbistro.com', blogUrl: 'https://touchbistro.com/blog' },
    { name: 'SwipeSimple', website: 'https://swipesimple.com', blogUrl: 'https://swipesimple.com/blog' }
  ];

  async performWeeklyCrawl(): Promise<VendorUpdate[]> {
    console.log('🕷️ Starting weekly vendor intelligence crawl...');
    const allUpdates: VendorUpdate[] = [];

    for (const vendor of this.vendors) {
      try {
        console.log(`Crawling ${vendor.name}...`);
        
        // Crawl vendor website and blog
        const updates = await this.crawlVendorSources(vendor);
        allUpdates.push(...updates);

        // Analyze industry news mentions
        const newsUpdates = await this.analyzeIndustryNews(vendor.name);
        allUpdates.push(...newsUpdates);

        // Update vendor intelligence database
        await this.updateVendorIntelligence(vendor.name, updates);

        // Rate limit to avoid overwhelming servers
        await this.delay(2000);
      } catch (error) {
        console.error(`Error crawling ${vendor.name}:`, error);
      }
    }

    // Generate competitive intelligence reports
    await this.generateCompetitiveIntelligence(allUpdates);

    console.log(`✅ Weekly crawl completed. Found ${allUpdates.length} updates.`);
    return allUpdates;
  }

  private async crawlVendorSources(vendor: any): Promise<VendorUpdate[]> {
    const updates: VendorUpdate[] = [];

    try {
      // Use Puppeteer for dynamic content crawling
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; JACC-Intelligence/1.0)');
      
      // Crawl main website
      await page.goto(vendor.website, { waitUntil: 'networkidle2', timeout: 30000 });
      const websiteContent = await page.content();
      const pricingUpdates = await this.analyzePricingChanges(vendor.name, websiteContent, vendor.website);
      updates.push(...pricingUpdates);

      // Crawl blog if available
      if (vendor.blogUrl) {
        await page.goto(vendor.blogUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const blogContent = await page.content();
        const featureUpdates = await this.analyzeFeatureAnnouncements(vendor.name, blogContent, vendor.blogUrl);
        updates.push(...featureUpdates);
      }

      await browser.close();

      // Check for press releases via news API
      const pressUpdates = await this.analyzePressReleases(vendor.name);
      updates.push(...pressUpdates);

    } catch (error) {
      console.error(`Error crawling ${vendor.name}:`, error);
    }

    return updates;
  }

  private async fetchWebContent(url: string): Promise<string> {
    try {
      // First try HTTP request with axios
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JACC-Intelligence/1.0; +info@jacc.ai)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`HTTP fetch failed for ${url}, falling back to Puppeteer:`, error);
      
      // Fallback to Puppeteer for dynamic content
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; JACC-Intelligence/1.0)');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      await browser.close();
      
      return content;
    }
  }

  private async analyzePricingChanges(vendorName: string, content: string): Promise<VendorUpdate[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a payment processing industry analyst. Analyze the content for pricing changes, rate updates, or fee modifications. Focus on:
            - Processing rate changes
            - Fee structure updates
            - New pricing models
            - Promotional rates
            - Contract term changes
            
            Return only significant changes that would impact competitive analysis.`
          },
          {
            role: 'user',
            content: `Analyze this content from ${vendorName} for pricing changes:\n\n${content.substring(0, 4000)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (analysis.changes && analysis.changes.length > 0) {
        return analysis.changes.map((change: any) => ({
          vendorName,
          updateType: 'pricing' as const,
          content: change.description,
          sourceUrl: '',
          confidence: change.confidence || 0.7,
          impact: change.impact || 'medium',
          actionRequired: change.significant || false
        }));
      }
    } catch (error) {
      console.error(`Error analyzing pricing for ${vendorName}:`, error);
    }

    return [];
  }

  private async analyzeFeatureAnnouncements(vendorName: string, content: string): Promise<VendorUpdate[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a payment technology analyst. Analyze content for new feature announcements, product launches, or technology updates. Focus on:
            - New payment methods
            - Security enhancements
            - Integration capabilities
            - Hardware releases
            - Software updates
            - API improvements
            
            Identify features that would impact competitive positioning.`
          },
          {
            role: 'user',
            content: `Analyze this content from ${vendorName} for feature announcements:\n\n${content.substring(0, 4000)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (analysis.features && analysis.features.length > 0) {
        return analysis.features.map((feature: any) => ({
          vendorName,
          updateType: 'feature' as const,
          content: feature.description,
          sourceUrl: '',
          confidence: feature.confidence || 0.8,
          impact: feature.impact || 'medium',
          actionRequired: feature.competitive_threat || false
        }));
      }
    } catch (error) {
      console.error(`Error analyzing features for ${vendorName}:`, error);
    }

    return [];
  }

  private async analyzePressReleases(vendorName: string): Promise<VendorUpdate[]> {
    try {
      // Search for recent press releases using news APIs or RSS feeds
      const newsContent = await this.searchVendorNews(vendorName);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a business intelligence analyst. Analyze press releases and news for significant business developments:
            - Acquisitions and mergers
            - Partnership announcements
            - Executive changes
            - Funding rounds
            - Market expansion
            - Regulatory changes
            
            Focus on developments that impact competitive landscape.`
          },
          {
            role: 'user',
            content: `Analyze recent news about ${vendorName}:\n\n${newsContent.substring(0, 4000)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (analysis.developments && analysis.developments.length > 0) {
        return analysis.developments.map((dev: any) => ({
          vendorName,
          updateType: 'news' as const,
          content: dev.description,
          sourceUrl: dev.url || '',
          confidence: dev.confidence || 0.8,
          impact: dev.impact || 'medium',
          actionRequired: dev.action_needed || false
        }));
      }
    } catch (error) {
      console.error(`Error analyzing press releases for ${vendorName}:`, error);
    }

    return [];
  }

  private async searchVendorNews(vendorName: string): Promise<string> {
    // Implement news search using news APIs (NewsAPI, Google News, etc.)
    // For now return placeholder
    return `Recent news about ${vendorName} - News API integration needed`;
  }

  private async analyzeIndustryNews(vendorName: string): Promise<VendorUpdate[]> {
    try {
      // Search for industry-wide news that mentions the vendor
      const industryNews = await this.searchIndustryMentions(vendorName);
      
      if (!industryNews) return [];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Analyze industry news mentions of payment processors. Look for:
            - Market share changes
            - Competitive comparisons
            - Industry rankings
            - Customer wins/losses
            - Regulatory impacts
            - Technology trends affecting the vendor`
          },
          {
            role: 'user',
            content: `Analyze industry mentions of ${vendorName}:\n\n${industryNews.substring(0, 4000)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (analysis.mentions && analysis.mentions.length > 0) {
        return analysis.mentions.map((mention: any) => ({
          vendorName,
          updateType: 'news' as const,
          content: mention.description,
          sourceUrl: mention.url || '',
          confidence: mention.confidence || 0.7,
          impact: mention.impact || 'low',
          actionRequired: mention.competitive_impact || false
        }));
      }
    } catch (error) {
      console.error(`Error analyzing industry news for ${vendorName}:`, error);
    }

    return [];
  }

  private async searchIndustryMentions(vendorName: string): Promise<string> {
    // Search industry publications for vendor mentions
    // Implementation would use news APIs, RSS feeds, or web scraping
    return `Industry mentions of ${vendorName} - Industry news API integration needed`;
  }

  private async updateVendorIntelligence(vendorName: string, updates: VendorUpdate[]): Promise<void> {
    try {
      if (updates.length === 0) return;

      // Store updates in the database for JACC's knowledge base
      for (const update of updates) {
        await db.insert(documents).values({
          id: crypto.randomUUID(),
          name: `${vendorName} Intelligence Update - ${update.updateType}`,
          content: update.content,
          mimeType: 'text/plain',
          size: update.content.length,
          uploadedBy: 'system',
          folderId: await this.getOrCreateIntelligenceFolder(),
          isProcessed: true,
          isIndexed: true,
          isPublic: true
        });
      }

      console.log(`✅ Stored ${updates.length} updates for ${vendorName}`);
    } catch (error) {
      console.error(`Error updating vendor intelligence for ${vendorName}:`, error);
    }
  }

  private async getOrCreateIntelligenceFolder(): Promise<string> {
    // Implementation to get or create a "Vendor Intelligence" folder
    // This would query/create the appropriate folder structure
    return 'vendor-intelligence-folder-id';
  }

  private async generateCompetitiveIntelligence(updates: VendorUpdate[]): Promise<void> {
    try {
      // Group updates by impact and type
      const highImpactUpdates = updates.filter(u => u.impact === 'high');
      const actionRequiredUpdates = updates.filter(u => u.actionRequired);

      if (highImpactUpdates.length > 0 || actionRequiredUpdates.length > 0) {
        // Generate competitive intelligence report
        const report = await this.generateIntelligenceReport(updates);
        
        // Store report in document center
        await db.insert(documents).values({
          id: crypto.randomUUID(),
          name: `Weekly Competitive Intelligence Report - ${new Date().toISOString().split('T')[0]}`,
          content: report,
          mimeType: 'text/markdown',
          size: report.length,
          uploadedBy: 'system',
          folderId: await this.getOrCreateIntelligenceFolder(),
          isProcessed: true,
          isIndexed: true,
          isPublic: true
        });

        console.log('✅ Generated weekly competitive intelligence report');
      }
    } catch (error) {
      console.error('Error generating competitive intelligence:', error);
    }
  }

  private async generateIntelligenceReport(updates: VendorUpdate[]): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Generate a comprehensive competitive intelligence report for sales agents. Include:
          - Executive summary of key developments
          - Competitive threats and opportunities
          - Pricing changes that affect positioning
          - New features that require response
          - Recommended actions for sales team
          - Updated talking points against competitors
          
          Format as markdown for easy reading.`
        },
        {
          role: 'user',
          content: `Generate report from these vendor updates:\n\n${JSON.stringify(updates, null, 2)}`
        }
      ],
      max_tokens: 2000
    });

    return response.choices[0].message.content || 'Report generation failed';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to manually trigger intelligence gathering for a specific vendor
  async gatherVendorIntelligence(vendorName: string): Promise<VendorIntelligence> {
    const vendor = this.vendors.find(v => v.name === vendorName);
    if (!vendor) {
      throw new Error(`Vendor ${vendorName} not found in intelligence system`);
    }

    const updates = await this.crawlVendorSources(vendor);
    await this.updateVendorIntelligence(vendorName, updates);

    return {
      vendorName,
      website: vendor.website,
      blogUrl: vendor.blogUrl,
      lastCrawled: new Date(),
      updates,
      competitiveMetrics: await this.calculateCompetitiveMetrics(vendorName)
    };
  }

  private async calculateCompetitiveMetrics(vendorName: string): Promise<any> {
    // Placeholder for competitive metrics calculation
    // This would integrate with market research APIs, sentiment analysis, etc.
    return {
      marketShare: 0,
      growthRate: 0,
      customerSentiment: 0
    };
  }
}

export const vendorIntelligence = new VendorIntelligenceEngine();