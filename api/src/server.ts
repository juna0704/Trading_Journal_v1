/**
 * Custom modules
 */
import '../src/config/env';
import config from '../src/config';
import app from 'app';
import { logger } from '../src/config/logger';
import { db, prisma } from '../src/config/database';

(async () => {
  try {
    // Connect to database
    await db.connect();

    // Start HTTP server
    const server = app.listen(config.PORT, () => {
      logger.info(`Server is running at: http://localhost:${config.PORT}`);
    });

    // Handle server-level errors
    server.on('error', (err) => {
      logger.error('Server error', err);
    });
  } catch (err) {
    logger.error('Failed to start the server', err);
    process.exit(1);
  }
})();

/**
 * Graceful shutdown server
 */
const handleServerShutdown = async (signal: string) => {
  try {
    logger.info(`Received ${signal}, Shutting down.. `);
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  } catch (err) {
    logger.error('Error during server shutdown', err);
    process.exit(1);
  }
};

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
