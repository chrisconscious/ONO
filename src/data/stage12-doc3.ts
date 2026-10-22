import { Document } from './types';

export const stage12Doc3: Document = {
  id: 'cicd-deployment-release',
  number: 3,
  title: 'CI/CD Deployment and Release Strategy',
  shortTitle: 'CI/CD & Release',
  description: 'Continuous integration, continuous deployment, release management, and deployment strategies.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.3.1',
      title: '1. CI/CD Pipeline Overview',
      content: `**Pipeline Stages:**

\`\`\`
Code Commit
    ↓
1. Code Review & Approval
    ↓
2. Static Analysis & Linting
    ↓
3. Type Checking
    ↓
4. Unit Tests
    ↓
5. Integration Tests
    ↓
6. Security Scans
    ↓
7. Build Verification
    ↓
8. Deploy to Staging
    ↓
9. Smoke Tests
    ↓
10. Manual QA Validation
    ↓
11. Production Approval
    ↓
12. Deploy to Production
    ↓
13. Post-Deployment Monitoring
\`\`\`

**Pipeline Tools:**

**Option A: GitHub Actions (Recommended)**
- Native GitHub integration
- YAML-based configuration
- Extensive marketplace
- Good for Next.js deployments
- Cost: Free for public repos, paid for private

**Option B: GitLab CI/CD**
- Self-hosted or SaaS
- Advanced features
- Good for complex workflows
- Cost: Free tier available, paid for advanced

**Option C: CircleCI / Travis CI**
- Mature platforms
- Good documentation
- Cost: Free tier, paid for scale

**Recommendation:** GitHub Actions for simplicity and integration.

**Pipeline Triggers:**
- Push to main: Full pipeline
- Pull request: Build + test (no deploy)
- Manual: Production deployment
- Scheduled: Nightly builds, dependency updates`
    },
    {
      id: '12.3.2',
      title: '2. Branch and Release Strategy',
      content: `**Branching Model:**

**Option A: GitHub Flow (Recommended for small team)**
\`\`\`
main (production)
  ↓
feature-branch → PR → review → merge → auto-deploy to staging
  ↓
manual approval → deploy to production
\`\`\`

**Pros:** Simple, fast, continuous deployment
**Cons:** Less control, requires good testing
**Use case:** Small team, rapid iteration

**Option B: Git Flow**
\`\`\`
main (production)
  ↓
develop (integration)
  ↓
feature-branches → merge to develop → release branch → main
\`\`\`

**Pros:** Structured, clear release cycles
**Cons:** Complex, slower
**Use case:** Large team, scheduled releases

**Option C: Trunk-Based Development**
\`\`\`
main (always deployable)
  ↓
short-lived feature branches → merge → auto-deploy
\`\`\`

**Pros:** Fast, continuous delivery
**Cons:** Requires excellent testing
**Use case:** Mature team, high automation

**Recommendation:** GitHub Flow for initial deployment, evolve to Git Flow if release cycles needed.

**Version Numbering:**

**Semantic Versioning (SemVer):**
\`\`\`
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)

Examples:
1.0.0 → Initial release
1.1.0 → New feature added
1.1.1 → Bug fix
2.0.0 → Breaking change
\`\`\`

**Release Types:**

**1. Major Release**
- Breaking changes
- New major features
- Quarterly or as needed
- Full regression testing
- Migration guide required

**2. Minor Release**
- New features (backward compatible)
- Enhancements
- Monthly or bi-weekly
- Standard testing
- Release notes

**3. Patch Release**
- Bug fixes
- Security patches
- As needed (critical) or weekly
- Focused testing
- Minimal documentation

**4. Hotfix**
- Critical bug fix
- Security vulnerability
- Immediate deployment
- Focused testing
- Post-mortem required`
    },
    {
      id: '12.3.3',
      title: '3. Deployment Strategies',
      content: `**Strategy 1: Rolling Deployment (Recommended for initial)**

**How it works:**
- Replace instances gradually
- Old and new versions run simultaneously
- Traffic shifts gradually
- Rollback by deploying old version

**Pros:**
- Zero downtime
- Simple to implement
- Lower resource cost
- Gradual rollout

**Cons:**
- Both versions must be compatible
- Slower than blue-green
- Complex rollback if stateful

**Use case:** Stateless applications, initial deployment

**Strategy 2: Blue-Green Deployment**

**How it works:**
- Two identical environments (blue and green)
- One active (blue), one idle (green)
- Deploy new version to green
- Test green environment
- Switch traffic from blue to green
- Rollback by switching back

**Pros:**
- Instant rollback
- Zero downtime
- Full testing before switch
- Simple mental model

**Cons:**
- Double infrastructure cost
- Database schema compatibility
- Complex for stateful services

**Use case:** Critical applications, enterprise requirements

**Strategy 3: Canary Deployment**

**How it works:**
- Deploy new version to small subset (canary)
- Monitor canary closely
- Gradually increase traffic
- Rollback if issues detected

**Pros:**
- Early problem detection
- Low risk
- Real user testing
- Gradual rollout

**Cons:**
- Complex traffic management
- Requires good monitoring
- Longer deployment time
- Complex rollback

**Use case:** Large scale, risk-averse deployments

**Recommendation:** Rolling deployment for initial, evolve to blue-green for critical services.

**Database Migration Strategy:**

**Expand-Contract Pattern:**
\`\`\`
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
\`\`\`

**Migration Safety:**
- Always backward compatible initially
- Test migrations in staging
- Have rollback plan
- Monitor during migration
- Document migration steps`
    },
    {
      id: '12.3.4',
      title: '4. Deployment Pipeline Details',
      content: `**Stage 1: Code Review & Approval**

**Pull Request Requirements:**
- At least 1 approval (2 for critical changes)
- All CI checks passing
- No merge conflicts
- Description and context provided
- Tests included for new features

**Review Checklist:**
- [ ] Code follows style guide
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Backward compatibility maintained

**Stage 2: Static Analysis & Linting**

**Tools:**
- ESLint: JavaScript/TypeScript linting
- Prettier: Code formatting
- Stylelint: CSS linting (if applicable)

**Checks:**
- Code style compliance
- Formatting consistency
- Common anti-patterns
- Security vulnerabilities (static analysis)

**Stage 3: Type Checking**

**Tool:** TypeScript compiler (tsc --noEmit)

**Checks:**
- Type safety
- No implicit any
- Strict null checks
- No unused variables

**Stage 4: Unit Tests**

**Tool:** Vitest

**Coverage:**
- Business logic: 80% minimum
- Utilities: 90% minimum
- Critical paths: 95% minimum

**Stage 5: Integration Tests**

**Tool:** Vitest with test containers

**Coverage:**
- API endpoints
- Database operations
- External integrations (mocked)
- Workflow logic

**Stage 6: Security Scans**

**Tools:**
- npm audit: Dependency vulnerabilities
- Snyk: Advanced vulnerability scanning
- OWASP ZAP: Web application security
- Custom tenant isolation tests

**Stage 7: Build Verification**

**Checks:**
- Application builds successfully
- All assets generated
- Bundle size within limits
- No build warnings

**Stage 8: Deploy to Staging**

**Process:**
1. Build production artifacts
2. Deploy to staging environment
3. Run database migrations
4. Verify deployment health
5. Run smoke tests

**Stage 9: Smoke Tests**

**Tests:**
- Application starts successfully
- Health check passes
- Critical user journeys work
- API endpoints respond
- Database connections work

**Stage 10: Manual QA Validation**

**Validation:**
- Feature testing
- Regression testing
- Performance testing
- Security testing
- Accessibility testing

**Stage 11: Production Approval**

**Approvers:**
- Engineering lead
- Product owner
- QA lead
- Operations lead (for major releases)

**Stage 12: Deploy to Production**

**Process:**
1. Create deployment tag
2. Build production artifacts
3. Deploy to production (rolling)
4. Run database migrations
5. Verify deployment health
6. Run smoke tests
7. Monitor for issues

**Stage 13: Post-Deployment Monitoring**

**Monitoring:**
- Error rates
- Response times
- User feedback
- System health
- Business metrics

**Duration:** 24 hours intensive, 7 days elevated`
    },
    {
      id: '12.3.5',
      title: '5. Rollback Procedures',
      content: `**Rollback Triggers:**
- Error rate > 5% for 5 minutes
- Response time > 2x baseline for 5 minutes
- Critical bug discovered
- Security vulnerability found
- Data corruption detected
- User complaints spike

**Rollback Decision:**
\`\`\`
Issue detected
    ↓
Assess severity
    ↓
Can we fix forward? (quick fix available)
    ├─ Yes → Deploy hotfix
    └─ No → Rollback
    ↓
Execute rollback
    ↓
Verify recovery
    ↓
Investigate root cause
    ↓
Deploy fixed version
\`\`\`

**Rollback Methods:**

**Method 1: Redeploy Previous Version**
- Identify last known good version
- Redeploy that version
- Run smoke tests
- Monitor recovery

**Method 2: Blue-Green Switch**
- Switch traffic back to blue environment
- Verify recovery
- Investigate green environment

**Method 3: Feature Flag Disable**
- Disable problematic feature
- Verify recovery
- Fix feature and re-enable

**Rollback Safety:**
- Database migrations must be reversible
- Feature flags for risky changes
- Automated rollback on health check failure
- Document rollback procedures
- Test rollback in staging

**Rollback Communication:**
1. Declare incident
2. Notify stakeholders
3. Execute rollback
4. Verify recovery
5. Communicate resolution
6. Schedule post-mortem`
    },
    {
      id: '12.3.6',
      title: '6. Release Documentation',
      content: `**Release Notes Template:**

\`\`\`markdown
# Release v1.2.0

**Release Date:** 2026-01-29
**Release Type:** Minor Release

## 🎉 New Features
- Feature 1: Description
- Feature 2: Description

## 🚀 Enhancements
- Enhancement 1: Description
- Enhancement 2: Description

## 🐛 Bug Fixes
- Fix 1: Description (Issue #123)
- Fix 2: Description (Issue #456)

## ⚠️ Breaking Changes
- Change 1: Description
  - Migration: Steps to migrate

## 🔒 Security
- Security fix 1: Description

## 📊 Performance
- Performance improvement 1: Description

## 📝 Documentation
- Doc update 1: Description

## 🔄 Upgrade Instructions
1. Step 1
2. Step 2
3. Step 3

## 🐛 Known Issues
- Issue 1: Description, workaround: X
- Issue 2: Description, workaround: Y

## 📞 Support
- Contact: support@clickit.com
- Documentation: https://docs.clickit.com
\`\`\`

**Changelog Maintenance:**
- Auto-generate from git commits
- Categorize by type (feat, fix, docs, etc.)
- Link to issues and PRs
- Review before release
- Publish to documentation site

**Release Communication:**
- Email to customers (for major releases)
- In-app notification
- Status page update
- Social media (if applicable)
- Internal announcement`
    }
  ]
};
