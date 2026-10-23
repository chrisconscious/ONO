import { Document } from './types';

export const stage3Doc3: Document = {
  id: 'engineering-standards',
  number: 3,
  title: 'Engineering Standards',
  shortTitle: 'Engineering Standards',
  description: 'Code quality standards, TypeScript configuration, naming conventions, and enforceable development practices.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'ES-1',
      title: '1. TypeScript Configuration',
      content: `**Strict TypeScript (Enforced):**
\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleResolution": "bundler"
  }
}
\`\`\`

**Prohibited Patterns:**
- No \`any\` type (use \`unknown\` and type guards)
- No \`@ts-ignore\` or \`@ts-nocheck\` (use \`@ts-expect-error\` with justification)
- No type assertions (\`as\`) without validation
- No non-null assertions (\`!\`) without explicit null checks
- No implicit any in function parameters

**Type Safety Practices:**
- Use Zod for runtime validation, TypeScript for compile-time
- Define explicit return types for all functions
- Use discriminated unions for state machines
- Prefer interfaces for object shapes, types for unions/intersections
- Use branded types for IDs and sensitive values
- Leverage template literal types for pattern matching`
    },
    {
      id: 'ES-2',
      title: '2. Code Organization and Naming',
      content: `**File Naming:**
- PascalCase for React components: \`LeadForm.tsx\`
- kebab-case for utilities: \`format-currency.ts\`
- camelCase for hooks: \`use-auth.ts\`
- .test.ts/.test.tsx for test files
- .schema.ts for Zod schemas
- .types.ts for TypeScript types

**Directory Naming:**
- kebab-case for directories: \`purchase-orders/\`
- Group by feature, not by type
- Keep related files together

**Variable and Function Naming:**
- camelCase for variables and functions
- PascalCase for types, interfaces, classes, enums
- UPPER_SNAKE_CASE for constants
- Descriptive names over abbreviations
- Boolean variables: \`isLoading\`, \`hasPermission\`, \`canEdit\`
- Functions: verb + noun (\`createLead\`, \`calculateTotal\`, \`validateEmail\`)

**Component Naming:**
- PascalCase for components: \`LeadCard\`
- Prefix with module for shared components: \`CrmLeadCard\`
- Suffix with purpose: \`LeadForm\`, \`LeadList\`, \`LeadDetail\`

**Database and API Naming:**
- snake_case for database columns: \`created_at\`, \`organization_id\`
- camelCase for API request/response fields: \`createdAt\`, \`organizationId\`
- Transform at API boundary (repository ↔ API)`
    },
    {
      id: 'ES-3',
      title: '3. Error Handling',
      content: `**Error Classes:**
\`\`\`typescript
// Base application error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(\`\${resource} not found\`, 'NOT_FOUND', 404, { resource, id });
  }
}

class ForbiddenError extends AppError {
  constructor(action: string, resource: string) {
    super(\`Forbidden: cannot \${action} \${resource}\`, 'FORBIDDEN', 403, { action, resource });
  }
}

class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 'VALIDATION_ERROR', 400, { errors });
  }
}

class TenantIsolationError extends AppError {
  constructor() {
    super('Tenant isolation violation', 'TENANT_ISOLATION', 403);
  }
}
\`\`\`

**Error Handling Patterns:**
- Throw specific error types, not generic Error
- Catch and handle errors at appropriate boundaries
- Log errors with context (user, tenant, operation)
- Return user-friendly messages, not stack traces
- Never expose internal details in API responses
- Use Result types for expected failures (validation, business rules)

**API Error Response:**
\`\`\`typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}
\`\`\``
    },
    {
      id: 'ES-4',
      title: '4. Validation and Security',
      content: `**Input Validation:**
- Validate all external inputs at API boundary
- Use Zod schemas for request/response validation
- Never trust client-side validation alone
- Sanitize data before database insertion
- Escape data before rendering in HTML

**Zod Schema Example:**
\`\`\`typescript
import { z } from 'zod';

const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  companyId: z.string().uuid().optional(),
  source: z.enum(['website', 'referral', 'cold_call', 'event']).optional(),
});

type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

// Usage in API route
async function createLead(input: unknown) {
  const validated = CreateLeadSchema.parse(input);
  // validated is now typed as CreateLeadInput
  // ... business logic
}
\`\`\`

**Security Practices:**
- Parameterize all database queries (Prisma does this automatically)
- Escape HTML output (React does this by default)
- Validate file uploads (type, size, content)
- Rate limit sensitive endpoints
- Use HTTPS in production
- Implement CSRF protection
- Sanitize logs (no passwords, tokens, PII)

**Dependency Management:**
- Review all new dependencies before adding
- Prefer well-maintained, popular packages
- Check for known vulnerabilities (npm audit)
- Pin major versions in package.json
- Update dependencies regularly (Dependabot/Renovate)`
    },
    {
      id: 'ES-5',
      title: '5. Testing Standards',
      content: `**Test Organization:**
- Unit tests: Co-located with source (\`service.test.ts\`)
- Integration tests: In module \`tests/\` directory
- E2E tests: In root \`tests/e2e/\` directory
- Test utilities: In \`tests/fixtures/\` or \`tests/utils/\`

**Test Naming:**
\`\`\`typescript
describe('LeadService', () => {
  describe('createLead', () => {
    it('should create a lead with valid data', () => {
      // ...
    });

    it('should throw ValidationError for invalid email', () => {
      // ...
    });

    it('should enforce tenant isolation', () => {
      // ...
    });
  });
});
\`\`\`

**Test Coverage Requirements:**
- Business logic: 90%+ coverage
- API routes: 80%+ coverage
- Critical paths (auth, permissions, tenant isolation): 100%
- UI components: Focus on behavior, not implementation

**Test Data:**
- Use factories for test data creation
- Never use real customer data
- Clear test data between tests
- Use transactions for test isolation
- Seed data clearly marked as demo/test

**Mocking Guidelines:**
- Mock external services (email, payment, AI)
- Don't mock database (use test database)
- Don't mock internal services (test integration)
- Use dependency injection for testability`
    },
    {
      id: 'ES-6',
      title: '6. Code Review and Documentation',
      content: `**Code Review Checklist:**
- [ ] Code follows naming conventions
- [ ] No \`any\` types or unsafe assertions
- [ ] Input validation at API boundaries
- [ ] Error handling is appropriate
- [ ] Tests added/updated for changes
- [ ] No hardcoded secrets or credentials
- [ ] Database queries are parameterized
- [ ] Tenant isolation enforced
- [ ] Permissions checked
- [ ] Audit logging for sensitive operations
- [ ] Documentation updated if needed
- [ ] No unnecessary dependencies added

**Documentation Requirements:**
- README.md for each module
- JSDoc comments for public APIs
- Architecture Decision Records for significant changes
- API documentation (auto-generated from Zod schemas)
- Runbooks for operational procedures

**Commit Message Format:**
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

Types: feat, fix, docs, style, refactor, test, chore
Scope: module name (crm, sales, finance, etc.)
Subject: imperative mood, lowercase, no period
Body: explain what and why, not how
Footer: breaking changes, issue references

**Example:**
\`\`\`
feat(crm): add lead scoring automation

Implement automatic lead scoring based on engagement metrics
and company size. Scores are calculated daily via background job.

- Add LeadScore model and calculation service
- Create background job for daily score updates
- Add score display to lead detail page

Closes #123
\`\`\``
    }
  ]
};

