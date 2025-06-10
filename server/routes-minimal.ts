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

  // Support multiple login endpoints
  app.post('/api/auth/simple-login', handleLogin);
  app.post('/api/login', handleLogin);

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