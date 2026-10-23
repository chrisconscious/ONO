import { Document } from './types';

export const stage3Doc5: Document = {
  id: 'ci-cd-quality-gates',
  number: 5,
  title: 'CI/CD and Quality Gate Plan',
  shortTitle: 'CI/CD Pipeline',
  description: 'Continuous integration pipeline, quality gates, deployment strategy, and environment management.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'CI-1',
      title: '1. CI/CD Pipeline Overview',
      content: `**Pipeline Stages:**

**1. Pre-Merge Checks (PR Validation):**
- Lint and format check
- TypeScript type checking
- Unit tests
- Integration tests (fast subset)
- Security scan (dependencies)
- Build verification

**2. Post-Merge (Main Branch):**
- Full test suite (unit + integration)
- Database migration validation
- Build all packages and apps
- Generate test coverage report
- Update documentation

**3. Staging Deployment:**
- Deploy to staging environment
- Run E2E tests
- Performance tests (critical paths)
- Security penetration tests (automated)
- Manual QA approval

**4. Production Deployment:**
- Requires manual approval
- Deploy to production
- Smoke tests
- Monitoring verification
- Rollback plan ready

**Tools:**
- CI/CD: GitHub Actions
- Container Registry: GitHub Container Registry
- Deployment: Vercel (web), Railway/Fly.io (workers), Render (ML)
- Monitoring: Sentry (errors), LogDNA (logs), Axiom (metrics)`
    },
    {
      id: 'CI-2',
      title: '2. Pre-Merge Quality Gates',
      content: `**Required Checks (Must Pass to Merge):**

**1. Lint and Format:**
\`\`\`yaml
- name: Lint and Format
  run: |
    pnpm lint
    pnpm format --check
\`\`\`

**2. Type Check:**
\`\`\`yaml
- name: TypeScript Type Check
  run: pnpm typecheck
\`\`\`

**3. Unit Tests:**
\`\`\`yaml
- name: Unit Tests
  run: pnpm test -- --coverage
  env:
    DATABASE_URL: \${{ secrets.TEST_DATABASE_URL }}
\`\`\`

**4. Integration Tests (Fast):**
\`\`\`yaml
- name: Integration Tests
  run: pnpm test:integration
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_DB: clickit_test
        POSTGRES_PASSWORD: test
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
\`\`\`

**5. Security Scan:**
\`\`\`yaml
- name: Security Audit
  run: pnpm audit --audit-level=high

- name: Dependency Review
  uses: actions/dependency-review-action@v3
\`\`\`

**6. Build Verification:**
\`\`\`yaml
- name: Build
  run: pnpm build
\`\`\`

**Branch Protection Rules:**
- Require PR approval (1+ reviewer)
- Require status checks to pass
- Require branches to be up to date
- No force pushes to main
- No direct pushes to main`
    },
    {
      id: 'CI-3',
      title: '3. Post-Merge Pipeline',
      content: `**Main Branch Actions:**

**1. Full Test Suite:**
\`\`\`yaml
- name: Full Test Suite
  run: |
    pnpm test
    pnpm test:integration
  services:
    postgres:
      image: postgres:15
    redis:
      image: redis:7
\`\`\`

**2. Database Migration Validation:**
\`\`\`yaml
- name: Validate Migrations
  run: |
    pnpm db:migrate:deploy
    pnpm db:migrate:status
\`\`\`

**3. Coverage Report:**
\`\`\`yaml
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
\`\`\`

**4. Build and Push Docker Images:**
\`\`\`yaml
- name: Build and Push
  run: |
    docker build -t ghcr.io/clickit/web:\${{ github.sha }} .
    docker push ghcr.io/clickit/web:\${{ github.sha }}
\`\`\`

**5. Deploy to Staging:**
\`\`\`yaml
- name: Deploy to Staging
  run: |
    # Deploy web app
    vercel deploy --prod --token=\${{ secrets.VERCEL_TOKEN }}

    # Deploy workers
    fly deploy --app clickit-workers-staging

    # Deploy ML services
    render deploy --service clickit-ml-staging
\`\`\``
    },
    {
      id: 'CI-4',
      title: '4. Staging Environment',
      content: `**Staging Deployment:**

**Environment:**
- URL: staging.clickit.dev
- Database: Separate staging database
- Services: Full stack (web, workers, ML)
- Data: Anonymized production data or seed data

**Post-Deployment Tests:**
\`\`\`yaml
- name: E2E Tests
  run: pnpm test:e2e
  env:
    BASE_URL: https://staging.clickit.dev

- name: Performance Tests
  run: |
    k6 run tests/performance/load-test.js
  env:
    BASE_URL: https://staging.clickit.dev

- name: Security Scan
  uses: OWASP/zap-action@v1
  with:
    target: https://staging.clickit.dev
\`\`\`

**Manual QA Gate:**
- QA team reviews critical workflows
- Tests new features manually
- Verifies bug fixes
- Approves for production deployment

**Staging Rollback:**
\`\`\`bash
# Rollback web app
vercel rollback --token=\${VERCEL_TOKEN}

# Rollback workers
fly rollback --app clickit-workers-staging

# Rollback database
pnpm db:migrate:undo
\`\`\``
    },
    {
      id: 'CI-5',
      title: '5. Production Deployment',
      content: `**Production Deployment Process:**

**1. Approval Gate:**
- Manual approval required in GitHub Actions
- Requires sign-off from:
  - Engineering lead
  - Product owner
  - QA lead (if major release)

**2. Deployment Steps:**
\`\`\`yaml
- name: Deploy to Production
  if: github.event_name == 'workflow_dispatch'
  environment: production
  run: |
    # Deploy database migrations first
    pnpm db:migrate:deploy

    # Deploy web app
    vercel deploy --prod --token=\${{ secrets.VERCEL_TOKEN }}

    # Deploy workers
    fly deploy --app clickit-workers-production

    # Deploy ML services
    render deploy --service clickit-ml-production
\`\`\`

**3. Post-Deployment Verification:**
\`\`\`bash
# Smoke tests
pnpm test:smoke

# Health checks
curl https://api.clickit.com/health
curl https://api.clickit.com/ready

# Monitoring verification
# Check Sentry for new errors
# Check logs for anomalies
# Check metrics for performance degradation
\`\`\`

**4. Rollback Plan:**
\`\`\`bash
# Immediate rollback if critical issues
vercel rollback --token=\${VERCEL_TOKEN}
fly rollback --app clickit-workers-production

# Database rollback (if migration issue)
pnpm db:migrate:undo

# Communication
# Notify team via Slack
# Update status page
# Post-mortem within 24 hours
\`\`\`

**Deployment Frequency:**
- Target: Weekly deployments (Tuesday/Thursday)
- Emergency deployments: As needed with expedited approval
- No deployments on Fridays or before holidays`
    },
    {
      id: 'CI-6',
      title: '6. Environment Management',
      content: `**Environment Hierarchy:**

**Development:**
- Local development machines
- Docker Compose for services
- Seed data for testing
- Debug logging enabled

**Testing:**
- CI environment (ephemeral)
- Test database (reset between runs)
- No external service calls (mocked)
- Fast feedback (< 10 minutes)

**Staging:**
- Persistent environment
- Anonymized production data
- Full stack deployment
- Used for QA and preview

**Production:**
- Live customer environment
- Real data
- High availability
- Monitoring and alerting
- Backup and disaster recovery

**Environment Variables:**
- Development: .env.local (gitignored)
- Testing: .env.test (committed if safe)
- Staging: Environment-specific secrets manager
- Production: Production secrets manager (AWS Secrets Manager)

**Secret Management:**
- Never commit secrets to repository
- Use environment-specific secret managers
- Rotate secrets regularly
- Audit secret access
- Use different secrets per environment`
    }
  ]
};

