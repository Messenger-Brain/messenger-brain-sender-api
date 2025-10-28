import { Request, Response } from 'express';
import { MessageService } from '../services/MessageService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class MessageController {
  private messageService: MessageService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.messageService = MessageService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  /**
   * Send a single message
   */
  public createMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
        return;
      }


      // Map from API format to internal format
      const messageData = {
        whatsappSessionId: req.body.sessionId,
        remoteJid: req.body.phoneNumber,
        message: { conversation: req.body.message },
        statusId: req.body.statusId || 1,
        sentAt: req.body.sentAt ? new Date(req.body.sentAt) : new Date(),
        key: { id: `msg_${Date.now()}_${Math.random()}` },
        userId
      };

      const result = await this.messageService.createMessage(messageData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error sending message', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send bulk messages
   */
  public sendBulkMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.messageService.sendBulkMessages(req.body);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error sending bulk messages', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get message by ID
   */
  public getMessageById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const messageId = parseInt((req.params.id as string) || '0');
      const result = await this.messageService.getMessageById(messageId, req.user!.id);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting message by ID', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get messages by session ID
   */
  public getMessagesBySession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sessionId = parseInt((req.params.sessionId as string) || '0');
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');

      const result = await this.messageService.getMessagesBySession(sessionId, req.user!.id, { page, limit });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting messages by session', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get message statistics
   */
  public getMessageStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.messageService.getMessageStats(req.user!.id);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting message stats', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
