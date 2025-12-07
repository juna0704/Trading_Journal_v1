# Trading Journal - API Specification Document

**Project:** Trading Journal (Personal → SaaS)  
**Author:** Junaid Ali Khan  
**Version:** 1.0  
**Status:** Draft  
**API Version:** v1  
**Last Updated:** December 8, 2025

---

## Executive Summary

This document provides the complete API specification for the Trading Journal application. It serves as the contract between frontend and backend teams, defines all endpoints, request/response formats, authentication mechanisms, and error handling patterns.

**Base URL:** `https://api.tradingjournal.com/v1`  
**Protocol:** HTTPS only  
**Authentication:** JWT Bearer tokens  
**Content Type:** `application/json`  
**API Standard:** REST with OpenAPI 3.0 compliance

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [Common Patterns](#3-common-patterns)
4. [Authentication Endpoints](#4-authentication-endpoints)
5. [Trade Endpoints](#5-trade-endpoints)
6. [Tag Endpoints](#6-tag-endpoints)
7. [Analytics Endpoints](#7-analytics-endpoints)
8. [Upload Endpoints](#8-upload-endpoints)
9. [User Management Endpoints](#9-user-management-endpoints)
10. [Billing Endpoints (SaaS)](#10-billing-endpoints-saas)
11. [Webhook Endpoints](#11-webhook-endpoints)
12. [Error Handling](#12-error-handling)
13. [Rate Limiting](#13-rate-limiting)
14. [Versioning Strategy](#14-versioning-strategy)
15. [Security Considerations](#15-security-considerations)
16. [Testing & Validation](#16-testing--validation)

---

## 1. API Overview

### 1.1 Architecture

```
Client → HTTPS → API Gateway → Authentication Middleware → Route Handler → Service Layer → Database
                                      ↓
                                  Rate Limiter
                                      ↓
                                   Validator
```

### 1.2 Core Principles

| Principle | Implementation |
|-----------|----------------|
| **RESTful Design** | Resource-based URLs, HTTP verbs for actions |
| **Stateless** | No server-side session state, JWT for auth |
| **Versioned** | URL-based versioning (`/v1/`, `/v2/`) |
| **Consistent** | Uniform response formats and error codes |
| **Paginated** | All list endpoints support pagination |
| **Validated** | Zod schemas validate all inputs |
| **Documented** | OpenAPI 3.0 spec with examples |

### 1.3 Supported Operations

| Operation | HTTP Method | Idempotent | Safe |
|-----------|-------------|------------|------|
| **Create** | POST | ❌ | ❌ |
| **Read** | GET | ✅ | ✅ |
| **Update (full)** | PUT | ✅ | ❌ |
| **Update (partial)** | PATCH | ❌ | ❌ |
| **Delete** | DELETE | ❌ | ❌ |

### 1.4 Response Format Standards

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**List Response with Pagination:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 245,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid trade data provided",
    "details": [
      {
        "field": "entryPrice",
        "message": "Must be a positive number",
        "value": -100
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

---

## 2. Authentication

### 2.1 Authentication Flow

```
1. User submits credentials to /auth/login
2. Server validates credentials
3. Server generates:
   - Access Token (JWT, 15-minute expiry)
   - Refresh Token (30-day expiry)
4. Access token returned in response body
5. Refresh token set as HTTP-only cookie
6. Client includes access token in Authorization header for subsequent requests
7. On access token expiry, client uses /auth/refresh to get new access token
```

### 2.2 JWT Token Structure

**Access Token Payload:**
```json
{
  "sub": "user_abc123xyz",
  "email": "trader@example.com",
  "tenantId": "tenant_xyz789abc",
  "role": "owner",
  "iat": 1701950400,
  "exp": 1701951300,
  "type": "access"
}
```

**Refresh Token Payload:**
```json
{
  "sub": "user_abc123xyz",
  "tokenId": "rt_unique_identifier",
  "iat": 1701950400,
  "exp": 1704542400,
  "type": "refresh"
}
```

### 2.3 Authentication Headers

**Required for Protected Endpoints:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Optional Headers:**
```http
X-Request-ID: custom_request_id_123
X-Client-Version: 1.0.0
```

### 2.4 Token Refresh Strategy

```
Access Token Lifetime: 15 minutes
Client Behavior:
  - Use access token until expiry
  - On 401 Unauthorized response, attempt refresh
  - If refresh succeeds, retry original request
  - If refresh fails, redirect to login
```

---

## 3. Common Patterns

### 3.1 Request ID Tracking

All requests should include a unique request ID for tracing:

```http
X-Request-ID: req_20251208_abc123xyz
```

If not provided, server generates one automatically.

### 3.2 Pagination

**Query Parameters:**
```
page      - Page number (default: 1, min: 1)
limit     - Items per page (default: 50, min: 1, max: 100)
```

**Response Format:**
```json
{
  "items": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 245,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### 3.3 Filtering

**Common Filter Parameters:**
```
from      - Start date (ISO 8601: 2025-01-01)
to        - End date (ISO 8601: 2025-12-31)
symbol    - Trading symbol (e.g., AAPL, RELIANCE)
tag       - Tag ID (repeatable for multiple tags)
win       - Boolean (true=winners, false=losers)
strategy  - Strategy name
```

**Example:**
```http
GET /v1/trades?from=2025-01-01&to=2025-12-31&symbol=AAPL&tag=earnings&win=true&page=1&limit=50
```

### 3.4 Sorting

**Query Parameters:**
```
sort      - Field name (e.g., exitTimestamp, pnl, symbol)
order     - Sort order (asc, desc) (default: desc)
```

**Example:**
```http
GET /v1/trades?sort=exitTimestamp&order=desc
```

### 3.5 Field Selection (Sparse Fieldsets)

Reduce payload size by requesting specific fields:

```http
GET /v1/trades?fields=id,symbol,pnl,exitTimestamp
```

### 3.6 Date/Time Format

All dates and times must be in **ISO 8601 format** with timezone:

```
2025-12-08T10:30:00Z           (UTC)
2025-12-08T16:00:00+05:30      (IST)
```

### 3.7 Validation Rules

| Field Type | Validation |
|------------|------------|
| **Email** | RFC 5322 compliant, max 255 chars |
| **Password** | Min 8 chars, 1 uppercase, 1 number, 1 special char |
| **Symbol** | Alphanumeric, max 20 chars, uppercase |
| **Price** | Positive decimal, max 12 digits, 4 decimal places |
| **Quantity** | Positive decimal, max 12 digits, 4 decimal places |
| **Notes** | Max 5,000 characters |
| **Tag Name** | Max 50 characters, alphanumeric + spaces |

---

## 4. Authentication Endpoints

### 4.1 Register User

**Endpoint:** `POST /v1/auth/register`  
**Authentication:** None  
**Rate Limit:** 5 requests/hour per IP

**Request Body:**
```json
{
  "email": "trader@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

**Request Schema:**
```typescript
{
  email: string (required, email format, max 255 chars)
  name: string (required, min 2 chars, max 100 chars)
  password: string (required, min 8 chars, 1 uppercase, 1 number)
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123xyz",
      "email": "trader@example.com",
      "name": "John Doe",
      "createdAt": "2025-12-08T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tenant": {
      "id": "tenant_xyz789abc",
      "name": "John Doe's Workspace",
      "ownerId": "user_abc123xyz"
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 409 | `EMAIL_EXISTS` | Email already registered |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many registration attempts |
| 500 | `INTERNAL_ERROR` | Server error |

**Example Error:**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists",
    "details": {
      "email": "trader@example.com"
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

---

### 4.2 Login

**Endpoint:** `POST /v1/auth/login`  
**Authentication:** None  
**Rate Limit:** 10 requests/hour per IP

**Request Body:**
```json
{
  "email": "trader@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_abc123xyz",
      "email": "trader@example.com",
      "name": "John Doe",
      "tenantId": "tenant_xyz789abc",
      "role": "owner"
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Set-Cookie Header:**
```http
Set-Cookie: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/api/v1/auth
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Missing or invalid fields |
| 401 | `INVALID_CREDENTIALS` | Email or password incorrect |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many login attempts |
| 500 | `INTERNAL_ERROR` | Server error |

---

### 4.3 Refresh Token

**Endpoint:** `POST /v1/auth/refresh`  
**Authentication:** Refresh token (HTTP-only cookie)  
**Rate Limit:** 60 requests/hour per user

**Request:** No body required, refresh token sent via cookie

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `INVALID_TOKEN` | Refresh token invalid or expired |
| 401 | `TOKEN_REVOKED` | Token has been revoked |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many refresh attempts |

---

### 4.4 Logout

**Endpoint:** `POST /v1/auth/logout`  
**Authentication:** Required (Access token)  
**Rate Limit:** 60 requests/hour per user

**Request:** No body required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Side Effects:**
- Refresh token revoked from database/Redis
- Refresh token cookie cleared
- Access token remains valid until expiry (cannot be invalidated)

---

### 4.5 Forgot Password

**Endpoint:** `POST /v1/auth/forgot-password`  
**Authentication:** None  
**Rate Limit:** 3 requests/hour per IP

**Request Body:**
```json
{
  "email": "trader@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Notes:**
- Always returns success to prevent email enumeration
- Reset link expires in 1 hour
- Link format: `https://tradingjournal.com/reset-password?token={resetToken}`

---

### 4.6 Reset Password

**Endpoint:** `POST /v1/auth/reset-password`  
**Authentication:** None (uses reset token)  
**Rate Limit:** 5 requests/hour per IP

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password successfully reset"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_TOKEN` | Reset token invalid or expired |
| 400 | `TOKEN_USED` | Reset token already used |
| 400 | `WEAK_PASSWORD` | Password doesn't meet requirements |

**Side Effects:**
- All existing refresh tokens for user are revoked
- User must log in again with new password

---

## 5. Trade Endpoints

### 5.1 Create Trade

**Endpoint:** `POST /v1/trades`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user

**Request Body:**
```json
{
  "symbol": "AAPL",
  "side": "long",
  "entryPrice": 175.50,
  "exitPrice": 182.30,
  "quantity": 100,
  "fees": 2.50,
  "entryTimestamp": "2025-12-01T09:30:00Z",
  "exitTimestamp": "2025-12-01T15:45:00Z",
  "notes": "Strong earnings momentum, broke above resistance",
  "tags": ["earnings", "breakout"]
}
```

**Request Schema:**
```typescript
{
  symbol: string (required, max 20 chars, uppercase)
  side: enum (required, "long" | "short")
  entryPrice: number (required, positive, max 12.4 decimal)
  exitPrice: number (required, positive, max 12.4 decimal)
  quantity: number (required, positive, max 12.4 decimal)
  fees: number (optional, positive, max 10.2 decimal, default: 0)
  entryTimestamp: string (required, ISO 8601)
  exitTimestamp: string (required, ISO 8601, must be >= entryTimestamp)
  notes: string (optional, max 5000 chars)
  tags: array<string> (optional, tag names, max 20 items)
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "trade_abc123xyz",
    "tenantId": "tenant_xyz789abc",
    "userId": "user_abc123xyz",
    "symbol": "AAPL",
    "side": "long",
    "entryPrice": 175.50,
    "exitPrice": 182.30,
    "quantity": 100,
    "fees": 2.50,
    "pnl": 677.50,
    "pnlPercentage": 3.87,
    "entryTimestamp": "2025-12-01T09:30:00Z",
    "exitTimestamp": "2025-12-01T15:45:00Z",
    "notes": "Strong earnings momentum, broke above resistance",
    "tags": [
      {
        "id": "tag_xyz123",
        "name": "earnings",
        "color": "#3B82F6"
      },
      {
        "id": "tag_abc456",
        "name": "breakout",
        "color": "#10B981"
      }
    ],
    "createdAt": "2025-12-08T10:30:00Z",
    "updatedAt": "2025-12-08T10:30:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**PnL Calculation Logic:**
```
Long Trade:  PnL = (exitPrice - entryPrice) × quantity - fees
Short Trade: PnL = (entryPrice - exitPrice) × quantity - fees
PnL %:       PnL / (entryPrice × quantity) × 100
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid trade data |
| 400 | `INVALID_TIMESTAMP` | Exit timestamp before entry |
| 400 | `TAG_NOT_FOUND` | One or more tags don't exist |
| 403 | `PLAN_LIMIT_EXCEEDED` | Monthly trade limit reached |
| 500 | `INTERNAL_ERROR` | Server error |

**Example Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid trade data provided",
    "details": [
      {
        "field": "entryPrice",
        "message": "Must be a positive number",
        "value": -100
      },
      {
        "field": "exitTimestamp",
        "message": "Must be after entry timestamp",
        "value": "2025-11-30T15:45:00Z"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

---

### 5.2 List Trades

**Endpoint:** `GET /v1/trades`  
**Authentication:** Required  
**Rate Limit:** 1000 requests/hour per user

**Query Parameters:**
```
page         - Page number (default: 1)
limit        - Items per page (default: 50, max: 100)
from         - Start date filter (ISO 8601)
to           - End date filter (ISO 8601)
symbol       - Symbol filter (partial match)
tag          - Tag ID filter (repeatable for multiple)
win          - Boolean (true=winners, false=losers, omit=all)
strategy     - Strategy name filter
sort         - Sort field (exitTimestamp, pnl, symbol)
order        - Sort order (asc, desc) (default: desc)
fields       - Comma-separated field list for sparse response
```

**Example Request:**
```http
GET /v1/trades?from=2025-01-01&to=2025-12-31&symbol=AAPL&win=true&page=1&limit=50&sort=pnl&order=desc
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "trade_abc123xyz",
        "symbol": "AAPL",
        "side": "long",
        "entryPrice": 175.50,
        "exitPrice": 182.30,
        "quantity": 100,
        "pnl": 677.50,
        "pnlPercentage": 3.87,
        "exitTimestamp": "2025-12-01T15:45:00Z",
        "tags": [
          { "id": "tag_xyz123", "name": "earnings", "color": "#3B82F6" }
        ]
      },
      // ... more trades
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 147,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "summary": {
      "totalPnl": 12450.50,
      "winningTrades": 147,
      "losingTrades": 0,
      "winRate": 100.0
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

---

### 5.3 Get Trade by ID

**Endpoint:** `GET /v1/trades/:id`  
**Authentication:** Required  
**Rate Limit:** 1000 requests/hour per user

**URL Parameters:**
```
id - Trade ID (required)
```

**Example Request:**
```http
GET /v1/trades/trade_abc123xyz
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trade_abc123xyz",
    "tenantId": "tenant_xyz789abc",
    "userId": "user_abc123xyz",
    "symbol": "AAPL",
    "side": "long",
    "entryPrice": 175.50,
    "exitPrice": 182.30,
    "quantity": 100,
    "fees": 2.50,
    "pnl": 677.50,
    "pnlPercentage": 3.87,
    "rMultiple": 2.5,
    "entryTimestamp": "2025-12-01T09:30:00Z",
    "exitTimestamp": "2025-12-01T15:45:00Z",
    "holdingPeriod": "6h 15m",
    "notes": "Strong earnings momentum, broke above resistance",
    "tags": [
      { "id": "tag_xyz123", "name": "earnings", "color": "#3B82F6" },
      { "id": "tag_abc456", "name": "breakout", "color": "#10B981" }
    ],
    "uploads": [
      {
        "id": "upload_123abc",
        "url": "https://cdn.tradingjournal.com/uploads/tenant_xyz/trade_abc/chart.png",
        "mimeType": "image/png",
        "sizeBytes": 245678,
        "createdAt": "2025-12-01T15:50:00Z"
      }
    ],
    "createdAt": "2025-12-01T16:00:00Z",
    "updatedAt": "2025-12-08T10:30:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | `TRADE_NOT_FOUND` | Trade doesn't exist or access denied |
| 500 | `INTERNAL_ERROR` | Server error |

---

### 5.4 Update Trade

**Endpoint:** `PUT /v1/trades/:id`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user

**URL Parameters:**
```
id - Trade ID (required)
```

**Request Body:** (Same schema as Create Trade, all fields optional except required ones)

**Example Request:**
```http
PUT /v1/trades/trade_abc123xyz
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "exitPrice": 185.00,
  "notes": "Updated exit price after review",
  "tags": ["earnings", "breakout", "momentum"]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trade_abc123xyz",
    "symbol": "AAPL",
    "side": "long",
    "entryPrice": 175.50,
    "exitPrice": 185.00,
    "quantity": 100,
    "fees": 2.50,
    "pnl": 947.50,
    "pnlPercentage": 5.40,
    "exitTimestamp": "2025-12-01T15:45:00Z",
    "notes": "Updated exit price after review",
    "tags": [
      { "id": "tag_xyz123", "name": "earnings", "color": "#3B82F6" },
      { "id": "tag_abc456", "name": "breakout", "color": "#10B981" },
      { "id": "tag_def789", "name": "momentum", "color": "#F59E0B" }
    ],
    "updatedAt": "2025-12-08T10:35:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:35:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid update data |
| 404 | `TRADE_NOT_FOUND` | Trade doesn't exist or access denied |
| 409 | `EDIT_LOCKED` | Trade older than 90 days (SaaS only) |

---

### 5.5 Delete Trade

**Endpoint:** `DELETE /v1/trades/:id`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user

**URL Parameters:**
```
id - Trade ID (required)
```

**Query Parameters:**
```
permanent - Boolean (default: false) - Hard delete vs soft delete
```

**Example Request:**
```http
DELETE /v1/trades/trade_abc123xyz
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trade_abc123xyz",
    "deleted": true,
    "deletedAt": "2025-12-08T10:40:00Z",
    "recoverable": true,
    "recoverableUntil": "2026-01-07T10:40:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:40:00Z"
  }
}
```

**Notes:**
- Soft delete by default (30-day recovery window)
- Hard delete permanently removes trade and associated uploads
- Recalculates analytics cache after deletion

---

### 5.6 Bulk Import Trades

**Endpoint:** `POST /v1/trades/import`  
**Authentication:** Required  
**Rate Limit:** 5 requests/hour per user  
**Content-Type:** `multipart/form-data`

**Request Body:**
```
file - CSV file (required, max 20 MB)
```

**CSV Format Requirements:**
```csv
symbol,side,entryPrice,exitPrice,quantity,fees,entryTimestamp,exitTimestamp,notes,tags
AAPL,long,175.50,182.30,100,2.50,2025-12-01T09:30:00Z,2025-12-01T15:45:00Z,"Strong momentum","earnings,breakout"
TSLA,short,350.00,342.50,50,1.25,2025-12-02T10:00:00Z,2025-12-02T14:30:00Z,"Overbought","momentum"
```

**Column Mapping:**
- `symbol` → Symbol (required)
- `side` → long or short (required)
- `entryPrice` → Entry price (required)
- `exitPrice` → Exit price (required)
- `quantity` → Quantity (required)
- `fees` → Fees (optional, default: 0)
- `entryTimestamp` → ISO 8601 timestamp (required)
- `exitTimestamp` → ISO 8601 timestamp (required)
- `notes` → Trade notes (optional)
- `tags` → Comma-separated tag names (optional)

**Success Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "import_job_abc123xyz",
    "status": "processing",
    "fileName": "trades_2025_q4.csv",
    "estimatedCompletion": "2025-12-08T10:50:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:45:00Z"
  }
}
```

**Background Processing:**
- Job queued using BullMQ
- Email notification sent on completion
- Check status via `/v1/jobs/:jobId` endpoint

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_FILE` | Not a valid CSV file |
| 400 | `FILE_TOO_LARGE` | File exceeds 20 MB limit |
| 400 | `INVALID_FORMAT` | Missing required columns |
| 403 | `PLAN_LIMIT_EXCEEDED` | Import would exceed monthly limit |

---

### 5.7 Export Trades

**Endpoint:** `GET /v1/trades/export`  
**Authentication:** Required  
**Rate Limit:** 10 requests/hour per user

**Query Parameters:**
```
format       - Export format (csv, json, xlsx) (default: csv)
from         - Start date filter
to           - End date filter
symbol       - Symbol filter
tag          - Tag ID filter (repeatable)
win          - Boolean filter
```

**Example Request:**
```http
GET /v1/trades/export?format=csv&from=2025-01-01&to=2025-12-31&win=true
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**

**For Small Exports (<1000 trades):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.tradingjournal.com/exports/trades_20251208_abc123.csv",
    "expiresAt": "2025-12-08T11:45:00Z",
    "format": "csv",
    "tradeCount": 245,
    "fileSize": 125678
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:45:00Z"
  }
}
```

**For Large Exports (>1000 trades):**
```json
{
  "success": true,
  "data": {
    "jobId": "export_job_xyz789abc",
    "status": "processing",
    "estimatedCompletion": "2025-12-08T11:00:00Z",
    "notificationMethod": "email"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:45:00Z"
  }
}
```

---

## 6. Tag Endpoints

### 6.1 List Tags

**Endpoint:** `GET /v1/tags`  
**Authentication:** Required  
**Rate Limit:** 1000 requests/hour per user

**Query Parameters:**
```
sort  - Sort field (name, tradeCount, createdAt) (default: name)
order - Sort order (asc, desc) (default: asc)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tag_xyz123",
        "tenantId": "tenant_xyz789abc",
        "name": "earnings",
        "color": "#3B82F6",
        "tradeCount": 47,
        "createdAt": "2025-11-15T10:00:00Z"
      },
      {
        "id": "tag_abc456",
        "name": "breakout",
        "color": "#10B981",
        "tradeCount": 32,
        "createdAt": "2025-11-20T14:30:00Z"
      }
    ],
    "total": 12
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:45:00Z"
  }
}
```

---

### 6.2 Create Tag

**Endpoint:** `POST /v1/tags`  
**Authentication:** Required  
**Rate Limit:** 50 requests/hour per user

**Request Body:**
```json
{
  "name": "momentum",
  "color": "#F59E0B"
}
```

**Request Schema:**
```typescript
{
  name: string (required, max 50 chars, unique per tenant)
  color: string (required, hex color code, e.g., #3B82F6)
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "tag_def789",
    "tenantId": "tenant_xyz789abc",
    "name": "momentum",
    "color": "#F59E0B",
    "tradeCount": 0,
    "createdAt": "2025-12-08T10:50:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:50:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid tag data |
| 409 | `TAG_EXISTS` | Tag name already exists for tenant |
| 403 | `TAG_LIMIT_EXCEEDED` | Maximum tags reached (100 per tenant) |

---

### 6.3 Update Tag

**Endpoint:** `PUT /v1/tags/:id`  
**Authentication:** Required  
**Rate Limit:** 50 requests/hour per user

**Request Body:**
```json
{
  "name": "strong-momentum",
  "color": "#F97316"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tag_def789",
    "name": "strong-momentum",
    "color": "#F97316",
    "tradeCount": 15,
    "updatedAt": "2025-12-08T10:55:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T10:55:00Z"
  }
}
```

---

### 6.4 Delete Tag

**Endpoint:** `DELETE /v1/tags/:id`  
**Authentication:** Required  
**Rate Limit:** 50 requests/hour per user

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tag_def789",
    "deleted": true,
    "tradesAffected": 15
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:00:00Z"
  }
}
```

**Notes:**
- Deleting a tag removes it from all associated trades
- Trade records remain intact

---

## 7. Analytics Endpoints

### 7.1 Get Summary Statistics

**Endpoint:** `GET /v1/analytics/summary`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user  
**Cache TTL:** 5 minutes

**Query Parameters:**
```
from     - Start date (ISO 8601)
to       - End date (ISO 8601)
symbol   - Filter by symbol (optional)
tag      - Filter by tag ID (optional, repeatable)
```

**Example Request:**
```http
GET /v1/analytics/summary?from=2025-01-01&to=2025-12-31
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z",
      "days": 365
    },
    "trades": {
      "total": 245,
      "winning": 147,
      "losing": 98,
      "winRate": 60.0,
      "averagePerDay": 0.67
    },
    "pnl": {
      "total": 12450.50,
      "totalPercentage": 24.9,
      "average": 50.82,
      "median": 35.00,
      "largest": 2450.00,
      "smallest": -850.00,
      "winningAverage": 125.50,
      "losingAverage": -95.30
    },
    "performance": {
      "profitFactor": 2.15,
      "expectancy": 50.82,
      "sharpeRatio": 1.85,
      "maxDrawdown": -8.5,
      "maxDrawdownPeriod": {
        "start": "2025-08-15T00:00:00Z",
        "end": "2025-09-22T00:00:00Z",
        "duration": "38 days"
      },
      "recoveryFactor": 2.93
    },
    "streaks": {
      "currentStreak": {
        "type": "win",
        "count": 5
      },
      "longestWinStreak": 12,
      "longestLossStreak": 7
    },
    "riskMetrics": {
      "averageRMultiple": 1.85,
      "winningRMultiple": 3.20,
      "losingRMultiple": -0.95,
      "riskRewardRatio": 3.37
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:00:00Z",
    "cached": true,
    "cacheAge": 180
  }
}
```

---

### 7.2 Get Equity Curve

**Endpoint:** `GET /v1/analytics/equity`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user  
**Cache TTL:** 1 hour

**Query Parameters:**
```
from         - Start date (required)
to           - End date (required)
granularity  - Data point frequency (daily, weekly, monthly) (default: daily)
symbol       - Filter by symbol (optional)
tag          - Filter by tag ID (optional, repeatable)
```

**Example Request:**
```http
GET /v1/analytics/equity?from=2025-01-01&to=2025-12-31&granularity=daily
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z",
      "granularity": "daily"
    },
    "startingEquity": 50000.00,
    "endingEquity": 62450.50,
    "totalReturn": 12450.50,
    "totalReturnPercentage": 24.9,
    "points": [
      {
        "date": "2025-01-01",
        "equity": 50000.00,
        "pnl": 0,
        "trades": 0
      },
      {
        "date": "2025-01-02",
        "equity": 50150.25,
        "pnl": 150.25,
        "trades": 2
      },
      {
        "date": "2025-01-03",
        "equity": 49980.50,
        "pnl": -169.75,
        "trades": 1
      },
      // ... more data points
      {
        "date": "2025-12-31",
        "equity": 62450.50,
        "pnl": 12450.50,
        "trades": 245
      }
    ],
    "drawdowns": [
      {
        "startDate": "2025-08-15",
        "endDate": "2025-09-22",
        "peakEquity": 58750.00,
        "troughEquity": 53750.00,
        "drawdownAmount": -5000.00,
        "drawdownPercentage": -8.5,
        "duration": "38 days",
        "recovered": true,
        "recoveryDate": "2025-10-10"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:05:00Z",
    "cached": true,
    "cacheAge": 1200
  }
}
```

---

### 7.3 Get Performance Breakdown

**Endpoint:** `GET /v1/analytics/breakdown`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user  
**Cache TTL:** 5 minutes

**Query Parameters:**
```
dimension    - Breakdown dimension (symbol, tag, dayOfWeek, month, strategy) (required)
from         - Start date (required)
to           - End date (required)
limit        - Number of results (default: 20, max: 100)
sort         - Sort field (pnl, winRate, trades) (default: pnl)
order        - Sort order (asc, desc) (default: desc)
```

**Example Request:**
```http
GET /v1/analytics/breakdown?dimension=symbol&from=2025-01-01&to=2025-12-31&limit=10
Authorization: Bearer eyJhbGc...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dimension": "symbol",
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "items": [
      {
        "value": "AAPL",
        "trades": 28,
        "winningTrades": 19,
        "losingTrades": 9,
        "winRate": 67.86,
        "totalPnl": 3245.50,
        "averagePnl": 115.91,
        "largestWin": 850.00,
        "largestLoss": -320.00,
        "profitFactor": 2.85,
        "expectancy": 115.91
      },
      {
        "value": "TSLA",
        "trades": 22,
        "winningTrades": 14,
        "losingTrades": 8,
        "winRate": 63.64,
        "totalPnl": 2150.75,
        "averagePnl": 97.76,
        "largestWin": 650.00,
        "largestLoss": -450.00,
        "profitFactor": 2.12,
        "expectancy": 97.76
      }
      // ... more symbols
    ],
    "summary": {
      "totalItems": 42,
      "totalTrades": 245,
      "totalPnl": 12450.50
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:10:00Z"
  }
}
```

---

### 7.4 Get Detailed Statistics

**Endpoint:** `GET /v1/analytics/statistics`  
**Authentication:** Required  
**Rate Limit:** 100 requests/hour per user  
**Cache TTL:** 5 minutes

**Query Parameters:**
```
from     - Start date (required)
to       - End date (required)
symbol   - Filter by symbol (optional)
tag      - Filter by tag ID (optional, repeatable)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-12-31T23:59:59Z"
    },
    "basic": {
      "totalTrades": 245,
      "winningTrades": 147,
      "losingTrades": 98,
      "winRate": 60.0,
      "lossRate": 40.0
    },
    "pnl": {
      "total": 12450.50,
      "average": 50.82,
      "median": 35.00,
      "standardDeviation": 125.45,
      "winningTotal": 24500.00,
      "losingTotal": -12049.50,
      "winningAverage": 125.50,
      "losingAverage": -95.30
    },
    "risk": {
      "profitFactor": 2.15,
      "expectancy": 50.82,
      "sharpeRatio": 1.85,
      "sortinoRatio": 2.45,
      "calmarRatio": 2.93,
      "maxDrawdown": -8.5,
      "maxDrawdownDuration": "38 days",
      "averageRMultiple": 1.85,
      "medianRMultiple": 1.50,
      "riskRewardRatio": 3.37
    },
    "timing": {
      "averageHoldingTime": "6h 25m",
      "medianHoldingTime": "4h 30m",
      "shortestTrade": "15m",
      "longestTrade": "3d 8h",
      "averageWinningHoldTime": "8h 15m",
      "averageLosingHoldTime": "4h 10m"
    },
    "streaks": {
      "currentStreak": {
        "type": "win",
        "count": 5,
        "startDate": "2025-12-03"
      },
      "longestWinStreak": 12,
      "longestLossStreak": 7,
      "averageWinStreak": 3.5,
      "averageLossStreak": 2.8
    },
    "distribution": {
      "winDistribution": {
        "0-50": 45,
        "50-100": 38,
        "100-250": 42,
        "250-500": 15,
        "500+": 7
      },
      "lossDistribution": {
        "0--50": 52,
        "-50--100": 28,
        "-100--250": 12,
        "-250--500": 5,
        "-500+": 1
      }
    }
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:15:00Z"
  }
}
```

---

## 8. Upload Endpoints

### 8.1 Request Presigned Upload URL

**Endpoint:** `POST /v1/uploads/presign`  
**Authentication:** Required  
**Rate Limit:** 50 requests/hour per user

**Request Body:**
```json
{
  "filename": "chart-screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 245678,
  "tradeId": "trade_abc123xyz"
}
```

**Request Schema:**
```typescript
{
  filename: string (required, max 255 chars)
  mimeType: string (required, must be image/jpeg, image/png, image/webp)
  sizeBytes: number (required, max 5242880 = 5 MB)
  tradeId: string (optional, must be valid trade ID)
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload_temp_xyz789",
    "presignedUrl": "https://s3.amazonaws.com/trading-journal-uploads/...",
    "method": "PUT",
    "expiresAt": "2025-12-08T11:35:00Z",
    "headers": {
      "Content-Type": "image/png"
    },
    "storageKey": "uploads/tenant_xyz789abc/trades/trade_abc123xyz/chart_xyz789.png"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:20:00Z"
  }
}
```

**Upload Process:**
1. Client requests presigned URL
2. Client uploads file directly to S3 using presigned URL
3. Client confirms completion via `/uploads/complete` endpoint

---

### 8.2 Confirm Upload Completion

**Endpoint:** `POST /v1/uploads/complete`  
**Authentication:** Required  
**Rate Limit:** 50 requests/hour per user

**Request Body:**
```json
{
  "uploadId": "upload_temp_xyz789",
  "tradeId": "trade_abc123xyz"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "upload_123abc",
    "url": "https://cdn.tradingjournal.com/uploads/tenant_xyz/chart_xyz789.png",
    "storageKey": "uploads/tenant_xyz789abc/trades/trade_abc123xyz/chart_xyz789.png",
    "mimeType": "image/png",
    "sizeBytes": 245678,
    "tradeId": "trade_abc123xyz",
    "createdAt": "2025-12-08T11:25:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:25:00Z"
  }
}
```

---

### 8.3 Delete Upload

**Endpoint:** `DELETE /v1/uploads/:id`  
**Authentication:** Required  
**Rate Limit:** 50 requests/hour per user

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "upload_123abc",
    "deleted": true,
    "tradeId": "trade_abc123xyz"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:30:00Z"
  }
}
```

---

## 9. User Management Endpoints

### 9.1 Get Current User Profile

**Endpoint:** `GET /v1/users/me`  
**Authentication:** Required  
**Rate Limit:** 1000 requests/hour per user

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_abc123xyz",
    "email": "trader@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.tradingjournal.com/avatars/user_abc123.jpg",
    "tenantId": "tenant_xyz789abc",
    "role": "owner",
    "preferences": {
      "timezone": "Asia/Kolkata",
      "dateFormat": "DD/MM/YYYY",
      "currency": "INR",
      "theme": "dark"
    },
    "subscription": {
      "plan": "pro",
      "status": "active",
      "currentPeriodEnd": "2026-01-08T00:00:00Z"
    },
    "usage": {
      "tradesThisMonth": 47,
      "tradeLimit": 500,
      "storageUsed": 125678900,
      "storageLimit": 5368709120
    },
    "createdAt": "2025-10-15T10:00:00Z",
    "updatedAt": "2025-12-08T11:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:30:00Z"
  }
}
```

---

### 9.2 Update User Profile

**Endpoint:** `PUT /v1/users/me`  
**Authentication:** Required  
**Rate Limit:** 20 requests/hour per user

**Request Body:**
```json
{
  "name": "John Smith",
  "preferences": {
    "timezone": "Asia/Kolkata",
    "theme": "light"
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_abc123xyz",
    "email": "trader@example.com",
    "name": "John Smith",
    "preferences": {
      "timezone": "Asia/Kolkata",
      "dateFormat": "DD/MM/YYYY",
      "currency": "INR",
      "theme": "light"
    },
    "updatedAt": "2025-12-08T11:35:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:35:00Z"
  }
}
```

---

### 9.3 Change Password

**Endpoint:** `POST /v1/users/me/change-password`  
**Authentication:** Required  
**Rate Limit:** 10 requests/hour per user

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password successfully changed",
    "refreshTokensRevoked": true
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:40:00Z"
  }
}
```

**Side Effects:**
- All existing refresh tokens are revoked
- User must log in again on all devices

---

### 9.4 Delete Account (GDPR)

**Endpoint:** `DELETE /v1/users/me`  
**Authentication:** Required  
**Rate Limit:** 1 request/day per user

**Request Body:**
```json
{
  "password": "CurrentPassword123!",
  "confirmation": "DELETE"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Account deletion scheduled",
    "deletionDate": "2026-01-07T11:45:00Z",
    "dataRetentionPeriod": "30 days",
    "exportAvailable": true,
    "exportUrl": "https://cdn.tradingjournal.com/exports/user_abc123_final.zip"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:45:00Z"
  }
}
```

**Notes:**
- Soft delete with 30-day recovery window
- All data exported automatically before deletion
- User can cancel deletion within 30 days

---

### 9.5 Export User Data (GDPR)

**Endpoint:** `GET /v1/users/me/export`  
**Authentication:** Required  
**Rate Limit:** 3 requests/day per user

**Success Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "export_user_abc123_20251208",
    "status": "processing",
    "estimatedCompletion": "2025-12-08T12:00:00Z",
    "notificationMethod": "email"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T11:50:00Z"
  }
}
```

**Export Contents:**
- User profile data (JSON)
- All trades (CSV)
- All tags (CSV)
- All uploads (ZIP)
- Analytics summaries (PDF)

---

## 10. Billing Endpoints (SaaS)

### 10.1 Get Subscription Details

**Endpoint:** `GET /v1/billing/subscription`  
**Authentication:** Required (Owner role only)  
**Rate Limit:** 100 requests/hour per user

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sub_xyz789abc",
    "tenantId": "tenant_xyz789abc",
    "plan": "pro",
    "status": "active",
    "razorpayCustomerId": "cust_Jh6X2YjZmXpQZp",
    "razorpaySubscriptionId": "sub_Jh6XTGBm2XmqVG",
    "currentPeriodStart": "2025-12-08T00:00:00Z",
    "currentPeriodEnd": "2026-01-08T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": null,
    "pricing": {
      "amount": 499,
      "currency": "INR",
      "interval": "month"
    },
    "usage": {
      "tradesThisMonth": 47,
      "tradeLimit": 500,
      "usagePercentage": 9.4
    },
    "createdAt": "2025-10-15T10:00:00Z",
    "updatedAt": "2025-12-08T00:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:00:00Z"
  }
}
```

