/**
 * Node modules
 */
import { PrismaClient } from '../generated/prisma/client';

/**
 * Custom modules
 */
import { logger } from './logger';

/**
 * Types
 */

// Connection pool configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 sec

class Database {
  private static instance: Database;
  private prisma: PrismaClient;
  private isConnected = false;
  private retryCount = 0;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
      // Add accelerateUrl from environment variable
      accelerateUrl: process.env.DATABASE_URL || '',
    });

    // Setup custom logger
    this.setupLogging();
  }

  private setupLogging(): void {
    // Prisma logging is now handled by the log configuration in PrismaClient constructor
    // The 'emit: stdout' option will output logs to console
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      this.retryCount = 0;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: this.retryCount,
        maxRetries: MAX_RETRIES,
      });

      if (this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        logger.info(`Retrying database connection... (${this.retryCount}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.connect();
      }

      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected;
  }
}

export const db = Database.getInstance();
export const prisma = db.getClient();
