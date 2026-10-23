# Database Migration and Rollback Operations

**Document ID:** OPS-12.8  
**Stage:** 12  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the database migration strategy, safety procedures, rollback planning, and data integrity verification for the ClickIT platform.

---

## 2. Migration Strategy

### 2.1 Migration Principles

**1. Backward Compatibility**
- New code must work with old schema
- Old code must work with new schema (during transition)
- No breaking changes without coordination

**2. Expand-Contract Pattern**
```
Phase 1: Expand (Add new column/table)
  - Backward compatible
  - Old code still works
  - No downtime

Phase 2: Migrate (Copy data)
  - Background job
  - Can be slow
  - No downtime

Phase 3: Contract (Remove old column/table)
  - After all code updated
  - Breaking change for old code
  - Coordinate with deployment
```

**3. Safe Migration Types**

**Adding Columns:**
- Add as nullable or with default value
- Backfill data if needed
- No downtime required

**Renaming Columns:**
- Add new column
- Copy data in background
- Update code to use new column
- Remove old column later

**Changing Column Types:**
- Add new column with new type
- Copy and transform data
- Update code to use new column
- Remove old column later

**Adding Tables:**
- No impact on existing code
- Can be done anytime
- No downtime required

**Dropping Tables:**
- Ensure no code references table
- Coordinate with all teams
- Backup table before dropping
- Can be restored if needed

**4. Risky Migrations (Require Special Handling)**

**Adding Indexes:**
- Can lock table during creation
- Use CONCURRENTLY option (PostgreSQL)
- Monitor table locks
- Schedule during low-traffic periods

**Large Data Updates:**
- Can lock table
- Use batch processing
- Monitor transaction log
- Schedule during maintenance window

**Schema Changes on Large Tables:**
- Can take hours
- Test on staging first
- Have rollback plan
- Communicate downtime

### 2.2 Migration Safety Checklist

- [ ] Migration tested in staging
- [ ] Rollback plan documented
- [ ] Backup created before migration
- [ ] Migration scheduled during low-traffic
- [ ] Team notified of migration
- [ ] Monitoring in place
- [ ] Rollback procedure tested

---

## 3. Migration Workflow

### 3.1 Migration Development

**1. Create Migration**
```bash
# Create new migration
npx prisma migrate dev --name add_new_column

# This creates:
# prisma/migrations/20260129_add_new_column/migration.sql
```

**2. Write Migration SQL**
```sql
-- Add new column (nullable)
ALTER TABLE "Lead" ADD COLUMN "score" INTEGER;

-- Backfill data (if needed)
UPDATE "Lead" SET "score" = 0 WHERE "score" IS NULL;

-- Add constraint (after backfill)
ALTER TABLE "Lead" ALTER COLUMN "score" SET NOT NULL;

-- Add default value
ALTER TABLE "Lead" ALTER COLUMN "score" SET DEFAULT 0;
```

**3. Test Migration**
- Test in development environment
- Test in staging environment
- Test with production-scale data
- Test rollback procedure

**4. Review Migration**
- Code review by team
- DBA review for complex migrations
- Security review for sensitive data
- Performance review for large tables

### 3.2 Migration Deployment

**1. Pre-Deployment**
- Create database backup
- Notify team of migration
- Prepare rollback plan
- Schedule maintenance window (if needed)

**2. Deployment**
```bash
# Apply migration
npx prisma migrate deploy

# Verify migration
npx prisma migrate status

# Check application health
curl https://app.clickit.com/health
```

**3. Post-Deployment**
- Monitor application logs
- Monitor database performance
- Verify data integrity
- Run smoke tests
- Monitor for 24 hours

### 3.3 Migration Rollback

**When to Rollback:**
- Migration causes application errors
- Data corruption detected
- Performance degradation
- Security vulnerability introduced

**Rollback Procedure:**
```bash
# Rollback last migration
npx prisma migrate reset

# Or restore from backup
pg_restore -d clickit_production backup.sql
```

**Rollback Safety:**
- Test rollback in staging first
- Have backup before migration
- Document rollback steps
- Communicate rollback to team

**Forward Fix (Alternative to Rollback):**
- If rollback is risky or impossible
- Create new migration to fix issue
- Deploy fix quickly
- Document lessons learned

---

## 4. Data Integrity and Verification

### 4.1 Pre-Migration Checks

**Verify Table Sizes:**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Check for Orphaned Records:**
```sql
SELECT COUNT(*) FROM "Activity" a
LEFT JOIN "Lead" l ON a."leadId" = l.id
WHERE l.id IS NULL;
```