---

### 10.2 Create Checkout Session

**Endpoint:** `POST /v1/billing/checkout`  
**Authentication:** Required (Owner role only)  
**Rate Limit:** 10 requests/hour per user

**Request Body:**
```json
{
  "plan": "pro",
  "interval": "month"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://api.razorpay.com/v1/checkout/...",
    "sessionId": "checkout_session_xyz789",
    "expiresAt": "2025-12-08T13:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:00:00Z"
  }
}
```

---

### 10.3 Cancel Subscription

**Endpoint:** `POST /v1/billing/subscription/cancel`  
**Authentication:** Required (Owner role only)  
**Rate Limit:** 5 requests/day per user

**Request Body:**
```json
{
  "reason": "Switching to another platform",
  "immediate": false
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sub_xyz789abc",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "cancelationDate": "2026-01-08T00:00:00Z",
    "reason": "Switching to another platform",
    "message": "Subscription will be canceled at the end of the current billing period."
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:05:00Z"
  }
}
```

**Notes:**
- If `immediate` is true, downgrades to the free plan instantly.
- Access to paid features is revoked at the period's end (or immediately if `immediate` is true).

---

### 10.4 List Invoices

**Endpoint:** `GET /v1/billing/invoices`  
**Authentication:** Required (Owner role only)  
**Rate Limit:** 100 requests/hour per user

