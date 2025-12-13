# **Trading Journal MVP - File-Functionality Relationship Guide**

## **Document Purpose**

This document maps every file and folder to its specific functionality in the Trading Journal MVP. It serves as a comprehensive reference for understanding the codebase structure and relationships.

---

## 📁 Folder Structure

```
trading_journal_api/
├── api/
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── index.ts
│   │   └── logger.ts
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── docs/
│   ├── logs/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── scripts/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── index.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── trade.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── notFoundHandler.ts
│   │   ├── models/
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── trade.routes.ts
│   │   │   ├── upload.routes.ts
│   │   │   └── analytics.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── trade.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── upload.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   └── validators/
│   │       ├── index.ts
│   │       ├── auth.validator.ts
│   │       ├── trade.validator.ts
│   │       └── upload.validator.ts
│   ├── tests/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
```

## **📁 ROOT DIRECTORY STRUCTURE**

### **`/api`** - Backend API Server

The complete backend implementation for the Trading Journal SaaS.

---

## **📁 CONFIGURATION LAYER (`/config/`)**

### **`config/database.ts`**

**Purpose:** Database connection and configuration
**Functionality:**

- Creates and exports Prisma client instance
- Handles database connection pooling
- Sets up connection retry logic
  **Dependencies:** `@prisma/client`, environment variables
  **Used By:** All services that need database access

### **`config/env.ts`**

**Purpose:** Environment variable validation and management
**Functionality:**

- Validates all environment variables using Zod
- Provides type-safe access to environment variables
- Sets default values for optional variables
  **Dependencies:** `zod`, `process.env`
  **Used By:** Entire application for configuration

### **`config/logger.ts`**

**Purpose:** Application logging configuration
**Functionality:**

- Configures Winston logger with different transports
- Sets log levels based on environment
- Formats logs with timestamps and colors
  **Dependencies:** `winston`, environment variables
  **Used By:** All controllers and services for logging

### **`config/index.ts`**

**Purpose:** Central configuration export
**Functionality:**

- Exports all configuration modules
- Provides single import point for configurations
  **Dependencies:** All other config files
  **Used By:** Application entry point

---

## **📁 DATABASE LAYER (`/prisma/`)**

### **`prisma/schema.prisma`**

**Purpose:** Database schema definition
**Functionality:**

- Defines all database tables and relationships
- Configures Prisma client generation
- Sets up database connection URL
  **Tables Defined:**

1. `User` - User authentication and profile
2. `Trade` - Trading records with PnL calculation
3. `Upload` - File attachments for trades
4. `ImportJob` - CSV import processing jobs
   **Dependencies:** PostgreSQL, Prisma CLI
   **Used By:** Prisma Client, all database operations

### **`prisma/migrations/`**

**Purpose:** Database migration files
**Functionality:**

- Tracks schema changes over time
- Enables rollback capability
- Maintains database version history
  **Dependencies:** Prisma Migrate
  **Used By:** Deployment scripts

### **`prisma/seed.ts`**

**Purpose:** Database seeding for development
**Functionality:**

- Populates database with test data
- Creates initial admin users
- Sets up development environment
  **Dependencies:** Prisma Client
  **Used By:** Development setup scripts

---

## **📁 SOURCE CODE (`/src/`)**

### **`src/app.ts`**

**Purpose:** Express application configuration
**Functionality:**

- Initializes Express application
- Configures middleware stack (CORS, helmet, rate limiting)
- Sets up request parsing and logging
- Configures error handling middleware
  **Dependencies:** Express, various middleware packages
  **Used By:** `src/server.ts`

### **`src/server.ts`**

**Purpose:** HTTP server management
**Functionality:**

- Creates and starts HTTP server
- Handles graceful shutdown
- Manages server lifecycle events
  **Dependencies:** `src/app.ts`, environment variables
  **Used By:** Application entry point

### **`src/index.ts`**

**Purpose:** Application entry point
**Functionality:**

- Loads environment variables
- Initializes the application
- Sets up global error handlers
- Starts the server
  **Dependencies:** All configuration and server files
  **Entry Point:** This file starts the application

---

## **📁 MIDDLEWARE LAYER (`/src/middlewares/`)**

### **`src/middlewares/auth.ts`**

**Purpose:** Authentication and authorization
**Functionality:**

