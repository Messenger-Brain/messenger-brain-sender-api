import SendMessageJob from '../models/SendMessageJob';
import SendMessageJobStatus from '../models/SendMessageJobStatus';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { Op } from 'sequelize';
import { 
  CreateSendMessageJobRequest,
  UpdateSendMessageJobRequest,
  PaginationQuery,
  FilterQuery,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export interface SendMessageJobServiceInterface {
  createJob(jobData: CreateSendMessageJobRequest): Promise<ApiResponse<SendMessageJob>>;
  getJobById(jobId: number): Promise<ApiResponse<SendMessageJob>>;
  getAllJobs(pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<SendMessageJob>>;
  updateJob(jobId: number, jobData: UpdateSendMessageJobRequest): Promise<ApiResponse<SendMessageJob>>;
  deleteJob(jobId: number): Promise<ApiResponse<void>>;
  getJobsByStatus(statusSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<SendMessageJob>>;
  updateJobStatus(jobId: number, statusSlug: string, log?: any): Promise<ApiResponse<SendMessageJob>>;
  getJobStats(): Promise<ApiResponse<any>>;
  getJobStatsByStatus(): Promise<ApiResponse<any>>;
  searchJobs(searchTerm: string, pagination?: PaginationQuery): Promise<PaginatedResponse<SendMessageJob>>;
  getJobsByDateRange(dateFrom: string, dateTo: string, pagination?: PaginationQuery): Promise<PaginatedResponse<SendMessageJob>>;
  cancelJob(jobId: number): Promise<ApiResponse<SendMessageJob>>;
  retryJob(jobId: number): Promise<ApiResponse<SendMessageJob>>;
  getJobLogs(jobId: number): Promise<ApiResponse<any>>;
  addJobLog(jobId: number, logEntry: any): Promise<ApiResponse<void>>;
}

export class SendMessageJobService implements SendMessageJobServiceInterface {
  private static instance: SendMessageJobService;
  private configService: ConfigService;
  private logger: typeof Logger;

  constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): SendMessageJobService {
    if (!SendMessageJobService.instance) {
      SendMessageJobService.instance = new SendMessageJobService();
    }
    return SendMessageJobService.instance;
  }

  /**
   * Create a new send message job
   */
  public async createJob(jobData: CreateSendMessageJobRequest): Promise<ApiResponse<SendMessageJob>> {
    try {
      this.logger.info('Creating send message job', { statusId: jobData.statusId });

      // Create job
      const job = await SendMessageJob.create({
        statusId: jobData.statusId,
        log: jobData.log
      });

      // Get job with relations
      const jobWithRelations = await this.getJobById(job.id);

      this.logger.info('Send message job created successfully', { jobId: job.id });

      return {
        success: true,
        message: 'Send message job created successfully',
        data: jobWithRelations.data!
      };

    } catch (error) {
      this.logger.error('Failed to create send message job', error);
      return {
        success: false,
        message: 'Failed to create send message job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get job by ID
   */
  public async getJobById(jobId: number): Promise<ApiResponse<SendMessageJob>> {
    try {
      const job = await SendMessageJob.findByPk(jobId, {
        include: [
          {
            model: SendMessageJobStatus
          }
        ]
      });

      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      return {
        success: true,
        message: 'Job retrieved successfully',
        data: job
      };

    } catch (error) {
      this.logger.error('Failed to get job by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all jobs with pagination and filters
   */
  public async getAllJobs(pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<PaginatedResponse<SendMessageJob>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = {};
      
      if (filters.status) {
        whereClause.statusId = await this.getStatusIdBySlug(filters.status);
      }

      if (filters.dateFrom && filters.dateTo) {
        whereClause.createdAt = {
          [Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo)]
        };
      }

      // Get jobs with pagination
      const { count, rows } = await SendMessageJob.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SendMessageJobStatus
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Jobs retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get all jobs', error);
      return {
        success: false,
        message: 'Failed to retrieve jobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Update job
   */
  public async updateJob(jobId: number, jobData: UpdateSendMessageJobRequest): Promise<ApiResponse<SendMessageJob>> {
    try {
      this.logger.info('Updating send message job', { jobId });

      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      // Update job
      await job.update(jobData);

      const updatedJob = await this.getJobById(jobId);

      this.logger.info('Send message job updated successfully', { jobId });

      return {
        success: true,
        message: 'Job updated successfully',
        data: updatedJob.data!
      };

    } catch (error) {
      this.logger.error('Failed to update job', error);
      return {
        success: false,
        message: 'Failed to update job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete job
   */
  public async deleteJob(jobId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting send message job', { jobId });

      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      // Delete job
      await job.destroy();

      this.logger.info('Send message job deleted successfully', { jobId });

      return {
        success: true,
        message: 'Job deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete job', error);
      return {
        success: false,
        message: 'Failed to delete job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get jobs by status
   */
  public async getJobsByStatus(statusSlug: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<SendMessageJob>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const statusId = await this.getStatusIdBySlug(statusSlug);

      const { count, rows } = await SendMessageJob.findAndCountAll({
        where: { statusId },
        include: [
          {
            model: SendMessageJobStatus
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Jobs retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get jobs by status', error);
      return {
        success: false,
        message: 'Failed to retrieve jobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Update job status
   */
  public async updateJobStatus(jobId: number, statusSlug: string, log?: any): Promise<ApiResponse<SendMessageJob>> {
    try {
      this.logger.info('Updating job status', { jobId, statusSlug });

      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      const statusId = await this.getStatusIdBySlug(statusSlug);

      // Update job status and log
      const updateData: any = { statusId };
      if (log) {
        updateData.log = log;
      }

      await job.update(updateData);

      const updatedJob = await this.getJobById(jobId);

      this.logger.info('Job status updated successfully', { jobId, statusSlug });

      return {
        success: true,
        message: 'Job status updated successfully',
        data: updatedJob.data!
      };

    } catch (error) {
      this.logger.error('Failed to update job status', error);
      return {
        success: false,
        message: 'Failed to update job status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get job statistics
   */
  public async getJobStats(): Promise<ApiResponse<any>> {
    try {
      const totalJobs = await SendMessageJob.count();
      const pendingJobs = await SendMessageJob.count({
        where: { statusId: await this.getStatusIdBySlug('pending') }
      });
      const processingJobs = await SendMessageJob.count({
        where: { statusId: await this.getStatusIdBySlug('processing') }
      });
      const completedJobs = await SendMessageJob.count({
        where: { statusId: await this.getStatusIdBySlug('completed') }
      });
      const failedJobs = await SendMessageJob.count({
        where: { statusId: await this.getStatusIdBySlug('failed') }
      });

      const stats = {
        totalJobs,
        pendingJobs,
        processingJobs,
        completedJobs,
        failedJobs
      };

      return {
        success: true,
        message: 'Job statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get job stats', error);
      return {
        success: false,
        message: 'Failed to retrieve job statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get job statistics by status
   */
  public async getJobStatsByStatus(): Promise<ApiResponse<any>> {
    try {
      const statusStats = await SendMessageJob.findAll({
        attributes: ['statusId'],
        include: [
          {
            model: SendMessageJobStatus,
            attributes: ['slug', 'description']
          }
        ],
        group: ['statusId'],
        raw: false
      });

      const stats = statusStats.map((stat: any) => ({
        status: stat.SendMessageJobStatus?.slug,
        description: stat.SendMessageJobStatus?.description,
        count: stat.count
      }));

      return {
        success: true,
        message: 'Job statistics by status retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get job stats by status', error);
      return {
        success: false,
        message: 'Failed to retrieve job statistics by status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search jobs
   */
  public async searchJobs(searchTerm: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<SendMessageJob>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      // Search in log field (JSON search)
      const { count, rows } = await SendMessageJob.findAndCountAll({
        where: {
          log: {
            [Op.like]: `%${searchTerm}%`
          }
        },
        include: [
          {
            model: SendMessageJobStatus
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Search completed successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to search jobs', error);
      return {
        success: false,
        message: 'Search failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get jobs by date range
   */
  public async getJobsByDateRange(dateFrom: string, dateTo: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<SendMessageJob>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await SendMessageJob.findAndCountAll({
        where: {
          createdAt: {
            [Op.between]: [new Date(dateFrom), new Date(dateTo)]
          }
        },
        include: [
          {
            model: SendMessageJobStatus
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Jobs retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get jobs by date range', error);
      return {
        success: false,
        message: 'Failed to retrieve jobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Cancel job
   */
  public async cancelJob(jobId: number): Promise<ApiResponse<SendMessageJob>> {
    try {
      this.logger.info('Cancelling job', { jobId });

      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      // Update job status to cancelled
      const cancelledStatusId = await this.getStatusIdBySlug('cancelled');
      await job.update({ 
        statusId: cancelledStatusId,
        log: {
          ...job.log,
          cancelledAt: new Date().toISOString(),
          reason: 'Job cancelled by user'
        }
      });

      const updatedJob = await this.getJobById(jobId);

      this.logger.info('Job cancelled successfully', { jobId });

      return {
        success: true,
        message: 'Job cancelled successfully',
        data: updatedJob.data!
      };

    } catch (error) {
      this.logger.error('Failed to cancel job', error);
      return {
        success: false,
        message: 'Failed to cancel job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Retry job
   */
  public async retryJob(jobId: number): Promise<ApiResponse<SendMessageJob>> {
    try {
      this.logger.info('Retrying job', { jobId });

      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      // Update job status to pending for retry
      const pendingStatusId = await this.getStatusIdBySlug('pending');
      await job.update({ 
        statusId: pendingStatusId,
        log: {
          ...job.log,
          retriedAt: new Date().toISOString(),
          retryCount: (job.log?.retryCount || 0) + 1
        }
      });

      const updatedJob = await this.getJobById(jobId);

      this.logger.info('Job retry initiated successfully', { jobId });

      return {
        success: true,
        message: 'Job retry initiated successfully',
        data: updatedJob.data!
      };

    } catch (error) {
      this.logger.error('Failed to retry job', error);
      return {
        success: false,
        message: 'Failed to retry job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get job logs
   */
  public async getJobLogs(jobId: number): Promise<ApiResponse<any>> {
    try {
      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      return {
        success: true,
        message: 'Job logs retrieved successfully',
        data: job.log || {}
      };

    } catch (error) {
      this.logger.error('Failed to get job logs', error);
      return {
        success: false,
        message: 'Failed to retrieve job logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get jobs with filters
   */
  public async getJobs(page: number = 1, limit: number = 10, statusId?: number, userId?: number): Promise<PaginatedResponse<SendMessageJob>> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = {};

      if (statusId) {
        whereClause.statusId = statusId;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      const { count, rows } = await SendMessageJob.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: SendMessageJobStatus,
            as: 'status'
          }
        ]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Jobs retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Failed to get jobs', error);
      return {
        success: false,
        message: 'Failed to get jobs',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Start a job
   */
  public async startJob(jobId: number): Promise<ApiResponse<SendMessageJob>> {
    try {
      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      const runningStatusId = await this.getStatusIdBySlug('running');
      await job.update({ 
        statusId: runningStatusId
      });

      return {
        success: true,
        message: 'Job started successfully',
        data: job
      };
    } catch (error) {
      this.logger.error('Failed to start job', error);
      return {
        success: false,
        message: 'Failed to start job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Pause a job
   */
  public async pauseJob(jobId: number): Promise<ApiResponse<SendMessageJob>> {
    try {
      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      const pausedStatusId = await this.getStatusIdBySlug('paused');
      await job.update({ statusId: pausedStatusId });

      return {
        success: true,
        message: 'Job paused successfully',
        data: job
      };
    } catch (error) {
      this.logger.error('Failed to pause job', error);
      return {
        success: false,
        message: 'Failed to pause job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resume a job
   */
  public async resumeJob(jobId: number): Promise<ApiResponse<SendMessageJob>> {
    try {
      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      const runningStatusId = await this.getStatusIdBySlug('running');
      await job.update({ statusId: runningStatusId });

      return {
        success: true,
        message: 'Job resumed successfully',
        data: job
      };
    } catch (error) {
      this.logger.error('Failed to resume job', error);
      return {
        success: false,
        message: 'Failed to resume job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add job log entry
   */
  public async addJobLog(jobId: number, logEntry: any): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Adding job log entry', { jobId });

      const job = await SendMessageJob.findByPk(jobId);
      if (!job) {
        return {
          success: false,
          message: 'Job not found'
        };
      }

      // Merge new log entry with existing logs
      const existingLogs = job.log || {};
      const updatedLogs = {
        ...existingLogs,
        [`log_${Date.now()}`]: {
          timestamp: new Date().toISOString(),
          ...logEntry
        }
      };

      await job.update({ log: updatedLogs });

      this.logger.info('Job log entry added successfully', { jobId });

      return {
        success: true,
        message: 'Job log entry added successfully'
      };

    } catch (error) {
      this.logger.error('Failed to add job log entry', error);
      return {
        success: false,
        message: 'Failed to add job log entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Helper method to get status ID by slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await SendMessageJobStatus.findOne({ where: { slug } });
    return status?.id || 1; // Default to first status
  }
}

export default SendMessageJobService;
