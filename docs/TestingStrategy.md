# Trading Journal - Testing Strategy Document

**Project:** Trading Journal (Personal → SaaS)  
**Author:** Junaid Ali Khan  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** December 8, 2025

---

## Executive Summary

This document outlines the comprehensive testing strategy for the Trading Journal application. It covers all testing levels from unit to end-to-end testing, with specific focus on API testing, database testing, and security testing for a financial application.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Testing Pyramid](#2-testing-pyramid)
3. [Test Environment Setup](#3-test-environment-setup)
4. [API Testing](#4-api-testing)
5. [Database Testing](#5-database-testing)
6. [Frontend Testing](#6-frontend-testing)
7. [Security Testing](#7-security-testing)
8. [Performance Testing](#8-performance-testing)
9. [Test Data Management](#9-test-data-management)
10. [CI/CD Integration](#10-cicd-integration)
11. [Quality Metrics](#11-quality-metrics)
12. [Testing Tools](#12-testing-tools)

---

## 1. Testing Philosophy

### 1.1 Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Test Early, Test Often** | Tests run on every commit |
| **Shift Left** | Security/performance testing early in SDLC |
| **Automate Everything** | 95%+ test automation coverage |
| **Test in Production-like Environment** | Staging environment mirrors production |
| **Fail Fast** | Quick feedback loops for developers |
| **Risk-Based Testing** | Focus on critical business features |

### 1.2 Testing Objectives

```
Primary Goals:
• Ensure data accuracy for financial calculations
• Maintain API contract stability
• Guarantee tenant data isolation
• Validate complex analytics calculations
• Ensure regulatory compliance

Success Metrics:
• < 1% production defects
• > 90% test automation coverage
• < 5 minutes test suite runtime
• < 24 hours bug turnaround time
```

### 1.3 Testing Scope

**In Scope:**
- All API endpoints and responses
- Database migrations and integrity
- Authentication/Authorization flows
- Financial calculations (PnL, win rate, etc.)
- Analytics engine accuracy
- Multi-tenancy isolation
- Security vulnerabilities
- Performance under load

**Out of Scope:**
- Browser compatibility testing (covered by component library)
- Third-party service failures (handled by monitoring)
- Load testing beyond defined limits
- User experience subjective feedback

---

## 2. Testing Pyramid

### 2.1 Testing Layers

```
          ┌─────────────────────┐
          │  E2E Tests (5%)     │
          │  • Critical user flows│
          │  • Integration tests  │
          └─────────────────────┘
                    │
          ┌─────────────────────┐
          │ Integration Tests   │
          │       (15%)         │
          │ • API integrations  │
          │ • Service contracts │
          └─────────────────────┘
                    │
          ┌─────────────────────┐
          │   Unit Tests        │
          │      (80%)          │
          │ • Pure functions    │
          │ • Business logic    │
          └─────────────────────┘
```

### 2.2 Test Distribution by Component

| Component | Unit Tests | Integration Tests | E2E Tests | Total |
|-----------|------------|-------------------|-----------|-------|
| **API Layer** | 70% | 25% | 5% | 40% |
| **Business Logic** | 85% | 10% | 5% | 30% |
| **Database Layer** | 60% | 35% | 5% | 15% |
| **Frontend** | 75% | 20% | 5% | 10% |
| **Security** | 50% | 40% | 10% | 5% |

### 2.3 Test Types by Feature Priority

| Feature Area | Criticality | Test Coverage |
|--------------|-------------|---------------|
| **Authentication** | Critical | 100% |
| **Trade Calculations** | Critical | 100% |
| **Tenant Isolation** | Critical | 100% |
| **Analytics Engine** | High | 95% |
| **File Uploads** | High | 90% |
| **Tag Management** | Medium | 85% |
| **User Preferences** | Medium | 80% |
| **Billing/Subscriptions** | High | 95% |

---

## 3. Test Environment Setup

### 3.1 Environment Matrix

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| **Local** | Development | Mock/Seeded | Developers |
| **CI/CD** | Automated Tests | Ephemeral | CI System |
| **Staging** | Pre-Production | Production-like | QA Team |
| **Production** | Live | Real data | All users |

### 3.2 Docker Compose for Test Environments

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  api:
    build: .
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/test_tradingjournal
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=test-secret-key
    depends_on:
      - db
      - redis
      - mailhog

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=test_tradingjournal
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
      - ./scripts/seed-test-data.sql:/docker-entrypoint-initdb.d/seed.sql

  redis:
    image: redis:7-alpine

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"  # Web UI
      - "1025:1025"  # SMTP

volumes:
  postgres_test_data:
```

### 3.3 Test Data Seeding Script

```sql
-- scripts/seed-test-data.sql
BEGIN;

-- Create test tenant
INSERT INTO tenants (id, name, slug, plan, status) 
VALUES (
    'test_tenant_001',
    'Test Trading Co',
    'test-trading',
    'pro',
    'active'
);

-- Create test users
INSERT INTO users (id, tenant_id, email, name, password_hash, role) 
VALUES 
(
    'test_user_001',
    'test_tenant_001',
    'owner@test.com',
    'Test Owner',
    -- Hash for "TestPass123!"
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG',
    'owner'
),
(
    'test_user_002',
    'test_tenant_001',
    'member@test.com',
    'Test Member',
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG',
    'member'
);

-- Create test tags
INSERT INTO tags (id, tenant_id, name, color) 
VALUES 
('test_tag_001', 'test_tenant_001', 'earnings', '#3B82F6'),
('test_tag_002', 'test_tenant_001', 'breakout', '#10B981');

-- Create test trades
INSERT INTO trades (id, tenant_id, user_id, symbol, side, entry_price, exit_price, quantity, fees, entry_timestamp, exit_timestamp) 
VALUES 
(
    'test_trade_001',
    'test_tenant_001',
    'test_user_001',
    'AAPL',
    'long',
    150.00,
    155.50,
    100,
    2.50,
    '2025-01-01T09:30:00Z',
    '2025-01-01T15:45:00Z'
),
(
    'test_trade_002',
    'test_tenant_001',
    'test_user_001',
    'TSLA',
    'short',
    250.00,
    240.00,
    50,
    1.25,
    '2025-01-02T10:00:00Z',
    '2025-01-02T14:30:00Z'
);

-- Link trades to tags
INSERT INTO trade_tags (trade_id, tag_id) 
VALUES 
('test_trade_001', 'test_tag_001'),
('test_trade_002', 'test_tag_002');

COMMIT;
```

### 3.4 Environment Variables for Testing

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_tradingjournal
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# External Services (Mocked)
S3_ENDPOINT=http://localhost:9000  # MinIO for testing
S3_BUCKET_NAME=test-uploads
RAZORPAY_MOCK=true
SMTP_HOST=localhost
SMTP_PORT=1025  # MailHog

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
TEST_PARALLEL=true
```

---

## 4. API Testing

### 4.1 API Test Strategy

**Testing Framework:** Jest + Supertest
**Coverage Target:** 95%+ for API endpoints
**Response Time:** < 200ms per endpoint (p95)

### 4.2 Authentication Tests

```typescript
// tests/api/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          password: 'SecurePass123!'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@test.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined(); // refresh token
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'owner@test.com', // Already exists
          name: 'Duplicate',
          password: 'SecurePass123!'
        })
        .expect(409);

      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@test.com',
          name: 'Weak User',
          password: 'weak'
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({ field: 'password' })
      );
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe('owner@test.com');
    });

    it('should enforce rate limiting', async () => {
      for (let i = 0; i < 11; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'owner@test.com',
            password: 'WrongPassword123!'
          });
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'TestPass123!'
        })
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
```

### 4.3 Trade API Tests

```typescript
// tests/api/trades.test.ts
describe('Trade API', () => {
  let authToken: string;
  let userId: string;
  let tenantId: string;

  beforeAll(async () => {
    // Get auth token for test user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@test.com',
        password: 'TestPass123!'
      });

    authToken = loginRes.body.data.accessToken;
    userId = loginRes.body.data.user.id;
    tenantId = loginRes.body.data.user.tenantId;
  });

  describe('POST /api/v1/trades', () => {
    it('should create a new trade', async () => {
      const tradeData = {
        symbol: 'GOOGL',
        side: 'long',
        entryPrice: 135.75,
        exitPrice: 140.25,
        quantity: 50,
        fees: 1.25,
        entryTimestamp: '2025-01-03T10:00:00Z',
        exitTimestamp: '2025-01-03T15:30:00Z',
        notes: 'Technical breakout play',
        tags: ['earnings', 'momentum']
      };

      const response = await request(app)
        .post('/api/v1/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tradeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.symbol).toBe('GOOGL');
      expect(response.body.data.pnl).toBe(222.5); // ((140.25-135.75)*50 - 1.25)
      expect(response.body.data.pnlPercentage).toBeCloseTo(3.28, 2);
      expect(response.body.data.tags).toHaveLength(2);
    });

    it('should validate trade timestamps', async () => {
      const response = await request(app)
        .post('/api/v1/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AAPL',
          side: 'long',
          entryPrice: 150,
          exitPrice: 155,
          quantity: 100,
          entryTimestamp: '2025-01-02T15:00:00Z',
          exitTimestamp: '2025-01-02T10:00:00Z' // Before entry
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({
          field: 'exitTimestamp',
          message: expect.stringContaining('after entry')
        })
      );
    });

    it('should enforce trade limits per plan', async () => {
      // Mock the plan limit check
      jest.spyOn(planService, 'checkTradeLimit').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'MSFT',
          side: 'long',
          entryPrice: 300,
          exitPrice: 310,
          quantity: 10,
          entryTimestamp: '2025-01-04T09:30:00Z',
          exitTimestamp: '2025-01-04T16:00:00Z'
        })
        .expect(403);

      expect(response.body.error.code).toBe('TRADE_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/v1/trades', () => {
    it('should list trades with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/trades?page=1&limit=10&sort=exitTimestamp&order=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean)
      });
    });

    it('should filter trades by date range', async () => {
      const response = await request(app)
        .get('/api/v1/trades?from=2025-01-01&to=2025-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All trades should be in January 2025
      response.body.data.items.forEach((trade: any) => {
        const tradeDate = new Date(trade.exitTimestamp);
        expect(tradeDate.getFullYear()).toBe(2025);
        expect(tradeDate.getMonth()).toBe(0); // January
      });
    });

    it('should enforce tenant isolation', async () => {
      // Create a different tenant/user
      const otherUserToken = await createTestUser('other@tenant.com', 'other_tenant');
      
      // Try to access first user's trades
      const response = await request(app)
        .get('/api/v1/trades')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      // Should return empty or different trades
      // Implementation depends on your data seeding
      expect(response.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/trades/:id', () => {
    it('should retrieve a specific trade', async () => {
      const response = await request(app)
        .get('/api/v1/trades/test_trade_001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test_trade_001');
      expect(response.body.data.symbol).toBe('AAPL');
      expect(response.body.data.tags).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent trade', async () => {
      await request(app)
        .get('/api/v1/trades/non_existent_id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent cross-tenant access', async () => {
      const otherUserToken = await createTestUser('hacker@test.com', 'hacker_tenant');
      
      await request(app)
        .get('/api/v1/trades/test_trade_001')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404); // Not found due to tenant isolation
    });
  });
});
```

### 4.4 Analytics API Tests

```typescript
// tests/api/analytics.test.ts
describe('Analytics API', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@test.com',
        password: 'TestPass123!'
      });
    authToken = loginRes.body.data.accessToken;
  });

  describe('GET /api/v1/analytics/summary', () => {
    it('should calculate correct summary statistics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/summary?from=2025-01-01&to=2025-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { trades, pnl, performance } = response.body.data;

      expect(trades.total).toBeGreaterThan(0);
      expect(trades.winRate).toBeGreaterThanOrEqual(0);
      expect(trades.winRate).toBeLessThanOrEqual(100);
      
      expect(pnl.total).toBeDefined();
      expect(pnl.average).toBeDefined();
      
      expect(performance.profitFactor).toBeGreaterThan(0);
      expect(performance.maxDrawdown).toBeLessThanOrEqual(0);
    });

    it('should use cache for repeated requests', async () => {
      const firstResponse = await request(app)
        .get('/api/v1/analytics/summary?from=2025-01-01&to=2025-01-31')
        .set('Authorization', `Bearer ${authToken}`);

      const secondResponse = await request(app)
        .get('/api/v1/analytics/summary?from=2025-01-01&to=2025-01-31')
        .set('Authorization', `Bearer ${authToken}`);

      // Check cache headers or response time
      expect(secondResponse.body.meta.cached).toBe(true);
      expect(secondResponse.body.meta.cacheAge).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/analytics/breakdown', () => {
    it('should break down by symbol', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/breakdown?dimension=symbol&from=2025-01-01&to=2025-01-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.dimension).toBe('symbol');
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      response.body.data.items.forEach((item: any) => {
        expect(item.value).toBeDefined(); // Symbol name
        expect(item.trades).toBeGreaterThan(0);
        expect(item.winRate).toBeGreaterThanOrEqual(0);
        expect(item.winRate).toBeLessThanOrEqual(100);
        expect(item.totalPnl).toBeDefined();
      });
    });

    it('should validate dimension parameter', async () => {
      await request(app)
        .get('/api/v1/analytics/breakdown?dimension=invalid_dimension')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
```

---

## 5. Database Testing

### 5.1 Database Migration Tests

```typescript
// tests/database/migrations.test.ts
import { migrate } from '../../src/database/migrate';
import { rollback } from '../../src/database/rollback';

describe('Database Migrations', () => {
  beforeEach(async () => {
    // Ensure clean state before each migration test
    await rollback('all');
  });

  test('should apply all migrations successfully', async () => {
    const result = await migrate();
    expect(result.success).toBe(true);
    expect(result.appliedMigrations.length).toBeGreaterThan(0);
  });

  test('should rollback specific migration', async () => {
    await migrate();
    
    const migrations = await getAppliedMigrations();
    const lastMigration = migrations[migrations.length - 1];
    
    const result = await rollback(lastMigration.version);
    expect(result.success).toBe(true);
    expect(result.rolledBackMigration).toBe(lastMigration.version);
  });

  test('should maintain data integrity after migration', async () => {
    // Insert test data before migration
    await insertTestData();
    
    // Apply migration
    await migrate();
    
    // Verify data still exists and is valid
    const trades = await getAllTrades();
    expect(trades.length).toBeGreaterThan(0);
    
    // Check new columns if added
    trades.forEach(trade => {
      expect(trade.tenant_id).toBeDefined();
      expect(trade.deleted_at).toBeNull(); // Soft delete not applied
    });
  });

  test('should enforce foreign key constraints', async () => {
    // Try to insert trade with non-existent tenant
    await expect(
      db.query('INSERT INTO trades (tenant_id, user_id, symbol) VALUES ($1, $2, $3)', [
        'non_existent_tenant',
        'test_user_001',
        'AAPL'
      ])
    ).rejects.toThrow(/foreign key constraint/);
  });
});
```

### 5.2 Data Integrity Tests

```typescript
// tests/database/integrity.test.ts
describe('Database Integrity', () => {
  test('PnL calculation should be accurate', async () => {
    const trade = await db.query(`
      SELECT 
        side,
        entry_price,
        exit_price,
        quantity,
        fees,
        pnl,
        pnl_percentage
      FROM trades 
      WHERE id = 'test_trade_001'
    `);

    const { side, entry_price, exit_price, quantity, fees, pnl, pnl_percentage } = trade.rows[0];
    
    let expectedPnl;
    if (side === 'long') {
      expectedPnl = (exit_price - entry_price) * quantity - fees;
    } else {
      expectedPnl = (entry_price - exit_price) * quantity - fees;
    }
    
    const expectedPercentage = (expectedPnl / (entry_price * quantity)) * 100;
    
    expect(pnl).toBeCloseTo(expectedPnl, 4);
    expect(pnl_percentage).toBeCloseTo(expectedPercentage, 4);
  });

  test('trade_tags should maintain referential integrity', async () => {
    // Delete a tag that's in use
    await expect(
      db.query('DELETE FROM tags WHERE id = $1', ['test_tag_001'])
    ).rejects.toThrow(/foreign key constraint/);
  });

  test('soft delete should not remove records', async () => {
    const tradeId = 'test_trade_001';
    
    // Soft delete
    await db.query('UPDATE trades SET deleted_at = NOW() WHERE id = $1', [tradeId]);
    
    // Should still exist in database
    const result = await db.query('SELECT * FROM trades WHERE id = $1', [tradeId]);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].deleted_at).not.toBeNull();
    
    // Should not appear in regular queries
    const activeTrades = await db.query(
      'SELECT * FROM trades WHERE deleted_at IS NULL AND id = $1',
      [tradeId]
    );
    expect(activeTrades.rows.length).toBe(0);
  });
});
```

### 5.3 Performance Tests for Queries

```typescript
// tests/database/performance.test.ts
describe('Database Performance', () => {
  test('trade listing query should be performant', async () => {
    // Generate large dataset
    await generateTestTrades(10000);
    
    const startTime = Date.now();
    
    const result = await db.query(`
      SELECT * FROM trades 
      WHERE tenant_id = $1 
        AND deleted_at IS NULL 
        AND exit_timestamp BETWEEN $2 AND $3
      ORDER BY exit_timestamp DESC
      LIMIT 50
    `, ['test_tenant_001', '2025-01-01', '2025-12-31']);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(result.rows.length).toBeLessThanOrEqual(50);
    expect(executionTime).toBeLessThan(100); // Should complete in < 100ms
  });

  test('analytics queries should use indexes', async () => {
    const explainResult = await db.query(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT 
        symbol,
        COUNT(*) as trade_count,
        SUM(pnl) as total_pnl
      FROM trades 
      WHERE tenant_id = 'test_tenant_001'
        AND deleted_at IS NULL
      GROUP BY symbol
      ORDER BY total_pnl DESC
    `);
    
    const plan = explainResult.rows.map(r => r['QUERY PLAN']).join('\n');
    
    // Check that index is being used
    expect(plan).toContain('Index Scan');
    expect(plan).not.toContain('Seq Scan');
  });
});
```

---

## 6. Frontend Testing

### 6.1 Component Testing (React + Testing Library)

```typescript
// tests/components/TradeForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TradeForm from '../../src/components/TradeForm';

describe('TradeForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockTags = [
    { id: 'tag1', name: 'earnings', color: '#3B82F6' },
    { id: 'tag2', name: 'breakout', color: '#10B981' }
  ];

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('should render all form fields', () => {
    render(<TradeForm onSubmit={mockOnSubmit} tags={mockTags} />);

    expect(screen.getByLabelText(/symbol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/side/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/entry price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exit price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/entry time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exit time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save trade/i })).toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    render(<TradeForm onSubmit={mockOnSubmit} tags={mockTags} />);

    fireEvent.click(screen.getByRole('button', { name: /save trade/i }));

    await waitFor(() => {
      expect(screen.getByText(/symbol is required/i)).toBeInTheDocument();
      expect(screen.getByText(/entry price is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('should calculate PnL in real-time', async () => {
    render(<TradeForm onSubmit={mockOnSubmit} tags={mockTags} />);

    await userEvent.type(screen.getByLabelText(/symbol/i), 'AAPL');
    await userEvent.selectOptions(screen.getByLabelText(/side/i), 'long');
    await userEvent.type(screen.getByLabelText(/entry price/i), '150');
    await userEvent.type(screen.getByLabelText(/exit price/i), '155');
    await userEvent.type(screen.getByLabelText(/quantity/i), '100');
    await userEvent.type(screen.getByLabelText(/fees/i), '2.5');

    // Check if PnL is calculated and displayed
    await waitFor(() => {
      expect(screen.getByText(/Estimated PnL:/i)).toBeInTheDocument();
      expect(screen.getByText(/\$447.50/i)).toBeInTheDocument(); // (155-150)*100 - 2.5
    });
  });

  test('should submit valid form data', async () => {
    render(<TradeForm onSubmit={mockOnSubmit} tags={mockTags} />);

    await userEvent.type(screen.getByLabelText(/symbol/i), 'AAPL');
    await userEvent.selectOptions(screen.getByLabelText(/side/i), 'long');
    await userEvent.type(screen.getByLabelText(/entry price/i), '150');
    await userEvent.type(screen.getByLabelText(/exit price/i), '155');
    await userEvent.type(screen.getByLabelText(/quantity/i), '100');
    await userEvent.type(screen.getByLabelText(/fees/i), '2.5');
    await userEvent.type(screen.getByLabelText(/entry time/i), '2025-01-01T09:30');
    await userEvent.type(screen.getByLabelText(/exit time/i), '2025-01-01T15:45');
    
    // Select tags
    await userEvent.click(screen.getByLabelText(/earnings/i));
    await userEvent.click(screen.getByLabelText(/breakout/i));

    fireEvent.click(screen.getByRole('button', { name: /save trade/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'AAPL',
        side: 'long',
        entryPrice: 150,
        exitPrice: 155,
        quantity: 100,
        fees: 2.5,
        tags: ['earnings', 'breakout']
      }));
    });
  });
});
```

### 6.2 Integration Testing with Mock API

```typescript
// tests/integration/TradeFlow.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../../src/App';

// Mock API server
const server = setupServer(
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          accessToken: 'mock-jwt-token',
          user: { id: 'user1', email: 'test@test.com', name: 'Test User' }
        }
      })
    );
  }),

  rest.get('/api/v1/trades', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          items: [
            { id: 'trade1', symbol: 'AAPL', pnl: 500, exitTimestamp: '2025-01-01T15:45:00Z' },
            { id: 'trade2', symbol: 'TSLA', pnl: -200, exitTimestamp: '2025-01-02T14:30:00Z' }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      })
    );
  }),

  rest.post('/api/v1/trades', (req, res, ctx) => {
    const trade = req.body;
    return res(
      ctx.json({
        success: true,
        data: {
          ...trade,
          id: 'new_trade',
          pnl: 447.50,
          pnlPercentage: 2.98,
          createdAt: new Date().toISOString()
        }
      })
    );
  })
);