- Validates JWT tokens
- Attaches user ID to request object
- Protects routes from unauthorized access
  **Exports:**
- `authenticate` - Main authentication middleware
- `AuthRequest` - Type extension for authenticated requests
  **Dependencies:** `jsonwebtoken`, environment variables
  **Used By:** All protected route handlers

### **`src/middlewares/errorHandler.ts`**

**Purpose:** Global error handling
**Functionality:**

- Catches and processes all application errors
- Formats error responses consistently
- Logs errors appropriately
  **Exports:**
- `AppError` - Custom error class
- `errorHandler` - Global error middleware
  **Dependencies:** Express, logger
  **Used By:** `src/app.ts`

### **`src/middlewares/notFoundHandler.ts`**

**Purpose:** 404 Not Found handler
**Functionality:**

- Catches undefined routes
- Returns consistent 404 responses
- Logs 404 requests
  **Dependencies:** Express
  **Used By:** `src/app.ts`

---

## **📁 VALIDATION LAYER (`/src/validators/`)**

### **`src/validators/index.ts`**

**Purpose:** Validation middleware wrapper
**Functionality:**

- Wraps Zod validation schemas
- Handles validation errors
- Provides consistent validation interface
  **Exports:** `validate` function
  **Dependencies:** Zod, Express
  **Used By:** All route handlers for input validation

### **`src/validators/auth.validator.ts`**

**Purpose:** Authentication request validation
**Schemas:**

- `registerSchema` - User registration validation
- `loginSchema` - User login validation
  **Fields Validated:** email, password, name
  **Used By:** `src/routes/auth.routes.ts`

### **`src/validators/trade.validator.ts`**

**Purpose:** Trade request validation
**Schemas:**

- `tradeCreateSchema` - New trade validation
- `tradeUpdateSchema` - Trade update validation
  **Fields Validated:** symbol, side, prices, timestamps, quantity
  **Used By:** `src/routes/trade.routes.ts`

### **`src/validators/upload.validator.ts`**

**Purpose:** File upload validation
**Schemas:**

- `uploadRequestSchema` - Upload request validation
  **Validates:** File type, size, name
  **Used By:** `src/routes/upload.routes.ts`

---

## **📁 SERVICE LAYER (Business Logic) (`/src/services/`)**

### **`src/services/auth.service.ts`**

**Purpose:** Authentication business logic
**Functionality:**

- User registration with password hashing
- User login with credential verification
- JWT token generation and management
- Refresh token handling
  **Methods:**
- `register()` - Creates new user
- `login()` - Authenticates user
- `logout()` - Ends user session
- `refreshToken()` - Issues new access token
  **Dependencies:** Prisma, Argon2, JWT
  **Used By:** `src/controllers/auth.controller.ts`

### **`src/services/trade.service.ts`**

**Purpose:** Trade management business logic
**Functionality:**

- CRUD operations for trades
- PnL calculation and validation
- Trade filtering and pagination
- Data integrity checks
  **Methods:**
- `createTrade()` - Creates new trade
- `getTrades()` - Retrieves trades with filters
- `updateTrade()` - Updates existing trade
- `deleteTrade()` - Removes trade
  **Dependencies:** Prisma
  **Used By:** `src/controllers/trade.controller.ts`

### **`src/services/analytics.service.ts`**

**Purpose:** Analytics calculation
**Functionality:**

- Computes trading performance metrics
- Aggregates trade data for dashboard
- Calculates win rates, averages, totals
  **Methods:**
- `getSummary()` - Returns dashboard statistics
  **Metrics Calculated:**
- Net PnL, Win Rate, Average Win/Loss
- Best/Worst Trade, Total Trades
  **Dependencies:** Prisma
  **Used By:** `src/controllers/analytics.controller.ts`

### **`src/services/upload.service.ts`**

**Purpose:** File upload management
**Functionality:**

- Generates S3 presigned URLs
- Validates file types and sizes
- Manages upload-trade relationships
  **Methods:**
- `getPresignedUrl()` - Creates upload URL
- `confirmUpload()` - Links file to trade
  **Dependencies:** AWS SDK, Prisma, UUID
  **Used By:** `src/controllers/upload.controller.ts`

---

## **📁 CONTROLLER LAYER (HTTP Handlers) (`/src/controllers/`)**

