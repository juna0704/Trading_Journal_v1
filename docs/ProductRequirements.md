# Trading Journal SaaS - Product Requirements Document

## Executive Summary

The Trading Journal SaaS application is a comprehensive platform designed to help individual traders and trading teams systematically track, analyze, and improve their trading performance. Starting as a personal tool, it will evolve into a multi-tenant SaaS platform with subscription-based billing. The application will transform unstructured trading data into actionable insights through automated analytics, visualization, and collaboration features, enabling traders to identify profitable patterns, maintain discipline, and optimize their strategies.

## Product Purpose

### Problem Statement
Traders face significant challenges in performance tracking:
- **Disorganized Records**: Most traders use spreadsheets or handwritten notes that are difficult to maintain and analyze
- **No Systematic Analysis**: Lack of tools to identify patterns in winning/losing trades across different strategies
- **Psychological Blindspots**: No structured way to track emotions, discipline issues, and trading psychology
- **Team Collaboration Gap**: Trading teams struggle with centralized performance tracking and coaching
- **Data Fragmentation**: Trade data scattered across broker platforms, notes, and screenshots
- **Manual Calculations**: Time-consuming manual P&L calculations and performance metrics

### Solution
A unified trading journal platform offering:
1. **Streamlined Trade Logging**: Quick entry with templates and bulk import
2. **Automated Analytics**: Real-time performance metrics and visualizations
3. **Evidence-Based Review**: Screenshots, charts, and detailed notes attached to trades
4. **Team Collaboration**: Multi-user workspaces with role-based permissions
5. **Actionable Insights**: Pattern identification and performance breakdowns
6. **Data Portability**: Easy export for tax reporting and external analysis

## Goals and Success Criteria

### Business Goals
1. **User Acquisition**: 10,000 registered users within 12 months of SaaS launch
2. **Revenue Generation**: ₹2,000,000 MRR within 18 months
3. **Market Penetration**: 5% market share in Indian retail trader segment by Year 2
4. **Customer Retention**: 85% annual retention rate for paid subscribers

### Product Goals
1. **Usability**: Complete trade entry in under 60 seconds (measured via user testing)
2. **Adoption**: 70% of registered users log at least 10 trades in first month
3. **Engagement**: 40% weekly active user rate for paid subscribers
4. **Satisfaction**: NPS score of 50+ within 6 months of launch

### Technical Goals
1. **Performance**: <2 second page load time, <300ms API response (p95)
2. **Reliability**: 99.9% uptime for core features
3. **Scalability**: Support 10,000 concurrent users, 1M+ trades
4. **Security**: Zero critical security vulnerabilities, SOC 2 compliance by Year 2

## Personas

### 1. Retail Trader (Primary Persona)
**Name**: Rajesh Kumar  
**Age**: 32  
**Occupation**: Software Engineer / Part-time Trader  
**Experience**: 3 years trading equity and F&O  
**Goals**: 
- Track 50-100 trades per month across multiple strategies
- Identify which technical indicators work best for his style
- Improve win rate from 55% to 65%
- Prepare accurate records for tax season
**Pain Points**:
- Manual Excel maintenance takes 2+ hours weekly
- Cannot correlate emotional state with trade outcomes
- No easy way to share performance with mentor
- Loses track of trade rationale after a few days

### 2. Prop Firm Manager (Secondary Persona)
**Name**: Priya Singh  
**Age**: 38  
**Occupation**: Proprietary Trading Firm Partner  
**Team Size**: 15 traders  
**Goals**:
- Monitor and coach team performance in real-time
- Identify risk management issues before they become losses
- Generate performance reports for investors
- Scale the firm by systematizing successful strategies
**Pain Points**:
- No centralized platform for team trade tracking
- Manual aggregation of P&L across traders
- Difficulty enforcing journaling discipline
- Expensive enterprise tools with poor UX

### 3. Trading Mentor (Tertiary Persona)
**Name**: Arjun Mehta  
**Age**: 45  
**Occupation**: Full-time Trading Mentor  
**Students**: 50+ active, 500+ alumni  
**Goals**:
- Review student trades efficiently
- Identify common mistakes across students
- Provide data-driven feedback
- Demonstrate successful patterns with real examples
**Pain Points**:
- Receives trades via WhatsApp/Screenshots - impossible to analyze
- Cannot track student progress systematically
- Time-consuming manual review process
- No way to benchmark students against each other

## User Stories

