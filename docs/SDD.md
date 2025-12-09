# Trading Journal SaaS - System Design Document

**Project:** Trading Journal SaaS  
**Version:** 2.0  
**Status:** Final  
**Last Updated:** December 10, 2025  
**Author:** Junaid Ali Khan  

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Frontend)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │   React     │  │   Tailwind CSS      │  │
│  │   App Router│  │   Components │  │   shadcn/ui        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │ HTTPS / REST API
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer (Backend)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Express   │  │   Services  │  │   Middleware       │  │
│  │   Server    │  │   Layer     │  │   Stack            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Data & Processing Layer                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │   Redis     │  │   AWS S3           │  │
│  │  (Neon)     │  │  (Upstash)  │  │   Storage          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ BullMQ      │  │   Razorpay  │  │   Email Service    │  │
│  │ Workers     │  │   Gateway   │  │   (Resend)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + React Query
- **Charts:** Recharts
- **Form Handling:** React Hook Form + Zod

**Backend:**
- **Runtime:** Node.js 20+ (TypeScript)
- **Framework:** Express.js 4.x
- **API Documentation:** tRPC or REST with Zod validation
- **Authentication:** Custom JWT + Google OAuth
- **ORM:** DrizzleORM
- **Queue:** BullMQ with Redis
- **File Storage:** AWS S3 SDK

**Database:**
- **Primary:** PostgreSQL 15+ (Neon)
- **Cache & Session:** Redis (Upstash)
- **Migrations:** Drizzle Kit

**Infrastructure:**
- **Hosting:** Vercel (Frontend), Render/Railway (Backend)
- **Storage:** AWS S3 or Cloudflare R2
- **Payments:** Razorpay
- **Monitoring:** Sentry, LogRocket, Vercel Analytics
- **Email:** Resend

### 1.3 System Characteristics

- **Multi-tenant:** Row-level isolation with PostgreSQL RLS
- **Real-time Updates:** WebSocket for dashboard updates (optional)
- **Background Processing:** BullMQ for heavy computations
- **Scalable:** Stateless services, horizontal scaling
- **Secure:** JWT + Refresh tokens, HTTPS, rate limiting
- **Observable:** Structured logging, metrics, tracing

## 2. Component Architecture

### 2.1 Frontend Architecture (Next.js)

```
src/
├── app/                          # App Router Pages
│   ├── (auth)/                   # Auth group layout
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/                # Authenticated routes
│   │   ├── trades/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── billing/
│   └── api/                      # Next.js API routes
│       └── auth/
│           └── callback/
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── trades/
│   ├── charts/
│   └── layout/
├── lib/                          # Utilities & hooks
│   ├── api/                      # API client
│   ├── auth/                     # Auth utilities
│   ├── utils/                    # Helper functions
│   └── validation/               # Zod schemas
├── stores/                       # Zustand stores
├── types/                        # TypeScript definitions
└── middleware.ts                 # Next.js middleware
```

### 2.2 Backend Architecture (Express.js)

```
src/
├── index.ts                      # Application entry
├── app.ts                        # Express app setup
├── config/                       # Configuration
│   ├── database.ts
│   ├── redis.ts
│   ├── aws.ts
│   └── razorpay.ts
├── middleware/                   # Express middleware
│   ├── auth.ts                   # JWT validation
│   ├── tenant.ts                 # Tenant isolation
│   ├── rbac.ts                   # Role-based access
│   ├── rate-limit.ts
│   └── validation.ts
├── routes/                       # API routes
│   ├── auth/
│   ├── trades/
│   ├── analytics/
│   ├── uploads/
│   ├── billing/
│   └── webhooks/
├── services/                     # Business logic
│   ├── auth.service.ts
│   ├── trade.service.ts
│   ├── analytics.service.ts
│   ├── import.service.ts
│   └── billing.service.ts
├── controllers/                  # Request handlers
├── models/                       # Data models (Drizzle)
├── schemas/                      # Zod validation schemas
├── utils/                        # Utilities
├── workers/                      # BullMQ workers
└── types/                        # TypeScript types
```

## 3. Authentication & Authorization Architecture

### 3.1 Authentication Flow

#### 3.1.1 Email/Password Authentication with JWT

