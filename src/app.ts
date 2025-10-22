import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ConfigService } from './config/ConfigService';
import { setupSwagger } from './config/swagger';
import routes from './routes';
import { setupAssociations } from './models';
import { sequelize } from './config/sequelize';
import Logger from './utils/logger';
import { BrowserContextService } from './services/BrowserContextService';
import { RedisService } from './services/RedisService';
import { WhatsAppMessageSenderService } from './services/WhatsAppMessageSenderService';

export class App {
  public app: Application;
  private configService: ConfigService;

  constructor() {
    this.app = express();
    this.configService = ConfigService.getInstance();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    const corsConfig = this.configService.getCORSConfig();
    this.app.use(cors({
      origin: corsConfig.origin,
      credentials: corsConfig.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (this.configService.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      Logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Swagger documentation
    setupSwagger(this.app);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Messenger Brain Sender API',
        version: '1.0.0',
        documentation: '/api-docs'
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      Logger.error('Unhandled error', error);

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: this.configService.isDevelopment() ? error.message : 'Something went wrong'
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      Logger.error('Uncaught Exception', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      Logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
  }

  public async initialize(): Promise<void> {
    try {
      // Test database connection
      await sequelize.authenticate();
      Logger.info('Database connection established successfully');

      // Setup model associations
      setupAssociations();
      Logger.info('Model associations setup completed');

      // Database schema is managed by migrations, no sync needed
      Logger.info('Database schema managed by migrations');

      // Initialize Redis service
      const redisService = RedisService.getInstance();
      const redisConnected = await redisService.ping();
      if (redisConnected) {
        Logger.info('Redis connection established successfully');
      } else {
        Logger.warn('Redis connection failed, message queuing may not work properly');
      }

      // Initialize Puppeteer browser
      const browserContextService = BrowserContextService.getInstance();
      await browserContextService.initializeBrowser();
      Logger.info('Puppeteer browser initialized successfully');

      // Initialize WhatsApp message sender service (this starts the workers)
      WhatsAppMessageSenderService.getInstance();
      Logger.info('WhatsApp message sender service initialized successfully');

    } catch (error) {
      Logger.error('Failed to initialize application', error);
      throw error;
    }
  }

  public listen(): void {
    const port = this.configService.getServerConfig().port;
    
    this.app.listen(port, () => {
      Logger.info(`Server running on port ${port}`);
      Logger.info(`Environment: ${this.configService.getServerConfig().environment}`);
      Logger.info(`API Documentation: http://localhost:${port}/api-docs`);
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public async close(): Promise<void> {
    try {
      // Close message queue service
      const messageQueueService = await import('./services/MessageQueueService').then(m => m.MessageQueueService.getInstance());
      await messageQueueService.close();
      Logger.info('Message queue service closed');

      // Close browser context service
      const browserContextService = BrowserContextService.getInstance();
      await browserContextService.shutdown();
      Logger.info('Browser context service closed');

      // Close Redis connection
      const redisService = RedisService.getInstance();
      await redisService.disconnect();
      Logger.info('Redis connection closed');

      // Close database connection
      await sequelize.close();
      Logger.info('Database connection closed');
    } catch (error) {
      Logger.error('Error closing services', error);
    }
  }
}

export default App;
