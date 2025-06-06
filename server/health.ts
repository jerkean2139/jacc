import { Request, Response } from 'express';

export const healthCheck = async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    environment: process.env.NODE_ENV || 'development'
  };

  // Health status based on memory usage
  if (health.memory.percentage > 90) {
    health.status = 'critical';
  } else if (health.memory.percentage > 80) {
    health.status = 'warning';
  }

  const statusCode = health.status === 'critical' ? 503 : 200;
  res.status(statusCode).json(health);
};

export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    const { db } = await import('./db');
    await db.execute('SELECT 1');
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'ready'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
};