```typescript
// Authentication Service Implementation
class AuthService {
  async register(email: string, password: string, name: string) {
    // 1. Validate input
    const validated = registerSchema.parse({ email, password, name });
    
    // 2. Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validated.email)
    });
    if (existingUser) throw new Error('User already exists');
    
    // 3. Hash password with Argon2
    const passwordHash = await argon2.hash(validated.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });
    
    // 4. Create user and tenant
    const user = await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(users).values({
        email: validated.email,
        name: validated.name,
        passwordHash,
        identityProvider: 'email'
      }).returning();
      
      // Create default tenant for user
      const [tenant] = await tx.insert(tenants).values({
        name: `${validated.name}'s Workspace`,
        ownerUserId: newUser.id
      }).returning();
      
      // Add user to tenant as Owner
      await tx.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: newUser.id,
        role: 'OWNER'
      });
      
      return { ...newUser, tenantId: tenant.id };
    });
    
    // 5. Generate tokens
    const tokens = await this.generateTokens(user);
    
    return { user, tokens };
  }
  
  async generateTokens(user: User) {
    // Access Token (15 minutes)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: 'OWNER' // From tenantUsers table
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    
    // Refresh Token (7 days)
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Store refresh token in Redis
    await redis.set(
      `refresh:${user.id}:${refreshToken}`,
      JSON.stringify({
        userId: user.id,
        tenantId: user.tenantId,
        createdAt: new Date()
      }),
      { EX: 7 * 24 * 60 * 60 } // 7 days
    );
    
    return { accessToken, refreshToken };
  }
}
```

#### 3.1.2 Refresh Token Rotation

```typescript
// Refresh token endpoint implementation
app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }
  
  // Extract user ID from token (stored in Redis key)
  const keys = await redis.keys(`refresh:*:${refreshToken}`);
  if (!keys.length) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  
  const key = keys[0];
  const sessionData = await redis.get(key);
  if (!sessionData) {
    return res.status(401).json({ error: 'Session expired' });
  }
  
  const session = JSON.parse(sessionData);
  
  // Delete old refresh token (rotation)
  await redis.del(key);
  
  // Get current user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId)
  });
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  // Generate new tokens
  const tokens = await authService.generateTokens({
    ...user,
    tenantId: session.tenantId
  });
  
  // Set new refresh token as HTTP-only cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.json({ accessToken: tokens.accessToken });
});
```

### 3.2 OAuth 2.0 Integration (Google)

#### 3.2.1 OAuth Flow

```typescript
// Google OAuth Implementation
class OAuthService {
  async handleGoogleCallback(code: string) {
    // 1. Exchange code for tokens
    const { tokens } = await googleOAuthClient.getToken(code);
    
    // 2. Get user info from Google
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload');
    
    // 3. Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, payload.email!)
    });
    
    if (!user) {
      // Create new user with OAuth
      [user] = await db.insert(users).values({
        email: payload.email!,
        name: payload.name!,
        identityProvider: 'google',
        oauthProviderId: payload.sub,
        avatarUrl: payload.picture
      }).returning();
      
      // Create default tenant
      const [tenant] = await db.insert(tenants).values({
        name: `${payload.name}'s Workspace`,
        ownerUserId: user.id
      }).returning();
      
      await db.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: user.id,
        role: 'OWNER'
      });
      
      user = { ...user, tenantId: tenant.id };
    } else {
      // Existing user - get their tenant
      const tenantUser = await db.query.tenantUsers.findFirst({
        where: and(
          eq(tenantUsers.userId, user.id),
          eq(tenantUsers.role, 'OWNER')
        )
      });
      
      user = { ...user, tenantId: tenantUser?.tenantId };
    }
    
    // 4. Generate application tokens
    const tokens = await authService.generateTokens(user);
    
    return { user, tokens };
  }
  
  async linkGoogleAccount(userId: string, code: string) {
    // Similar flow but link to existing user
    const { tokens } = await googleOAuthClient.getToken(code);
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token!
    });
    
    const payload = ticket.getPayload();
    
    await db.update(users)
      .set({
        identityProvider: 'google',
        oauthProviderId: payload!.sub,
        avatarUrl: payload!.picture
      })
      .where(eq(users.id, userId));
    
    return { success: true };
  }
}
```

#### 3.2.2 Frontend OAuth Implementation

```typescript
// Next.js Google OAuth component
'use client';

import { useRouter } from 'next/navigation';

