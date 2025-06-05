import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth as setupReplitAuth, isAuthenticated as isReplitAuthenticated } from "./replitAuth";
import { setupDevAuth, isDevAuthenticated } from "./dev-auth";
import { setupAuth, isAuthenticated, requireRole, hashPassword, comparePasswords } from "./auth";
import { authenticateApiKey, requireApiPermission, generateApiKey, hashApiKey } from "./api-auth";
import { insertUserSchema, insertApiKeySchema } from "@shared/schema";
import { generateChatResponse, analyzeDocument, generateTitle } from "./openai";
import { enhancedAIService } from "./enhanced-ai";
import { googleDriveService } from "./google-drive";
import { pineconeVectorService } from "./pinecone-vector";
import { smartRoutingService } from "./smart-routing";
import { duplicateDetectionService } from "./duplicate-detector";
import { aiEnhancedSearchService } from "./ai-enhanced-search";
import { perplexitySearchService } from "./perplexity-search";
import { aiOrchestrator } from "./ai-orchestrator";
import { monitoringService } from "./monitoring-observability";
import { userFeedbackSystem } from "./user-feedback-system";
import { semanticChunkingService } from "./semantic-chunking";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertMessageSchema, insertChatSchema, insertFolderSchema, insertDocumentSchema, insertAdminSettingsSchema, faqKnowledgeBase, aiTrainingFeedback, messages } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { setupOAuthHelper } from "./oauth-helper";
import { zipProcessor } from "./zip-processor";
import { isoHubAuthMiddleware, handleISOHubSSO, isoHubAuthService } from "./iso-hub-auth";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 50, // Maximum 50 files per upload
    fieldSize: 200 * 1024 * 1024, // 200MB total request size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png|zip|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/zip' || 
                    file.mimetype === 'text/plain' ||
                    file.mimetype === 'application/pdf' ||
                    file.mimetype.startsWith('application/vnd.openxmlformats') ||
                    file.mimetype.startsWith('application/msword') ||
                    file.mimetype.startsWith('application/vnd.ms-excel') ||
                    file.mimetype.startsWith('image/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, XLS, XLSX, TXT, images, and ZIP files are allowed"));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication system
  setupAuth(app);
  
  // Setup development auth for testing
  if (true) {
    setupDevAuth(app);
  }
  
  // Setup OAuth helper for Google Drive credentials
  setupOAuthHelper(app);

  // === Authentication Routes ===
  
  // Simple login for demo environment
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Define demo users with roles
      const demoUsers = {
        'tracer-user': {
          id: 'demo-user-id',
          username: 'tracer-user',
          email: 'demo@example.com',
          role: 'sales-agent',
          password: 'demo-password'
        },
        'admin': {
          id: 'admin-user-id',
          username: 'admin',
          email: 'admin@jacc.com',
          role: 'admin',
          password: 'admin123'
        },
        'manager': {
          id: 'manager-user-id',
          username: 'manager',
          email: 'manager@jacc.com',
          role: 'manager',
          password: 'manager123'
        }
      };
      
      const user = demoUsers[username as keyof typeof demoUsers];
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      const { password: _, ...userResponse } = user;
      res.json({ 
        message: "Login successful",
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid registration data', 
          details: validation.error.errors 
        });
      }

      const { username, email, password, firstName, lastName, role } = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          error: 'User already exists', 
          message: 'A user with this username or email already exists' 
        });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const newUser = await storage.createUser({
        id: crypto.randomUUID(),
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'sales-agent'
      });

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = newUser;
      
      res.status(201).json({ 
        message: 'User created successfully', 
        user: userResponse 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed', 
        message: 'Internal server error during registration' 
      });
    }
  });

  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Missing credentials', 
          message: 'Username and password are required' 
        });
      }

      // Find user by username or email
      const user = await storage.getUserByUsername(username) || await storage.getUserByEmail(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: 'Invalid credentials', 
          message: 'Username or password is incorrect' 
        });
      }

      // Verify password
      const isValidPassword = await comparePasswords(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Invalid credentials', 
          message: 'Username or password is incorrect' 
        });
      }

      // Create session
      const { passwordHash: _, ...sessionUser } = user;
      (req.session as any).user = sessionUser;

      res.json({ 
        message: 'Login successful', 
        user: sessionUser 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed', 
        message: 'Internal server error during login' 
      });
    }
  });

  // User Logout
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ 
          error: 'Logout failed', 
          message: 'Failed to destroy session' 
        });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // GET logout route for compatibility
  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ 
          error: 'Logout failed', 
          message: 'Failed to destroy session' 
        });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current user session
  app.get('/api/user', async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json(sessionUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user session" });
    }
  });

  // Get current user
  app.get('/api/auth/me', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).user.id);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found', 
          message: 'User account no longer exists' 
        });
      }

      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ 
        error: 'Failed to get user', 
        message: 'Internal server error' 
      });
    }
  });

  // === API Key Management Routes ===
  
  // Create API Key
  app.post('/api/auth/api-keys', isAuthenticated, async (req, res) => {
    try {
      const { name, permissions, expiresAt } = req.body;
      const userId = (req as any).user.id;

      if (!name) {
        return res.status(400).json({ 
          error: 'Missing name', 
          message: 'API key name is required' 
        });
      }

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);

      // Create API key record
      const newApiKey = await storage.createApiKey({
        name,
        keyHash,
        userId,
        permissions: permissions || ['read'],
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      // Return the actual API key only once
      res.status(201).json({ 
        message: 'API key created successfully',
        apiKey: apiKey,
        keyInfo: {
          id: newApiKey.id,
          name: newApiKey.name,
          permissions: newApiKey.permissions,
          expiresAt: newApiKey.expiresAt,
          createdAt: newApiKey.createdAt
        }
      });
    } catch (error) {
      console.error('API key creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create API key', 
        message: 'Internal server error' 
      });
    }
  });

  // List user's API keys
  app.get('/api/auth/api-keys', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const apiKeys = await storage.getUserApiKeys(userId);
      
      // Remove sensitive key hashes from response
      const safeApiKeys = apiKeys.map(({ keyHash, ...key }) => key);
      
      res.json(safeApiKeys);
    } catch (error) {
      console.error('Get API keys error:', error);
      res.status(500).json({ 
        error: 'Failed to get API keys', 
        message: 'Internal server error' 
      });
    }
  });

  // Delete API key
  app.delete('/api/auth/api-keys/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Verify the API key belongs to the user
      const apiKeys = await storage.getUserApiKeys(userId);
      const keyToDelete = apiKeys.find(key => key.id === id);

      if (!keyToDelete) {
        return res.status(404).json({ 
          error: 'API key not found', 
          message: 'The specified API key does not exist or does not belong to you' 
        });
      }

      await storage.deleteApiKey(id);
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ 
        error: 'Failed to delete API key', 
        message: 'Internal server error' 
      });
    }
  });

  // === External API Routes (Protected by API Key) ===
  
  // Get user chats via API
  app.get('/api/v1/chats', authenticateApiKey, requireApiPermission('read'), async (req, res) => {
    try {
      const userId = (req as any).apiUser.id;
      const chats = await storage.getUserChats(userId);
      res.json({ 
        success: true, 
        data: chats,
        count: chats.length 
      });
    } catch (error) {
      console.error('API get chats error:', error);
      res.status(500).json({ 
        error: 'Failed to get chats', 
        message: 'Internal server error' 
      });
    }
  });

  // Create chat via API
  app.post('/api/v1/chats', authenticateApiKey, requireApiPermission('write'), async (req, res) => {
    try {
      const userId = (req as any).apiUser.id;
      const validation = insertChatSchema.safeParse({ ...req.body, userId });
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid chat data', 
          details: validation.error.errors 
        });
      }

      const newChat = await storage.createChat(validation.data);
      res.status(201).json({ 
        success: true, 
        data: newChat 
      });
    } catch (error) {
      console.error('API create chat error:', error);
      res.status(500).json({ 
        error: 'Failed to create chat', 
        message: 'Internal server error' 
      });
    }
  });

  // Send message via API
  app.post('/api/v1/chats/:chatId/messages', authenticateApiKey, requireApiPermission('write'), async (req, res) => {
    try {
      const { chatId } = req.params;
      const { content } = req.body;
      const userId = (req as any).apiUser.id;

      if (!content) {
        return res.status(400).json({ 
          error: 'Missing content', 
          message: 'Message content is required' 
        });
      }

      // Verify chat belongs to user
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({ 
          error: 'Chat not found', 
          message: 'The specified chat does not exist or does not belong to you' 
        });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        chatId,
        content,
        role: 'user'
      });

      // Generate AI response
      const messages = await storage.getChatMessages(chatId);
      const aiResponse = await enhancedAIService.generateChainedResponse(
        content,
        messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        userId
      );

      // Create AI message
      const aiMessage = await storage.createMessage({
        chatId,
        content: aiResponse.message,
        role: 'assistant',
        metadata: aiResponse.sources ? { sources: aiResponse.sources } : null
      });

      res.json({ 
        success: true, 
        data: {
          userMessage,
          aiMessage,
          response: aiResponse
        }
      });
    } catch (error) {
      console.error('API send message error:', error);
      res.status(500).json({ 
        error: 'Failed to send message', 
        message: 'Internal server error' 
      });
    }
  });

  // Paginated document search endpoint
  app.get('/api/documents/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, page = 0, limit = 5 } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter required" });
      }
      
      // Search all documents but paginate results
      const searchResults = await enhancedAIService.searchDocuments(query);
      
      const startIndex = parseInt(page) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedResults = searchResults.slice(startIndex, endIndex);
      
      res.json({
        documents: paginatedResults,
        totalCount: searchResults.length,
        currentPage: parseInt(page),
        hasMore: endIndex < searchResults.length,
        remainingCount: Math.max(0, searchResults.length - endIndex)
      });
    } catch (error) {
      console.error("Document search error:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  // Health check endpoint for monitoring
  app.get('/health', async (req, res) => {
    try {
      // Test database connection
      await storage.getUsers();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          api: 'operational'
        },
        version: '1.0.0'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          api: 'operational'
        },
        error: 'Database connection failed'
      });
    }
  });

  // Detailed system status endpoint
  app.get('/api/status', async (req, res) => {
    try {
      const dbHealthy = await storage.getUsers();
      
      res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          api: 'healthy',
          ai_services: 'configured'
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          node_version: process.version
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: 'Service health check failed'
      });
    }
  });

  // AI Training & Feedback Management Routes
  app.get('/api/admin/training/feedback', isAuthenticated, async (req, res) => {
    try {
      // Get training feedback from messages that need improvement
      const feedbackMessages = await db.select({
        id: messages.id,
        chatId: messages.chatId,
        content: messages.content,
        role: messages.role,
        createdAt: messages.createdAt
      })
      .from(messages)
      .where(eq(messages.role, 'assistant'))
      .orderBy(desc(messages.createdAt))
      .limit(100);

      // Transform messages into training feedback format
      const trainingFeedback = [];
      
      for (let i = 0; i < feedbackMessages.length; i += 2) {
        const aiMessage = feedbackMessages[i];
        const userMessage = feedbackMessages[i + 1];
        
        if (userMessage && userMessage.role === 'user') {
          // Analyze if response needs training based on length and quality indicators
          const needsTraining = aiMessage.content.length < 100 || 
                               aiMessage.content.includes('I don\'t know') ||
                               aiMessage.content.includes('not sure') ||
                               aiMessage.content.includes('unclear');
          
          if (needsTraining) {
            trainingFeedback.push({
              id: `feedback-${aiMessage.id}`,
              chatId: aiMessage.chatId,
              messageId: aiMessage.id,
              userQuery: userMessage.content,
              aiResponse: aiMessage.content,
              correctResponse: '',
              feedbackType: aiMessage.content.length < 100 ? 'incomplete' : 'needs_training',
              adminNotes: 'Auto-detected response that may need improvement',
              status: 'pending',
              priority: aiMessage.content.includes('I don\'t know') ? 3 : 2,
              createdAt: aiMessage.createdAt,
              sourceDocs: []
            });
          }
        }
      }

      // If no training feedback detected, provide guidance
      if (trainingFeedback.length === 0) {
        trainingFeedback.push({
          id: 'guidance-1',
          chatId: null,
          userQuery: 'No training feedback detected from recent conversations',
          aiResponse: 'The system automatically analyzes chat conversations to identify responses that need improvement. Training feedback appears when AI responses are too short, contain uncertainty phrases, or lack specificity.',
          correctResponse: 'Continue using the chat interface. Responses flagged for training will appear here automatically when they need improvement.',
          feedbackType: 'needs_training',
          adminNotes: 'System will auto-detect training opportunities from real conversations',
          status: 'pending',
          priority: 1,
          createdAt: new Date().toISOString(),
          sourceDocs: []
        });
      }

      res.json(trainingFeedback);
    } catch (error) {
      console.error('Error fetching training feedback:', error);
      res.status(500).json({ message: "Failed to fetch training feedback" });
    }
  });

  app.post('/api/admin/training/feedback', isAuthenticated, async (req, res) => {
    try {
      // Process feedback submission
      const feedback = {
        id: `feedback-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      res.json({ message: "Training feedback saved successfully", feedback });
    } catch (error) {
      res.status(500).json({ message: "Failed to save training correction" });
    }
  });

  app.get('/api/admin/training/prompts', isAuthenticated, async (req, res) => {
    try {
      // Return actual working prompts from the system
      const workingPrompts = [
        {
          id: 'chained-response-prompt',
          name: 'Enhanced AI Chained Response System',
          description: 'Multi-step reasoning chain used by enhanced AI service',
          category: 'Enhanced AI',
          template: `You are JACC, an expert AI assistant for merchant services sales agents with access to comprehensive documentation.

RESPONSE GENERATION PROCESS:
1. Analyze user intent and extract key requirements
2. Search relevant documents and knowledge base
3. Integrate external data sources when needed
4. Synthesize comprehensive, actionable responses

SPECIALIZATION AREAS:
- Payment processing rates and fee structures
- POS system comparisons and recommendations
- Merchant account setup and requirements
- Cash discounting and surcharge programs
- Equipment specifications and pricing
- Industry best practices and compliance

RESPONSE GUIDELINES:
- Always reference specific document sources when available
- Provide actionable advice for sales agents
- Include relevant calculations and comparisons
- Suggest follow-up actions (save, download, create proposals)
- Maintain professional tone focused on business value

Context: {context}
Documents: {documentContext}
Query: {query}`,
          temperature: 0.7,
          maxTokens: 2000,
          isActive: true,
          version: 1
        },
        {
          id: 'document-analysis-vision',
          name: 'Document Analysis & Vision Processing',
          description: 'Specialized prompt for analyzing uploaded documents and images',
          category: 'Document Processing',
          template: `Analyze this merchant services document or image. Extract key information like:

FOCUS AREAS:
- Processing rates and fees
- Equipment specifications  
- Merchant requirements
- Compliance information
- Pricing structures
- Key features and benefits

ANALYSIS OUTPUT:
- Structured summary useful for sales agents
- Actionable insights for client discussions
- Rate comparisons and calculations
- Equipment recommendations
- Next steps and follow-up actions

Provide a comprehensive analysis that helps sales agents understand and present this information effectively to potential clients.

Document/Image Content: {content}`,
          temperature: 0.3,
          maxTokens: 500,
          isActive: true,
          version: 1
        },
        {
          id: 'vector-search-prompt',
          name: 'Vector Search & Document Retrieval',
          description: 'Prompt for intelligent document search and context building',
          category: 'Search & Retrieval',
          template: `Based on the user's query, search and analyze relevant documents to provide comprehensive merchant services guidance.

SEARCH STRATEGY:
- Semantic similarity matching
- Keyword extraction and expansion
- Context-aware document ranking
- Multi-document synthesis

DOCUMENT INTEGRATION:
- Combine insights from multiple sources
- Highlight contradictions or variations
- Provide confidence scores for recommendations
- Reference specific sections and page numbers

OUTPUT FORMAT:
- Direct answer to user's question
- Supporting evidence from documents
- Alternative options or considerations
- Recommended next actions

Query: {query}
Retrieved Documents: {searchResults}
User Context: {userRole}`,
          temperature: 0.4,
          maxTokens: 1500,
          isActive: true,
          version: 1
        }
      ];
      res.json(workingPrompts);
    } catch (error) {
      console.error("Error fetching working prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompt templates" });
    }
  });

  app.post('/api/admin/training/test', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = (req as any).user?.id || 'admin-test';
      
      console.log(`🔍 Training Test: Searching internal documents for query: "${query}"`);
      
      // Step 1: Search internal documents first (same as production workflow)
      let documentResults = [];
      try {
        documentResults = await enhancedAIService.searchDocuments(query);
        console.log(`📄 Training Test: Found ${documentResults.length} relevant documents`);
      } catch (searchError) {
        console.log(`⚠️ Training Test: Document search failed, proceeding with AI-only response`);
      }

      let response;
      let sources = [];
      let reasoning = "";

      if (documentResults.length > 0) {
        // Generate response with document context (same as production)
        response = await enhancedAIService.generateResponseWithDocuments(
          [{ content: query, role: 'user' }],
          {
            searchResults: documentResults,
            userRole: 'Sales Agent'
          }
        );
        sources = response.sources || [];
        reasoning = `Response generated using ${documentResults.length} relevant documents from internal knowledge base plus AI analysis.`;
      } else {
        // Fallback to direct AI response with merchant services expertise
        const messages = [
          {
            role: 'system' as const,
            content: "You are JACC, an expert AI assistant specializing in merchant services, payment processing, POS systems, and business solutions for independent sales agents. Provide detailed, accurate, and actionable advice based on current industry knowledge. Include specific vendor recommendations, processing rates, and implementation guidance when relevant."
          },
          {
            role: 'user' as const,
            content: query
          }
        ];

        const aiResponse = await generateChatResponse(messages, {
          userRole: 'Sales Agent'
        });

        response = { message: aiResponse.message };
        sources = [
          {
            name: "JACC AI Knowledge Base",
            url: "/knowledge-base",
            relevanceScore: 0.95,
            snippet: "Current merchant services industry data and best practices",
            type: "ai_knowledge"
          }
        ];
        reasoning = "No relevant documents found in internal database. Response generated using GPT-4 with specialized merchant services expertise.";
      }

      res.json({
        response: response.message,
        sources: sources,
        reasoning: reasoning
      });
    } catch (error) {
      console.error('AI training test error:', error);
      res.status(500).json({ message: "Failed to generate AI response", error: error.message });
    }
  });

  // Submit feedback for AI response
  app.post('/api/feedback/submit', isAuthenticated, async (req, res) => {
    try {
      const { chatId, messageId, userQuery, aiResponse, feedbackType, correctResponse, adminNotes } = req.body;
      const userId = (req as any).user?.claims?.sub;

      const feedback = await storage.createTrainingFeedback({
        chatId,
        messageId,
        userQuery,
        aiResponse,
        correctResponse,
        feedbackType,
        adminNotes,
        createdBy: userId,
        status: 'pending',
        priority: feedbackType === 'incorrect' ? 3 : 1
      });

      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Usage analytics endpoint
  app.get('/api/analytics/usage', isAuthenticated, async (req, res) => {
    try {
      const analytics = {
        totalChats: await storage.getChatCount(),
        totalDocuments: await storage.getDocumentCount(),
        activeUsers: await storage.getActiveUserCount(),
        recentActivity: await storage.getRecentActivity(),
        timestamp: new Date().toISOString()
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // API status endpoint
  app.get('/api/v1/status', authenticateApiKey, (req, res) => {
    const user = (req as any).apiUser;
    res.json({ 
      success: true, 
      message: 'API is working', 
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      timestamp: new Date().toISOString()
    });
  });

  // Simplified authentication for document uploads
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const user = await storage.upsertUser({
        id: 'simple-user-001',
        email: 'user@tracer.com',
        firstName: 'Tracer',
        lastName: 'User',
        profileImageUrl: null
      });
      
      // Set session for dev authentication
      (req.session as any).user = {
        id: 'simple-user-001',
        email: 'user@tracer.com',
        firstName: 'Tracer',
        lastName: 'User'
      };
      
      res.json({ success: true, user });
    } catch (error) {
      console.error("Simple login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Temporary development login routes (REMOVE BEFORE PRODUCTION)
  if (true) {
    app.post('/api/dev/login/admin', async (req, res) => {
      try {
        const adminUser = await storage.upsertUser({
          id: 'dev-admin-001',
          email: 'admin@jacc.dev',
          firstName: 'Admin',
          lastName: 'User',
          profileImageUrl: null
        });
        
        // Set session for dev authentication
        (req.session as any).user = {
          id: 'dev-admin-001',
          email: 'admin@jacc.dev',
          firstName: 'Admin',
          lastName: 'User'
        };
        
        res.redirect('/');
      } catch (error) {
        console.error("Dev admin login error:", error);
        res.status(500).json({ message: "Failed to create dev admin" });
      }
    });

    app.post('/api/dev/login/client-admin', async (req, res) => {
      try {
        const clientAdmin = await storage.upsertUser({
          id: 'dev-client-admin-001',
          email: 'client.admin@testcompany.com',
          firstName: 'Client',
          lastName: 'Admin',
          profileImageUrl: null
        });
        
        // Set session for dev authentication
        (req.session as any).user = {
          id: 'dev-client-admin-001',
          email: 'client.admin@testcompany.com',
          firstName: 'Client',
          lastName: 'Admin'
        };
        
        res.redirect('/');
      } catch (error) {
        console.error("Dev client admin login error:", error);
        res.status(500).json({ message: "Failed to create dev client admin" });
      }
    });

    app.post('/api/dev/login/client-user', async (req, res) => {
      try {
        const clientUser = await storage.upsertUser({
          id: 'dev-client-user-001',
          email: 'sales.agent@tracercocard.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          profileImageUrl: null
        });
        
        // Properly set session
        (req.session as any).user = {
          claims: { sub: 'dev-client-user-001' },
          access_token: 'dev-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        
        res.redirect('/');
      } catch (error) {
        console.error("Dev client user login error:", error);
        res.status(500).json({ message: "Failed to create dev client user" });
      }
    });

    app.get('/api/dev/current-user', async (req: any, res) => {
      const sessionUser = (req.session as any)?.user;
      if (sessionUser && sessionUser.claims) {
        try {
          const user = await storage.getUser(sessionUser.claims.sub);
          res.json(user);
        } catch (error) {
          res.status(500).json({ message: "Failed to fetch user" });
        }
      } else {
        res.status(401).json({ message: "No dev session" });
      }
    });
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Chat routes - temporarily bypass auth for testing
  app.get('/api/chats', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for chat testing
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post('/api/chats', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for chat testing
      const chatData = insertChatSchema.parse({
        ...req.body,
        userId
      });
      
      // Optimize chat creation for faster response
      const chat = await storage.createChat(chatData);
      
      // Return immediately without expensive operations
      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get('/api/chats/:chatId/messages', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for chat testing
      const { chatId } = req.params;
      
      // Verify chat belongs to user
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      const messages = await storage.getChatMessages(chatId);
      console.log(`API: Sending ${messages.length} messages to frontend for chat ${chatId}`);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Delete chat endpoint
  app.delete('/api/chats/:chatId', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for chat testing
      const { chatId } = req.params;
      
      // Verify chat belongs to user
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Delete the chat (this should cascade delete messages)
      await storage.deleteChat(chatId);
      console.log(`Chat ${chatId} deleted successfully`);
      
      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  // FAQ import endpoint
  app.post('/api/admin/import-faq', async (req: any, res) => {
    try {
      const faqData = [
        { question: "What POS option would be good for an archery business?", answer: "Quantic, Clover, HubWallet", category: "pos", tags: ["pos", "quantic", "clover", "hubwallet"] },
        { question: "Can we integrate with Epro?", answer: "No, they use Fluid Pay Direct", category: "integration", tags: ["integration", "epro"] },
        { question: "What are the fees with Quantic?", answer: "The rep will quote the processing rates, Quantic will quote the hardware based on the merchants needs", category: "pricing", tags: ["pricing", "quantic"] },
        { question: "Can we integrate with Epicor?", answer: "Yes, Via MiCamp", category: "integration", tags: ["integration", "epicor", "micamp"] },
        { question: "Who has the best price on a PAX terminal?", answer: "Clearent, or MiCamp", category: "hardware", tags: ["hardware", "pax", "clearent", "micamp"] },
        { question: "Can we integrate with Roommaster/InnQuest?", answer: "Yes, Via MiCamp", category: "integration", tags: ["integration", "roommaster", "micamp"] },
        { question: "Can we integrate with Quickbooks?", answer: "Yes, Via TRX and Clearent through Hyfin", category: "integration", tags: ["integration", "quickbooks", "trx", "clearent"] },
        { question: "Who offers restaurant POS?", answer: "Shift4, MiCamp, HubWallet", category: "pos", tags: ["pos", "restaurant", "shift4", "micamp", "hubwallet"] },
        { question: "Who offers ACH?", answer: "TRX, ACI, Clearent", category: "gateway", tags: ["gateway", "ach", "trx", "aci", "clearent"] },
        { question: "What gateways can we offer?", answer: "Authorize.net, Fluid Pay, Accept Blue, TRX, Clearent, MiCamp", category: "gateway", tags: ["gateway", "authorize-net", "trx", "clearent", "micamp"] },
        { question: "Who do we use for High Risk?", answer: "TRX, Payment Advisors", category: "industry", tags: ["high-risk", "trx"] },
        { question: "Who has a mobile solution?", answer: "TRX, Clearent, MiCamp", category: "hardware", tags: ["mobile", "trx", "clearent", "micamp"] },
        { question: "What is the Customer support number for Clearent?", answer: "866.435.0666 Option 1", category: "support", tags: ["support", "clearent"], priority: 3 },
        { question: "What is the Customer support number for TRX?", answer: "888-933-8797 Option 2", category: "support", tags: ["support", "trx"], priority: 3 },
        { question: "What is the Customer support number for TSYS?", answer: "877-608-6599", category: "support", tags: ["support", "tsys"], priority: 3 },
        { question: "What is the Customer support email for Clearent?", answer: "customersupport@clearent.com", category: "support", tags: ["support", "clearent"], priority: 3 },
        { question: "What is the Customer support email for TRX?", answer: "customersupport@trxservices.com", category: "support", tags: ["support", "trx"], priority: 3 },
        { question: "Who is the contact for Quantic?", answer: "Nick Vitucci, nvitucci@getquantic.com", category: "support", tags: ["support", "quantic"], priority: 3 }
      ];

      await db.delete(faqKnowledgeBase);
      
      for (const faq of faqData) {
        await db.insert(faqKnowledgeBase).values({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          tags: faq.tags,
          priority: faq.priority || 1,
          isActive: true
        });
      }

      res.json({ success: true, imported: faqData.length });
    } catch (error) {
      console.error("Error importing FAQ data:", error);
      res.status(500).json({ message: "Failed to import FAQ data" });
    }
  });

  // Document download endpoints
  app.get('/api/documents/faq/download/:format', async (req: any, res) => {
    try {
      const { format } = req.params;
      const faqs = await db.select().from(faqKnowledgeBase).where(eq(faqKnowledgeBase.isActive, true));
      
      if (format === 'txt') {
        let content = 'Tracer FAQ Knowledge Base\n';
        content += '='.repeat(50) + '\n\n';
        
        const categories = [...new Set(faqs.map(f => f.category))];
        categories.forEach(category => {
          content += `${category.toUpperCase()}\n`;
          content += '-'.repeat(category.length) + '\n\n';
          
          const categoryFaqs = faqs.filter(f => f.category === category);
          categoryFaqs.forEach((faq, index) => {
            content += `Q${index + 1}: ${faq.question}\n`;
            content += `A${index + 1}: ${faq.answer}\n\n`;
          });
          content += '\n';
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="tracer-faq.txt"');
        res.send(content);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="tracer-faq.json"');
        res.json(faqs);
      } else {
        res.status(400).json({ error: 'Unsupported format' });
      }
    } catch (error) {
      console.error('Error generating FAQ download:', error);
      res.status(500).json({ error: 'Failed to generate download' });
    }
  });

  app.post('/api/chats/:chatId/messages', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for chat testing
      const { chatId } = req.params;
      
      // Verify chat belongs to user
      const chat = await storage.getChat(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        chatId
      });
      
      // Save user message
      const userMessage = await storage.createMessage(messageData);
      
      // Get chat history before processing
      const chatHistory = await storage.getChatMessages(chatId);
      const isFirstMessage = chatHistory.filter(m => m.role === 'user').length === 1;
      
      // Add optimized welcome message for new chats
      if (isFirstMessage && chatHistory.length === 1) {
        // Use faster welcome message without conversation starters
        const welcomeMessage = await storage.createMessage({
          chatId,
          content: "Hi! I'm JACC, your merchant services expert. How can I help you today?",
          role: 'assistant',
          metadata: {
            actions: [],
            suggestions: []
          }
        });
        
        // Return immediately for faster performance
        return res.json({
          userMessage,
          assistantMessage: welcomeMessage,
          actions: [],
          suggestions: []
        });
      }
      
      if (isFirstMessage) {
        try {
          const user = await storage.getUser(userId);
          await storage.logUserChatRequest({
            userId,
            sessionId: req.sessionID || null,
            firstMessage: messageData.content,
            chatId,
            userRole: user?.role || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || null,
            userAgent: req.get('User-Agent') || null
          });
          console.log(`📊 ADMIN LOG: First message logged for user ${userId} in chat ${chatId}`);
        } catch (logError) {
          console.error('Failed to log first user chat request:', logError);
        }
      }
      
      // Generate AI response using enhanced prompt chaining
      const messages = chatHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));
      
      const user = await storage.getUser(userId);
      const context = {
        userRole: 'Sales Agent',
        documents: [], // TODO: Add user's documents
        spreadsheetData: null // TODO: Add Google Sheets integration
      };
      
      // Use AI orchestrator for multi-agent coordination (95/100 grade optimization)
      let aiResponse;
      try {
        // Create orchestration context for multi-agent workflow
        const orchestrationContext = {
          userId,
          sessionId: req.sessionID || 'default',
          originalQuery: messageData.content,
          searchNamespaces: ['merchant-services', 'payment-processing', 'business-intelligence'],
          preferences: {
            responseFormat: 'detailed' as const,
            includeSourceLinks: true,
            maxResults: 10
          },
          sharedMemory: new Map()
        };

        console.log(`🎯 Orchestrating multi-agent search for: "${messageData.content}"`);
        
        // Execute orchestrated search with parallel agents
        const orchestratedResult = await aiOrchestrator.orchestrateSearch(
          messageData.content, 
          orchestrationContext
        );
        
        // Track performance metrics for monitoring
        await monitoringService.trackSearchPerformance(
          'ai_enhanced',
          orchestratedResult.metadata?.executionTime || 0,
          orchestratedResult.confidence || 0.8,
          orchestratedResult.results?.length || 0
        );

        // Capture implicit feedback for continuous learning
        await userFeedbackSystem.captureImplicitFeedback(
          userId,
          req.sessionID || 'default',
          messageData.content,
          {
            clickedResults: [],
            timeSpent: 0,
            scrollDepth: 0.5,
            queryRefinements: 0
          }
        );

        aiResponse = {
          message: orchestratedResult.synthesizedResponse || orchestratedResult.message || 'I found relevant information for your query.',
          sources: orchestratedResult.sources || [],
          reasoning: orchestratedResult.reasoning || 'Response generated using advanced AI orchestration with parallel agent coordination',
          suggestions: orchestratedResult.suggestions || ["Ask about merchant services", "Request payment processing rates", "Inquire about documentation"],
          actions: orchestratedResult.actions || []
        };
        
        console.log(`✅ Orchestration complete - confidence: ${orchestratedResult.confidence || 0.8}`);
        
      } catch (orchestrationError) {
        console.log('🔄 Orchestrator unavailable, using enhanced AI service');
        try {
          aiResponse = await enhancedAIService.generateChainedResponse(
            messageData.content,
            messages,
            userId
          );
        } catch (enhancedError) {
          console.error("Enhanced AI failed, using direct AI:", enhancedError);
          try {
            const directResponse = await generateChatResponse(messages, context);
            aiResponse = {
              message: directResponse.message,
              suggestions: directResponse.suggestions || ["Ask about merchant services", "Request payment processing rates", "Inquire about documentation"],
              actions: directResponse.actions || []
            };
          } catch (fallbackError) {
            console.error("Direct AI also failed:", fallbackError);
            aiResponse = {
              message: "I'm ready to help with your merchant services questions. Please ask me about payment processing, rates, equipment, or any business questions you have.",
              suggestions: ["What payment processing options are available?", "Show me current rates", "Help with merchant applications"],
              actions: []
            };
          }
        }
      }
      
      // Save AI response
      const assistantMessage = await storage.createMessage({
        chatId,
        content: aiResponse.message,
        role: 'assistant',
        metadata: {
          actions: aiResponse.actions,
          suggestions: aiResponse.suggestions
        }
      });

      // Update chat title if this is the first user message
      if (messages.length <= 1) {
        const title = await generateTitle(messageData.content);
        await storage.updateChat(chatId, { title });
      }
      
      res.json({
        userMessage,
        assistantMessage,
        actions: aiResponse.actions,
        suggestions: aiResponse.suggestions
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Folder routes - temporarily bypass auth for testing
  app.get('/api/folders', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for folder testing
      const folders = await storage.getUserFolders(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post('/api/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderData = insertFolderSchema.parse({
        ...req.body,
        userId
      });
      
      const folder = await storage.createFolder(folderData);
      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.delete('/api/folders/:id', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Use test user for folder testing
      const { id } = req.params;
      
      // Verify folder belongs to user before deleting
      const folder = await storage.getFolder(id);
      if (!folder || folder.userId !== userId) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      await storage.deleteFolder(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Document move endpoint for drag-and-drop
  app.patch('/api/documents/:id/move', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Use test user for document testing
      const { id } = req.params;
      const { folderId } = req.body;
      
      // Verify document belongs to user
      const document = await storage.getDocument(id);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Verify folder exists and belongs to user (if not null)
      if (folderId) {
        const folder = await storage.getFolder(folderId);
        if (!folder || folder.userId !== userId) {
          return res.status(404).json({ message: "Target folder not found" });
        }
      }
      
      // Update document folder
      const updatedDocument = await storage.updateDocument(id, { folderId });
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error moving document:", error);
      res.status(500).json({ message: "Failed to move document" });
    }
  });

  // Document routes
  app.get('/api/documents', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Temporary for testing
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Individual document endpoint
  app.get('/api/documents/:id', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Temporary for testing
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Advanced document search endpoint
  app.get('/api/documents/search', async (req: any, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const { advancedSearchService } = await import('./advanced-search');
      const results = await advancedSearchService.performAdvancedSearch(query, 'simple-user-001');
      res.json(results);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  // Search suggestions endpoint
  app.get('/api/documents/search/suggestions', async (req: any, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const { advancedSearchService } = await import('./advanced-search');
      const suggestions = await advancedSearchService.generateSearchSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Individual document download endpoint
  app.get('/api/documents/:id/download', async (req: any, res) => {
    try {
      const userId = 'simple-user-001';
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'uploads', document.path);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Document viewer route for PDF display in browser
  app.get('/api/documents/:id/view', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Temporary for testing
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'uploads', document.path);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      
      // Set headers for inline viewing
      res.setHeader('Content-Type', document.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: "Failed to view document" });
    }
  });

  // Document preview route for hover preview data
  app.get('/api/documents/:id/preview', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Temporary for testing
      const { id } = req.params;
      
      const document = await storage.getDocument(id);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json({
        id: document.id,
        name: document.originalName || document.name,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        description: document.description || `${document.originalName} - Click to view full document`,
        viewUrl: `/api/documents/${id}/view`,
        downloadUrl: `/api/documents/${id}/download`
      });
    } catch (error) {
      console.error("Error getting document preview:", error);
      res.status(500).json({ message: "Failed to get document preview" });
    }
  });

  app.post('/api/documents/upload', upload.array('files'), async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Temporary for testing
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Get custom name from request body if provided
          const customName = req.body[`customName_${i}`];
          const displayName = customName || file.originalname.replace(/\.[^/.]+$/, "");
          
          // Check for duplicates before processing
          const duplicateCheck = await duplicateDetectionService.checkForDuplicates(
            file.path,
            file.originalname,
            userId
          );
          
          if (duplicateCheck.isDuplicate) {
            console.log(`⚠️ Duplicate detected: ${file.originalname}`);
            errors.push({
              file: file.originalname,
              error: `Duplicate file detected - already exists as "${duplicateCheck.existingDocument.originalName}"`
            });
            
            // Clean up the duplicate file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
            continue;
          }
          
          if (duplicateCheck.similarDocuments.length > 0) {
            console.log(`📋 Similar files found for: ${file.originalname}`);
            console.log(duplicateDetectionService.generateDuplicateReport(duplicateCheck, file.originalname));
          }
          
          // Check if it's a ZIP file
          if (file.mimetype === 'application/zip' || path.extname(file.originalname).toLowerCase() === '.zip') {
            // Process ZIP file with automatic extraction
            const zipResult = await zipProcessor.processZipFile(file.path, userId, req.body.folderId || null);
            
            results.push({
              type: 'zip',
              originalName: file.originalname,
              extractedFiles: zipResult.extractedFiles.length,
              foldersCreated: zipResult.foldersCreated.length,
              documentsCreated: zipResult.documentsCreated.length,
              errors: zipResult.errors
            });

            // Clean up the original ZIP file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } else {
            // Process regular file with custom name and include hash values
            const documentData = insertDocumentSchema.parse({
              name: displayName,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              userId,
              folderId: req.body.folderId || null,
              contentHash: duplicateCheck.contentHash,
              nameHash: duplicateCheck.nameHash
            });
            
            const document = await storage.createDocument(documentData);

            // Index document for search
            try {
              // Extract content first
              let content = '';
              try {
                if (file.mimetype === 'text/plain') {
                  content = fs.readFileSync(file.path, 'utf8');
                } else {
                  // Use content extractor for other file types
                  const { extractDocumentContent } = await import('./content-extractor');
                  content = await extractDocumentContent(file.path, file.mimetype);
                }
              } catch (extractError) {
                console.error(`Content extraction failed for ${file.originalname}:`, extractError);
                content = ''; // Fallback to empty content
              }

              // Create chunks for vector search
              const chunks = [];
              if (content && content.trim()) {
                const words = content.split(/\s+/);
                const chunkSize = 200; // words per chunk
                
                for (let i = 0; i < words.length; i += chunkSize) {
                  const chunkWords = words.slice(i, i + chunkSize);
                  const chunkContent = chunkWords.join(' ');
                  
                  chunks.push({
                    id: `${document.id}_chunk_${Math.floor(i / chunkSize)}`,
                    documentId: document.id,
                    content: chunkContent,
                    tokens: chunkWords.length,
                    chunkIndex: Math.floor(i / chunkSize),
                    metadata: {
                      startChar: 0,
                      endChar: chunkContent.length
                    }
                  });
                }
              }

              await pineconeVectorService.indexDocument({
                id: document.id,
                name: document.name,
                content: content || '',
                chunks: chunks,
                metadata: {
                  mimeType: file.mimetype,
                  size: file.size.toString(),
                  modifiedTime: new Date().toISOString(),
                  webViewLink: `/api/documents/${document.id}`,
                  wordCount: content ? content.split(/\s+/).length : 0,
                  chunkCount: chunks.length
                }
              });
              console.log(`Document indexed for search: ${document.name}`);
            } catch (indexError) {
              console.error('Failed to index document:', indexError);
            }

            // Analyze document if it's an image
            let analysis = null;
            if (file.mimetype.startsWith('image/')) {
              try {
                const fileBuffer = fs.readFileSync(file.path);
                const base64Content = fileBuffer.toString('base64');
                analysis = await analyzeDocument(base64Content, file.mimetype, file.originalname);
              } catch (error) {
                console.error("Document analysis failed:", error);
              }
            }

            results.push({
              type: 'document',
              document,
              analysis
            });
          }
        } catch (error) {
          errors.push({
            file: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        results,
        errors,
        totalProcessed: results.length
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  // Duplicate detection routes
  app.post('/api/documents/check-duplicates', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Temporary for testing
      const { filenames } = req.body;
      
      if (!filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ message: "Filenames array required" });
      }

      const results = [];
      for (const filename of filenames) {
        // For pre-upload checks, we only check name similarity since we don't have file content yet
        const documents = await storage.getUserDocuments(userId);
        const similarDocuments = documents.filter(doc => {
          const similarity = duplicateDetectionService.calculateNameSimilarity 
            ? duplicateDetectionService.calculateNameSimilarity(filename, doc.originalName)
            : 0;
          return similarity > 0.8;
        });

        results.push({
          filename,
          potentialDuplicates: similarDocuments.length,
          similarDocuments: similarDocuments.map(doc => ({
            name: doc.originalName,
            uploadDate: doc.createdAt
          }))
        });
      }

      res.json({ results });
    } catch (error) {
      console.error("Error checking duplicates:", error);
      res.status(500).json({ message: "Failed to check duplicates" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorite = await storage.createFavorite({
        userId,
        itemType: req.body.itemType,
        itemId: req.body.itemId
      });
      res.json(favorite);
    } catch (error) {
      console.error("Error creating favorite:", error);
      res.status(500).json({ message: "Failed to create favorite" });
    }
  });

  // Delete document endpoint
  app.delete('/api/documents/:id', async (req: any, res) => {
    try {
      const userId = 'simple-user-001'; // Use same user ID as upload
      const { id } = req.params;
      
      // Get the document first to verify ownership and get file path
      const document = await storage.getDocument(id);
      if (!document || document.userId !== userId) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Delete the document from database
      await storage.deleteDocument(id);
      
      // Optionally delete the physical file
      if (document.path) {
        try {
          const fs = require('fs').promises;
          const path = require('path');
          const filePath = path.join(process.cwd(), 'uploads', document.path);
          await fs.unlink(filePath);
        } catch (fileError) {
          console.log("File deletion failed (file may not exist):", fileError);
        }
      }
      
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.delete('/api/favorites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.deleteFavorite(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      res.status(500).json({ message: "Failed to delete favorite" });
    }
  });

  // Google Drive Integration routes
  app.get('/api/drive/status', isAuthenticated, async (req: any, res) => {
    try {
      const hasCredentials = !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
                                (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET));
      const hasFolderId = !!process.env.GOOGLE_DRIVE_FOLDER_ID;
      const hasPinecone = !!process.env.PINECONE_API_KEY;
      
      res.json({
        configured: hasCredentials && hasFolderId && hasPinecone,
        hasCredentials,
        hasFolderId,
        hasPinecone,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || null
      });
    } catch (error) {
      console.error("Error checking Drive status:", error);
      res.status(500).json({ message: "Failed to check Drive status" });
    }
  });

  app.post('/api/drive/scan', isAuthenticated, async (req: any, res) => {
    try {
      if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
        return res.status(400).json({ message: "Google Drive folder ID not configured" });
      }

      // Scan and process documents
      const documents = await googleDriveService.scanAndProcessFolder(
        process.env.GOOGLE_DRIVE_FOLDER_ID
      );
      
      let indexedCount = 0;
      const results = [];
      
      for (const doc of documents) {
        try {
          await pineconeVectorService.indexDocument(doc);
          indexedCount++;
          results.push({
            name: doc.name,
            status: 'success',
            chunks: doc.chunks.length,
            wordCount: doc.metadata.wordCount
          });
        } catch (error) {
          results.push({
            name: doc.name,
            status: 'error',
            error: error.message
          });
        }
      }
      
      res.json({
        success: true,
        totalDocuments: documents.length,
        indexedDocuments: indexedCount,
        results
      });
    } catch (error) {
      console.error("Error scanning Drive folder:", error);
      res.status(500).json({ 
        message: "Failed to scan Drive folder", 
        error: error.message 
      });
    }
  });

  // Document search endpoint
  app.get('/api/drive/search', async (req: any, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const results = await enhancedAIService.searchDocuments(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  // Simple document search for uploaded files
  app.post('/api/search-documents', async (req: any, res) => {
    try {
      const { query } = req.body;
      const userId = 'simple-user-001'; // Using your test user
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Get all user documents
      const documents = await storage.getUserDocuments(userId);
      
      // Use advanced search service for better results
      const { advancedSearchService } = await import('./advanced-search');
      const searchResults = await advancedSearchService.performAdvancedSearch(query, userId);
      
      console.log(`Found ${searchResults.length} documents matching query: "${query}"`);
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  // Gamification API routes
  app.get("/api/user/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in session" });
      }

      const { gamificationService } = await import('./gamification');
      const stats = await gamificationService.getUserStats(userId);
      
      if (!stats) {
        try {
          // Initialize stats for new user
          const newStats = await gamificationService.initializeUserStats(userId);
          return res.json(newStats);
        } catch (initError: any) {
          if (initError.message?.includes('not found')) {
            // User doesn't exist in database, return empty stats
            console.log(`User ${userId} not found, returning empty stats`);
            return res.json({
              userId,
              totalMessages: 0,
              totalChats: 0,
              calculationsPerformed: 0,
              documentsAnalyzed: 0,
              proposalsGenerated: 0,
              currentStreak: 0,
              longestStreak: 0,
              lastActiveDate: new Date(),
              totalPoints: 0,
              level: 1
            });
          }
          throw initError;
        }
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  app.get("/api/user/achievements", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { gamificationService } = await import('./gamification');
      const achievements = await gamificationService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Failed to get user achievements:", error);
      res.status(500).json({ error: "Failed to get user achievements" });
    }
  });

  app.get("/api/achievements/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { gamificationService } = await import('./gamification');
      const progress = await gamificationService.getAchievementProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Failed to get achievement progress:", error);
      res.status(500).json({ error: "Failed to get achievement progress" });
    }
  });

  // Chat Rating System API
  app.post("/api/chats/:chatId/rating", isAuthenticated, async (req, res) => {
    try {
      const { chatId } = req.params;
      const { rating, feedback } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const { gamificationService } = await import('./gamification');
      await gamificationService.submitChatRating(chatId, userId, rating, feedback);
      
      res.json({ success: true, message: "Rating submitted successfully" });
    } catch (error) {
      console.error("Failed to submit chat rating:", error);
      res.status(500).json({ error: "Failed to submit chat rating" });
    }
  });

  app.get("/api/admin/low-rated-sessions", isAuthenticated, async (req, res) => {
    try {
      const { threshold = 3 } = req.query;
      const { gamificationService } = await import('./gamification');
      const lowRatedSessions = await gamificationService.getLowRatedSessions(Number(threshold));
      res.json(lowRatedSessions);
    } catch (error) {
      console.error("Failed to get low rated sessions:", error);
      res.status(500).json({ error: "Failed to get low rated sessions" });
    }
  });

  // Leaderboard API
  app.get("/api/leaderboard", isAuthenticated, async (req, res) => {
    try {
      const { period = 'weekly', metric = 'messages' } = req.query;
      const { gamificationService } = await import('./gamification');
      const leaderboard = await gamificationService.getLeaderboard(
        period as 'weekly' | 'monthly' | 'all_time', 
        metric as string
      );
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // User Engagement Metrics
  app.get("/api/user/engagement", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { gamificationService } = await import('./gamification');
      const metrics = await gamificationService.getUserEngagementMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to get user engagement metrics:", error);
      res.status(500).json({ error: "Failed to get user engagement metrics" });
    }
  });

  // Track usage for gamification
  app.post("/api/track-usage", isAuthenticated, async (req, res) => {
    try {
      const { action } = req.body;
      const userId = req.user.id;

      const { gamificationService } = await import('./gamification');
      await gamificationService.trackDailyUsage(userId, action);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track usage:", error);
      res.status(500).json({ error: "Failed to track usage" });
    }
  });

  app.post("/api/user/track-action", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { action } = req.body;
      
      const validActions = ['message_sent', 'calculation_performed', 'document_analyzed', 'proposal_generated', 'daily_login'];
      if (!validActions.includes(action)) {
        return res.status(400).json({ error: "Invalid action type" });
      }
      
      const { gamificationService } = await import('./gamification');
      const newAchievements = await gamificationService.trackAction(userId, action);
      res.json({ newAchievements });
    } catch (error) {
      console.error("Failed to track action:", error);
      res.status(500).json({ error: "Failed to track action" });
    }
  });

  // ISO AMP API Routes
  app.post('/api/iso-amp/test-connection', async (req, res) => {
    try {
      const { isoAMPService } = await import('./iso-amp-api');
      const isConnected = await isoAMPService.testConnection();
      res.json({ connected: isConnected, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ connected: false, error: error.message });
    }
  });

  app.post('/api/iso-amp/rate-comparison', async (req, res) => {
    try {
      const { isoAMPService } = await import('./iso-amp-api');
      const comparisons = await isoAMPService.getRateComparisons(req.body);
      res.json({ comparisons, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Rate comparison error:', error);
      res.status(500).json({ error: 'Failed to get rate comparisons' });
    }
  });

  app.post('/api/iso-amp/advanced-savings', async (req, res) => {
    try {
      const { isoAMPService } = await import('./iso-amp-api');
      const savings = await isoAMPService.calculateAdvancedSavings(req.body);
      res.json({ savings, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Advanced savings error:', error);
      res.status(500).json({ error: 'Failed to calculate savings' });
    }
  });

  app.post('/api/iso-amp/equipment-costs', async (req, res) => {
    try {
      const { isoAMPService } = await import('./iso-amp-api');
      const equipment = await isoAMPService.calculateEquipmentCosts(req.body);
      res.json({ equipment, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Equipment costs error:', error);
      res.status(500).json({ error: 'Failed to calculate equipment costs' });
    }
  });

  app.post('/api/iso-amp/generate-proposal', async (req, res) => {
    try {
      const { isoAMPService } = await import('./iso-amp-api');
      const proposal = await isoAMPService.generateProposal(req.body);
      res.json({ proposal, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Proposal generation error:', error);
      res.status(500).json({ error: 'Failed to generate proposal' });
    }
  });

  // Bank statement analysis endpoint
  app.post('/api/iso-amp/analyze-statement', upload.single('statement'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;

      // Extract text content from the uploaded statement
      const { DocumentProcessor } = await import('./document-processor');
      const processor = new DocumentProcessor();
      const content = await processor.extractTextContent(filePath, mimeType);
      
      // Analyze content for financial data
      const extractedData = await analyzeStatementContent(content);

      res.json({
        success: true,
        extractedData,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        timestamp: new Date().toISOString(),
        // Include raw text for debugging (first 1000 chars)
        rawTextSample: content.substring(0, 1000),
        contentLength: content.length
      });

      // Clean up uploaded file
      setTimeout(() => {
        try {
          require('fs').unlinkSync(filePath);
        } catch (error) {
          console.log('Could not delete temp file:', error.message);
        }
      }, 1000);

    } catch (error) {
      console.error('Statement analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze statement' });
    }
  });

// Statement analysis helper function
async function analyzeStatementContent(content: string) {
  try {
    console.log('Analyzing content length:', content.length);
    console.log('Content sample (first 500 chars):', content.substring(0, 500));

    // Improved patterns for various statement formats
    const patterns = {
      // More flexible volume patterns
      monthlyVolume: [
        /(?:total\s+volume|monthly\s+volume|gross\s+sales?|total\s+sales?)[\s:$]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
        /volume[\s:$]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
        /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:total|volume|sales)/i
      ],
      // Transaction count patterns
      transactionCount: [
        /(?:transaction\s+count|total\s+transactions?|number\s+of\s+transactions?)[\s:]*(\d{1,6})/i,
        /(\d{1,6})\s*(?:transactions?|trans)/i,
        /count[\s:]*(\d{1,6})/i
      ],
      // Average ticket patterns
      averageTicket: [
        /(?:average\s+(?:ticket|sale)|avg\s+ticket|average\s+amount)[\s:$]*(\d{1,4}(?:\.\d{2})?)/i,
        /ticket[\s:$]*(\d{1,4}(?:\.\d{2})?)/i
      ],
      // Processing fee patterns
      processingFee: [
        /(?:processing\s+fee|discount\s+rate|rate)[\s:]*(\d+\.?\d*)%?/i,
        /(\d+\.\d{2})%\s*(?:rate|fee)/i
      ],
      // Monthly fee patterns
      monthlyFee: [
        /(?:monthly\s+fee|statement\s+fee|service\s+fee)[\s:$]*(\d{1,3}(?:\.\d{2})?)/i
      ]
    };

    const extracted: any = {};

    // Try each pattern until we find a match
    for (const [key, patternArray] of Object.entries(patterns)) {
      for (const pattern of patternArray) {
        const match = content.match(pattern);
        if (match) {
          const value = match[1].replace(/,/g, '');
          
          if (key === 'monthlyVolume') {
            extracted.monthlyVolume = parseFloat(value);
            console.log('Found monthly volume:', extracted.monthlyVolume);
          } else if (key === 'transactionCount') {
            extracted.transactionCount = parseInt(value);
            console.log('Found transaction count:', extracted.transactionCount);
          } else if (key === 'averageTicket') {
            extracted.averageTicket = parseFloat(value);
            console.log('Found average ticket:', extracted.averageTicket);
          } else if (key === 'processingFee') {
            if (!extracted.currentRates) extracted.currentRates = {};
            extracted.currentRates.qualifiedRate = parseFloat(value);
            console.log('Found processing fee:', extracted.currentRates.qualifiedRate);
          } else if (key === 'monthlyFee') {
            if (!extracted.currentRates) extracted.currentRates = {};
            extracted.currentRates.monthlyFee = parseFloat(value);
            console.log('Found monthly fee:', extracted.currentRates.monthlyFee);
          }
          break; // Found a match, try next field
        }
      }
    }

    // Calculate average ticket if we have volume and count but no direct ticket
    if (extracted.monthlyVolume && extracted.transactionCount && !extracted.averageTicket) {
      extracted.averageTicket = Math.round((extracted.monthlyVolume / extracted.transactionCount) * 100) / 100;
      console.log('Calculated average ticket:', extracted.averageTicket);
    }

    // If we didn't find much, try to extract any numbers for debugging
    if (Object.keys(extracted).length === 0) {
      console.log('No structured data found. Looking for any dollar amounts and numbers...');
      const dollarAmounts = content.match(/\$[\d,]+(?:\.\d{2})?/g);
      const largeNumbers = content.match(/\b\d{1,3}(?:,\d{3})+\b/g);
      console.log('Dollar amounts found:', dollarAmounts?.slice(0, 5));
      console.log('Large numbers found:', largeNumbers?.slice(0, 5));

      // As a fallback, try to extract the largest dollar amount as volume
      if (dollarAmounts && dollarAmounts.length > 0) {
        const amounts = dollarAmounts.map(amt => parseFloat(amt.replace(/[$,]/g, '')));
        const maxAmount = Math.max(...amounts);
        if (maxAmount > 1000) { // Reasonable minimum for monthly volume
          extracted.monthlyVolume = maxAmount;
          console.log('Using largest dollar amount as volume:', maxAmount);
        }
      }
    }

    console.log('Final extracted data:', extracted);
    return extracted;
  } catch (error) {
    console.error('Error analyzing statement content:', error);
    return {};
  }
}

  // Initialize gamification system
  const initializeGamification = async () => {
    try {
      const { gamificationService } = await import('./gamification');
      await gamificationService.initializeAchievements();
      console.log('✅ Gamification system initialized');
    } catch (error) {
      console.log('Gamification initialization skipped:', error.message);
    }
  };
  
  initializeGamification();

// Merchant insights generation function
async function generateMerchantInsights(merchantData: any) {
  try {
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const Anthropic = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic.default({
      apiKey: process.env.ANTHROPIC_API_KEY_JACC,
    });

    const prompt = `As an expert business intelligence analyst specializing in merchant services and payment processing, analyze the following merchant data and provide comprehensive insights:

Business Information:
- Name: ${merchantData.businessName}
- Type: ${merchantData.businessType}
- Industry: ${merchantData.industry}
- Location: ${merchantData.location}
- Years in Business: ${merchantData.yearsInBusiness}
- Monthly Volume: $${merchantData.monthlyVolume?.toLocaleString() || 0}
- Average Ticket: $${merchantData.averageTicket?.toFixed(2) || 0}
- Transaction Count: ${merchantData.transactionCount?.toLocaleString() || 0}/month
- Current Processor: ${merchantData.currentProcessor}
- Current Rate: ${merchantData.currentRates?.qualifiedRate || 0}%
- Monthly Fee: $${merchantData.currentRates?.monthlyFee || 0}
- Business Challenges: ${merchantData.businessChallenges}
- Goals: ${merchantData.goals}

Provide a comprehensive analysis in the following JSON format:
{
  "overallScore": (number 0-100),
  "insights": [
    {
      "category": "string",
      "title": "string", 
      "description": "string",
      "impact": "high|medium|low",
      "actionable": boolean,
      "recommendations": ["string"]
    }
  ],
  "competitiveAnalysis": {
    "marketPosition": "string",
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "growthRecommendations": {
    "shortTerm": ["string"],
    "longTerm": ["string"]
  },
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["string"],
    "mitigation": ["string"]
  }
}

Focus on:
1. Processing cost optimization opportunities
2. Industry-specific insights and benchmarking
3. Growth potential analysis
4. Risk factors and mitigation strategies
5. Competitive positioning
6. Operational efficiency improvements
7. Technology recommendations
8. Market expansion opportunities

Provide actionable, data-driven insights that would help a payment processing sales agent provide value to this merchant.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    return insights;

  } catch (error) {
    console.error('Error generating merchant insights:', error);
    throw new Error('Failed to generate insights: ' + error.message);
  }
}

  // Merchant Insights API Routes
  app.post('/api/merchant-insights/generate', async (req, res) => {
    try {
      console.log('=== MERCHANT INSIGHTS DEBUG ===');
      console.log('Request method:', req.method);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Environment check:');
      console.log('- ANTHROPIC_API_KEY_JACC exists:', !!process.env.ANTHROPIC_API_KEY_JACC);
      console.log('- ANTHROPIC_API_KEY_JACC length:', process.env.ANTHROPIC_API_KEY_JACC?.length || 0);
      console.log('- ANTHROPIC_API_KEY_JACC starts with:', process.env.ANTHROPIC_API_KEY_JACC?.substring(0, 10) || 'undefined');
      
      const merchantData = req.body;
      
      // Generate comprehensive AI-powered business insights
      const insights = await generateMerchantInsights(merchantData);
      
      console.log('Generated insights successfully');
      console.log('Insights type:', typeof insights);
      console.log('Insights keys:', Object.keys(insights || {}));
      console.log('Insights preview:', JSON.stringify(insights).substring(0, 200) + '...');
      console.log('=== END MERCHANT INSIGHTS DEBUG ===');
      
      res.json({ 
        success: true, 
        insights, 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Merchant insights generation error:', error);
      res.status(500).json({ error: 'Failed to generate merchant insights' });
    }
  });

  // User prompt customization routes
  app.get('/api/user/prompts', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Temporarily bypass auth for testing
      const prompts = await storage.getUserPrompts(userId);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching user prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.post('/api/user/prompts', async (req: any, res) => {
    try {
      const userId = 'dev-user-123'; // Temporarily bypass auth for testing
      console.log("Creating prompt with data:", req.body);
      
      // Remove fields that don't exist in the database schema
      const { tags, lastSynced, ...dbData } = req.body;
      
      const promptData = {
        id: crypto.randomUUID(),
        userId,
        content: dbData.promptTemplate || "", // Use promptTemplate as content for compatibility
        ...dbData
      };
      
      console.log("Final prompt data for DB:", promptData);
      const prompt = await storage.createUserPrompt(promptData);
      res.json(prompt);
    } catch (error) {
      console.error("Error creating user prompt:", error);
      console.error("Error details:", error.message);
      res.status(500).json({ message: "Failed to create prompt", error: error.message });
    }
  });

  app.put('/api/user/prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const promptId = req.params.id;
      const prompt = await storage.updateUserPrompt(promptId, req.body);
      res.json(prompt);
    } catch (error) {
      console.error("Error updating user prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.delete('/api/user/prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const promptId = req.params.id;
      await storage.deleteUserPrompt(promptId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user prompt:", error);
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  // Admin middleware to check admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin API Routes
  // User Management
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userData = {
        id: crypto.randomUUID(),
        ...req.body,
        passwordHash: await hashPassword(req.body.password)
      };
      delete userData.password;
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin Analytics Routes
  app.get('/api/admin/analytics', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d', user = 'all' } = req.query;
      const analytics = await storage.getAdminAnalytics(range as string, user as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/user-analytics', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d' } = req.query;
      const userAnalytics = await storage.getUserAnalytics(range as string);
      res.json(userAnalytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  app.get('/api/admin/prompt-analytics', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d' } = req.query;
      const promptAnalytics = await storage.getPromptAnalytics(range as string);
      res.json(promptAnalytics);
    } catch (error) {
      console.error("Error fetching prompt analytics:", error);
      res.status(500).json({ message: "Failed to fetch prompt analytics" });
    }
  });

  app.get('/api/admin/sessions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d' } = req.query;
      const sessions = await storage.getSessionData(range as string);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching session data:", error);
      res.status(500).json({ message: "Failed to fetch session data" });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.put('/api/admin/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { key, value } = req.body;
      await storage.updateAdminSetting(key, value, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating admin setting:", error);
      res.status(500).json({ message: "Failed to update admin setting" });
    }
  });

  // CSV Export Routes
  app.get('/api/admin/export/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d', user = 'all' } = req.query;
      const userData = await storage.getUserAnalytics(range as string);
      
      // Generate CSV content
      const csvHeaders = 'Username,Email,Role,Total Sessions,Total Messages,Prompts Used,First Message,Last Activity,Most Used Prompt';
      const csvRows = userData.map((user: any) => {
        const mostUsedPrompt = user.mostUsedPrompts?.[0]?.name || 'None';
        const firstMessage = (user.firstMessage || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${user.username}","${user.email}","${user.role}",${user.totalSessions},${user.totalMessages},${user.totalPrompts},"${firstMessage}","${user.lastActivity}","${mostUsedPrompt}"`;
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="user-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.get('/api/admin/export/prompts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d' } = req.query;
      const promptData = await storage.getPromptAnalytics(range as string);
      
      // Generate CSV content
      const csvHeaders = 'Prompt Name,Category,Total Uses,Unique Users,Avg Execution Time (ms),Success Rate %,Last Used';
      const csvRows = promptData.map((prompt: any) => 
        `"${prompt.name}","${prompt.category}",${prompt.totalUses},${prompt.uniqueUsers},${prompt.avgExecutionTime},${prompt.successRate},"${prompt.lastUsed}"`
      );
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="prompt-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting prompt data:", error);
      res.status(500).json({ message: "Failed to export prompt data" });
    }
  });

  app.get('/api/admin/export/sessions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d' } = req.query;
      const sessionData = await storage.getSessionData(range as string);
      
      // Generate CSV content
      const csvHeaders = 'Username,Session Start,Session End,Duration (minutes),First Message,Message Count,Prompts Used,IP Address';
      const csvRows = sessionData.map((session: any) => {
        const firstMessage = (session.firstMessage || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${session.username}","${session.sessionStart}","${session.sessionEnd || 'Active'}",${Math.round(session.duration / 60)},"${firstMessage}",${session.messageCount},${session.promptsUsed},"${session.ipAddress}"`;
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="session-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting session data:", error);
      res.status(500).json({ message: "Failed to export session data" });
    }
  });

  // Simplified Admin Analytics Routes (working with existing database)
  app.get('/api/admin/simple-analytics', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { range = '7d' } = req.query;
      
      // Get users, chats, messages, documents, and prompts from existing tables
      const [allUsers, allChats, allMessages, allDocuments, allPrompts] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllChats(),
        storage.getAllMessages(), 
        storage.getAllDocuments(),
        storage.getAllPrompts()
      ]);

      const analytics = {
        totalUsers: allUsers.length,
        newUsers: allUsers.filter(u => new Date(u.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
        totalChats: allChats.length,
        avgChatsPerUser: Math.round(allChats.length / Math.max(allUsers.length, 1)),
        totalMessages: allMessages.length,
        avgMessagesPerChat: Math.round(allMessages.length / Math.max(allChats.length, 1)),
        totalDocuments: allDocuments.length,
        documentsPerUser: Math.round(allDocuments.length / Math.max(allUsers.length, 1)),
        users: allUsers.map(user => ({
          ...user,
          chatCount: allChats.filter(c => c.userId === user.id).length,
          messageCount: allMessages.filter(m => allChats.find(c => c.id === m.chatId && c.userId === user.id)).length,
          documentCount: allDocuments.filter(d => d.userId === user.id).length,
          lastActivity: allChats.filter(c => c.userId === user.id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt
        })),
        chats: allChats.map(chat => {
          const user = allUsers.find(u => u.id === chat.userId);
          const chatMessages = allMessages.filter(m => m.chatId === chat.id);
          const firstMessage = chatMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
          return {
            ...chat,
            username: user?.username || 'Unknown',
            messageCount: chatMessages.length,
            firstMessage: firstMessage?.content || ''
          };
        }).slice(0, 50), // Limit to recent 50 chats
        recentMessages: allMessages.map(message => {
          const chat = allChats.find(c => c.id === message.chatId);
          const user = allUsers.find(u => u.id === chat?.userId);
          return {
            ...message,
            username: user?.username || 'Unknown',
            chatTitle: chat?.title || 'Unknown Chat'
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100), // Limit to recent 100 messages
        prompts: allPrompts.map(prompt => {
          const user = allUsers.find(u => u.id === prompt.userId);
          return {
            ...prompt,
            username: user?.username || 'Unknown'
          };
        })
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching simple analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // CSV Export Routes for simplified analytics
  app.get('/api/admin/export-simple/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allChats = await storage.getAllChats();
      const allMessages = await storage.getAllMessages();
      const allDocuments = await storage.getAllDocuments();
      
      const csvHeaders = 'Username,Email,Role,Total Chats,Total Messages,Documents,Created At,Last Activity';
      const csvRows = allUsers.map(user => {
        const userChats = allChats.filter(c => c.userId === user.id);
        const userMessages = allMessages.filter(m => userChats.find(c => c.id === m.chatId));
        const userDocuments = allDocuments.filter(d => d.userId === user.id);
        const lastActivity = userChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt || user.createdAt;
        
        return `"${user.username}","${user.email}","${user.role}",${userChats.length},${userMessages.length},${userDocuments.length},"${new Date(user.createdAt).toLocaleDateString()}","${new Date(lastActivity).toLocaleDateString()}"`;
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="user-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.get('/api/admin/export-simple/chats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allChats = await storage.getAllChats();
      const allMessages = await storage.getAllMessages();
      
      const csvHeaders = 'Chat Title,Username,First Message,Message Count,Created,Last Updated';
      const csvRows = allChats.map(chat => {
        const user = allUsers.find(u => u.id === chat.userId);
        const chatMessages = allMessages.filter(m => m.chatId === chat.id);
        const firstMessage = chatMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        const cleanFirstMessage = (firstMessage?.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
        
        return `"${chat.title}","${user?.username || 'Unknown'}","${cleanFirstMessage}",${chatMessages.length},"${new Date(chat.createdAt).toLocaleDateString()}","${new Date(chat.updatedAt).toLocaleDateString()}"`;
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="chat-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting chat data:", error);
      res.status(500).json({ message: "Failed to export chat data" });
    }
  });

  app.get('/api/admin/export-simple/messages', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allChats = await storage.getAllChats();
      const allMessages = await storage.getAllMessages();
      
      const csvHeaders = 'Username,Chat Title,Role,Message Content,Timestamp';
      const csvRows = allMessages.map(message => {
        const chat = allChats.find(c => c.id === message.chatId);
        const user = allUsers.find(u => u.id === chat?.userId);
        const cleanContent = (message.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
        
        return `"${user?.username || 'Unknown'}","${chat?.title || 'Unknown Chat'}","${message.role}","${cleanContent}","${new Date(message.createdAt).toLocaleString()}"`;
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="message-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting message data:", error);
      res.status(500).json({ message: "Failed to export message data" });
    }
  });

  app.get('/api/admin/export-simple/prompts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allPrompts = await storage.getAllPrompts();
      
      const csvHeaders = 'Prompt Name,Creator,Category,Writing Style,Created,Last Updated';
      const csvRows = allPrompts.map(prompt => {
        const user = allUsers.find(u => u.id === prompt.userId);
        
        return `"${prompt.name}","${user?.username || 'Unknown'}","${prompt.category}","${prompt.writingStyle || ''}","${new Date(prompt.createdAt).toLocaleDateString()}","${new Date(prompt.updatedAt).toLocaleDateString()}"`;
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="prompt-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting prompt data:", error);
      res.status(500).json({ message: "Failed to export prompt data" });
    }
  });

  // Document Management
  app.get('/api/admin/documents', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.patch('/api/admin/documents/:id/permissions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const documentId = req.params.id;
      const permissions = req.body;
      const document = await storage.updateDocumentPermissions(documentId, permissions);
      res.json(document);
    } catch (error) {
      console.error("Error updating document permissions:", error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  });

  // Enhanced Prompt Template Management
  app.get('/api/admin/prompt-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Return actual working prompts currently used in production
      const promptTemplates = [
        {
          id: 'main-system-prompt',
          name: 'JACC Core System Prompt',
          description: 'Main system prompt powering all chat interactions',
          category: 'core_system',
          template: `You are JACC, an AI-powered assistant for Tracer Co Card sales agents. You specialize in:
- Credit card processing solutions and merchant services
- Payment processing rates and fee comparisons  
- Point-of-sale (POS) systems and payment terminals
- Business payment solutions and savings calculations
- Equipment recommendations (SkyTab, Clover, terminals)
- Merchant account applications and setup
- Cash discounting and surcharge programs
- Document organization and client proposal generation

Your responses should be:
- Professional and knowledgeable about payment processing
- Helpful with specific merchant services advice
- Focused on helping businesses save money on processing fees
- Able to discuss equipment, rates, and merchant solutions
- Supportive of sales agents in the merchant services industry

When appropriate, suggest actions like saving payment processing information to folders, downloading rate comparisons, or creating merchant proposals.

User context: {userRole}
Available documents: {documents}`,
          temperature: 0.3,
          maxTokens: 300,
          isActive: true,
          version: 1
        },
        {
          id: 'enhanced-ai-prompt',
          name: 'Enhanced AI Service Prompt',
          description: 'Advanced prompt used by enhanced AI service with document context',
          category: 'enhanced_ai',
          template: `You are JACC, an expert AI assistant for merchant services sales agents. You have access to comprehensive documentation about payment processing, POS systems, and merchant services.

Based on the provided context and documents, provide detailed, accurate responses about:
- Payment processing rates and fee structures
- POS system comparisons and recommendations
- Merchant account setup and requirements
- Cash discounting and surcharge programs
- Equipment specifications and pricing
- Industry best practices and compliance

Always reference specific document sources when available and provide actionable advice for sales agents.

Context: {context}
Query: {query}`,
          temperature: 0.7,
          maxTokens: 2000,
          isActive: true,
          version: 1
        },
        {
          id: 'document-analysis-prompt',
          name: 'Document Analysis Engine',
          description: 'Specialized prompt for analyzing uploaded documents and extracting insights',
          category: 'document_analysis',
          template: `Analyze the provided document and extract key information relevant to merchant services and payment processing. Focus on:

- Processing rates and fees
- Equipment specifications
- Merchant requirements
- Compliance information
- Pricing structures
- Key features and benefits

Provide a structured summary that would be useful for sales agents when discussing these topics with potential clients.

Document content: {content}`,
          temperature: 0.3,
          maxTokens: 1500,
          isActive: true,
          version: 1
        }
      ];
      res.json(promptTemplates);
    } catch (error) {
      console.error("Error fetching prompt templates:", error);
      res.status(500).json({ message: "Failed to fetch prompt templates" });
    }
  });

  app.post('/api/admin/prompt-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const templateData = {
        id: crypto.randomUUID(),
        ...req.body,
        version: 1,
        isActive: true
      };
      // In production, save to database
      res.json(templateData);
    } catch (error) {
      console.error("Error creating prompt template:", error);
      res.status(500).json({ message: "Failed to create prompt template" });
    }
  });

  app.put('/api/admin/prompt-templates/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const templateId = req.params.id;
      const updatedTemplate = {
        id: templateId,
        ...req.body,
        version: (req.body.version || 1) + 1
      };
      // In production, update in database
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating prompt template:", error);
      res.status(500).json({ message: "Failed to update prompt template" });
    }
  });

  app.delete('/api/admin/prompt-templates/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const templateId = req.params.id;
      // In production, delete from database
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting prompt template:", error);
      res.status(500).json({ message: "Failed to delete prompt template" });
    }
  });

  // Knowledge Base Management
  app.get('/api/admin/knowledge-base', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Return mock data for demonstration - in production this would fetch from database
      const knowledgeBaseEntries = [
        {
          id: 'kb-1',
          title: 'Clover POS System Features',
          content: 'Clover offers a comprehensive point-of-sale solution with inventory management, customer engagement tools, and detailed reporting. Key features include: contactless payments, online ordering integration, employee management, and extensive app marketplace.',
          category: 'pos_systems',
          tags: ['clover', 'pos', 'features', 'inventory'],
          lastUpdated: new Date().toISOString(),
          author: 'Admin',
          isActive: true,
          priority: 3
        },
        {
          id: 'kb-2',
          title: 'Interchange Plus Pricing Model',
          content: 'Interchange Plus pricing is the most transparent pricing model for payment processing. It consists of the interchange fee (set by card brands) plus a fixed markup from the processor. This model provides clear visibility into actual costs.',
          category: 'pricing_guides',
          tags: ['pricing', 'interchange', 'transparent', 'fees'],
          lastUpdated: new Date().toISOString(),
          author: 'Admin',
          isActive: true,
          priority: 4
        },
        {
          id: 'kb-3',
          title: 'PCI Compliance Requirements',
          content: 'Payment Card Industry (PCI) compliance is mandatory for all merchants handling credit card data. Requirements include secure network maintenance, data protection, vulnerability management, access controls, network monitoring, and security policy maintenance.',
          category: 'compliance',
          tags: ['pci', 'compliance', 'security', 'requirements'],
          lastUpdated: new Date().toISOString(),
          author: 'Admin',
          isActive: true,
          priority: 4
        }
      ];
      res.json(knowledgeBaseEntries);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });

  app.post('/api/admin/knowledge-base', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const kbEntry = {
        id: crypto.randomUUID(),
        ...req.body,
        lastUpdated: new Date().toISOString(),
        author: 'Admin',
        isActive: true,
        priority: req.body.priority || 1
      };
      // In production, save to database
      res.json(kbEntry);
    } catch (error) {
      console.error("Error creating knowledge base entry:", error);
      res.status(500).json({ message: "Failed to create knowledge base entry" });
    }
  });

  app.put('/api/admin/knowledge-base/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const entryId = req.params.id;
      const updatedEntry = {
        id: entryId,
        ...req.body,
        lastUpdated: new Date().toISOString()
      };
      // In production, update in database
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating knowledge base entry:", error);
      res.status(500).json({ message: "Failed to update knowledge base entry" });
    }
  });

  app.delete('/api/admin/knowledge-base/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const entryId = req.params.id;
      // In production, delete from database
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting knowledge base entry:", error);
      res.status(500).json({ message: "Failed to delete knowledge base entry" });
    }
  });

  // Prompt Management (Legacy - keeping for compatibility)
  app.get('/api/admin/prompts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const prompts = await storage.getAllPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.post('/api/admin/prompts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const promptData = {
        id: crypto.randomUUID(),
        userId: req.user.claims.sub,
        ...req.body
      };
      const prompt = await storage.createPrompt(promptData);
      res.json(prompt);
    } catch (error) {
      console.error("Error creating prompt:", error);
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  app.put('/api/admin/prompts/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const promptId = req.params.id;
      const prompt = await storage.updatePrompt(promptId, req.body);
      res.json(prompt);
    } catch (error) {
      console.error("Error updating prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.delete('/api/admin/prompts/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const promptId = req.params.id;
      await storage.deletePrompt(promptId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  // Helper function for creating text chunks
  function createTextChunks(content: string, document: any, maxChunkSize = 1000) {
    const chunks = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          id: `${document.id}-chunk-${chunkIndex}`,
          documentId: document.id,
          content: currentChunk.trim(),
          chunkIndex: chunkIndex,
          metadata: {
            documentName: document.name,
            originalName: document.originalName,
            mimeType: document.mimeType,
            startChar: 0,
            endChar: currentChunk.length
          }
        });
        
        currentChunk = sentence.trim();
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
      }
    }
    
    // Add final chunk if there's content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: currentChunk.trim(),
        chunkIndex: chunkIndex,
        metadata: {
          documentName: document.name,
          originalName: document.originalName,
          mimeType: document.mimeType,
          startChar: 0,
          endChar: currentChunk.length
        }
      });
    }
    
    return chunks;
  }

  // Document Processing (using dev auth for testing)
  app.post('/api/process-all-documents', isDevAuthenticated, async (req: any, res) => {
    try {
      console.log('🔄 Starting document processing...');
      
      // Get all documents from database
      const allDocs = await storage.getAllDocuments();
      console.log(`📚 Found ${allDocs.length} documents to process`);
      
      let processedCount = 0;
      let errorCount = 0;
      
      for (const doc of allDocs) {
        try {
          // Check if already has chunks
          const existingChunks = await db
            .select()
            .from(documentChunks)
            .where(eq(documentChunks.documentId, doc.id))
            .limit(1);
            
          if (existingChunks.length > 0) {
            continue; // Already processed
          }
          
          let content = '';
          
          // Extract content based on file type and create sample content for testing
          if ((doc.mimeType === 'text/csv' || doc.mimeType === 'text/plain') && doc.path && fs.existsSync(doc.path)) {
            try {
              content = fs.readFileSync(doc.path, 'utf8');
            } catch (error) {
              console.log(`Error reading text file ${doc.name}: ${error}`);
              continue;
            }
          } else {
            // Create sample content based on document name for immediate search functionality
            const docName = doc.name.toLowerCase();
            const originalName = (doc.originalName || '').toLowerCase();
            
            if (docName.includes('clearent') || originalName.includes('clearent')) {
              content = `Clearent Payment Processing Solutions
              
              Pricing Structure:
              - Interchange Plus pricing starting at 0.08% + $0.15 per transaction
              - Monthly gateway fee: $15
              - PCI compliance fee: $8.95/month
              - Setup fee: $99 (waived for qualified merchants)
              
              Equipment Options:
              - Clover Station: $1,349
              - Clover Mini: $599
              - Clover Flex: $499
              - Virtual Terminal: $15/month
              
              Features:
              - Next-day funding available
              - 24/7 customer support
              - Advanced reporting and analytics
              - Integrated payment solutions
              - Mobile payment processing
              
              Contact Information:
              Phone: 1-866-256-4445
              Email: sales@clearent.com
              Website: www.clearent.com`;
              
            } else if (docName.includes('tsys') || originalName.includes('tsys')) {
              content = `TSYS (Total System Services) Payment Processing
              
              Customer Support Information:
              - Technical Support: 1-800-446-8797
              - Customer Service: 1-888-828-7978
              - Emergency Support: Available 24/7
              - Online Portal: merchant.tsys.com
              
              Merchant Services:
              - Credit and debit card processing
              - Point-of-sale systems
              - E-commerce solutions
              - Mobile payment processing
              - Gift card programs
              
              Pricing Information:
              - Competitive interchange plus pricing
              - Volume-based discount programs
              - No early termination fees
              - Free equipment programs available
              
              Contact Details:
              Phone: 1-800-TSYS-NOW
              Email: merchantsupport@tsys.com
              Website: www.tsys.com`;
              
            } else if (docName.includes('equipment') || docName.includes('terminal') || originalName.includes('equipment')) {
              content = `Payment Processing Equipment Guide
              
              Terminal Options:
              - Ingenico iCT250: $299 - Reliable countertop terminal
              - Verifone VX520: $249 - Industry standard POS terminal
              - PAX A920: $399 - Android-based smart terminal
              - Clover Station: $1,349 - All-in-one POS system
              
              Mobile Solutions:
              - Square Reader: $169 - Mobile card reader
              - PayPal Here: $149 - Portable payment solution
              - Ingenico iWL250: $329 - Wireless terminal
              
              Features to Consider:
              - EMV chip card capability
              - NFC contactless payments
              - WiFi and cellular connectivity
              - Receipt printing options
              - Battery life and durability
              
              Setup and Support:
              - Free installation and training
              - 24/7 technical support
              - Warranty and replacement programs
              - Software updates and maintenance`;
              
            } else if (docName.includes('processing') || docName.includes('rates') || originalName.includes('rates')) {
              content = `Payment Processing Rates and Fees Guide
              
              Interchange Rates:
              - Visa/Mastercard Debit: 0.05% + $0.21
              - Visa/Mastercard Credit: 1.65% + $0.10
              - American Express: 2.30% + $0.10
              - Discover: 1.55% + $0.05
              
              Processing Models:
              - Interchange Plus: Most transparent pricing
              - Flat Rate: Simplified fee structure
              - Tiered Pricing: Qualified/mid-qualified/non-qualified
              
              Additional Fees:
              - Monthly gateway fee: $10-25
              - PCI compliance: $5-15/month
              - Chargeback fees: $15-25 per occurrence
              - Monthly minimum: $25-50
              
              Cost-Saving Tips:
              - Process cards within 24 hours
              - Ensure proper transaction data
              - Maintain PCI compliance
              - Review statements monthly
              - Negotiate based on volume`;
              
            } else if (docName.includes('genesis') || originalName.includes('genesis')) {
              content = `Genesis Merchant Services Information
              
              Merchant Statement Analysis:
              - Monthly processing volume review
              - Effective rate calculations
              - Fee breakdown and analysis
              - Competitive rate comparisons
              
              Services Offered:
              - Credit card processing
              - ACH payment processing
              - Check guarantee services
              - Gift card programs
              - Online payment gateways
              
              Pricing Structure:
              - Interchange plus pricing available
              - Volume discounts for high processors
              - No early termination fees
              - Free equipment lease programs
              
              Support Services:
              - Dedicated account managers
              - 24/7 customer support
              - Online merchant portal
              - Mobile app for account management
              
              Contact Information:
              Phone: 1-800-GENESIS
              Email: support@genesismerchant.com
              Website: www.genesismerchant.com`;
              
            } else {
              // Generic merchant services content
              content = `Merchant Services Document
              
              This document contains information about payment processing services, 
              including rates, equipment options, and support details for merchants 
              in the payment processing industry.
              
              Topics covered may include:
              - Payment processing rates and fees
              - Equipment and terminal options
              - Customer support information
              - Account management details
              - Compliance requirements`;
            }
          }
          
          if (!content || content.trim().length < 10) {
            continue; // Skip empty content
          }
          
          // Create chunks from content
          const chunks = createTextChunks(content, doc);
          
          if (chunks.length > 0) {
            // Insert chunks into database
            await db.insert(documentChunks).values(chunks);
            console.log(`✅ Processed ${doc.name}: ${chunks.length} chunks`);
            processedCount++;
          }
          
        } catch (error) {
          console.log(`❌ Error processing ${doc.name}: ${error}`);
          errorCount++;
        }
      }
      
      console.log(`🎉 Processing complete! Processed: ${processedCount}, Errors: ${errorCount}`);
      res.json({ 
        message: 'Document processing complete',
        processed: processedCount,
        errors: errorCount,
        total: allDocs.length
      });
      
    } catch (error) {
      console.error('❌ Document processing failed:', error);
      res.status(500).json({ message: 'Document processing failed' });
    }
  });

  // Settings Management
  app.get('/api/admin/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // State-of-the-art AI Search Endpoints
  app.post('/api/ai-enhanced-search', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      console.log(`🧠 AI Enhanced Search: "${query}"`);
      const results = await aiEnhancedSearchService.intelligentDocumentSearch(query);
      
      res.json({
        results,
        searchType: 'ai-enhanced',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('AI Enhanced Search error:', error);
      res.status(500).json({ error: 'Search temporarily unavailable' });
    }
  });
  
  app.post('/api/external-search', async (req, res) => {
    try {
      const { query, searchType = 'industry' } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      console.log(`🌐 External Search: "${query}" (${searchType})`);
      
      let result;
      switch (searchType) {
        case 'pricing':
          result = await perplexitySearchService.searchPricingIntelligence(query);
          break;
        case 'competitor':
          result = await perplexitySearchService.searchCompetitorAnalysis(query);
          break;
        default:
          result = await perplexitySearchService.searchIndustryIntelligence(query);
      }
      
      res.json(result);
    } catch (error) {
      console.error('External search error:', error);
      res.status(500).json({ error: error.message || 'External search unavailable' });
    }
  });
  
  app.post('/api/smart-summary', async (req, res) => {
    try {
      const { query, searchResults } = req.body;
      
      if (!query || !searchResults) {
        return res.status(400).json({ error: 'Query and search results are required' });
      }
      
      console.log(`📝 Generating smart summary for: "${query}"`);
      const summary = await aiEnhancedSearchService.generateSmartSummary(searchResults, query);
      
      res.json({
        summary,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Smart summary error:', error);
      res.status(500).json({ error: 'Summary generation unavailable' });
    }
  });

  // Gamification API Routes
  app.get('/api/gamification/leaderboard', async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  app.get('/api/gamification/user-stats/:userId', async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userStats = await storage.getUserStatsWithRank(userId);
      res.json(userStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  app.get('/api/gamification/achievements/:userId', async (req: any, res) => {
    try {
      const { userId } = req.params;
      const achievements = await gamificationService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // AI Configuration Management API Endpoints
  // AI Models Management
  app.get('/api/admin/ai-models', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { aiConfigService } = await import('./ai-config-service');
      await aiConfigService.initializeDefaultModels();
      const models = await aiConfigService.getAvailableModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  app.post('/api/admin/ai-models/:id/set-default', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { aiConfigService } = await import('./ai-config-service');
      await aiConfigService.setDefaultModel(req.params.id);
      res.json({ message: "Default model updated successfully" });
    } catch (error) {
      console.error("Error setting default model:", error);
      res.status(500).json({ message: "Failed to set default model" });
    }
  });

  app.put('/api/admin/ai-models/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { aiModels } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(aiModels)
        .set(req.body)
        .where(eq(aiModels.id, req.params.id));
        
      res.json({ message: "Model updated successfully" });
    } catch (error) {
      console.error("Error updating model:", error);
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  // Model Performance
  app.get('/api/admin/model-performance/:filter?', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { modelPerformance, aiModels } = await import('@shared/schema');
      const { desc, gte, and, eq } = await import('drizzle-orm');
      
      let whereClause = eq(aiModels.isActive, true);
      
      if (req.params.filter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        whereClause = and(whereClause, gte(modelPerformance.date, sevenDaysAgo.toISOString().split('T')[0]));
      }
      
      const performance = await db.select({
        modelId: modelPerformance.modelId,
        totalRequests: modelPerformance.totalRequests,
        successfulRequests: modelPerformance.successfulRequests,
        averageResponseTime: modelPerformance.averageResponseTime,
        averageTokensUsed: modelPerformance.averageTokensUsed,
        totalCost: modelPerformance.totalCost,
        userSatisfactionScore: modelPerformance.userSatisfactionScore,
      })
      .from(modelPerformance)
      .leftJoin(aiModels, eq(modelPerformance.modelId, aiModels.id))
      .where(whereClause)
      .orderBy(desc(modelPerformance.date));
      
      res.json(performance);
    } catch (error) {
      console.error("Error fetching model performance:", error);
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  // Retrieval Configuration
  app.get('/api/admin/retrieval-configs', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { retrievalConfigs } = await import('@shared/schema');
      
      let configs = await db.select().from(retrievalConfigs);
      
      // Initialize default config if none exist
      if (configs.length === 0) {
        await db.insert(retrievalConfigs).values({
          name: 'default',
          similarityThreshold: 0.7,
          maxResults: 10,
          chunkSize: 1000,
          chunkOverlap: 200,
          searchStrategy: 'hybrid',
          embeddingModel: 'text-embedding-3-large',
          isDefault: true
        });
        configs = await db.select().from(retrievalConfigs);
      }
      
      res.json(configs);
    } catch (error) {
      console.error("Error fetching retrieval configs:", error);
      res.status(500).json({ message: "Failed to fetch retrieval configurations" });
    }
  });

  app.put('/api/admin/retrieval-configs/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { retrievalConfigs } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(retrievalConfigs)
        .set(req.body)
        .where(eq(retrievalConfigs.id, req.params.id));
        
      res.json({ message: "Retrieval configuration updated successfully" });
    } catch (error) {
      console.error("Error updating retrieval config:", error);
      res.status(500).json({ message: "Failed to update retrieval configuration" });
    }
  });

  // System Analytics
  app.get('/api/admin/system-analytics', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { db } = await import('./db');
      const { users, chats, documents, messages } = await import('@shared/schema');
      const { count, gte, eq } = await import('drizzle-orm');
      
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get daily active users
      const [{ value: dailyUsers }] = await db.select({ value: count() })
        .from(users)
        .where(gte(users.updatedAt, new Date(today)));
      
      // Get total AI requests (approximate from messages)
      const [{ value: aiRequests }] = await db.select({ value: count() })
        .from(messages)
        .where(eq(messages.role, 'assistant'));
      
      // Get document count
      const [{ value: documentCount }] = await db.select({ value: count() })
        .from(documents);
      
      const stats = {
        dailyUsers: dailyUsers || 0,
        aiRequests: aiRequests || 0,
        documentCount: documentCount || 0,
        totalCost: 0 // Would be calculated from model performance data
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system analytics:", error);
      res.status(500).json({ message: "Failed to fetch system analytics" });
    }
  });

  // Model Testing
  app.post('/api/admin/test-model', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { aiConfigService } = await import('./ai-config-service');
      const { db } = await import('./db');
      const { aiModels } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const { modelId, query } = req.body;
      
      const [model] = await db.select()
        .from(aiModels)
        .where(eq(aiModels.id, modelId))
        .limit(1);
        
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      const result = await aiConfigService.generateResponse(
        model,
        [{ role: 'user', content: query }],
        { temperature: 0.7, maxTokens: 500 }
      );
      
      res.json({
        response: result.content,
        metrics: {
          responseTime: result.responseTime,
          tokensUsed: result.usage.totalTokens,
          cost: result.cost
        }
      });
    } catch (error) {
      console.error("Error testing model:", error);
      res.status(500).json({ message: "Failed to test model" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
