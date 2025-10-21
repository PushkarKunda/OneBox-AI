import { Request, Response, NextFunction } from 'express';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  userAgent?: string;
  ip?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics to prevent memory issues
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow requests (> 2 seconds)
    if (metric.duration > 2000) {
      console.warn(`🐌 Slow request detected: ${metric.method} ${metric.endpoint} - ${metric.duration}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics.slice(); // Return copy
  }

  getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        endpoints: {}
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgResponseTime = totalDuration / recentMetrics.length;
    const slowRequests = recentMetrics.filter(m => m.duration > 2000).length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;

    // Group by endpoint
    const endpoints: Record<string, {
      requests: number;
      avgTime: number;
      errors: number;
    }> = {};

    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpoints[key]) {
        endpoints[key] = { requests: 0, avgTime: 0, errors: 0 };
      }
      endpoints[key].requests++;
      endpoints[key].avgTime += metric.duration;
      if (metric.statusCode >= 400) {
        endpoints[key].errors++;
      }
    });

    // Calculate average times
    Object.keys(endpoints).forEach(key => {
      endpoints[key].avgTime = endpoints[key].avgTime / endpoints[key].requests;
    });

    return {
      totalRequests: recentMetrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      slowRequests,
      errorRate: Math.round((errorRequests / recentMetrics.length) * 100),
      endpoints
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to track API performance metrics
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response time
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    performanceMonitor.addMetric({
      endpoint: req.path,
      method: req.method,
      duration,
      timestamp: new Date(),
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress
    });

    // Call original send method
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  return performanceMonitor.getStats();
};

/**
 * Get raw metrics (for debugging)
 */
export const getPerformanceMetrics = () => {
  return performanceMonitor.getMetrics();
};