import Redis from 'ioredis';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';

export class RedisService {
  private static instance: RedisService;
  private redisClient: Redis;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
    this.redisClient = this.createRedisClient();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private createRedisClient(): Redis {
    const redisConfig = this.configService.getRedisConfig();

    const client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      ...(redisConfig.password && { password: redisConfig.password }),
      db: redisConfig.db,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    client.on('connect', () => {
      this.logger.info('Redis client connected successfully');
    });

    client.on('error', (error: Error) => {
      this.logger.error('Redis client error', error);
    });

    client.on('close', () => {
      this.logger.warn('Redis client connection closed');
    });

    return client;
  }

  public getClient(): Redis {
    return this.redisClient;
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redisClient.setex(key, ttl, value);
      } else {
        await this.redisClient.set(key, value);
      }
      this.logger.info(`Redis SET: ${key}`, { ttl });
    } catch (error) {
      this.logger.error(`Redis SET error for key: ${key}`, error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.redisClient.get(key);
      this.logger.info(`Redis GET: ${key}`, { found: !!value });
      return value;
    } catch (error) {
      this.logger.error(`Redis GET error for key: ${key}`, error);
      throw error;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.info(`Redis DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Redis DEL error for key: ${key}`, error);
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key: ${key}`, error);
      throw error;
    }
  }

  public async setObject(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.set(key, stringValue, ttl);
    } catch (error) {
      this.logger.error(`Redis SET OBJECT error for key: ${key}`, error);
      throw error;
    }
  }

  public async getObject<T>(key: string): Promise<T | null> {
    try {
      const stringValue = await this.get(key);
      if (!stringValue) return null;
      return JSON.parse(stringValue) as T;
    } catch (error) {
      this.logger.error(`Redis GET OBJECT error for key: ${key}`, error);
      throw error;
    }
  }

  public async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.redisClient.incrby(key, amount);
      return result;
    } catch (error) {
      this.logger.error(`Redis INCREMENT error for key: ${key}`, error);
      throw error;
    }
  }

  public async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await this.redisClient.decrby(key, amount);
      return result;
    } catch (error) {
      this.logger.error(`Redis DECREMENT error for key: ${key}`, error);
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redisClient.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key: ${key}`, error);
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL error for key: ${key}`, error);
      throw error;
    }
  }

  public async flushAll(): Promise<void> {
    try {
      await this.redisClient.flushall();
      this.logger.warn('Redis FLUSHALL executed - all keys deleted');
    } catch (error) {
      this.logger.error('Redis FLUSHALL error', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      this.logger.info('Redis client disconnected');
    } catch (error) {
      this.logger.error('Redis disconnect error', error);
      throw error;
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis PING error', error);
      return false;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis KEYS error for pattern: ${pattern}`, error);
      throw error;
    }
  }
}

export default RedisService;