export function GoogleSignInButton() {
  const router = useRouter();
  
  const handleGoogleSignIn = () => {
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/callback/google`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    
    // Store state to prevent CSRF
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    googleAuthUrl.searchParams.set('state', state);
    
    window.location.href = googleAuthUrl.toString();
  };
  
  return (
    <button onClick={handleGoogleSignIn} className="google-signin-button">
      Sign in with Google
    </button>
  );
}
```

### 3.3 Authorization - RBAC Implementation

#### 3.3.1 Role Definitions

```typescript
// Role definitions and permissions
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export const RolePermissions = {
  [Role.OWNER]: {
    canManageUsers: true,
    canManageBilling: true,
    canCreateTrades: true,
    canEditAllTrades: true,
    canDeleteAllTrades: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageTags: true
  },
  [Role.ADMIN]: {
    canManageUsers: true,
    canManageBilling: false,
    canCreateTrades: true,
    canEditAllTrades: true,
    canDeleteAllTrades: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageTags: true
  },
  [Role.MEMBER]: {
    canManageUsers: false,
    canManageBilling: false,
    canCreateTrades: true,
    canEditOwnTrades: true,
    canDeleteOwnTrades: true,
    canViewAnalytics: true,
    canExportOwnData: true,
    canManageTags: false
  },
  [Role.VIEWER]: {
    canManageUsers: false,
    canManageBilling: false,
    canCreateTrades: false,
    canEditTrades: false,
    canDeleteTrades: false,
    canViewAnalytics: true,
    canExportData: false,
    canManageTags: false
  }
} as const;
```

#### 3.3.2 RBAC Middleware

```typescript
// Express middleware for RBAC
export function requirePermission(permission: keyof typeof RolePermissions[Role]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId } = req.user;
      
      // Get user's role in this tenant
      const tenantUser = await db.query.tenantUsers.findFirst({
        where: and(
          eq(tenantUsers.tenantId, tenantId),
          eq(tenantUsers.userId, userId)
        )
      });
      
      if (!tenantUser) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }
      
      const role = tenantUser.role as Role;
      const permissions = RolePermissions[role];
      
      if (!permissions[permission]) {
        return res.status(403).json({ 
          error: `Insufficient permissions. Required: ${permission}` 
        });
      }
      
      // Special handling for "own" resources
      if (permission === 'canEditOwnTrades' && req.params.id) {
        const trade = await db.query.trades.findFirst({
          where: eq(trades.id, req.params.id)
        });
        
        if (trade && trade.userId !== userId) {
          return res.status(403).json({ error: 'Can only edit own trades' });
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage in routes
router.put('/trades/:id', 
  authenticate,
  requireTenant,
  requirePermission('canEditOwnTrades'),
  tradeController.updateTrade
);
```

## 4. Multi-Tenant Architecture

### 4.1 Database Schema with Tenant Isolation

```sql
-- Core tables with tenant_id
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  plan VARCHAR(50) DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, user_id)
);

-- Trade table with tenant_id
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  entry_price DECIMAL(12, 4) NOT NULL,
  exit_price DECIMAL(12, 4),
  quantity INTEGER NOT NULL,
  fees DECIMAL(10, 2) DEFAULT 0,
  pnl DECIMAL(12, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN exit_price IS NOT NULL THEN 
        (exit_price - entry_price) * quantity * 
        CASE WHEN side = 'BUY' THEN 1 ELSE -1 END - fees
      ELSE 0
    END
  ) STORED,
  entry_timestamp TIMESTAMP NOT NULL,
  exit_timestamp TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_policy ON trades
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY user_trade_access ON trades
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID AND
    (
      user_id = current_setting('app.current_user_id')::UUID OR
      EXISTS (
        SELECT 1 FROM tenant_users tu
        WHERE tu.tenant_id = trades.tenant_id
          AND tu.user_id = current_setting('app.current_user_id')::UUID
          AND tu.role IN ('OWNER', 'ADMIN')
      )
    )
  );
```

### 4.2 Tenant Context Middleware

```typescript
// Tenant context middleware
export async function setTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { tenantId, userId } = req.user;
    
    // Verify user belongs to tenant
    const tenantUser = await db.query.tenantUsers.findFirst({
      where: and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, userId)
      )
    });
    
    if (!tenantUser) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }
    
    // Set tenant context for RLS
    await db.execute(sql`
      SET app.current_tenant_id = ${tenantId};
      SET app.current_user_id = ${userId};
      SET app.current_user_role = ${tenantUser.role};
    `);
    
    // Attach to request for service layer
    req.tenant = {
      id: tenantId,
      role: tenantUser.role as Role
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

// Usage in Express app
app.use('/api', authenticate, setTenantContext);
```

### 4.3 Tenant Data Isolation Strategies

**Strategy 1: Database Schema per Tenant** (Future scaling)
```typescript
// Dynamic database connection based on tenant
class TenantDatabaseService {
  async getConnection(tenantId: string) {
    const tenant = await this.getTenantConfig(tenantId);
    
    if (tenant.databaseShard) {
      // Connect to tenant-specific database
      return createConnection(tenant.databaseShard);
    }
    
    // Use default connection with RLS
    return defaultConnection;
  }
}
```

**Strategy 2: Partitioning by Tenant**
```sql
-- Partition trades table by tenant_id
CREATE TABLE trades (
  -- ... columns
) PARTITION BY HASH (tenant_id);

-- Create partitions for active tenants
CREATE TABLE trades_tenant_1 PARTITION OF trades 
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
```

## 5. Data Model & Database Design

### 5.1 Complete Schema Definition

```typescript
// DrizzleORM Schema Definition
import { 
  pgTable, uuid, varchar, text, timestamp, 
  decimal, integer, jsonb, boolean, index 
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  identityProvider: varchar('identity_provider', { length: 50 }), // 'email', 'google'
  oauthProviderId: varchar('oauth_provider_id', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  emailVerified: boolean('email_verified').default(false),
  verificationToken: varchar('verification_token', { length: 255 }),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_oauth_idx').on(table.oauthProviderId)
]);

// Tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique(),
  plan: varchar('plan', { length: 50 }).default('free'),
  settings: jsonb('settings').default({}),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tenant Users (junction table)
export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().default('MEMBER'),
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => [
  index('tenant_users_tenant_idx').on(table.tenantId),
  index('tenant_users_user_idx').on(table.userId),
  index('tenant_users_unique').on(table.tenantId, table.userId).unique()
]);

// Trades table
export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  exchange: varchar('exchange', { length: 50 }),
  instrument: varchar('instrument', { length: 50 }), // 'equity', 'future', 'option'
  side: varchar('side', { length: 10 }).notNull(), // 'BUY', 'SELL', 'SHORT'
  entryPrice: decimal('entry_price', { precision: 12, scale: 4 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 12, scale: 4 }),
  quantity: integer('quantity').notNull(),
  fees: decimal('fees', { precision: 10, scale: 2 }).default('0'),
  pnl: decimal('pnl', { precision: 12, scale: 2 }),
  pnlPercentage: decimal('pnl_percentage', { precision: 8, scale: 4 }),
  entryTimestamp: timestamp('entry_timestamp').notNull(),
  exitTimestamp: timestamp('exit_timestamp'),
  notes: text('notes'),
  strategy: varchar('strategy', { length: 100 }),
  tags: jsonb('tags').default([]),
  status: varchar('status', { length: 20 }).default('OPEN'), // 'OPEN', 'CLOSED', 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('trades_tenant_idx').on(table.tenantId),
  index('trades_user_idx').on(table.userId),
  index('trades_symbol_idx').on(table.symbol),
  index('trades_timestamp_idx').on(table.entryTimestamp),
  index('trades_status_idx').on(table.status)
]);

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('tags_tenant_idx').on(table.tenantId),
  index('tags_name_idx').on(table.name)
]);

// Trade Tags junction table
export const tradeTags = pgTable('trade_tags', {
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('trade_tags_trade_idx').on(table.tradeId),
  index('trade_tags_tag_idx').on(table.tagId)
]);

// Uploads table (for trade attachments)
export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('uploads_tenant_idx').on(table.tenantId),
  index('uploads_trade_idx').on(table.tradeId),
  index('uploads_user_idx').on(table.userId)
]);

// Analytics cache table
export const analyticsCache = pgTable('analytics_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  period: varchar('period', { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
  date: date('date').notNull(),
  metric: varchar('metric', { length: 50 }).notNull(),
  value: jsonb('value').notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow(),
}, (table) => [
  index('analytics_cache_tenant_idx').on(table.tenantId),
  index('analytics_cache_period_idx').on(table.period, table.date),
  index('analytics_cache_metric_idx').on(table.metric)
]);

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),
  razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 255 }),
  razorpayCustomerId: varchar('razorpay_customer_id', { length: 255 }),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  trialEndsAt: timestamp('trial_ends_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// API Keys table (for future API access)
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  key: varchar('key', { length: 64 }).notNull().unique(),
  secretHash: varchar('secret_hash', { length: 255 }).notNull(),
  scopes: jsonb('scopes').notNull().default([]),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('api_keys_tenant_idx').on(table.tenantId),
  index('api_keys_key_idx').on(table.key)
]);
```

### 5.2 Database Indexing Strategy

```sql
-- Critical indexes for performance
CREATE INDEX idx_trades_tenant_exit ON trades(tenant_id, exit_timestamp DESC) 
  WHERE exit_timestamp IS NOT NULL;

CREATE INDEX idx_trades_tenant_symbol_date ON trades(tenant_id, symbol, entry_timestamp DESC);

CREATE INDEX idx_trades_pnl ON trades(tenant_id, pnl DESC) 
  WHERE pnl IS NOT NULL;

CREATE INDEX idx_analytics_cache_tenant_period ON analytics_cache(tenant_id, period, date DESC);

-- Partial indexes for common queries
CREATE INDEX idx_open_trades ON trades(tenant_id, user_id, status) 
  WHERE status = 'OPEN';

CREATE INDEX idx_winning_trades ON trades(tenant_id, pnl) 
  WHERE pnl > 0;

-- Composite indexes for filtering
CREATE INDEX idx_trades_filter ON trades(tenant_id, symbol, side, entry_timestamp);
```

## 6. Service Layer Architecture

### 6.1 Trade Service

```typescript
// Trade Service with business logic
export class TradeService {
  constructor(
    private db: DbClient,
    private analyticsService: AnalyticsService,
    private cacheService: CacheService
  ) {}
  
  async createTrade(tenantId: string, userId: string, data: CreateTradeDto) {
    return await this.db.transaction(async (tx) => {
      // Validate trade data
      const validated = await this.validateTrade(data);
      
      // Calculate P&L
      const pnl = this.calculatePnL({
        side: validated.side,
        entryPrice: validated.entryPrice,
        exitPrice: validated.exitPrice,
        quantity: validated.quantity,
        fees: validated.fees
      });
      
      // Create trade
      const [trade] = await tx.insert(trades).values({
        tenantId,
        userId,
        ...validated,
        pnl,
        pnlPercentage: this.calculatePnLPercentage(pnl, validated.entryPrice, validated.quantity),
        status: validated.exitPrice ? 'CLOSED' : 'OPEN'
      }).returning();
      
      // Handle tags if provided
      if (validated.tags?.length) {
        await this.handleTradeTags(tx, trade.id, validated.tags);
      }
      
      // Invalidate analytics cache
      await this.cacheService.invalidate(`analytics:${tenantId}:*`);
      
      // Queue background job for analytics recalculation
      await this.queueAnalyticsRecalculation(tenantId);
      
      return trade;
    });
  }
  
  private calculatePnL(params: {
    side: 'BUY' | 'SELL' | 'SHORT';
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    fees: number;
  }): number {
    if (!params.exitPrice) return 0;
    
    const priceDifference = params.exitPrice - params.entryPrice;
    const multiplier = params.side === 'BUY' ? 1 : -1;
    
    return (priceDifference * params.quantity * multiplier) - params.fees;
  }
  
  async bulkImport(tenantId: string, userId: string, csvData: string) {
    // Parse CSV
    const trades = await this.parseCSV(csvData);
    
    // Validate each trade
    const validatedTrades = await Promise.all(
      trades.map(trade => this.validateTrade(trade))
    );
    
    // Use batch insert for performance
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < validatedTrades.length; i += batchSize) {
      const batch = validatedTrades.slice(i, i + batchSize);
      
      const inserted = await this.db.insert(trades).values(
        batch.map(trade => ({
          tenantId,
          userId,
          ...trade,
          pnl: this.calculatePnL(trade),
          status: trade.exitPrice ? 'CLOSED' : 'OPEN'
        }))
      ).returning();
      
      results.push(...inserted);
    }
    
    // Queue analytics recalculation
    await this.queueAnalyticsRecalculation(tenantId);
    
    return {
      success: results.length,
      failed: validatedTrades.length - results.length,
      trades: results
    };
  }
}
```

### 6.2 Analytics Service

```typescript
// Analytics Service with caching
export class AnalyticsService {
  constructor(
    private db: DbClient,
    private redis: RedisClient,
    private tradeService: TradeService
  ) {}
  
  async getDashboardSummary(tenantId: string, filters?: AnalyticsFilters) {
    const cacheKey = `analytics:${tenantId}:summary:${this.hashFilters(filters)}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Calculate summary
    const summary = await this.calculateSummary(tenantId, filters);
    
    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(summary), 'EX', 300);
    
    return summary;
  }
  
  private async calculateSummary(tenantId: string, filters?: AnalyticsFilters) {
    const whereClause = this.buildWhereClause(tenantId, filters);
    
    const [
      tradeStats,
      equityCurve,
      topSymbols,
      performanceByDay
    ] = await Promise.all([
      this.getTradeStats(whereClause),
      this.getEquityCurve(whereClause),
      this.getTopSymbols(whereClause),
      this.getPerformanceByDay(whereClause)
    ]);
    
    return {
      ...tradeStats,
      equityCurve,
      topSymbols,
      performanceByDay,
      calculatedAt: new Date()
    };
  }
  
  private async getTradeStats(whereClause: SQL) {
    return await this.db.select({
      totalTrades: count(),
      winningTrades: count(trades.pnl).filter(gt(trades.pnl, 0)),
      losingTrades: count(trades.pnl).filter(lt(trades.pnl, 0)),
      totalPnL: sum(trades.pnl),
      avgWin: avg(trades.pnl).filter(gt(trades.pnl, 0)),
      avgLoss: avg(trades.pnl).filter(lt(trades.pnl, 0)),
      largestWin: max(trades.pnl),
      largestLoss: min(trades.pnl)
    }).from(trades)
    .where(whereClause)
    .then(rows => rows[0]);
  }
  
  async getEquityCurveData(tenantId: string, period: 'daily' | 'weekly' | 'monthly') {
    const cacheKey = `analytics:${tenantId}:equity:${period}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const data = await this.calculateEquityCurve(tenantId, period);
    
    // Cache for longer periods
    const ttl = period === 'daily' ? 300 : 3600; // 5 min or 1 hour
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', ttl);
    
    return data;
  }
  
  private async calculateEquityCurve(tenantId: string, period: string) {
    let truncateFn: SQL;
    switch (period) {
      case 'daily':
        truncateFn = sql`DATE_TRUNC('day', ${trades.exitTimestamp})`;
        break;
      case 'weekly':
        truncateFn = sql`DATE_TRUNC('week', ${trades.exitTimestamp})`;
        break;
      case 'monthly':
        truncateFn = sql`DATE_TRUNC('month', ${trades.exitTimestamp})`;
        break;
    }
    
    const results = await this.db.select({
      period: truncateFn.as('period'),
      pnl: sum(trades.pnl)
    }).from(trades)
    .where(and(
      eq(trades.tenantId, tenantId),
      isNotNull(trades.exitTimestamp)
    ))
    .groupBy(sql`period`)
    .orderBy(sql`period`);
    
    // Calculate cumulative P&L
    let cumulative = 0;
    return results.map(row => {
      cumulative += Number(row.pnl || 0);
      return {
        date: row.period,
        pnl: Number(row.pnl),
        cumulativePnL: cumulative
      };
    });
  }
}
```

## 7. API Layer Design

### 7.1 REST API Structure

```typescript
// Express route definitions
import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Authentication middleware
router.use('/api/*', authenticate);
router.use('/api/*', setTenantContext);

// Trade routes
router.get('/api/trades', 
  validateQuery(tradeQuerySchema),
  requirePermission('canViewAnalytics'),
  tradeController.listTrades
);

router.post('/api/trades',
  validateBody(createTradeSchema),
  requirePermission('canCreateTrades'),
  tradeController.createTrade
);

router.put('/api/trades/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateTradeSchema),
  requirePermission('canEditOwnTrades'),
  tradeController.updateTrade
);

router.delete('/api/trades/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  requirePermission('canDeleteOwnTrades'),
  tradeController.deleteTrade
);

// Analytics routes
router.get('/api/analytics/summary',
  requirePermission('canViewAnalytics'),
  validateQuery(analyticsQuerySchema),
  analyticsController.getSummary
);

router.get('/api/analytics/equity-curve',
  requirePermission('canViewAnalytics'),
  analyticsController.getEquityCurve
);

// Billing routes
router.get('/api/billing/subscription',
  requirePermission('canManageBilling'),
  billingController.getSubscription
);

router.post('/api/billing/create-checkout',
  requirePermission('canManageBilling'),
  validateBody(checkoutSchema),
  billingController.createCheckout
);

// Webhook routes (no authentication required, but signature verification)
router.post('/webhooks/razorpay',
  razorpayWebhookSignature,
  webhookController.handleRazorpay
);
```

### 7.2 API Rate Limiting

```typescript
// Rate limiting middleware with Redis
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const authLimiter = rateLimit({
  store: new RedisStore({
    prefix: 'rl:auth:',
    sendCommand: (...args: string[]) => redis.sendCommand(args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour per IP
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
  store: new RedisStore({
    prefix: 'rl:api:',
    sendCommand: (...args: string[]) => redis.sendCommand(args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Different limits based on user role/plan
    const user = req.user;
    if (!user) return 100; // Unauthenticated
    
    // Check user's plan from tenant
    return user.plan === 'enterprise' ? 10000 : 
           user.plan === 'pro' ? 1000 : 100;
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Rate limit exceeded'
});

// Apply rate limits
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);
```

## 8. Background Jobs & Queue System

### 8.1 BullMQ Setup

```typescript
// Worker configuration
import { Worker, Queue, QueueEvents } from 'bullmq';

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

// Queues
export const importQueue = new Queue('imports', { connection });
export const exportQueue = new Queue('exports', { connection });
export const analyticsQueue = new Queue('analytics', { connection });
export const emailQueue = new Queue('emails', { connection });

// Import Worker
const importWorker = new Worker('imports', async (job) => {
  const { tenantId, userId, filePath, originalFilename } = job.data;
  
  try {
    // Read and parse CSV
    const csvData = await fs.readFile(filePath, 'utf-8');
    
    // Process imports
    const result = await tradeService.bulkImport(tenantId, userId, csvData);
    
    // Update job progress
    await job.updateProgress(100);
    
    // Send notification email
    await emailQueue.add('import-complete', {
      tenantId,
      userId,
      result
    });
    
    // Clean up temp file
    await fs.unlink(filePath);
    
    return result;
  } catch (error) {
    // Log error and update job
    await job.log(`Import failed: ${error.message}`);
    throw error;
  }
}, { connection });

// Analytics Worker
const analyticsWorker = new Worker('analytics', async (job) => {
  const { tenantId, recalculateAll = false } = job.data;
  
  // Recalculate all analytics
  const periods = ['daily', 'weekly', 'monthly', 'yearly'];
  
  for (const period of periods) {
    await job.updateProgress((periods.indexOf(period) / periods.length) * 100);
    
    await analyticsService.calculateAndCacheAnalytics(tenantId, period);
  }
  
  // Update last calculated timestamp
  await db.update(tenants)
    .set({ analyticsUpdatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}, { connection });
```

### 8.2 Job Scheduling

```typescript
// Scheduled jobs using BullMQ
import { CronJob } from 'cron';

// Daily analytics recalculation at 2 AM
new CronJob('0 2 * * *', async () => {
  // Get all active tenants
  const tenants = await db.select().from(tenants)
    .where(eq(tenants.status, 'active'));
  
  // Queue analytics jobs for each tenant
  for (const tenant of tenants) {
    await analyticsQueue.add('daily-recalculation', {
      tenantId: tenant.id,
      date: new Date().toISOString().split('T')[0]
    }, {
      delay: Math.random() * 3600000 // Spread over an hour
    });
  }
}).start();

// Weekly email reports on Monday at 9 AM
new CronJob('0 9 * * 1', async () => {
  const tenants = await db.select().from(tenants)
    .where(eq(tenants.plan, 'pro'));
  
  for (const tenant of tenants) {
    await emailQueue.add('weekly-report', {
      tenantId: tenant.id,
      period: 'weekly'
    });
  }
}).start();
```

## 9. File Storage & Upload System

### 9.1 S3 Upload Flow

```typescript
// Upload service with S3 presigned URLs
export class UploadService {
  constructor(
    private s3: AWS.S3,
    private db: DbClient
  ) {}
  
  async generatePresignedUrl(
    tenantId: string,
    userId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    tradeId?: string
  ) {
    // Validate file type and size
    this.validateFile(fileName, mimeType, fileSize);
    
    // Generate unique storage key
    const fileId = crypto.randomUUID();
    const extension = path.extname(fileName);
    const storageKey = `uploads/${tenantId}/${fileId}${extension}`;
    
    // Generate presigned URL for upload
    const presignedUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: process.env.S3_BUCKET,
      Key: storageKey,
      ContentType: mimeType,
      ContentLength: fileSize,
      Expires: 300, // 5 minutes
      Metadata: {
        tenantId,
        userId,
        originalName: fileName
      }
    });
    
    // Create upload record in database
    const [upload] = await db.insert(uploads).values({
      tenantId,
      userId,
      tradeId,
      fileName,
      fileSize,
      mimeType,
      storageKey,
      url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${storageKey}`,
      metadata: {}
    }).returning();
    
    return {
      uploadId: upload.id,
      presignedUrl,
      uploadUrl: upload.url,
      expiresIn: 300
    };
  }
  
  async confirmUpload(uploadId: string) {
    const [upload] = await db.update(uploads)
      .set({ status: 'COMPLETED' })
      .where(eq(uploads.id, uploadId))
      .returning();
    
    // Generate thumbnail for images
    if (upload.mimeType.startsWith('image/')) {
      await this.queueThumbnailGeneration(upload);
    }
    
    return upload;
  }
  
  private validateFile(fileName: string, mimeType: string, fileSize: number) {
    // Allowed MIME types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/json'
    ];
    
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} not allowed`);
    }
    
    // Size limits based on plan
    const maxSize = 5 * 1024 * 1024; // 5MB default
    
    if (fileSize > maxSize) {
      throw new Error(`File size ${fileSize} exceeds limit of ${maxSize}`);
    }
    
    // Validate file extension
    const extension = path.extname(fileName).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.csv', '.json'];
    
    if (!allowedExtensions.includes(extension)) {
      throw new Error(`File extension ${extension} not allowed`);
    }
  }
}
```

