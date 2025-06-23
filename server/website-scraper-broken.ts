import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { generateChatResponse } from './openai';

interface ScrapedContent {
  title: string;
  content: string;
  markdownContent: string;
  summary: string;
  bulletPoints: string[];
  sourceUrl: string;
  scrapedAt: string;
  wordCount: number;
}

class WebsiteScrapingService {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced'
    });

    // Configure turndown to handle common elements
    this.turndownService.addRule('removeStyles', {
      filter: ['style', 'script', 'noscript'],
      replacement: () => ''
    });

    this.turndownService.addRule('cleanLinks', {
      filter: 'a',
      replacement: (content: string, node: any) => {
        const href = node.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
          return content;
        }
        return `[${content}](${href})`;
      }
    });
  }

  async scrapeWebsite(url: string): Promise<ScrapedContent> {
    console.log('🌐 Starting website scraping for:', url);
    
    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      console.log('✅ URL validation passed:', parsedUrl.hostname);
    } catch (urlError) {
      console.error('❌ URL validation failed:', urlError);
      throw new Error(`Invalid URL format: ${url}`);
    }
    
    // Skip Puppeteer and use HTTP-only approach for better reliability
    try {
      console.log('🚀 Using HTTP-only scraping approach...');
      return await this.fallbackScrape(url);
    } catch (httpError: any) {
      console.error('❌ HTTP scraping failed, attempting Puppeteer fallback:', httpError);
      
      // Only try Puppeteer as last resort
      let browser;
      try {
        console.log('🔄 Attempting Puppeteer as fallback...');
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        });
        console.log('✅ Browser launched successfully');

        const page = await browser.newPage();
        
        // Set user agent to avoid blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the URL with timeout
        console.log('🌐 Navigating to URL...');
        await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
        console.log('✅ Page loaded successfully');

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract HTML content
        console.log('📄 Extracting HTML content...');
        const htmlContent = await page.content();
        console.log('✅ HTML content extracted, length:', htmlContent.length);
        
        // Parse with Cheerio
        const $ = cheerio.load(htmlContent);
        
        // Extract title
        const title = $('title').text().trim() || 
                     $('h1').first().text().trim() || 
                     'Scraped Website Content';

        // Remove unwanted elements
        $('script, style, nav, header, footer, aside, .advertisement, .ads, .cookie-banner').remove();
        
        // Extract main content (try common content selectors)
        let mainContent = '';
        const contentSelectors = [
          'main',
          '[role="main"]',
          '.main-content',
          '.content',
          '.article-content',
          '.post-content',
          'article',
          '.entry-content',
          '#content',
          '.page-content'
        ];

        for (const selector of contentSelectors) {
          const content = $(selector).html();
          if (content && content.trim().length > mainContent.length) {
            mainContent = content;
          }
        }

        // Fallback to body content if no main content found
        if (!mainContent || mainContent.trim().length < 500) {
          mainContent = $('body').html() || '';
        }

        // Convert to text for processing
        const textContent = $(mainContent).text().replace(/\s+/g, ' ').trim();
        
        // Convert HTML to Markdown
        const markdownContent = this.turndownService.turndown(mainContent);
        
        // Calculate word count
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

        // Generate summary and bullet points using AI
        console.log('🤖 Generating AI summary and bullet points...');
        const { summary, bulletPoints } = await this.generateSummaryAndBulletPoints(textContent, title, url);
        console.log('✅ AI summary generated successfully');

        await browser.close();
        console.log('🎉 Puppeteer scraping completed successfully');

        const result = {
          title,
          content: textContent,
          markdownContent,
          summary,
          bulletPoints,
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
          wordCount
        };

        console.log('📊 Scraping results:', {
          title: result.title.substring(0, 50) + '...',
          contentLength: result.content.length,
          markdownLength: result.markdownContent.length,
          wordCount: result.wordCount,
          bulletPointsCount: result.bulletPoints.length
        });

        return result;

    } catch (error: any) {
      if (browser) {
        await browser.close();
      }
      
      console.error('❌ Website scraping failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Fallback to simple HTTP request if Puppeteer fails
      try {
        console.log('🔄 Attempting fallback scraping method...');
        return await this.fallbackScrape(url);
      } catch (fallbackError: any) {
        console.error('❌ Fallback scraping also failed:', fallbackError);
        throw new Error(`Website scraping failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
    }
  }

  private async fallbackScrape(url: string): Promise<ScrapedContent> {
    console.log('🔄 Using fallback HTTP scraping method for:', url);
    
    try {
      const axios = await import('axios');
      
      const response = await axios.default.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });

      console.log('✅ HTTP request successful, response length:', response.data.length);

      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Website Content';
      
      console.log('📄 Extracted title:', title);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .cookie-banner').remove();
      
      // Try to find main content area
      let mainContent = '';
      const contentSelectors = [
        'main', 'article', '.content', '.main-content', 
        '.article-content', '.post-content', '#content'
      ];
      
      for (const selector of contentSelectors) {
        const content = $(selector).html();
        if (content && content.trim().length > mainContent.length) {
          mainContent = content;
        }
      }
      
      // Fallback to body if no main content found
      if (!mainContent || mainContent.trim().length < 200) {
        mainContent = $('body').html() || '';
      }
      
      // Extract text content
      const textContent = $(mainContent).text().replace(/\s+/g, ' ').trim();
      console.log('📝 Extracted text content length:', textContent.length);
      
      // Convert to markdown
      const markdownContent = this.turndownService.turndown(mainContent);
      console.log('📋 Converted to markdown, length:', markdownContent.length);
      
      // Calculate word count
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      console.log('🔢 Word count:', wordCount);
      
      // Generate summary and bullet points
      const { summary, bulletPoints } = await this.generateSummaryAndBulletPoints(textContent, title, url);

      console.log('✅ Fallback scraping completed successfully');

      return {
        title,
        content: textContent,
        markdownContent,
        summary,
        bulletPoints,
        sourceUrl: url,
        scrapedAt: new Date().toISOString(),
        wordCount
      };
    } catch (error: any) {
      console.error('❌ Fallback scraping failed:', error);
      throw new Error(`HTTP scraping failed: ${error.message}`);
    }
  }

  private async generateSummaryAndBulletPoints(content: string, title: string, url: string): Promise<{ summary: string; bulletPoints: string[] }> {
    try {
      // Truncate content if too long for AI processing
      const maxContentLength = 8000;
      const truncatedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength) + '...'
        : content;

      const prompt = `Please analyze the following web content and provide:

1. A concise 2-3 sentence summary
2. 5-8 key bullet points covering the main topics

Website: ${title}
URL: ${url}

Content:
${truncatedContent}

Please format your response as JSON:
{
  "summary": "Your summary here",
  "bulletPoints": ["Point 1", "Point 2", "Point 3", ...]
}`;

      const aiResponse = await generateChatResponse([
        { role: 'user', content: prompt }
      ]);

      // Try to parse JSON response
      try {
        const responseText = typeof aiResponse === 'string' ? aiResponse : (aiResponse as any).content || '';
        const parsed = JSON.parse(responseText);
        return {
          summary: parsed.summary || 'Content extracted from website',
          bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : []
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.warn('Failed to parse AI response as JSON, using fallback');
        return {
          summary: `Content extracted from ${title}. This document contains information about ${url.includes('zendesk') ? 'support documentation' : 'web content'} and related topics.`,
          bulletPoints: [
            'Web content extracted and converted to markdown format',
            'Source material from ' + new URL(url).hostname,
            'Processed for search and AI retrieval',
            'Contains relevant information for merchant services'
          ]
        };
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      return {
        summary: `Content extracted from ${title}. This document contains information scraped from the provided URL.`,
        bulletPoints: [
          'Web content extracted and converted to markdown format',
          'Source material from ' + new URL(url).hostname,
          'Processed for search and AI retrieval'
        ]
      };
    }
  }
}

export const websiteScrapingService = new WebsiteScrapingService();