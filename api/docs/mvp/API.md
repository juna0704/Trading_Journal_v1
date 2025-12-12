# MVP API Specification Document

**Project:** Trading Journal SaaS (MVP)
**Document:** MVP API Specification
**Version:** 1.0
**Status:** Final
**Author:** Junaid Ali Khan
**Last Updated:** December 2025

---

# 1. Overview

This MVP API implements the minimal backend functionality required to support the Trading Journal MVP. It includes **authentication**, **trade CRUD**, **basic analytics**, and **file uploads**.

**Base URL:** `/api/v1`
**Protocol:** HTTPS
**Auth:** JWT Access Token (15 min) + Refresh Token (HTTP-only cookie)
**Content-Type:** `application/json`

No multi-tenancy, no RBAC, no background workers, no billing in MVP.

---

# 2. Authentication Endpoints

## 2.1 Register User

**POST `/auth/register`**
Creates a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com"
  }
}
```

---

## 2.2 Login

**POST `/auth/login`**
Returns JWT access token + refresh token cookie.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token-here"
  }
}
```

---

## 2.3 Refresh Token

**POST `/auth/refresh`**
Uses HTTP-only refresh token to issue a new access token.

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

---

## 2.4 Logout

**POST `/auth/logout`**
Clears refresh token cookie.

**Response:** `204 No Content`

---

# 3. Trades Endpoints

## 3.1 Create Trade

**POST `/trades`**
Creates a new trade entry.

**Request:**

```json
{
  "symbol": "AAPL",
  "side": "BUY",
  "entryPrice": 175.50,
  "exitPrice": 182.30,
  "quantity": 10,
  "entryTimestamp": "2025-12-10T10:00:00Z",
  "exitTimestamp": "2025-12-10T15:30:00Z",
  "notes": "Breakout trend",
  "attachments": []
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "trade_123",
    "pnl": 68.0
  }
}
```

---

## 3.2 List Trades

**GET `/trades`**
Supports simple filtering for MVP.

**Query params:**

```
symbol=AAPL
from=2025-12-01
to=2025-12-10
limit=50
cursor=nextToken
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "cursor": "nextToken",
    "hasMore": true
  }
}
```

---

## 3.3 Get Trade Details

**GET `/trades/:id`**

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "trade_123",
    "symbol": "AAPL",
    "pnl": 68.0
  }
}
```

---

## 3.4 Update Trade

**PUT `/trades/:id`**

**Request:**

```json
{
  "notes": "Updated notes"
}
```

---

## 3.5 Delete Trade

**DELETE `/trades/:id`**
Returns `204 No Content`.

---

# 4. Analytics Endpoints

## 4.1 Summary Analytics

**GET `/analytics/summary`**
Returns minimal dashboard metrics for MVP.

**Response:**

```json
{
  "success": true,
  "data": {
    "netPnl": 12450.50,
    "winRate": 62.3,
    "totalTrades": 45,
    "bestTrade": 850.0,
    "worstTrade": -150.0
  }
}
```

Analytics is computed directly from trades table (no caching in MVP).

---

# 5. Uploads Endpoints (S3 Presigned Uploads)

## 5.1 Request Upload URL

**POST `/uploads/presign`**

**Request:**

```json
{
  "fileName": "chart.png",
  "fileType": "image/png",
  "fileSize": 204800
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uploadId": "upload_123",
    "url": "https://s3...",
    "fields": {}
  }
}
```

---

## 5.2 Confirm Upload

**POST `/uploads/:uploadId/confirm`**
Links uploaded file to trade.

**Request:**

```json
{
  "tradeId": "trade_123"
}
```

---

# 6. Error Response Structure

**Standard Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data submitted"
  }
}
```

Common error codes:

* `INVALID_TOKEN`
* `UNAUTHORIZED`
* `RESOURCE_NOT_FOUND`
* `VALIDATION_ERROR`
* `RATE_LIMIT_EXCEEDED`

---

# 7. Rate Limiting (MVP Simple Limits)

**Global limit:** 100 requests/min per IP.
Headers returned:

```
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

---

# 8. Summary of MVP Endpoints

| Category  | Endpoint                        |
| --------- | ------------------------------- |
| Auth      | POST /auth/register             |
|           | POST /auth/login                |
|           | POST /auth/refresh              |
|           | POST /auth/logout               |
| Trades    | POST /trades                    |
|           | GET /trades                     |
|           | GET /trades/:id                 |
|           | PUT /trades/:id                 |
|           | DELETE /trades/:id              |
| Analytics | GET /analytics/summary          |
| Uploads   | POST /uploads/presign           |
|           | POST /uploads/:uploadId/confirm |

---

# End of File
