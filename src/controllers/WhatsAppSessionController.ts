import { Request, Response } from 'express';
import { WhatsAppSessionService } from '../services/WhatsAppSessionService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import Joi from 'joi';

export class WhatsAppSessionController {
  private static instance: WhatsAppSessionController;
  private sessionService: WhatsAppSessionService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.sessionService = WhatsAppSessionService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): WhatsAppSessionController {
    if (!WhatsAppSessionController.instance) {
      WhatsAppSessionController.instance = new WhatsAppSessionController();
    }
    return WhatsAppSessionController.instance;
  }

  /**
   * Validation schemas
   */
  private readonly createSessionSchema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    countryPrefix: Joi.string().max(10).default('+506'),
    accountProtection: Joi.boolean().default(true),
    logMessages: Joi.boolean().default(true),
    readIncomingMessages: Joi.boolean().default(false),
    autoRejectCalls: Joi.boolean().default(false),
    webhookUrl: Joi.string().uri().optional(),
    webhookEnabled: Joi.boolean().default(false),
    webhookEvents: Joi.array().items(Joi.string()).default(['session.status'])
  });

  private readonly updateSessionSchema = Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    accountProtection: Joi.boolean().optional(),
    logMessages: Joi.boolean().optional(),
    readIncomingMessages: Joi.boolean().optional(),
    autoRejectCalls: Joi.boolean().optional(),
    webhookUrl: Joi.string().uri().optional(),
    webhookEnabled: Joi.boolean().optional(),
    webhookEvents: Joi.array().items(Joi.string()).optional()
  });

  private readonly getSessionsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    statusId: Joi.number().integer().min(1).optional(),
    userId: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().valid('id', 'name', 'phoneNumber', 'createdAt', 'updatedAt').default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  });

  private readonly getSessionByIdSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
  });

  private readonly connectSessionSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
  });

  private readonly disconnectSessionSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
  });

  private readonly selectSessionSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
  });

  /**
   * Create a new WhatsApp session
   * @route POST /api/whatsapp-sessions
   */
  public createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
        return;
      }

      this.logger.info('WhatsApp session creation attempt', { 
        userId, 
        phoneNumber: req.body.phoneNumber 
      });

      const result = await this.sessionService.createSession(req.body);

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('session_created', result.data?.id || 0, userId, true, {
          phoneNumber: req.body.phoneNumber,
          name: req.body.name
        });
        res.status(201).json(result);
      } else {
        this.logger.warn('WhatsApp session creation failed', { 
          userId, 
          phoneNumber: req.body.phoneNumber, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session creation error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Session creation failed'
      });
    }
  };

  /**
   * Get list of WhatsApp sessions with pagination and filters
   * @route GET /api/whatsapp-sessions
   */
  public getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        statusId: req.query.statusId ? parseInt(req.query.statusId as string) : undefined,
        userId: userRole === 'admin' ? (req.query.userId ? parseInt(req.query.userId as string) : undefined) : userId,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as string) || 'DESC'
      };

      this.logger.info('WhatsApp sessions list request', { filters });

      // TODO: Implement get sessions functionality
      const result = { success: true, data: { sessions: [], total: 0, totalPages: 0, currentPage: filters.page } };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Get WhatsApp sessions error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get sessions'
      });
    }
  };

  /**
   * Get WhatsApp session by ID
   * @route GET /api/whatsapp-sessions/:id
   */
  public getSessionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('Get WhatsApp session by ID request', { sessionId, userId });

      const result = await this.sessionService.getSessionById(sessionId, userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get WhatsApp session by ID error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get session'
      });
    }
  };

  /**
   * Update WhatsApp session
   * @route PUT /api/whatsapp-sessions/:id
   */
  public updateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('WhatsApp session update attempt', { sessionId, userId });

      const result = await this.sessionService.updateSession(sessionId, userId, req.body);

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('session_updated', sessionId, userId, true, req.body);
        res.status(200).json(result);
      } else {
        this.logger.warn('WhatsApp session update failed', { 
          sessionId, 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session update error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Session update failed'
      });
    }
  };

  /**
   * Delete WhatsApp session
   * @route DELETE /api/whatsapp-sessions/:id
   */
  public deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('WhatsApp session deletion attempt', { sessionId, userId });

      const result = await this.sessionService.deleteSession(sessionId, userId);

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('session_deleted', sessionId, userId, true);
        res.status(200).json(result);
      } else {
        this.logger.warn('WhatsApp session deletion failed', { 
          sessionId, 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session deletion error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Session deletion failed'
      });
    }
  };

  /**
   * Connect WhatsApp session
   * @route POST /api/whatsapp-sessions/:id/connect
   */
  public connectSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('WhatsApp session connect attempt', { sessionId, userId });

      const result = await this.sessionService.connectSession(sessionId, userId);

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('session_connected', sessionId, userId, true);
        res.status(200).json(result);
      } else {
        this.logger.warn('WhatsApp session connect failed', { 
          sessionId, 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session connect error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Session connection failed'
      });
    }
  };

  /**
   * Disconnect WhatsApp session
   * @route POST /api/whatsapp-sessions/:id/disconnect
   */
  public disconnectSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('WhatsApp session disconnect attempt', { sessionId, userId });

      const result = await this.sessionService.disconnectSession(sessionId, userId);

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('session_disconnected', sessionId, userId, true);
        res.status(200).json(result);
      } else {
        this.logger.warn('WhatsApp session disconnect failed', { 
          sessionId, 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session disconnect error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Session disconnection failed'
      });
    }
  };

  /**
   * Select WhatsApp session (mark as active)
   * @route POST /api/whatsapp-sessions/:id/select
   */
  public selectSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('WhatsApp session select attempt', { sessionId, userId });

      // TODO: Implement select session functionality
      const result = { success: true, message: 'Session selected successfully' };

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('session_selected', sessionId, userId, true);
        res.status(200).json(result);
      } else {
        this.logger.warn('WhatsApp session select failed', { 
          sessionId, 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session select error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Session selection failed'
      });
    }
  };

  /**
   * Get session QR code
   * @route GET /api/whatsapp-sessions/:id/qr
   */
  public getSessionQR = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('Get WhatsApp session QR request', { sessionId, userId });

      // TODO: Implement get session QR functionality
      const result = { success: true, data: { qrCode: 'sample-qr-code' } };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get WhatsApp session QR error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get QR code'
      });
    }
  };

  /**
   * Refresh session QR code
   * @route POST /api/whatsapp-sessions/:id/qr/refresh
   */
  public refreshQR = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('WhatsApp session QR refresh attempt', { sessionId, userId });

      // TODO: Implement refresh QR functionality
      const result = { success: true, message: 'QR code refreshed successfully' };

      if (result.success) {
        this.loggingMiddleware.logWhatsAppEvent('qr_refreshed', sessionId, userId, true);
        res.status(200).json(result);
      } else {
        this.logger.warn('WhatsApp session QR refresh failed', { 
          sessionId, 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('WhatsApp session QR refresh error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'QR refresh failed'
      });
    }
  };

  /**
   * Get session status
   * @route GET /api/whatsapp-sessions/:id/status
   */
  public getSessionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.id as string) || '0');
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('Get WhatsApp session status request', { sessionId, userId });

      const result = await this.sessionService.getSessionStatus(sessionId, userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get WhatsApp session status error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get session status'
      });
    }
  };

  /**
   * Get user's sessions
   * @route GET /api/whatsapp-sessions/user/:userId
   */
  public getUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = parseInt((req.params.userId as string) || '0');
      const currentUserId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      // Only allow if admin or accessing own sessions
      if (userRole !== 'admin' && currentUserId !== targetUserId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'You can only access your own sessions'
        });
        return;
      }

      this.logger.info('Get user WhatsApp sessions request', { targetUserId, currentUserId });

      const result = await this.sessionService.getUserSessions(targetUserId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get user WhatsApp sessions error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get user sessions'
      });
    }
  };

  /**
   * Get session statistics
   * @route GET /api/whatsapp-sessions/stats
   */
  public getSessionStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      this.logger.info('Get WhatsApp session stats request', { userId });

      // TODO: Implement general session stats method
      const result = { success: true, message: 'Session stats retrieved successfully', data: {} };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Get WhatsApp session stats error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get session statistics'
      });
    }
  };

  /**
   * Health check for WhatsApp session service
   * @route GET /api/whatsapp-sessions/health
   */
  public healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'WhatsApp session service is healthy',
        timestamp: new Date().toISOString(),
        service: 'whatsapp-sessions'
      });
    } catch (error) {
      this.logger.error('WhatsApp session health check error', error);
      res.status(500).json({
        success: false,
        message: 'WhatsApp session service is unhealthy',
        error: 'Health check failed'
      });
    }
  };

  /**
   * Get validation middleware for each endpoint
   */
  public getValidationMiddleware() {
    return {
      createSession: this.validationMiddleware.validateBody(this.createSessionSchema),
      updateSession: this.validationMiddleware.validateBody(this.updateSessionSchema),
      getSessions: this.validationMiddleware.validateQuery(this.getSessionsSchema),
      getSessionById: this.validationMiddleware.validateParams(this.getSessionByIdSchema),
      connectSession: this.validationMiddleware.validateParams(this.connectSessionSchema),
      disconnectSession: this.validationMiddleware.validateParams(this.disconnectSessionSchema),
      selectSession: this.validationMiddleware.validateParams(this.selectSessionSchema)
    };
  }

  /**
   * Get rate limiting middleware for each endpoint
   */
  public getRateLimitMiddleware() {
    return {
      createSession: this.rateLimitMiddleware.adminRateLimit(5, 900000), // 5 per 15 minutes
      getSessions: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getSessionById: this.rateLimitMiddleware.adminRateLimit(200, 900000), // 200 per 15 minutes
      updateSession: this.rateLimitMiddleware.adminRateLimit(20, 900000), // 20 per 15 minutes
      deleteSession: this.rateLimitMiddleware.adminRateLimit(5, 900000), // 5 per 15 minutes
      connectSession: this.rateLimitMiddleware.adminRateLimit(10, 900000), // 10 per 15 minutes
      disconnectSession: this.rateLimitMiddleware.adminRateLimit(10, 900000), // 10 per 15 minutes
      selectSession: this.rateLimitMiddleware.adminRateLimit(20, 900000), // 20 per 15 minutes
      getSessionQR: this.rateLimitMiddleware.adminRateLimit(50, 900000), // 50 per 15 minutes
      refreshQR: this.rateLimitMiddleware.adminRateLimit(10, 900000), // 10 per 15 minutes
      getSessionStatus: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getUserSessions: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getSessionStats: this.rateLimitMiddleware.adminRateLimit(50, 900000) // 50 per 15 minutes
    };
  }
}

export default WhatsAppSessionController;