### **`src/controllers/auth.controller.ts`**

**Purpose:** Authentication HTTP handlers
**Endpoints Handled:**

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
  **Functionality:**
- Processes auth requests
- Sets HTTP cookies for refresh tokens
- Returns appropriate HTTP responses
  **Dependencies:** `auth.service.ts`, Express
  **Used By:** `src/routes/auth.routes.ts`

### **`src/controllers/trade.controller.ts`**

**Purpose:** Trade management HTTP handlers
**Endpoints Handled:**

- `POST /trades` - Create trade
- `GET /trades` - List trades
- `GET /trades/:id` - Get trade
- `PUT /trades/:id` - Update trade
- `DELETE /trades/:id` - Delete trade
  **Functionality:**
- Processes trade CRUD operations
- Handles filtering and pagination
- Manages trade-attachment relationships
  **Dependencies:** `trade.service.ts`, Express
  **Used By:** `src/routes/trade.routes.ts`

### **`src/controllers/analytics.controller.ts`**

**Purpose:** Analytics HTTP handlers
**Endpoints Handled:**

- `GET /analytics/summary` - Dashboard statistics
  **Functionality:**
- Returns trading performance metrics
- Formats analytics data for frontend
  **Dependencies:** `analytics.service.ts`, Express
  **Used By:** `src/routes/analytics.routes.ts`

### **`src/controllers/upload.controller.ts`**

**Purpose:** File upload HTTP handlers
**Endpoints Handled:**

- `POST /uploads/presign` - Get upload URL
- `POST /uploads/:id/confirm` - Confirm upload
  **Functionality:**
- Handles file upload requests
- Manages S3 upload process
- Links files to trades
  **Dependencies:** `upload.service.ts`, Express
  **Used By:** `src/routes/upload.routes.ts`

---

## **📁 ROUTING LAYER (`/src/routes/`)**

### **`src/routes/index.ts`**

**Purpose:** Main router configuration
**Functionality:**

- Combines all route modules
- Sets up authentication middleware
- Configures public vs protected routes
- Defines health check endpoint
  **Routes Configured:**
- `/auth/*` - Public authentication routes
- `/trades/*` - Protected trade routes
- `/uploads/*` - Protected upload routes
- `/analytics/*` - Protected analytics routes
  **Dependencies:** All route modules, auth middleware
  **Used By:** `src/app.ts`

### **`src/routes/auth.routes.ts`**

**Purpose:** Authentication route definitions
**Routes:**

- `POST /register` - Register user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `POST /refresh` - Refresh token
  **Dependencies:** `auth.controller.ts`, validators
  **Used By:** `src/routes/index.ts`

### **`src/routes/trade.routes.ts`**

**Purpose:** Trade management route definitions
**Routes:**

- `POST /` - Create trade
- `GET /` - List trades
- `GET /:id` - Get trade
- `PUT /:id` - Update trade
- `DELETE /:id` - Delete trade
  **Dependencies:** `trade.controller.ts`, validators
  **Used By:** `src/routes/index.ts`

### **`src/routes/upload.routes.ts`**

**Purpose:** File upload route definitions
**Routes:**

- `POST /presign` - Get upload URL
- `POST /:id/confirm` - Confirm upload
  **Dependencies:** `upload.controller.ts`, validators
  **Used By:** `src/routes/index.ts`

### **`src/routes/analytics.routes.ts`**

**Purpose:** Analytics route definitions
**Routes:**

- `GET /summary` - Get dashboard summary
  **Dependencies:** `analytics.controller.ts`
  **Used By:** `src/routes/index.ts`

---

## **📁 TYPES & UTILITIES**

### **`src/types/index.ts`**

**Purpose:** TypeScript type definitions
**Functionality:**

- Defines application interfaces
- Provides request/response types
- Exports reusable type definitions
  **Types Defined:**
- Database model interfaces (User, Trade, Upload, ImportJob)
- Request/response DTOs
- Filter and parameter types
  **Used By:** Services, controllers, validators

### **`src/utils/`**

**Purpose:** Utility functions
**Functionality:**

- Shared helper functions
- Common utilities
- Reusable code snippets
  **Examples:**
- Date formatting
- Number formatting
- Validation helpers
- API response formatters
  **Used By:** Services and controllers

---

