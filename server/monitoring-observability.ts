export interface SystemMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  requestCount: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
}

export interface AIModelMetrics {
  modelId: string;
  requestCount: number;
  totalTokens: number;
  averageLatency: number;
  errorCount: number;
  successRate: number;
  costEstimate: number;
  lastUsed: number;
}

export interface SearchPerformanceMetrics {
  searchType: 'vector' | 'keyword' | 'hybrid' | 'ai_enhanced';
  queryCount: number;
  averageLatency: number;
  averageRelevanceScore: number;
  cacheHitRate: number;
  failureRate: number;
  userSatisfactionScore: number;
}

export interface UserBehaviorMetrics {
  userId: string;
  sessionDuration: number;
  queriesPerSession: number;
  documentsAccessed: number;
  featureUsage: Record<string, number>;
  satisfactionRating: number;
  conversionEvents: string[];
}

export class MonitoringService {
  private systemMetrics: SystemMetrics[] = [];
  private aiModelMetrics: Map<string, AIModelMetrics> = new Map();
  private searchMetrics: Map<string, SearchPerformanceMetrics> = new Map();
  private userMetrics: Map<string, UserBehaviorMetrics> = new Map();
  private alertThresholds: Record<string, number> = {
    responseTime: 2000,
    errorRate: 0.05,
    memoryUsage: 0.85,
    cpuUsage: 0.80
  };

  constructor() {
    this.initializeMetricsCollection();
  }