**Query Parameters:**
```
limit   - Items per page (default: 10, max: 50)
starting_after - Cursor for pagination (invoice ID)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "inv_Jh6X4KL2XmqYH",
        "razorpayInvoiceId": "inv_KM6XtLp2XmzqFG",
        "number": "INV-2025-12-001",
        "status": "paid",
        "periodStart": "2025-11-08T00:00:00Z",
        "periodEnd": "2025-12-08T00:00:00Z",
        "amount": 499,
        "currency": "INR",
        "pdfUrl": "https://api.razorpay.com/v1/invoices/inv_KM6XtLp2XmzqFG/pdf",
        "createdAt": "2025-11-08T10:00:00Z"
      },
      {
        "id": "inv_Jh6X5MN3XmqYI",
        "razorpayInvoiceId": "inv_KM7YuMq3XnzrGH",
        "number": "INV-2025-11-001",
        "status": "paid",
        "periodStart": "2025-10-08T00:00:00Z",
        "periodEnd": "2025-11-08T00:00:00Z",
        "amount": 499,
        "currency": "INR",
        "pdfUrl": "https://api.razorpay.com/v1/invoices/inv_KM7YuMq3XnzrGH/pdf",
        "createdAt": "2025-10-08T10:00:00Z"
      }
    ],
    "hasMore": false
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:10:00Z"
  }
}
```

