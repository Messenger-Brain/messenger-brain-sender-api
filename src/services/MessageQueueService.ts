import Bull, { Queue, Job, JobOptions } from 'bull';
import { ConfigService } from '../config/ConfigService';
import { RedisService } from './RedisService';
import Logger from '../utils/logger';

export interface MessageJobData {
  browser_context_id: number;
  to: string;
  message: string;
  send_message_job_id?: number;
  metadata?: any;
}

export interface BulkMessageJobData {
  browser_context_id: number;
  messages: Array<{
    to: string;
    message: string;
  }>;
  send_message_job_id?: number;
  delay?: number;
}

export class MessageQueueService {
  private static instance: MessageQueueService;
  private messageQueue: Queue<MessageJobData>;
  private bulkMessageQueue: Queue<BulkMessageJobData>;
  private configService: ConfigService;
  private redisService: RedisService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.redisService = RedisService.getInstance();
    this.logger = Logger;

    this.messageQueue = this.createMessageQueue();
    this.bulkMessageQueue = this.createBulkMessageQueue();

    this.setupQueueEventHandlers();
  }

  public static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  private createMessageQueue(): Queue<MessageJobData> {
    const redisConfig = this.configService.getRedisConfig();

    const queue = new Bull<MessageJobData>('message-sending', {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        ...(redisConfig.password && { password: redisConfig.password }),
        db: redisConfig.db,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.logger.info('Message queue created successfully');
    return queue;
  }

  private createBulkMessageQueue(): Queue<BulkMessageJobData> {
    const redisConfig = this.configService.getRedisConfig();

    const queue = new Bull<BulkMessageJobData>('bulk-message-sending', {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        ...(redisConfig.password && { password: redisConfig.password }),
        db: redisConfig.db,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.logger.info('Bulk message queue created successfully');
    return queue;
  }

  private setupQueueEventHandlers(): void {
    // Message Queue Events
    this.messageQueue.on('completed', (job: Job<MessageJobData>) => {
      this.logger.info(`Message job completed`, {
        jobId: job.id,
        to: job.data.to,
        browser_context_id: job.data.browser_context_id,
      });
    });

    this.messageQueue.on('failed', (job: Job<MessageJobData>, error: Error) => {
      this.logger.error(`Message job failed`, {
        jobId: job.id,
        to: job.data.to,
        error: error.message,
      });
    });

    this.messageQueue.on('stalled', (job: Job<MessageJobData>) => {
      this.logger.warn(`Message job stalled`, {
        jobId: job.id,
        to: job.data.to,
      });
    });

    // Bulk Message Queue Events
    this.bulkMessageQueue.on('completed', (job: Job<BulkMessageJobData>) => {
      this.logger.info(`Bulk message job completed`, {
        jobId: job.id,
        messageCount: job.data.messages.length,
        browser_context_id: job.data.browser_context_id,
      });
    });

    this.bulkMessageQueue.on('failed', (job: Job<BulkMessageJobData>, error: Error) => {
      this.logger.error(`Bulk message job failed`, {
        jobId: job.id,
        messageCount: job.data.messages.length,
        error: error.message,
      });
    });

    this.bulkMessageQueue.on('progress', (job: Job<BulkMessageJobData>, progress: number) => {
      this.logger.info(`Bulk message job progress`, {
        jobId: job.id,
        progress: `${progress}%`,
      });
    });
  }

  public async addMessageJob(
    data: MessageJobData,
    options?: JobOptions
  ): Promise<Job<MessageJobData>> {
    try {
      const job = await this.messageQueue.add(data, {
        priority: options?.priority || 5,
        delay: options?.delay || 0,
        ...options,
      });

      this.logger.info(`Message job added to queue`, {
        jobId: job.id,
        to: data.to,
        browser_context_id: data.browser_context_id,
      });

      return job;
    } catch (error) {
      this.logger.error('Error adding message job to queue', error);
      throw error;
    }
  }

  public async addBulkMessageJob(
    data: BulkMessageJobData,
    options?: JobOptions
  ): Promise<Job<BulkMessageJobData>> {
    try {
      const job = await this.bulkMessageQueue.add(data, {
        priority: options?.priority || 3,
        delay: options?.delay || 0,
        ...options,
      });

      this.logger.info(`Bulk message job added to queue`, {
        jobId: job.id,
        messageCount: data.messages.length,
        browser_context_id: data.browser_context_id,
      });

      return job;
    } catch (error) {
      this.logger.error('Error adding bulk message job to queue', error);
      throw error;
    }
  }

  public async getJob(jobId: string): Promise<Job<MessageJobData> | null> {
    try {
      return await this.messageQueue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Error getting job ${jobId}`, error);
      throw error;
    }
  }

  public async getBulkJob(jobId: string): Promise<Job<BulkMessageJobData> | null> {
    try {
      return await this.bulkMessageQueue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Error getting bulk job ${jobId}`, error);
      throw error;
    }
  }

  public async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.info(`Job ${jobId} removed`);
      }
    } catch (error) {
      this.logger.error(`Error removing job ${jobId}`, error);
      throw error;
    }
  }

  public async pauseQueue(): Promise<void> {
    try {
      await this.messageQueue.pause();
      await this.bulkMessageQueue.pause();
      this.logger.info('Message queues paused');
    } catch (error) {
      this.logger.error('Error pausing queues', error);
      throw error;
    }
  }

  public async resumeQueue(): Promise<void> {
    try {
      await this.messageQueue.resume();
      await this.bulkMessageQueue.resume();
      this.logger.info('Message queues resumed');
    } catch (error) {
      this.logger.error('Error resuming queues', error);
      throw error;
    }
  }

  public async getQueueStats(): Promise<{
    messageQueue: any;
    bulkMessageQueue: any;
  }> {
    try {
      const messageQueueCounts = await this.messageQueue.getJobCounts();
      const bulkMessageQueueCounts = await this.bulkMessageQueue.getJobCounts();

      return {
        messageQueue: messageQueueCounts,
        bulkMessageQueue: bulkMessageQueueCounts,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats', error);
      throw error;
    }
  }

  public async cleanQueue(grace: number = 5000): Promise<void> {
    try {
      await this.messageQueue.clean(grace, 'completed');
      await this.messageQueue.clean(grace, 'failed');
      await this.bulkMessageQueue.clean(grace, 'completed');
      await this.bulkMessageQueue.clean(grace, 'failed');
      this.logger.info(`Queues cleaned (grace period: ${grace}ms)`);
    } catch (error) {
      this.logger.error('Error cleaning queues', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.messageQueue.close();
      await this.bulkMessageQueue.close();
      this.logger.info('Message queues closed');
    } catch (error) {
      this.logger.error('Error closing queues', error);
      throw error;
    }
  }

  public getMessageQueue(): Queue<MessageJobData> {
    return this.messageQueue;
  }

  public getBulkMessageQueue(): Queue<BulkMessageJobData> {
    return this.bulkMessageQueue;
  }
}

export default MessageQueueService;

