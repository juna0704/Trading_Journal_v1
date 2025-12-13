import dotenv from 'dotenv';

const envName = process.env.NODE_ENV || 'development';

const envFile = {
  development: './src/config/.env.development',
  production: './src/config/.env.production',
  test: './src/config/.env.test',
}[envName];

dotenv.config({ path: envFile || './src/config/.env' });