---

### 10.5 Get Payment Methods

**Endpoint:** `GET /v1/billing/payment-methods`  
**Authentication:** Required (Owner role only)  
**Rate Limit:** 100 requests/hour per user

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pm_Jh6X6OP4XmqYJ",
        "type": "card",
        "card": {
          "last4": "4242",
          "network": "visa",
          "expiryMonth": 12,
          "expiryYear": 2026
        },
        "isDefault": true
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:15:00Z"
  }
}
```

---

### 10.6 Update Default Payment Method

**Endpoint:** `PUT /v1/billing/payment-methods/:id/default`  
**Authentication:** Required (Owner role only)  
**Rate Limit:** 10 requests/hour per user

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Default payment method updated",
    "paymentMethodId": "pm_Jh6X6OP4XmqYJ"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:20:00Z"
  }
}
```

---

## 11. Webhook Endpoints

### 11.1 Razorpay Webhook

**Endpoint:** `POST /v1/webhooks/razorpay`  
**Authentication:** Razorpay signature verification  
**Rate Limit:** None (external service)

**Verification:**
- Uses `X-Razorpay-Signature` header
- Verifies using Razorpay webhook secret

**Supported Events:**
```json
{
  "subscription.charged": "Subscription payment succeeded",
  "subscription.failed": "Subscription payment failed",
  "subscription.cancelled": "Subscription cancelled",
  "subscription.pending": "Subscription pending",
  "payment.captured": "One-time payment succeeded",
  "refund.processed": "Refund processed"
}
```

