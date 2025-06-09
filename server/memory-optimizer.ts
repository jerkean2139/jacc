// Memory optimizer for production deployment

export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private memoryThreshold = 0.70; // Lowered to 70% for aggressive cleanup
  private cleanupInterval: NodeJS.Timeout | null = null;
  private documentCache = new Map<string, { data: any; lastAccessed: number; size: number }>();
  private maxCacheSize = 10 * 1024 * 1024; // Reduced to 10MB cache limit
  private currentCacheSize = 0;

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  initialize(): void {
    this.startMemoryMonitoring();
    this.startPeriodicCleanup();
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
      const usagePercent = heapUsedMB / heapTotalMB;

      if (usagePercent > this.memoryThreshold) {
        console.warn(`High memory usage detected: ${(usagePercent * 100).toFixed(1)}%`);
        this.performEmergencyCleanup();
      }

      // Log memory stats every 5 minutes
      console.log(`Memory usage: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB (${(usagePercent * 100).toFixed(1)}%)`);
      
      // Store metrics in global object for monitoring
      if (!(global as any).memoryMetrics) (global as any).memoryMetrics = {};
      (global as any).memoryMetrics.heapUsed = heapUsedMB;
      (global as any).memoryMetrics.heapTotal = heapTotalMB;
      (global as any).memoryMetrics.usagePercent = usagePercent * 100;
    }, 30000); // Check every 30 seconds to reduce overhead
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupDocumentCache();
      this.forceGarbageCollection();
    }, 300000); // Cleanup every 5 minutes
  }

  private performEmergencyCleanup(): void {
    console.log('Performing emergency memory cleanup...');
    
    // Clear ALL caches aggressively
    this.documentCache.clear();
    this.currentCacheSize = 0;
    
    // Clear any global caches that might exist
    if ((global as any).documentCache) delete (global as any).documentCache;
    if ((global as any).queryCache) delete (global as any).queryCache;
    if ((global as any).vectorCache) delete (global as any).vectorCache;
    
    // Multiple garbage collection cycles
    this.forceGarbageCollection();
    setTimeout(() => this.forceGarbageCollection(), 50);
    
    // Clear temporary data
    this.clearTempData();
    
    console.log('Emergency cleanup completed');
  }

  private cleanupDocumentCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    let cleaned = 0;

    for (const [key, entry] of this.documentCache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.currentCacheSize -= entry.size;
        this.documentCache.delete(key);
        cleaned++;
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.currentCacheSize > this.maxCacheSize) {
      const entries = Array.from(this.documentCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      while (this.currentCacheSize > this.maxCacheSize && entries.length > 0) {
        const [key, entry] = entries.shift()!;
        this.currentCacheSize -= entry.size;
        this.documentCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} cached documents, cache size: ${(this.currentCacheSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.log('Garbage collection forced');
    }
  }

  private clearTempData(): void {
    // Clear any module-level caches or large objects
    if (global.tempData) {
      delete global.tempData;
    }
  }

  cacheDocument(key: string, data: any): void {
    const size = JSON.stringify(data).length;
    
    // Don't cache if it would exceed limits
    if (size > this.maxCacheSize / 4) {
      return;
    }

    // Remove old entry if exists
    if (this.documentCache.has(key)) {
      this.currentCacheSize -= this.documentCache.get(key)!.size;
    }

    this.documentCache.set(key, {
      data,
      lastAccessed: Date.now(),
      size
    });

    this.currentCacheSize += size;

    // Cleanup if over limit
    if (this.currentCacheSize > this.maxCacheSize) {
      this.cleanupDocumentCache();
    }
  }

  getCachedDocument(key: string): any | null {
    const entry = this.documentCache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.data;
    }
    return null;
  }

  getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    usagePercent: number;
    cacheSize: number;
    cachedDocuments: number;
  } {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed / 1024 / 1024,
      heapTotal: memoryUsage.heapTotal / 1024 / 1024,
      usagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      cacheSize: this.currentCacheSize / 1024 / 1024,
      cachedDocuments: this.documentCache.size
    };
  }

  optimizeForProduction(): void {
    // Set more aggressive cleanup thresholds for production
    this.memoryThreshold = 0.75;
    this.maxCacheSize = 50 * 1024 * 1024; // Reduce to 50MB
    
    // More frequent cleanup in production
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanupDocumentCache();
    }, 120000); // Every 2 minutes
    
    console.log('Memory optimizer configured for production deployment');
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.documentCache.clear();
    this.currentCacheSize = 0;
  }
}

export const memoryOptimizer = MemoryOptimizer.getInstance();