### Authentication & Authorization
```
US-01: Self-Hosted Authentication
As a new user
I want to register with email and password
So that I can create a secure account without third-party dependencies

Acceptance Criteria:
- Password requirements: min 8 chars, 1 uppercase, 1 number, 1 special char
- Email verification before account activation
- JWT access token (15 min expiry) + HTTP-only refresh token (7 days)
- Rate limiting: 5 failed attempts per hour
```

```
US-02: OAuth Login Option
As a user
I want to log in with my Google account
So that I can avoid remembering another password

Acceptance Criteria:
- Google OAuth 2.0 integration
- Option to link/disconnect Google account
- Fallback to email/password if OAuth fails
- Sync basic profile info (name, avatar)
```

```
US-03: Multi-Tenant Workspace Creation
As a first-time user
I want my account to automatically create a personal workspace
So that I can start journaling immediately

Acceptance Criteria:
- Workspace created with user as Owner role
- Default settings applied (currency, timezone, date format)
- Sample data/tutorial available for new users
```

```
US-04: RBAC Management
As a workspace Owner
I want to assign roles (Admin, Member, Viewer) to team members
So that I can control access to sensitive trading data

Acceptance Criteria:
- Four roles: Owner (full access), Admin (manage users), Member (create/edit), Viewer (read-only)
- Role permissions clearly documented
- Audit log of role changes
- Cannot remove last Owner from workspace
```

### Trade Management
```
US-05: Quick Trade Entry
As a trader
I want to quickly log a trade with minimal required fields
So that I can journal during live trading sessions

Acceptance Criteria:
- Quick form: Symbol, Side, Entry/Exit price, Quantity, Fees (auto-calc)
- Advanced fields toggle for notes, tags, screenshots
- Auto-save draft every 30 seconds
- Keyboard shortcuts for common actions
```

```
US-06: Bulk Import
As a user migrating from another platform
I want to import historical trades via CSV
So that I don't lose my trading history

Acceptance Criteria:
- Support CSV with customizable column mapping
- Validate data format and completeness
- Show import preview with error highlights
- Background processing for >100 trades
- Email notification upon completion
```

```
US-07: Trade Attachments
As a detail-oriented trader
I want to attach charts and screenshots to trades
So that I can review my technical analysis later

Acceptance Criteria:
- Upload JPG/PNG/WebP (max 5MB each)
- Up to 5 attachments per trade
- Image optimization on upload
- Secure S3 storage with presigned URLs
- Thumbnail generation for quick preview
```

### Analytics & Insights
```
US-08: Real-Time Dashboard
As a performance-focused trader
I want to see my key metrics at a glance
So that I can assess my current performance

Acceptance Criteria:
- Display: Net P&L, Win Rate, Profit Factor, Avg Win/Loss Ratio
- Date range selector (Today, Week, Month, Quarter, Year, Custom)
- Comparison vs previous period
- Animated loading states for data freshness
```

```
US-09: Equity Curve Analysis
As a risk-conscious trader
I want to visualize my account growth over time
So that I can identify drawdown periods and recovery

Acceptance Criteria:
- Interactive line chart with zoom/pan
- Highlight max drawdown periods
- Overlay with benchmark indices (optional)
- Export chart as PNG/PDF
- Tooltip with daily/weekly breakdown
```

```
US-10: Performance Filtering
As a strategy developer
I want to filter trades by multiple criteria
So that I can analyze specific market conditions

Acceptance Criteria:
- Filter by: Symbol, Tags, Strategy, Time, Market Cap, Sector
- Save filter combinations as "Views"
- Share filter views with team members
- Real-time result count update
```

### Team Features
```
US-11: Team Performance Dashboard
As a trading team manager
I want to see aggregated team performance
So that I can identify top performers and coaching opportunities

Acceptance Criteria:
- Leaderboard with key metrics per trader
- Anonymous mode for sensitive comparisons
- Drill-down to individual trader views
- Export team reports for stakeholders
```

```
US-12: Trade Review Workflow
As a trading mentor
I want to review and comment on student trades
So that I can provide actionable feedback

Acceptance Criteria:
- @mentions in trade notes
- Comment threads per trade
- Notification system for reviews
- Mark trades as "Reviewed" or "Needs Work"
```

## Functional Requirements

### 1. Authentication System
**FR-AUTH-001**: Self-built authentication using email/password with JWT
- Password hashing using bcrypt or Argon2
- JWT access tokens (15 min expiry) + refresh tokens (7 days)
- Token rotation on refresh
- Blacklist revoked tokens

**FR-AUTH-002**: Google OAuth integration
- Optional login path alongside email/password
- Account linking/unlinking capability
- Profile synchronization