  private initializeMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  async collectSystemMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: Date.now(),
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        requestCount: this.getRequestCount(),
        responseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate(),
        activeUsers: this.getActiveUserCount()
      };

      this.systemMetrics.push(metrics);
      
      // Check for alerts
      await this.checkAlerts(metrics);
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  async trackAIModelUsage(
    modelId: string,
    tokens: number,
    latency: number,
    success: boolean,
    cost?: number
  ): Promise<void> {
    const existing = this.aiModelMetrics.get(modelId) || {
      modelId,
      requestCount: 0,
      totalTokens: 0,
      averageLatency: 0,
      errorCount: 0,
      successRate: 1,
      costEstimate: 0,
      lastUsed: 0
    };

    existing.requestCount++;
    existing.totalTokens += tokens;
    existing.averageLatency = (existing.averageLatency + latency) / 2;
    existing.lastUsed = Date.now();
    
    if (!success) {
      existing.errorCount++;
    }
    
    existing.successRate = (existing.requestCount - existing.errorCount) / existing.requestCount;
    
    if (cost) {
      existing.costEstimate += cost;
    }

    this.aiModelMetrics.set(modelId, existing);
  }

  async trackSearchPerformance(
    searchType: 'vector' | 'keyword' | 'hybrid' | 'ai_enhanced',
    latency: number,
    relevanceScore: number,
    cacheHit: boolean,
    success: boolean,
    userSatisfaction?: number
  ): Promise<void> {
    const key = searchType;
    const existing = this.searchMetrics.get(key) || {
      searchType,
      queryCount: 0,
      averageLatency: 0,
      averageRelevanceScore: 0,
      cacheHitRate: 0,
      failureRate: 0,
      userSatisfactionScore: 0
    };

    existing.queryCount++;
    existing.averageLatency = (existing.averageLatency + latency) / 2;
    existing.averageRelevanceScore = (existing.averageRelevanceScore + relevanceScore) / 2;
    
    if (cacheHit) {
      existing.cacheHitRate = (existing.cacheHitRate + 1) / 2;
    }
    
    if (!success) {
      existing.failureRate = (existing.failureRate + 1) / 2;
    }
    
    if (userSatisfaction) {
      existing.userSatisfactionScore = (existing.userSatisfactionScore + userSatisfaction) / 2;
    }

    this.searchMetrics.set(key, existing);
  }

  async trackUserBehavior(
    userId: string,
    sessionData: Partial<UserBehaviorMetrics>
  ): Promise<void> {
    const existing = this.userMetrics.get(userId) || {
      userId,
      sessionDuration: 0,
      queriesPerSession: 0,
      documentsAccessed: 0,
      featureUsage: {},
      satisfactionRating: 0,
      conversionEvents: []
    };

    // Merge session data
    Object.assign(existing, sessionData);
    this.userMetrics.set(userId, existing);
  }

  private async getCPUUsage(): Promise<number> {
    try {
      // Simplified CPU usage estimation
      const start = process.hrtime();
      await new Promise(resolve => setImmediate(resolve));
      const end = process.hrtime(start);
      return Math.min((end[0] * 1000 + end[1] / 1000000) / 10, 1);
    } catch {
      return 0.1; // Default low usage
    }
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed / usage.heapTotal;
  }

  private getRequestCount(): number {
    // This would typically come from request middleware
    return Math.floor(Math.random() * 100) + 50;
  }

  private getAverageResponseTime(): number {
    // This would typically be tracked by response middleware
    return Math.floor(Math.random() * 500) + 200;
  }

  private getErrorRate(): number {
    // This would typically come from error tracking middleware
    return Math.random() * 0.02;
  }

  private getActiveUserCount(): number {
    return this.userMetrics.size;
  }

  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    const alerts: string[] = [];

    if (metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push(`High response time: ${metrics.responseTime}ms`);
    }

    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }

    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push(`High memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`);
    }

    if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${(metrics.cpuUsage * 100).toFixed(1)}%`);
    }

    if (alerts.length > 0) {
      console.warn('SYSTEM ALERTS:', alerts.join(', '));
      await this.sendAlerts(alerts);
    }
  }

  private async sendAlerts(alerts: string[]): Promise<void> {
    // In production, this would send to monitoring services like DataDog, New Relic, etc.
    console.log('📢 ALERTS TRIGGERED:', alerts);
  }

  private cleanupOldMetrics(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // Clean up system metrics older than 24 hours
    this.systemMetrics = this.systemMetrics.filter(
      metric => metric.timestamp > oneDayAgo
    );
  }

  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics;
    aiModels: AIModelMetrics[];
    searchPerformance: SearchPerformanceMetrics[];
    uptime: number;
  } {
    const latest = this.systemMetrics[this.systemMetrics.length - 1] || {
      timestamp: Date.now(),
      cpuUsage: 0,
      memoryUsage: 0,
      requestCount: 0,
      responseTime: 0,
      errorRate: 0,
      activeUsers: 0
    };

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (latest.errorRate > 0.1 || latest.responseTime > 5000) {
      status = 'critical';
    } else if (latest.errorRate > 0.05 || latest.responseTime > 2000) {
      status = 'warning';
    }

    return {
      status,
      metrics: latest,
      aiModels: Array.from(this.aiModelMetrics.values()),
      searchPerformance: Array.from(this.searchMetrics.values()),
      uptime: process.uptime()
    };
  }

  getPerformanceReport(timeRange: '1h' | '24h' | '7d' = '24h'): {
    systemMetrics: SystemMetrics[];
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    aiUsageStats: AIModelMetrics[];
    searchStats: SearchPerformanceMetrics[];
    userEngagement: {
      activeUsers: number;
      averageSessionDuration: number;
      averageQueriesPerSession: number;
    };
  } {
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const cutoff = Date.now() - timeRanges[timeRange];
    const filteredMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);

    const averageResponseTime = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length
      : 0;

    const errorRate = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) / filteredMetrics.length
      : 0;

    const throughput = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.requestCount, 0)
      : 0;

    // Calculate user engagement metrics
    const userStats = Array.from(this.userMetrics.values());
    const userEngagement = {
      activeUsers: userStats.length,
      averageSessionDuration: userStats.length > 0
        ? userStats.reduce((sum, u) => sum + u.sessionDuration, 0) / userStats.length
        : 0,
      averageQueriesPerSession: userStats.length > 0
        ? userStats.reduce((sum, u) => sum + u.queriesPerSession, 0) / userStats.length
        : 0
    };

    return {
      systemMetrics: filteredMetrics,
      averageResponseTime,
      errorRate,
      throughput,
      aiUsageStats: Array.from(this.aiModelMetrics.values()),
      searchStats: Array.from(this.searchMetrics.values()),
      userEngagement
    };
  }

  async generateInsights(): Promise<{
    recommendations: string[];
    performanceTrends: string[];
    costOptimizations: string[];
    userBehaviorInsights: string[];
  }> {
    const report = this.getPerformanceReport('24h');
    const recommendations: string[] = [];
    const performanceTrends: string[] = [];
    const costOptimizations: string[] = [];
    const userBehaviorInsights: string[] = [];

    // Performance recommendations
    if (report.averageResponseTime > 1500) {
      recommendations.push('Consider optimizing search algorithms or adding caching layers');
    }

    if (report.errorRate > 0.03) {
      recommendations.push('Investigate and fix recurring errors to improve system reliability');
    }

    // AI usage optimization
    const aiStats = report.aiUsageStats;
    const expensiveModels = aiStats.filter(model => model.costEstimate > 10);
    if (expensiveModels.length > 0) {
      costOptimizations.push(`High-cost models detected: ${expensiveModels.map(m => m.modelId).join(', ')}`);
    }

    // Search performance insights
    const searchStats = report.searchStats;
    const lowPerformingSearch = searchStats.filter(s => s.averageLatency > 1000);
    if (lowPerformingSearch.length > 0) {
      performanceTrends.push(`Slow search types: ${lowPerformingSearch.map(s => s.searchType).join(', ')}`);
    }

    // User behavior insights
    if (report.userEngagement.averageSessionDuration < 300) {
      userBehaviorInsights.push('Users have short session durations - consider improving onboarding');
    }

    if (report.userEngagement.averageQueriesPerSession < 3) {
      userBehaviorInsights.push('Low query engagement - consider improving search suggestions');
    }

    return {
      recommendations,
      performanceTrends,
      costOptimizations,
      userBehaviorInsights
    };
  }
}

export const monitoringService = new MonitoringService();