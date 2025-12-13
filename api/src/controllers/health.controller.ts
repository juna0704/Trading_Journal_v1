/**
 * Node modules
 */
import { Request, Response } from 'express';

/**
 * Custom modules
 */
import { db, prisma } from '../config/database';
import { logger } from '../config/logger';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // if database was never connected at start
    if (!db.isConnectionActive()) {
      logger.warn('Health check failed: database not connected at startup');

      return res.status(503).json({
        code: 'Error',
        server: 'up',
        message: 'Database not connected',
        timestamp: new Date().toISOString(),
      });
    }

    // DB ping
    await prisma.$queryRaw`SELECT 1`;

    // Health message
    return res.status(200).json({
      code: 'OK',
      server: 'up',
      message: 'Database is connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // DB unreachable
    logger.error('Health check failed: database unreachable', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(503).json({
      code: 'Error',
      server: 'up',
      message: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
};
