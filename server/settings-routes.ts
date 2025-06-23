import { Express, Request, Response } from 'express';

// Settings storage interface for backend persistence
interface SystemSettings {
  // AI & Search Configuration
  primaryModel: string;
  fallbackModel: string;
  responseStyle: string;
  searchSensitivity: number;
  searchOrder: string[];
  
  // User Management
  defaultRole: string;
  sessionTimeout: number;
  mfaRequired: boolean;
  allowGuestAccess: boolean;
  notificationFrequency: string;
  
  // Content & Document Processing
  ocrQuality: string;
  autoCategorizationEnabled: boolean;
  textChunkSize: number;
  retentionPolicyDays: number;
  
  // System Performance
  responseTimeout: number;
  cacheExpirationTime: number;
  memoryOptimization: string;
  maxConcurrentRequests: number;
  
  // AI Prompts
  systemPrompts: {
    documentSearch: string;
    responseFormatting: string;
    errorHandling: string;
  };
  personalityStyle: string;
  responseTone: string;
  expertiseLevel: number;
  userSpecificOverrides: Record<string, any>;
}

// In-memory settings storage (in production, this would be in database)
let systemSettings: SystemSettings = {
  // AI & Search Configuration defaults
  primaryModel: 'claude-sonnet-4-20250514',
  fallbackModel: 'gpt-4o',
  responseStyle: 'professional-helpful',
  searchSensitivity: 0.75,
  searchOrder: ['faq', 'documents', 'web'],
  
  // User Management defaults
  defaultRole: 'sales-agent',
  sessionTimeout: 30,
  mfaRequired: false,
  allowGuestAccess: true,
  notificationFrequency: 'weekly',
  
  // Content & Document Processing defaults
  ocrQuality: 'high',
  autoCategorizationEnabled: true,
  textChunkSize: 800,
  retentionPolicyDays: 90,
  
  // System Performance defaults
  responseTimeout: 30,
  cacheExpirationTime: 60,
  memoryOptimization: 'balanced',
  maxConcurrentRequests: 10,
  
  // AI Prompts defaults
  systemPrompts: {
    documentSearch: 'You are JACC, an AI assistant for merchant services. Search FAQ first, then documents, then web as fallback...',
    responseFormatting: 'Format responses using HTML: <h1>, <h2> for headings, <ul><li> for lists, <p> for paragraphs...',
    errorHandling: 'When information is not found in JACC Memory, clearly state limitations and offer web search...'
  },
  personalityStyle: 'professional-helpful',
  responseTone: 'balanced',
  expertiseLevel: 7,
  userSpecificOverrides: {}
};

