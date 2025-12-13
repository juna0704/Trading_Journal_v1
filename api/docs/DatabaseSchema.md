# Trading Journal – MVP Database Schema Document (Professional Edition)

**Author:** Junaid Ali Khan  
**Version:** 1.0 (MVP)  
**Status:** Complete  
**Last Updated:** December 8, 2025  
**Database:** PostgreSQL 15+

---

## 1. Executive Summary

This document provides a complete and business-oriented description of the database schema for the Trading Journal MVP, designed to support both personal use and future evolution into a SaaS platform.

It explains why each entity exists, how it interacts with others, and what business rules govern its data.

Unlike technical schema or SQL code, this document is intended for:

- Product Designers
- Backend Engineers
- System Architects
- QA Testers
- Documentation teams

It focuses on meaning, relationships, and data flow—not implementation.

---

## 2. Database Philosophy

The Trading Journal database follows these core principles:

### 2.1 Multi-Tenancy by Default

Every record belongs to a workspace (tenant). This ensures:

- **Data isolation** - Complete separation between different trading groups
- **SaaS readiness** - Built-in architecture for future monetization
- **Team permission management** - Workspace-level access controls

### 2.2 Business-Aligned Design

Tables reflect real-world objects that traders understand:

- **Trades** - Actual trading transactions
- **Tags** - Categorization system for analysis
- **Users** - People accessing the system
- **File uploads** - Supporting documentation

### 2.3 Auditability & Accuracy

Trade data must always be:

- **Accurate** - Precise financial calculations
- **Traceable** - Clear ownership and modification history
- **Compliant** - Ready for tax and regulatory requirements
- **Based on validated formulas** - Consistent PnL calculations

### 2.4 MVP Minimalism

Only features required for MVP are included:

- ✅ **Authentication** - User management and security
- ✅ **Trade logging** - Core journal functionality
- ✅ **Tagging** - Organization and categorization
- ✅ **File uploads** - Evidence and documentation

### 2.5 Expandability

Schema is intentionally prepared for future growth:

- **Billing** - Subscription management tables
- **Analytics** - Performance calculation tables
- **Reporting** - Custom report configurations
- **API integrations** - Third-party service connections

---

## 3. Core Entities Overview

The MVP uses six essential entities:

| Entity         | Description                                      |
| -------------- | ------------------------------------------------ |
| **Tenants**    | Workspaces containing all journal data           |
| **Users**      | People who access the workspace                  |
| **Trades**     | The core business record (financial transaction) |
| **Tags**       | Categorization system for trades                 |
| **Trade_Tags** | Many-to-many mapping between trades and tags     |
| **Uploads**    | Files attached to trades                         |

Below are detailed descriptions of each.

---

## 4. Tenants (Workspaces)

### 4.1 Purpose

A **tenant** represents a workspace, similar to:

- A personal trading journal
- A hedge fund's record-keeping system
- A trading group's shared workspace
- A small organization's financial tracking

It is the root container for all data in the system.

### 4.2 What Tenants Store

| Field      | Meaning                                        | Business Significance              |
| ---------- | ---------------------------------------------- | ---------------------------------- |
| **id**     | Unique identifier for the workspace            | Used in all foreign key references |
| **name**   | Display label for the workspace                | Shown in UI, emails, and reports   |
| **slug**   | URL-friendly identifier (e.g., junaid-trading) | Used in URLs and API endpoints     |
| **plan**   | Current subscription plan (free/pro)           | Determines feature availability    |
| **status** | Whether workspace is active                    | Controls access and billing        |

### 4.3 Business Rules

1. **Users cannot exist without a tenant** - Every user account must be associated with a workspace
2. **Trades cannot exist without a tenant** - All trading activity is scoped to a workspace
3. **Tenant deletion cascades to all data** - In MVP, deleting a workspace removes all associated data (configurable)
4. **Tenant slug must be globally unique** - Ensures clean URLs and API endpoints

### 4.4 Example Scenario

**Junaid's Trading Journal:**

- Creates workspace: "Junaid Trading Journal"
- Gets slug: `junaid-trading`
- Starts with free plan
- Invites team members to workspace

---

## 5. Users & Authentication

