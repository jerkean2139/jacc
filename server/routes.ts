import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupDevAuth, isDevAuthenticated } from "./dev-auth";
import { generateChatResponse, analyzeDocument, generateTitle } from "./openai";
import { enhancedAIService } from "./enhanced-ai";
import { googleDriveService } from "./google-drive";
import { supabaseVectorService } from "./supabase-vector";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertMessageSchema, insertChatSchema, insertFolderSchema, insertDocumentSchema, insertAdminSettingsSchema } from "@shared/schema";
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/zip';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, XLS, images, and ZIP files are allowed"));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup development auth first for simple session management
  if (true) {
    setupDevAuth(app);
  }
  
  // Auth middleware
  await setupAuth(app);
  
  // Setup OAuth helper for Google Drive credentials
  setupOAuthHelper(app);

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
        
        // Set session manually
        // Properly set session
        (req.session as any).user = {
          claims: { sub: 'dev-admin-001' },
          access_token: 'dev-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
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
        
        // Properly set session
        (req.session as any).user = {
          claims: { sub: 'dev-client-admin-001' },
          access_token: 'dev-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
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
      
      // Generate AI response
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
      
      // Use enhanced AI service with Google Drive document context
      const aiResponse = await enhancedAIService.generateResponseWithDocuments(messages, context);
      
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

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', isAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const results = [];
      const errors = [];

      for (const file of files) {
        try {
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
            // Process regular file
            const documentData = insertDocumentSchema.parse({
              name: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
              userId,
              folderId: req.body.folderId || null
            });
            
            const document = await storage.createDocument(documentData);

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

      // Initialize vector store index if needed
      await vectorStoreService.ensureIndexExists();
      
      // Scan and process documents
      const documents = await googleDriveService.scanAndProcessFolder(
        process.env.GOOGLE_DRIVE_FOLDER_ID
      );
      
      let indexedCount = 0;
      const results = [];
      
      for (const doc of documents) {
        try {
          await vectorStoreService.indexDocument(doc);
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

  app.get('/api/drive/search', isAuthenticated, async (req: any, res) => {
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
