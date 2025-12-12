/**
 * Node Modules
 */
import dotenv from 'dotenv'

dotenv.config()

/**
 * Types
 */
import type ms from 'ms'

if (!process.env.DB_URI) {
    throw new Error('❌ Missing DB_URI in .env file')
}

if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('❌ Missing JWT_ACCESS_SECRET in .env file')

}

if (!process.env.JWT_REFRESH_TOKEN) {
    throw new Error('❌ Missing JWT_REFRESH_TOKEN in .env file')
}

const config = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
    WHITELIST_ORIGINS: process.env.WHITELIST_ORIGINS? process.env.WHITELIST_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000']
}