### 5.1 Purpose

**Users** are individuals who access the trading journal. In the MVP:

- Each tenant can have multiple users
- Roles determine permissions within the workspace
- Authentication is email/password based

### 5.2 Field Definitions

| Field             | Purpose                 | Business Constraints                       |
| ----------------- | ----------------------- | ------------------------------------------ |
| **id**            | Unique user identity    | Auto-generated, never exposed publicly     |
| **tenant_id**     | User's workspace        | Must reference existing tenant             |
| **email**         | Login identifier        | Must be valid email, unique within tenant  |
| **password_hash** | Secure password storage | Argon2id hashed, never stored in plaintext |
| **name**          | Display name            | Used in UI and communications              |
| **role**          | Permission group        | owner/admin/member hierarchy               |

### 5.3 Role Definitions

| Role       | Permissions                                                 | Typical Use       |
| ---------- | ----------------------------------------------------------- | ----------------- |
| **Owner**  | Full workspace control, billing management, user management | Workspace creator |
| **Admin**  | View/modify all trades, manage tags, invite users           | Team leader       |
| **Member** | Create/edit own trades, view analytics                      | Regular trader    |

### 5.4 Business Rules

1. **Email uniqueness** - No two users in the same tenant can have the same email
2. **Password security** - Minimum 8 characters with complexity requirements
3. **Role hierarchy** - Owners can manage admins, admins can manage members
4. **Workspace isolation** - Users can only access data from their assigned tenant

### 5.5 Example User Journey

**Sarah joins Junaid's workspace:**

- Receives invitation to `junaid-trading` workspace
- Registers with email `sarah@example.com`
- Assigned `member` role
- Can now log trades in Junaid's workspace

---

## 6. Trades (Core Business Entity)

### 6.1 Purpose

A **Trade** is the core record of the application. It represents:

- The financial instrument traded
- Entry and exit data points
- Financial outcomes (profit/loss)
- Trader's notes and context
- Associated tags for categorization

It is the foundation of all analytics and reporting.

### 6.2 Field Descriptions & Business Meaning

| Field               | Description                              | Business Rules                              |
| ------------------- | ---------------------------------------- | ------------------------------------------- |
| **symbol**          | Trading instrument (e.g., AAPL, BTCUSDT) | Uppercase, validated format                 |
| **side**            | Trade direction (long or short)          | Must be explicitly declared                 |
| **entry_price**     | Price at which trade opened              | Must be positive, supports 4 decimal places |
| **exit_price**      | Price at which trade closed              | Optional for open trades                    |
| **quantity**        | Number of units traded                   | Must be positive                            |
| **fees**            | Transaction fees                         | Can be zero, supports 2 decimal places      |
| **entry_timestamp** | Date/time trade was opened               | Required, timezone-aware                    |
| **exit_timestamp**  | Date/time trade was closed               | Optional, must be ≥ entry if provided       |
| **notes**           | User's reasoning or observations         | Free-form text, max 5000 characters         |
| **strategy**        | Optional trade strategy                  | Categorical field for filtering             |

### 6.3 Derived Business Metrics

These are calculated fields (not stored directly in MVP but computed on-demand):

**Profit / Loss Calculation:**

- **Long trade:** `(exit_price - entry_price) × quantity - fees`
- **Short trade:** `(entry_price - exit_price) × quantity - fees`

**PnL Percentage:**

- `PnL ÷ (entry_price × quantity) × 100`

**Holding Period:**

- `exit_timestamp - entry_timestamp` (duration in hours/days)

### 6.4 Validations

1. **Financial validations:**
   - `entry_price > 0`
   - `quantity > 0`
   - `fees ≥ 0`

2. **Temporal validations:**
   - `exit_timestamp` must be ≥ `entry_timestamp`
   - Future-dated trades not allowed (configurable)

3. **Business logic:**
   - Symbol must be recognized trading instrument
   - Side must be explicitly long or short

### 6.5 Trade Lifecycle

```
1. Trade opened → Record created with entry details
2. Tags added → Categorization for analysis
3. Analysis updated → Notes and strategy refined
4. Files attached → Evidence and documentation
5. Trade closed → Exit price and timestamp added
```

### 6.6 Example Trade Scenario

