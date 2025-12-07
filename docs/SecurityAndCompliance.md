# Trading Journal - Security & Compliance Document

**Project:** Trading Journal (Personal → SaaS)  
**Author:** Junaid Ali Khan  
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** December 8, 2025  
**Classification:** Internal Use Only

---

## Executive Summary

This document outlines the security architecture, controls, and compliance measures for the Trading Journal application. It covers authentication, authorization, data protection, and regulatory compliance requirements.

---

## Table of Contents

1. [Security Architecture](#1-security-architecture)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Protection](#3-data-protection)
4. [API Security](#4-api-security)
5. [Infrastructure Security](#5-infrastructure-security)
6. [Compliance Requirements](#6-compliance-requirements)
7. [Incident Response](#7-incident-response)
8. [Security Testing](#8-security-testing)

---

## 1. Security Architecture

### 1.1 Defense in Depth Layers

The Trading Journal implements a multi-layered security approach:

```
┌─────────────────────────────────────────────────┐
│   Layer 1: Perimeter Security                   │
│   • Cloudflare WAF / AWS Shield                 │
│   • DDoS Protection                             │
│   • Rate Limiting                               │
├─────────────────────────────────────────────────┤
│   Layer 2: Network Security                     │
│   • VPC Isolation                               │
│   • Security Groups / Network ACLs              │
│   • Private Subnets for Databases               │
├─────────────────────────────────────────────────┤
│   Layer 3: Application Security                 │
│   • Input Validation                            │
│   • SQL Injection Prevention                    │
│   • XSS Protection                              │
│   • CSRF Tokens                                 │
├─────────────────────────────────────────────────┤
│   Layer 4: Data Security                        │
│   • Encryption at Rest                          │
│   • Encryption in Transit                       │
│   • Row-Level Security                          │
├─────────────────────────────────────────────────┤
│   Layer 5: Access Security                      │
│   • JWT Authentication                          │
│   • RBAC / Tenant Isolation                     │
│   • Audit Logging                               │
└─────────────────────────────────────────────────┘
```

**Example Implementation:** When a user submits a trade, the request passes through Web Application Firewall filtering, network security checks, application validation, database encryption, and finally access control verification before being processed.

### 1.2 Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Least Privilege** | Users only access what they need - Members can only see their trades, not others' |
| **Zero Trust** | Verify every request, internal/external - Even internal service calls require authentication |
| **Defense in Depth** | Multiple security layers - Breach at one layer doesn't compromise entire system |
| **Fail Securely** | Default deny, explicit allow - Unknown requests are rejected by default |
| **Separation of Duties** | Development ≠ Production access - Developers cannot access production database directly |
| **Complete Mediation** | Every access checked every time - No cached permissions, revalidated on each request |

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow Security

**JWT Token Security:**
- **Access Token:** Valid for 15 minutes, contains user identity, tenant, and role information
- **Refresh Token:** Valid for 30 days, stored as HTTP-only cookie with strict security flags
- **Token Rotation:** When refresh token is used, a new one is issued and old one invalidated

**Password Security Requirements:**
- **Minimum Length:** 8 characters
- **Complexity Requirements:** Must include uppercase, lowercase, number, and special character
- **Hashing Algorithm:** Argon2id with significant memory cost to prevent brute force attacks
- **Account Protection:** 5 failed attempts triggers 15-minute lockout, password history prevents reuse

**Example Scenario:** When Sarah logs into her trading journal, her password is verified against the Argon2id hash, a short-lived access token is issued, and a refresh token is securely stored in her browser. If someone tries to brute force her account, the system locks after 5 attempts and alerts security monitoring.

### 2.2 Authorization Model

**Role-Based Access Control (RBAC):**
- **Owner:** Full workspace control including billing and user management
- **Admin:** Can manage users and view all trades within workspace
- **Member:** Can create/edit own trades and view analytics
- **Viewer:** Read-only access for auditing or compliance purposes

**Tenant Isolation:** Every database query automatically includes `tenant_id` filter to prevent cross-workspace data access.

**Row-Level Security:** PostgreSQL policies ensure users can only access data from their assigned workspace, even if they bypass application logic.

**Example:** John (Member role) can see his AAPL trades but not Sarah's TSLA trades, even though they're in the same workspace. The database itself enforces this separation.

---

## 3. Data Protection

### 3.1 Encryption Standards

| Data Type | At Rest Protection | In Transit Protection |
|-----------|-------------------|----------------------|
| **Passwords** | Argon2id cryptographic hash | TLS 1.3 encryption |
| **API Tokens** | HMAC-SHA256 signatures | TLS 1.3 encryption |
| **Trade Data** | Database column encryption | TLS 1.3 encryption |
| **File Uploads** | S3 server-side encryption | TLS 1.3 encryption |
| **Backups** | AWS KMS master key encryption | TLS 1.3 encryption |

### 3.2 Sensitive Data Handling

**Encrypted Fields Strategy:**
- Broker API keys and other sensitive integration credentials are encrypted at application level before storage
- Personally identifiable information is masked in API responses (emails shown as j****@example.com)
- Financial calculations use decimal precision to prevent rounding errors or manipulation

**Data Retention & Deletion:**
- **Soft Delete:** Trades marked as deleted but retained for 30-day recovery window
- **Automatic Cleanup:** After 30 days, deleted trades are permanently removed
- **GDPR Compliance:** User deletion triggers anonymization procedure that replaces personal data with placeholder values while retaining financial records for tax compliance

**Example:** When a user requests account deletion under GDPR, their email becomes "deleted_7f3b2d1c@deleted.tj" and name becomes "Deleted User," but their trade history remains intact for their successor or for business continuity.

---

## 4. API Security

### 4.1 Security Headers

All API responses include comprehensive security headers:
- **Strict-Transport-Security:** Forces HTTPS for one year including subdomains
- **X-Content-Type-Options:** Prevents MIME type sniffing attacks
- **X-Frame-Options:** Blocks page embedding to prevent clickjacking
- **Content-Security-Policy:** Restricts resource loading to trusted sources only
- **Referrer-Policy:** Controls referrer information in outbound links

**Example:** When the trading journal loads in a browser, these headers prevent malicious sites from embedding it in iframes or loading unauthorized scripts.

### 4.2 Input Validation & Sanitization

**Validation Layers:**
1. **Schema Validation:** All API requests validated against strict schemas before processing
2. **Database Constraints:** Type checking, range validation, and foreign key integrity
3. **Business Logic Validation:** Domain-specific rules like "exit price must be after entry price"

**SQL Injection Prevention:**
- All database queries use parameterized statements or ORM with built-in escaping
- Never concatenate user input into SQL queries
- Regular security scanning for potential injection vectors

**XSS Prevention:**
- User input in trade notes and descriptions is sanitized before display
- Content Security Policy blocks inline scripts and unauthorized sources
- Output encoding ensures user content is treated as data, not executable code

**Example:** If a user enters `<script>alert('hack')</script>` in trade notes, the system sanitizes it to remove the script tags while preserving other formatting.

### 4.3 Rate Limiting

**Tiered Limits by Plan:**
- **Unauthenticated:** 100 requests/hour per IP address
- **Free Plan:** 1,000 requests/hour per user
- **Pro Plan:** 10,000 requests/hour per user
- **Enterprise:** 100,000 requests/hour per user

**Critical Endpoint Protections:**
- `/auth/login`: 10 attempts/hour per IP to prevent credential stuffing
- `/auth/register`: 5 registrations/hour per IP to prevent spam accounts
- `/auth/forgot-password`: 3 requests/hour per IP to prevent email bombing
- `/trades/import`: 5 imports/hour per user to prevent resource exhaustion

**Example:** A malicious actor attempting to brute force passwords would be blocked after 10 attempts from the same IP address within an hour.

---

## 5. Infrastructure Security

### 5.1 Cloud Infrastructure Protection

**Network Security Design:**
- **VPC Isolation:** Application runs in private virtual network with controlled access points
- **Security Groups:** Fine-grained firewall rules allowing only necessary traffic
- **Private Subnets:** Databases and Redis run in isolated subnets with no public internet access

**Encryption Implementation:**
- **EBS Volumes:** All storage volumes encrypted with AWS Key Management Service
- **RDS Encryption:** Database storage, backups, and snapshots encrypted at rest
- **S3 Encryption:** All file uploads automatically encrypted with server-side encryption
- **Secret Management:** API keys and credentials stored in dedicated secret management service

**Example:** The PostgreSQL database containing trade records is in a private subnet, accessible only by the application servers via encrypted connections, with all storage encrypted using AWS-managed keys.

### 5.2 Container Security

**Docker Security Practices:**
- Use specific version tags instead of "latest" for predictable builds
- Create and run as non-root user inside containers
- Copy application files with appropriate ownership permissions
- Regular vulnerability scanning in CI/CD pipeline

**Example:** The application container runs as user "nodejs" with ID 1001 instead of root, limiting potential damage if the container is compromised.

### 5.3 Secret Management

**Development:** Environment variables in `.env` files (never committed to version control)
**Production:** AWS Secrets Manager with automatic rotation and access logging
**Emergency:** Break-glass procedures with physical security controls

**Example:** JWT signing secrets are automatically rotated every 90 days without application downtime, with old secrets maintained briefly for token validation during transition.

---

## 6. Compliance Requirements

### 6.1 GDPR Compliance Checklist

| Requirement | Trading Journal Implementation |
|-------------|-------------------------------|
| **Right to Access** | `/users/me/export` endpoint provides complete data export |
| **Right to Erasure** | Anonymization procedure replaces personal data with placeholders |
| **Data Portability** | CSV and JSON export formats for all trade data |
| **Consent Management** | Registration includes explicit consent for data processing |
| **DPA with Processors** | Signed agreements with AWS, Razorpay, and Cloudflare |
| **Breach Notification** | 72-hour notification process for affected users |
| **Privacy by Design** | Default privacy settings maximize user protection |

### 6.2 Data Processing Agreement Scope

**Data Categories Processed:**
- **Personal Data:** User email addresses, names, IP addresses, device information
- **Financial Data:** Trade entries, profit/loss calculations, portfolio values
- **Technical Data:** Access logs, performance metrics, error reports

**Lawful Basis:** Contract necessity - data processing required to provide trading journal services

**Third-Party Processors:**
- **AWS (USA):** Cloud infrastructure and hosting services
- **Razorpay (India):** Payment processing and subscription management
- **Cloudflare (USA):** Content delivery, DDoS protection, and Web Application Firewall

**Example:** When a European user signs up, they explicitly consent to data processing for service provision, with clear information about third-party processors and data transfer safeguards.

### 6.3 Security Certification Roadmap

**Phase 1 (Launch):**
- SSL/TLS encryption for all communications
- Regular third-party security audits
- Automated vulnerability scanning

**Phase 2 (6 Months Post-Launch):**
- SOC 2 Type I assessment for security controls
- Professional penetration testing engagement
- Bug bounty program for responsible disclosure

**Phase 3 (12 Months Post-Launch):**
- ISO 27001 certification for information security management
- GDPR compliance audit for European operations
- PCI DSS assessment if payment processing expands

---

## 7. Incident Response

### 7.1 Incident Classification

| Level | Description | Example Scenario | Response Time |
|-------|-------------|------------------|---------------|
| **P1 - Critical** | Data breach, complete service outage | Database compromise, ransomware attack | < 1 hour |
| **P2 - High** | Security vulnerability, partial outage | API vulnerability exposing trade data | < 4 hours |
| **P3 - Medium** | Performance issues, non-critical bugs | Rate limiting failure causing slowdown | < 24 hours |
| **P4 - Low** | Minor issues, feature requests | UI display bug, enhancement requests | < 72 hours |

### 7.2 Response Playbook

**Suspected Data Breach Procedure:**

```
1. IMMEDIATE: Isolate affected systems to contain breach
2. ACTIVATE: Incident response team with defined roles
3. ASSESS: Determine scope (what data, when, how many affected)
4. CONTAIN: Stop ongoing breach (revoke tokens, block IPs)
5. NOTIFY: 
   - Internal team: Immediately upon confirmation
   - Affected users: Within 72 hours per GDPR requirements
   - Authorities: If required by law or regulatory obligations
6. ERADICATE: Remove cause (patch vulnerabilities, update systems)
7. RECOVER: Restore services from verified clean backups
8. LESSONS: Conduct post-mortem, update procedures
```

**Security Monitoring Examples:**
- Multiple failed login attempts from same IP address
- API access from unusual geographic locations
- Rapid API calls indicating potential scraping or attack
- Database queries without proper tenant filtering
- Unusual file upload patterns or sizes

**Example:** If monitoring detects 20 failed login attempts to Sarah's account from an unusual country, the system automatically locks the account, alerts the security team, and blocks the suspicious IP address.

---

## 8. Security Testing

### 8.1 Testing Schedule

| Test Type | Frequency | Purpose | Tools Used |
|-----------|-----------|---------|------------|
| **SAST** | Every commit | Catch code vulnerabilities early | SonarQube, Snyk Code |
| **DAST** | Weekly | Find runtime vulnerabilities | OWASP ZAP, Burp Suite |
| **Dependency Scan** | Daily | Identify vulnerable libraries | npm audit, Snyk Open Source |
| **Penetration Test** | Quarterly | Professional security assessment | External security firm |
| **Security Review** | Monthly | Architecture and design review | Internal security team |

### 8.2 OWASP Top 10 Mitigations

| OWASP Risk | Trading Journal Mitigation |
|------------|---------------------------|
| **A01: Broken Access Control** | JWT validation, RBAC with tenant isolation, row-level security |
| **A02: Cryptographic Failures** | Argon2id for passwords, TLS 1.3 everywhere, key rotation |
| **A03: Injection** | Parameterized queries, input validation, ORM with escaping |
| **A04: Insecure Design** | Threat modeling, security requirements, secure defaults |
| **A05: Security Misconfiguration** | Hardened container images, security headers, minimal permissions |
| **A06: Vulnerable Components** | Automated dependency scanning, regular updates, vulnerability monitoring |
| **A07: Identification Failures** | Strong password policies, MFA-ready architecture, session management |
| **A08: Software Integrity** | Code signing, secure CI/CD pipeline, artifact verification |
| **A09: Security Logging** | Centralized logging, audit trails, alerting on suspicious activity |
| **A10: SSRF** | Input validation, outbound firewall, restricted internal access |

### 8.3 Security Checklist for Deployment

**Pre-Deployment Requirements:**
- [ ] Static Application Security Testing (SAST) passed with no critical issues
- [ ] Dependency scanning clean with no high-risk vulnerabilities
- [ ] Security architecture review completed and approved
- [ ] Penetration test results addressed and remediated
- [ ] No secrets or credentials in code repository

**Production Environment Setup:**
- [ ] Web Application Firewall rules configured and tested
- [ ] DDoS protection enabled and monitoring active
- [ ] Security monitoring and alerting systems operational
- [ ] Backup systems tested with restore verification
- [ ] Incident response team identified and on-call

**Ongoing Security Operations:**
- [ ] Regular vulnerability scans of production environment
- [ ] Security patch updates applied following change management
- [ ] Quarterly access reviews for administrative accounts
- [ ] Annual security training for all team members
- [ ] Regular security policy reviews and updates

**Example:** Before deploying the new trade analytics feature, the team completes SAST scanning, fixes identified issues, reviews the architecture for security implications, tests in staging with security tools, and only then schedules production deployment during maintenance window.

---

## Appendix: Security Configuration Examples

### Content Security Policy Implementation

The Trading Journal implements a strict Content Security Policy that:
- Allows scripts only from the application's own domain
- Permits styles from the application and trusted CDNs
- Restricts images to application domain and data URLs
- Blocks all frame embedding to prevent clickjacking
- Requires HTTPS for all connections

**Result:** Even if an attacker injects malicious script content into trade notes, the browser will refuse to execute it due to CSP restrictions.

### Security Headers Configuration

All application responses include security headers that:
- Force HTTPS usage for one year including subdomains
- Prevent MIME type sniffing that could lead to execution of malicious content
- Block page embedding in frames to prevent UI redress attacks
- Control referrer information to protect sensitive URLs
- Disable browser features that could be exploited (geolocation, camera, microphone)

**Example Impact:** When a user views their trade history, the security headers ensure the page cannot be embedded in a malicious site, cannot have its content type misinterpreted, and will only load resources from trusted sources.

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Security Officer:** Junaid Ali Khan  
**Review Cycle:** Quarterly  
**Distribution:** Development Team, Security Team, Operations Team

*This document outlines the security controls and compliance framework for the Trading Journal application. All team members must adhere to these security practices and participate in regular security training.*