import { Document } from './types';

export const stage11Doc1: Document = {
  id: 'quality-assurance-testing-strategy',
  number: 1,
  title: 'Quality Assurance and Testing Strategy',
  shortTitle: 'QA Strategy',
  description: 'Comprehensive testing strategy covering all layers from unit tests to production smoke testing.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.1.1',
      title: 'Testing Layers',
      content: `**19 Testing Layers:**

1. Requirements and acceptance criteria review
2. Static analysis and type checking
3. Unit testing (80% coverage minimum)
4. Component testing
5. Integration testing
6. API contract testing
7. Database and transaction testing
8. Workflow testing
9. End-to-end testing
10. Security testing (release-blocking)
11. Performance and load testing
12. Accessibility testing (WCAG 2.2 AA)
13. AI/ML evaluation
14. Data quality verification
15. Backup and recovery testing
16. Regression testing
17. User acceptance testing
18. Production smoke testing

**Execution Schedule:**
- Every commit: Static analysis, unit tests, security scans
- Every PR: Integration tests, contract tests, tenant isolation
- Before release: E2E tests, performance tests, UAT
- Quarterly: Penetration testing, load testing, backup testing`
    }
  ]
};

export const stage11Doc2: Document = {
  id: 'requirements-traceability',
  number: 2,
  title: 'Requirements Traceability and Verification Matrix',
  shortTitle: 'Traceability Matrix',
  description: 'Complete traceability from requirements to test cases with verification status.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.2.1',
      title: 'Traceability Framework',
      content: `**Traceability Matrix Fields:**
- Requirement ID
- Requirement description
- Source document
- Acceptance criteria
- Test level
- Test case ID
- Test data
- Expected result
- Status (Planned/Implemented/Executed/Passed/Failed/Blocked)
- Owner
- Last verified

**Coverage Targets:**
- Critical requirements: 100% coverage
- High priority: 95% coverage
- Medium priority: 90% coverage
- Low priority: 80% coverage

**Status Definitions:**
- Planned: Requirement identified, test not written
- Implemented: Test written, not executed
- Executed: Test executed, result pending
- Passed: Test passed
- Failed: Test failed
- Blocked: Cannot execute (missing dependency)
- Waived: Not required (with justification)`
    }
  ]
};

export const stage11Doc3: Document = {
  id: 'functional-business-rule-test-plan',
  number: 3,
  title: 'Functional and Business Rule Test Plan',
  shortTitle: 'Functional Test Plan',
  description: 'Test plan for verifying functional correctness and business rule compliance.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.3.1',
      title: 'Test Categories',
      content: `**CRUD Operations:**
- Create with valid/invalid data
- Read with filters, sorting, pagination
- Update with optimistic locking
- Delete with cascade rules

**Business Rules:**
- Validation rules (email, phone, dates)
- Workflow rules (status transitions)
- Calculation rules (totals, taxes)
- Authorization rules (permissions, scope)

**Integration Rules:**
- Event publication and consumption
- Job execution and idempotency
- Webhook processing
- External API integration

**Test Scenarios by Module:**
- CRM: Lead management, contact management
- Sales: Opportunity pipeline, quotations, orders
- Finance: Invoices, payments, expenses
- Inventory: Stock management, purchase orders
- Projects: Project management, tasks
- Support: Case management, SLA tracking`
    }
  ]
};

export const stage11Doc4: Document = {
  id: 'security-tenant-isolation-test-plan',
  number: 4,
  title: 'Security and Tenant Isolation Test Plan',
  shortTitle: 'Security Test Plan',
  description: 'Test plan for verifying security controls and tenant isolation (release-blocking).',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.4.1',
      title: 'Critical Security Tests',
      content: `**Tenant Isolation Tests (Release-Blocking):**
- Cross-tenant record access via API
- Cross-tenant database queries
- Cross-tenant background jobs
- Cross-tenant file access
- Cross-tenant analytics
- Cross-tenant AI operations

**Authorization Tests:**
- Permission enforcement on all operations
- Data scope enforcement (own/team/department/org)
- Approval workflow enforcement
- Self-approval prevention
- Role change during session

**Security Vulnerability Tests:**
- SQL injection prevention
- XSS prevention
- CSRF protection
- File upload security
- Path traversal prevention
- Prompt injection prevention (AI)

**Release Criteria:**
- 100% tenant isolation tests must pass
- No critical/high security vulnerabilities
- All authorization tests pass
- Security penetration test passed`
    }
  ]
};