**FR-AUTH-003**: Multi-tenant isolation
- Database row-level security or schema-based isolation
- Tenant context in all requests
- Cross-tenant data leakage prevention

**FR-AUTH-004**: RBAC implementation
- Four roles: Owner, Admin, Member, Viewer
- Permission matrix for all operations
- Role assignment/invitation flow

### 2. Trade Management Core
**FR-TRADE-001**: Trade CRUD operations
- Create, Read, Update, Delete with proper authorization
- Soft delete with 30-day recovery window
- Version history for edits (future phase)

**FR-TRADE-002**: Trade schema
```typescript
{
  id: string,
  tenantId: string,
  userId: string,
  symbol: string,
  exchange: string,
  side: 'BUY' | 'SELL' | 'SHORT',
  entryPrice: decimal,
  exitPrice: decimal,
  quantity: integer,
  entryTime: timestamp,
  exitTime: timestamp,
  fees: decimal,
  notes: text,
  tags: string[],
  attachments: string[],
  pnl: decimal,
  pnlPercent: decimal,
  status: 'OPEN' | 'CLOSED' | 'PARTIAL'
}
```

**FR-TRADE-003**: Automated calculations
- Real-time P&L (absolute and percentage)
- Commission and tax calculations
- Position sizing metrics
- Risk-adjusted returns

### 3. Analytics Engine
**FR-ANALYTICS-001**: Performance metrics
- Win rate, profit factor, expectancy
- Sharpe ratio, Sortino ratio
- Maximum drawdown, recovery factor
- Average holding period

**FR-ANALYTICS-002**: Visualization
- Equity curve with drawdown overlay
- Performance heatmaps (time of day, day of week)
- Win/loss distribution histogram
- Correlation matrices (future)

**FR-ANALYTICS-003**: Reporting
- Daily/weekly/monthly performance reports
- Custom report builder
- PDF/Excel export
- Scheduled email reports

### 4. Collaboration Features
**FR-COLLAB-001**: Team management
- Invite users via email
- Role assignment workflow
- Usage limits per plan
- Team settings configuration

**FR-COLLAB-002**: Shared views
- Public/private trade views
- Commenting and annotation
- @mentions and notifications
- Approval workflows (future)

### 5. Data Management
**FR-DATA-001**: Import/Export
- CSV import with validation
- Excel export with formatting
- JSON for API integration
- GDPR data export package

**FR-DATA-002**: Backup & Recovery
- Daily automated backups
- Point-in-time recovery
- User-initiated data export
- Account deletion with 30-day grace

## Non-Functional Requirements

### Performance Requirements
1. **Response Time**: 
   - API endpoints: <300ms p95
   - Dashboard load: <2 seconds
   - Trade list filtering: <1 second for 10,000 trades
   - Chart rendering: <3 seconds for 1-year data

2. **Throughput**:
   - Support 100 concurrent trade entries per minute
   - Handle 1,000 simultaneous dashboard users
   - Process 10,000 trade imports within 10 minutes

3. **Scalability**:
   - Horizontal scaling for API servers
   - Read replicas for analytics queries
   - CDN for static assets and uploads
   - Redis caching for frequently accessed data

### Security Requirements
1. **Authentication Security**:
   - JWT tokens signed with RS256
   - Refresh tokens stored as HTTP-only cookies
   - Session management with token blacklisting
   - Rate limiting on authentication endpoints

2. **Data Security**:
   - Encryption at rest for sensitive data
   - TLS 1.3 for all communications
   - Tenant data isolation via PostgreSQL RLS
   - Regular security audits and penetration testing

3. **Application Security**:
   - Input validation using Zod schemas
   - SQL injection prevention via parameterized queries
   - XSS protection via CSP headers
   - CSRF protection for state-changing operations

### Reliability Requirements
1. **Availability**: 99.9% uptime for core features
2. **Durability**: Zero data loss, point-in-time recovery
3. **Fault Tolerance**: Graceful degradation during partial failures
4. **Disaster Recovery**: RTO <4 hours, RPO <15 minutes

### Usability Requirements
1. **Accessibility**: WCAG 2.1 AA compliance
2. **Mobile Responsive**: Optimized for tablet and mobile
3. **Internationalization**: Support for multiple currencies and date formats
4. **Error Handling**: Clear, actionable error messages

### Maintainability Requirements
1. **Code Quality**: TypeScript strict mode, ESLint, Prettier
2. **Testing**: 80% unit test coverage, E2E for critical paths
3. **Documentation**: OpenAPI spec, architecture docs, deployment guides
4. **Monitoring**: Comprehensive logging, metrics, and alerts

## MVP Scope