**Validate Foreign Key Relationships:**
```sql
SELECT COUNT(*) FROM "InvoiceLine" il
LEFT JOIN "Invoice" i ON il."invoiceId" = i.id
WHERE i.id IS NULL;
```

**Check for Data Anomalies:**
```sql
SELECT COUNT(*) FROM "Lead"
WHERE "email" IS NOT NULL AND "email" NOT LIKE '%@%.%';
```

**Document Baseline Metrics:**
- Record counts per table
- Index sizes
- Query performance baselines
- Application response times

### 4.2 During Migration Checks

**Monitor Migration Progress:**
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Check for Errors or Warnings:**
- Monitor application logs
- Monitor database logs
- Check for lock contention
- Monitor transaction log size

**Monitor Database Performance:**
- CPU usage
- Memory usage
- I/O operations
- Query performance

**Check for Lock Contention:**
```sql
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';
```

### 4.3 Post-Migration Checks

**Verify Record Counts Match:**
```sql
-- Before migration
SELECT COUNT(*) FROM "Lead";

-- After migration
SELECT COUNT(*) FROM "Lead";

-- Should match
```

**Check Data Integrity Constraints:**
```sql
-- Check for null values in required fields
SELECT COUNT(*) FROM "Lead" WHERE "name" IS NULL;

-- Check for orphaned records
SELECT COUNT(*) FROM "Activity" a
LEFT JOIN "Lead" l ON a."leadId" = l.id
WHERE l.id IS NULL;

-- Should be 0
```

**Verify Indexes Created Correctly:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Lead';
```

**Check Application Functionality:**
- Run smoke tests
- Verify critical workflows
- Check API endpoints
- Validate business logic

**Monitor Performance:**
- Query performance
- Application response times
- Database CPU/memory usage
- Index usage

### 4.4 Automated Verification

**Verification Script:**
```typescript
async function verifyMigration() {
  // Check record counts
  const leadCount = await db.lead.count();
  if (leadCount !== expectedCount) {
    throw new Error('Record count mismatch');
  }
  
  // Check data integrity
  const orphanedActivities = await db.activity.count({
    where: {
      lead: null
    }
  });
  if (orphanedActivities > 0) {
    throw new Error('Orphaned records found');
  }
  
  // Check business logic
  const revenue = await calculateRevenue();
  if (revenue !== expectedRevenue) {
    throw new Error('Revenue calculation mismatch');
  }
  
  console.log('Migration verified successfully');
}
```

### 4.5 Monitoring After Migration

**24-Hour Monitoring:**
- Monitor error rates
- Monitor performance metrics
- Monitor user feedback
- Monitor database health

**Key Metrics:**
- Application error rate
- API response times
- Database query times
- User activity levels
- Background job success rate

**Alert Thresholds:**
- Error rate > 1%: Investigate
- Response time > 2x baseline: Investigate
- Database CPU > 80%: Investigate
- User complaints: Investigate

---

## 5. Migration Observability

### 5.1 Migration Logging

**Log Migration Events:**
```typescript
await audit.log({
  eventType: 'migration.started',
  migrationName: 'add_lead_score',
  startedAt: new Date(),
  startedBy: userId
});

await audit.log({
  eventType: 'migration.completed',
  migrationName: 'add_lead_score',
  completedAt: new Date(),
  duration: durationMs,
  recordsAffected: count
});
```

### 5.2 Migration Metrics

**Track:**
- Migration duration
- Records affected
- Lock time
- Performance impact
- Error rate during migration

### 5.3 Migration Alerts

**Alert On:**
- Migration duration > expected
- Lock time > threshold
- Performance degradation > 20%
- Error rate increase > 1%

---

## 6. Acceptance Criteria

### 6.1 Migration Safety

- [ ] All migrations backward compatible
- [ ] Expand-contract pattern used for breaking changes
- [ ] Migrations tested in staging
- [ ] Rollback plan documented
- [ ] Backup created before migration
- [ ] Migration scheduled appropriately
- [ ] Team notified of migration

### 6.2 Data Integrity

- [ ] Pre-migration checks completed
- [ ] During-migration monitoring active
- [ ] Post-migration verification completed
- [ ] Record counts verified
- [ ] Data integrity constraints verified
- [ ] Application functionality verified
- [ ] Performance verified

### 6.3 Observability

- [ ] Migration events logged
- [ ] Migration metrics tracked
- [ ] Alerts configured
- [ ] Monitoring active post-migration
- [ ] 24-hour monitoring completed

---

## 7. References

- Stage 5: Data Model
- Stage 11: Database and Data Integrity Test Plan
- PostgreSQL Documentation: Migrations, Indexes, Locks

---

**Document Status:** Recorded  
**Owner:** Backend Lead / DBA
