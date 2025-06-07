import { vendorIntelligence } from './vendor-intelligence';

class SchedulerService {
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Start weekly vendor intelligence crawl on server startup
    this.scheduleWeeklyVendorCrawl();
  }

  private scheduleWeeklyVendorCrawl(): void {
    // Run every Sunday at 2 AM UTC
    const weeklyInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    // Calculate time until next Sunday 2 AM UTC
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
    nextSunday.setUTCHours(2, 0, 0, 0);
    
    const timeUntilNextRun = nextSunday.getTime() - now.getTime();
    
    // Schedule first run
    setTimeout(() => {
      this.performVendorIntelligenceCrawl();
      
      // Then schedule recurring weekly runs
      const recurringTask = setInterval(() => {
        this.performVendorIntelligenceCrawl();
      }, weeklyInterval);
      
      this.scheduledTasks.set('weekly-vendor-crawl', recurringTask);
    }, timeUntilNextRun);

    console.log(`📅 Scheduled weekly vendor intelligence crawl for ${nextSunday.toISOString()}`);
  }

  private async performVendorIntelligenceCrawl(): Promise<void> {
    try {
      console.log('🚀 Starting automated weekly vendor intelligence crawl...');
      const updates = await vendorIntelligence.performWeeklyCrawl();
      
      // Log high-priority updates
      const highPriorityUpdates = updates.filter(u => u.impact === 'high' || u.actionRequired);
      if (highPriorityUpdates.length > 0) {
        console.log(`⚠️ Found ${highPriorityUpdates.length} high-priority vendor updates requiring attention`);
        
        // Store notification for management dashboard
        await this.notifyHighPriorityUpdates(highPriorityUpdates);
      }
      
      console.log(`✅ Weekly vendor crawl completed. Processed ${updates.length} total updates.`);
    } catch (error) {
      console.error('❌ Error in automated vendor intelligence crawl:', error);
    }
  }

  private async notifyHighPriorityUpdates(updates: any[]): Promise<void> {
    // Store high-priority updates in notifications system
    // This would integrate with the existing notification system
    console.log('📢 High-priority vendor updates detected:', updates.map(u => `${u.vendorName}: ${u.content}`));
  }

  // Manual trigger for immediate crawl
  async triggerImmediateCrawl(): Promise<any[]> {
    console.log('🔄 Manual vendor intelligence crawl triggered...');
    return await vendorIntelligence.performWeeklyCrawl();
  }

  // Method to check next scheduled run time
  getNextScheduledRun(): Date {
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
    nextSunday.setUTCHours(2, 0, 0, 0);
    
    if (nextSunday.getTime() <= now.getTime()) {
      nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
    }
    
    return nextSunday;
  }

  // Cleanup method for graceful shutdown
  shutdown(): void {
    this.scheduledTasks.forEach((task, name) => {
      clearInterval(task);
      console.log(`🛑 Stopped scheduled task: ${name}`);
    });
    this.scheduledTasks.clear();
  }
}

export const schedulerService = new SchedulerService();