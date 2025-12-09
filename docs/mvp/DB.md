# MVP Document #4 — Database Schema

**Project:** Trading Journal SaaS (MVP)
**Document:** Database Schema (MVP)
**Version:** 1.0
**Status:** Final
**Author:** Junaid Ali Khan
**Last Updated:** December 2025

---

# 1. Overview

This document defines the **minimal database schema** required to support the Trading Journal MVP. It includes only the essential tables needed for authentication, trade logging, basic analytics, CSV imports, and file uploads.

No multi-tenancy, no RLS, no advanced relations, no billing tables, and no team features are included in the MVP.

Database: **PostgreSQL**
Migration Tool (recommended): **DrizzleORM / Prisma / Kysely**

---

# 2. Entity Relationship Diagram (MVP)

```
 Users ───< Trades ───< Uploads
    \
     └────< ImportJobs
```

A simple and minimal relational structure.

---

# 3. Table Definitions

## 3.1 Users Table

Stores authentication details.

**Table:** `users`

| Column        | Type         | Constraints                    |
| ------------- | ------------ | ------------------------------ |
| id            | UUID         | PK, default uuid_generate_v4() |
| name          | VARCHAR(100) | NOT NULL                       |
| email         | VARCHAR(255) | UNIQUE, NOT NULL               |
| password_hash | TEXT         | NOT NULL                       |
| created_at    | TIMESTAMP    | DEFAULT now()                  |
| updated_at    | TIMESTAMP    | DEFAULT now()                  |

**Example Row:**

```
user_123 | John Doe | john@example.com | hash | 2025-12-10
```

---

## 3.2 Trades Table

Stores all trade entries.

**Table:** `trades`

| Column          | Type          | Constraints                                                      |
| --------------- | ------------- | ---------------------------------------------------------------- |
| id              | UUID          | PK                                                               |
| user_id         | UUID          | FK → users(id), ON DELETE CASCADE                                |
| symbol          | VARCHAR(50)   | NOT NULL                                                         |
| side            | VARCHAR(10)   | CHECK(side IN ('BUY','SELL','SHORT'))                            |
| entry_price     | NUMERIC(12,2) | NOT NULL                                                         |
| exit_price      | NUMERIC(12,2) | NULL (open trades allowed later)                                 |
| quantity        | INTEGER       | NOT NULL                                                         |
| pnl             | NUMERIC(12,2) | GENERATED ALWAYS AS (exit_price - entry_price) * quantity STORED |
| entry_timestamp | TIMESTAMP     | NOT NULL                                                         |
| exit_timestamp  | TIMESTAMP     | NULL                                                             |
| notes           | TEXT          | NULL                                                             |
| created_at      | TIMESTAMP     | DEFAULT now()                                                    |
| updated_at      | TIMESTAMP     | DEFAULT now()                                                    |

### Notes

* PnL auto-calculated using a **generated column**.
* MVP supports simple trades only (no splits, partial exits, fees, etc.).

---

## 3.3 Uploads Table

Stores uploaded screenshots/files linked to trades.

**Table:** `uploads`

| Column      | Type      | Constraints                       |
| ----------- | --------- | --------------------------------- |
| id          | UUID      | PK                                |
| trade_id    | UUID      | FK → trades(id) ON DELETE CASCADE |
| url         | TEXT      | NOT NULL                          |
| storage_key | TEXT      | NOT NULL                          |
| size_bytes  | INTEGER   | NOT NULL                          |
| created_at  | TIMESTAMP | DEFAULT now()                     |

### Notes

* `storage_key` stores the S3 object path.
* MVP keeps a simple relationship: **each upload must belong to a trade**.

---

## 3.4 Import Jobs Table

Tracks CSV import progress.

**Table:** `import_jobs`

| Column         | Type        | Constraints                                                    |
| -------------- | ----------- | -------------------------------------------------------------- |
| id             | UUID        | PK                                                             |
| user_id        | UUID        | FK → users(id)                                                 |
| file_url       | TEXT        | NOT NULL                                                       |
| status         | VARCHAR(20) | CHECK(status IN ('pending','processing','completed','failed')) |
| total_rows     | INTEGER     | NULL                                                           |
| processed_rows | INTEGER     | NULL                                                           |
| error_message  | TEXT        | NULL                                                           |
| created_at     | TIMESTAMP   | DEFAULT now()                                                  |
| updated_at     | TIMESTAMP   | DEFAULT now()                                                  |

### Example Status Flow

1. pending
2. processing
3. completed or failed

---

# 4. Schema SQL Definitions

Below are raw SQL versions for PostgreSQL.

## 4.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 4.2 Trades Table

```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY','SELL','SHORT')),
  entry_price NUMERIC(12,2) NOT NULL,
  exit_price NUMERIC(12,2),
  quantity INTEGER NOT NULL,
  pnl NUMERIC(12,2) GENERATED ALWAYS AS ((exit_price - entry_price) * quantity) STORED,
  entry_timestamp TIMESTAMP NOT NULL,
  exit_timestamp TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 4.3 Uploads Table

```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

````

---

## 4.4 Import Jobs Table
```sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  file_url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','processing','completed','failed')),
  total_rows INTEGER,
  processed_rows INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
````

---

# 5. Indexing Strategy (MVP)

Minimal indexing is applied.

### Recommended Indexes

```sql
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_entry_timestamp ON trades(entry_timestamp);
```

Uploads + Import Jobs usually do not require indexing for MVP.

---

# 6. Future Expansion (Post-MVP)

These are **not** included in MVP but the schema is designed to grow.

| Feature            | Schema Impact                                       |
| ------------------ | --------------------------------------------------- |
| Multi-tenancy      | Add tenant_id to all tables, add tenant_users table |
| Team roles         | Add role column, role-based permissions             |
| Advanced analytics | Add analytics_cache table                           |
| Billing            | Add subscriptions, invoices tables                  |
| RLS policies       | Enable row-level security by tenant                 |
| File cleanup       | Add status fields + automated cleanup jobs          |

---

# 7. Summary

This MVP database schema is:

* Minimal
* Easy to migrate
* Easy to extend
* Compatible with the later full system architecture