export const stage11Doc5: Document = {
  id: 'database-data-integrity-test-plan',
  number: 5,
  title: 'Database and Data Integrity Test Plan',
  shortTitle: 'Database Test Plan',
  description: 'Test plan for verifying database schema, constraints, transactions, and data integrity.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.5.1',
      title: 'Database Tests',
      content: `**Schema Tests:**
- Primary key constraints
- Foreign key constraints
- Unique constraints
- Check constraints
- Not null constraints
- Index performance

**Transaction Tests:**
- Atomicity (all or nothing)
- Concurrent updates (optimistic locking)
- Race conditions
- Rollback behavior

**Migration Tests:**
- Forward migration safety
- Rollback migration safety
- Migration on existing data
- Data preservation

**Data Integrity Tests:**
- Referential integrity
- Financial reconciliation
- Inventory reconciliation
- Audit trail completeness

**Acceptance Criteria:**
- All constraints verified
- Transactions are atomic
- Concurrency handled correctly
- Migrations are safe
- Data integrity maintained`
    }
  ]
};

export const stage11Doc6: Document = {
  id: 'analytics-data-quality-test-plan',
  number: 6,
  title: 'Analytics and Data Quality Test Plan',
  shortTitle: 'Analytics Test Plan',
  description: 'Test plan for verifying analytics calculations, data quality, and reporting accuracy.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.6.1',
      title: 'Analytics Tests',
      content: `**KPI Calculation Tests:**
- Revenue calculation accuracy
- Conversion rate accuracy
- Average deal size accuracy
- Time-based aggregation correctness
- Dimensional aggregation correctness

**Data Quality Tests:**
- Completeness checks (≥95%)
- Accuracy checks (≥99% for financial)
- Consistency checks
- Timeliness checks
- Uniqueness checks

**Reconciliation Tests:**
- Source-to-report reconciliation
- Cross-module reconciliation
- Financial reconciliation
- Inventory reconciliation

**Report Tests:**
- Report calculation accuracy
- Report performance
- Report formatting
- Export accuracy

**Acceptance Criteria:**
- All KPI formulas verified
- Data quality checks passing
- Reconciliation complete
- Reports accurate and performant`
    }
  ]
};

export const stage11Doc7: Document = {
  id: 'ai-ml-evaluation-test-plan',
  number: 7,
  title: 'AI/ML Evaluation and Regression Test Plan',
  shortTitle: 'AI/ML Test Plan',
  description: 'Test plan for evaluating AI/ML model quality, accuracy, safety, and regression testing.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.7.1',
      title: 'AI/ML Tests',
      content: `**Model Evaluation Tests:**
- Prediction accuracy meets thresholds
- Model fairness within bounds
- Calibration accurate
- Inference latency within targets

**LLM Evaluation Tests:**
- Factual correctness verified
- Evidence citation quality
- Prompt injection resistance
- Authorization compliance

**Regression Tests:**
- Model performance regression
- Prompt change regression
- Training data regression
- Integration regression

**Safety Tests:**
- No hallucinations or fabrications
- No unauthorized data access
- No prompt injection success
- No authorization bypass

**Acceptance Criteria:**
- Model accuracy meets thresholds
- LLM outputs factually correct
- Prompt injection prevented
- Authorization enforced
- No regression in quality`
    }
  ]
};