**Sample Event:**
```json
{
  "event": "subscription.charged",
  "payload": {
    "subscription": {
      "id": "sub_Jh6XTGBm2XmqVG",
      "entity": "subscription",
      "status": "active",
      "current_start": 1701950400,
      "current_end": 1704632400
    },
    "payment": {
      "id": "pay_Jh6X7PQ5XmqYK",
      "amount": 49900,
      "currency": "INR",
      "status": "captured"
    }
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "received": true,
    "event": "subscription.charged",
    "processed": true
  }
}
```

**Internal Actions:**
- Updates subscription status in database
- Sends email notifications
- Updates user plan limits
- Logs billing events

---

### 11.2 System Webhooks (Internal)

**Endpoint:** `POST /v1/webhooks/system`  
**Authentication:** Internal service token  
**Rate Limit:** None (internal use only)

**Supported Events:**
- `analytics.cache.invalidate` - Invalidates analytics cache
- `import.completed` - Trade import job completed
- `export.completed` - Data export job completed
- `cleanup.daily` - Daily cleanup tasks

---

## 12. Error Handling

### 12.1 Standard Error Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error",
        "value": "invalid_value"
      }
    ],
    "reference": "REF-12345"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:30:00Z"
  }
}
```

### 12.2 HTTP Status Code Mapping

| Status | Category | Description |
|--------|----------|-------------|
| 200 | Success | Request succeeded |
| 201 | Success | Resource created |
| 202 | Success | Request accepted for processing |
| 204 | Success | No content (successful delete) |
| 400 | Client Error | Bad request (validation, malformed) |
| 401 | Client Error | Unauthorized (invalid/missing auth) |
| 403 | Client Error | Forbidden (no permission) |
| 404 | Client Error | Resource not found |
| 409 | Client Error | Conflict (duplicate, edit locked) |
| 422 | Client Error | Unprocessable entity (business logic) |
| 429 | Client Error | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 502 | Server Error | Bad gateway (upstream service) |
| 503 | Server Error | Service unavailable (maintenance) |

### 12.3 Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_TOKEN` | 401 | Invalid or expired token |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Resource doesn't exist |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `TRADE_LIMIT_EXCEEDED` | 403 | Monthly trade limit reached |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service under maintenance |