### Phase 1: Core Platform (Weeks 1-8)
**Authentication & Multi-tenancy**
- [ ] Email/password registration with JWT
- [ ] Google OAuth optional login
- [ ] Multi-tenant database structure
- [ ] Basic RBAC (Owner/Viewer)

**Trade Management**
- [ ] Basic trade CRUD operations
- [ ] Trade schema with essential fields
- [ ] P&L auto-calculation
- [ ] Simple tag system

**Basic Analytics**
- [ ] Dashboard with key metrics
- [ ] Trade list with filtering
- [ ] CSV import/export

### Phase 2: Enhanced Features (Weeks 9-16)
**Advanced Trade Features**
- [ ] Bulk trade import
- [ ] Image attachments
- [ ] Rich text notes
- [ ] Trade templates

**Analytics Expansion**
- [ ] Equity curve visualization
- [ ] Performance breakdowns
- [ ] Advanced statistics
- [ ] Custom date ranges

**Team Collaboration**
- [ ] User invitations
- [ ] Full RBAC implementation
- [ ] Shared trade views
- [ ] Basic commenting

### Phase 3: SaaS Polish (Weeks 17-24)
**Billing & Subscriptions**
- [ ] Razorpay integration
- [ ] Tiered pricing plans
- [ ] Usage metering
- [ ] Invoice management

**Product Polish**
- [ ] Dark/light mode
- [ ] Keyboard shortcuts
- [ ] Mobile optimization
- [ ] Performance optimizations

**Launch Preparation**
- [ ] Documentation
- [ ] Onboarding flows
- [ ] Analytics integration
- [ ] Marketing site

## Future Roadmap

### Quarter 2-3: Advanced Features
1. **Broker Integrations**
   - Zerodha Kite API integration
   - Upstox WebSocket streaming
   - Automated trade sync
   - Portfolio tracking

2. **Advanced Analytics**
   - Machine learning pattern detection
   - Strategy backtesting engine
   - Correlation analysis
   - Risk modeling

3. **Mobile Experience**
   - React Native mobile app
   - Push notifications
   - Offline capabilities
   - Mobile-optimized workflows

### Quarter 4: Enterprise Features
1. **API Platform**
   - Public REST API
   - Webhook system
   - API key management
   - Rate limiting

2. **Enterprise Security**
   - SAML/SSO integration
   - Audit logging
   - Compliance reporting
   - Data residency options

3. **White-label Solution**
   - Custom branding
   - Custom domains
   - Whitelabel mobile apps
   - Dedicated support

### Year 2: Market Expansion
1. **Global Features**
   - Multi-currency support
   - International broker integrations
   - Tax reporting for multiple regions
   - Localization

2. **Community Features**
   - Anonymous performance sharing
   - Strategy marketplace
   - Mentor matching
   - Educational content

## Success Metrics

### Acquisition Metrics
- Monthly Signups: Target 2,000/month by Month 6
- Conversion Rate: 25% free-to-paid by Month 12
- CAC: <₹1,500 per paying customer

### Engagement Metrics
- DAU/MAU Ratio: >40%
- Average Session Duration: >8 minutes
- Trades Logged Per User: >15/month
- Feature Adoption: >60% use advanced analytics

### Retention Metrics
- Monthly Churn: <3% for paid users
- Annual Retention: >85%
- Net Revenue Retention: >110%

### Business Metrics
- MRR Growth: 20% month-over-month
- LTV:CAC Ratio: >3:1
- Gross Margin: >80%
- Customer Satisfaction: NPS >50

### Technical Metrics
- Uptime: >99.9%
- Error Rate: <0.1%
- P95 Response Time: <300ms
- Cost per User: <₹50/month

## Risks & Mitigation

### Technical Risks
1. **Database Performance with Large Datasets**
   - **Risk**: Analytics queries slow down with millions of trades
   - **Mitigation**: Implement materialized views, read replicas, query optimization
   - **Fallback**: Time-based aggregation, sampling for long time ranges

2. **File Storage Costs**
   - **Risk**: Unlimited image uploads could become expensive
   - **Mitigation**: Implement compression, lifecycle policies, plan-based limits
   - **Fallback**: Lower-resolution thumbnails, optional premium storage

3. **Real-time Data Synchronization**
   - **Risk**: Team features require real-time updates across users
   - **Mitigation**: Use WebSockets with Redis Pub/Sub, optimistic UI updates
   - **Fallback**: Polling fallback, eventual consistency model

### Business Risks
1. **Market Competition**
   - **Risk**: Established competitors with larger budgets
   - **Mitigation**: Focus on Indian market, better pricing, superior UX
   - **Differentiation**: Broker integrations, mobile experience, team features

