import { Request, Response } from 'express';
import { SendMessageJobService } from '../services/SendMessageJobService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export class SendMessageJobController {
  private jobService: SendMessageJobService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.jobService = SendMessageJobService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  /**
   * Get all send message jobs with pagination
   */
  public getJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const statusId = req.query.statusId ? parseInt(req.query.statusId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const result = await this.jobService.getJobs(page, limit, statusId, userId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting jobs', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create a new send message job
   */
  public createJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const result = await this.jobService.createJob(jobData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error creating job', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get send message job by ID
   */
  public getJobById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || '0');
      const result = await this.jobService.getJobById(jobId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting job by ID', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Start a send message job
   */
  public startJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || '0');
      const result = await this.jobService.startJob(jobId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error starting job', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Pause a send message job
   */
  public pauseJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || '0');
      const result = await this.jobService.pauseJob(jobId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error pausing job', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Resume a paused send message job
   */
  public resumeJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || '0');
      const result = await this.jobService.resumeJob(jobId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error resuming job', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Cancel a send message job
   */
  public cancelJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || '0');
      const result = await this.jobService.cancelJob(jobId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Error cancelling job', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete a send message job
   */
  public deleteJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || '0');
      const result = await this.jobService.deleteJob(jobId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Error deleting job', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get send message jobs statistics
   */
  public getJobStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.jobService.getJobStats();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Error getting job stats', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
