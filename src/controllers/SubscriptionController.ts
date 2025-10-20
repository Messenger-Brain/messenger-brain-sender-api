import { Request, Response } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.subscriptionService = SubscriptionService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  /**
   * Get all available subscriptions
   */
  public getAllSubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const active = req.query.active === 'true';
      
      const result = await this.subscriptionService.getAllSubscriptions({ page, limit }, { active });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting subscriptions', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get subscription by ID
   */
  public getSubscriptionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const subscriptionId = parseInt((req.params.id as string) || '0');
      const result = await this.subscriptionService.getSubscriptionById(subscriptionId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting subscription by ID', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get user's current subscription
   */
  public getUserSubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.userId as string) || '0');
      const result = await this.subscriptionService.getUserSubscriptions(userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting user subscription', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create a new user subscription
   */
  public createUserSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const subscriptionData = {
          userId: req.user!.id,
          subscriptionId: parseInt(req.body.subscriptionId),
          statusId: 1 // Default status
        };
      
      const result = await this.subscriptionService.createUserSubscription(subscriptionData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error creating user subscription', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update user subscription status (Admin only)
   */
  public updateUserSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const subscriptionId = parseInt((req.params.id as string) || '0');
        const result = await this.subscriptionService.updateUserSubscription(subscriptionId, req.user!.id, req.body);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error updating user subscription', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Check current user's subscription status
   */
  public checkUserSubscriptionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.subscriptionService.getUserSubscriptionStats(req.user!.id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error checking user subscription status', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get subscription statistics (Admin only)
   */
  public getUserSubscriptionStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const result = await this.subscriptionService.getUserSubscriptionStats(req.user!.id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting subscription stats', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
