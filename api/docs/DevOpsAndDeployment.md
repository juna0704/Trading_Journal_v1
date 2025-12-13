# Trading Journal - DevOps & Deployment Document

**Project:** Trading Journal  
**Author:** Junaid Ali Khan  
**Version:** 1.0  
**Last Updated:** December 9, 2025

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [Environment Management](#2-environment-management)
3. [CI/CD Pipeline](#3-cicd-pipeline)
4. [Container Orchestration](#4-container-orchestration)
5. [Database Management](#5-database-management)
6. [Monitoring & Observability](#6-monitoring--observability)
7. [Backup & Disaster Recovery](#7-backup--disaster-recovery)
8. [Scaling Strategy](#8-scaling-strategy)
9. [Security & Secrets Management](#9-security--secrets-management)
10. [Cost Optimization](#10-cost-optimization)

---

## 1. Infrastructure Overview

### 1.1 Cloud Provider Architecture

**Multi-Cloud Strategy:**

```
Primary: Vercel (Frontend + API)
Database: Neon (PostgreSQL)
Cache: Upstash (Redis)
Storage: AWS S3 / Cloudflare R2
CDN: Cloudflare
Monitoring: Grafana Cloud / Datadog
```

### 1.2 Infrastructure as Code

**Tool:** Terraform for AWS resources, Vercel CLI for platform deployment

```hcl
# terraform/main.tf
provider "aws" {
  region = "ap-south-1" # Mumbai region for Indian users
}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "tradingjournal-uploads-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = "trading-journal"
  }
}

# CloudFront Distribution for S3
resource "aws_cloudfront_distribution" "uploads_cdn" {
  origin {
    domain_name = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.uploads.id}"
  }

  enabled = true

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.uploads.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
  }
}
```

### 1.3 Network Architecture

```
Internet → Cloudflare WAF → Vercel Edge Network
                                    ↓
                          Next.js Application
                                    ↓
                     ┌──────────────┼──────────────┐
                     ↓              ↓              ↓
              Neon Database   Upstash Redis   AWS S3
              (Private)       (Public API)    (Private)
```

---

## 2. Environment Management

### 2.1 Environment Hierarchy

| Environment    | Purpose        | URL                        | Database        | Auto-Deploy         |
| -------------- | -------------- | -------------------------- | --------------- | ------------------- |
| **Local**      | Development    | localhost:3000             | Local Postgres  | Manual              |
| **Preview**    | PR previews    | pr-123.vercel.app          | Neon branch     | On PR               |
| **Staging**    | Pre-production | staging.tradingjournal.com | Neon staging    | On merge to develop |
| **Production** | Live           | tradingjournal.com         | Neon production | On tag release      |

### 2.2 Environment Configuration

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tradingjournal.com/api

# Database
DATABASE_URL=postgresql://user:pass@neon.tech/prod_db?sslmode=require
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=upstash-redis-url
REDIS_TOKEN=upstash-token

# Authentication
JWT_SECRET=${secret_from_aws_secrets_manager}
JWT_EXPIRES_IN=15m

# File Storage
S3_BUCKET=tradingjournal-uploads-prod
S3_REGION=ap-south-1
S3_ACCESS_KEY=${secret_from_aws_secrets_manager}
S3_SECRET_KEY=${secret_from_aws_secrets_manager}

# External Services
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=${secret_from_aws_secrets_manager}
RAZORPAY_WEBHOOK_SECRET=${secret_from_aws_secrets_manager}

# Observability
SENTRY_DSN=https://xxx@sentry.io/xxx
GRAFANA_API_KEY=${secret_from_aws_secrets_manager}

# Feature Flags
ENABLE_CSV_IMPORT=true
ENABLE_API_ACCESS=false
MAINTENANCE_MODE=false
```

### 2.3 Branching Strategy

```
main (production)
  ↑
  merge via release PR
  ↑
develop (staging)
  ↑
  merge via feature PR
  ↑
feature/* (preview environments)
```

**Branch Protection Rules:**

- `main`: Require 2 approvals, all checks pass, signed commits
- `develop`: Require 1 approval, all checks pass
- `feature/*`: No restrictions, but checks must pass

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  release:
    types: [published]

env:
  NODE_VERSION: '18'

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  security-scan:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run npm audit
        run: npm audit --audit-level=high

  build:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next/

  deploy-preview:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          working-directory: ./

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.tradingjournal.com
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: staging.tradingjournal.com

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          TEST_URL: https://staging.tradingjournal.com

      - name: Notify team on Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://tradingjournal.com
    steps:
      - uses: actions/checkout@v3

      - name: Run database migrations
        run: npm run db:migrate:production
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: tradingjournal.com

      - name: Verify deployment health
        run: |
          curl -f https://tradingjournal.com/api/health || exit 1

      - name: Tag release
        run: |
          git tag -a "v${{ github.run_number }}" -m "Production release"
          git push origin "v${{ github.run_number }}"

      - name: Create Sentry release
        run: |
          curl -X POST \
            https://sentry.io/api/0/organizations/tradingjournal/releases/ \
            -H 'Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}' \
            -H 'Content-Type: application/json' \
            -d '{
              "version": "v${{ github.run_number }}",
              "projects": ["trading-journal"]
            }'

      - name: Notify team on Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment successful! 🎉'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3.2 Deployment Rollback Procedure

```bash
# Automatic rollback on health check failure
if [ $(curl -s -o /dev/null -w "%{http_code}" https://tradingjournal.com/api/health) -ne 200 ]; then
  echo "Health check failed, rolling back..."
  vercel rollback --token=$VERCEL_TOKEN

  # Notify team
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-Type: application/json' \
    -d '{"text": "Production deployment failed health check. Rolled back automatically."}'
fi
```

---

## 4. Container Orchestration

### 4.1 Docker Configuration

```dockerfile
# Dockerfile (Multi-stage build)
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG NEXT_PUBLIC_API_URL
ARG DATABASE_URL

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 4.2 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/tradingjournal
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_DB=tradingjournal
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI

volumes:
  postgres_data:
  redis_data:
```

---

## 5. Database Management

### 5.1 Migration Strategy

```bash
# DrizzleORM migration commands
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:rollback   # Rollback last migration
npm run db:reset      # Drop all tables and reapply migrations
```

### 5.2 Zero-Downtime Migrations

**Backward-Compatible Changes:**

```typescript
// Step 1: Add new column (nullable)
await db.schema.alterTable('trades').addColumn('new_column', 'varchar(255)').execute();

// Step 2: Deploy code that uses new column (but handles null)
// ... deploy ...

// Step 3: Backfill data
await db
  .updateTable('trades')
  .set({ new_column: db.raw('old_column') })
  .execute();

// Step 4: Make column non-nullable
await db.schema
  .alterTable('trades')
  .alterColumn('new_column', (col) => col.setNotNull())
  .execute();

// Step 5: Drop old column (after confirming everything works)
await db.schema.alterTable('trades').dropColumn('old_column').execute();
```

### 5.3 Database Backup Strategy

**Neon Automated Backups:**

- Point-in-time recovery (7 days for free, 30 days for paid)
- Automated daily snapshots
- Branch-based workflow for testing migrations

**Manual Backup Script:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > /tmp/$BACKUP_FILE

# Upload to S3
aws s3 cp /tmp/$BACKUP_FILE s3://tradingjournal-backups/$BACKUP_FILE

# Encrypt and store locally
gpg --encrypt --recipient admin@tradingjournal.com /tmp/$BACKUP_FILE
mv /tmp/$BACKUP_FILE.gpg /backups/

# Cleanup old backups (keep last 30 days)
find /backups -name "backup_*.sql.gpg" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

---

## 6. Monitoring & Observability

### 6.1 Health Check Endpoints

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    redis: false,
    storage: false,
  };

  try {
    // Database check
    await db.raw('SELECT 1');
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Redis check
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // S3 check
    await s3.listBuckets();
    checks.storage = true;
  } catch (error) {
    console.error('Storage health check failed:', error);
  }

  const healthy = Object.values(checks).every((check) => check === true);
  const status = healthy ? 200 : 503;

  return Response.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
```

### 6.2 Prometheus Metrics

```typescript
// lib/metrics.ts
import promClient from 'prom-client';

export const register = new promClient.Registry();

// API request duration
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Database query duration
export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  registers: [register],
});

// Active subscriptions
export const activeSubscriptions = new promClient.Gauge({
  name: 'active_subscriptions_total',
  help: 'Number of active subscriptions by plan',
  labelNames: ['plan'],
  registers: [register],
});

// Cache hit rate
export const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key'],
  registers: [register],
});

export const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key'],
  registers: [register],
});
```

### 6.3 Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Trading Journal - Production Metrics",
    "panels": [
      {
        "title": "API Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ]
      },
      {
        "title": "Redis Memory Usage",
        "targets": [
          {
            "expr": "redis_memory_used_bytes"
          }
        ]
      },
      {
        "title": "Active Subscriptions",
        "targets": [
          {
            "expr": "active_subscriptions_total"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Backup & Disaster Recovery

### 7.1 Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

| Component        | RPO             | RTO        | Strategy                                 |
| ---------------- | --------------- | ---------- | ---------------------------------------- |
| **Database**     | 5 minutes       | 30 minutes | Neon point-in-time recovery              |
| **Redis Cache**  | N/A (ephemeral) | 5 minutes  | Rebuild from database                    |
| **File Storage** | 24 hours        | 2 hours    | S3 versioning + cross-region replication |
| **Application**  | N/A (stateless) | 5 minutes  | Vercel automatic rollback                |

### 7.2 Disaster Recovery Plan

**Scenario 1: Database Corruption**

```bash
# 1. Identify corruption time
CORRUPTION_TIME="2025-12-09 10:30:00 UTC"

# 2. Create new Neon branch from point before corruption
neon branches create --parent main --timestamp "$CORRUPTION_TIME"

# 3. Update application DATABASE_URL to new branch
vercel env add DATABASE_URL "postgresql://new-branch-url"

# 4. Redeploy application
vercel --prod

# 5. Verify data integrity
npm run db:verify

# 6. If successful, promote branch to main
neon branches promote new-branch-id
```

**Scenario 2: Complete AWS Region Failure**

```bash
# 1. Activate secondary region (if configured)
terraform workspace select secondary-region
terraform apply

# 2. Update DNS to point to secondary region
# (Automated via Route 53 health checks)

# 3. Restore database from latest backup
aws rds restore-db-instance-from-s3 \
  --db-instance-identifier tradingjournal-failover \
  --source-engine postgres \
  --s3-bucket-name tradingjournal-backups

# 4. Update application configuration
vercel env add DATABASE_URL "postgresql://failover-url"

# 5. Deploy to secondary region
vercel --prod
```

---

## 8. Scaling Strategy

### 8.1 Horizontal Scaling

**Vercel Automatic Scaling:**

- Scales automatically based on request volume
- Edge functions deployed globally
- No manual configuration required

**Database Scaling (Neon):**

```yaml
# Autoscaling configuration
autoscaling:
  min_compute_units: 0.25 # Scale to zero when idle
  max_compute_units: 4 # Max for production
  scale_up_threshold: 75% # CPU utilization
  scale_down_delay: 300s # Wait before scaling down
```

### 8.2 Caching Strategy

**Multi-Level Caching:**

```
Browser Cache (static assets, 1 year)
    ↓
CDN Cache (images, 1 week)
    ↓
Redis Cache (API responses, 5 min - 1 hour)
    ↓
Database (source of truth)
```

### 8.3 Load Testing

```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
};

export default function () {
  const response = http.get('https://tradingjournal.com/api/v1/trades', {
    headers: {
      Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 9. Security & Secrets Management

### 9.1 AWS Secrets Manager Integration

```typescript
// lib/secrets.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'ap-south-1' });

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.getSecretValue({
      SecretId: secretName,
    });

    if ('SecretString' in response) {
      return response.SecretString;
    } else {
      const buff = Buffer.from(response.SecretBinary as Uint8Array);
      return buff.toString('ascii');
    }
  } catch (error) {
    console.error('Error retrieving secret:', error);
    throw error;
  }
}

// Usage
const jwtSecret = await getSecret('tradingjournal/production/jwt-secret');
const razorpaySecret = await getSecret('tradingjournal/production/razorpay-secret');
```

### 9.2 Secret Rotation

```bash
# Automated secret rotation (runs monthly)
#!/bin/bash

# Generate new JWT secret
NEW_SECRET=$(openssl rand -base64 32)

# Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id tradingjournal/production/jwt-secret \
  --secret-string "$NEW_SECRET"

# Update Vercel environment variable
vercel env rm JWT_SECRET production
vercel env add JWT_SECRET "$NEW_SECRET" production

# Trigger redeployment
vercel --prod

echo "JWT secret rotated successfully"
```

---

## 10. Cost Optimization

### 10.1 Cost Breakdown (Monthly)

| Service           | Free Tier           | Pro Usage       | Cost           |
| ----------------- | ------------------- | --------------- | -------------- |
| **Vercel**        | 100GB bandwidth     | 1TB bandwidth   | $20            |
| **Neon Database** | 0.5 GB storage      | 10 GB storage   | $19            |
| **Upstash Redis** | 10k commands/day    | 1M commands/day | $30            |
| **AWS S3**        | 5 GB storage        | 100 GB storage  | $3             |
| **CloudFlare**    | Unlimited bandwidth | CDN + WAF       | $0 (free tier) |
| **Sentry**        | 5k events/mo        | 50k events/mo   | $26            |
| **Total**         |                     |                 | **$98/month**  |

### 10.2 Cost Optimization Strategies

**Database:**

- Use Neon's scale-to-zero for development environments
- Implement connection pooling to reduce compute usage
- Archive old data to cheaper storage (S3 Glacier)

**Caching:**

- Aggressive Redis caching to reduce database queries
- CDN caching for static assets and images
- Client-side caching with SWR

**Monitoring:**

- Use sampling for high-volume metrics
- Retain logs for 30 days, archive to S3 for long-term storage
- Use log aggregation to reduce ingestion costs

**Compute:**

- Optimize serverless function cold starts
- Use edge functions for frequently accessed endpoints
- Implement request batching where possible

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed with no critical issues
- [ ] Database migrations tested in staging
- [ ] Environment variables configured correctly
- [ ] Secrets rotated if needed
- [ ] Backup verified and restorable

### During Deployment

- [ ] Database migrations applied successfully
- [ ] Application deployed to production
- [ ] Health checks passing
- [ ] CDN cache purged if needed
- [ ] Monitoring dashboards updated

### Post-Deployment

- [ ] Smoke tests completed successfully
- [ ] Error rates within acceptable limits
- [ ] Performance metrics within SLA
- [ ] Team notified of deployment
- [ ] Release notes published
- [ ] On-call engineer assigned

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**DevOps Lead:** Junaid Ali Khan  
**Review Cycle:** Quarterly