export const stage3Doc4: Document = {
  id: 'testing-strategy',
  number: 4,
  title: 'Testing Strategy',
  shortTitle: 'Testing Strategy',
  description: 'Layered testing approach covering unit, integration, E2E, security, and reliability tests.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'TS-1',
      title: '1. Testing Pyramid',
      content: `**Test Layers:**

**Unit Tests (70% of tests):**
- Fast, isolated, no external dependencies
- Test individual functions, classes, business rules
- Run on every code change
- Tools: Vitest

**Integration Tests (20% of tests):**
- Test interactions between components
- Database operations, API endpoints, service calls
- Use test database and services
- Tools: Vitest + test containers

**End-to-End Tests (10% of tests):**
- Test complete user workflows
- Browser-based, realistic scenarios
- Slower, run on PR and before deployment
- Tools: Playwright

**Security Tests (Ongoing):**
- Tenant isolation tests
- Authorization tests
- Input validation tests
- Injection tests
- Run as part of integration suite

**Performance Tests (Periodic):**
- Load testing for critical paths
- Query performance monitoring
- Run in staging environment
- Tools: k6, Lighthouse`
    },
    {
      id: 'TS-2',
      title: '2. Unit Testing',
      content: `**What to Unit Test:**
- Business logic and calculations
- Validation schemas
- Permission evaluation
- Data transformations
- Utility functions
- State machines and workflows

**Unit Test Example:**
\`\`\`typescript
import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from './lead-scoring';

describe('calculateLeadScore', () => {
  it('should return high score for engaged enterprise lead', () => {
    const lead = {
      companySize: 'enterprise',
      emailOpened: 5,
      demoRequested: true,
      industry: 'technology',
    };

    const score = calculateLeadScore(lead);

    expect(score).toBeGreaterThan(80);
  });

  it('should return low score for inactive lead', () => {
    const lead = {
      companySize: 'small',
      emailOpened: 0,
      demoRequested: false,
      industry: 'retail',
    };

    const score = calculateLeadScore(lead);

    expect(score).toBeLessThan(30);
  });

  it('should handle missing optional fields', () => {
    const lead = {
      companySize: 'medium',
    };

    const score = calculateLeadScore(lead);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
\`\`\`

**Unit Test Best Practices:**
- One assertion per test (or one logical concept)
- Descriptive test names
- Arrange-Act-Assert pattern
- Test edge cases and error conditions
- No test interdependencies
- Fast execution (< 100ms per test)`
    },
    {
      id: 'TS-3',
      title: '3. Integration Testing',
      content: `**What to Integration Test:**
- API endpoints (request → response)
- Database operations (CRUD, transactions)
- Service interactions (module → module)
- Authentication and authorization flows
- Tenant isolation
- Event publishing and handling

**Integration Test Example:**
\`\`\`typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testDb, testClient } from '../test-utils';
import { createLead } from './leads/service';

describe('Lead API Integration', () => {
  beforeAll(async () => {
    await testDb.setup();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  it('should create lead and enforce tenant isolation', async () => {
    // Setup: Create two tenants
    const tenant1 = await testDb.createTenant();
    const tenant2 = await testDb.createTenant();
    const user1 = await testDb.createUser(tenant1.id);
    const user2 = await testDb.createUser(tenant2.id);

    // Act: User1 creates a lead
    const lead = await createLead(
      { name: 'Test Lead', email: 'test@example.com' },
      { userId: user1.id, tenantId: tenant1.id }
    );

    // Assert: Lead belongs to tenant1
    expect(lead.organizationId).toBe(tenant1.id);

    // Assert: User2 cannot access tenant1's lead
    await expect(
      getLead(lead.id, { userId: user2.id, tenantId: tenant2.id })
    ).rejects.toThrow('Forbidden');
  });

  it('should publish lead.created event', async () => {
    const tenant = await testDb.createTenant();
    const user = await testDb.createUser(tenant.id);

    const lead = await createLead(
      { name: 'Test Lead' },
      { userId: user.id, tenantId: tenant.id }
    );

    const events = await testDb.getEvents('lead.created');
    expect(events).toHaveLength(1);
    expect(events[0].aggregate.id).toBe(lead.id);
    expect(events[0].organizationId).toBe(tenant.id);
  });
});
\`\`\`

**Test Database Strategy:**
- Separate test database (clickit_test)
- Reset between test suites (not individual tests)
- Use transactions for test isolation where possible
- Seed minimal data for each test
- Clear data after test suite completes`
    },
    {
      id: 'TS-4',
      title: '4. End-to-End Testing',
      content: `**What to E2E Test:**
- Complete user workflows (lead → opportunity → order)
- Authentication and onboarding
- Multi-step forms and validations
- Dashboard navigation and drill-downs
- Responsive design across breakpoints
- Accessibility (keyboard navigation, screen readers)

**E2E Test Example (Playwright):**
\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Lead Management Workflow', () => {
  test('should create, qualify, and convert a lead', async ({ page }) => {
    // Arrange: Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Act: Create lead
    await page.click('[data-testid="create-lead-button"]');
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="company"]', 'Acme Corp');
    await page.click('[data-testid="save-lead-button"]');

    // Assert: Lead created
    await expect(page.locator('[data-testid="lead-name"]')).toHaveText('John Doe');

    // Act: Qualify lead
    await page.click('[data-testid="qualify-lead-button"]');
    await page.click('[data-testid="confirm-qualify-button"]');

    // Assert: Lead qualified
    await expect(page.locator('[data-testid="lead-status"]')).toHaveText('Qualified');

    // Act: Convert to opportunity
    await page.click('[data-testid="convert-to-opportunity-button"]');
    await page.fill('[name="opportunityName"]', 'Acme Corp Deal');
    await page.fill('[name="value"]', '50000');
    await page.click('[data-testid="confirm-convert-button"]');

    // Assert: Opportunity created
    await expect(page).toHaveURL(/\\/opportunities\\/.*/);
    await expect(page.locator('[data-testid="opportunity-name"]')).toHaveText('Acme Corp Deal');
  });

  test('should be accessible via keyboard', async ({ page }) => {
    await page.goto('/leads');

    // Navigate with Tab
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Open create form with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="create-lead-form"]')).toBeVisible();
  });
});
\`\`\`

**E2E Test Strategy:**
- Test critical user journeys only (not every feature)
- Use data-testid attributes for stable selectors
- Run in CI on PR and before deployment
- Run in multiple browsers (Chromium, Firefox, WebKit)
- Test responsive breakpoints (mobile, tablet, desktop)
- Include accessibility checks (axe-core)`
    },
    {
      id: 'TS-5',
      title: '5. Security Testing',
      content: `**Tenant Isolation Tests:**
\`\`\`typescript
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access via API', async () => {
    const tenant1 = await createTenant();
    const tenant2 = await createTenant();
    const lead = await createLead(tenant1.id);

    // Attempt to access tenant1's lead as tenant2
    const response = await apiClient.get(\`/leads/\${lead.id}\`, {
      headers: { Authorization: tenant2.token }
    });

    expect(response.status).toBe(403);
  });

  it('should prevent cross-tenant data access via database', async () => {
    const tenant1 = await createTenant();
    const tenant2 = await createTenant();
    const lead = await createLead(tenant1.id);

    // Attempt to query tenant1's lead with tenant2 context
    await db.setTenantContext(tenant2.id);
    const result = await db.lead.findUnique({ where: { id: lead.id } });

    expect(result).toBeNull();
  });
});
\`\`\`

**Authorization Tests:**
\`\`\`typescript
describe('Authorization', () => {
  it('should prevent unauthorized users from approving expenses', async () => {
    const user = await createUser({ role: 'employee' });
    const expense = await createExpense({ amount: 5000 });

    await expect(
      approveExpense(expense.id, { userId: user.id })
    ).rejects.toThrow(ForbiddenError);
  });

  it('should enforce data scope permissions', async () => {
    const manager = await createUser({ role: 'manager', scope: 'team' });
    const otherTeamLead = await createLead({ teamId: 'other-team' });

    const leads = await getLeads({ userId: manager.id });

    expect(leads.find(l => l.id === otherTeamLead.id)).toBeUndefined();
  });
});
\`\`\`

**Input Validation Tests:**
- SQL injection attempts
- XSS payload attempts
- Path traversal attempts
- Oversized payloads
- Invalid data types
- Missing required fields

**Security Test Automation:**
- Run security tests in CI on every PR
- Use OWASP ZAP for automated security scanning
- Perform manual penetration testing quarterly
- Review dependencies for known vulnerabilities weekly`
    },
    {
      id: 'TS-6',
      title: '6. Test Infrastructure',
      content: `**Test Utilities:**
\`\`\`typescript
// tests/utils/test-db.ts
export const testDb = {
  async setup() {
    // Reset test database
    await db.$executeRaw\`TRUNCATE TABLE leads, contacts, companies CASCADE\`;
  },

  async teardown() {
    await db.$disconnect();
  },

  async createTenant() {
    return db.organization.create({
      data: { name: 'Test Tenant', slug: \`test-\${Date.now()}\` }
    });
  },

  async createUser(tenantId: string, role: string = 'admin') {
    return db.user.create({
      data: {
        email: \`user-\${Date.now()}@test.com\`,
        organizationId: tenantId,
        role
      }
    });
  },

  async getEvents(eventType: string) {
    return db.domainEvent.findMany({
      where: { eventType },
      orderBy: { createdAt: 'desc' }
    });
  }
};

// tests/utils/factories.ts
export const leadFactory = {
  create(overrides: Partial<Lead> = {}): Lead {
    return {
      id: uuid(),
      name: 'Test Lead',
      email: 'lead@test.com',
      organizationId: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }
};
\`\`\`

**Test Configuration:**
\`\`\`typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.ts'
      ]
    }
  }
});
\`\`\`

**Test Execution:**
\`\`\`bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test leads.test.ts

# Run tests matching pattern
pnpm test -- --grep "tenant isolation"

# Run in watch mode
pnpm test -- --watch

# Run E2E tests
pnpm test:e2e
\`\`\``
    }
  ]
};