2. **User Adoption**
   - **Risk**: Traders resistant to changing existing workflows
   - **Mitigation**: Easy data migration, generous free tier, educational content
   - **Incentives**: Beta discounts, referral program, success stories

3. **Regulatory Compliance**
   - **Risk**: Financial data handling regulations
   - **Mitigation**: Legal consultation, data encryption, clear ToS
   - **Compliance**: GDPR, local financial regulations, data residency

### Product Risks
1. **Feature Complexity**
   - **Risk**: Overwhelming interface for new traders
   - **Mitigation**: Progressive disclosure, guided onboarding, simple defaults
   - **Testing**: Extensive user testing with different trader personas

2. **Mobile Experience**
   - **Risk**: Complex analytics don't translate well to mobile
   - **Mitigation**: Mobile-first design, simplified mobile views, dedicated apps
   - **Approach**: Progressive web app with optional native apps

## Appendix

### A. Technical Architecture

**Frontend (Next.js)**
- Framework: Next.js 14 with App Router
- UI Library: React 18, Tailwind CSS, shadcn/ui
- Charts: Recharts or Chart.js
- State Management: React Query + Zustand
- Testing: Jest, React Testing Library, Cypress

**Backend (Express.js)**
- Framework: Express.js with TypeScript
- Database: PostgreSQL (Neon for serverless)
- ORM: DrizzleORM or Prisma
- Authentication: Custom JWT implementation
- File Storage: AWS S3 + CloudFront

**Infrastructure**
- Hosting: Vercel (Frontend), Render/Railway (Backend)
- Database: PostgreSQL with Neon
- Caching: Redis (Upstash)
- Monitoring: Sentry, LogRocket, Vercel Analytics
- CI/CD: GitHub Actions

### B. Database Schema Overview

```sql
-- Multi-tenant structure
tenants (
  id uuid primary key,
  name varchar(255),
  plan varchar(50),
  settings jsonb,
  created_at timestamp
);

-- RBAC implementation
tenant_users (
  id uuid primary key,
  tenant_id uuid references tenants(id),
  user_id uuid references users(id),
  role enum('OWNER', 'ADMIN', 'MEMBER', 'VIEWER'),
  joined_at timestamp
);

-- Trade data with tenant isolation
trades (
  id uuid primary key,
  tenant_id uuid references tenants(id),
  user_id uuid references users(id),
  symbol varchar(50),
  -- ... other trade fields
  created_at timestamp
) partition by hash(tenant_id);
```

### C. API Rate Limits

| Endpoint Type | Free Tier | Pro Tier | Enterprise |
|--------------|-----------|----------|------------|
| API Calls | 1,000/hour | 10,000/hour | 100,000/hour |
| Trade Entries | 100/day | 1,000/day | Unlimited |
| File Uploads | 50MB/month | 1GB/month | 10GB/month |
| Export Operations | 10/day | 100/day | Unlimited |

### D. Pricing Tiers

**Free Tier**
- 100 trades/month
- Basic analytics
- CSV import/export
- 1 workspace member

**Pro Tier (₹499/month)**
- 2,000 trades/month
- Advanced analytics
- Image attachments
- Team features (5 members)
- Automated reports

**Team Tier (₹1,999/month)**
- 10,000 trades/month
- All Pro features
- 20 team members
- API access
- Priority support

**Enterprise Tier (Custom)**
- Unlimited trades
- Custom features
- SSO/SAML
- Dedicated instance
- SLA guarantee

### E. Data Privacy & Security Measures

1. **Data Encryption**
   - AES-256 at rest for sensitive data
   - TLS 1.3 for data in transit
   - Key management via AWS KMS

2. **Access Controls**
   - Row-level security in PostgreSQL
   - API endpoint authorization
   - IP allowlisting for admin endpoints

3. **Compliance**
   - GDPR data processing agreement
   - Right to erasure implementation
   - Data portability features
   - Privacy by design architecture

### F. Deployment Checklist

**Pre-Launch**
- [ ] Load testing with 10,000 simulated users
- [ ] Security penetration testing
- [ ] Backup and recovery testing
- [ ] Monitoring and alerting setup
- [ ] Documentation complete
- [ ] Legal documents (ToS, Privacy Policy)

**Post-Launch**
- [ ] Daily health checks
- [ ] Weekly performance reviews
- [ ] Monthly security audits
- [ ] Quarterly user feedback sessions
- [ ] Bi-annual architecture review

---

**Document Version**: 3.0  
**Last Updated**: December 10, 2025  