**Apple Earnings Play:**

- Symbol: `AAPL`
- Side: `long` (betting stock goes up)
- Entry: $175.00 on Dec 1, 9:30 AM
- Exit: $180.25 on Dec 1, 3:30 PM
- Quantity: 100 shares
- Fees: $2.00 commission
- Tags: `earnings`, `breakout`
- Notes: "Strong earnings beat, broke above resistance"

**Result:**

- PnL: $523.00 profit
- PnL%: 2.99% return
- Holding period: 6 hours

---

## 7. Tags (Classification System)

### 7.1 Purpose

**Tags** help group trades by common characteristics for:

- **Strategy analysis** - Which strategies are most profitable?
- **Setup identification** - What patterns work best?
- **Market event tracking** - How do earnings seasons perform?
- **Risk profile management** - Which trades are high-risk vs. low-risk?

### 7.2 Common Tag Examples

| Tag Name   | Typical Use                | Color  | Purpose                            |
| ---------- | -------------------------- | ------ | ---------------------------------- |
| `earnings` | Earnings season trades     | Blue   | Track earnings-related performance |
| `breakout` | Technical breakout trades  | Green  | Identify breakout success rate     |
| `momentum` | Momentum-based trades      | Orange | Analyze momentum strategies        |
| `swing`    | Swing trading positions    | Purple | Track multi-day holds              |
| `scalp`    | Scalping/short-term trades | Red    | Analyze quick turnaround trades    |

### 7.3 Field Definitions

