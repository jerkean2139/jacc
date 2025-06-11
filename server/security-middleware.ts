import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Enhanced security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://replit.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.perplexity.ai", "wss:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Enhanced rate limiting for different endpoints
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000),
        message: message || 'Too many requests from this IP'
      });
    }
  });
};

// Different rate limits for different endpoint types
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'API rate limit exceeded');
export const aiRateLimit = createRateLimit(60 * 1000, 10, 'AI request rate limit exceeded');
export const uploadRateLimit = createRateLimit(60 * 60 * 1000, 20, 'Upload rate limit exceeded');

// Input validation and sanitization middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Enhanced CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Replit domains and localhost for development
    const allowedOrigins = [
      /\.replit\.dev$/,
      /\.replit\.app$/,
      'http://localhost:3000',
      'http://localhost:5000',
      'https://localhost:3000',
      'https://localhost:5000'
    ];
    
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return origin === pattern;
      }
      return pattern.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log security-relevant events
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log failed authentication attempts
    if (res.statusCode === 401) {
      console.warn(`🔐 Authentication failed: ${req.method} ${req.path} from ${req.ip} - ${responseTime}ms`);
    }
    
    // Log rate limit violations
    if (res.statusCode === 429) {
      console.warn(`🚫 Rate limit exceeded: ${req.method} ${req.path} from ${req.ip} - ${responseTime}ms`);
    }
    
    // Log server errors that might indicate attacks
    if (res.statusCode >= 500) {
      console.error(`🚨 Server error: ${req.method} ${req.path} from ${req.ip} - ${res.statusCode} - ${responseTime}ms`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key format (basic validation)
  if (typeof apiKey !== 'string' || apiKey.length < 32) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }
  
  // TODO: Implement actual API key validation against database
  // For now, accept any properly formatted key
  next();
};

// Request size limiting middleware
export const requestSizeLimit = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let size = 0;
    
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        res.status(413).json({ error: 'Request entity too large' });
        return;
      }
    });
    
    next();
  };
};