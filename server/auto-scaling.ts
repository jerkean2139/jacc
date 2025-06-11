import { performanceMonitor } from './performance-monitoring';

interface ScalingPolicy {
  metricType: 'cpu' | 'memory' | 'responseTime' | 'errorRate' | 'throughput';
  threshold: number;
  scaleDirection: 'up' | 'down';
  cooldownPeriod: number; // minutes
  minInstances: number;
  maxInstances: number;
}

interface InstanceMetrics {
  id: string;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  lastUpdated: Date;
}

class AutoScalingManager {
  private policies: ScalingPolicy[] = [
    {
      metricType: 'memory',
      threshold: 80, // 80% memory usage
      scaleDirection: 'up',
      cooldownPeriod: 5,
      minInstances: 1,
      maxInstances: 10
    },
    {
      metricType: 'responseTime',
      threshold: 2000, // 2 seconds
      scaleDirection: 'up',
      cooldownPeriod: 3,
      minInstances: 1,
      maxInstances: 10
    },
    {
      metricType: 'errorRate',
      threshold: 5, // 5% error rate
      scaleDirection: 'up',
      cooldownPeriod: 2,
      minInstances: 1,
      maxInstances: 10
    },
    {
      metricType: 'memory',
      threshold: 30, // 30% memory usage
      scaleDirection: 'down',
      cooldownPeriod: 10,
      minInstances: 1,
      maxInstances: 10
    }
  ];

  private lastScalingAction: Date | null = null;
  private currentInstances = 1;

  evaluateScaling(): { shouldScale: boolean; direction: 'up' | 'down'; reason: string } {
    const health = performanceMonitor.getHealthStatus();
    const report = performanceMonitor.getPerformanceReport('1h');

    // Check cooldown period
    if (this.lastScalingAction) {
      const minutesSinceLastAction = (Date.now() - this.lastScalingAction.getTime()) / (1000 * 60);
      if (minutesSinceLastAction < 5) {
        return { shouldScale: false, direction: 'up', reason: 'Cooldown period active' };
      }
    }

    for (const policy of this.policies) {
      let currentValue = 0;
      let metricName = '';

      switch (policy.metricType) {
        case 'memory':
          currentValue = (health.memory.used / health.memory.total) * 100;
          metricName = 'Memory usage';
          break;
        case 'responseTime':
          currentValue = health.responseTime.average;
          metricName = 'Response time';
          break;
        case 'errorRate':
          currentValue = health.errorRate.current;
          metricName = 'Error rate';
          break;
        case 'throughput':
          currentValue = report.throughput;
          metricName = 'Throughput';
          break;
        default:
          continue;
      }

      const shouldTrigger = policy.scaleDirection === 'up' 
        ? currentValue > policy.threshold
        : currentValue < policy.threshold;

      if (shouldTrigger) {
        // Check instance limits
        if (policy.scaleDirection === 'up' && this.currentInstances >= policy.maxInstances) {
          continue;
        }
        if (policy.scaleDirection === 'down' && this.currentInstances <= policy.minInstances) {
          continue;
        }

        return {
          shouldScale: true,
          direction: policy.scaleDirection,
          reason: `${metricName} ${policy.scaleDirection === 'up' ? 'exceeded' : 'below'} threshold: ${currentValue} ${policy.scaleDirection === 'up' ? '>' : '<'} ${policy.threshold}`
        };
      }
    }

    return { shouldScale: false, direction: 'up', reason: 'All metrics within normal range' };
  }

  async executeScaling(direction: 'up' | 'down'): Promise<boolean> {
    try {
      console.log(`🔄 Auto-scaling ${direction}...`);
      
      if (direction === 'up') {
        this.currentInstances++;
        console.log(`✅ Scaled up to ${this.currentInstances} instances`);
      } else {
        this.currentInstances--;
        console.log(`✅ Scaled down to ${this.currentInstances} instances`);
      }

      this.lastScalingAction = new Date();
      return true;
    } catch (error) {
      console.error('❌ Auto-scaling failed:', error);
      return false;
    }
  }

  getScalingStatus() {
    return {
      currentInstances: this.currentInstances,
      lastScalingAction: this.lastScalingAction,
      policies: this.policies,
      nextEvaluation: this.getNextEvaluationTime()
    };
  }

  private getNextEvaluationTime(): Date {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1); // Evaluate every minute
    return next;
  }

  // Predictive scaling based on historical patterns
  predictiveScaling() {
    const historicalData = performanceMonitor.getMetrics('24h');
    if (historicalData.length < 100) return null;

    // Simple trend analysis
    const recentHour = historicalData.slice(-60);
    const previousHour = historicalData.slice(-120, -60);

    const recentAvgResponse = recentHour.reduce((sum, m) => sum + m.responseTime, 0) / recentHour.length;
    const previousAvgResponse = previousHour.reduce((sum, m) => sum + m.responseTime, 0) / previousHour.length;

    const trend = recentAvgResponse - previousAvgResponse;
    const trendPercentage = (trend / previousAvgResponse) * 100;

    if (trendPercentage > 20) { // 20% increase in response time
      return {
        recommendation: 'scale_up',
        confidence: Math.min(trendPercentage / 20, 1),
        reason: `Response time trending up by ${trendPercentage.toFixed(1)}%`
      };
    }

    if (trendPercentage < -20) { // 20% decrease in response time
      return {
        recommendation: 'scale_down',
        confidence: Math.min(Math.abs(trendPercentage) / 20, 1),
        reason: `Response time trending down by ${Math.abs(trendPercentage).toFixed(1)}%`
      };
    }

    return null;
  }
}

export const autoScalingManager = new AutoScalingManager();

// Auto-scaling monitoring loop
export function startAutoScalingMonitor() {
  setInterval(() => {
    const evaluation = autoScalingManager.evaluateScaling();
    
    if (evaluation.shouldScale) {
      console.log(`🎯 Auto-scaling triggered: ${evaluation.reason}`);
      autoScalingManager.executeScaling(evaluation.direction);
    }

    // Check predictive scaling
    const prediction = autoScalingManager.predictiveScaling();
    if (prediction && prediction.confidence > 0.7) {
      console.log(`🔮 Predictive scaling recommendation: ${prediction.recommendation} (${prediction.reason})`);
    }
  }, 60000); // Check every minute
}