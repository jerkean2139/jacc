import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { setupDevAuth } from "./dev-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🔄 Setting up minimal routes for debugging...");

  // Setup basic authentication
  setupAuth(app);
  setupDevAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Simple authentication endpoint
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === 'demo' && password === 'demo') {
        res.json({
          success: true,
          user: {
            id: 'demo-user',
            username: 'demo',
            role: 'sales-agent'
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

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