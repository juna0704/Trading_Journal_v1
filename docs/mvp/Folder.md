# MVP Document #6 — Folder Structure

**Project:** Trading Journal SaaS (MVP)
**Document:** Folder Structure
**Version:** 1.0
**Status:** Final
**Author:** Junaid Ali Khan
**Last Updated:** December 2025

---

# 1. Overview

This document defines the **recommended folder structure** for the MVP implementation of the Trading Journal SaaS.
It follows clean architecture principles and ensures easy scaling toward the full v1 architecture.

The project is structured as **two separate applications**:

* **Frontend:** Next.js 14 (App Router)
* **Backend:** Express.js + TypeScript

Database and storage layers are external services (PostgreSQL + S3).

---

# 2. Repository Structure (Monorepo Recommended)

```
trading-journal-mvp/
│
├── apps/
│   ├── frontend/      # Next.js App
│   └── backend/       # Express API
│
├── infra/             # Infrastructure (docker, deployment, configs)
│
├── docs/              # System design + API + DB schema (your docs)
│
├── .env.example       # Template for env vars
├── package.json
└── README.md
```

Using a **monorepo** helps maintain clarity and simplifies deployments.

---

# 3. Frontend Structure — Next.js (MVP)

**Path:** `apps/frontend/`

```
frontend/
│
├── app/                              # App Router
│   ├── (auth)/                       # Public pages
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/                    # Main dashboard UI
│   ├── trades/                       # CRUD pages
│   │   ├── page.tsx                  # List trades
│   │   ├── new/                      # Create trade
│   │   └── [id]/                     # Edit trade
│   │
│   ├── imports/                      # CSV import pages
│   │   └── page.tsx
│   │
│   └── layout.tsx                    # Root layout
│
├── components/                       # Reusable UI components
│   ├── ui/                           # shadcn/ui components
│   ├── forms/
│   ├── charts/
│   └── tables/
│
├── lib/
│   ├── api.ts                        # Client API wrapper
│   ├── utils.ts
│   └── auth.ts                       # Token helpers
│
├── hooks/                            # Custom hooks
│
├── styles/
│   ├── globals.css
│   └── tailwind.css
│
├── public/                           # Static assets
│
└── package.json
```

### Frontend Notes

* **Minimal pages** (login, register, dashboard, trades CRUD, CSV import)
* **React Query optional** but recommended
* **Presigned S3 upload logic** lives in `lib/api.ts`

---

# 4. Backend Structure — Express + TypeScript (MVP)

**Path:** `apps/backend/`

```
backend/
│
├── src/
│   ├── server.ts                     # App entry
│   ├── app.ts                        # Express app configuration
│   │
│   ├── config/
│   │   ├── env.ts                    # Environment loader
│   │   ├── db.ts                     # PostgreSQL connection
│   │   └── s3.ts                     # S3 SDK client
│   │
│   ├── middleware/
│   │   ├── auth.ts                   # JWT verification
│   │   ├── error-handler.ts          # Global error handling
│   │   └── validate.ts               # Zod validator
│   │
│   ├── modules/                      # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── trades/
│   │   │   ├── trades.controller.ts
│   │   │   ├── trades.routes.ts
│   │   │   └── trades.service.ts
│   │   │
│   │   ├── uploads/
│   │   │   ├── uploads.controller.ts
│   │   │   ├── uploads.routes.ts
│   │   │   └── uploads.service.ts
│   │   │
│   │   ├── imports/
│   │   │   ├── imports.controller.ts
│   │   │   ├── imports.routes.ts
│   │   │   └── imports.service.ts
│   │   │
│   │   └── analytics/
│   │       ├── analytics.controller.ts
│   │       ├── analytics.routes.ts
│   │       └── analytics.service.ts
│   │
│   ├── workers/                      # Background jobs
│   │   ├── import.worker.ts
│   │   └── queue.ts
│   │
│   ├── schemas/                      # Zod schemas
│   │   ├── auth.schema.ts
│   │   ├── trade.schema.ts
│   │   └── upload.schema.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── csv.ts
│   │
│   ├── types/
│   │   └── global.ts
│   │
│   └── index.ts                      # Export root
│
├── migrations/                       # DB migrations
├── .env.example
└── package.json
```

### Backend Notes

* Each feature is isolated inside `/modules`
* Zod schemas ensure clean request validation
* Workers only include CSV import logic for MVP
* JWT auth middleware enforces access control

---

# 5. Infrastructure Folder Structure

**Path:** `infra/`

```
infra/
│
├── docker/
│   ├── docker-compose.dev.yml        # Local DB + Redis (optional)
│   └── Dockerfile.backend            # Production backend image
│
├── scripts/
│   ├── seed.ts                       # Dev database seed
│   └── migrate.ts                    # Migration runner
│
└── env/
    ├── dev.env
    ├── prod.env
    └── staging.env
```

---

# 6. Environment Variables (MVP)

### Frontend `.env`

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_S3_BUCKET=your-bucket
```

### Backend `.env`

```
PORT=4000
DATABASE_URL=postgres://...
JWT_SECRET=supersecretkey
S3_BUCKET=your-bucket
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

# 7. Folder Structure Philosophy

The MVP folder structure is designed to:

* Be **simple** enough for fast development
* Be **modular** enough for future scaling
* Map directly to the features defined in MVP Documents #2–#5

It supports:

* Clear separation of backend & frontend
* Modular backend design
* Future upgrade into microservices (if needed)
* Clean developer onboarding

---

# 8. What Comes Next (Post-MVP Folder Additions)

### For full v1:

* `/modules/billing` for Razorpay
* `/modules/teams` for RBAC & multi-tenancy
* `/modules/reports` for PDF generation
* Workers for analytics, email, cleanup
* `infra/k8s/` for Kubernetes deployments

---

# 9. Summary

This folder structure provides a clean, scalable foundation for the MVP with:

* Modular backend
* Well-organized Next.js frontend
* Clear separation of responsibilities
* Ease of maintenance & feature growth
