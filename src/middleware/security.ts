import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Configure Helmet security headers
   */
  public configureHelmet = () => {
    const isDevelopment = this.configService.isDevelopment();
    
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: false,
      // Cross-Origin Opener Policy
      crossOriginOpenerPolicy: { policy: "same-origin" },
      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },
      // Expect CT (removed as it's deprecated)
      // Feature Policy (removed as it's deprecated)
      // Hide X-Powered-By
      hidePoweredBy: true,
      // HSTS
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      // IE No Open
      ieNoOpen: true,
      // No Sniff
      noSniff: true,
      // Origin Agent Cluster
      originAgentCluster: true,
      // Permissions Policy (removed as it's deprecated)
      // Referrer Policy
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // XSS Filter
      xssFilter: true
    });
  };

  /**
   * Security headers middleware
   */
  public securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    next();
  };

  /**
   * Request size limiter
   */
  public requestSizeLimit = (maxSize: string = '10mb') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt((req.get('content-length') as string) || '0');
      const maxSizeBytes = this.parseSize(maxSize);

      if (contentLength > maxSizeBytes) {
        this.logger.warn('Request size limit exceeded', {
          contentLength,
          maxSizeBytes,
          path: req.path,
          ip: req.ip || req.connection.remoteAddress
        });

        res.status(413).json({
          success: false,
          message: 'Request entity too large',
          error: `Request size exceeds maximum allowed size of ${maxSize}`
        });
        return;
      }

      next();
    };
  };

  /**
   * Parse size string to bytes
   */
  private parseSize(size: string): number {
    const units: { [key: string]: number } = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) {
      return 1024 * 1024; // Default 1MB
    }

    const value = parseFloat((match[1] as string) || '0');
    const unit = (match[2] as string) || 'b';

    return Math.floor(value * (units[unit as keyof typeof units] || 1));
  }

  /**
   * IP whitelist middleware
   */
  public ipWhitelist = (allowedIPs: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIP = (req.ip as string) || (req.connection.remoteAddress as string) || 'unknown';
      
      if (!allowedIPs.includes(clientIP) && !allowedIPs.includes('*')) {
        this.logger.warn('IP not in whitelist', {
          clientIP,
          path: req.path,
          userAgent: req.get('user-agent')
        });

        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'IP address not allowed'
        });
        return;
      }

      next();
    };
  };

  /**
   * Rate limiting for security-sensitive endpoints
   */
  public securityRateLimit = (maxRequests: number = 5, windowMs: number = 900000) => { // 15 minutes
    const requests: { [key: string]: { count: number; resetTime: number } } = {};

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = (req.ip as string) || (req.connection.remoteAddress as string) || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      Object.keys(requests).forEach(k => {
        if (requests[k] && requests[k].resetTime < now) {
          delete requests[k];
        }
      });

      // Get or create entry
      let entry = requests[key];
      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          resetTime: now + windowMs
        };
        requests[key] = entry;
      }

      // Increment counter
      entry.count++;

      // Check if limit exceeded
      if (entry.count > maxRequests) {
        this.logger.warn('Security rate limit exceeded', {
          key,
          count: entry.count,
          maxRequests,
          path: req.path,
          userAgent: (req.get('user-agent') as string) || 'unknown'
        });

        res.status(429).json({
          success: false,
          message: 'Too many requests',
          error: 'Rate limit exceeded for security-sensitive endpoint',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
        return;
      }

      next();
    };
  };

  /**
   * SQL injection protection
   */
  public sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*IN\s*\()/i,
      /(\b(OR|AND)\s+['"]\s*BETWEEN\s+)/i,
      /(\b(OR|AND)\s+['"]\s*EXISTS\s*\()/i,
      /(\b(OR|AND)\s+['"]\s*NOT\s+EXISTS\s*\()/i,
      /(\b(OR|AND)\s+['"]\s*IN\s*\(SELECT)/i,
      /(\b(OR|AND)\s+['"]\s*NOT\s+IN\s*\(SELECT)/i
    ];

    const checkForSQLInjection = (obj: any, path: string = ''): boolean => {
      if (typeof obj === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(obj)) {
            this.logger.warn('SQL injection attempt detected', {
              path,
              value: obj,
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent')
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const newPath = path ? `${path}.${key}` : key;
            if (checkForSQLInjection(obj[key], newPath)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Check request body, query, and params
    if (checkForSQLInjection(req.body, 'body') ||
        checkForSQLInjection(req.query, 'query') ||
        checkForSQLInjection(req.params, 'params')) {
      
      res.status(400).json({
        success: false,
        message: 'Invalid request',
        error: 'Potentially malicious input detected'
      });
      return;
    }

    next();
  };

  /**
   * XSS protection
   */
  public xssProtection = (req: Request, res: Response, next: NextFunction): void => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /onfocus\s*=/gi,
      /onblur\s*=/gi,
      /onchange\s*=/gi,
      /onsubmit\s*=/gi,
      /onreset\s*=/gi,
      /onselect\s*=/gi,
      /onkeydown\s*=/gi,
      /onkeyup\s*=/gi,
      /onkeypress\s*=/gi
    ];

    const checkForXSS = (obj: any, path: string = ''): boolean => {
      if (typeof obj === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(obj)) {
            this.logger.warn('XSS attempt detected', {
              path,
              value: obj,
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent')
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const newPath = path ? `${path}.${key}` : key;
            if (checkForXSS(obj[key], newPath)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Check request body, query, and params
    if (checkForXSS(req.body, 'body') ||
        checkForXSS(req.query, 'query') ||
        checkForXSS(req.params, 'params')) {
      
      res.status(400).json({
        success: false,
        message: 'Invalid request',
        error: 'Potentially malicious input detected'
      });
      return;
    }

    next();
  };

  /**
   * Log security events
   */
  public logSecurityEvent = (event: string, details: any): void => {
    this.logger.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  };

  /**
   * Block suspicious user agents
   */
  public blockSuspiciousUserAgents = (req: Request, res: Response, next: NextFunction): void => {
    const userAgent = (req.get('user-agent') as string) || '';
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /php/i,
      /perl/i,
      /ruby/i,
      /go-http/i,
      /okhttp/i,
      /apache/i,
      /nginx/i
    ];

    // Allow some legitimate user agents
    const allowedPatterns = [
      /mozilla/i,
      /chrome/i,
      /safari/i,
      /firefox/i,
      /edge/i,
      /opera/i
    ];

    // Check if it's a suspicious user agent
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent as string));
    const isAllowed = allowedPatterns.some(pattern => pattern.test(userAgent as string));

    if (isSuspicious && !isAllowed) {
      this.logger.warn('Suspicious user agent blocked', {
        userAgent,
        ip: (req.ip as string) || (req.connection.remoteAddress as string) || 'unknown',
        path: req.path
      });

      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Suspicious user agent detected'
      });
      return;
    }

    next();
  };

  /**
   * Validate request headers
   */
  public validateHeaders = (req: Request, res: Response, next: NextFunction): void => {
    const requiredHeaders = ['user-agent'];
    const missingHeaders: string[] = [];

    for (const header of requiredHeaders) {
      if (!req.get(header)) {
        missingHeaders.push(header);
      }
    }

    if (missingHeaders.length > 0) {
      this.logger.warn('Missing required headers', {
        missingHeaders,
        ip: req.ip || req.connection.remoteAddress,
        path: req.path
      });

      res.status(400).json({
        success: false,
        message: 'Missing required headers',
        error: `Required headers: ${missingHeaders.join(', ')}`
      });
      return;
    }

    next();
  };
}

export default SecurityMiddleware;