export const stage11Doc8: Document = {
  id: 'api-integration-background-job-test-plan',
  number: 8,
  title: 'API, Integration, and Background Job Test Plan',
  shortTitle: 'Integration Test Plan',
  description: 'Test plan for verifying APIs, integrations, events, and background jobs.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.8.1',
      title: 'Integration Tests',
      content: `**API Tests:**
- Request/response contracts
- Authentication and authorization
- Performance within targets
- Rate limiting enforcement
- Error handling

**Event Tests:**
- Event publication on state changes
- Event consumption correctness
- Idempotent processing
- Duplicate event handling
- At-least-once delivery

**Background Job Tests:**
- Job execution correctness
- Job idempotency
- Job failure handling
- Job retry logic
- Dead-letter queue

**Webhook Tests:**
- Signature verification
- Replay protection
- Payload validation
- Error handling

**Acceptance Criteria:**
- All API contracts verified
- Authentication and authorization enforced
- Events published and consumed correctly
- Background jobs idempotent
- Integrations working correctly`
    }
  ]
};

export const stage11Doc9: Document = {
  id: 'performance-capacity-test-plan',
  number: 9,
  title: 'Performance and Capacity Test Plan',
  shortTitle: 'Performance Test Plan',
  description: 'Test plan for verifying system performance, scalability, and capacity.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.9.1',
      title: 'Performance Tests',
      content: `**Performance Targets:**
- API response time: < 500ms (p95)
- Dashboard load time: < 2 seconds
- Report generation: < 10 seconds
- Support 1000+ concurrent users
- 99.9% uptime

**Load Tests:**
- Sustained load (80% capacity, 1 hour)
- Peak load (150% capacity, 15 minutes)
- Spike load (sudden increase)

**Capacity Tests:**
- User capacity (1000 concurrent users)
- Data capacity (10 million records)
- Storage capacity (1 TB data)

**Scalability Tests:**
- Horizontal scalability (add servers)
- Vertical scalability (increase resources)

**Acceptance Criteria:**
- API response time < 500ms (p95)
- Dashboard load time < 2s
- Support 1000 concurrent users
- No performance degradation under load
- System scales horizontally and vertically`
    }
  ]
};

export const stage11Doc10: Document = {
  id: 'reliability-disaster-recovery-test-plan',
  number: 10,
  title: 'Reliability and Disaster Recovery Test Plan',
  shortTitle: 'Reliability Test Plan',
  description: 'Test plan for verifying system reliability, resilience, and disaster recovery.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.10.1',
      title: 'Reliability Tests',
      content: `**Reliability Tests:**
- System availability (99.9% uptime)
- Database failure recovery
- Application server failure recovery
- Network failure recovery

**Backup and Recovery Tests:**
- Backup creation and integrity
- Full restore from backup
- Point-in-time restore
- Recovery time objective (RTO) < 4 hours
- Recovery point objective (RPO) < 1 hour

**Resilience Tests:**
- Random server termination
- Network latency injection
- Disk full simulation
- Chaos engineering

**Acceptance Criteria:**
- System availability > 99.9%
- Backups created and verified daily
- Restore tested quarterly
- RTO < 4 hours
- RPO < 1 hour
- System recovers from failures automatically
- No data loss during failures`
    }
  ]
};

export const stage11Doc11: Document = {
  id: 'ui-ux-accessibility-compatibility-test-plan',
  number: 11,
  title: 'UI/UX, Accessibility, and Compatibility Test Plan',
  shortTitle: 'UI/UX Test Plan',
  description: 'Test plan for verifying UI/UX quality, accessibility compliance, and browser/device compatibility.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.11.1',
      title: 'UI/UX Tests',
      content: `**UI/UX Tests:**
- Visual consistency with design system
- Responsive design (mobile, tablet, desktop)
- User interactions (buttons, forms, navigation)
- State management (loading, error, empty)

**Accessibility Tests (WCAG 2.2 AA):**
- Keyboard navigation
- Screen reader compatibility
- Color contrast (≥4.5:1 for text)
- Form accessibility (labels, errors)
- Focus management
- ARIA attributes

**Browser Compatibility Tests:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Android Chrome

**Acceptance Criteria:**
- Visual design consistent
- Responsive design works on all screen sizes
- WCAG 2.2 AA compliant
- Keyboard navigation works
- Screen reader compatible
- Works on all supported browsers
- Works on mobile devices`
    }
  ]
};