describe('Trade Flow Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('should login, view trades, and create new trade', async () => {
    render(<App />);

    // Login
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Should redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // Should load trades
    await waitFor(() => {
      expect(screen.getByText(/AAPL/i)).toBeInTheDocument();
      expect(screen.getByText(/\$500.00/i)).toBeInTheDocument();
      expect(screen.getByText(/\$-200.00/i)).toBeInTheDocument();
    });

    // Navigate to create trade
    await userEvent.click(screen.getByRole('button', { name: /new trade/i }));

    // Fill trade form
    await userEvent.type(screen.getByLabelText(/symbol/i), 'GOOGL');
    await userEvent.selectOptions(screen.getByLabelText(/side/i), 'long');
    await userEvent.type(screen.getByLabelText(/entry price/i), '135');
    await userEvent.type(screen.getByLabelText(/exit price/i), '140');
    await userEvent.type(screen.getByLabelText(/quantity/i), '100');
    await userEvent.type(screen.getByLabelText(/fees/i), '2.5');
    
    await userEvent.click(screen.getByRole('button', { name: /save trade/i }));

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/trade created successfully/i)).toBeInTheDocument();
    });
  });

  test('should handle API errors gracefully', async () => {
    // Override default handler for this test
    server.use(
      rest.post('/api/v1/trades', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid trade data',
              details: [{ field: 'entryPrice', message: 'Must be positive' }]
            }
          })
        );
      })
    );

    render(<App />);
    
    // ... perform login and navigate to trade form
    
    await userEvent.type(screen.getByLabelText(/symbol/i), 'AAPL');
    await userEvent.type(screen.getByLabelText(/entry price/i), '-100'); // Invalid
    
    await userEvent.click(screen.getByRole('button', { name: /save trade/i }));

    await waitFor(() => {
      expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
    });
  });
});
```

---

## 7. Security Testing

### 7.1 Authentication Security Tests

```typescript
// tests/security/auth.security.test.ts
describe('Authentication Security', () => {
  test('should prevent SQL injection in login', async () => {
    const sqlInjectionAttempts = [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "admin' --",
      "' UNION SELECT * FROM users --"
    ];

    for (const attempt of sqlInjectionAttempts) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: attempt,
          password: attempt
        });

      // Should not crash or expose errors
      expect(response.status).not.toBe(500);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body.error?.message).not.toContain('SQL');
    }
  });

  test('should rate limit brute force attacks', async () => {
    const attempts = 15; // More than the 10/hour limit
    
    for (let i = 0; i < attempts; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      if (i >= 10) {
        expect(response.status).toBe(429);
        expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      }
    }
  });

  test('should validate JWT token integrity', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    // Tampered token
    const tamperedToken = validToken.replace('J9', 'J8');
    
    const response = await request(app)
      .get('/api/v1/trades')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  test('should prevent JWT token replay', async () => {
    // Get a valid token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@test.com',
        password: 'TestPass123!'
      });

    const token = loginRes.body.data.accessToken;

    // Logout to revoke token
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    // Try to use revoked token
    const response = await request(app)
      .get('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(response.body.error.code).toBe('TOKEN_REVOKED');
  });
});
```

### 7.2 Authorization Security Tests

```typescript
// tests/security/authorization.security.test.ts
describe('Authorization Security', () => {
  let ownerToken: string;
  let memberToken: string;
  let otherTenantToken: string;

  beforeAll(async () => {
    // Get tokens for different users
    ownerToken = await loginAs('owner@test.com', 'TestPass123!');
    memberToken = await loginAs('member@test.com', 'TestPass123!');
    otherTenantToken = await createAndLoginOtherTenant();
  });

  test('should enforce tenant isolation', async () => {
    // Owner from tenant A tries to access tenant B's trade
    const response = await request(app)
      .get('/api/v1/trades/test_trade_001') // Belongs to test_tenant_001
      .set('Authorization', `Bearer ${otherTenantToken}`) // From different tenant
      .expect(404); // Should return 404, not 403 or 200

    expect(response.body.error?.code).toBe('TRADE_NOT_FOUND');
  });

  test('should prevent privilege escalation', async () => {
    // Member tries to update another user's trade
    const response = await request(app)
      .put('/api/v1/trades/test_trade_001') // Created by owner
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ notes: 'Hacked!' })
      .expect(404); // Should not be able to find/access

    // Member tries to access admin endpoints
    await request(app)
      .get('/api/v1/admin/users') // Admin only endpoint
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  test('should validate resource ownership', async () => {
    // Create trade as member
    const createRes = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${memberToken}`)
      .send(validTradeData);

    const memberTradeId = createRes.body.data.id;

    // Owner should be able to access (as admin/owner)
    await request(app)
      .get(`/api/v1/trades/${memberTradeId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    // Other member from same tenant should NOT be able to access
    const otherMemberToken = await createTestUser('othermember@test.com', 'member');
    await request(app)
      .get(`/api/v1/trades/${memberTradeId}`)
      .set('Authorization', `Bearer ${otherMemberToken}`)
      .expect(404);
  });

  test('should protect against IDOR attacks', async () => {
    // Try to access resources by incrementing IDs
    const attempts = ['trade_001', 'trade_002', 'trade_003', 'user_001', 'user_002'];
    
    for (const id of attempts) {
      const response = await request(app)
        .get(`/api/v1/trades/${id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      // Should either return the resource (if owned) or 404
      // Should NEVER return someone else's resource
      if (response.status === 200) {
        // Verify the trade belongs to the user's tenant
        expect(response.body.data.tenantId).toBe('test_tenant_001');
      } else {
        expect(response.status).toBe(404);
      }
    }
  });
});
```

### 7.3 Input Validation Security Tests

```typescript
// tests/security/validation.security.test.ts
describe('Input Validation Security', () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await loginAs('owner@test.com', 'TestPass123!');
  });

  test('should prevent XSS attacks in trade notes', async () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>'
    ];

    for (const payload of xssPayloads) {
      const response = await request(app)
        .post('/api/v1/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validTradeData,
          notes: payload
        })
        .expect(201); // Should be sanitized, not rejected

      // Check that response is sanitized
      const savedTrade = response.body.data;
      expect(savedTrade.notes).not.toContain('<script>');
      expect(savedTrade.notes).not.toContain('javascript:');
      expect(savedTrade.notes).not.toContain('onerror');
      expect(savedTrade.notes).not.toContain('onload');
    }
  });

  test('should prevent path traversal in file uploads', async () => {
    const maliciousFilenames = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\cmd.exe',
      'file/../../../../etc/passwd',
      '%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];

    for (const filename of maliciousFilenames) {
      const response = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: filename,
          mimeType: 'image/png',
          sizeBytes: 1000
        })
        .expect(400); // Should be rejected

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('should prevent NoSQL injection in query parameters', async () => {
    const nosqlPayloads = [
      '{"$ne": null}',
      '{"$gt": ""}',
      '{"$where": "1==1"}',
      '[{"$ne": null}]'
    ];

    for (const payload of nosqlPayloads) {
      // Try in various query parameters
      await request(app)
        .get(`/api/v1/trades?symbol=${encodeURIComponent(payload)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Should be rejected by validation

      await request(app)
        .get(`/api/v1/trades?tags=${encodeURIComponent(payload)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    }
  });

  test('should validate file upload types and sizes', async () => {
    // Invalid file types
    const invalidFiles = [
      { filename: 'virus.exe', mimeType: 'application/x-msdownload', size: 1000 },
      { filename: 'script.php', mimeType: 'application/x-php', size: 1000 },
      { filename: 'shell.sh', mimeType: 'application/x-sh', size: 1000 },
      { filename: 'large.png', mimeType: 'image/png', size: 10 * 1024 * 1024 } // 10MB
    ];

    for (const file of invalidFiles) {
      const response = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filename: file.filename,
          mimeType: file.mimeType,
          sizeBytes: file.size
        });

      expect(response.status).toBe(400);
    }
  });
});
```

---

## 8. Performance Testing

### 8.1 API Performance Tests

```typescript
// tests/performance/api.performance.test.ts
import autocannon from 'autocannon';

describe('API Performance', () => {
  test('trade listing should handle concurrent requests', async () => {
    const instance = autocannon({
      url: 'http://localhost:3000/api/v1/trades',
      connections: 100, // Concurrent connections
      duration: 30, // Test duration in seconds
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      requests: [
        {
          method: 'GET',
          path: '/api/v1/trades?page=1&limit=50'
        }
      ]
    }, (err, result) => {
      if (err) throw err;
      
      // Performance assertions
      expect(result.latency.p99).toBeLessThan(500); // 99% under 500ms
      expect(result.requests.average).toBeGreaterThan(100); // > 100 req/sec
      expect(result.errors).toBe(0); // No errors
      expect(result['2xx']).toBe(result.requests.total); // All 200 responses
    });

    autocannon.track(instance);
  });

  test('trade creation should maintain performance under load', async () => {
    const tradeData = {
      symbol: 'TEST',
      side: 'long',
      entryPrice: 100,
      exitPrice: 105,
      quantity: 10,
      entryTimestamp: new Date().toISOString(),
      exitTimestamp: new Date(Date.now() + 3600000).toISOString()
    };

    const instance = autocannon({
      url: 'http://localhost:3000/api/v1/trades',
      connections: 50,
      duration: 60,
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tradeData),
      method: 'POST'
    }, (err, result) => {
      expect(result.latency.p95).toBeLessThan(1000); // 95% under 1 second
      expect(result.errors).toBeLessThan(1); // < 1% error rate
    });

    autocannon.track(instance);
  });
});
```

### 8.2 Database Performance Tests

```typescript
// tests/performance/database.performance.test.ts
describe('Database Performance', () => {
  test('analytics queries should perform within SLA', async () => {
    // Warm up cache
    await request(app)
      .get('/api/v1/analytics/summary?from=2025-01-01&to=2025-01-31')
      .set('Authorization', `Bearer ${authToken}`);

    // Measure performance
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/v1/analytics/summary?from=2025-01-01&to=2025-01-31')
      .set('Authorization', `Bearer ${authToken}`);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(500); // Should be under 500ms
    expect(response.body.meta.cached).toBe(true); // Should use cache
    expect(response.body.meta.cacheAge).toBeLessThan(300); // Cache age < 5 minutes
  });

  test('should handle large trade imports efficiently', async () => {
    // Create large CSV (10,000 trades)
    const largeCsv = generateLargeCsv(10000);
    
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/api/v1/trades/import')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from(largeCsv), 'large_import.csv')
      .expect(202); // Accepted for async processing

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(5000); // Initial processing < 5 seconds
    expect(response.body.data.jobId).toBeDefined();
    
    // Check job completes within reasonable time
    const jobId = response.body.data.jobId;
    await waitForJobCompletion(jobId, 300000); // 5 minutes max
  });
});
```

### 8.3 Memory and Resource Tests

```typescript
// tests/performance/memory.performance.test.ts
import { monitorMemoryUsage } from '../../src/utils/memoryMonitor';

describe('Memory Performance', () => {
  test('should not have memory leaks in trade processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Process many trades
    for (let i = 0; i < 1000; i++) {
      await processTrade(createRandomTrade());
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB
  });

  test('should handle concurrent file uploads without OOM', async () => {
    const concurrentUploads = 50;
    const fileSize = 1024 * 1024; // 1MB
    
    const uploadPromises = [];
    
    for (let i = 0; i < concurrentUploads; i++) {
      uploadPromises.push(
        request(app)
          .post('/api/v1/uploads/presign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            filename: `test${i}.png`,
            mimeType: 'image/png',
            sizeBytes: fileSize
          })
      );
    }
    
    // All should complete successfully
    const results = await Promise.all(uploadPromises);
    
    results.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // < 500MB
  });
});
```

---

## 9. Test Data Management

### 9.1 Test Data Factory

```typescript
// tests/factories/trade.factory.ts
export class TradeFactory {
  static create(overrides: Partial<Trade> = {}): Trade {
    const defaults: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: 'test_tenant_001',
      userId: 'test_user_001',
      symbol: 'AAPL',
      side: Math.random() > 0.5 ? 'long' : 'short',
      entryPrice: this.randomPrice(100, 200),
      exitPrice: this.randomPrice(100, 200),
      quantity: this.randomQuantity(10, 1000),
      fees: this.randomFees(),
      entryTimestamp: this.randomPastDate(),
      exitTimestamp: this.randomFutureDate(),
      notes: this.randomNotes(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return { ...defaults, ...overrides };
  }

  static createWinningTrade(): Trade {
    const entryPrice = this.randomPrice(100, 150);
    const exitPrice = entryPrice * (1 + (Math.random() * 0.1)); // 0-10% gain
    
    return this.create({
      side: 'long',
      entryPrice,
      exitPrice
    });
  }

  static createLosingTrade(): Trade {
    const entryPrice = this.randomPrice(100, 150);
    const exitPrice = entryPrice * (1 - (Math.random() * 0.05)); // 0-5% loss
    
    return this.create({
      side: 'long',
      entryPrice,
      exitPrice
    });
  }

  static createBatch(count: number): Trade[] {
    return Array.from({ length: count }, () => this.create());
  }

  private static randomPrice(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  private static randomQuantity(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  private static randomFees(): number {
    return parseFloat((Math.random() * 10).toFixed(2));
  }

  private static randomPastDate(): Date {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  private static randomFutureDate(): Date {
    const daysAhead = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date;
  }

  private static randomNotes(): string {
    const notes = [
      'Strong earnings momentum',
      'Technical breakout',
      'Support level hold',
      'Resistance break',
      'News catalyst',
      'Sector rotation',
      'Market sentiment'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }
}
```

### 9.2 Test Data Cleanup

```typescript
// tests/utils/testCleanup.ts
export class TestCleanup {
  private static cleanupCallbacks: (() => Promise<void>)[] = [];

  static registerCleanup(callback: () => Promise<void>) {
    this.cleanupCallbacks.push(callback);
  }

  static async cleanupAll() {
    for (const callback of this.cleanupCallbacks.reverse()) {
      try {
        await callback();
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }
    this.cleanupCallbacks = [];
  }

  static async cleanupTestData() {
    // Delete all test data (except seeded data)
    await db.query(`
      DELETE FROM trades 
      WHERE tenant_id LIKE 'test_%' 
        AND id NOT LIKE 'test_trade_%'
    `);
    
    await db.query(`
      DELETE FROM users 
      WHERE tenant_id LIKE 'test_%' 
        AND id NOT LIKE 'test_user_%'
    `);
    
    await db.query(`
      DELETE FROM tags 
      WHERE tenant_id LIKE 'test_%' 
        AND id NOT LIKE 'test_tag_%'
    `);
  }
}

// Usage in tests
afterEach(async () => {
  await TestCleanup.cleanupAll();
});

afterAll(async () => {
  await TestCleanup.cleanupTestData();
});
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_tradingjournal
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
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
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_tradingjournal
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run security tests
        run: npm run test:security
      
      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            test-results/
            coverage/
```

### 10.2 Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Run full test suite
        run: npm run test:all
      
      - name: Build Docker image
        run: |
          docker build -t tradingjournal/api:${{ github.sha }} .
          docker build -t tradingjournal/api:latest .
      
      - name: Run security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'tradingjournal/api:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload security results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/main'
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."
      
      - name: Deploy to production
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          # Deploy to production
          echo "Deploying to production..."
          # Include database migrations
          npm run db:migrate:production
```

---

## 11. Quality Metrics

### 11.1 Test Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| **API Controllers** | 90% | 95% |
| **Business Logic** | 85% | 90% |
| **Database Layer** | 80% | 85% |
| **Utility Functions** | 90% | 95% |
| **Security Middleware** | 95% | 100% |
| **Overall** | 85% | 90% |

### 11.2 Performance Benchmarks

| Endpoint | Maximum Response Time | Target Throughput |
|----------|----------------------|-------------------|
| `GET /trades` | 200ms | 1000 req/sec |
| `POST /trades` | 500ms | 500 req/sec |
| `GET /analytics/summary` | 500ms (first), 50ms (cached) | 200 req/sec |
| `POST /auth/login` | 300ms | 100 req/sec |
| `GET /users/me` | 100ms | 2000 req/sec |

### 11.3 Quality Gates

```yaml
# Quality gates for CI/CD pipeline
quality_gates:
  test_coverage:
    minimum: 85%
    critical: 80%
  
  test_passing:
    minimum: 95%
    critical: 90%
  
  security_issues:
    critical: 0
    high: 0
    medium: < 5
  
  performance_regression:
    threshold: 20%  # No more than 20% regression
  
  deployment_frequency:
    target: daily
    minimum: weekly
```

---

## 12. Testing Tools

### 12.1 Tool Stack

| Testing Type | Tools | Purpose |
|-------------|-------|---------|
| **Unit Testing** | Jest, ts-jest | JavaScript/TypeScript testing |
| **API Testing** | Supertest, nock | HTTP API testing |
| **Database Testing** | pg-mem, testcontainers | Database testing |
| **E2E Testing** | Playwright, Cypress | Browser automation |
| **Performance Testing** | k6, autocannon | Load and stress testing |
| **Security Testing** | OWASP ZAP, Snyk | Vulnerability scanning |
| **Mocking** | jest-mock-extended, msw | API mocking |
| **Code Coverage** | Istanbul, nyc | Coverage reporting |
| **Linting** | ESLint, Prettier | Code quality |
| **Type Checking** | TypeScript | Static type checking |

### 12.2 Test Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalTeardown: '<rootDir>/tests/teardown.ts',
  testTimeout: 30000,
  maxWorkers: '50%', // Use half of available cores
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]
  ]
};
```

### 12.3 Package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=\"(unit|spec)\"",
    "test:integration": "jest --testPathPattern=\"integration\"",
    "test:e2e": "playwright test",
    "test:security": "jest --testPathPattern=\"security\"",
    "test:performance": "k6 run tests/performance/*.js",
    "test:all": "npm run test && npm run test:e2e && npm run test:performance",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "npm run lint && npm run type-check && npm run test:all",
    "lint": "eslint src tests --ext .ts,.tsx",
    "lint:fix": "eslint src tests --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "db:test:setup": "docker-compose -f docker-compose.test.yml up -d",
    "db:test:teardown": "docker-compose -f docker-compose.test.yml down",
    "db:seed:test": "psql -f scripts/seed-test-data.sql"
  }
}
```

---

## Appendix A: Test Cases by Priority

### A.1 Critical Path Test Cases

```yaml
critical_path:
  authentication:
    - User registration with valid data
    - User login with correct credentials
    - JWT token generation and validation
    - Refresh token flow
    - Password reset functionality
  
  trade_management:
    - Create trade with all required fields
    - Calculate PnL correctly for long trades
    - Calculate PnL correctly for short trades
    - List trades with pagination
    - Filter trades by date range
    - Update trade information
    - Soft delete trade
    - Hard delete trade (admin only)
  
  analytics:
    - Summary statistics calculation
    - Equity curve generation
    - Performance breakdown by symbol
    - Win rate calculation accuracy
    - Profit factor calculation
    - Cache invalidation on data change
  
  security:
    - Tenant data isolation
    - Role-based access control
    - Input validation and sanitization
    - SQL injection prevention
    - XSS prevention
    - Rate limiting enforcement
```

### A.2 Edge Cases to Test

```yaml
edge_cases:
  trade_calculations:
    - Zero quantity trades
    - Zero fee trades
    - Negative PnL (losses)
    - Very large quantities
    - Very small prices
    - Identical entry and exit prices
  
  date_time:
    - Trades spanning midnight
    - Trades across DST changes
    - Trades in different timezones
    - Future-dated trades
    - Very old trades
    - Same timestamp for entry and exit
  
  file_uploads:
    - Empty files
    - Very large files (>5MB)
    - Files with special characters in names
    - Multiple files with same name
    - Upload cancellation
    - Network interruption during upload
  
  api_limits:
    - Exactly at rate limit threshold
    - Burst requests
    - Concurrent requests from same user
    - Long-running requests
    - Requests with large payloads
```

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Quality Assurance Lead:** Junaid Ali Khan  
**Review Cycle:** Monthly  
**Distribution:** Development Team, QA Team, DevOps Team