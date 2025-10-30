import Bull, { Queue, Job, JobOptions } from "bull";
import { ConfigService } from "../config/ConfigService";
import { RedisService } from "./RedisService";
import Logger from "../utils/logger";
import { ContactsJobData } from "../types";

export class ContactsQueueService {
  private static instance: ContactsQueueService;
  private contactsQueue: Queue<ContactsJobData>;
  //   private bulkMessageQueue: Queue<BulkMessageJobData>;
  private configService: ConfigService;
  private redisService: RedisService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.redisService = RedisService.getInstance();
    this.logger = Logger;

    this.contactsQueue = this.createContactsQueue();

    this.setupQueueEventHandlers();
  }

  public static getInstance(): ContactsQueueService {
    if (!ContactsQueueService.instance) {
      ContactsQueueService.instance = new ContactsQueueService();
    }
    return ContactsQueueService.instance;
  }

  private createContactsQueue(): Queue<ContactsJobData> {
    const redisConfig = this.configService.getRedisConfig();

    const queue = new Bull<ContactsJobData>("contacts-fetching", {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        ...(redisConfig.password && { password: redisConfig.password }),
        db: redisConfig.db,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.logger.info("Contacts queue created successfully");
    return queue;
  }
  private setupQueueEventHandlers(): void {
    // Contact Queue Events
    this.contactsQueue.on("completed", (job: Job<ContactsJobData>) => {
      this.logger.info(`Contacts job completed`, {
        jobId: job.id,
        browser_context_id: job.data.browser_context_id,
      });
    });

    this.contactsQueue.on(
      "failed",
      (job: Job<ContactsJobData>, error: Error) => {
        this.logger.error(`Contacts job failed`, {
          jobId: job.id,
          browser_context_id: job.data.browser_context_id,
          error: error.message,
        });
      }
    );

    this.contactsQueue.on("stalled", (job: Job<ContactsJobData>) => {
      this.logger.warn(`Contacts job stalled`, {
        jobId: job.id,
        browser_context_id: job.data.browser_context_id,
      });
    });

    this.contactsQueue.on(
      "progress",
      (job: Job<ContactsJobData>, progress: number) => {
        this.logger.info(`Contacts job progress`, {
          jobId: job.id,
          progress: `${progress}%`,
        });
      }
    );
  }

  public async addContactJob(
    data: ContactsJobData,
    options?: JobOptions
  ): Promise<Job<ContactsJobData>> {
    try {
      const job = await this.contactsQueue.add(data, {
        priority: options?.priority || 5,
        delay: options?.delay || 0,
        ...options,
      });

      this.logger.info(`Contacts job added to queue`, {
        jobId: job.id,
        browser_context_id: data.browser_context_id,
      });

      return job;
    } catch (error) {
      this.logger.error("Error adding contacts job to queue", error);
      throw error;
    }
  }
  
  public async getJob(jobId: string): Promise<Job<ContactsJobData> | null> {
    try {
      return await this.contactsQueue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Error getting job ${jobId}`, error);
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
      await this.contactsQueue.pause();
      //   await this.bulkMessageQueue.pause();
      this.logger.info("Contact queues paused");
    } catch (error) {
      this.logger.error("Error pausing queues", error);
      throw error;
    }
  }

  public async resumeQueue(): Promise<void> {
    try {
      await this.contactsQueue.resume();
      this.logger.info("Contacts queues resumed");
    } catch (error) {
      this.logger.error("Error resuming queues", error);
      throw error;
    }
  }

  public async getQueueStats(): Promise<{
    messageQueue: any;
  }> {
    try {
      const messageQueueCounts = await this.contactsQueue.getJobCounts();

      return {
        messageQueue: messageQueueCounts,
      };
    } catch (error) {
      this.logger.error("Error getting queue stats", error);
      throw error;
    }
  }

  public async cleanQueue(grace: number = 5000): Promise<void> {
    try {
      await this.contactsQueue.clean(grace, "completed");
      await this.contactsQueue.clean(grace, "failed");
      this.logger.info(`Queues cleaned (grace period: ${grace}ms)`);
    } catch (error) {
      this.logger.error("Error cleaning queues", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.contactsQueue.close();
      //   await this.bulkMessageQueue.close();
      this.logger.info("Message queues closed");
    } catch (error) {
      this.logger.error("Error closing queues", error);
      throw error;
    }
  }

  public getFetchContactsQueue(): Queue<ContactsJobData> {
    return this.contactsQueue;
  }

}

export default ContactsQueueService;