## **📁 SUPPORTING FILES**

### **Root Configuration Files**

#### **`package.json`**

**Purpose:** Project dependencies and scripts
**Functionality:**

- Lists all dependencies
- Defines npm scripts
- Configures project metadata
  **Key Scripts:**
- `dev` - Development server with hot reload
- `build` - TypeScript compilation
- `start` - Production server
- `prisma:*` - Database operations
- `lint` - Code quality checks

#### **`tsconfig.json`**

**Purpose:** TypeScript configuration
**Functionality:**

- Compiler options
- Type checking rules
- Module resolution
  **Settings:**
- Target: ES2020
- Module: CommonJS
- Strict mode enabled

#### **`nodemon.json`**

**Purpose:** Development server hot reload
**Functionality:**

- Watches for file changes
- Restarts server automatically
- Configures ignored files

#### **`.env.example`**

**Purpose:** Environment variable template
**Functionality:**

- Documents required environment variables
- Provides example values
- Serves as setup guide

### **Development Tools**

#### **`.eslintrc.js`**

**Purpose:** Code quality rules
**Functionality:**

- Defines linting rules
- Configures TypeScript support
- Sets up Prettier integration

#### **`.prettierrc`**

**Purpose:** Code formatting rules
**Functionality:**

- Defines code style
- Configures formatting options
- Ensures consistency

#### **`.husky/`**

**Purpose:** Git hooks automation
**Functionality:**

- Pre-commit checks
- Code quality enforcement
- Automated testing

---

## **📦 DEPENDENCY RELATIONSHIPS**

### **External Dependencies**

```
Express      → HTTP server framework
Prisma       → Database ORM
TypeScript   → Type safety
Zod          → Validation
AWS SDK      → S3 file storage
JWT          → Authentication
Argon2       → Password hashing
Winston      → Logging
```

### **Internal Dependencies Flow**

```
Request → Routes → Middleware → Controllers → Services → Database
Response ← Formatting ← Error Handling ← Validation ← Business Logic
```

---

## **🚀 APPLICATION FLOW DIAGRAM**

```
CLIENT REQUEST
    ↓
Express App (app.ts)
    ↓
Rate Limiting
    ↓
CORS & Security
    ↓
Request Parsing
    ↓
Router (routes/index.ts)
    ├── Public Routes (auth/*)
    └── Protected Routes (authenticate middleware)
            ↓
    Route Handlers (controllers/*)
            ↓
    Validation (validators/*)
            ↓
    Business Logic (services/*)
            ↓
    Database (Prisma → PostgreSQL)
            ↓
    Response Formatting
            ↓
    Error Handling (if any)
            ↓
CLIENT RESPONSE
```

---

## **🔧 SETUP AND USAGE**

### **Database Operations**

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### **Development**

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Format code
npm run format
```

### **Production**

```bash
# Build project
npm run build

# Start production server
npm start
```

---

## **📊 FILE RELATIONSHIPS SUMMARY**

| File Category   | Purpose            | Key Files                | Dependencies  |
| --------------- | ------------------ | ------------------------ | ------------- |
| **Config**      | Environment setup  | env.ts, database.ts      | process.env   |
| **Routes**      | URL routing        | index.ts, \*.routes.ts   | controllers   |
| **Middleware**  | Request processing | auth.ts, errorHandler.ts | Express       |
| **Controllers** | HTTP handlers      | \*.controller.ts         | services      |
| **Services**    | Business logic     | \*.service.ts            | Prisma, utils |
| **Validators**  | Input validation   | \*.validator.ts          | Zod           |
| **Types**       | Type definitions   | index.ts                 | -             |
| **Database**    | Data persistence   | schema.prisma            | PostgreSQL    |

---

## **🎯 MVP COMPLETION CHECKLIST**

### **✅ Completed**

- [x] Project structure setup
- [x] Database schema definition
- [x] Configuration system
- [x] Authentication system
- [x] Trade CRUD operations
- [x] Basic analytics
- [x] File upload foundation

### **🔄 In Progress**

- [ ] AWS S3 integration
- [ ] Frontend-backend integration
- [ ] Comprehensive testing
- [ ] Deployment configuration

This document serves as a living reference that should be updated as the codebase evolves. Each new file added should be documented here with its purpose, functionality, and relationships.