| Field         | Description         | Business Rules                             |
| ------------- | ------------------- | ------------------------------------------ |
| **name**      | Label for the tag   | Unique within workspace, max 50 characters |
| **color**     | Display color       | Hex code format (e.g., #3B82F6)            |
| **tenant_id** | Workspace ownership | Tags are scoped to specific workspace      |

### 7.4 Business Rules

1. **Name uniqueness** - No duplicate tag names within a workspace
2. **Color format** - Must be valid hex color code
3. **Workspace scoping** - Tags can only reference trades in same workspace
4. **Cascade behavior** - Deleting a tag removes it from all associated trades

---

## 8. Trade_Tags (Join Table)

### 8.1 Purpose

The **Trade_Tags** table manages the many-to-many relationship between:

- A single trade can have multiple tags
- A single tag can be applied to multiple trades

This enables flexible categorization without data duplication.

### 8.2 Business Rules

1. **Referential integrity** - Both trade and tag must exist and belong to same tenant
2. **Cascade on delete**:
   - Removing a trade removes its tag assignments
   - Removing a tag removes it from all trades
3. **Uniqueness** - Same tag cannot be applied twice to same trade

### 8.3 Example Usage

**Trade Analysis Workflow:**

1. Trader creates AAPL trade
2. Applies tags: `earnings`, `breakout`, `momentum`
3. System creates three records in Trade_Tags table
4. Later, filtering by `earnings` tag shows all earnings-related trades

---

## 9. Uploads (File Attachments)

### 9.1 Purpose

**Uploads** allow attaching supporting documentation to trades:

- Chart screenshots (technical analysis)
- Trade confirmation slips (broker statements)
- News articles (catalyst documentation)
- Analysis diagrams (trade planning)

### 9.2 Field Definitions

| Field                 | Meaning            | Business Constraints                     |
| --------------------- | ------------------ | ---------------------------------------- |
| **storage_key**       | Cloud storage path | Unique identifier in storage system      |
| **mime_type**         | File type          | Only allowed types: JPEG, PNG, WEBP, PDF |
| **file_size_bytes**   | File size          | Maximum 5MB per file                     |
| **trade_id**          | Associated trade   | Optional (files can be attached later)   |
| **user_id**           | Uploader           | Tracks who uploaded the file             |
| **original_filename** | Original file name | Preserved for user reference             |

### 9.3 Business Rules

1. **File type restrictions** - Only approved image and document types
2. **Size limitations** - 5MB maximum to prevent storage abuse
3. **Ownership** - Files inherit tenant isolation from uploader
4. **Optional trade association** - Files can be uploaded before trade creation

### 9.4 Example Upload Scenario

**Documenting a Trade:**

1. Trader takes screenshot of AAPL chart showing breakout
2. System generates secure upload URL
3. Trader uploads `aapl-breakout-chart.png`
4. File stored with key: `uploads/tenant_123/trades/trade_456/chart.png`
5. Metadata saved in Uploads table linking to trade

---

## 10. Essential Relationships

### 10.1 Tenant → Users (One-to-Many)

```
One Tenant → Many Users
```

- **Business meaning:** A workspace can have multiple members
- **Data impact:** User records contain `tenant_id` foreign key
- **Deletion behavior:** Deleting tenant removes all users (cascade)

### 10.2 Tenant → Trades (One-to-Many)

```
One Tenant → Many Trades
```

- **Business meaning:** All trading activity is scoped to workspace
- **Data impact:** Every trade includes `tenant_id`
- **Security implication:** Prevents cross-workspace data leakage

### 10.3 User → Trades (One-to-Many)

```
One User → Many Trades
```

- **Business meaning:** Traders create multiple trade records
- **Data impact:** Trades include `user_id` to track creator
- **Permission implication:** Users can only edit their own trades (configurable by role)

### 10.4 Trade ↔ Tags (Many-to-Many via Trade_Tags)

```
Many Trades ↔ Many Tags
```

- **Business meaning:** Flexible categorization system
- **Implementation:** Join table with composite primary key
- **Query pattern:** Filter trades by tag, or get all tags for a trade

### 10.5 Trade → Uploads (One-to-Many)

```
One Trade → Many Uploads
```

- **Business meaning:** Multiple files can document a single trade
- **Data impact:** Uploads reference `trade_id` (optional)
- **Storage consideration:** Files organized by trade for cleanup

---

## 11. Data Flow Narratives

### 11.1 Creating a Trade

**User Workflow:**

1. User selects "New Trade" in UI
2. Enters trade details (symbol, side, prices, quantities)
3. System validates financial data and timestamps
4. Trade saved to database under user's tenant
5. User adds tags from available list
6. System creates Trade_Tags relationships
7. User optionally uploads supporting files
8. System stores file metadata in Uploads table

**Data Impact:**

- New record in `trades` table
- Possible new records in `trade_tags` table
- Possible new records in `uploads` table

### 11.2 Adding Tags to a Trade

**User Workflow:**

1. User views existing trade
2. Selects "Add Tags" from tag picker
3. System validates tag belongs to same tenant
4. Creates entry in `trade_tags` join table
5. UI updates to show newly applied tags

**Data Impact:**

- New record in `trade_tags` table
- No changes to `trades` or `tags` tables

### 11.3 Uploading Files

**User Workflow:**

1. User requests file upload capability
2. System generates secure, time-limited upload URL
3. User uploads file directly to cloud storage
4. System verifies file type and size
5. Metadata saved in `uploads` table
6. File linked to specific trade (optional)

**Data Impact:**

- New record in `uploads` table
- File stored in cloud storage with tenant-specific path

---

## 12. Business Events & Their Data Impact

| Event                     | Tables Affected                   | Business Impact                       |
| ------------------------- | --------------------------------- | ------------------------------------- |
| **Create trade**          | `trades`                          | New trading record created            |
| **Update trade**          | `trades`                          | Metrics recalculated, history tracked |
| **Delete trade**          | `trades`, `trade_tags`, `uploads` | Complete removal with cascade         |
| **Create tag**            | `tags`                            | New categorization option available   |
| **Apply tag to trade**    | `trade_tags`                      | Trade categorized for analysis        |
| **Remove tag from trade** | `trade_tags`                      | Categorization removed                |
| **Upload file**           | `uploads`                         | Supporting documentation stored       |
| **Delete file**           | `uploads`                         | Documentation removed from trade      |
| **Invite user**           | `users`                           | Workspace membership expanded         |
| **Remove user**           | `users`                           | Workspace access revoked              |

---

## 13. CRUD Responsibilities

### Tenants

- **Create:** During user signup (first tenant) or workspace creation
- **Read:** Frequently accessed for permission checks
- **Update:** Rarely modified (name changes, plan upgrades)
- **Delete:** Soft delete recommended for data preservation

### Users

- **Create:** Via signup or workspace invitation
- **Read:** Constant authentication and permission checks
- **Update:** Profile changes, role modifications
- **Delete:** Soft delete with data preservation option

### Trades

- **Create:** Primary user activity, multiple times daily
- **Read:** Most frequent operation (listing, filtering, analytics)
- **Update:** Trade edits, adding exit details
- **Delete:** Should be rare, with audit trail

### Tags

- **Create:** Workspace setup and expansion
- **Read:** Constant use in filtering and UI display
- **Update:** Color changes, name corrections
- **Delete:** Removes categorization from all trades

### Uploads

- **Create:** With trade creation or documentation addition
- **Read:** When viewing trade details
- **Update:** Rarely (metadata corrections)
- **Delete:** When cleaning up or removing evidence

---

## 14. Data Integrity Rules

### 14.1 Tenant Isolation (Most Critical)

**Rule:** All data queries must include tenant filter
**Implementation:** Application-level checks + database constraints
**Business reason:** Prevent data leakage between workspaces

### 14.2 Financial Validations

**Rule:** Prices > 0, quantities > 0, fees ≥ 0
**Implementation:** Database constraints + application validation
**Business reason:** Ensure mathematically valid trades

### 14.3 Temporal Rules

**Rule:** `exit_timestamp` ≥ `entry_timestamp`
**Implementation:** Database check constraint
**Business reason:** Prevent time-travel trades

### 14.4 Relational Consistency

**Rule:** Foreign keys must reference valid records
**Implementation:** Database foreign key constraints
**Business reason:** Maintain referential integrity

### 14.5 Business Logic Constraints

**Rule:** User roles determine data access
**Implementation:** Application-level permission checks
**Business reason:** Enforce organizational hierarchy

---

## 15. Indexing Strategy (Business-Level)

| Table          | Index Type      | Business Reason                        |
| -------------- | --------------- | -------------------------------------- |
| **Trades**     | Tenant + Date   | Fast loading of recent trades list     |
| **Trades**     | Tenant + Symbol | Efficient symbol-based filtering       |
| **Trades**     | Tenant + User   | Quick access to user's trade history   |
| **Tags**       | Tenant + Name   | Fast tag lookup during trade creation  |
| **Trade_Tags** | Tag ID          | Efficient "find trades by tag" queries |
| **Trade_Tags** | Trade ID        | Quick "get tags for trade" operations  |
| **Uploads**    | Trade ID        | Fast retrieval of trade attachments    |

**Indexing Philosophy:**

1. **Tenant-first** - All indexes start with tenant_id for isolation
2. **Cover common queries** - Optimize for dashboard and reporting
3. **Balance performance** - Don't over-index for write-heavy tables

---

## 16. Feature → Database Mapping

| Feature                  | Tables Used            | Data Flow                            |
| ------------------------ | ---------------------- | ------------------------------------ |
| **Log trades**           | `trades`               | User input → trade record            |
| **Add notes**            | `trades`               | Update notes field                   |
| **Tag trades**           | `tags`, `trade_tags`   | Select tag → create relationship     |
| **Upload images**        | `uploads`              | File → cloud storage → metadata      |
| **Authentication**       | `users`                | Credentials → session                |
| **Workspace management** | `tenants`              | Create/update workspace settings     |
| **Trade filtering**      | `trades`, `trade_tags` | Filter criteria → query optimization |
| **User management**      | `users`                | Invite → role assignment             |

---

## 17. Non-Functional Requirements

### Performance

- **Trades list:** Load within 200ms for 10,000 records
- **Tag filtering:** Responsive filtering with 100+ tags
- **File upload:** Complete within 5 seconds for 5MB files
- **Trade creation:** Process within 100ms

### Security

- **Tenant isolation:** Zero data leakage between workspaces
- **Password security:** Argon2id hashing with salt
- **File uploads:** Signed URLs with expiration
- **API security:** JWT tokens with short expiry

### Scalability

- **MVP target:** 50,000 trades per tenant
- **User capacity:** Up to 100 users per workspace
- **Storage:** 5GB per tenant (file uploads)
- **Concurrency:** Support 100 concurrent users

### Reliability

- **Data integrity:** Automatic backups daily
- **Validation:** Strict input validation at all layers
- **Error handling:** Graceful degradation for failed operations
- **Monitoring:** Health checks and performance metrics

---

## 18. Data Privacy & Ownership

### Ownership Model

- **Tenant owns all data** - Workspace controls user-generated content
- **Users license data to tenant** - Through terms of service
- **Export rights** - Users can export their data at any time

### Privacy Rules

1. **Cross-tenant visibility** - Users cannot see other tenants' data
2. **Within-tenant visibility** - Role-based access controls
3. **Data export** - Complete export in standard formats (CSV, JSON)
4. **Data deletion** - Right to erasure with configurable retention

### GDPR Considerations

- **Data minimization** - Only collect necessary fields
- **Purpose limitation** - Clear business purpose for each field
- **Storage limitation** - Configurable retention policies
- **Integrity & confidentiality** - Encryption and access controls

---

## 19. Glossary

| Term          | Meaning                                         |
| ------------- | ----------------------------------------------- |
| **Tenant**    | Workspace or organization container             |
| **Trade**     | Record of a financial transaction               |
| **Tag**       | Categorization label for organizing trades      |
| **Upload**    | File attachment providing trade evidence        |
| **PnL**       | Profit or loss from a trade                     |
| **Strategy**  | User-defined trade rationale or approach        |
| **Symbol**    | Trading instrument identifier (AAPL, BTC, etc.) |
| **Side**      | Trade direction (long = buy, short = sell)      |
| **Workspace** | Synonym for tenant                              |
| **Role**      | Permission level within workspace               |

---

## 20. Future Expansion Roadmap

### Phase 2: Analytics & Reporting (3-6 months)

- **Analytics tables** - Pre-calculated metrics for performance
- **Time-series metrics** - Daily/weekly/monthly aggregates
- **Equity curve** - Portfolio value over time
- **Performance breakdowns** - By symbol, tag, strategy
- **Report templates** - Customizable report generation

### Phase 3: Billing & Subscriptions (6-12 months)

- **Billing tables** - Subscription management
- **Invoices** - Payment records and receipts
- **Usage tracking** - Resource consumption monitoring
- **Plan limits** - Feature restrictions per plan tier
- **Payment methods** - Credit card and invoice management

### Phase 4: Advanced Features (12-18 months)

- **Audit logs** - Complete activity tracking for compliance
- **Role-based authorization** - Fine-grained permission system
- **Integrations** - Broker API connections for automatic import
- **Mobile sync** - Offline capability with conflict resolution
- **Advanced analytics** - Machine learning insights

### Phase 5: Enterprise Features (18-24 months)

- **Multi-workspace organizations** - Corporate hierarchy support
- **Data governance** - Compliance and regulatory features
- **Advanced reporting** - Custom SQL queries, scheduled reports
- **API marketplace** - Third-party integrations
- **White-labeling** - Custom branding for clients

---

## Implementation Checklist

### Pre-Development

- [ ] Review schema with development team
- [ ] Validate business requirements against schema
- [ ] Plan database migration strategy
- [ ] Set up development database environment

### Development Phase 1 (MVP Core)

- [ ] Implement tenants and users tables
- [ ] Build authentication system
- [ ] Create trades table with validation
- [ ] Implement tags and trade_tags system
- [ ] Build file upload functionality

### Development Phase 2 (Business Logic)

- [ ] Implement PnL calculation engine
- [ ] Build trade filtering and search
- [ ] Create tag management interface
- [ ] Implement file attachment workflows
- [ ] Build user permission system

### Testing & Validation

- [ ] Test tenant isolation thoroughly
- [ ] Validate financial calculations
- [ ] Stress test with large datasets
- [ ] Security audit of data access patterns
- [ ] Performance testing of common queries

### Production Readiness

- [ ] Database backup strategy
- [ ] Monitoring and alerting setup
- [ ] Disaster recovery plan
- [ ] Data migration procedures
- [ ] Rollback strategy for schema changes

---

**Document Complete – MVP Database Schema (Professional Edition)**  
_This document provides the business context and data architecture for the Trading Journal MVP. For technical implementation details, refer to the Database Schema Technical Specification._
