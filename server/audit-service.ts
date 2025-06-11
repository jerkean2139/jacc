import { db } from './storage';
import { auditLogs } from '../shared/schema';

export interface AuditEvent {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditService {
  /**
   * Log security-relevant events for compliance and monitoring
   */
  static async logEvent(event: AuditEvent): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: event.userId || null,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId || null,
        details: event.details ? JSON.stringify(event.details) : null,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        severity: event.severity,
        timestamp: new Date()
      });

      // Also log to console for immediate monitoring
      const logLevel = this.getLogLevel(event.severity);
      console[logLevel](`🔍 AUDIT: ${event.action} on ${event.resource}`, {
        userId: event.userId,
        resourceId: event.resourceId,
        severity: event.severity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(
    action: 'login' | 'logout' | 'login_failed' | 'mfa_enabled' | 'mfa_disabled' | 'password_changed',
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    const severity = action === 'login_failed' ? 'high' : 'medium';
    
    await this.logEvent({
      userId,
      action,
      resource: 'authentication',
      details,
      ipAddress,
      userAgent,
      severity
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    action: 'read' | 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    userId?: string,
    ipAddress?: string,
    details?: any
  ): Promise<void> {
    const severity = action === 'delete' ? 'high' : 'medium';
    
    await this.logEvent({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      details,
      ipAddress,
      severity
    });
  }

  /**
   * Log security events
   */
  static async logSecurity(
    action: 'rate_limit_exceeded' | 'unauthorized_access' | 'suspicious_activity' | 'security_violation',
    resource: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      severity: 'critical'
    });
  }

  /**
   * Log administrative actions
   */
  static async logAdmin(
    action: string,
    resource: string,
    userId: string,
    ipAddress?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: `admin_${action}`,
      resource,
      details,
      ipAddress,
      severity: 'high'
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      let query = db.select().from(auditLogs);

      // Apply filters
      const conditions: any[] = [];
      
      if (filters.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId));
      }
      
      if (filters.action) {
        conditions.push(eq(auditLogs.action, filters.action));
      }
      
      if (filters.resource) {
        conditions.push(eq(auditLogs.resource, filters.resource));
      }
      
      if (filters.severity) {
        conditions.push(eq(auditLogs.severity, filters.severity));
      }
      
      if (filters.startDate) {
        conditions.push(gte(auditLogs.timestamp, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(auditLogs.timestamp, filters.endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(desc(auditLogs.timestamp));
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  /**
   * Generate security compliance report
   */
  static async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const logs = await this.getAuditLogs({ startDate, endDate });
      
      const report = {
        period: { start: startDate, end: endDate },
        totalEvents: logs.length,
        eventsByType: this.groupBy(logs, 'action'),
        eventsBySeverity: this.groupBy(logs, 'severity'),
        securityIncidents: logs.filter(log => log.severity === 'critical').length,
        authenticationEvents: logs.filter(log => log.resource === 'authentication').length,
        dataAccessEvents: logs.filter(log => log.action.startsWith('data_')).length,
        adminActions: logs.filter(log => log.action.startsWith('admin_')).length,
        uniqueUsers: new Set(logs.filter(log => log.userId).map(log => log.userId)).size,
        topUsers: this.getTopUsers(logs),
        suspiciousActivity: this.detectSuspiciousActivity(logs)
      };

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  /**
   * Helper method to get appropriate log level
   */
  private static getLogLevel(severity: string): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'log';
    }
  }

  /**
   * Helper method to group array by property
   */
  private static groupBy(array: any[], property: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get most active users for compliance reporting
   */
  private static getTopUsers(logs: any[]): Array<{ userId: string; eventCount: number }> {
    const userCounts = this.groupBy(logs.filter(log => log.userId), 'userId');
    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, eventCount: count as number }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
  }

  /**
   * Detect suspicious activity patterns
   */
  private static detectSuspiciousActivity(logs: any[]): any[] {
    const suspicious: any[] = [];

    // Multiple failed login attempts from same IP
    const failedLogins = logs.filter(log => log.action === 'login_failed');
    const failedByIP = this.groupBy(failedLogins, 'ipAddress');
    
    Object.entries(failedByIP).forEach(([ip, count]) => {
      if (count as number > 5) {
        suspicious.push({
          type: 'multiple_failed_logins',
          ipAddress: ip,
          count,
          severity: 'high'
        });
      }
    });

    // Unusual access patterns (many requests in short time)
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return logTime > oneHourAgo;
    });

    const recentByUser = this.groupBy(recentLogs.filter(log => log.userId), 'userId');
    Object.entries(recentByUser).forEach(([userId, count]) => {
      if (count as number > 100) {
        suspicious.push({
          type: 'high_activity_volume',
          userId,
          count,
          severity: 'medium'
        });
      }
    });

    return suspicious;
  }
}

// Helper functions for database queries
function eq(column: any, value: any) {
  return { column, operator: '=', value };
}

function and(...conditions: any[]) {
  return { type: 'and', conditions };
}

function gte(column: any, value: any) {
  return { column, operator: '>=', value };
}

function lte(column: any, value: any) {
  return { column, operator: '<=', value };
}

function desc(column: any) {
  return { column, direction: 'desc' };
}