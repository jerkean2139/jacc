import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { setupDevAuth } from "./dev-auth";
import cookieParser from "cookie-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🔄 Setting up minimal routes for debugging...");

  // Add cookie parser middleware
  app.use(cookieParser());

  // Setup basic authentication
  setupAuth(app);
  setupDevAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Multiple login endpoints to support different frontend forms
  const handleLogin = async (req, res) => {
    try {
      const { username, password, email } = req.body;
      const loginField = username || email;
      
      // Define demo users
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
  };

  // Session storage for logged in users
  const sessions = new Map();

  // Enhanced login with session management
  const handleLoginWithSession = async (req, res) => {
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
          secure: false, // Set to true in production
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
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
  };

  // User session endpoint
  app.get('/api/user', (req, res) => {
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
  app.post('/api/logout', (req, res) => {
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

  // Support multiple login endpoints
  app.post('/api/auth/simple-login', handleLoginWithSession);
  app.post('/api/login', handleLoginWithSession);

  // Basic chat endpoint
  app.post('/api/chat', async (req, res) => {
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

  console.log("✅ Minimal routes registered successfully");
  
  const server = createServer(app);
  return server;
}