export function registerSettingsRoutes(app: Express) {
  
  // Get all system settings
  app.get('/api/admin/settings', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        settings: systemSettings
      });
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch settings' 
      });
    }
  });

  // Update specific setting category
  app.patch('/api/admin/settings/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const updates = req.body;
      
      switch (category) {
        case 'ai-search':
          systemSettings.primaryModel = updates.primaryModel || systemSettings.primaryModel;
          systemSettings.fallbackModel = updates.fallbackModel || systemSettings.fallbackModel;
          systemSettings.responseStyle = updates.responseStyle || systemSettings.responseStyle;
          systemSettings.searchSensitivity = updates.searchSensitivity ?? systemSettings.searchSensitivity;
          systemSettings.searchOrder = updates.searchOrder || systemSettings.searchOrder;
          break;
          
        case 'user-management':
          systemSettings.defaultRole = updates.defaultRole || systemSettings.defaultRole;
          systemSettings.sessionTimeout = updates.sessionTimeout ?? systemSettings.sessionTimeout;
          systemSettings.mfaRequired = updates.mfaRequired ?? systemSettings.mfaRequired;
          systemSettings.allowGuestAccess = updates.allowGuestAccess ?? systemSettings.allowGuestAccess;
          systemSettings.notificationFrequency = updates.notificationFrequency || systemSettings.notificationFrequency;
          break;
          
        case 'content-processing':
          systemSettings.ocrQuality = updates.ocrQuality || systemSettings.ocrQuality;
          systemSettings.autoCategorizationEnabled = updates.autoCategorizationEnabled ?? systemSettings.autoCategorizationEnabled;
          systemSettings.textChunkSize = updates.textChunkSize ?? systemSettings.textChunkSize;
          systemSettings.retentionPolicyDays = updates.retentionPolicyDays ?? systemSettings.retentionPolicyDays;
          break;
          
        case 'performance':
          systemSettings.responseTimeout = updates.responseTimeout ?? systemSettings.responseTimeout;
          systemSettings.cacheExpirationTime = updates.cacheExpirationTime ?? systemSettings.cacheExpirationTime;
          systemSettings.memoryOptimization = updates.memoryOptimization || systemSettings.memoryOptimization;
          systemSettings.maxConcurrentRequests = updates.maxConcurrentRequests ?? systemSettings.maxConcurrentRequests;
          break;
          
        case 'ai-prompts':
          if (updates.systemPrompts) {
            systemSettings.systemPrompts = { ...systemSettings.systemPrompts, ...updates.systemPrompts };
          }
          systemSettings.personalityStyle = updates.personalityStyle || systemSettings.personalityStyle;
          systemSettings.responseTone = updates.responseTone || systemSettings.responseTone;
          systemSettings.expertiseLevel = updates.expertiseLevel ?? systemSettings.expertiseLevel;
          if (updates.userSpecificOverrides) {
            systemSettings.userSpecificOverrides = { ...systemSettings.userSpecificOverrides, ...updates.userSpecificOverrides };
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid settings category'
          });
      }
      
      res.json({
        success: true,
        message: `${category} settings updated successfully`,
        settings: systemSettings
      });
      
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update settings' 
      });
    }
  });

  // Reset settings to defaults
  app.post('/api/admin/settings/reset', async (req: Request, res: Response) => {
    try {
      const { category } = req.body;
      
      if (category === 'all') {
        // Reset all settings to defaults
        systemSettings = {
          primaryModel: 'claude-sonnet-4-20250514',
          fallbackModel: 'gpt-4o',
          responseStyle: 'professional-helpful',
          searchSensitivity: 0.75,
          searchOrder: ['faq', 'documents', 'web'],
          defaultRole: 'sales-agent',
          sessionTimeout: 30,
          mfaRequired: false,
          allowGuestAccess: true,
          notificationFrequency: 'weekly',
          ocrQuality: 'high',
          autoCategorizationEnabled: true,
          textChunkSize: 800,
          retentionPolicyDays: 90,
          responseTimeout: 30,
          cacheExpirationTime: 60,
          memoryOptimization: 'balanced',
          maxConcurrentRequests: 10,
          systemPrompts: {
            documentSearch: 'You are JACC, an AI assistant for merchant services. Search FAQ first, then documents, then web as fallback...',
            responseFormatting: 'Format responses using HTML: <h1>, <h2> for headings, <ul><li> for lists, <p> for paragraphs...',
            errorHandling: 'When information is not found in JACC Memory, clearly state limitations and offer web search...'
          },
          personalityStyle: 'professional-helpful',
          responseTone: 'balanced',
          expertiseLevel: 7,
          userSpecificOverrides: {}
        };
      }
      
      res.json({
        success: true,
        message: 'Settings reset to defaults',
        settings: systemSettings
      });
      
    } catch (error) {
      console.error('Settings reset error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to reset settings' 
      });
    }
  });

  // Get current system status for performance monitoring
  app.get('/api/admin/settings/status', async (req: Request, res: Response) => {
    try {
      // Real-time system metrics (in production, these would come from monitoring services)
      const systemStatus = {
        memoryUsage: Math.floor(Math.random() * 30) + 70, // 70-100%
        cacheHitRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        averageResponseTime: (Math.random() * 1000 + 500).toFixed(0), // 500-1500ms
        activeUsers: Math.floor(Math.random() * 20) + 5, // 5-25 users
        uptime: '99.8%',
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        status: systemStatus
      });
      
    } catch (error) {
      console.error('Status fetch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch system status' 
      });
    }
  });
}