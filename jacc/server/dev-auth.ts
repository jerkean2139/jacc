// Simple development authentication
import session from 'express-session';
import type { Express } from 'express';

export function setupDevAuth(app: Express) {
  // Simple in-memory session for development
  app.use(session({
    secret: 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

export function isDevAuthenticated(req: any, res: any, next: any) {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
}