### 12.4 Retry Logic

**Client Should Retry:**
- 429 (Rate limit exceeded) - After `Retry-After` header
- 500 (Internal error) - With exponential backoff (1s, 2s, 4s...)
- 502/503/504 - With exponential backoff

**Client Should Not Retry:**
- 400/401/403/404 - Fix request first
- 409 - Resolve conflict first

---

## 13. Rate Limiting

### 13.1 Rate Limit Tiers

| Tier | Requests/Hour | Burst | Reset Period |
|------|---------------|-------|--------------|
| **Unauthenticated** | 100 | 20 | Sliding window (1 hour) |
| **Authenticated (Free)** | 1,000 | 100 | Sliding window (1 hour) |
| **Authenticated (Pro)** | 10,000 | 1,000 | Sliding window (1 hour) |
| **Authenticated (Enterprise)** | 100,000 | 10,000 | Sliding window (1 hour) |

### 13.2 Special Endpoint Limits

| Endpoint | Limit | Notes |
|----------|-------|-------|
| `/auth/register` | 5/hour per IP | Prevent spam registrations |
| `/auth/login` | 10/hour per IP | Prevent brute force |
| `/auth/forgot-password` | 3/hour per IP | Prevent email bombing |
| `/trades/import` | 5/hour per user | Prevent abuse |
| `/users/me` (DELETE) | 1/day per user | GDPR compliance |

