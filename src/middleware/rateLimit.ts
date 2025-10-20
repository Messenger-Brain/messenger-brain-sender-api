import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { AuthenticatedRequest } from './auth';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimitMiddleware {
  private static instance: RateLimitMiddleware;
  private configService: ConfigService;
  private logger: typeof Logger;
  private store: RateLimitStore = {};

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000);
  }

  public static getInstance(): RateLimitMiddleware {
    if (!RateLimitMiddleware.instance) {
      RateLimitMiddleware.instance = new RateLimitMiddleware();
    }
    return RateLimitMiddleware.instance;
  }

  /**
   * Create rate limiter based on token type
   */
  public createRateLimit = (config: RateLimitConfig) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const key = this.generateKey(req);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get or create entry
      let entry = this.store[key];
      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          resetTime: now + config.windowMs
        };
        this.store[key] = entry;
      }

      // Increment counter
      entry.count++;

      // Check if limit exceeded
      if (entry.count > config.maxRequests) {
        this.logger.warn('Rate limit exceeded', {
          key,
          count: entry.count,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          user_id: req.user?.id,
          tokenType: req.tokenType
        });

        res.status(429).json({
          success: false,
          message: config.message,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
        return;
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
      });

      this.logger.info('Rate limit check passed', {
        key,
        count: entry.count,
        maxRequests: config.maxRequests,
        user_id: req.user?.id,
        tokenType: req.tokenType
      });

      next();
    };
  };

  /**
   * Rate limit for JWT tokens (higher limits)
   */
  public jwtRateLimit = (maxRequests: number = 1000, windowMs: number = 900000) => { // 15 minutes
    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'JWT rate limit exceeded'
    });
  };

  /**
   * Rate limit for personal tokens (lower limits)
   */
  public personalTokenRateLimit = (maxRequests: number = 100, windowMs: number = 900000) => { // 15 minutes
    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'Personal token rate limit exceeded'
    });
  };

  /**
   * Rate limit for authentication endpoints
   */
  public authRateLimit = (maxRequests: number = 5, windowMs: number = 900000) => { // 15 minutes
    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'Authentication rate limit exceeded'
    });
  };

  /**
   * Rate limit for message sending (high volume)
   */
  public messageRateLimit = (maxRequests: number = 3000, windowMs: number = 3600000) => { // 1 hour
    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'Message sending rate limit exceeded'
    });
  };

  /**
   * Rate limit for file uploads
   */
  public uploadRateLimit = (maxRequests: number = 10, windowMs: number = 3600000) => { // 1 hour
    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'File upload rate limit exceeded'
    });
  };

  /**
   * Rate limit for admin endpoints
   */
  public adminRateLimit = (maxRequests: number = 200, windowMs: number = 900000) => { // 15 minutes
    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'Admin rate limit exceeded'
    });
  };

  /**
   * Dynamic rate limit based on user role and token type
   */
  public dynamicRateLimit = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // No user, use default limits
      return this.createRateLimit({
        windowMs: 900000, // 15 minutes
        maxRequests: 10,
        message: 'Rate limit exceeded'
      })(req, res, next);
    }

    let maxRequests: number;
    let windowMs: number = 900000; // 15 minutes

    // Determine limits based on token type and user role
    if (req.tokenType === 'jwt') {
      // JWT tokens from send-api.messengerbrain.com get higher limits
      switch (req.user.role) {
        case 'admin':
          maxRequests = 2000;
          break;
        case 'moderator':
          maxRequests = 1000;
          break;
        case 'user':
          maxRequests = 500;
          break;
        default:
          maxRequests = 100;
      }
    } else {
      // Personal tokens get lower limits
      switch (req.user.role) {
        case 'admin':
          maxRequests = 200;
          break;
        case 'moderator':
          maxRequests = 100;
          break;
        case 'user':
          maxRequests = 50;
          break;
        default:
          maxRequests = 10;
      }
    }

    // Special limits for free trial users
    if (req.user.free_trial) {
      maxRequests = Math.floor(maxRequests * 0.1); // 10% of normal limits
    }

    return this.createRateLimit({
      windowMs,
      maxRequests,
      message: 'Rate limit exceeded'
    })(req, res, next);
  };

  /**
   * Generate unique key for rate limiting
   */
  private generateKey(req: AuthenticatedRequest): string {
    const parts: string[] = [];

    // Add user ID if authenticated
    if (req.user) {
      parts.push(`user:${req.user.id}`);
    } else {
      // Use IP address for unauthenticated requests
      parts.push(`ip:${req.ip || req.connection.remoteAddress || 'unknown'}`);
    }

    // Add token type if available
    if (req.tokenType) {
      parts.push(`token:${req.tokenType}`);
    }

    // Add endpoint path
    parts.push(`path:${req.path}`);

    return parts.join('|');
  }

  /**
   * Clean up expired entries from store
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      if (entry.resetTime < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      delete this.store[key];
    });

    if (keysToDelete.length > 0) {
      this.logger.debug('Cleaned up expired rate limit entries', {
        deletedCount: keysToDelete.length,
        remainingCount: Object.keys(this.store).length
      });
    }
  }

  /**
   * Get current rate limit status for a key
   */
  public getRateLimitStatus(key: string): {
    count: number;
    maxRequests: number;
    resetTime: number;
    remaining: number;
  } | null {
    const entry = this.store[key];
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      maxRequests: 0, // This would need to be passed from the rate limiter
      resetTime: entry.resetTime,
      remaining: Math.max(0, 0 - entry.count) // This would need the maxRequests
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  public resetRateLimit(key: string): boolean {
    if (this.store[key]) {
      delete this.store[key];
      this.logger.info('Rate limit reset', { key });
      return true;
    }
    return false;
  }

  /**
   * Get store statistics
   */
  public getStoreStats(): {
    totalEntries: number;
    entries: Array<{
      key: string;
      count: number;
      resetTime: number;
    }>;
  } {
    const entries = Object.entries(this.store).map(([key, entry]) => ({
      key,
      count: entry.count,
      resetTime: entry.resetTime
    }));

    return {
      totalEntries: entries.length,
      entries
    };
  }

  /**
   * Clear all rate limit entries
   */
  public clearAll(): void {
    const count = Object.keys(this.store).length;
    this.store = {};
    this.logger.info('All rate limit entries cleared', { clearedCount: count });
  }
}

export default RateLimitMiddleware;
