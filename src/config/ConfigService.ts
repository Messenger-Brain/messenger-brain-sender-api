import dotenv from 'dotenv';

dotenv.config();

export interface AppConfiguration {
  server: ServerConfiguration;
  database: DatabaseConfiguration;
  jwt: JWTConfiguration;
  redis: RedisConfiguration;
  cors: CORSConfiguration;
  rateLimit: RateLimitConfiguration;
  logging: LoggingConfiguration;
  puppeteer: PuppeteerConfiguration;
}

export interface ServerConfiguration {
  port: number;
  environment: 'development' | 'production' | 'test';
  host: string;
}

export interface DatabaseConfiguration {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

export interface JWTConfiguration {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface RedisConfiguration {
  host: string;
  port: number;
  password?: string | undefined;
  db: number;
}

export interface CORSConfiguration {
  origin: string | string[] | undefined;
  credentials: boolean;
}

export interface RateLimitConfiguration {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

export interface LoggingConfiguration {
  level: string;
  enableFileLogging: boolean;
  logDirectory: string;
}

export interface PuppeteerConfiguration {
  headless: boolean;
  whatsappUrl: string;
  defaultTimeout: number;
  navigationTimeout: number;
}

export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfiguration;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfiguration(): AppConfiguration {
    return {
      server: this.loadServerConfiguration(),
      database: this.loadDatabaseConfiguration(),
      jwt: this.loadJWTConfiguration(),
      redis: this.loadRedisConfiguration(),
      cors: this.loadCORSConfiguration(),
      rateLimit: this.loadRateLimitConfiguration(),
      logging: this.loadLoggingConfiguration(),
      puppeteer: this.loadPuppeteerConfiguration(),
    };
  }

  private loadServerConfiguration(): ServerConfiguration {
    return {
      port: parseInt(process.env.PORT || '3000'),
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      host: process.env.HOST || 'localhost',
    };
  }

  private loadDatabaseConfiguration(): DatabaseConfiguration {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'messenger_brain_sender',
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        min: parseInt(process.env.DB_POOL_MIN || '0'),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
      },
    };
  }

  private loadJWTConfiguration(): JWTConfiguration {
    return {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    };
  }

  private loadRedisConfiguration(): RedisConfiguration {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    };
  }

  private loadCORSConfiguration(): CORSConfiguration {
    const origins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
    return {
      origin: origins.length === 1 ? origins[0] : origins,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    };
  }

  private loadRateLimitConfiguration(): RateLimitConfiguration {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
    };
  }

  private loadLoggingConfiguration(): LoggingConfiguration {
    return {
      level: process.env.LOG_LEVEL || 'info',
      enableFileLogging: process.env.LOG_FILE_ENABLED === 'true',
      logDirectory: process.env.LOG_DIRECTORY || 'logs',
    };
  }

  private loadPuppeteerConfiguration(): PuppeteerConfiguration {
    return {
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      whatsappUrl: process.env.PUPPETEER_WHATSAPP_URL || 'https://web.whatsapp.com',
      defaultTimeout: parseInt(process.env.PUPPETEER_DEFAULT_TIMEOUT || '30000'),
      navigationTimeout: parseInt(process.env.PUPPETEER_NAVIGATION_TIMEOUT || '60000'),
    };
  }

  public getConfig(): AppConfiguration {
    return this.config;
  }

  public getServerConfig(): ServerConfiguration {
    return this.config.server;
  }

  public getDatabaseConfig(): DatabaseConfiguration {
    return this.config.database;
  }

  public getJWTConfig(): JWTConfiguration {
    return this.config.jwt;
  }

  public getRedisConfig(): RedisConfiguration {
    return this.config.redis;
  }

  public getCORSConfig(): CORSConfiguration {
    return this.config.cors;
  }

  public getRateLimitConfig(): RateLimitConfiguration {
    return this.config.rateLimit;
  }

  public getLoggingConfig(): LoggingConfiguration {
    return this.config.logging;
  }

  public getPuppeteerConfig(): PuppeteerConfiguration {
    return this.config.puppeteer;
  }

  public isDevelopment(): boolean {
    return this.config.server.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.server.environment === 'production';
  }

  public isTest(): boolean {
    return this.config.server.environment === 'test';
  }

  public updateConfig(newConfig: Partial<AppConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public reloadConfig(): void {
    this.config = this.loadConfiguration();
  }
}
