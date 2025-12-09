# MVP Product Requirements Document (MVP-PRD)

**Project:** Trading Journal SaaS
**Version:** 1.0 (MVP)
**Status:** Approved
**Author:** Junaid Ali Khan
**Last Updated:** December 10, 2025

---

## 1. MVP Definition

The MVP goal is to launch a **simple, fast, reliable trading journal** for individual traders with the minimum set of features that deliver value:

* Users can log in
* Users can record trades
* Users can view & filter trades
* Users can see basic performance analytics
* Users can upload screenshots
* The app should look professional

This MVP does **not** include teams, billing, multi-tenancy, advanced analytics, background jobs, or subscriptions.

---

## 2. MVP Goals (What Success Looks Like)

### **Primary Goals**

* A trader can register, login, and manage their own journal
* A trader can add/edit/delete trades easily
* A trader can see basic performance stats
* A trader can upload screenshots to trades
* The UI feels clean, reliable, and modern
* The system is fast and stable

### **Not Included in MVP**

* Multi-tenant teams
* Billing or payment plans
* Advanced analytics
* Background jobs
* CSV import/export
* Report generation
* Subscription system
* Razorpay integration
* RBAC roles
* OAuth login
* Notifications
* Admin dashboard

---

## 3. Target User

The MVP focuses on **individual discretionary or systematic traders** who want to:

* Track their trades
* Analyze performance
* Improve discipline
* Keep screenshots of setups

Teams and enterprise customers are out of scope for MVP.

---

## 4. MVP Scope (Features Included)

## 4.1 Authentication

* Register (email + password)
* Login (email + password)
* Refresh token rotation
* Logout
* Password hashing with Argon2

**Non-MVP:** Google OAuth, email verification, MFA

---

## 4.2 Trade Journal (Core MVP Feature)

### Users can:

* Create a trade
* Edit a trade
* Delete a trade
* View a list of trades
* Filter trades by symbol, date range, side

### Trade fields for MVP:

* symbol
* side (BUY / SELL / SHORT)
* entryPrice
* exitPrice
* quantity
* entryTimestamp
* exitTimestamp
* notes
* screenshots (optional)

### Auto-calculated fields:

* PnL
* PnL %

---

## 4.3 Basic Analytics

Dashboard includes:

* Total net PnL
* Win rate
* Average win
* Average loss
* Best trade
* Worst trade
* Number of trades

**Non-MVP:** equity curve, strategy analytics, time analytics, team analytics

---

## 4.4 File Uploads

* Upload a screenshot for a trade
* Store file in S3 using presigned URLs
* Display screenshot on trade detail page

**Non-MVP:** multiple screenshots, auto compression, PDF reports, attachment workflows

---

## 4.5 User Interface

Next.js MVP screens:

* Login
* Register
* Dashboard (basic stats)
* Trades list
* Trade create/edit
* Trade detail page (with screenshot)

Components:

* Table for trades list
* Form components
* Toast notifications
* Basic navigation bar

---

## 5. Out of Scope (NOT in MVP)

| Feature                 | Status |
| ----------------------- | ------ |
| Multi-tenancy           | ❌ Out  |
| Team roles & RBAC       | ❌ Out  |
| Billing & Razorpay      | ❌ Out  |
| Background workers      | ❌ Out  |
| CSV import/export       | ❌ Out  |
| Analytical breakdowns   | ❌ Out  |
| Strategy/Tag management | ❌ Out  |
| Equity curve            | ❌ Out  |
| OAuth                   | ❌ Out  |
| Notifications           | ❌ Out  |
| Admin panel             | ❌ Out  |

---

## 6. Functional Requirements

### 6.1 Authentication

* User can register
* User can login
* Access + refresh token provided
* Access token expires every 15 minutes
* Refresh token rotates

### 6.2 Trade Management

* User can create/update/delete trades
* A trade belongs only to the user
* User can see only their own trades
* PnL automatically calculated
* Trades list supports filtering

### 6.3 Basic Analytics

Backend must compute:

* total PnL
* win rate
* average win
* average loss
* best trade
* worst trade

### Performance Requirement

* Analytics must return in <150ms

### 6.4 Uploads

* User uploads to S3 via presigned URL
* Max file size 5MB
* Only images allowed
* Screenshot linked to a trade

### 6.5 Non-Functional Requirements

* API P95 latency < 150ms
* Dashboard load < 2s
* Availability target 99%
* Passwords hashed with Argon2
* JWT tokens signed with HS256/RS256
* HTTPS enforced

---

## 7. MVP Success Metrics

| KPI                     | Target                    |
| ----------------------- | ------------------------- |
| User onboarding success | ≥ 90%                     |
| Time to log first trade | < 2 minutes               |
| Critical app crashes    | 0                         |
| Dashboard load time     | < 2 seconds               |
| User satisfaction       | Positive from 3–5 testers |

---

## 8. MVP Summary

The MVP focuses on a **single core job**:

> Help traders record trades and review performance simply and quickly.

Everything else — billing, teams, reports, advanced analytics — is postponed until **v2**.

---

**MVP Document #1 Complete**