export const stage11Doc12: Document = {
  id: 'test-data-environment-management',
  number: 12,
  title: 'Test Data and Environment Management',
  shortTitle: 'Test Data Management',
  description: 'Strategies for managing test data and test environments.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.12.1',
      title: 'Test Data Strategy',
      content: `**Synthetic Data Generation:**
- Use factories and fixtures
- Generate realistic but fake data
- Cover all business scenarios
- Include edge cases

**Data Anonymization:**
- Anonymize PII (names, emails, phones)
- Mask sensitive financial data
- Remove identifying information
- Verify anonymization effective

**Test Data Isolation:**
- Each test run uses isolated data
- Data cleaned up after tests
- No cross-test contamination
- Tenant-isolated fixtures

**Test Environments:**
- Development: Local with Docker Compose
- Testing: Isolated with synthetic data
- Staging: Production-like with anonymized data
- Production: Live with real data (smoke tests only)

**Acceptance Criteria:**
- Synthetic data generation implemented
- Data anonymization process defined
- Test data isolation enforced
- All environments provisioned
- Configuration management implemented`
    }
  ]
};

export const stage11Doc13: Document = {
  id: 'ci-cd-quality-gates-release-approval',
  number: 13,
  title: 'CI/CD Quality Gates and Release Approval',
  shortTitle: 'CI/CD Gates',
  description: 'Quality gates in CI/CD pipeline and release approval process.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.13.1',
      title: 'Quality Gates',
      content: `**Pre-Commit Gates:**
- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)

**Pre-Merge Gates:**
- Unit tests pass (80% coverage)
- Integration tests pass
- Security scan (no critical/high vulnerabilities)
- Tenant isolation tests pass

**Pre-Release Gates:**
- End-to-end tests pass
- Performance tests pass
- Accessibility tests pass
- AI evaluation passes
- Security penetration test passes

**Release Approval Gate:**
- All gates passed
- UAT sign-off obtained
- Documentation complete
- Release notes prepared
- Rollback plan documented

**Exception Process:**
- Document exception request
- Assess risk
- Get approval from Release Manager
- Document in release notes
- Plan fix for next release

**Critical Exceptions (Never Allowed):**
- Tenant isolation failures
- Security vulnerabilities (critical/high)
- Data integrity issues
- Financial calculation errors`
    }
  ]
};

export const stage11Doc14: Document = {
  id: 'defect-management-release-readiness',
  number: 14,
  title: 'Defect Management and Release Readiness',
  shortTitle: 'Defect Management',
  description: 'Defect management process and release readiness criteria.',
  status: 'Recorded',
  stage: 11,
  sections: [
    {
      id: '11.14.1',
      title: 'Defect Lifecycle',
      content: `**Defect States:**
Reported → Triage → Assigned → In Progress → Fixed → Verified → Closed

**Defect Severity:**
- Critical (S1): System crash, data loss, security breach, financial errors
  - SLA: Fix within 24 hours, blocks release
- High (S2): Major functionality broken, performance degradation >50%
  - SLA: Fix within 3 days, blocks release
- Medium (S3): Minor functionality broken, UI/UX issues
  - SLA: Fix within 1 week, may release with known issues
- Low (S4): Cosmetic issues, documentation errors
  - SLA: Fix within 2 weeks, release with known issues

**Release Readiness Criteria:**
- All critical and high defects resolved
- All security tests passed
- All tenant isolation tests passed
- All critical workflow tests passed
- Performance within targets
- Accessibility compliant
- UAT sign-off obtained
- Documentation complete
- Release notes prepared
- Rollback plan documented

**Post-Release Monitoring:**
- Application health checks
- Error rates within normal range
- Performance metrics within targets
- User feedback monitored
- Defect tracker monitored

**Rollback Criteria:**
- Critical defects discovered in production
- Performance degradation > 50%
- Security vulnerability discovered
- Data corruption detected
- User impact significant`
    }
  ]
};

export const stage11Docs: Document[] = [
  stage11Doc1,
  stage11Doc2,
  stage11Doc3,
  stage11Doc4,
  stage11Doc5,
  stage11Doc6,
  stage11Doc7,
  stage11Doc8,
  stage11Doc9,
  stage11Doc10,
  stage11Doc11,
  stage11Doc12,
  stage11Doc13,
  stage11Doc14
];
