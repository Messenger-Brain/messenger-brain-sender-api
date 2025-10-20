import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';

export class CORSMiddleware {
  private static instance: CORSMiddleware;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): CORSMiddleware {
    if (!CORSMiddleware.instance) {
      CORSMiddleware.instance = new CORSMiddleware();
    }
    return CORSMiddleware.instance;
  }

  /**
   * Configure CORS headers
   */
  public configureCORS = (req: Request, res: Response, next: NextFunction): void => {
    const corsConfig = this.configService.getCORSConfig();
    const origin = req.get('origin');

    // Set default CORS headers
    res.set({
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // 24 hours
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      this.handlePreflightRequest(req, res, corsConfig);
      return;
    }

    // Set origin header
    this.setOriginHeader(req, res, corsConfig, origin);
    
    next();
  };

  /**
   * Handle preflight OPTIONS requests
   */
  private handlePreflightRequest(req: Request, res: Response, corsConfig: any): void {
    const origin = req.get('origin');
    const requestedMethod = req.get('access-control-request-method');
    const requestedHeaders = req.get('access-control-request-headers');

    // Log preflight request
    this.logger.info('CORS Preflight Request', {
      origin,
      method: requestedMethod,
      headers: requestedHeaders,
      userAgent: req.get('user-agent')
    });

    // Check if origin is allowed
    if (this.isOriginAllowed(origin, corsConfig)) {
      res.set({
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': requestedHeaders || 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      });

      res.status(200).end();
    } else {
      this.logger.warn('CORS Preflight Request Rejected', {
        origin,
        method: requestedMethod,
        headers: requestedHeaders
      });

      res.status(403).json({
        success: false,
        message: 'CORS policy violation',
        error: 'Origin not allowed'
      });
    }
  }

  /**
   * Set appropriate origin header
   */
  private setOriginHeader(req: Request, res: Response, corsConfig: any, origin: string | undefined): void {
    if (this.isOriginAllowed(origin, corsConfig)) {
      res.set('Access-Control-Allow-Origin', origin || '*');
    } else {
      // In development, allow all origins
      if (this.configService.isDevelopment()) {
        res.set('Access-Control-Allow-Origin', '*');
        this.logger.warn('CORS: Allowing all origins in development', { origin });
      } else {
        // In production, don't set origin header for disallowed origins
        this.logger.warn('CORS: Origin not allowed', { origin });
      }
    }
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string | undefined, corsConfig: any): boolean {
    if (!origin) {
      return false;
    }

    // If no CORS config, allow all in development
    if (!corsConfig || !corsConfig.origin) {
      return this.configService.isDevelopment();
    }

    const allowedOrigins = corsConfig.origin;

    // If it's a string, check exact match
    if (typeof allowedOrigins === 'string') {
      return allowedOrigins === '*' || allowedOrigins === origin;
    }

    // If it's an array, check if origin is in the array
    if (Array.isArray(allowedOrigins)) {
      return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
    }

    return false;
  }

  /**
   * CORS middleware for specific routes
   */
  public routeSpecificCORS = (allowedOrigins: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const origin = req.get('origin');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        if (this.isOriginInList(origin, allowedOrigins)) {
          res.set({
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400'
          });
          res.status(200).end();
        } else {
          res.status(403).json({
            success: false,
            message: 'CORS policy violation',
            error: 'Origin not allowed for this route'
          });
        }
        return;
      }

      // Set origin for actual requests
      if (this.isOriginInList(origin, allowedOrigins)) {
        res.set('Access-Control-Allow-Origin', origin || '*');
      }

      next();
    };
  };

  /**
   * Check if origin is in allowed list
   */
  private isOriginInList(origin: string | undefined, allowedOrigins: string[]): boolean {
    if (!origin) {
      return false;
    }

    return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  }

  /**
   * CORS middleware for API endpoints
   */
  public apiCORS = (req: Request, res: Response, next: NextFunction): void => {
    const corsConfig = this.configService.getCORSConfig();
    const origin = req.get('origin');

    // API endpoints have stricter CORS policy
    const apiAllowedOrigins = [
      'https://send-api.messengerbrain.com',
      'https://messengerbrain.com',
      'https://www.messengerbrain.com'
    ];

    // Add development origins in development mode
    if (this.configService.isDevelopment()) {
      apiAllowedOrigins.push('http://localhost:3000', 'http://localhost:4200', 'http://127.0.0.1:3000');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      if (this.isOriginInList(origin, apiAllowedOrigins)) {
        res.set({
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '3600' // 1 hour for API
        });
        res.status(200).end();
      } else {
        this.logger.warn('API CORS Preflight Request Rejected', { origin, path: req.path });
        res.status(403).json({
          success: false,
          message: 'CORS policy violation',
          error: 'Origin not allowed for API endpoints'
        });
      }
      return;
    }

    // Set origin for actual requests
    if (this.isOriginInList(origin, apiAllowedOrigins)) {
      res.set('Access-Control-Allow-Origin', origin || '*');
    } else {
      this.logger.warn('API CORS Request Rejected', { origin, path: req.path });
    }

    next();
  };

  /**
   * CORS middleware for webhook endpoints
   * Webhooks must accept requests from any API provider
   */
  public webhookCORS = (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('origin');

    // Webhooks accept requests from any origin
    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '3600'
      });
      res.status(200).end();
      return;
    }

    // Allow all origins for webhook requests
    res.set('Access-Control-Allow-Origin', '*');
    next();
  };

  /**
   * Log CORS violations
   */
  public logCORSViolation = (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;

    res.send = function(data: any) {
      // Log CORS violations
      if (res.statusCode === 403 && req.method === 'OPTIONS') {
        Logger.warn('CORS Violation', {
          origin: req.get('origin'),
          method: req.method,
          path: req.path,
          userAgent: req.get('user-agent'),
          ip: req.ip || req.connection.remoteAddress
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

export default CORSMiddleware;