export const stage3Doc6: Document = {
  id: 'database-migration-workflow',
  number: 6,
  title: 'Database Migration Workflow',
  shortTitle: 'Database Migrations',
  description: 'Schema management, migration procedures, testing, and deployment strategy for database changes.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'DM-1',
      title: '1. Migration Principles',
      content: `**Core Principles:**

1. **All schema changes via migrations** — No manual database modifications
2. **Migrations are version-controlled** — Committed to Git, reviewed in PRs
3. **Migrations are reversible** — Every migration has up and down
4. **Migrations are tested** — Validated against test database before deployment
5. **Migrations are backward-compatible** — No breaking changes to existing data
6. **Migrations are atomic** — Each migration is a single logical change
7. **Migrations are reviewed** — Require approval from database architect

**Migration Types:**

**Schema Migrations:**
- Add/remove tables
- Add/remove/modify columns
- Add/remove indexes
- Add/remove constraints

**Data Migrations:**
- Transform existing data
- Backfill new columns
- Migrate data between tables
- Clean up invalid data

**Permission Migrations:**
- Add/remove roles
- Update permission definitions
- Migrate user assignments

**Configuration Migrations:**
- Update default settings
- Add new configuration options
- Migrate tenant configurations`
    },
    {
      id: 'DM-2',
      title: '2. Creating Migrations',
      content: `**Migration Workflow:**

**1. Plan the Change:**
- Identify affected entities and relationships
- Consider impact on existing data
- Plan rollback strategy
- Estimate migration time

**2. Create Migration:**
\`\`\`bash
# Create new migration
pnpm db:migrate:create --name add_lead_scoring

# This creates:
# prisma/migrations/20240115_add_lead_scoring/migration.sql
\`\`\`

**3. Write Migration SQL:**
\`\`\`sql
-- prisma/migrations/20240115_add_lead_scoring/migration.sql

-- Up migration
CREATE TABLE "LeadScore" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "leadId" UUID NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" UUID NOT NULL,

  CONSTRAINT "LeadScore_pkey" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX "LeadScore_leadId_idx" ON "LeadScore"("leadId");
CREATE INDEX "LeadScore_organizationId_idx" ON "LeadScore"("organizationId");

-- Add RLS policy
ALTER TABLE "LeadScore" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "LeadScore"
  USING ("organizationId" = current_setting('app.current_tenant')::UUID);
\`\`\`

**4. Update Prisma Schema:**
\`\`\`prisma
// prisma/schema.prisma

model LeadScore {
  id             String   @id @default(uuid())
  leadId         String   @map("leadId")
  lead           Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  score          Int      @default(0)
  calculatedAt   DateTime @default(now()) @map("calculatedAt")
  organizationId String   @map("organizationId")
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([leadId])
  @@index([organizationId])
  @@map("LeadScore")
}
\`\`\`

**5. Test Migration:**
\`\`\`bash
# Test migration locally
pnpm db:migrate:dev

# Verify schema
pnpm db:studio

# Run tests
pnpm test
\`\`\``
    },
    {
      id: 'DM-3',
      title: '3. Migration Review Checklist',
      content: `**Pre-Merge Review:**

**Schema Changes:**
- [ ] Migration is backward-compatible
- [ ] No data loss will occur
- [ ] Foreign keys are properly defined
- [ ] Indexes added for query performance
- [ ] RLS policies updated if new tenant-scoped table
- [ ] Audit columns added (created_at, updated_at, created_by, updated_by)
- [ ] Soft delete column added if appropriate

**Data Changes:**
- [ ] Data transformation is correct
- [ ] Handles NULL values appropriately
- [ ] Handles edge cases (empty tables, large datasets)
- [ ] Migration is idempotent (can be run multiple times safely)
- [ ] Rollback plan documented

**Performance:**
- [ ] Migration time estimated for production data size
- [ ] Lock time minimized (no long-running transactions)
- [ ] Indexes created after data load (if large table)
- [ ] Consider running during off-peak hours

**Testing:**
- [ ] Migration tested on copy of production data
- [ ] Rollback tested
- [ ] Application tests pass after migration
- [ ] No breaking changes to API contracts

**Documentation:**
- [ ] Migration purpose documented in commit message
- [ ] Breaking changes documented
- [ ] Rollback procedure documented
- [ ] Post-migration steps documented (if any)`
    },
    {
      id: 'DM-4',
      title: '4. Safe Migration Patterns',
      content: `**Pattern 1: Add Column (Non-Breaking)**
\`\`\`sql
-- Step 1: Add column as nullable
ALTER TABLE "Lead" ADD COLUMN "score" INTEGER;

-- Step 2: Backfill data (application code or migration)
UPDATE "Lead" SET "score" = 0 WHERE "score" IS NULL;

-- Step 3: Make column not null (in next migration)
ALTER TABLE "Lead" ALTER COLUMN "score" SET NOT NULL;

-- Step 4: Add default value
ALTER TABLE "Lead" ALTER COLUMN "score" SET DEFAULT 0;
\`\`\`

**Pattern 2: Rename Column (Non-Breaking)**
\`\`\`sql
-- Step 1: Add new column
ALTER TABLE "Lead" ADD COLUMN "lead_name" VARCHAR(200);

-- Step 2: Copy data
UPDATE "Lead" SET "lead_name" = "name";

-- Step 3: Update application to use new column
-- (Deploy application code)

-- Step 4: Drop old column (in next migration)
ALTER TABLE "Lead" DROP COLUMN "name";
\`\`\`

**Pattern 3: Split Table (Non-Breaking)**
\`\`\`sql
-- Step 1: Create new table
CREATE TABLE "LeadContact" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "leadId" UUID NOT NULL REFERENCES "Lead"("id"),
  "email" VARCHAR(200),
  "phone" VARCHAR(50)
);

-- Step 2: Copy data
INSERT INTO "LeadContact" ("leadId", "email", "phone")
SELECT "id", "email", "phone" FROM "Lead";

-- Step 3: Update application to use new table
-- (Deploy application code)

-- Step 4: Drop columns from old table
ALTER TABLE "Lead" DROP COLUMN "email", DROP COLUMN "phone";
\`\`\`

**Pattern 4: Large Data Migration**
\`\`\`sql
-- For large tables, batch updates to avoid long locks
DO $$
DECLARE
  batch_size INTEGER := 10000;
  last_id UUID;
BEGIN
  LOOP
    UPDATE "Lead"
    SET "score" = calculate_score("id")
    WHERE "id" IN (
      SELECT "id" FROM "Lead"
      WHERE "score" IS NULL
      AND ("id" > last_id OR last_id IS NULL)
      ORDER BY "id"
      LIMIT batch_size
    )
    RETURNING "id" INTO last_id;

    EXIT WHEN NOT FOUND;
    COMMIT;
  END LOOP;
END $$;
\`\`\``
    },
    {
      id: 'DM-5',
      title: '5. Migration Deployment',
      content: `**Deployment Strategy:**

**1. Pre-Deployment:**
- Review migration in staging
- Estimate migration time
- Plan deployment window (if long-running)
- Prepare rollback plan
- Notify team

**2. Deployment Steps:**
\`\`\`bash
# 1. Backup database
pg_dump -h <host> -U <user> -d clickit_production > backup.sql

# 2. Run migration
pnpm db:migrate:deploy

# 3. Verify migration
pnpm db:migrate:status

# 4. Run smoke tests
pnpm test:smoke

# 5. Monitor for issues
# Check logs, metrics, error rates
\`\`\`

**3. Rollback Procedure:**
\`\`\`bash
# If migration fails or causes issues
# 1. Stop application (if needed)

# 2. Rollback migration
pnpm db:migrate:undo

# 3. Verify rollback
pnpm db:migrate:status

# 4. Restart application

# 5. If data corruption, restore from backup
psql -h <host> -U <user> -d clickit_production < backup.sql
\`\`\`

**4. Post-Deployment:**
- Monitor error rates
- Check query performance
- Verify data integrity
- Update documentation
- Communicate completion

**Migration Monitoring:**
\`\`\`sql
-- Check migration status
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC;

-- Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\`\`\``
    },
    {
      id: 'DM-6',
      title: '6. Seed Data Strategy',
      content: `**Seed Data Purpose:**
- Development: Provide realistic test data
- Demo: Showcase platform capabilities
- Testing: Provide consistent test fixtures

**Seed Data Categories:**

**1. System Data (Always Seeded):**
- Platform roles and permissions
- Default industry categories
- System configuration
- Default email templates

**2. Demo Data (Optional):**
- Sample organization
- Sample users with different roles
- Sample CRM data (leads, contacts)
- Sample sales pipeline
- Sample financial records

**3. Test Data (CI/CD Only):**
- Minimal data for integration tests
- Cleared between test runs
- Never used in production

**Seed Script Example:**
\`\`\`typescript
// packages/database/src/seed/index.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // 1. Create system data
  await seedSystemData();

  // 2. Create demo data (if DEMO_MODE=true)
  if (process.env.DEMO_MODE === 'true') {
    await seedDemoData();
  }

  console.log('Seeding complete');
}

async function seedSystemData() {
  // Create default roles
  await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Full access', isSystem: true },
      { name: 'manager', description: 'Department management', isSystem: true },
      { name: 'user', description: 'Standard user', isSystem: true },
    ]
  });

  // Create industry categories
  await prisma.industryCategory.createMany({
    data: [
      { name: 'Technology', description: 'Software and IT services' },
      { name: 'Retail', description: 'Retail and wholesale' },
      { name: 'Manufacturing', description: 'Manufacturing and production' },
      // ...
    ]
  });
}

async function seedDemoData() {
  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      industry: 'Technology'
    }
  });

  // Create demo users
  await prisma.user.createMany({
    data: [
      { email: 'admin@demo.com', name: 'Admin User', organizationId: org.id, role: 'admin' },
      { email: 'manager@demo.com', name: 'Manager User', organizationId: org.id, role: 'manager' },
      { email: 'user@demo.com', name: 'Standard User', organizationId: org.id, role: 'user' },
    ]
  });

  // Create demo leads, contacts, etc.
  // ...
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
\`\`\`

**Seed Data Rules:**
- Never seed real customer data
- Clearly mark demo data (organization name: "Demo Company")
- Use realistic but fictional data
- Provide variety (different industries, sizes, stages)
- Document seed data in README`
    }
  ]
};
