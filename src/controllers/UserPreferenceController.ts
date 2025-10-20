import { Request, Response } from 'express';
import { UserPreferenceService } from '../services/UserPreferenceService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class UserPreferenceController {
  private preferenceService: UserPreferenceService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.preferenceService = UserPreferenceService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  /**
   * Get all user preferences with pagination
   */
  public getUserPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : req.user!.id;
      
      const result = await this.preferenceService.getUserPreferences(userId, { page, limit });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting user preferences', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create a new user preference
   */
  public createUserPreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const preferenceData = {
        ...req.body,
        user_id: req.user!.id
      };
      
      const result = await this.preferenceService.createUserPreference(preferenceData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error creating user preference', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get user preference by ID
   */
  public getUserPreferenceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const preferenceId = parseInt((req.params.id as string) || '0');
      const result = await this.preferenceService.getUserPreferenceById(preferenceId, req.user!.id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting user preference by ID', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update user preference by ID
   */
  public updateUserPreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const preferenceId = parseInt((req.params.id as string) || '0');
      const result = await this.preferenceService.updateUserPreference(preferenceId, req.user!.id, req.body);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error updating user preference', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete user preference by ID
   */
  public deleteUserPreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const preferenceId = parseInt((req.params.id as string) || '0');
      const result = await this.preferenceService.deleteUserPreference(preferenceId, req.user!.id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error deleting user preference', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get all system preferences
   */
  public getSystemPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.preferenceService.getSystemPreferences();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting system preferences', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get all user preference statuses
   */
  public getUserPreferenceStatuses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.preferenceService.getUserPreferenceStats(req.user!.id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting user preference statuses', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
