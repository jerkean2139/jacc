import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';
import { storage } from './storage';

// Extend session type for ISO Hub integration
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isoHubToken?: string;
  }
}

export interface ISOHubUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
}

export interface ISOHubAuthResponse {
  message: string;
  user: ISOHubUser;
  roles: string[];
  permissions: string[];
  token: string;
}

export class ISOHubAuthService {
  private readonly baseUrl = 'https://iso-hub-server-1.keanonbiz.replit.dev/api';

  async verifyISOHubToken(token: string): Promise<ISOHubUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`ISO Hub token verification failed: ${response.status}`);
        return null;
      }

      const userData = await response.json() as ISOHubUser;
      return userData;
    } catch (error) {
      console.error('Error verifying ISO Hub token:', error);
      return null;
    }
  }

  async getUserPermissions(userId: number, token: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/permissions/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return [];
      }

      const permissions = await response.json();
      return Array.isArray(permissions) ? permissions : [];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  async syncUserToJACC(isoHubUser: ISOHubUser, token: string): Promise<User> {
    // Check if user already exists in JACC
    const existingUser = await storage.getUserByEmail(isoHubUser.email);
    
    if (existingUser) {
      // Update existing user with latest ISO Hub data
      const updatedUser = await storage.updateUser(existingUser.id, {
        firstName: isoHubUser.first_name,
        lastName: isoHubUser.last_name,
        email: isoHubUser.email,
        isoHubId: isoHubUser.id.toString(),
        isoHubToken: token,
        role: this.mapRoleFromISOHub(isoHubUser.role_id)
      });
      return updatedUser;
    } else {
      // Create new user in JACC
      const newUser = await storage.createUser({
        username: isoHubUser.email,
        email: isoHubUser.email,
        firstName: isoHubUser.first_name,
        lastName: isoHubUser.last_name,
        passwordHash: '', // No password needed for ISO Hub users
        isoHubId: isoHubUser.id.toString(),
        isoHubToken: token,
        role: this.mapRoleFromISOHub(isoHubUser.role_id),
        isActive: true
      });
      return newUser;
    }
  }

  private mapRoleFromISOHub(roleId: number): string {
    // Map ISO Hub role IDs to JACC roles
    switch (roleId) {
      case 1:
        return 'admin';
      case 2:
        return 'manager';
      case 3:
        return 'agent';
      default:
        return 'user';
    }
  }

  async loginWithISOHubCredentials(email: string, password: string): Promise<ISOHubAuthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        return null;
      }

      const authData = await response.json() as ISOHubAuthResponse;
      return authData;
    } catch (error) {
      console.error('Error logging in with ISO Hub:', error);
      return null;
    }
  }
}

export const isoHubAuthService = new ISOHubAuthService();

// Middleware to handle ISO Hub authentication
export const isoHubAuthMiddleware = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Check for ISO Hub token in various places
    const authHeader = req.headers.authorization;
    const urlToken = req.query.auth_token;
    const bodyToken = req.body?.iso_hub_token;
    
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (urlToken) {
      token = urlToken as string;
    } else if (bodyToken) {
      token = bodyToken as string;
    }

    if (!token) {
      return next(); // No ISO Hub token, continue with regular auth
    }

    // Verify token with ISO Hub
    const isoHubUser = await isoHubAuthService.verifyISOHubToken(token);
    
    if (!isoHubUser) {
      return res.status(401).json({ 
        message: 'Invalid ISO Hub token',
        error: 'TOKEN_VERIFICATION_FAILED'
      });
    }

    // Sync user to JACC and create session
    const jaccUser = await isoHubAuthService.syncUserToJACC(isoHubUser, token);
    
    // Set user in request for downstream middleware
    req.user = jaccUser;
    req.isoHubUser = isoHubUser;
    req.isoHubToken = token;
    
    next();
  } catch (error) {
    console.error('ISO Hub auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

// Express route handler for ISO Hub SSO
export const handleISOHubSSO = async (req: Request, res: Response) => {
  try {
    const { token, redirect_url } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        message: 'ISO Hub token required',
        error: 'MISSING_TOKEN'
      });
    }

    const isoHubUser = await isoHubAuthService.verifyISOHubToken(token);
    
    if (!isoHubUser) {
      return res.status(401).json({ 
        message: 'Invalid ISO Hub token',
        error: 'INVALID_TOKEN'
      });
    }

    const jaccUser = await isoHubAuthService.syncUserToJACC(isoHubUser, token);
    
    // Create JACC session
    if (req.session) {
      (req.session as any).userId = jaccUser.id;
      (req.session as any).isoHubToken = token;
    }

    res.json({
      message: 'SSO login successful',
      user: {
        id: jaccUser.id,
        email: jaccUser.email,
        firstName: jaccUser.firstName,
        lastName: jaccUser.lastName,
        role: jaccUser.role
      },
      redirect_url: redirect_url || '/'
    });
  } catch (error) {
    console.error('ISO Hub SSO error:', error);
    res.status(500).json({ 
      message: 'SSO login failed',
      error: 'SSO_ERROR'
    });
  }
};