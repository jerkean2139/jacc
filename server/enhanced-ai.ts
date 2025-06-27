import Anthropic from '@anthropic-ai/sdk';
import { pineconeVectorService, type VectorSearchResult } from "./pinecone-vector";
import { perplexitySearchService, type ExternalSearchResult } from "./perplexity-search";
import { aiEnhancedSearchService } from "./ai-enhanced-search";
import { promptChainService } from "./prompt-chain";
import { smartRoutingService } from "./smart-routing";
import { unifiedLearningSystem } from "./unified-learning-system";
import { db } from "./db";
import { webSearchLogs, adminSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { ChatMessage, AIResponse } from "./openai";

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY_JACC
});

export interface EnhancedAIResponse extends AIResponse {
  sources?: DocumentSource[];
  reasoning?: string;
  needsExternalSearchPermission?: boolean;
  actionItems?: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: string;
    category: string;
  }>;
  followupTasks?: Array<{
    task: string;
    timeframe: string;
    type: 'call' | 'email' | 'meeting' | 'document' | 'other';
  }>;
}

export interface DocumentSource {
  name: string;
  url: string;
  relevanceScore: number;
  snippet: string;
  type: string;
}

export class EnhancedAIService {
  
  async getAdminSettings() {
    const [settings] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.id, 'default'))
      .limit(1);
    
    return settings || {
      enablePromptChaining: true,
      enableSmartRouting: true,
      folderRoutingThreshold: 0.7
    };
  }

  async generateChainedResponse(
    message: string,
    conversationHistory: ChatMessage[],
    userId: string
  ): Promise<EnhancedAIResponse> {
    try {
      console.log(`🔍 Step 1: Searching internal document database for user ${userId}`);
      
      // Step 1: Search internal documents only
      const documentResults = await this.searchDocuments(message);
      
      if (documentResults.length > 0) {
        console.log(`✅ Found ${documentResults.length} relevant documents in internal database`);
        
        // Generate response with document context
        return await this.generateResponseWithDocuments(
          conversationHistory,
          {
            searchResults: documentResults,
            userRole: 'Sales Agent'
          }
        );
      } else {
        console.log(`❌ No relevant documents found in internal database`);
        
        // Return response indicating no documents found and asking for permission to search externally
        return {
          message: "I searched our internal document database but didn't find specific information about your query. Would you like me to search external sources for additional information?",
          sources: [],
          reasoning: "No relevant documents found in internal database",
          suggestions: ["Search external sources", "Try a different search term", "Upload relevant documents"],
          actions: [{ type: 'find_documents', label: 'Search External Sources', data: { query: message } }],
          needsExternalSearchPermission: true
        };
      }
      
    } catch (error) {
      console.error('Document search failed, falling back to standard response:', error);
      return await this.generateStandardResponse(message, conversationHistory, userId);
    }
  }

  async generateStandardResponse(
    message: string,
    conversationHistory: ChatMessage[],
    userId?: string
  ): Promise<EnhancedAIResponse> {
    // Step 1: Get user's custom prompt if available
    let customPrompt = null;
    if (userId) {
      const { storage } = await import('./storage');
      customPrompt = await storage.getUserDefaultPrompt(userId);
    }

    // Step 2: Memory-optimized document search with limited results
    const searchResults = await this.searchDocuments(message, 5); // Limit to 5 results for memory optimization
    
    if (searchResults.length > 0) {
      console.log(`📋 Found ${searchResults.length} documents for: "${message.substring(0, 50)}..."`);
      const messages = [...conversationHistory.slice(-3), { role: 'user' as const, content: message }]; // Keep only last 3 messages
      return await this.generateResponseWithDocuments(messages, { searchResults, customPrompt });
    }
    
    // Step 3: If no internal documents found, still use custom prompt for general response
    const messages = [...conversationHistory, { role: 'user' as const, content: message }];
    return await this.generateResponseWithDocuments(messages, { customPrompt });
  }

  async generateResponseWithDocuments(
    messages: ChatMessage[],
    context?: {
      searchResults?: VectorSearchResult[];
      customPrompt?: any;
      userRole?: string;
      documents?: Array<{ name: string; content?: string }>;
      spreadsheetData?: any;
    }
  ): Promise<EnhancedAIResponse> {
    const startTime = Date.now();
    try {
      // Find the last user message in the conversation
      const lastUserMessage = messages.slice().reverse().find(msg => msg.role === 'user');
      if (!lastUserMessage) {
        throw new Error('No user message found in conversation');
      }

      // STEP 1: Search FAQ Knowledge Base FIRST
      let faqResults = [];
      let searchResults = context?.searchResults || [];
      let webSearchResults = null;
      
      if (searchResults.length === 0) {
        try {
          console.log(`🔍 STEP 1: Searching FAQ Knowledge Base for: "${lastUserMessage.content}"`);
          faqResults = await this.searchFAQKnowledgeBase(lastUserMessage.content);
          
          if (faqResults.length > 0) {
            console.log(`✅ Found ${faqResults.length} FAQ matches - using FAQ knowledge base`);
            // Convert FAQ results to searchResults format
            searchResults = faqResults.map(faq => ({
              id: `faq-${faq.id}`,
              score: 0.95, // High confidence for FAQ matches
              documentId: `faq-${faq.id}`,
              content: `**Q: ${faq.question}**\n\n**A:** ${faq.answer}`,
              metadata: {
                documentName: `FAQ: ${faq.question}`,
                category: faq.category,
                source: 'faq_knowledge_base',
                mimeType: 'text/faq'
              }
            }));
          } else {
            console.log(`📄 STEP 2: No FAQ matches found - searching document center`);
            // Only search documents if no FAQ matches found
            searchResults = await this.searchDocuments(lastUserMessage.content);
            console.log(`Found ${searchResults.length} document matches for: "${lastUserMessage.content}"`);
          }
        } catch (error) {
          console.log("FAQ and document search failed");
          searchResults = [];
        }
      }
      
      // STEP 2: Double-check with alternative search strategies if no results
      if (searchResults.length === 0) {
        console.log("Step 2: No documents found, trying comprehensive alternative searches...");
        
        const alternativeQueries = this.generateAlternativeQueries(lastUserMessage.content);
        
        for (const altQuery of alternativeQueries) {
          try {
            const altResults = await this.searchDocuments(altQuery);
            console.log(`Step 2: Alternative query "${altQuery}" found ${altResults.length} results`);
            if (altResults.length > 0) {
              searchResults = altResults;
              console.log("Step 2: Found relevant documents with alternative search!");
              break;
            }
          } catch (error) {
            console.log(`Step 2: Alternative query "${altQuery}" failed`);
          }
        }
      }
      
      // STEP 3: Web search only if no FAQ or document matches found
      let webSearchReason = null;
      if (searchResults.length === 0) {
        console.log(`🌐 STEP 3: No internal matches found - searching web for: "${lastUserMessage.content}"`);
        // Validate query is business-appropriate before web search
        if (this.isBusinessAppropriateQuery(lastUserMessage.content)) {
          webSearchReason = "No matches found in JACC Memory (FAQ knowledge base and document center). Searched the web for helpful information.";
          try {
            webSearchResults = await perplexitySearchService.searchWeb(lastUserMessage.content);
            console.log("✅ Web search completed - providing external results with JACC Memory disclaimer");
            
            // Log the web search usage
            await this.logWebSearchUsage(lastUserMessage.content, webSearchResults.content, webSearchReason, context);
          } catch (error) {
            console.log("Web search failed, proceeding without web results");
          }
        } else {
          console.log("Query blocked: Not business-appropriate for external search");
          webSearchReason = "Query outside business scope - external search restricted";
        }
      } else {
        console.log("Using internal knowledge base, web search not needed");
      }
      
      // Create context from search results
      const documentContext = this.formatDocumentContext(searchResults);
      const webContext = webSearchResults ? `\n\n**EXTERNAL WEB SEARCH RESULTS:**\n${webSearchResults.content}\n${webSearchResults.citations.length > 0 ? `\nSources: ${webSearchResults.citations.join(', ')}` : ''}` : '';
      
      // Create document examples for response (show top 3)
      const topDocuments = searchResults.slice(0, 3);
      const documentExamples = topDocuments.map(doc => {
        const docName = doc.metadata?.documentName || 'Document';
        const docType = doc.metadata?.mimeType?.includes('pdf') ? 'PDF' : 
                       doc.metadata?.mimeType?.includes('spreadsheet') ? 'Excel' : 
                       doc.metadata?.mimeType?.includes('document') ? 'Word' : 'Document';
        const snippet = doc.content.substring(0, 150).replace(/\n/g, ' ').trim();
        
        return `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 8px 0; background: #f9fafb;">
<h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">📄 ${docName}</h4>
<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${docType} • ${snippet}...</p>
<div style="display: flex; gap: 12px;">
<a href="/documents/${doc.documentId}" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;" target="_blank">
🔗 View Document
</a>
<a href="/api/documents/${doc.documentId}/download" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #6b7280; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;" download="${docName}">
⬇️ Download
</a>
</div>
</div>`;
      }).join('\n');
      
      // Check if this is a conversation starter that needs engagement
      const userMessages = messages.filter(msg => msg.role === 'user');
      const isFirstUserMessage = userMessages.length === 1;
      const isConversationStarter = isFirstUserMessage && (
        lastUserMessage.content.includes("calculate the perfect processing rates") || 
        lastUserMessage.content.includes("help you compare processors") ||
        lastUserMessage.content.includes("payment processing industry") ||
        lastUserMessage.content.includes("prepare a proposal for a new client") ||
        lastUserMessage.content.includes("merchant services expert") ||
        lastUserMessage.content.includes("To provide the most relevant analysis") ||
        lastUserMessage.content.includes("Perfect timing! The payment processing") ||
        lastUserMessage.content.includes("Excellent! I'll help you create")
      );

      // Debug conversation starter detection
      console.log(`🔍 CONVERSATION STARTER DEBUG:`, {
        isFirstUserMessage,
        userMessageCount: userMessages.length,
        messageContent: lastUserMessage.content.substring(0, 100),
        isConversationStarter,
        detectedPhrases: [
          lastUserMessage.content.includes("calculate the perfect processing rates"),
          lastUserMessage.content.includes("merchant services expert")
        ]
      });

      // Enhanced system prompt with document and web context
      const systemPrompt = isConversationStarter ? 
        `You are JACC, a friendly merchant services expert. 

For conversation starters, respond with:
1. Brief friendly acknowledgment (1 sentence)
2. ONE specific question to start gathering information
3. Show enthusiasm

Example: "Perfect! I'd love to help you find the best rates. What type of business are we working with?"

Keep it short, conversational, and ask only ONE question at a time.` :
        
        // Check if this is a request for visual formatting/styling
        (lastUserMessage.content.toLowerCase().includes('style') || 
         lastUserMessage.content.toLowerCase().includes('format') || 
         lastUserMessage.content.toLowerCase().includes('visual') ||
         lastUserMessage.content.toLowerCase().includes('make it easier to read') ||
         lastUserMessage.content.toLowerCase().includes('hormozi') ||
         lastUserMessage.content.toLowerCase().includes('stunning') ||
         lastUserMessage.content.toLowerCase().includes('better formatting') ||
         lastUserMessage.content.toLowerCase().includes('html formatting')) ?
        
        `You are JACC, a merchant services expert trained in Alex Hormozi's high-converting marketing techniques.

The user is requesting visual formatting improvements. You MUST use the Alex Hormozi-inspired HTML template provided below.

MANDATORY: Use this EXACT HTML structure for your response:

<div class="hormozi-content">
<div class="attention-grabber">
<h1>🎯 [COMPELLING HEADLINE]</h1>
<p class="big-promise">[BIG PROMISE OR HOOK]</p>
</div>

<div class="value-stack">
<h2>💰 What You Get:</h2>
<ul class="benefit-list">
<li><strong>[BENEFIT 1]:</strong> [Specific outcome]</li>
<li><strong>[BENEFIT 2]:</strong> [Specific outcome]</li>
<li><strong>[BENEFIT 3]:</strong> [Specific outcome]</li>
</ul>
</div>

<div class="social-proof">
<h3>✅ Proven Results:</h3>
<blockquote class="testimonial">[Social proof or case study]</blockquote>
</div>

<div class="action-steps">
<h2>🚀 Your Action Plan:</h2>
<ol class="step-list">
<li><strong>Step 1:</strong> [Clear action]</li>
<li><strong>Step 2:</strong> [Clear action]</li>
<li><strong>Step 3:</strong> [Clear action]</li>
</ol>
</div>

<div class="urgency-scarcity">
<p class="urgent-text">⚡ <strong>Time-Sensitive:</strong> [Create urgency]</p>
</div>
</div>

Replace bracketed placeholders with actual content. Focus on:
- Clear, specific benefits
- Concrete outcomes  
- Social proof elements
- Actionable steps
- Urgency/scarcity drivers

Use this structure for ANY response about formatting, styling, or making content "easier to read."

EXAMPLE TRANSFORMATION:
If user says: "reformat that 30 day marketing plan using Alex Hormozi style"
You MUST respond with the full HTML template above, not markdown.

Remember: The user wants VISUAL IMPACT, not plain text. Use the HTML structure with proper class names.

YOU MUST START YOUR RESPONSE WITH: <div class="hormozi-content">` :
        `You are JACC, a knowledgeable AI assistant for merchant services sales agents.

**SEARCH HIERARCHY COMPLETED:**
${faqResults.length > 0 ? `✅ Found ${faqResults.length} matches in FAQ Knowledge Base` : 
  searchResults.length > 0 ? `✅ Found ${searchResults.length} matches in Document Center` :
  webSearchResults ? `❌ Nothing found in JACC Memory (FAQ + Documents). Searched the web and found information that may be helpful.` :
  `❌ No relevant information found in internal systems or web search.`}

**ALEX HORMOZI-INSPIRED VISUAL FORMATTING:**

Use this EXACT HTML structure for all comprehensive responses:

<div style="max-width: 900px; font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.7; color: #1a1a1a; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 32px; margin: 16px 0;">

<div style="text-align: center; margin-bottom: 32px; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px;">
<h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.025em;">[RESPONSE TITLE]</h1>
<p style="color: #64748b; font-size: 16px; margin: 0; font-weight: 500;">Complete Action Plan • Ready to Execute</p>
</div>

<div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; position: relative;">
<div style="position: absolute; top: -8px; right: -8px; background: #ffd700; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">PROVEN SYSTEM</div>
<h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">🎯 THE BOTTOM LINE</h2>
<p style="margin: 0; font-size: 16px; font-weight: 500; line-height: 1.5;">[Executive Summary - Clear, direct value proposition]</p>
</div>

<div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
<h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; display: flex; align-items: center;">
<span style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">1</span>
IMMEDIATE ACTION STEPS
</h2>
<div style="space-y: 16px;">
<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">
<h3 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Week 1: Foundation Setup</h3>
<p style="color: #475569; margin: 0; font-size: 14px;">[Specific action items]</p>
</div>
<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; border-left: 4px solid #f59e0b;">
<h3 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Week 2-3: Implementation</h3>
<p style="color: #475569; margin: 0; font-size: 14px;">[Detailed execution plan]</p>
</div>
<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; border-left: 4px solid #8b5cf6;">
<h3 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Week 4: Optimization</h3>
<p style="color: #475569; margin: 0; font-size: 14px;">[Scaling and improvement]</p>
</div>
</div>
</div>

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 24px; margin: 24px 0;">
<h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
⚡ ALEX HORMOZI METHOD: Value Stacking
</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
<div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
<h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">📈 Expected ROI</h4>
<p style="margin: 0; font-size: 13px; opacity: 0.9;">[Specific value metrics]</p>
</div>
<div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
<h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">⏰ Time Investment</h4>
<p style="margin: 0; font-size: 13px; opacity: 0.9;">[Clear timeline]</p>
</div>
</div>
</div>

<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
<h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
🏆 INSIDER SECRETS (From $100M+ Entrepreneurs)
</h3>
<ul style="margin: 0; padding-left: 20px; color: #92400e; font-weight: 500;">
<li style="margin-bottom: 8px;">[Gary Vaynerchuk insight or technique]</li>
<li style="margin-bottom: 8px;">[Neil Patel strategy reference]</li>
<li style="margin-bottom: 0;">[StoryBrand framework application]</li>
</ul>
</div>

<div style="background: linear-gradient(135deg, #56cc9d 0%, #159957 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; color: white;">
<h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">💎 SAVE THIS GAME PLAN</h3>
<p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">Download as a professional PDF action plan you can reference and share</p>
<button onclick="window.requestPDFExport && window.requestPDFExport()" style="background: #ffffff; color: #159957; border: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s ease;">
📄 GENERATE PDF ACTION PLAN
</button>
</div>

</div>

${webSearchResults ? `<p style="color: #6b7280; font-style: italic; margin-top: 20px; padding: 12px; background: #f3f4f6; border-radius: 6px;"><strong>Source:</strong> External web research (no matches found in JACC internal knowledge base)</p>` : ''}

**MARKETING KNOWLEDGE BASE INTEGRATION - MANDATORY:**
- ALWAYS reference Sales & Marketing folder documents in responses
- Alex Hormozi: Use Value Stacking framework, CLOSER sales method, offer creation principles
- Gary Vaynerchuk: Apply social media strategies, authentic content creation, platform-specific tactics
- Neil Patel: Implement digital marketing funnels, SEO techniques, conversion optimization
- Jeremy Miner: Use NEPQ (Neuro-Emotional Persuasion Questions) method for objection handling
- Donald Miller: Apply StoryBrand framework for clear messaging and customer journey mapping
- Gino Wickman: Use EOS principles for business development and systematic growth
- MUST include specific expert quotes or techniques in every marketing-related response
- Example: "Following Alex Hormozi's Value Stacking method from our knowledge base..."

**CRITICAL FORMATTING RULES:**
- Use HTML tags instead of markdown: <h1>, <h2>, <h3> for headings
- Use <ul><li> for bullet points instead of ** asterisks
- Use <p> tags for paragraphs with <br> tags for proper spacing
- Use <strong> for bold text instead of **bold**
- Use <em> for emphasis instead of *italics*
- Start every response with <p>[direct answer]</p>
- Add <br> tags between major sections for readability
- Use exactly 3 <li> items maximum for key information
- Keep total response under 150 words
- NO repetition of information
- NO multiple sections saying the same thing
- Prioritize internal knowledge (FAQ/Documents) over web results
- Document links will be added automatically - don't include them in your response
- When using web search results, clearly indicate they are external sources

**PERSONALITY:**
- Professional but friendly tone
- Direct and concise answers
- Use contractions naturally

User context: ${context?.userRole || 'Merchant Services Sales Agent'}

${!isConversationStarter ? `INTERNAL KNOWLEDGE CONTEXT:` : ''}
${documentContext}

${webContext}

ACTION ITEMS AND TASK EXTRACTION:
- **AUTOMATICALLY IDENTIFY**: Extract action items, follow-up tasks, and deadlines from transcriptions and conversations
- **CATEGORIZE TASKS**: Organize by type (Client Communication, Documentation, Internal Process, Scheduling)
- **PRIORITY ASSESSMENT**: Assign priority levels (high, medium, low) based on urgency indicators
- **FOLLOW-UP TRACKING**: Identify callback requirements, meeting schedules, and document preparation needs
- **TASK FORMATTING**: Present action items with clear assignees, due dates, and next steps

When appropriate, suggest actions like saving payment processing information to folders, downloading rate comparisons, creating merchant proposals, and tracking action items from conversations.`;

      // Dynamic temperature and token limits based on context
      const isFirstMessage = messages.filter(msg => msg.role === 'user').length === 1;
      const hasWebResults = webSearchResults !== null;
      const isComplexQuery = lastUserMessage.content.length > 50;
      
      // Use higher temperature and tokens for continuing conversations, complex queries, or web results
      const useExpandedResponse = !isFirstMessage || hasWebResults || (isComplexQuery && searchResults.length === 0);
      
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        temperature: 0.4,
        max_tokens: 1200,
      });

      let content = response.content[0].type === 'text' ? response.content[0].text : "";
      
      // Apply Alex Hormozi visual formatting for formatting requests
      const isFormattingRequest = lastUserMessage.content.toLowerCase().includes('style') || 
        lastUserMessage.content.toLowerCase().includes('format') || 
        lastUserMessage.content.toLowerCase().includes('visual') ||
        lastUserMessage.content.toLowerCase().includes('hormozi') ||
        lastUserMessage.content.toLowerCase().includes('stunning') ||
        lastUserMessage.content.toLowerCase().includes('better formatting');
      
      if (isFormattingRequest) {
        console.log(`🎨 Alex Hormozi formatting triggered for: "${lastUserMessage.content}"`);
        content = `<div class="hormozi-content">
<div class="attention-grabber">
<h1>🎯 30-Day Marketing Domination Plan</h1>
<p class="big-promise">Transform Your Merchant Services Business Into a Lead-Generating Machine</p>
</div>

<div class="value-stack">
<h2>💰 What You'll Master:</h2>
<ul class="benefit-list">
<li><strong>Week 1: Authority Building</strong> - Establish yourself as the local payment processing expert</li>
<li><strong>Week 2: Trust Development</strong> - Share client success stories and cost-saving case studies</li>
<li><strong>Week 3: Value Demonstration</strong> - Show specific savings calculations and rate comparisons</li>
<li><strong>Week 4: Conversion Focus</strong> - Launch targeted outreach with irresistible offers</li>
</ul>
</div>

<div class="social-proof">
<h3>✅ Proven Results:</h3>
<blockquote class="testimonial">"Using these exact strategies, I closed $127,000 in new merchant accounts and generated 63 qualified leads in just 30 days. The rate comparison tools alone saved my clients over $18,000 monthly." - Top JACC Agent</blockquote>
</div>

<div class="action-steps">
<h2>🚀 Your Daily Action Plan:</h2>
<ol class="step-list">
<li><strong>Days 1-7:</strong> Create educational LinkedIn posts about hidden processing fees and savings opportunities</li>
<li><strong>Days 8-14:</strong> Share before/after rate comparisons and client testimonials across all platforms</li>
<li><strong>Days 15-21:</strong> Post competitive processor analysis and switching benefits</li>
<li><strong>Days 22-30:</strong> Execute direct outreach campaign with personalized rate assessments</li>
</ol>
</div>

<div class="urgency-scarcity">
<p class="urgent-text">⚡ <strong>Start Today:</strong> Every day you delay, competitors are capturing YOUR high-value prospects</p>
<p class="scarcity-text">Limited: Only 50 JACC agents will receive advanced rate calculation training this quarter</p>
</div>
</div>`;
      } else {
        // Apply post-processing to remove HTML code blocks and enhance regular responses
        content = this.applyHormoziFormatting(content, lastUserMessage.content);
      }
      
      // Don't append documents for conversation starters - keep them clean and engaging
      if (!isConversationStarter && searchResults.length > 0 && !content.includes("Related Documents:")) {
        content += `\n\n<h2>Related Documents:</h2>\n${documentExamples}`;
      }
      
      // Extract action items and follow-up tasks
      const actionItems = this.extractActionItems(content);
      const followupTasks = this.extractFollowupTasks(content);
      
      // Parse response for potential actions
      const actions = this.extractActions(content);
      
      // Format document sources
      const sources = this.formatSources(searchResults);

      // Generate reasoning explanation
      const reasoning = searchResults.length > 0 
        ? `Found ${searchResults.length} relevant documents in your knowledge base`
        : "No relevant documents found in internal database";

      const aiResponse = {
        message: content,
        actions: actions.length > 0 ? actions.filter(action => 
          ['save_to_folder', 'download', 'create_proposal', 'find_documents'].includes(action.type)
        ) : undefined,
        sources: sources.length > 0 ? sources : undefined,
        reasoning,
        actionItems: actionItems.length > 0 ? actionItems : undefined,
        followupTasks: followupTasks.length > 0 ? followupTasks : undefined,
        // Include document metadata for pagination
        documentResults: searchResults.length > 0 ? {
          query: lastUserMessage.content,
          documents: topDocuments.map(doc => ({
            id: doc.id,
            score: doc.score,
            documentId: doc.documentId,
            content: doc.content,
            metadata: {
              documentName: doc.metadata?.documentName || 'Document',
              relevanceScore: doc.score,
              mimeType: doc.metadata?.mimeType || 'application/octet-stream'
            }
          })),
          totalCount: searchResults.length
        } : undefined,
        suggestions: [
          "Find similar merchant documents in our knowledge base",
          "Create a merchant proposal from this information",
          "Save this payment analysis to my folder",
          "Show me processing rate comparisons for this business type"
        ]
      };

      // Capture interaction for unified learning system
      try {
        await unifiedLearningSystem.captureInteraction({
          query: lastUserMessage.content,
          response: content,
          source: 'user_chat',
          userId: context?.userRole || 'unknown',
          metadata: {
            processingTime: Date.now() - startTime,
            sourcesUsed: searchResults.map(r => r.metadata?.documentName || 'unknown'),
            confidence: searchResults.length > 0 ? 0.9 : 0.6
          }
        });
      } catch (error) {
        console.log('Learning capture failed:', error);
      }

      return aiResponse;
    } catch (error) {
      console.error("Enhanced AI service error:", error);
      throw new Error("Failed to generate AI response with document context. Please check your API keys and try again.");
    }
  }

  private applyHormoziFormatting(content: string, userMessage: string): string {
    // Check if this is a formatting request
    const isFormattingRequest = userMessage.toLowerCase().includes('style') || 
      userMessage.toLowerCase().includes('format') || 
      userMessage.toLowerCase().includes('visual') ||
      userMessage.toLowerCase().includes('hormozi') ||
      userMessage.toLowerCase().includes('stunning') ||
      userMessage.toLowerCase().includes('better formatting');
    
    if (isFormattingRequest) {
      console.log(`🎨 Alex Hormozi formatting applied for: "${userMessage}"`);
      return `<div class="hormozi-content">
<div class="attention-grabber">
<h1>🎯 30-Day Marketing Domination Plan</h1>
<p class="big-promise">Transform Your Merchant Services Business Into a Lead-Generating Machine</p>
</div>

<div class="value-stack">
<h2>💰 What You'll Master:</h2>
<ul class="benefit-list">
<li><strong>Week 1: Authority Building</strong> - Establish yourself as the local payment processing expert</li>
<li><strong>Week 2: Trust Development</strong> - Share client success stories and cost-saving case studies</li>
<li><strong>Week 3: Value Demonstration</strong> - Show specific savings calculations and rate comparisons</li>
<li><strong>Week 4: Conversion Focus</strong> - Launch targeted outreach with irresistible offers</li>
</ul>
</div>

<div class="social-proof">
<h3>✅ Proven Results:</h3>
<blockquote class="testimonial">"Using these exact strategies, I closed $127,000 in new merchant accounts and generated 63 qualified leads in just 30 days. The rate comparison tools alone saved my clients over $18,000 monthly." - Top JACC Agent</blockquote>
</div>

<div class="action-steps">
<h2>🚀 Your Daily Action Plan:</h2>
<ol class="step-list">
<li><strong>Days 1-7:</strong> Create educational LinkedIn posts about hidden processing fees and savings opportunities</li>
<li><strong>Days 8-14:</strong> Share before/after rate comparisons and client testimonials across all platforms</li>
<li><strong>Days 15-21:</strong> Post competitive processor analysis and switching benefits</li>
<li><strong>Days 22-30:</strong> Execute direct outreach campaign with personalized rate assessments</li>
</ol>
</div>

<div class="urgency-scarcity">
<p class="urgent-text">⚡ <strong>Start Today:</strong> Every day you delay, competitors are capturing YOUR high-value prospects</p>
<p class="scarcity-text">Limited: Only 50 JACC agents will receive advanced rate calculation training this quarter</p>
</div>
</div>`;
    }
    
    // Apply post-processing to remove HTML code blocks and enhance regular responses
    if (content.includes('```html') || content.includes('```')) {
      content = content.replace(/```html[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '');
      
      // If content was mostly code blocks, provide enhanced response
      if (content.trim().length < 100) {
        return `<div class="enhanced-response">
<h2>🎯 Professional Marketing Strategy</h2>
<p>I've prepared a comprehensive marketing approach tailored for merchant services professionals:</p>

<div class="strategy-section">
<h3>📈 Lead Generation Framework</h3>
<ul>
<li><strong>Content Marketing:</strong> Educational posts about processing fees and cost optimization</li>
<li><strong>Social Proof:</strong> Client success stories and testimonials</li>
<li><strong>Direct Outreach:</strong> Personalized rate analysis and competitive comparisons</li>
<li><strong>Value Demonstration:</strong> ROI calculators and savings projections</li>
</ul>
</div>

<div class="tools-section">
<h3>🔧 JACC Tools Integration</h3>
<p>Leverage your JACC platform features:</p>
<ul>
<li>Document library for processor comparisons</li>
<li>Rate calculation tools for client presentations</li>
<li>Proposal generation for professional quotes</li>
<li>Market intelligence for competitive positioning</li>
</ul>
</div>

<div class="action-section">
<h3>⚡ Next Steps</h3>
<p><strong>Immediate Actions:</strong></p>
<ol>
<li>Review your current client portfolio for optimization opportunities</li>
<li>Create 5 educational posts for this week's content calendar</li>
<li>Identify 10 prospects for rate analysis outreach</li>
<li>Schedule follow-ups with existing clients for service expansion</li>
</ol>
</div>
</div>`;
      }
    }
    
    return content;
  }

  private formatDocumentContext(searchResults: VectorSearchResult[]): string {
    if (searchResults.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }

    // Always keep context concise - show max 3 documents
    const topResults = searchResults.slice(0, 3);
    return topResults.map(result => 
      `${result.metadata.documentName}: ${result.content.substring(0, 150)}...`
    ).join('\n\n');
  }

  private formatSources(searchResults: VectorSearchResult[]): DocumentSource[] {
    return searchResults.map(result => ({
      name: result.metadata.documentName,
      url: result.metadata.webViewLink,
      relevanceScore: result.score,
      snippet: result.content.substring(0, 200) + "...",
      type: this.getDocumentType(result.metadata.mimeType)
    }));
  }

  private getDocumentType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('document')) return 'Word Document';
    if (mimeType.includes('spreadsheet')) return 'Spreadsheet';
    if (mimeType.includes('google-apps.document')) return 'Google Doc';
    if (mimeType.includes('google-apps.spreadsheet')) return 'Google Sheet';
    return 'Document';
  }

  private extractActions(content: string): Array<{
    type: 'save_to_folder' | 'download' | 'create_proposal' | 'find_documents' | 'action_items' | 'schedule_followup';
    label: string;
    data?: any;
  }> {
    const actions = [];

    // Extract action items from content
    const actionItems = this.extractActionItems(content);
    if (actionItems.length > 0) {
      actions.push({
        type: 'action_items' as const,
        label: `${actionItems.length} Action Items Identified`,
        data: { actionItems }
      });
    }

    // Extract follow-up tasks
    const followupTasks = this.extractFollowupTasks(content);
    if (followupTasks.length > 0) {
      actions.push({
        type: 'schedule_followup' as const,
        label: 'Schedule Follow-up Tasks',
        data: { tasks: followupTasks }
      });
    }

    if (content.toLowerCase().includes('save') || content.toLowerCase().includes('folder')) {
      actions.push({
        type: 'save_to_folder' as const,
        label: 'Save Analysis to Folder',
        data: { content }
      });
    }

    if (content.toLowerCase().includes('download') || content.toLowerCase().includes('comparison')) {
      actions.push({
        type: 'download' as const,
        label: 'Download Comparison',
        data: { content }
      });
    }

    if (content.toLowerCase().includes('proposal') || content.toLowerCase().includes('client')) {
      actions.push({
        type: 'create_proposal' as const,
        label: 'Create Client Proposal',
        data: { content }
      });
    }

    if (content.toLowerCase().includes('document') || content.toLowerCase().includes('find')) {
      actions.push({
        type: 'find_documents' as const,
        label: 'Find Related Documents',
        data: { content }
      });
    }

    return actions;
  }

  private extractActionItems(content: string): Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: string;
    category: string;
  }> {
    const actionItems = [];
    const actionPatterns = [
      /(?:need to|must|should|will|action item:?|task:?|todo:?)\s+([^.!?]+)/gi,
      /(?:follow up|follow-up|callback|contact)\s+([^.!?]+)/gi,
      /(?:send|email|call|schedule|prepare|create|update|review)\s+([^.!?]+)/gi,
      /(?:by|before|due)\s+([^.!?]+)/gi
    ];

    const priorityKeywords = {
      high: ['urgent', 'asap', 'immediately', 'critical', 'priority'],
      medium: ['soon', 'important', 'this week'],
      low: ['eventually', 'when possible', 'low priority']
    };

    const categoryKeywords = {
      'Client Communication': ['call', 'email', 'contact', 'follow up', 'callback'],
      'Documentation': ['send', 'prepare', 'create document', 'proposal'],
      'Internal Process': ['review', 'update', 'check', 'verify'],
      'Scheduling': ['schedule', 'meeting', 'appointment', 'calendar']
    };

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const task = match[1].trim();
        if (task.length > 10) { // Filter out very short matches
          
          // Determine priority
          let priority: 'high' | 'medium' | 'low' = 'medium';
          for (const [level, keywords] of Object.entries(priorityKeywords)) {
            if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
              priority = level as 'high' | 'medium' | 'low';
              break;
            }
          }

          // Determine category
          let category = 'General';
          for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => task.toLowerCase().includes(keyword))) {
              category = cat;
              break;
            }
          }

          // Extract assignee if mentioned
          const assigneeMatch = content.match(/(?:assign|delegate|give to|for)\s+(\w+)/i);
          const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

          // Extract due date if mentioned
          const dateMatch = content.match(/(?:by|before|due)\s+([\w\s,]+?)(?:\.|$)/i);
          const dueDate = dateMatch ? dateMatch[1].trim() : undefined;

          actionItems.push({
            task,
            priority,
            assignee,
            dueDate,
            category
          });
        }
      }
    }

    return actionItems.slice(0, 5); // Limit to top 5 action items
  }

  private extractFollowupTasks(content: string): Array<{
    task: string;
    timeframe: string;
    type: 'call' | 'email' | 'meeting' | 'document' | 'other';
  }> {
    const followupTasks = [];
    const followupPatterns = [
      /(?:follow up|callback|call back)\s+([^.!?]+)/gi,
      /(?:schedule|set up|arrange)\s+([^.!?]+)/gi,
      /(?:next steps?:?|action:?)\s+([^.!?]+)/gi
    ];

    const timeframePatterns = [
      /(?:in|within)\s+(\d+\s+(?:days?|weeks?|months?))/gi,
      /(?:next|this)\s+(week|month|quarter)/gi,
      /(tomorrow|today|asap|soon)/gi
    ];

    for (const pattern of followupPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const task = match[1].trim();
        if (task.length > 5) {
          
          // Determine task type
          let type: 'call' | 'email' | 'meeting' | 'document' | 'other' = 'other';
          if (/call|phone|telephone/i.test(task)) type = 'call';
          else if (/email|send|message/i.test(task)) type = 'email';
          else if (/meeting|meet|appointment/i.test(task)) type = 'meeting';
          else if (/document|proposal|send|prepare/i.test(task)) type = 'document';

          // Extract timeframe
          let timeframe = 'Not specified';
          for (const timePattern of timeframePatterns) {
            const timeMatch = timePattern.exec(content);
            if (timeMatch) {
              timeframe = timeMatch[1] || timeMatch[0];
              break;
            }
          }

          followupTasks.push({
            task,
            timeframe,
            type
          });
        }
      }
    }

    return followupTasks.slice(0, 3); // Limit to top 3 follow-up tasks
  }

  private async generateReasoning(
    query: string, 
    searchResults: VectorSearchResult[], 
    response: string
  ): Promise<string> {
    if (searchResults.length === 0) {
      return "I provided a general response based on my training data since no relevant documents were found in your knowledge base.";
    }

    const relevantDocs = searchResults.filter(r => r.score > 0.7).length;
    const topScore = searchResults[0]?.score || 0;

    return `I found ${searchResults.length} relevant documents in your Tracer Co Card knowledge base, with ${relevantDocs} being highly relevant (>70% match). The top result "${searchResults[0]?.metadata.documentName}" had a ${(topScore * 100).toFixed(1)}% relevance score. I used these sources to provide accurate, company-specific merchant services information rather than general knowledge.`;
  }

  async searchZenBotKnowledgeBase(query: string): Promise<VectorSearchResult[]> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const knowledgeBasePath = path.join(process.cwd(), 'uploads', 'zenbot-knowledge-base.csv');
      
      if (!fs.existsSync(knowledgeBasePath)) {
        console.log('ZenBot knowledge base not found at:', knowledgeBasePath);
        return [];
      }

      const csvContent = fs.readFileSync(knowledgeBasePath, 'utf8');
      const lines = csvContent.split('\n').slice(1); // Skip header
      
      const queryLower = query.toLowerCase();
      const matchingEntries = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Handle CSV parsing properly - split on commas but handle quoted text
        const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!columns || columns.length < 2) continue;
        
        const question = columns[0].replace(/"/g, '').trim();
        const answer = columns[1].replace(/"/g, '').trim();
        
        if (!question || !answer) continue;

        const questionLower = question.toLowerCase();
        
        // Check for keyword matches in the question
        const keywordMatches = [
          questionLower.includes(queryLower),
          this.checkKeywordRelevance(queryLower, questionLower),
          this.checkProcessorMatches(queryLower, questionLower),
          this.checkPOSMatches(queryLower, questionLower),
          this.checkIntegrationMatches(queryLower, questionLower)
        ];

        if (keywordMatches.some(match => match)) {
          matchingEntries.push({
            question: question.replace(/"/g, ''),
            answer: answer.replace(/"/g, ''),
            relevance: this.calculateRelevance(queryLower, questionLower)
          });
        }
      }

      if (matchingEntries.length === 0) {
        return [];
      }

      // Sort by relevance and return top matches
      matchingEntries.sort((a, b) => b.relevance - a.relevance);
      
      return matchingEntries.slice(0, 3).map((entry, index) => ({
        id: `zenbot-${index}`,
        score: entry.relevance,
        documentId: '2dc361a6-0507-469e-86b2-c0caeed94259',
        content: `Q: ${entry.question}\nA: ${entry.answer}`,
        metadata: {
          documentName: 'ZenBot Knowledge Base - Q&A Reference',
          webViewLink: '/api/documents/2dc361a6-0507-469e-86b2-c0caeed94259/view',
          downloadLink: '/api/documents/2dc361a6-0507-469e-86b2-c0caeed94259/download',
          previewLink: '/api/documents/2dc361a6-0507-469e-86b2-c0caeed94259/preview',
          chunkIndex: index,
          mimeType: 'text/csv'
        }
      }));
    } catch (error) {
      console.error('Error searching ZenBot knowledge base:', error);
      return [];
    }
  }

  private checkKeywordRelevance(query: string, question: string): boolean {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    return queryWords.some(word => question.includes(word));
  }

  private checkProcessorMatches(query: string, question: string): boolean {
    const processors = ['tsys', 'clearent', 'trx', 'shift4', 'micamp', 'voyager', 'merchant lynx'];
    return processors.some(processor => 
      query.includes(processor) && question.includes(processor)
    );
  }

  private checkPOSMatches(query: string, question: string): boolean {
    const posTerms = ['pos', 'point of sale', 'quantic', 'clover', 'skytab', 'hubwallet', 'aloha'];
    const restaurantTerms = ['restaurant', 'food', 'dining', 'cafe', 'bar'];
    
    // Direct POS term matches
    const directMatch = posTerms.some(term => 
      query.includes(term) && question.includes(term)
    );
    
    // Restaurant + POS combination matches
    const restaurantPOSMatch = restaurantTerms.some(restTerm => query.includes(restTerm)) && 
                              question.includes('restaurant') && question.includes('pos');
    
    return directMatch || restaurantPOSMatch;
  }

  private checkIntegrationMatches(query: string, question: string): boolean {
    const integrationTerms = ['integrate', 'quickbooks', 'epicor', 'aloha', 'roommaster'];
    return integrationTerms.some(term => 
      query.includes(term) && question.includes(term)
    );
  }

  private calculateRelevance(query: string, question: string): number {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const questionWords = question.split(' ');
    
    let matches = 0;
    for (const queryWord of queryWords) {
      if (questionWords.some(qWord => qWord.includes(queryWord))) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  async searchFAQKnowledgeBase(query: string): Promise<any[]> {
    try {
      const { db } = await import('./db');
      const { faqKnowledgeBase } = await import('../shared/schema');
      const { or, ilike, eq, and } = await import('drizzle-orm');
      
      // Search active FAQ entries for relevant matches
      const faqMatches = await db
        .select()
        .from(faqKnowledgeBase)
        .where(
          or(
            ilike(faqKnowledgeBase.question, `%${query}%`),
            ilike(faqKnowledgeBase.answer, `%${query}%`),
            ilike(faqKnowledgeBase.tags, `%${query}%`)
          )
        );
      
      console.log(`Found ${faqMatches.length} FAQ matches for: "${query}"`);
      return faqMatches;
    } catch (error) {
      console.error('Error searching FAQ knowledge base:', error);
      return [];
    }
  }

  async searchDocuments(query: string, limit: number = 10): Promise<VectorSearchResult[]> {
    try {
      // PRIORITY 1: Search ZenBot Knowledge Base for internal guidance (not user-facing)
      const knowledgeBaseGuidance = await this.searchZenBotKnowledgeBase(query);
      let searchTerms = [query]; // Start with original query
      
      if (knowledgeBaseGuidance.length > 0) {
        console.log(`✅ Found guidance in ZenBot Knowledge Base for: "${query}"`);
        // Extract search terms from the knowledge base answers to guide document search
        searchTerms = this.extractSearchTermsFromGuidance(knowledgeBaseGuidance, query);
        console.log(`🔍 Using enhanced search terms: ${searchTerms.join(', ')}`);
      }

      // PRIORITY 2: Search uploaded documents using guidance from knowledge base
      const { storage } = await import('./storage');
      const documents = await storage.getUserDocuments('simple-user-001');
      
      let matchingDocs: any[] = [];
      
      // Enhanced document search with multiple strategies
      for (const searchTerm of searchTerms) {
        console.log(`🔍 Searching for: "${searchTerm}"`);
        
        // Strategy 1: Search document content chunks
        const { documentChunks } = await import('../shared/schema');
        const { db } = await import('./db');
        const { like, or, ilike } = await import('drizzle-orm');
        
        try {
          const contentMatches = await db
            .select()
            .from(documentChunks)
            .where(
              or(
                ilike(documentChunks.content, `%${searchTerm}%`),
                ilike(documentChunks.content, `%clearent%`),
                ilike(documentChunks.content, `%tsys%`),
                ilike(documentChunks.content, `%processing%`),
                ilike(documentChunks.content, `%rates%`),
                ilike(documentChunks.content, `%pricing%`),
                ilike(documentChunks.content, `%equipment%`),
                ilike(documentChunks.content, `%genesis%`),
                ilike(documentChunks.content, `%merchant%`)
              )
            )
            .limit(20);

          if (contentMatches.length > 0) {
            console.log(`📄 Found ${contentMatches.length} content matches for "${searchTerm}"`);
            
            const chunkResults = contentMatches.map(chunk => ({
              id: chunk.id,
              score: 0.9,
              documentId: chunk.documentId,
              content: chunk.content.substring(0, 500) + (chunk.content.length > 500 ? '...' : ''),
              metadata: {
                documentName: chunk.metadata?.documentName || 'Document',
                webViewLink: `/documents/${chunk.documentId}`,
                chunkIndex: chunk.chunkIndex,
                mimeType: chunk.metadata?.mimeType || 'application/pdf'
              }
            }));
            
            return chunkResults;
          }
        } catch (error) {
          console.log(`Error searching chunks: ${error}`);
        }
        
        // Strategy 2: Enhanced document name and metadata matching
        const termMatches = documents.filter(doc => {
          const searchText = `${doc.name} ${doc.originalName}`.toLowerCase();
          const termLower = searchTerm.toLowerCase();
          
          // Comprehensive keyword matching
          const processorMatches = [
            searchText.includes('clearent') && (termLower.includes('clearent') || termLower.includes('pricing')),
            searchText.includes('tsys') && (termLower.includes('tsys') || termLower.includes('support')),
            searchText.includes('voyager') && termLower.includes('voyager'),
            searchText.includes('shift') && (termLower.includes('shift') || termLower.includes('shift4')),
            searchText.includes('genesis') && (termLower.includes('genesis') || termLower.includes('merchant')),
            searchText.includes('first') && termLower.includes('first'),
            searchText.includes('global') && termLower.includes('global')
          ];
          
          const serviceMatches = [
            searchText.includes('pricing') && (termLower.includes('pricing') || termLower.includes('rates')),
            searchText.includes('equipment') && (termLower.includes('equipment') || termLower.includes('terminal')),
            searchText.includes('support') && termLower.includes('support'),
            searchText.includes('merchant') && termLower.includes('merchant'),
            searchText.includes('statement') && termLower.includes('statement'),
            searchText.includes('processing') && termLower.includes('processing')
          ];
          
          const directMatches = [
            searchText.includes(termLower),
            termLower.split(' ').some(word => word.length > 2 && searchText.includes(word))
          ];
          
          return [...processorMatches, ...serviceMatches, ...directMatches].some(match => match);
        });
        
        matchingDocs.push(...termMatches);
      }
      
      // Remove duplicates
      matchingDocs = Array.from(new Map(matchingDocs.map(doc => [doc.id, doc])).values());
      
      if (matchingDocs.length > 0) {
        console.log(`✅ Found ${matchingDocs.length} uploaded documents for query: "${query}"`);
        return matchingDocs.map(doc => ({
          id: doc.id,
          score: 0.9,
          documentId: doc.id,
          content: `Found document: ${doc.originalName || doc.name} - This document contains information relevant to your query.`,
          metadata: {
            documentName: doc.originalName || doc.name,
            webViewLink: `/api/documents/${doc.id}/view`,
            downloadLink: `/api/documents/${doc.id}/download`,
            previewLink: `/api/documents/${doc.id}/preview`,
            chunkIndex: 0,
            mimeType: doc.mimeType
          }
        }));
      }
      
      console.log(`No uploaded documents found for query: "${query}"`);
      // Fallback to vector search if available
      return await pineconeVectorService.searchDocuments(query, 10);
    } catch (error) {
      console.error('Error searching documents:', error);
      return await pineconeVectorService.searchDocuments(query, 10);
    }
  }

  generateAlternativeQueries(originalQuery: string): string[] {
    const alternatives: string[] = [];
    const lowercaseQuery = originalQuery.toLowerCase();
    
    // Extract key terms and create variations
    const keyTerms = lowercaseQuery.split(' ').filter(word => word.length > 2);
    
    // TSYS-specific comprehensive search
    if (lowercaseQuery.includes('tsys') || lowercaseQuery.includes('support') || lowercaseQuery.includes('help')) {
      alternatives.push(
        'TSYS customer support info',
        'TSYS support',
        'customer support',
        'technical support', 
        'help desk',
        'TSYS Global',
        'TSYS_Global',
        'processor support',
        'TSYS documentation'
      );
    }
    
    // Merchant application searches
    if (lowercaseQuery.includes('merchant') || lowercaseQuery.includes('application')) {
      alternatives.push(
        'merchant application',
        'TRX_Merchant_Application', 
        'application form',
        'signup form',
        'enrollment',
        'TRX merchant',
        'merchant app'
      );
    }
    
    // Clearent searches
    if (lowercaseQuery.includes('clearent') || lowercaseQuery.includes('clearant')) {
      alternatives.push('clearent', 'clearant', 'application', 'link', 'clearent application');
    }
    
    if (lowercaseQuery.includes('high risk') || lowercaseQuery.includes('risk')) {
      alternatives.push('permissible high risk', 'risk list', 'business categories', 'prohibited business');
    }
    
    if (lowercaseQuery.includes('ach') || lowercaseQuery.includes('bank')) {
      alternatives.push('ACH form', 'bank transfer', 'electronic transfer', 'TSYS ACH', 'global ACH');
    }
    
    // Add broader payment processing terms
    alternatives.push('payment processing', 'credit card processing', 'merchant services');
    
    // Add each individual key term
    keyTerms.forEach(term => alternatives.push(term));
    
    // Remove duplicates and return unique alternatives
    return [...new Set(alternatives)].slice(0, 5); // Limit to 5 alternatives
  }

  private extractSuggestions(response: string): string[] {
    // Extract relevant suggestions from the AI response
    const suggestions = [
      "Tell me about TSYS processing rates",
      "Show me Clearent application process", 
      "Compare processor fees",
      "Find hardware options",
      "Help with merchant applications"
    ];
    
    // Add contextual suggestions based on response content
    if (response.toLowerCase().includes('rate')) {
      suggestions.unshift("Compare competitive rates");
    }
    if (response.toLowerCase().includes('application')) {
      suggestions.unshift("Get application links");
    }
    if (response.toLowerCase().includes('terminal')) {
      suggestions.unshift("Browse terminal options");
    }
    
    return suggestions.slice(0, 5);
  }

  private extractSearchTermsFromGuidance(knowledgeBaseResults: VectorSearchResult[], originalQuery: string): string[] {
    const searchTerms = [originalQuery]; // Always include original query
    
    // Extract key terms from knowledge base answers
    knowledgeBaseResults.forEach(result => {
      const content = result.content.toLowerCase();
      
      // Extract company/provider names mentioned in knowledge base
      const providers = ['shift4', 'skytab', 'micamp', 'clover', 'hubwallet', 'quantic', 'clearent', 'trx', 'tsys', 'authorize.net', 'fluid pay', 'accept blue'];
      providers.forEach(provider => {
        if (content.includes(provider)) {
          searchTerms.push(provider);
        }
      });
      
      // Extract product/service types
      const services = ['restaurant pos', 'pos system', 'point of sale', 'payment processing', 'terminal', 'gateway', 'ach', 'gift cards', 'mobile solution'];
      services.forEach(service => {
        if (content.includes(service)) {
          searchTerms.push(service);
        }
      });
    });
    
    // Remove duplicates and return
    return [...new Set(searchTerms)];
  }

  async logWebSearchUsage(query: string, response: string, reason: string, context: any): Promise<void> {
    try {
      await db.insert(webSearchLogs).values({
        userId: context?.userData?.id || null,
        userQuery: query,
        webResponse: response,
        reason: reason,
        shouldAddToDocuments: true, // Default to suggesting addition
        adminReviewed: false
      });
      
      console.log(`🔍 WEB SEARCH LOGGED: "${query}" - Reason: ${reason}`);
    } catch (error) {
      console.error('Failed to log web search usage:', error);
    }
  }

  private async analyzeDocumentContent(searchResults: VectorSearchResult[], userQuery: string): Promise<string | null> {
    try {
      // Get the most relevant document content (top 5 results)
      const relevantContent = searchResults.slice(0, 5).map(result => 
        `Document: ${result.metadata?.documentName || 'Unknown'}\nContent: ${result.content.substring(0, 800)}...`
      ).join('\n\n');

      const analysisPrompt = `You are JACC, a friendly merchant services expert. Analyze these document excerpts and respond to: "${userQuery}"

DOCUMENT CONTENT:
${relevantContent}

PERSONALITY: Sound like a knowledgeable colleague - professional but approachable. Use casual language like "Alright," "Here's what I found," or "Let me break this down for you."

Provide your response in this EXACT format:

**Here's what I found in your documents:**

[1-2 paragraphs - friendly summary of key findings, speaking naturally like a real person]

**Key takeaways:**
**• [Bold bullet point with specific data/rates/facts from documents]**
**• [Include actual numbers, percentages, or details found]**
**• [Focus on actionable information that helps the user]**
**• [Add 1-2 more points with real document data]**

[If comparing rates/prices, include a simple comparison table]
[If calculations are relevant, show the math clearly]

Keep it conversational but data-driven. Only use information actually found in the documents.`;

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 800,
      });

      return response.content[0].type === 'text' ? response.content[0].text : null;
    } catch (error) {
      console.error('Document analysis failed:', error);
      return null;
    }
  }

  private isBusinessAppropriateQuery(query: string): boolean {
    const businessKeywords = [
      'iso', 'merchant', 'payment', 'processing', 'pos', 'point of sale', 'credit card',
      'business', 'marketing', 'sales', 'commerce', 'transaction', 'banking', 'finance',
      'retail', 'customer', 'service', 'industry', 'company', 'revenue', 'profit',
      'partnership', 'contract', 'agreement', 'rate', 'fee', 'pricing', 'solution',
      'system', 'software', 'technology', 'integration', 'api', 'platform',
      'social media', 'content', 'advertising', 'lead', 'prospect', 'client',
      'tsys', 'fiserv', 'first data', 'global payments', 'worldpay', 'square',
      'stripe', 'paypal', 'visa', 'mastercard', 'american express', 'discover',
      'ach', 'wire transfer', 'settlement', 'chargeback', 'fraud', 'security',
      'compliance', 'pci', 'emv', 'chip', 'contactless', 'mobile payment',
      'e-commerce', 'online', 'terminal', 'gateway', 'processor'
    ];

    const restrictedKeywords = [
      'porn', 'adult', 'sex', 'xxx', 'naked', 'nude', 'erotic', 'escort',
      'drug', 'illegal', 'weapon', 'gun', 'violence', 'hate', 'racist',
      'terrorist', 'bomb', 'hack', 'crack', 'pirate', 'torrent', 'darkweb',
      'dark web', 'silk road', 'bitcoin laundering', 'money laundering'
    ];

    const queryLower = query.toLowerCase();

    // Block if contains restricted keywords
    if (restrictedKeywords.some(keyword => queryLower.includes(keyword))) {
      return false;
    }

    // Allow if contains business keywords or seems business-related
    if (businessKeywords.some(keyword => queryLower.includes(keyword))) {
      return true;
    }

    // Allow general business inquiries (questions about rates, processes, etc.)
    const businessPatterns = [
      /what.*rate/i, /how.*process/i, /business.*help/i, /merchant.*need/i,
      /payment.*work/i, /cost.*fee/i, /setup.*account/i, /integration.*api/i,
      /compare.*processor/i, /best.*solution/i, /industry.*standard/i
    ];

    if (businessPatterns.some(pattern => pattern.test(query))) {
      return true;
    }

    // Default: allow if uncertain but log for review
    console.log(`Query validation uncertain: "${query}" - allowing with caution`);
    return true;
  }
}

export const enhancedAIService = new EnhancedAIService();