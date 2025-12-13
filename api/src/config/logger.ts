// config/logger.ts
/**
 * Node modules
 */
import winston from 'winston';

/**
 * Custom modules
 */
import config from './index';

const { combine, timestamp, json, errors, align, printf, colorize } = winston.format;

const transport: winston.transport[] = [];

// if the application is not running in production, add a console transport
if (config.NODE_ENV !== 'production') {
  transport.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }), // add color to log level
        timestamp({ format: 'YYYY_MM_DD hh:mm:ss A' }), // add timestamp to logs
        align(),
        printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta)}` : '';
          return `${timestamp} [/${level}] : ${message} ${metaStr}}`;
        })
      ),
    })
  );
}

// Create a logger instance usin winston
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: transport,
  silent: config.NODE_ENV === 'test',
});

export { logger };
