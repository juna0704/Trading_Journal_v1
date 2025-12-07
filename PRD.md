# Trading Journal - Product Requirements Document

**Project:** Trading Journal (Personal → SaaS)  
**Author:** Junaid Ali Khan  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** December 8, 2025

---

## Executive Summary

The Trading Journal is a comprehensive platform designed to help traders track, analyze, and improve their trading performance. Starting as a personal tool, it will evolve into a multi-tenant SaaS platform with subscription-based billing.

**Vision:** Empower traders with actionable insights to make better trading decisions through systematic journaling and data-driven analysis.

**Target Market:** Retail traders, day traders, swing traders, and small trading teams seeking professional-grade performance tracking.

---

## Table of Contents

1. [Product Purpose](#1-product-purpose)
2. [Goals & Objectives](#2-goals--objectives)
3. [User Personas](#3-user-personas)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [MVP Scope](#7-mvp-scope)
8. [API Overview](#8-api-overview)
9. [Success Metrics](#9-success-metrics)
10. [Risks & Mitigation](#10-risks--mitigation)
11. [Future Roadmap](#11-future-roadmap)
12. [Out of Scope](#12-out-of-scope)

---

## 1. Product Purpose

### Problem Statement

Traders struggle to maintain consistent records of their trades, leading to:
- Inability to identify patterns in winning and losing trades
- Lack of accountability and discipline
- Difficulty tracking performance across multiple strategies
- No systematic way to improve trading psychology
- Manual spreadsheet maintenance that's error-prone and time-consuming

### Solution

A comprehensive trading journal that enables traders to:
- **Log trades** with detailed metadata (entry, exit, quantity, strategy, notes)
- **Track performance** through real-time statistics (P&L, win rate, drawdown, expectancy)
- **Analyze patterns** using filters for symbol, tags, strategy, and date range
- **Visualize progress** with equity curves and performance breakdowns
- **Store evidence** by attaching screenshots and charts to trades
- **Export data** for tax reporting or further analysis

### Evolution Path

**Phase 1 (Personal):** Single-user application with core journaling features  
**Phase 2 (SaaS):** Multi-tenant platform with team collaboration and billing  
**Phase 3 (Enterprise):** Advanced features like broker integration and AI analysis

---

## 2. Goals & Objectives

### 2.1 Primary Goals

| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Trade Logging** | Enable quick, comprehensive trade entry | <60 seconds per trade entry |
| **Performance Tracking** | Real-time P&L, win rate, and risk metrics | 100% accurate calculations |
| **Data Organization** | Flexible filtering by symbol, tags, strategy, date | <2 seconds query response |
| **Evidence Storage** | Secure attachment of screenshots and charts | 99.9% upload success rate |
| **Analytics Visualization** | Interactive equity curves and breakdowns | Insights within 3 clicks |
| **Data Portability** | Seamless import/export capabilities | Support CSV, JSON formats |

### 2.2 Secondary Goals (SaaS Phase)

| Goal | Description | Timeline |
|------|-------------|----------|
| **Multi-User Support** | Team workspaces with shared analytics | Q2 2026 |
| **Role-Based Access** | Owner, admin, member, viewer permissions | Q2 2026 |
| **Subscription Billing** | Razorpay integration with tiered pricing | Q3 2026 |
| **Usage Limits** | Enforce trade limits per plan tier | Q3 2026 |
| **Automated Reports** | Email PDF performance summaries | Q4 2026 |
| **API Access** | Webhooks and programmatic access | 2027 |

### 2.3 Business Objectives

- **User Acquisition:** 1,000 active users within 6 months of launch
- **Conversion Rate:** 20% free-to-paid conversion by month 12
- **Customer Retention:** 80% annual retention for paid users
- **Revenue Target:** ₹10 lakhs MRR by end of year 1

---

## 3. User Personas

### 3.1 Primary Persona: Independent Trader

**Name:** Rahul Sharma  
**Age:** 28  
**Occupation:** Day Trader (Full-time)  
**Experience:** 3 years trading equity and F&O

**Goals:**
- Track 200+ trades per month systematically
- Identify which setups work best for him
- Maintain discipline and avoid revenge trading
- Prepare accurate records for tax filing

**Pain Points:**
- Uses Excel but finds it time-consuming
- Struggles to remember trade rationale after a few days
- Can't easily visualize performance trends
- No way to attach chart screenshots to trades

**Tech Savviness:** High - comfortable with web apps and APIs

---

### 3.2 Secondary Persona: Team Owner

**Name:** Priya Verma  
**Age:** 35  
**Occupation:** Proprietary Trading Firm Owner  
**Team Size:** 5 traders

**Goals:**
- Monitor team performance across multiple strategies
- Identify top performers and provide coaching
- Maintain compliance records
- Generate monthly performance reports for investors

**Pain Points:**
- No centralized platform for team trade tracking
- Difficult to enforce journaling discipline
- Manual aggregation of team statistics
- Expensive enterprise tools beyond budget

**Tech Savviness:** Medium - relies on team for technical setup

---

### 3.3 Tertiary Persona: Swing Trader

**Name:** Amit Patel  
**Age:** 42  
**Occupation:** Part-time Swing Trader (Full-time IT Professional)  
**Experience:** 5 years, ~20 trades per month

**Goals:**
- Track longer-term trades with detailed notes
- Review trades monthly to refine strategy
- Separate trading income for tax purposes
- Keep personal trading separate from family finances

**Pain Points:**
- Forgets entry rationale by exit time
- Needs simple interface for occasional use
- Wants mobile access for trade logging
- Concerned about data security and privacy

**Tech Savviness:** Medium - prefers simple, intuitive interfaces

---

## 4. User Stories

### 4.1 Authentication & Account Management

```
US-001: User Registration
As a new user
I want to create an account with email and password
So that I can securely store my trading data

Acceptance Criteria:
- Email validation required
- Password strength requirements enforced (min 8 chars, uppercase, number)
- Email verification sent upon registration
- Account created with default settings
- Automatic login after verification
```

```
US-002: Secure Login
As a returning user
I want to log in with my credentials
So that I can access my trading journal

Acceptance Criteria:
- Support email + password authentication
- JWT-based session with 15-minute access token
- Remember me option for 30-day refresh token
- Rate limiting after 5 failed attempts
- Two-factor authentication option (future)
```

```
US-003: Password Reset
As a user who forgot my password
I want to receive a reset link via email
So that I can regain access to my account

Acceptance Criteria:
- Password reset link expires in 1 hour
- Link can only be used once
- Email notification sent on successful reset
- Old sessions invalidated after password change
```

---

### 4.2 Trade Management

```
US-004: Add New Trade
As a trader
I want to add a trade with comprehensive details
So that I can maintain accurate records

Acceptance Criteria:
- Required fields: symbol, side (long/short), entry price, exit price, quantity
- Optional fields: fees, notes, tags, entry/exit timestamps
- Automatic P&L calculation
- Support for partial exits (future)
- Validate numeric inputs
- Display confirmation after successful save
```

```
US-005: Edit Existing Trade
As a trader
I want to edit trade details after entry
So that I can correct mistakes or add more information

Acceptance Criteria:
- All fields editable except trade ID
- P&L recalculated on price/quantity changes
- Show last modified timestamp
- Audit trail for edits (future)
- Optimistic UI update with rollback on error
```

```
US-006: Delete Trade
As a trader
I want to delete a trade
So that I can remove test entries or mistakes

Acceptance Criteria:
- Confirmation dialog before deletion
- Soft delete with 30-day recovery window
- Remove from analytics immediately
- Associated attachments moved to recycle bin
- Cannot delete trades older than 90 days without admin permission (SaaS)
```

```
US-007: Bulk Import Trades
As a trader migrating from another system
I want to import trades via CSV
So that I don't have to manually re-enter historical data

Acceptance Criteria:
- Support CSV format with standard columns
- Validate data before import
- Show preview of trades to be imported
- Handle errors gracefully with detailed error messages
- Background processing for large files (>1000 trades)
- Email notification upon completion
```

```
US-008: Export Trades
As a trader
I want to export my trades to CSV/JSON
So that I can analyze data externally or for tax reporting

Acceptance Criteria:
- Export selected or all trades
- Support date range filtering
- Include calculated fields (P&L, R-multiple)
- Generate file within 30 seconds for <10,000 trades
- Download link via email for large exports
```

---

### 4.3 Trade Organization

```
US-009: Add Tags to Trades
As a trader
I want to categorize trades with multiple tags
So that I can analyze performance by strategy or setup

Acceptance Criteria:
- Create custom tags with name and color
- Apply multiple tags to a single trade
- Autocomplete when typing tag names
- Limit of 20 tags per trade
- Tag suggestions based on historical usage
```

```
US-010: Filter Trades
As a trader
I want to filter trades by various criteria
So that I can focus on specific subsets of data

Acceptance Criteria:
- Filter by: symbol, tag, date range, win/loss, strategy
- Combine multiple filters (AND logic)
- Save filter presets for quick access
- Display result count in real-time
- Export filtered results
```

```
US-011: Search Trades
As a trader
I want to search trades by notes or tags
So that I can quickly find specific trades

Acceptance Criteria:
- Full-text search in notes field
- Search by symbol (partial match)
- Search by tag name
- Display results in <1 second
- Highlight matched terms in results
```

---

### 4.4 Analytics & Insights

```
US-012: View Dashboard Summary
As a trader
I want to see key metrics at a glance
So that I can quickly assess my performance

Acceptance Criteria:
- Display: total P&L, win rate, total trades, expectancy
- Show period-over-period changes (e.g., vs last month)
- Visual indicators (green/red) for positive/negative metrics
- Customizable date range (today, week, month, year, all-time)
- Cache results for <5 minute staleness
```

```
US-013: View Equity Curve
As a trader
I want to see my cumulative P&L over time
So that I can visualize my account growth

Acceptance Criteria:
- Line chart showing cumulative P&L
- X-axis: dates, Y-axis: equity
- Zoom/pan capabilities
- Hover tooltips showing exact values
- Toggle between absolute and percentage views
- Highlight drawdown periods
```

```
US-014: Performance Breakdown
As a trader
I want to analyze performance across different dimensions
So that I can identify strengths and weaknesses

Acceptance Criteria:
- Break down by: symbol, tag/strategy, day of week, month
- Display: win rate, avg P&L, total trades per category
- Sort by any column
- Visual charts (bar/pie) for each breakdown
- Export breakdown data
```

```
US-015: Trade Statistics
As a trader
I want to see detailed statistical metrics
So that I can evaluate my trading edge

Acceptance Criteria:
- Display: expectancy, average R, largest win/loss
- Show: profit factor, Sharpe ratio, max drawdown
- Calculate: average hold time, win streak, loss streak
- Compare current period to historical average
- Educational tooltips explaining each metric
```

---

### 4.5 Attachments & Media

```
US-016: Upload Trade Screenshots
As a trader
I want to attach chart screenshots to trades
So that I can review my entry/exit decisions later

Acceptance Criteria:
- Support: JPG, PNG, WebP formats
- Maximum file size: 5 MB per image
- Preview thumbnails in trade detail view
- Lightbox view for full-size images
- Delete attachments individually
- Store in secure cloud storage (S3)
```

```
US-017: Add Trade Notes
As a trader
I want to write detailed notes about my trade rationale
So that I can learn from past decisions

Acceptance Criteria:
- Rich text editor with formatting (bold, italic, lists)
- Markdown support (optional)
- Auto-save every 30 seconds
- Character limit: 5,000 characters
- Timestamp for note creation/edit
```

---

### 4.6 SaaS Features (Future)

```
US-018: Invite Team Members
As a team owner
I want to invite traders to my workspace
So that we can track team performance collectively

Acceptance Criteria:
- Send email invitations with unique link
- Set role during invitation (admin/member/viewer)
- Track invitation status (pending/accepted/expired)
- Revoke access at any time
- Limit based on subscription plan
```

```
US-019: Manage Subscription
As a team owner
I want to upgrade/downgrade my subscription plan
So that I can access features appropriate for my needs

Acceptance Criteria:
- View current plan and usage
- Compare plan features
- One-click upgrade with prorated billing
- Downgrade takes effect at period end
- Payment method management
- View billing history and invoices
```

```
US-020: Automated Reports
As a user on a paid plan
I want to receive monthly performance reports via email
So that I can review my progress regularly

Acceptance Criteria:
- PDF report with key metrics and charts
- Scheduled delivery on 1st of each month
- Customize report frequency (weekly/monthly)
- Option to disable automated reports
- Include top 5 best/worst trades
```

---

## 5. Functional Requirements

### 5.1 Authentication System

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-AUTH-001** | Must Have | Email/password registration with validation |
| **FR-AUTH-002** | Must Have | JWT-based authentication with access + refresh tokens |
| **FR-AUTH-003** | Must Have | Password reset via email verification |
| **FR-AUTH-004** | Nice to Have | Social login (Google, Apple) |
| **FR-AUTH-005** | Nice to Have | Two-factor authentication (TOTP) |
| **FR-AUTH-006** | Must Have | Session management with token refresh |
| **FR-AUTH-007** | Must Have | Rate limiting on auth endpoints |

### 5.2 Trade Management

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-TRADE-001** | Must Have | Create trade with required fields (symbol, side, prices, quantity) |
| **FR-TRADE-002** | Must Have | Automatic P&L calculation based on entry/exit prices |
| **FR-TRADE-003** | Must Have | Edit and delete trades with confirmation |
| **FR-TRADE-004** | Must Have | Support for fees/commissions in P&L calculation |
| **FR-TRADE-005** | Nice to Have | Partial exit support (close position in stages) |
| **FR-TRADE-006** | Must Have | Trade timestamps with timezone support |
| **FR-TRADE-007** | Must Have | Notes field with 5,000 character limit |

### 5.3 Filtering & Search

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-FILTER-001** | Must Have | Filter by date range (from/to) |
| **FR-FILTER-002** | Must Have | Filter by symbol (exact or partial match) |
| **FR-FILTER-003** | Must Have | Filter by tags (OR logic for multiple tags) |
| **FR-FILTER-004** | Must Have | Filter by win/loss status |
| **FR-FILTER-005** | Nice to Have | Filter by strategy type |
| **FR-FILTER-006** | Nice to Have | Save filter presets |
| **FR-FILTER-007** | Must Have | Full-text search in notes |

### 5.4 Analytics

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-ANALYTICS-001** | Must Have | Dashboard with total P&L, win rate, trade count |
| **FR-ANALYTICS-002** | Must Have | Equity curve visualization (cumulative P&L over time) |
| **FR-ANALYTICS-003** | Must Have | Performance breakdown by symbol |
| **FR-ANALYTICS-004** | Nice to Have | Performance breakdown by tag/strategy |
| **FR-ANALYTICS-005** | Nice to Have | Performance breakdown by day of week |
| **FR-ANALYTICS-006** | Nice to Have | Performance breakdown by month |
| **FR-ANALYTICS-007** | Must Have | Calculate expectancy, profit factor, Sharpe ratio |
| **FR-ANALYTICS-008** | Must Have | Display max drawdown and recovery |
| **FR-ANALYTICS-009** | Nice to Have | Win/loss streak tracking |

### 5.5 Data Import/Export

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-IMPORT-001** | Nice to Have | CSV import with column mapping |
| **FR-IMPORT-002** | Nice to Have | Validation and error reporting for imports |
| **FR-IMPORT-003** | Nice to Have | Background processing for large imports (>1000 trades) |
| **FR-EXPORT-001** | Must Have | CSV export with all trade fields |
| **FR-EXPORT-002** | Must Have | JSON export for programmatic access |
| **FR-EXPORT-003** | Nice to Have | PDF export of filtered trades |
| **FR-EXPORT-004** | Nice to Have | Excel export with formatted sheets |

### 5.6 File Management

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-FILE-001** | Must Have | Upload images (JPG, PNG, WebP) up to 5 MB |
| **FR-FILE-002** | Must Have | Associate images with specific trades |
| **FR-FILE-003** | Must Have | Delete uploaded images |
| **FR-FILE-004** | Must Have | Secure storage using presigned URLs |
| **FR-FILE-005** | Nice to Have | Image compression on upload |
| **FR-FILE-006** | Nice to Have | Multiple images per trade (up to 5) |

### 5.7 Tag System

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-TAG-001** | Must Have | Create custom tags with name and color |
| **FR-TAG-002** | Must Have | Apply multiple tags to a trade |
| **FR-TAG-003** | Must Have | Edit and delete tags |
| **FR-TAG-004** | Nice to Have | Tag suggestions based on usage frequency |
| **FR-TAG-005** | Must Have | List all tags with trade count |

### 5.8 Multi-Tenancy (SaaS Phase)

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-TENANT-001** | Future | Create tenant/workspace on registration |
| **FR-TENANT-002** | Future | Invite users to tenant via email |
| **FR-TENANT-003** | Future | Role-based access control (owner, admin, member, viewer) |
| **FR-TENANT-004** | Future | Tenant-level settings and preferences |
| **FR-TENANT-005** | Future | Usage limits based on subscription plan |

### 5.9 Billing (SaaS Phase)

| Requirement | Priority | Description |
|-------------|----------|-------------|
| **FR-BILL-001** | Future | Razorpay integration for payments |
| **FR-BILL-002** | Future | Subscription plans (Free, Pro, Enterprise) |
| **FR-BILL-003** | Future | Upgrade/downgrade flow with prorated billing |
| **FR-BILL-004** | Future | Usage tracking (trades per month) |
| **FR-BILL-005** | Future | Billing history and invoice downloads |
| **FR-BILL-006** | Future | Automated payment reminders |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target | Measurement Method |
|-------------|--------|-------------------|
| **NFR-PERF-001** | API response time <300ms (p95) | Application metrics |
| **NFR-PERF-002** | Dashboard load time <2 seconds | Lighthouse, Web Vitals |
| **NFR-PERF-003** | Support 100,000 trades per tenant | Load testing |
| **NFR-PERF-004** | Analytics queries <500ms | Database slow query log |
| **NFR-PERF-005** | Image upload <5 seconds (5MB file) | Real user monitoring |
| **NFR-PERF-006** | CSV export (10,000 trades) <30 seconds | Background job metrics |

### 6.2 Security

| Requirement | Implementation | Priority |
|-------------|----------------|----------|
| **NFR-SEC-001** | Password hashing with Argon2 | Must Have |
| **NFR-SEC-002** | JWT-based authentication with 15-min access tokens | Must Have |
| **NFR-SEC-003** | HTTP-only, secure refresh tokens | Must Have |
| **NFR-SEC-004** | Rate limiting: 10 login attempts per hour | Must Have |
| **NFR-SEC-005** | TLS 1.3 for all connections | Must Have |
| **NFR-SEC-006** | Input validation using Zod schemas | Must Have |
| **NFR-SEC-007** | SQL injection prevention via parameterized queries | Must Have |
| **NFR-SEC-008** | XSS protection via CSP headers | Must Have |
| **NFR-SEC-009** | CSRF protection for state-changing operations | Must Have |
| **NFR-SEC-010** | Secure file uploads with MIME type validation | Must Have |

### 6.3 Reliability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| **NFR-REL-001** | 99.9% uptime (SaaS) | Multi-region deployment |
| **NFR-REL-002** | Daily automated database backups | Neon automated backups |
| **NFR-REL-003** | Point-in-time recovery (7 days) | Database provider feature |
| **NFR-REL-004** | Error rate <0.1% | Sentry monitoring + alerts |
| **NFR-REL-005** | Graceful degradation on service failures | Circuit breaker pattern |

### 6.4 Scalability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| **NFR-SCALE-001** | Support 10,000 concurrent users | Horizontal scaling |
| **NFR-SCALE-002** | Handle 1,000 trades created per minute | Background job queues |
| **NFR-SCALE-003** | Analytics cached with 5-min staleness | Redis caching layer |
| **NFR-SCALE-004** | Auto-scale based on CPU >70% | Cloud platform auto-scaling |

### 6.5 Usability

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **NFR-USE-001** | Trade entry completion <60 seconds | User testing |
| **NFR-USE-002** | Mobile-responsive design | Device testing |
| **NFR-USE-003** | Accessibility compliance (WCAG 2.1 AA) | Automated audits |
| **NFR-USE-004** | Intuitive navigation (max 3 clicks) | User journey mapping |
| **NFR-USE-005** | Error messages with actionable guidance | UX review |

### 6.6 Compliance

| Requirement | Description | Priority |
|-------------|-------------|----------|
| **NFR-COMP-001** | GDPR-compliant data export | Must Have (SaaS) |
| **NFR-COMP-002** | GDPR-compliant data deletion | Must Have (SaaS) |
| **NFR-COMP-003** | Audit logs for sensitive operations | Nice to Have |
| **NFR-COMP-004** | Data residency options | Future |

### 6.7 Maintainability

| Requirement | Implementation | Priority |
|-------------|----------------|----------|
| **NFR-MAINT-001** | Structured logging with Winston | Must Have |
| **NFR-MAINT-002** | Error tracking with Sentry | Must Have |
| **NFR-MAINT-003** | API documentation with OpenAPI | Must Have |
| **NFR-MAINT-004** | TypeScript for type safety | Must Have |
| **NFR-MAINT-005** | Unit test coverage >80% | Nice to Have |
| **NFR-MAINT-006** | E2E test coverage for critical paths | Nice to Have |

---

## 7. MVP Scope

### 7.1 Must-Have Features (Launch Blockers)

**Authentication**
- ✅ Email/password registration and login
- ✅ JWT-based session management
- ✅ Password reset flow

**Trade Management**
- ✅ Create, read, update, delete trades
- ✅ Automatic P&L calculation
- ✅ Notes field (5,000 chars)
- ✅ Fee/commission support

**Organization**
- ✅ Custom tags with colors
- ✅ Apply multiple tags per trade
- ✅ Filter by date, symbol, tag, win/loss

**Analytics**
- ✅ Dashboard summary (P&L, win rate, trade count)
- ✅ Basic statistics (expectancy, avg P&L)
- ✅ Trade list with sorting

**Data Management**
- ✅ CSV export
- ✅ Image uploads (max 5 MB)

### 7.2 Nice-to-Have Features (Post-Launch)

**Analytics+**
- 📊 Equity curve visualization
- 📊 Performance breakdown by symbol
- 📊 Performance breakdown by tag/strategy
- 📊 Day-of-week analysis

**Data Management+**
- 📄 CSV import with validation
- 📄 JSON export
- 📄 PDF reports

**UX Enhancements**
- 🎨 Dark mode
- 🎨 Customizable dashboard widgets
- 🎨 Keyboard shortcuts

### 7.3 Future Features (SaaS Phase)

**Multi-Tenancy**
- 👥 Workspace creation
- 👥 User invitations
- 👥 Role-based access control

**Billing**
- 💳 Razorpay integration
- 💳 Subscription tiers
- 💳 Usage limits enforcement

**Advanced Features**
- 🤖 Automated email reports
- 🤖 Webhook integrations
- 🤖 API access with keys

---

## 8. API Overview

### 8.1 Endpoint Structure

All endpoints prefixed with `/api/v1`

#### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create new user account | No |
| POST | `/auth/login` | Authenticate user | No |
| POST | `/auth/refresh` | Refresh access token | Refresh token (cookie) |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Complete password reset | Reset token |

#### Trade Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/trades` | List trades with filters | Yes |
| POST | `/trades` | Create new trade | Yes |
| GET | `/trades/:id` | Get trade details | Yes |
| PUT | `/trades/:id` | Update trade | Yes |
| DELETE | `/trades/:id` | Delete trade | Yes |
| POST | `/trades/import` | Bulk import from CSV | Yes |
| GET | `/trades/export` | Export to CSV/JSON | Yes |

#### Tag Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/tags` | List all tags | Yes |
| POST | `/tags` | Create new tag | Yes |
| PUT | `/tags/:id` | Update tag | Yes |
| DELETE | `/tags/:id` | Delete tag | Yes |
| POST | `/trades/:id/tags` | Add tags to trade | Yes |
| DELETE | `/trades/:id/tags/:tagId` | Remove tag from trade | Yes |

#### Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/summary` | Overall performance summary | Yes |
| GET | `/analytics/equity` | Equity curve data points | Yes |
| GET | `/analytics/breakdown` | Performance by dimension | Yes |
| GET | `/analytics/statistics` | Detailed statistical metrics | Yes |

#### Upload Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/uploads/presign` | Get presigned URL for upload | Yes |
| POST | `/uploads/complete` | Confirm upload completion | Yes |
| DELETE | `/uploads/:id` | Delete uploaded file | Yes |

#### User/Account Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update user profile | Yes |
| POST | `/users/me/change-password` | Change password | Yes |
| DELETE | `/users/me` | Delete account (GDPR) | Yes |
| GET | `/users/me/export` | Export all user data (GDPR) | Yes |

### 8.2 Common Query Parameters

**Pagination:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)

**Filtering:**
- `from` (ISO 8601 date)
- `to` (ISO 8601 date)
- `symbol` (string)
- `tag` (tag ID, repeatable)
- `win` (boolean)
- `strategy` (string)

**Sorting:**
- `sort` (field name)
- `order` (asc/desc)

---

## 9. Success Metrics

### 9.1 Product Metrics (Personal Version)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Time to First Trade** | <5 minutes from signup | Analytics tracking |
| **Average Trade Entry Time** | <60 seconds | User timing events |
| **Daily Active Users (DAU)** | 70% of weekly users | Analytics |
| **Weekly Active Users (WAU)** | 200 within 3 months | Analytics |
| **Export Usage** | 30% of users export monthly | Feature usage tracking |
| **Analytics Views** | 80% view dashboard weekly | Feature usage tracking |

### 9.2 Technical Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **API Error Rate** | <0.1% | Error tracking (Sentry) |
| **Page Load Time (p95)** | <2 seconds | Real user monitoring |
| **API Response Time (p95)** | <300ms | Application performance monitoring |
| **Uptime** | >99.5% | Uptime monitoring service |
| **Successful Uploads** | >99% | Upload service metrics |

### 9.3 Business Metrics (SaaS Phase)

| Metric | Target | Timeline |
|--------|--------|----------|
| **User Acquisition** | 1,000 registered users | Month 6 |
| **Free-to-Paid Conversion** | 20% conversion rate | Month 12 |
| **Monthly Recurring Revenue (MRR)** | ₹10 lakhs | Month 12 |
| **Customer Retention Rate** | >80% annually | Ongoing |
| **Net Promoter Score (NPS)** | >50 | Quarterly survey |
| **Customer Acquisition Cost (CAC)** | <₹2,000 | Marketing analytics |
| **Lifetime Value (LTV)** | >₹24,000 | Cohort analysis |
| **Churn Rate** | <5% monthly | Subscription analytics |

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Heavy Analytics Queries** | High | High | Precompute stats, use materialized views, implement caching |
| **Database Performance Degradation** | High | Medium | Proper indexing, query optimization, read replicas |
| **File Storage Costs** | Medium | High | Implement file size limits, use lifecycle policies, compress images |
| **Third-Party API Downtime** | Medium | Low | Implement circuit breakers, have fallback mechanisms |
| **Data Loss** | Critical | Low | Daily backups, point-in-time recovery, regular restore testing |

### 10.2 Business Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Strong Competition** | High | High | Focus on superior UX, Indian market pricing, local payment methods |
| **Low Conversion Rate** | High | Medium | Generous free tier, educational content, clear value proposition |
| **User Churn** | High | Medium | Continuous feature improvements, excellent support, community building |
| **Pricing Model Issues** | Medium | Medium | Market research, A/B testing, flexible tiers |
| **Market Size Constraints** | Medium | Low | Expand to global market, target professional traders |

### 10.3 Product Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Complex User Interface** | High | Medium | User testing, iterative design, progressive disclosure |
| **Feature Bloat** | Medium | High | Strict MVP scope, user feedback prioritization |
| **Mobile Experience** | High | High | Mobile-first design, responsive layouts, consider native app |
| **Data Migration Complexity** | Medium | Medium | Robust CSV import, clear documentation, migration support |

### 10.4 Compliance Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **GDPR Non-Compliance** | Critical | Low | Implement data export/delete, privacy policy, legal review |
| **Data Breach** | Critical | Low | Regular security audits, penetration testing, encryption |
| **Tax Reporting Issues** | Medium | Low | Disclaimer that tool is not tax advice, provide export features |

---

## 11. Future Roadmap

### 11.1 Phase 1 - Personal MVP (Months 1-3)

**Goal:** Launch functional personal trading journal

- ✅ Core authentication system
- ✅ Basic trade CRUD operations
- ✅ Tag system and filtering
- ✅ Dashboard with key metrics
- ✅ CSV export
- ✅ File uploads
- 🚀 **Launch to beta users**

### 11.2 Phase 2 - Enhanced Analytics (Months 4-6)

**Goal:** Provide advanced insights and visualizations

- 📊 Equity curve with interactive charts
- 📊 Performance breakdown by multiple dimensions
- 📊 Advanced statistics (Sharpe ratio, max drawdown)
- 📊 Trade journal with psychological notes
- 📄 CSV import with validation
- 📄 PDF report generation
- 🎨 Dark mode and UI polish

### 11.3 Phase 3 - SaaS Transformation (Months 7-12)

**Goal:** Transform into multi-tenant SaaS platform

- 👥 Multi-tenant architecture with RLS
- 👥 Team workspaces and invitations
- 👥 Role-based access control
- 💳 Razorpay billing integration
- 💳 Subscription tier enforcement
- 🤖 Automated monthly reports
- 📧 Email notification system
- 🚀 **Public launch with marketing**

### 11.4 Phase 4 - Advanced Features (Year 2)

**Goal:** Differentiate with premium features

- 🔗 Broker API integrations (Zerodha Kite, Upstox)
- 🤖 AI-powered trade analysis and pattern recognition
- 📱 Native mobile apps (iOS, Android)
- 🌐 Webhook system for custom integrations
- 🔑 Public API with developer documentation
- 📊 Options-specific features (Greeks, IV tracking)
- 🏢 Enterprise features (SSO, audit logs, white-label)

---

## 12. Out of Scope

The following features are explicitly excluded from current development:

### Not Planned for MVP or SaaS Launch

❌ **Automated Broker Integration**  
Rationale: Complex, requires partnerships, high maintenance

❌ **Real-Time Data Feeds**  
Rationale: Expensive, regulatory complexity, not core to journaling

❌ **AI Trade Recommendations**  
Rationale: High liability, requires extensive ML expertise, regulatory concerns

❌ **Social/Community Features**  
Rationale: Moderation overhead, focus on personal/team use first

❌ **Options Greeks Calculator**  
Rationale: Niche use case, complex implementation, tools exist

❌ **Backtesting Engine**  
Rationale: Different product category, significant complexity

❌ **Cryptocurrency Support**  
Rationale: Different market dynamics, regulatory uncertainty

❌ **Automated Tax Filing**  
Rationale: Requires CA partnership, high liability, regional variations

❌ **Live Trade Alerts**  
Rationale: Requires push infrastructure, not core journaling feature

❌ **Multi-Currency/Multi-Market**  
Rationale: Adds complexity, focus on Indian equities first

### Future Consideration (Post Year 1)

🔮 **Mobile Native Apps** - React Native implementation  
🔮 **Broker Integrations** - Starting with Zerodha Kite API  
🔮 **Webhook System** - For power users and integrations  
🔮 **White-Label Solution** - For prop firms and institutions  
🔮 **Advanced AI Features** - Pattern recognition, sentiment analysis

---

## Appendix A: Competitive Analysis

### Existing Solutions

| Product | Strengths | Weaknesses | Our Advantage |
|---------|-----------|------------|---------------|
| **Edgewonk** | Comprehensive analytics | Expensive ($89/mo), desktop only | Web-based, ₹499/mo, Indian payments |
| **TraderSync** | Broker integrations | Complex UI, US-focused | Simpler UX, Indian market focus |
| **TradeBench** | Good mobile app | Limited free tier | Generous free tier, better pricing |
| **Excel/Sheets** | Flexible, familiar | Manual, error-prone, no visuals | Automated calculations, beautiful charts |

---

## Appendix B: Technical Dependencies

### Core Technologies

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Recharts
- **Backend:** Node.js, TypeScript, Next.js API routes
- **Database:** PostgreSQL (Neon), DrizzleORM
- **Caching:** Redis (Upstash)
- **Storage:** AWS S3 or Cloudinary
- **Payments:** Razorpay
- **Auth:** Clerk or NextAuth.js
- **Monitoring:** Sentry, Vercel Analytics
- **Deployment:** Vercel (frontend), Render (workers)

---

## Appendix C: Glossary

**P&L (Profit & Loss):** The net profit or loss from a trade  
**Win Rate:** Percentage of trades that are profitable  
**Expectancy:** Average amount you can expect to win or lose per trade  
**Drawdown:** Peak-to-trough decline in account equity  
**Sharpe Ratio:** Risk-adjusted return metric  
**Profit Factor:** Gross profits divided by gross losses  
**R-Multiple:** Profit/loss expressed in terms of initial risk  
**Equity Curve:** Graph showing cumulative P&L over time  
**Tag:** Custom label for categorizing trades (e.g., "breakout", "momentum")  
**Tenant:** Workspace in multi-tenant SaaS (company or team)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | Nov 15, 2025 | Junaid Ali Khan | Initial draft |
| 0.5 | Nov 30, 2025 | Junaid Ali Khan | Added SaaS features |
| 1.0 | Dec 8, 2025 | Junaid Ali Khan | Complete rewrite with detailed requirements |

---

## Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | Junaid Ali Khan | ___________ | ______ |
| Tech Lead | Junaid Ali Khan | ___________ | ______ |
| Stakeholder | ___________ | ___________ | ______ |

---

## Related Documents
   - System Design Document (SDD) v1.0 - Technical implementation details
   - API Documentation - Detailed endpoint specifications
---

**End of Document**