### 9.2 Frontend Upload Component

```typescript
// React component for file uploads
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export function TradeAttachmentUpload({ tradeId, onUploadComplete }: {
  tradeId: string;
  onUploadComplete: (url: string) => void;
}) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        // 1. Get presigned URL from backend
        const response = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            tradeId
          })
        });
        
        const { uploadId, presignedUrl, uploadUrl } = await response.json();
        
        // 2. Upload directly to S3
        await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });
        
        // 3. Confirm upload with backend
        await fetch(`/api/uploads/${uploadId}/confirm`, {
          method: 'POST'
        });
        
        onUploadComplete(uploadUrl);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [tradeId, onUploadComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });
  
  return (
    <div {...getRootProps()} className={`
      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
      ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
    `}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <p>Drag & drop trade screenshots or PDFs here, or click to select</p>
      )}
      <p className="text-sm text-gray-500 mt-2">Max file size: 5MB</p>
    </div>
  );
}
```

## 10. Billing & Subscription System

### 10.1 Razorpay Integration

```typescript
// Billing service with Razorpay
export class BillingService {
  private razorpay: Razorpay;
  
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
  }
  
  async createSubscription(
    tenantId: string,
    plan: 'pro' | 'enterprise',
    billingCycle: 'monthly' | 'yearly'
  ) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });
    
    if (!tenant) throw new Error('Tenant not found');
    
    // Calculate price based on plan and cycle
    const price = this.getPlanPrice(plan, billingCycle);
    
    // Create or get Razorpay customer
    let customerId = tenant.razorpayCustomerId;
    if (!customerId) {
      // Get user email for customer creation
      const owner = await db.query.users.findFirst({
        where: eq(users.id, tenant.ownerUserId)
      });
      
      const customer = await this.razorpay.customers.create({
        name: tenant.name,
        email: owner?.email,
        notes: {
          tenantId
        }
      });
      
      customerId = customer.id;
      
      // Update tenant with customer ID
      await db.update(tenants)
        .set({ razorpayCustomerId: customerId })
        .where(eq(tenants.id, tenantId));
    }
    
    // Create subscription
    const subscription = await this.razorpay.subscriptions.create({
      plan_id: this.getPlanId(plan, billingCycle),
      customer_id: customerId,
      total_count: billingCycle === 'monthly' ? 12 : 1, // 12 months or 1 year
      quantity: 1,
      notes: {
        tenantId,
        plan,
        billingCycle
      }
    });
    
    // Create subscription record in database
    await db.insert(subscriptions).values({
      tenantId,
      razorpaySubscriptionId: subscription.id,
      razorpayCustomerId: customerId,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      metadata: subscription
    });
    
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      checkoutUrl: `https://razorpay.com/payment-page/${subscription.id}`
    };
  }
  
  async handleWebhook(event: RazorpayWebhookEvent) {
    // Verify webhook signature
    const isValid = this.verifyWebhookSignature(
      event.payload,
      event.signature,
      event.secret
    );
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
    
    const { entity, event: eventType } = event.payload;
    
    switch (eventType) {
      case 'subscription.activated':
        await this.handleSubscriptionActivated(entity);
        break;
      
      case 'subscription.charged':
        await this.handleSubscriptionCharged(entity);
        break;
      
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(entity);
        break;
      
      case 'payment.failed':
        await this.handlePaymentFailed(entity);
        break;
    }
  }
  
  private async handleSubscriptionActivated(subscription: any) {
    const tenantId = subscription.notes.tenantId;
    
    await db.update(subscriptions)
      .set({
        status: 'active',
        plan: subscription.notes.plan,
        currentPeriodStart: new Date(subscription.current_start * 1000),
        currentPeriodEnd: new Date(subscription.current_end * 1000)
      })
      .where(eq(subscriptions.razorpaySubscriptionId, subscription.id));
    
    // Update tenant plan
    await db.update(tenants)
      .set({ 
        plan: subscription.notes.plan,
        trialEndsAt: null // End trial if active
      })
      .where(eq(tenants.id, tenantId));
    
    // Send welcome email for new plan
    await emailService.sendPlanUpgradeEmail(tenantId, subscription.notes.plan);
  }
}
```

### 10.2 Usage Tracking & Enforcement

```typescript
// Usage tracking middleware
export async function checkUsageLimits(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { tenantId } = req.user;
  
  // Get tenant's current plan
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    with: {
      subscription: true
    }
  });
  
  if (!tenant) return next(new Error('Tenant not found'));
  
  const plan = tenant.subscription?.plan || 'free';
  
  // Check trade count for the month
  if (req.method === 'POST' && req.path.includes('/trades')) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const tradeCount = await db.$count(trades, {
      where: and(
        eq(trades.tenantId, tenantId),
        gte(trades.createdAt, `${currentMonth}-01`),
        lt(trades.createdAt, `${currentMonth}-32`)
      )
    });
    
    const planLimits = {
      free: 50,
      pro: 500,
      enterprise: Infinity
    };
    
    if (tradeCount >= planLimits[plan]) {
      return res.status(403).json({
        error: 'Monthly trade limit reached',
        current: tradeCount,
        limit: planLimits[plan],
        upgradeUrl: '/billing/upgrade'
      });
    }
  }
  
  // Check storage usage
  if (req.path.includes('/uploads')) {
    const storageUsage = await db.$sum(uploads, 'fileSize', {
      where: eq(uploads.tenantId, tenantId)
    });
    
    const storageLimits = {
      free: 100 * 1024 * 1024, // 100MB
      pro: 1 * 1024 * 1024 * 1024, // 1GB
      enterprise: 10 * 1024 * 1024 * 1024 // 10GB
    };
    
    if (storageUsage >= storageLimits[plan]) {
      return res.status(403).json({
        error: 'Storage limit reached',
        upgradeUrl: '/billing/upgrade'
      });
    }
  }
  
  next();
}
```

## 11. Monitoring, Logging & Observability

### 11.1 Structured Logging

```typescript
// Winston logger configuration
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      ip: req.ip
    });
  });
  
  next();
}
```

### 11.2 Error Tracking with Sentry

```typescript
// Sentry integration
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    nodeProfilingIntegration()
  ],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});

