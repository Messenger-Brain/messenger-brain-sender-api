import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';
import { AuthenticatedRequest } from './auth';

export class LoggingMiddleware {
  private static instance: LoggingMiddleware;
  private logger: typeof Logger;

  private constructor() {
    this.logger = Logger;
  }

  public static getInstance(): LoggingMiddleware {
    if (!LoggingMiddleware.instance) {
      LoggingMiddleware.instance = new LoggingMiddleware();
    }
    return LoggingMiddleware.instance;
  }

  /**
   * Log HTTP requests
   */
  public logRequests = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response data
    res.send = function(data: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Log the request
      LoggingMiddleware.getInstance().logRequest(req, res, responseTime, data);
      
      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };

  /**
   * Log request details
   */
  private logRequest(req: AuthenticatedRequest, res: Response, responseTime: number, responseData?: any): void {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      origin: req.get('origin'),
      referer: req.get('referer'),
      user_id: req.user?.id,
      tokenType: (req as any).tokenType,
      userRole: req.user?.role,
      contentLength: res.get('content-length'),
      contentType: res.get('content-type')
    };

      // Add request body for non-sensitive endpoints
      if (this.shouldLogRequestBody(req)) {
        (logData as any)['requestBody'] = req.body;
      }

      // Add query parameters
      if (Object.keys(req.query).length > 0) {
        (logData as any)['queryParams'] = req.query;
      }

      // Add path parameters
      if (Object.keys(req.params).length > 0) {
        (logData as any)['pathParams'] = req.params;
      }

    // Log based on status code
    if (res.statusCode >= 500) {
      this.logger.error('HTTP Request - Server Error', logData);
    } else if (res.statusCode >= 400) {
      this.logger.warn('HTTP Request - Client Error', logData);
    } else if (res.statusCode >= 300) {
      this.logger.info('HTTP Request - Redirect', logData);
    } else {
      this.logger.info('HTTP Request - Success', logData);
    }

    // Log performance metrics for slow requests
    if (responseTime > 1000) {
      this.logger.performance('slow_request', responseTime, logData);
    }
  }

  /**
   * Determine if request body should be logged
   */
  private shouldLogRequestBody(req: Request): boolean {
    const sensitivePaths = [
      '/auth/login',
      '/auth/register',
      '/auth/change-password',
      '/auth/reset-password'
    ];

    const sensitiveMethods = ['POST', 'PUT', 'PATCH'];
    
    // Don't log sensitive paths
    if (sensitivePaths.some(path => req.path.includes(path))) {
      return false;
    }

    // Only log body for methods that typically have bodies
    if (!sensitiveMethods.includes(req.method)) {
      return false;
    }

    // Don't log if body is too large (> 1KB)
    if (req.body && JSON.stringify(req.body).length > 1024) {
      return false;
    }

    return true;
  }

  /**
   * Log authentication events
   */
  public logAuthEvents = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;

    res.send = function(data: any) {
      // Log authentication events
      if (req.path.includes('/auth/')) {
        LoggingMiddleware.getInstance().logAuthEvent(req, res, data);
      }
      
      return originalSend.call(this, data);
    };

    next();
  };

  /**
   * Log authentication event
   */
  public logAuthEvent(req: Request, res: Response, responseData: any): void {
    const eventData = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      origin: req.get('origin'),
      user_id: req.user?.id,
      tokenType: (req as any).tokenType
    };

    // Parse response data to get success status
    let success = false;
    try {
      const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      success = parsed.success === true;
    } catch {
      success = res.statusCode < 400;
    }

    // Determine event type
    let eventType: 'login' | 'logout' | 'register' | 'token_refresh' | 'password_change' | 'other';
    
    if (req.path.includes('/login')) {
      eventType = 'login';
    } else if (req.path.includes('/logout')) {
      eventType = 'logout';
    } else if (req.path.includes('/register')) {
      eventType = 'register';
    } else if (req.path.includes('/refresh')) {
      eventType = 'token_refresh';
    } else if (req.path.includes('/change-password')) {
      eventType = 'password_change';
    } else {
      eventType = 'other';
    }

    this.logger.authEvent(eventType as any, req.user?.id, success);
  }

  /**
   * Log database operations
   */
  public logDatabaseOperations = (operation: string, table: string, success: boolean, duration?: number): void => {
    this.logger.databaseOperation(operation, table, success, duration);
  };

  /**
   * Log business events
   */
  public logBusinessEvent = (event: string, details?: any): void => {
    this.logger.businessEvent(event, details);
  };

  /**
   * Log performance metrics
   */
  public logPerformance = (operation: string, duration: number, details?: any): void => {
    this.logger.performance(operation, duration, details);
  };

  /**
   * Log error with context
   */
  public logError = (message: string, error: Error | any, context?: any): void => {
    this.logger.error(message, error);
    
    if (context) {
      this.logger.error('Error context', context);
    }
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
   * Log API usage statistics
   */
  public logApiUsage = (endpoint: string, user_id?: number, tokenType?: string): void => {
    this.logger.info('API Usage', {
      endpoint,
      user_id,
      tokenType,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * Log rate limit events
   */
  public logRateLimitEvent = (event: 'exceeded' | 'reset' | 'check', details: any): void => {
    this.logger.warn('Rate Limit Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  };

  /**
   * Log file upload events
   */
  public logFileUpload = (filename: string, size: number, user_id?: number, success: boolean = true): void => {
    this.logger.info('File Upload', {
      filename,
      size: `${size} bytes`,
      user_id,
      success,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * Log message sending events
   */
  public logMessageEvent = (event: 'sent' | 'failed' | 'queued', phone_number: string, details?: any): void => {
    this.logger.messageEvent(event, phone_number, details);
  };

  /**
   * Log WhatsApp session events
   */
  public logWhatsAppEvent = (event: string, sessionId: number, user_id: number, success: boolean, details?: any): void => {
    this.logger.info('WhatsApp Session Event', {
      event,
      sessionId,
      user_id,
      success,
      timestamp: new Date().toISOString(),
      ...details
    });
  };

  /**
   * Log subscription events
   */
  public logSubscriptionEvent = (event: string, user_id: number, subscription_id?: number, details?: any): void => {
    this.logger.info('Subscription Event', {
      event,
      user_id,
      subscription_id,
      timestamp: new Date().toISOString(),
      ...details
    });
  };

  /**
   * Log system events
   */
  public logSystemEvent = (event: string, details?: any): void => {
    this.logger.info('System Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  };

  /**
   * Log configuration changes
   */
  public logConfigEvent = (event: string, details?: any): void => {
    this.logger.configEvent(event, details);
  };

  /**
   * Log validation events
   */
  public logValidationEvent = (type: 'contact' | 'template' | 'request', isValid: boolean, errors?: any[]): void => {
    this.logger.validationEvent(type, isValid, errors);
  };
}

export default LoggingMiddleware;
