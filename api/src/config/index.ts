/**
 * Node Modules
 */
import dotenv from 'dotenv';

dotenv.config();


/**
 * Types
 */
import type ms from 'ms';

if (!process.env.DATABASE_URL) {
  throw new Error('❌ Missing DB_URI in .env file');
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('❌ Missing JWT_ACCESS_SECRET in .env file');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('❌ Missing JWT_REFRESH_TOKEN in .env file');
}

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  WHITELIST_ORIGINS: process.env.WHITELIST_ORIGINS
    ? process.env.WHITELIST_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'],
  DB_URI: process.env.DATABASE_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue,
  WHITELIST_ADMINS_MAIL: ['junaidalikhan0704@gmail.com'],
  defaultResLimit: 20,
  defaultResOffset: 0,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
};

export default config;