### 13.3 Rate Limit Headers

**Response Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1701954000
Retry-After: 60
```

**When Limit Exceeded (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retryAfter": 60,
    "limit": 1000,
    "resetAt": "2025-12-08T11:30:00Z"
  },
  "meta": {
    "requestId": "req_abc123xyz",
    "timestamp": "2025-12-08T12:30:00Z"
  }
}
```

### 13.4 Implementation Details

- **Storage:** Redis for distributed rate limiting
- **Algorithm:** Token bucket algorithm
- **Key Format:** `ratelimit:{userId/ip}:{endpoint}:{hour}`
- **Monitoring:** Grafana dashboard for rate limit analytics

---

## 14. Versioning Strategy

### 14.1 URL Versioning

```
/api/v1/trades     - Current stable version
/api/v2/trades     - Future version (development)
/api/beta/trades   - Beta features (unstable)
```

### 14.2 Breaking Changes Policy

**Major Version Changes:**
- Breaking API changes
- Database schema changes
- Authentication flow changes

**Minor Version Changes:**
- New endpoints (non-breaking)
- New optional fields
- Performance improvements

**Patch Version Changes:**
- Bug fixes
- Security patches
- Documentation updates

### 14.3 Deprecation Policy

1. **Announcement:** 6 months notice before deprecation
2. **Marking:** `Deprecation: true` header in responses
3. **Documentation:** Clear migration guides
4. **Sunset:** Old version remains available for 3 months after deprecation

