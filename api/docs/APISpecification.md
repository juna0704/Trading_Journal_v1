# Trading Journal SaaS - API Specification Document

**Project:** Trading Journal SaaS  
**Author:** Junaid Ali Khan  
**Version:** 3.0  
**Status:** Final  
**API Version:** v1  
**Last Updated:** December 10, 2025  
**Based On:** Product Requirements v3.0, System Design v3.0

---

## Executive Summary

This API specification implements the requirements from the **Product Requirements Document (Section 4: User Stories, Section 5: Functional Requirements)** and follows the architecture defined in the **System Design Document (Sections 3, 7: API Layer Design)**.

**Base URL:** `https://api.tradingjournal.com/api/v1`  
**Protocol:** HTTPS only (TLS 1.3)  
**Authentication:** JWT Bearer tokens with refresh token rotation  
**Content Type:** `application/json`  
**API Standard:** REST with OpenAPI 3.1 compliance  
**Multi-tenancy:** Tenant isolation via PostgreSQL RLS (refer to System Design 4.2)  
**Rate Limiting:** Tier-based as per Product Requirements Appendix C

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Common Patterns](#3-common-patterns)
4. [Authentication Endpoints](#4-authentication-endpoints)
5. [Workspace & Team Management](#5-workspace--team-management)
6. [Trade Management Endpoints](#6-trade-management-endpoints)
7. [Analytics & Insights Endpoints](#7-analytics--insights-endpoints)
8. [Upload & Storage Endpoints](#8-upload--storage-endpoints)
9. [Tag & Strategy Endpoints](#9-tag--strategy-endpoints)
10. [Billing & Subscription Endpoints](#10-billing--subscription-endpoints)
11. [Webhook Endpoints](#11-webhook-endpoints)
12. [Background Jobs Endpoints](#12-background-jobs-endpoints)
13. [Error Handling](#13-error-handling)
14. [Rate Limiting](#14-rate-limiting)
15. [Security Considerations](#15-security-considerations)
16. [Data Models Reference](#16-data-models-reference)

---

## 1. API Overview

### 1.1 Architecture Implementation

This API implements the architecture described in **System Design Document Section 7.1**. The flow is:

```
Client → API Gateway → Auth Middleware → Tenant Context → RBAC → Route Handler → Service Layer → Database (with RLS)
```

### 1.2 Core Principles

| Principle          | Implementation                               | Reference                        |
| ------------------ | -------------------------------------------- | -------------------------------- |
| **RESTful Design** | Resource-based URLs, proper HTTP verbs       | System Design 7.2                |
| **Multi-tenancy**  | Tenant isolation via PostgreSQL RLS          | System Design 4.2                |
| **RBAC**           | Four roles: Owner, Admin, Member, Viewer     | Product Requirements FR-AUTH-004 |
| **Stateless**      | JWT tokens, no server sessions               | System Design 3.1                |
| **Versioned**      | URL versioning (`/api/v1/`)                  | System Design 7.2                |
| **Paginated**      | All list endpoints support cursor pagination | -                                |

### 1.3 Response Format Standards

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-10T10:30:00Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [ ... ]
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-10T10:30:00Z"
  }
}
```

**List Response:**

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "cursor": "next_cursor_token",
      "hasMore": true,
      "total": 245
    }
  },
  "meta": { ... }
}
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

Implements the authentication flow described in **System Design Document Section 3.1**:

```
1. User submits credentials → /api/v1/auth/login
2. Server validates → generates access token (15 min) + refresh token (30 days)
3. Access token in response body, refresh token as HTTP-only cookie
4. Client uses access token in Authorization header
5. On 401, client calls /api/v1/auth/refresh with refresh token cookie
6. New access token issued, refresh token rotated
```

### 2.2 JWT Token Structure

**Access Token Payload:** (refer to System Design 3.2)

```json
{
  "sub": "user_abc123xyz",
  "email": "trader@example.com",
  "tenantId": "tenant_xyz789abc",
  "role": "owner", // owner/admin/member/viewer
  "iat": 1701950400,
  "exp": 1701951300,
  "type": "access"
}
```

**Permissions:** Based on role as defined in **Product Requirements FR-AUTH-004**.

### 2.3 Authorization Headers

**Required:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Tenant-ID: tenant_xyz789abc  # Extracted from JWT, verified by middleware
```

---

## 3. Common Patterns

### 3.1 Tenant Context

All requests are scoped to a tenant. The tenant context is:

1. Extracted from JWT token
2. Set in request context
3. Used for PostgreSQL RLS policies (System Design 4.2)
4. Validated against user's tenant membership

### 3.2 Pagination

Uses cursor-based pagination for better performance with large datasets:

**Query Parameters:**

```
limit    - Items per page (default: 50, max: 100 per Product Requirements NFR)
cursor   - Opaque cursor token for next page
```

### 3.3 Filtering

Supports filtering as per **Product Requirements US-10**:

```
symbol      - Trading symbol
tags        - Comma-separated tag IDs
strategy    - Strategy name
from        - Start date (ISO 8601)
to          - End date (ISO 8601)
marketCap   - large/mid/small
sector      - Sector name
win         - true/false for winning/losing trades
```

### 3.4 Date/Time Format

All dates use ISO 8601 with timezone:

- UTC: `2025-12-10T10:30:00Z`
- IST: `2025-12-10T16:00:00+05:30`

---

## 4. Authentication Endpoints

### 4.1 Register User

**Endpoint:** `POST /api/v1/auth/register`  
**Implements:** Product Requirements US-01, FR-AUTH-001

**Request Body:**

```json
{
  "email": "trader@example.com",
  "name": "John Doe",
  "password": "SecurePass123!" // min 8 chars, 1 uppercase, 1 number, 1 special
}
```

**Response:** Creates user + personal workspace as per US-03.

### 4.2 Login

**Endpoint:** `POST /api/v1/auth/login`  
**Implements:** Product Requirements FR-AUTH-001

**Request Body:**

```json
{
  "email": "trader@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Returns access token and sets refresh token cookie.

### 4.3 Google OAuth Login

**Endpoint:** `POST /api/v1/auth/google/callback`  
**Implements:** Product Requirements US-02, FR-AUTH-002

**Request Body:**

```json
{
  "code": "google_authorization_code",
  "redirectUri": "https://app.tradingjournal.com/auth/callback"
}
```

### 4.4 Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`  
**Implements:** System Design 3.1 Token Refresh Flow

**Request:** No body, uses refresh token from HTTP-only cookie.

**Response:** New access token, refresh token rotated (security).

### 4.5 Logout

**Endpoint:** `POST /api/v1/auth/logout`  
**Implements:** Token blacklisting from System Design 13.2

**Effect:** Revokes refresh token, adds access token to short-term blacklist.

---

## 5. Workspace & Team Management

### 5.1 Get Workspace Details

**Endpoint:** `GET /api/v1/workspace`  
**Implements:** Multi-tenant workspace from Product Requirements US-03

**Response:**

```json
{
  "id": "tenant_xyz789abc",
  "name": "John's Trading Journal",
  "plan": "pro",
  "settings": {
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "dateFormat": "DD/MM/YYYY"
  },
  "createdAt": "2025-12-10T10:30:00Z"
}
```

### 5.2 List Workspace Members

**Endpoint:** `GET /api/v1/workspace/members`  
**Implements:** RBAC from Product Requirements US-04, FR-AUTH-004

**Permissions:** Owner, Admin can list all members.

**Response:**

```json
{
  "items": [
    {
      "userId": "user_abc123xyz",
      "email": "trader@example.com",
      "name": "John Doe",
      "role": "owner",
      "joinedAt": "2025-12-10T10:30:00Z",
      "lastActive": "2025-12-10T15:45:00Z"
    }
  ]
}
```

### 5.3 Invite Team Member

**Endpoint:** `POST /api/v1/workspace/members/invite`  
**Implements:** Team collaboration from Product Requirements FR-COLLAB-001

**Request Body:**

```json
{
  "email": "newmember@example.com",
  "role": "member", // member/viewer
  "message": "Join our trading workspace"
}
```

**Flow:** Sends invitation email, user accepts to join.

### 5.4 Update Member Role

**Endpoint:** `PUT /api/v1/workspace/members/:userId`  
**Implements:** RBAC management from Product Requirements US-04

**Request Body:**

```json
{
  "role": "admin" // Cannot change last owner's role
}
```

### 5.5 Remove Member

**Endpoint:** `DELETE /api/v1/workspace/members/:userId`  
**Restriction:** Cannot remove last owner (Product Requirements US-04 AC).

---

## 6. Trade Management Endpoints

### 6.1 Create Trade

**Endpoint:** `POST /api/v1/trades`  
**Implements:** Product Requirements US-05 (Quick Trade Entry), FR-TRADE-001

**Request Body:** (Implements trade schema from FR-TRADE-002)

```json
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "side": "BUY", // BUY/SELL/SHORT
  "entryPrice": 2750.5,
  "exitPrice": 2820.3,
  "quantity": 10,
  "fees": 25.5,
  "entryTimestamp": "2025-12-10T09:15:00+05:30",
  "exitTimestamp": "2025-12-10T15:30:00+05:30",
  "notes": "Breakout above resistance",
  "tags": ["breakout", "largecap"],
  "strategy": "Momentum Breakout",
  "riskAmount": 1000,
  "screenshots": ["upload_123abc"] // Upload IDs from Section 8
}
```

**Automated Calculations:** (FR-TRADE-003)

- PnL, PnL percentage
- Holding period
- R-multiple (if riskAmount provided)

### 6.2 List Trades with Filtering

**Endpoint:** `GET /api/v1/trades`  
**Implements:** Product Requirements US-10 (Performance Filtering)

**Query Parameters:**

```http
GET /api/v1/trades?from=2025-12-01&to=2025-12-10&symbol=RELIANCE&tags=breakout,momentum&strategy=Momentum&marketCap=large&win=true&limit=50&cursor=next_page_token
```

**Supports:** Saved views as per US-10 AC.

### 6.3 Get Trade Details

**Endpoint:** `GET /api/v1/trades/:tradeId`  
**Permissions:** Owner/Admin can view all, Members can view own, Viewers read-only.

**Response:** Includes attachments, comments, tags.

### 6.4 Update Trade

**Endpoint:** `PUT /api/v1/trades/:tradeId`  
**Restrictions:** Members can only edit own trades (RBAC).

### 6.5 Bulk Import Trades

**Endpoint:** `POST /api/v1/trades/import`  
**Implements:** Product Requirements US-06 (Bulk Import)

**Content-Type:** `multipart/form-data`

**Request:**

```
file: CSV file (max 20MB)
mapping: JSON string for column mapping
```

**Response:** Returns job ID for background processing (System Design 8.2).

### 6.6 Export Trades

**Endpoint:** `POST /api/v1/trades/export`  
**Formats:** CSV, JSON, Excel (PDF for Pro+)

**Request Body:**

```json
{
  "format": "csv",
  "filters": { ... },  // Same as list filters
  "columns": ["symbol", "entryPrice", "exitPrice", "pnl"]  // Optional field selection
}
```

**Response:** Returns job ID, download link sent via email.

### 6.7 Trade Comments (Review Workflow)

**Endpoint:** `POST /api/v1/trades/:tradeId/comments`  
**Implements:** Product Requirements US-12 (Trade Review Workflow)

**Request Body:**

```json
{
  "content": "Good entry timing. Consider tighter stop next time.",
  "mentions": ["user_mentioneed"], // @mentions for notifications
  "status": "reviewed" // reviewed/needs_work
}
```

---

## 7. Analytics & Insights Endpoints

### 7.1 Dashboard Summary

**Endpoint:** `GET /api/v1/analytics/dashboard`  
**Implements:** Product Requirements US-08 (Real-Time Dashboard)

**Response:**

```json
{
  "period": "month", // today/week/month/quarter/year/custom
  "summary": {
    "netPnl": 12450.5,
    "winRate": 60.5,
    "profitFactor": 2.15,
    "avgWinLossRatio": 1.85,
    "totalTrades": 245,
    "bestTrade": 2450.0,
    "worstTrade": -850.0
  },
  "comparison": {
    "previousPeriod": "last_month",
    "netPnlChange": "+15%",
    "winRateChange": "+2.5%"
  }
}
```

### 7.2 Equity Curve

**Endpoint:** `GET /api/v1/analytics/equity`  
**Implements:** Product Requirements US-09 (Equity Curve Analysis)

**Query Parameters:**

```http
GET /api/v1/analytics/equity?from=2025-01-01&to=2025-12-10&granularity=daily&benchmark=nifty50
```

**Response:** Includes drawdown periods, benchmark comparison.

### 7.3 Performance Breakdown

**Endpoint:** `GET /api/v1/analytics/breakdown`  
**Implements:** Advanced analytics from Product Requirements FR-ANALYTICS-001

**Dimensions:** symbol, tag, strategy, dayOfWeek, month, hourOfDay

**Response:**

```json
{
  "dimension": "symbol",
  "items": [
    {
      "value": "RELIANCE",
      "trades": 28,
      "winRate": 67.9,
      "totalPnl": 3245.5,
      "profitFactor": 2.85
    }
  ]
}
```

### 7.4 Team Performance Dashboard

**Endpoint:** `GET /api/v1/analytics/team`  
**Implements:** Product Requirements US-11 (Team Performance Dashboard)

**Permissions:** Owner/Admin only.

**Query Parameters:**

```http
GET /api/v1/analytics/team?period=month&anonymous=true
```

**Response:**

```json
{
  "leaderboard": [
    {
      "userId": "user_abc123",
      "name": "John Doe",
      "netPnl": 12450.5,
      "winRate": 60.5,
      "profitFactor": 2.15,
      "trades": 45
    }
  ],
  "teamSummary": {
    "totalPnl": 45600.75,
    "avgWinRate": 58.2,
    "totalTrades": 210
  }
}
```

### 7.5 Generate Report

**Endpoint:** `POST /api/v1/analytics/reports`  
**Implements:** Reporting from Product Requirements FR-ANALYTICS-003

**Request Body:**

```json
{
  "type": "weekly", // daily/weekly/monthly/custom
  "format": "pdf", // pdf/csv/html
  "recipients": ["user1@example.com", "user2@example.com"],
  "sections": ["summary", "equity", "breakdown", "topTrades"]
}
```

**Response:** Job ID for background report generation.

---

## 8. Upload & Storage Endpoints

### 8.1 Request Upload URL

**Endpoint:** `POST /api/v1/uploads/request`  
**Implements:** Product Requirements US-07 (Trade Attachments), System Design 9.1

**Request Body:**

```json
{
  "fileName": "chart-screenshot.png",
  "fileType": "image/png",
  "fileSize": 245678, // max 5MB per US-07 AC
  "tradeId": "trade_abc123" // Optional, can attach later
}
```

**Response:** Returns presigned S3 URL for direct upload (System Design 9.1).

### 8.2 Confirm Upload

**Endpoint:** `POST /api/v1/uploads/:uploadId/confirm`  
**Links upload to trade after S3 upload completes.**

### 8.3 List Trade Attachments

**Endpoint:** `GET /api/v1/trades/:tradeId/uploads`  
**Returns all screenshots/charts for a trade.**

---

## 9. Tag & Strategy Endpoints

### 9.1 Tag Management

**Endpoints:**

- `GET /api/v1/tags` - List all tags
- `POST /api/v1/tags` - Create tag
- `PUT /api/v1/tags/:tagId` - Update tag
- `DELETE /api/v1/tags/:tagId` - Delete tag (removes from trades)

### 9.2 Strategy Management

**Endpoints:** Similar to tags, for strategy categorization.

---

## 10. Billing & Subscription Endpoints

### 10.1 Get Subscription Details

**Endpoint:** `GET /api/v1/billing/subscription`  
**Implements:** SaaS billing from Product Requirements Appendix D

**Response:**

```json
{
  "plan": "pro",
  "status": "active",
  "currentPeriodEnd": "2026-01-10T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "limits": {
    "monthlyTrades": 2000,
    "teamMembers": 5,
    "storageGb": 1,
    "usedTrades": 245,
    "usedStorage": 0.25
  },
  "pricing": {
    "amount": 499,
    "currency": "INR",
    "interval": "monthly"
  }
}
```

### 10.2 Create Checkout Session

**Endpoint:** `POST /api/v1/billing/checkout`  
**Implements:** Razorpay integration from System Design 10.3

**Request Body:**

```json
{
  "plan": "pro",
  "interval": "monthly",
  "trialDays": 14 // For new subscriptions
}
```

### 10.3 Cancel Subscription

**Endpoint:** `POST /api/v1/billing/subscription/cancel`  
**Implements:** Cancellation flow with grace period.

### 10.4 Get Invoices

**Endpoint:** `GET /api/v1/billing/invoices`  
**Returns:** List of past invoices with download links.

---

## 11. Webhook Endpoints

### 11.1 Razorpay Webhook

**Endpoint:** `POST /api/v1/webhooks/razorpay`  
**Implements:** Payment processing from System Design 10.1

**Headers:**

```http
X-Razorpay-Signature: generated_signature
X-Razorpay-Event: subscription.charged
```

**Handles:** subscription events, payment success/failure.

### 11.2 Internal System Webhooks

For background job notifications, cache invalidation.

---

## 12. Background Jobs Endpoints

### 12.1 Get Job Status

**Endpoint:** `GET /api/v1/jobs/:jobId`  
**Implements:** Background processing from System Design 8.1

**Response:**

```json
{
  "jobId": "import_abc123",
  "type": "trade_import",
  "status": "processing",  // pending/processing/completed/failed
  "progress": 65,  // percentage
  "result": { ... },  // Only when completed
  "error": { ... },   // Only when failed
  "createdAt": "2025-12-10T10:30:00Z",
  "updatedAt": "2025-12-10T10:35:00Z"
}
```

### 12.2 List Jobs

**Endpoint:** `GET /api/v1/jobs`  
**Filter by:** type, status, date range.

---

## 13. Error Handling

### 13.1 Error Codes

Implements error handling from **System Design 7.2**:

| HTTP Status | Error Code            | Description                                      |
| ----------- | --------------------- | ------------------------------------------------ |
| 400         | `VALIDATION_ERROR`    | Request validation failed                        |
| 401         | `INVALID_TOKEN`       | Invalid/missing authentication                   |
| 403         | `ACCESS_DENIED`       | Insufficient permissions (RBAC)                  |
| 403         | `PLAN_LIMIT_EXCEEDED` | Monthly trade limit reached                      |
| 404         | `RESOURCE_NOT_FOUND`  | Resource doesn't exist                           |
| 409         | `CONFLICT`            | Resource conflict (duplicate, edit locked)       |
| 429         | `RATE_LIMIT_EXCEEDED` | Rate limit exceeded (Product Requirements App C) |
| 500         | `INTERNAL_ERROR`      | Server error                                     |

### 13.2 Validation Errors

Detailed field-level errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid trade data",
    "details": [
      {
        "field": "entryPrice",
        "message": "Must be positive number",
        "value": -100
      }
    ]
  }
}
```

---

## 14. Rate Limiting

### 14.1 Rate Limits by Plan

Implements limits from **Product Requirements Appendix C**:

| Tier       | API Calls/Hour | Trade Entries/Day | File Uploads/Month |
| ---------- | -------------- | ----------------- | ------------------ |
| Free       | 1,000          | 100               | 50MB               |
| Pro        | 10,000         | 1,000             | 1GB                |
| Enterprise | 100,000        | Unlimited         | 10GB               |

### 14.2 Rate Limit Headers

**Response Headers:**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 850
X-RateLimit-Reset: 1701954000
Retry-After: 60  # When exceeded
```

---

## 15. Security Considerations

### 15.1 Security Headers

All responses include security headers as per **System Design 13.2**:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy`
- `X-Frame-Options: DENY`

### 15.2 Input Validation

All endpoints validate input using Zod schemas (System Design 13.2).

### 15.3 SQL Injection Prevention

Uses parameterized queries via DrizzleORM (System Design 13.2).

---

## 16. Data Models Reference

### 16.1 Trade Model

Implements schema from **Product Requirements FR-TRADE-002**:

```typescript
interface Trade {
  id: string; // UUID
  tenantId: string; // RLS tenant isolation
  userId: string; // Trade owner
  symbol: string; // Trading symbol
  exchange: string; // NSE/BSE/etc
  side: 'BUY' | 'SELL' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number;
  pnl: number; // Calculated field
  pnlPercent: number; // Calculated field
  entryTimestamp: Date;
  exitTimestamp: Date;
  notes?: string;
  tags: string[]; // Tag IDs
  strategy?: string;
  attachments: string[]; // Upload IDs
  status: 'OPEN' | 'CLOSED' | 'PARTIAL';
  createdAt: Date;
  updatedAt: Date;
}
```

### 16.2 User Model

Implements RBAC from **Product Requirements FR-AUTH-004**:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  preferences: UserPreferences;
  emailVerified: boolean;
  lastLoginAt?: Date;
}
```

---

## Appendix A: OpenAPI Specification

The complete OpenAPI 3.1 specification is available at:

- `https://api.tradingjournal.com/api-docs` (Interactive Swagger UI)
- `https://api.tradingjournal.com/openapi.json` (JSON specification)

## Appendix B: SDKs & Client Libraries

Official SDKs available:

- JavaScript/TypeScript: `@tradingjournal/sdk`
- Python: `tradingjournal-python`
- Postman Collection: Available in documentation

## Appendix C: Migration Guides

API version migration guides available at:

- `https://docs.tradingjournal.com/api/migration`

---

**Document Version:** 3.0  
**Last Updated:** December 10, 2025  
**Maintained By:** API Team  
**Contact:** api-support@tradingjournal.com  
**Reference Documents:**

- Product Requirements Document v3.0 (Sections 4, 5, Appendix C, D)
- System Design Document v3.0 (Sections 3, 4, 7, 8, 9, 10, 13)
