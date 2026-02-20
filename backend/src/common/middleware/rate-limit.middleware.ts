import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = 60_000;
  private readonly maxRequestsPerWindow = 120;
  private readonly buckets = new Map<string, Bucket>();
  private readonly cleanupIntervalRequests = 250;
  private requestCount = 0;

  use(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();
    this.requestCount += 1;
    if (this.requestCount % this.cleanupIntervalRequests === 0) {
      this.cleanupExpiredBuckets(now);
    }

    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      next();
      return;
    }

    if (bucket.count >= this.maxRequestsPerWindow) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please retry later.',
        errorCode: 'TOO_MANY_REQUESTS',
        statusCode: 429,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    bucket.count += 1;
    next();
  }

  private cleanupExpiredBuckets(now: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