**Deprecation Header:**
```http
Deprecation: true
Sunset: Sat, 08 Mar 2026 00:00:00 GMT
Link: </api/v2/trades>; rel="successor-version"
```

### 14.4 API Lifecycle

| Stage | Duration | Support |
|-------|----------|---------|
| **Beta** | 3 months | Best effort, breaking changes possible |
| **Stable** | 18 months | Full support, security fixes |
| **Deprecated** | 6 months | Security fixes only |
| **Sunset** | 3 months | No fixes, read-only access |

---

## 15. Security Considerations

### 15.1 Authentication & Authorization

**JWT Security:**
- Algorithm: HS256 (HMAC with SHA-256)
- Secret rotation: Every 90 days
- Token blacklist: For revoked refresh tokens
- Short expiry: 15 minutes for access tokens

**Password Security:**
- Argon2id for password hashing
- Work factor: Memory 64MB, Iterations 3, Parallelism 4
- Minimum length: 8 characters
- Common password rejection

### 15.2 Data Protection

**Encryption at Rest:**
- Database: AES-256 encryption for sensitive fields
- File storage: S3 server-side encryption (SSE-S3)
- Backups: Encrypted with AWS KMS

**Encryption in Transit:**
- TLS 1.3 for all API endpoints
- HSTS header enforced
- Certificate: Let's Encrypt (auto-renewal)

**Data Minimization:**
- Sparse fieldsets support
- Pagination for large datasets
- Field-level permissions

### 15.3 API Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 15.4 Input Validation

**Validation Layers:**
1. **Zod Schema Validation:** Request body/query validation
2. **Database Validation:** Type constraints, foreign keys
3. **Business Logic Validation:** Domain-specific rules

**SQL Injection Prevention:**
- Parameterized queries only
- ORM with built-in escaping
- No raw SQL queries

**XSS Prevention:**
- Input sanitization
- Output encoding
- Content Security Policy

### 15.5 Monitoring & Logging

**Security Logging:**
- All authentication attempts
- Rate limit violations
- Permission denied errors
- Data export/download events

**Audit Trail:**
- User actions (create, update, delete)
- Data access logs
- Admin actions

**Incident Response:**
- Real-time alerting for suspicious activities
- Automated threat detection
- 24/7 on-call rotation

---

## 16. Testing & Validation

### 16.1 Testing Strategy

**Unit Tests:**
- Test coverage: >90%
- Framework: Jest + Supertest
- Mock database: In-memory SQLite

**Integration Tests:**
- API endpoint testing
- Database interactions
- External service mocking

**E2E Tests:**
- Complete user flows
- Performance testing
- Load testing

**Security Tests:**
- OWASP Top 10 testing
- Penetration testing
- Dependency vulnerability scanning

### 16.2 API Validation

**OpenAPI Schema:**
- Complete OpenAPI 3.0 specification
- Request/response schema validation
- Automatic documentation generation

**Contract Testing:**
- Pact for consumer-driven contracts
- Frontend-backend compatibility
- Version compatibility checks

### 16.3 Performance Testing

**Benchmarks:**
- Response time: <200ms (p95)
- Throughput: 1000 req/sec (authenticated)
- Concurrent users: 10,000

**Load Testing:**
- Tool: k6
- Scenarios: Peak trading hours, bulk imports
- Monitoring: Grafana + Prometheus

### 16.4 Monitoring & Metrics

**Key Metrics:**
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- API availability (% uptime)

**Alerting:**
- Error rate > 1%
- Response time p95 > 500ms
- Availability < 99.9%
- Rate limit violations > 100/hour

**Dashboards:**
- Real-time API metrics
- User activity heatmap
- Performance trends
- Business metrics (trades/day, active users)

---

## Appendix A: Data Models

### Trade Model

```typescript
interface Trade {
  id: string; // trade_abc123xyz
  tenantId: string; // tenant_xyz789abc
  userId: string; // user_abc123xyz
  symbol: string; // AAPL
  side: 'long' | 'short';
  entryPrice: number; // 175.50
  exitPrice: number; // 182.30
  quantity: number; // 100
  fees: number; // 2.50
  pnl: number; // 677.50
  pnlPercentage: number; // 3.87
  rMultiple: number; // 2.5
  entryTimestamp: Date;
  exitTimestamp: Date;
  holdingPeriod: string; // "6h 15m"
  notes?: string;
  tags: Tag[];
  uploads: Upload[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### User Model

```typescript
interface User {
  id: string; // user_abc123xyz
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  tenantId: string; // tenant_xyz789abc
  role: 'owner' | 'member' | 'viewer';
  preferences: UserPreferences;
  emailVerified: boolean;
  lastLoginAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferences {
  timezone: string; // Asia/Kolkata
  dateFormat: string; // DD/MM/YYYY
  currency: string; // INR
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    tradeReminders: boolean;
    weeklyReports: boolean;
  };
}
```

---

## Appendix B: Deployment Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tradingjournal
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# External Services
S3_BUCKET_NAME=trading-journal-uploads
S3_REGION=ap-south-1
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://tradingjournal.com
LOG_LEVEL=info
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/tradingjournal
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tradingjournal
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Maintained By:** Junaid Ali Khan  
**Contact:** api-support@tradingjournal.com