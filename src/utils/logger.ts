import winston from 'winston';
import { ConfigService } from '../config/ConfigService';

class Logger {
  private logger: winston.Logger;
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = this.createLogger();
  }

  /**
   * Create and configure Winston logger
   */
  private createLogger(): winston.Logger {
    const isDevelopment = this.configService.isDevelopment();
    const loggingConfig = this.configService.getLoggingConfig();

    // Development format
    const developmentFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${level}]: ${message}${metaString}`;
      })
    );

    // Production format
    const productionFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Configure transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        level: loggingConfig.level,
        format: isDevelopment ? developmentFormat : productionFormat,
      })
    ];

    // Add file logging in production
    if (loggingConfig.enableFileLogging && !isDevelopment) {
      transports.push(
        // General logs
        new winston.transports.File({
          filename: `${loggingConfig.logDirectory}/app.log`,
          level: 'info',
          format: productionFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Error logs
        new winston.transports.File({
          filename: `${loggingConfig.logDirectory}/error.log`,
          level: 'error',
          format: productionFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }

    return winston.createLogger({
      level: loggingConfig.level,
      format: productionFormat,
      transports,
      exitOnError: false,
    });
  }

  /**
   * Debug level log
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Info level log
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Warning level log
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Error level log
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else if (error) {
      this.logger.error(message, { error });
    } else {
      this.logger.error(message);
    }
  }

  /**
   * HTTP request log
   */
  httpRequest(method: string, url: string, statusCode: number, responseTime: number): void {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  /**
   * Database operation log
   */
  databaseOperation(operation: string, table: string, success: boolean, duration?: number): void {
    this.logger.info('Database Operation', {
      operation,
      table,
      success,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Authentication event log
   */
  authEvent(event: 'login' | 'logout' | 'register' | 'token_refresh', userId?: number, success: boolean = true): void {
    this.logger.info('Authentication Event', {
      event,
      userId,
      success,
    });
  }

  /**
   * Business logic event log
   */
  businessEvent(event: string, details?: any): void {
    this.logger.info('Business Event', {
      event,
      ...details,
    });
  }

  /**
   * Performance log
   */
  performance(operation: string, duration: number, details?: any): void {
    this.logger.info('Performance', {
      operation,
      duration: `${duration}ms`,
      ...details,
    });
  }

  /**
   * Log validation events
   */
  validationEvent(type: 'contact' | 'template' | 'request' | 'body' | 'query' | 'params' | 'headers' | 'file' | 'files' | 'uuid' | 'email' | 'phone', isValid: boolean, errors?: any[]): void {
    this.logger.info('Validation Event', {
      type,
      isValid,
      errors: errors || [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log message events
   */
  messageEvent(event: 'sent' | 'failed' | 'queued', phoneNumber: string, details?: any): void {
    this.logger.info('Message Event', {
      event,
      phoneNumber,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log configuration events
   */
  configEvent(event: string, details?: any): void {
    this.logger.info('Config Event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get Winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
