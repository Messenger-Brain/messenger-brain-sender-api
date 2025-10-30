import { Request, Response } from "express";
import { FetchContactsJobService } from "../services/FetchContactsJobService";
import { ValidationMiddleware } from "../middleware/validation";
import { LoggingMiddleware } from "../middleware/logging";
import { RateLimitMiddleware } from "../middleware/rateLimit";
import Logger from "../utils/logger";
import { AuthenticatedRequest } from "../types";
import WhatsAppSession from "../models/WhatsAppSession";
import WhatsAppContactsFetcherService from "../services/WhatsAppContactsFetcherService";

export class FetchContactsJobController {
  private jobService: FetchContactsJobService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.jobService = FetchContactsJobService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  /**
   * Get all fetch contacts jobs with pagination
   */
  public getJobs = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const statusId = req.query.status_id
        ? parseInt(req.query.status_id as string)
        : undefined;
      const userId = req.query.user_id
        ? parseInt(req.query.user_id as string)
        : undefined;

      const result = await this.jobService.getJobs(
        page,
        limit,
        statusId,
        userId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error("Error getting jobs", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Create a new fetch contacts job
   */
  public createJob = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { whatsapp_session_id, delay, priority } = req.body;

      const whatsappSession = await WhatsAppSession.findByPk(
        whatsapp_session_id
      );
      if (!whatsappSession) {
        res.status(404).json({
          success: false,
          message: `WhatsApp session ${whatsapp_session_id} not found`,
        });
        return;
      }

      const browserContextId = whatsappSession.browser_context_id;
      if (!browserContextId) {
        res.status(400).json({
          success: false,
          message: `Session ${whatsapp_session_id} has no browser context assigned`,
        });
        return;
      }
      
      const fetcherService = WhatsAppContactsFetcherService.getInstance();
      const result = await fetcherService.fetchContacts(
        browserContextId,
        whatsapp_session_id,
        delay,
        priority
      );

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error("Error creating job", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Get fetch contacts job by ID
   */
  public getJobById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || "0");
      const result = await this.jobService.getJobById(jobId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error("Error getting job by ID", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Start a fetch contacts job
   */
  public startJob = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || "0");
      const result = await this.jobService.startJob(jobId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error("Error starting job", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Pause a fetch contacts job
   */
  public pauseJob = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || "0");
      const result = await this.jobService.pauseJob(jobId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error("Error pausing job", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Resume a paused fetch contacts job
   */
  public resumeJob = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || "0");
      const result = await this.jobService.resumeJob(jobId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error("Error resuming job", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Cancel a fetch contacts job
   */
  public cancelJob = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || "0");
      const result = await this.jobService.cancelJob(jobId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error("Error cancelling job", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Delete a fetch contacts job
   */
  public deleteJob = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const jobId = parseInt((req.params.id as string) || "0");
      const result = await this.jobService.deleteJob(jobId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error("Error deleting job", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * Get fetch contacts jobs statistics
   */
  public getJobStats = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const result = await this.jobService.getJobStats();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error("Error getting job stats", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
