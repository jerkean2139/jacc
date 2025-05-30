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
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertMessageSchema, insertChatSchema, insertFolderSchema, insertDocumentSchema, insertAdminSettingsSchema, faqKnowledgeBase } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { setupOAuthHelper } from "./oauth-helper";
import { zipProcessor } from "./zip-processor";

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
      
      const chat = await storage.createChat(chatData);
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
      
      // Generate AI response using enhanced prompt chaining
      const chatHistory = await storage.getChatMessages(chatId);
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
      
      // Use new prompt chaining system with smart routing
      let aiResponse;
      try {
        aiResponse = await enhancedAIService.generateChainedResponse(
          messageData.content,
          messages.slice(0, -1), // Exclude the just-added user message
          userId
        );
      } catch (error) {
        console.error("Enhanced AI failed, using direct AI:", error);
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

  // Document search endpoint
  app.get('/api/documents/search', async (req: any, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const results = await enhancedAIService.searchDocuments(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
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
      
      const fs = require('fs');
      const path = require('path');
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
      
      // Simple text search in document names and content
      const searchResults = documents.filter(doc => 
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(query.toLowerCase())
      ).map(doc => ({
        id: doc.id,
        score: 0.8,
        documentId: doc.id,
        content: `Document: ${doc.name}`,
        metadata: {
          documentName: doc.name,
          webViewLink: `/documents/${doc.id}`,
          chunkIndex: 0,
          mimeType: doc.mimeType
        }
      }));
      
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
      const userId = req.user.id;
      const { gamificationService } = await import('./gamification');
      const stats = await gamificationService.getUserStats(userId);
      
      if (!stats) {
        // Initialize stats for new user
        const newStats = await gamificationService.initializeUserStats(userId);
        return res.json(newStats);
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

  const httpServer = createServer(app);
  return httpServer;
}
