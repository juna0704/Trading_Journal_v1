# MVP Architecture Document

**Project:** Trading Journal SaaS
**Version:** MVP 1.0
**Status:** Draft
**Last Updated:** December 2025

---

## 1. Architecture Overview

The MVP aims to deliver the **core trading journal experience** with a clean, scalable, and minimal architecture. Only essential services and flows are included while avoiding complex analytics, team features, or enterprise-level infrastructure.

The MVP consists of four primary layers:

1. **Frontend (Next.js)**
2. **Backend API (Express.js + TypeScript)**
3. **Database (PostgreSQL)**
4. **Storage (AWS S3)**

Additional supporting systems:

* **Authentication (JWT + Google OAuth)**
* **Background Jobs for Imports (BullMQ)**

---

## 2. High-Level System Diagram

```
User → Next.js Frontend → Express API → PostgreSQL
                      ↘ Direct Upload → S3
                      → Background Jobs (BullMQ)
```

### Core Flows Implemented in MVP

* User login (email/password + Google OAuth)
* Create/read/update/delete trades
* Basic analytics summaries (computed on-demand)
* CSV import via background job
* Upload screenshots/files to S3

---

## 3. Frontend Architecture (Next.js)

### Responsibilities

* User authentication & session handling
* UI for viewing & managing trades
* Uploading attachments directly to S3
* Making API calls to backend

### Components Used

* **Next.js App Router**
* **React** components for UI
* **Tailwind CSS + shadcn/ui** for basic styling
* **React Query** for server-state caching (optional but beneficial)

### Pages Required for MVP

1. **Login / Register**
2. **Dashboard (basic stats)**
3. **Trade List Page**
4. **Trade Entry / Edit Page**
5. **Import CSV Page**
6. **Settings: Profile** (minimal)

---

## 4. Backend Architecture (Express + TypeScript)

The backend exposes REST API endpoints and handles core logic.

### Responsibilities

* Authentication (JWT + Refresh tokens)
* Trade CRUD logic
* CSV import processing (job queue)
* Generating presigned URLs
* Validating input (Zod recommended)
* Role-based access (Owner only for MVP)

### MVP API Modules

* `/auth` → register/login/logout/refresh/oauth callback
* `/trades` → CRUD & list/filter
* `/uploads` → presign + confirm
* `/imports` → upload CSV + track status
* `/analytics` → simple summary metrics

---

## 5. Database Architecture (PostgreSQL)

MVP uses a **single database** with minimal tables.

### Required Tables for MVP

1. **users**
2. **tenants** (workspace)
3. **tenant_users** (simple: user belongs to tenant)
4. **trades**
5. **uploads**
6. **import_jobs**

### Multi-tenancy Approach

* MVP still uses **tenant_id** in tables.
* Full RLS implementation optional; simple filtering by tenant is enough for MVP.

---

## 6. Storage (AWS S3)

Used for:

* Trade screenshots
* CSV import files (optional temporary)

### MVP Upload Flow

1. Client requests a presigned URL via `/uploads/presign`
2. Client uploads directly to S3
3. Client confirms upload `/uploads/:id/confirm`
4. Backend stores metadata in DB

---

## 7. Background Job Architecture (BullMQ)

Used only for **CSV import processing**.

### Flow

1. User uploads CSV → backend stores file → queues job
2. Worker processes CSV → inserts trades
3. Worker updates job status
4. User can poll `/imports/:id/status`

### Job Types in MVP

* `trade_import`

Advanced jobs (analytics, reports, emails) are excluded from MVP.

---

## 8. Authentication Architecture

### Supported Methods

* **Email + Password login**
* **Google OAuth**
* **JWT access token (15 min)**
* **Refresh token (HTTP-only cookie)**

### MVP Auth Flow

```
Login → Issue tokens → Store refresh token in DB → Client stores access token → Refresh when expired
```

### Authorization

* Only two roles needed for MVP:

  * **owner** (full access)
  * **member** (optional; limited CRUD)

---

## 9. MVP Data Flow Diagram

```
User
 → Next.js (UI)
    → /api/auth/login → Express → PostgreSQL
    → /api/trades → Express → PostgreSQL
    → /api/uploads/presign → S3
    → Upload file → S3
    → confirm_upload → Express → PostgreSQL

CSV Import:
User → Upload CSV → Express → S3
Express → Queue Job → BullMQ
Worker → Fetch CSV → Process → PostgreSQL
```

---

## 10. Non-Functional Requirements (MVP Scope)

### Performance

* API P95 response < 300ms
* Max file size upload: 5MB
* CSV rows limit: 5,000 rows

### Security

* JWT-based authentication
* HTTPS only
* Input validation for all endpoints
* Basic rate limiting (IP-based)

### Reliability

* At least 99% uptime acceptable for MVP
* Daily DB backup

### Scalability

* Stateless API server (container ready)
* Redis optional, but used if jobs enabled

---

## 11. Out of Scope (For Post-MVP)

❌ Advanced analytics (profit factor, expectancy, breakdowns)
❌ Team roles beyond owner/admin
❌ Subscription billing (Razorpay)
❌ Email automation (Resend)
❌ Multi-region architecture
❌ Report generation (PDF/CSV)
❌ Sentry monitoring dashboards
❌ RLS + full enterprise multi-tenancy
❌ White-labeling & enterprise features

---

## 12. Summary

This MVP Architecture defines the minimal, scalable foundation of the Trading Journal SaaS.
It ensures:

* Clean separation of concerns
* Minimal dependencies
* Smooth migration to full V1 architecture later
* Low cost during early development


