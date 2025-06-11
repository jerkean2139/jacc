import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 10000;
  private startCpuUsage: NodeJS.CpuUsage;

  constructor() {
    this.startCpuUsage = process.cpuUsage();
    this.setupPeriodicCleanup();
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const startCpu = process.cpuUsage();

      const originalSend = res.send;
      res.send = function(data) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        const cpuUsage = process.cpuUsage(startCpu);
        
        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          memoryUsage: process.memoryUsage(),
          cpuUsage
        };

        performanceMonitor.addMetric(metric);
        return originalSend.call(this, data);
      };

      next();
    };
  }

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(timeframe: '1h' | '24h' | '7d' = '1h') {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '24h':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
    }

    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  getPerformanceReport(timeframe: '1h' | '24h' | '7d' = '1h') {
    const metrics = this.getMetrics(timeframe);
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestEndpoints: [],
        errorRate: 0,
        memoryTrend: [],
        throughput: 0
      };
    }

    const totalRequests = metrics.length;
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Calculate throughput (requests per minute)
    const timeSpanMinutes = timeframe === '1h' ? 60 : timeframe === '24h' ? 1440 : 10080;
    const throughput = totalRequests / timeSpanMinutes;

    // Find slowest endpoints
    const endpointPerformance = new Map<string, { total: number; count: number; max: number }>();
    
    metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const current = endpointPerformance.get(key) || { total: 0, count: 0, max: 0 };
      current.total += metric.responseTime;
      current.count += 1;
      current.max = Math.max(current.max, metric.responseTime);
      endpointPerformance.set(key, current);
    });

    const slowestEndpoints = Array.from(endpointPerformance.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        averageTime: data.total / data.count,
        maxTime: data.max,
        requestCount: data.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Memory usage trend (sample every 100 requests)
    const memoryTrend = metrics
      .filter((_, index) => index % Math.max(1, Math.floor(metrics.length / 20)) === 0)
      .map(metric => ({
        timestamp: metric.timestamp,
        heapUsed: metric.memoryUsage.heapUsed / 1024 / 1024, // MB
        heapTotal: metric.memoryUsage.heapTotal / 1024 / 1024, // MB
        rss: metric.memoryUsage.rss / 1024 / 1024 // MB
      }));

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      slowestEndpoints,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryTrend,
      throughput: Math.round(throughput * 100) / 100
    };
  }

  getHealthStatus() {
    const recent = this.getMetrics('1h');
    const currentMemory = process.memoryUsage();
    
    // Health thresholds
    const memoryThreshold = 500 * 1024 * 1024; // 500MB
    const responseTimeThreshold = 2000; // 2 seconds
    const errorRateThreshold = 5; // 5%

    const averageResponseTime = recent.length > 0 
      ? recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length 
      : 0;
    
    const errorRate = recent.length > 0 
      ? (recent.filter(m => m.statusCode >= 400).length / recent.length) * 100 
      : 0;

    const isHealthy = 
      currentMemory.heapUsed < memoryThreshold &&
      averageResponseTime < responseTimeThreshold &&
      errorRate < errorRateThreshold;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      memory: {
        used: Math.round(currentMemory.heapUsed / 1024 / 1024),
        total: Math.round(currentMemory.heapTotal / 1024 / 1024),
        threshold: Math.round(memoryThreshold / 1024 / 1024)
      },
      responseTime: {
        average: Math.round(averageResponseTime),
        threshold: responseTimeThreshold
      },
      errorRate: {
        current: Math.round(errorRate * 100) / 100,
        threshold: errorRateThreshold
      },
      uptime: Math.round(process.uptime())
    };
  }

  private setupPeriodicCleanup() {
    // Clean up old metrics every hour
    setInterval(() => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7); // Keep 7 days of data
      this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    }, 60 * 60 * 1000);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-scaling recommendations based on performance
export function getScalingRecommendations() {
  const health = performanceMonitor.getHealthStatus();
  const report = performanceMonitor.getPerformanceReport('1h');
  
  const recommendations = [];

  if (health.memory.used > health.memory.threshold * 0.8) {
    recommendations.push({
      type: 'memory',
      severity: 'high',
      message: 'Memory usage is high. Consider increasing memory allocation or optimizing memory usage.',
      action: 'scale_up_memory'
    });
  }

  if (health.responseTime.average > health.responseTime.threshold * 0.8) {
    recommendations.push({
      type: 'performance',
      severity: 'medium',
      message: 'Response times are elevated. Consider scaling horizontally or optimizing slow endpoints.',
      action: 'scale_horizontally'
    });
  }

  if (health.errorRate.current > health.errorRate.threshold * 0.6) {
    recommendations.push({
      type: 'reliability',
      severity: 'high',
      message: 'Error rate is increasing. Investigation required.',
      action: 'investigate_errors'
    });
  }

  if (report.throughput > 100) { // High throughput
    recommendations.push({
      type: 'capacity',
      severity: 'low',
      message: 'High throughput detected. Monitor for potential capacity issues.',
      action: 'monitor_capacity'
    });
  }

  return recommendations;
}