// Error handling middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Global error handler
app.use(Sentry.Handlers.errorHandler());

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    url: req.url,
    method: req.method
  });
  
  // Report to Sentry with user context
  Sentry.withScope((scope) => {
    scope.setUser({
      id: req.user?.id,
      email: req.user?.email,
      tenantId: req.user?.tenantId
    });
    Sentry.captureException(err);
  });
  
  // Return appropriate response
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: 'Internal server error',
      requestId: req.id 
    });
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack,
      requestId: req.id 
    });
  }
});
```

### 11.3 Performance Monitoring

```typescript
// Custom metrics collection
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

// Metrics middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  
  next();
});

// Database query monitoring
const originalQuery = db.execute;
db.execute = async function (...args) {
  const start = Date.now();
  try {
    const result = await originalQuery.apply(this, args);
    const duration = (Date.now() - start) / 1000;
    
    dbQueryDuration.observe({
      operation: 'query',
      table: this.getTableName()
    }, duration);
    
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe({
      operation: 'error',
      table: this.getTableName()
    }, duration);
    throw error;
  }
};

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

## 12. Deployment Strategy

### 12.1 Infrastructure as Code

```yaml
# docker-compose.yml for local development
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: trading_journal
      POSTGRES_PASSWORD: trading_journal_dev
      POSTGRES_DB: trading_journal_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass redis_dev_password
    volumes:
      - redis_data:/data
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://trading_journal:trading_journal_dev@postgres:5432/trading_journal_dev
      REDIS_URL: redis://:redis_dev_password@redis:6379
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### 12.2 Production Deployment

**Vercel Configuration (`vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "REDIS_URL": "@redis-url",
    "JWT_SECRET": "@jwt-secret",
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret",
    "RAZORPAY_KEY_ID": "@razorpay-key-id",
    "RAZORPAY_KEY_SECRET": "@razorpay-key-secret",
    "AWS_ACCESS_KEY_ID": "@aws-access-key-id",
    "AWS_SECRET_ACCESS_KEY": "@aws-secret-access-key",
    "S3_BUCKET": "@s3-bucket",
    "SENTRY_DSN": "@sentry-dsn"
  }
}
```

**Render Configuration (`render.yaml`):**
```yaml
services:
  - type: web
    name: trading-journal-api
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: trading-journal-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: trading-journal-redis
          property: connectionString
  
  - type: worker
    name: trading-journal-workers
    env: node
    buildCommand: npm run build
    startCommand: npm run start:workers
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: trading-journal-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: trading-journal-redis
          property: connectionString

databases:
  - name: trading-journal-db
    databaseName: trading_journal
    user: trading_journal

redis:
  - name: trading-journal-redis
    ipAllowList: []
```

### 12.3 CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          REDIS_URL: redis://localhost:6379
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
      
      - name: Run migrations
        run: npm run db:migrate:prod
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Send deployment notification
        run: |
          curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"Deployment completed successfully!"}' \
          ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 12.4 Monitoring & Alerting Setup

```yaml
# AlertManager configuration
global:
  slack_api_url: 'https://hooks.slack.com/services/...'

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
  
  - name: 'critical-alerts'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 {{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'
    pagerduty_configs:
      - routing_key: ${{ secrets.PAGERDUTY_KEY }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

## 13. Security Implementation

### 13.1 Security Headers

```typescript
// Helmet.js configuration for security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.tradingjournal.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
```

### 13.2 Input Validation & Sanitization

```typescript
// Zod validation schemas
import { z } from 'zod';

export const createTradeSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol too long')
    .regex(/^[A-Z0-9.]+$/, 'Invalid symbol format'),
  
  side: z.enum(['BUY', 'SELL', 'SHORT']),
  
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .max(1000000, 'Price too high'),
  
  exitPrice: z.number()
    .positive('Exit price must be positive')
    .optional(),
  
  quantity: z.number()
    .int('Quantity must be integer')
    .positive('Quantity must be positive')
    .max(1000000, 'Quantity too high'),
  
  fees: z.number()
    .nonnegative('Fees cannot be negative')
    .max(10000, 'Fees too high')
    .default(0),
  
  entryTimestamp: z.string().datetime(),
  exitTimestamp: z.string().datetime().optional(),
  
  notes: z.string()
    .max(5000, 'Notes too long')
    .optional(),
  
  tags: z.array(z.string().uuid()).optional()
});

// Validation middleware
export function validateBody(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}
```

### 13.3 SQL Injection Prevention

```typescript
// DrizzleORM provides SQL injection protection by default
// Example of safe query building
export async function getTradesWithFilters(
  tenantId: string,
  filters: TradeFilters
) {
  const conditions: SQL[] = [eq(trades.tenantId, tenantId)];
  
  if (filters.symbol) {
    conditions.push(eq(trades.symbol, filters.symbol));
  }
  
  if (filters.fromDate) {
    conditions.push(gte(trades.entryTimestamp, filters.fromDate));
  }
  
  if (filters.toDate) {
    conditions.push(lte(trades.entryTimestamp, filters.toDate));
  }
  
  if (filters.tags && filters.tags.length > 0) {
    conditions.push(sql`${trades.tags} @> ${JSON.stringify(filters.tags)}`);
  }
  
  // Safe parameterized query
  return await db.select()
    .from(trades)
    .where(and(...conditions))
    .orderBy(desc(trades.entryTimestamp))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);
}
```

## 14. Performance Optimization

### 14.1 Caching Strategy

```typescript
// Multi-layer caching with Redis
export class CacheService {
  constructor(private redis: RedisClient) {}
  
  async getOrSet<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache with TTL
    await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    
    return data;
  }
  
  async invalidatePattern(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Cache warming
  async warmAnalyticsCache(tenantId: string) {
    const cacheKeys = [
      `analytics:${tenantId}:summary:daily`,
      `analytics:${tenantId}:equity:daily`,
      `analytics:${tenantId}:performance:monthly`
    ];
    
    for (const key of cacheKeys) {
      const data = await analyticsService.calculateForCache(key);
      await this.redis.set(key, JSON.stringify(data), 'EX', 3600);
    }
  }
}
```

### 14.2 Database Query Optimization

```sql
-- Materialized views for heavy analytics
CREATE MATERIALIZED VIEW monthly_analytics AS
SELECT 
  tenant_id,
  DATE_TRUNC('month', exit_timestamp) as month,
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE pnl > 0) as winning_trades,
  SUM(pnl) as total_pnl,
  AVG(pnl) as avg_pnl,
  MIN(pnl) as worst_trade,
  MAX(pnl) as best_trade
FROM trades
WHERE exit_timestamp IS NOT NULL
GROUP BY tenant_id, DATE_TRUNC('month', exit_timestamp);

-- Refresh materialized views concurrently
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_analytics;

-- Create indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_trades_tenant_symbol_date 
ON trades(tenant_id, symbol, entry_timestamp DESC);

CREATE INDEX CONCURRENTLY idx_trades_pnl_tenant 
ON trades(tenant_id, pnl DESC) 
WHERE pnl IS NOT NULL;
```

### 14.3 Frontend Performance

```typescript
// Next.js performance optimizations
// 1. Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const EquityChart = dynamic(() => import('./EquityChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

// 2. React Query for data fetching with caching
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1
    }
  }
});

// 3. Optimistic updates for better UX
const { mutate: updateTrade } = useMutation({
  mutationFn: (trade: Trade) => api.updateTrade(trade.id, trade),
  onMutate: async (updatedTrade) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['trades', updatedTrade.id]);
    
    // Snapshot previous value
    const previousTrade = queryClient.getQueryData(['trades', updatedTrade.id]);
    
    // Optimistically update
    queryClient.setQueryData(['trades', updatedTrade.id], updatedTrade);
    
    return { previousTrade };
  },
  onError: (err, trade, context) => {
    // Rollback on error
    queryClient.setQueryData(['trades', trade.id], context?.previousTrade);
  },
  onSettled: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries(['trades']);
  }
});
```

## 15. Disaster Recovery & Backup

### 15.1 Backup Strategy

```bash
#!/bin/bash
# Database backup script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="trading_journal"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$BACKUP_DIR/$DB_NAME_$DATE.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$DB_NAME_$DATE.dump" \
  "s3://$S3_BUCKET/backups/database/$DB_NAME_$DATE.dump"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# Redis backup
redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"
aws s3 cp "$BACKUP_DIR/redis_$DATE.rdb" \
  "s3://$S3_BUCKET/backups/redis/redis_$DATE.rdb"
```

### 15.2 Recovery Procedures

```typescript
// Database recovery service
export class RecoveryService {
  async restoreDatabase(backupFile: string) {
    // 1. Put application in maintenance mode
    await this.enableMaintenanceMode();
    
    try {
      // 2. Drop and recreate database
      await this.recreateDatabase();
      
      // 3. Restore from backup
      await this.restoreBackup(backupFile);
      
      // 4. Run migrations
      await this.runMigrations();
      
      // 5. Clear Redis cache
      await redis.flushall();
      
      // 6. Disable maintenance mode
      await this.disableMaintenanceMode();
      
      return { success: true };
    } catch (error) {
      // Log error and alert
      logger.error('Database recovery failed', { error });
      await this.sendRecoveryAlert(error);
      
      throw error;
    }
  }
  
  private async enableMaintenanceMode() {
    await redis.set('maintenance_mode', 'true', 'EX', 3600); // 1 hour
    
    // Update status page
    await fetch('https://status.tradingjournal.com/api/incident', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.STATUS_PAGE_TOKEN}` },
      body: JSON.stringify({
        name: 'Database Maintenance',
        status: 'investigating',
        body: 'Database recovery in progress'
      })
    });
  }
}
```

---

## Summary

This System Design Document provides a comprehensive architecture for the Trading Journal SaaS application. Key highlights:

1. **Multi-tenant Architecture**: Row-level security with PostgreSQL RLS ensures data isolation
2. **Authentication**: Custom JWT with refresh tokens + Google OAuth with account linking
3. **Authorization**: RBAC with four roles (Owner, Admin, Member, Viewer)
4. **Performance**: Redis caching, materialized views, and query optimization
5. **Scalability**: Horizontal scaling with load balancers and read replicas
6. **Security**: Comprehensive security measures including rate limiting, input validation, and secure headers
7. **Monitoring**: Structured logging, error tracking, and performance metrics
8. **Deployment**: CI/CD pipeline with automated testing and deployment

The system is designed to be scalable, secure, and maintainable while providing a robust platform for traders to track and analyze their performance.

---

**Document Version**: 2.0  
**Status**: Final  
**Next Review**: March 10, 2026