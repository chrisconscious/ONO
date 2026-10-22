import { Document } from './types';

export const stage3Doc1: Document = {
  id: 'repository-structure',
  number: 1,
  title: 'Repository Structure Plan',
  shortTitle: 'Repository Structure',
  description: 'Proposed directory tree, responsibilities, and organizational principles for the ClickIT platform codebase.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'RS-1',
      title: '1. Repository Overview',
      content: `**Repository Strategy:** Monorepo with clear module boundaries.

**Rationale (per ADR-001):**
- Modular monolith approach — single repository, clear module boundaries
- Shared types and validation schemas between frontend and backend
- Simplified dependency management and versioning
- Easier code review and cross-module refactoring
- Can extract services later without repository restructuring

**Key Principles:**
- Each business module is a self-contained directory with its own types, services, and tests
- Shared infrastructure lives in dedicated directories
- No circular imports between modules
- Clear separation between application code, configuration, and documentation
- Generated files (types, migrations) are clearly marked and excluded from manual editing`
    },
    {
      id: 'RS-2',
      title: '2. Proposed Directory Tree',
      content: `\`\`\`
clickit-platform/
│
├── apps/                           # Deployable applications
│   ├── web/                        # Next.js application (frontend + API routes)
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/            # Authentication routes
│   │   │   ├── (dashboard)/       # Main application routes
│   │   │   ├── api/               # API route handlers
│   │   │   └── layout.tsx         # Root layout
│   │   ├── components/            # App-specific components
│   │   ├── lib/                   # App-specific utilities
│   │   └── public/                # Static assets
│   │
│   ├── workers/                    # Background job workers
│   │   ├── src/
│   │   │   ├── jobs/              # Job definitions
│   │   │   ├── queues/            # Queue consumers
│   │   │   └── index.ts           # Worker entry point
│   │   └── package.json
│   │
│   └── ml-services/               # Python ML services
│       ├── training/              # Model training scripts
│       ├── serving/               # FastAPI inference service
│       ├── features/              # Feature engineering
│       ├── notebooks/             # Exploration notebooks
│       └── requirements.txt
│
├── packages/                       # Shared packages (internal)
│   ├── database/                   # Database client, schema, migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Prisma schema
│   │   │   └── migrations/        # Version-controlled migrations
│   │   ├── src/
│   │   │   ├── client.ts          # Prisma client wrapper
│   │   │   ├── tenant.ts          # Tenant context management
│   │   │   └── seed/              # Seed data scripts
│   │   └── package.json
│   │
│   ├── auth/                       # Authentication & authorization
│   │   ├── src/
│   │   │   ├── session.ts         # Session management
│   │   │   ├── permissions.ts     # Permission evaluation
│   │   │   ├── rbac.ts            # Role-based access control
│   │   │   └── middleware.ts      # Auth middleware
│   │   └── package.json
│   │
│   ├── api-contracts/              # Shared API types and validation
│   │   ├── src/
│   │   │   ├── schemas/           # Zod validation schemas
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   └── events/            # Domain event types
│   │   └── package.json
│   │
│   ├── ui/                         # Shared UI component library
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── hooks/             # Shared hooks
│   │   │   ├── styles/            # Design tokens, Tailwind config
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── analytics/                  # Business intelligence & analytics
│   │   ├── src/
│   │   │   ├── metrics/           # Metric definitions
│   │   │   ├── calculations/      # Calculation engines
│   │   │   └── pipelines/         # Data transformation
│   │   └── package.json
│   │
│   └── infrastructure/             # Cross-cutting services
│       ├── src/
│       │   ├── audit/             # Audit logging
│       │   ├── notifications/     # Notification service
│       │   ├── storage/           # File storage service
│       │   ├── cache/             # Caching service
│       │   ├── queue/             # Job queue service
│       │   └── search/            # Search service
│       └── package.json
│
├── modules/                        # Business modules
│   ├── organization/               # Organization & tenant management
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── services/
│   │   │   ├── api/
│   │   │   └── index.ts
│   │   └── tests/
│   │
│   ├── crm/                        # CRM module
│   │   ├── src/
│   │   │   ├── leads/
│   │   │   ├── contacts/
│   │   │   ├── companies/
│   │   │   └── activities/
│   │   └── tests/
│   │
│   ├── sales/                      # Sales module
│   │   ├── src/
│   │   │   ├── opportunities/
│   │   │   ├── quotations/
│   │   │   ├── orders/
│   │   │   └── pipeline/
│   │   └── tests/
│   │
│   ├── finance/                    # Finance module
│   │   ├── src/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── expenses/
│   │   │   └── budgets/
│   │   └── tests/
│   │
│   ├── inventory/                  # Inventory & procurement
│   │   ├── src/
│   │   │   ├── products/
│   │   │   ├── stock/
│   │   │   ├── suppliers/
│   │   │   └── purchase-orders/
│   │   └── tests/
│   │
│   ├── projects/                   # Projects & operations
│   │   ├── src/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── milestones/
│   │   │   └── workflows/
│   │   └── tests/
│   │
│   ├── hr/                         # Workforce & HR
│   │   ├── src/
│   │   │   ├── employees/
│   │   │   ├── assignments/
│   │   │   └── workforce/
│   │   └── tests/
│   │
│   ├── support/                    # Customer support
│   │   ├── src/
│   │   │   ├── cases/
│   │   │   ├── sla/
│   │   │   └── resolutions/
│   │   └── tests/
│   │
│   ├── documents/                  # Document management
│   │   ├── src/
│   │   │   ├── documents/
│   │   │   ├── attachments/
│   │   │   └── versions/
│   │   └── tests/
│   │
│   ├── strategy/                   # Strategy & KPIs
│   │   ├── src/
│   │   │   ├── objectives/
│   │   │   ├── kpis/
│   │   │   └── reviews/
│   │   └── tests/
│   │
│   ├── intelligence/               # Inference & decision engine
│   │   ├── src/
│   │   │   ├── recommendations/
│   │   │   ├── decisions/
│   │   │   ├── orchestrator/
│   │   │   └── outcomes/
│   │   └── tests/
│   │
│   └── industry/                   # Industry configuration
│       ├── src/
│       │   ├── catalogue/
│       │   ├── profiles/
│       │   ├── custom-fields/
│       │   └── extensions/
│       └── tests/
│
├── tests/                          # Cross-module and E2E tests
│   ├── e2e/                        # End-to-end tests
│   ├── integration/                # Integration tests
│   ├── security/                   # Security tests
│   └── fixtures/                   # Test data and factories
│
├── scripts/                        # Development and deployment scripts
│   ├── setup.sh                    # Environment setup
│   ├── dev.sh                      # Local development
│   ├── test.sh                     # Test runner
│   ├── migrate.sh                  # Database migrations
│   └── deploy.sh                   # Deployment scripts
│
├── docs/                           # Documentation
│   ├── architecture/               # Architecture decisions
│   ├── api/                        # API documentation
│   ├── modules/                    # Module documentation
│   ├── runbooks/                   # Operational procedures
│   └── adr/                        # Architecture Decision Records
│
├── .github/                        # GitHub configuration
│   ├── workflows/                  # CI/CD workflows
│   ├── CODEOWNERS                  # Code ownership
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docker/                         # Docker configuration
│   ├── Dockerfile.web
│   ├── Dockerfile.workers
│   ├── Dockerfile.ml
│   └── docker-compose.yml          # Local development
│
├── .env.example                    # Environment variable template
├── .gitignore
├── .editorconfig
├── package.json                    # Root package.json (workspaces)
├── pnpm-workspace.yaml             # Monorepo workspace config
├── turbo.json                      # Turborepo config (if used)
├── tsconfig.json                   # Root TypeScript config
├── tsconfig.base.json              # Shared TS config
├── eslint.config.js                # ESLint configuration
├── prettier.config.js              # Prettier configuration
└── README.md
\`\`\``
    },
    {
      id: 'RS-3',
      title: '3. Directory Responsibilities',
      content: `**apps/** — Deployable Applications
- Each subdirectory is an independently deployable service
- web: Next.js application (frontend + API routes + server actions)
- workers: Background job processing (Node.js)
- ml-services: Python ML training and inference services

**packages/** — Shared Internal Packages
- database: Prisma schema, migrations, client wrapper, tenant context
- auth: Authentication, session management, permission evaluation
- api-contracts: Shared Zod schemas, TypeScript types, event definitions
- ui: Reusable UI components (design system)
- analytics: Metric definitions, calculation engines, data pipelines
- infrastructure: Cross-cutting services (audit, notifications, storage, cache, queue, search)

**modules/** — Business Modules
- Each module is self-contained with its own types, services, API, and tests
- Modules depend on packages/ but not on each other directly
- Cross-module communication through events or shared packages
- Module boundaries enforced by import restrictions

**tests/** — Cross-Cutting Tests
- e2e: Full user journey tests (Playwright or similar)
- integration: Multi-module integration tests
- security: Tenant isolation, authorization, injection tests
- fixtures: Shared test data factories

**scripts/** — Development Tooling
- Shell scripts for common development tasks
- Setup, development, testing, migration, deployment

**docs/** — Documentation
- Architecture decisions and diagrams
- API documentation
- Module-specific documentation
- Operational runbooks

**docker/** — Containerization
- Dockerfiles for each service
- Docker Compose for local development environment

**Root Configuration Files:**
- package.json: Workspace root, shared scripts
- pnpm-workspace.yaml: Monorepo workspace definition
- tsconfig.json: Root TypeScript configuration
- eslint.config.js: Shared linting rules
- prettier.config.js: Code formatting rules`
    },
    {
      id: 'RS-4',
      title: '4. Module Internal Structure',
      content: `**Standard Module Layout:**
\`\`\`
modules/crm/
├── src/
│   ├── types.ts              # Module-specific types
│   ├── index.ts              # Public API exports
│   ├── leads/
│   │   ├── types.ts          # Lead entity types
│   │   ├── schemas.ts        # Zod validation schemas
│   │   ├── service.ts        # Business logic
│   │   ├── repository.ts     # Data access
│   │   ├── api.ts            # API route handlers
│   │   └── events.ts         # Domain events
│   ├── contacts/
│   │   └── ... (same structure)
│   └── companies/
│       └── ... (same structure)
├── tests/
│   ├── leads.test.ts
│   ├── contacts.test.ts
│   └── companies.test.ts
└── README.md                  # Module documentation
\`\`\`

**Layer Separation Within Modules:**
- types.ts: TypeScript interfaces and types
- schemas.ts: Zod validation schemas (runtime validation)
- service.ts: Business logic, orchestration, rules
- repository.ts: Database queries (Prisma client usage)
- api.ts: HTTP request/response handling
- events.ts: Domain event definitions and publishing

**Import Rules:**
- API layer can import from service, repository, types
- Service layer can import from repository, types
- Repository layer can import from types only
- No circular imports within module
- No direct imports from other modules (use events or shared packages)`
    },
    {
      id: 'RS-5',
      title: '5. Shared Package Structure',
      content: `**Example: packages/database/**
\`\`\`
packages/database/
├── prisma/
│   ├── schema.prisma          # Complete database schema
│   ├── migrations/
│   │   ├── 20240101_init/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── seed.ts                # Seed data script
├── src/
│   ├── client.ts              # Prisma client singleton
│   ├── tenant.ts              # Tenant context (setTenant, getTenant)
│   ├── transaction.ts         # Transaction helpers
│   └── index.ts               # Public exports
├── tests/
│   ├── tenant.test.ts
│   └── transaction.test.ts
└── package.json
\`\`\`

**Example: packages/auth/**
\`\`\`
packages/auth/
├── src/
│   ├── session.ts             # Session creation, validation, refresh
│   ├── permissions.ts         # Permission evaluation engine
│   ├── rbac.ts                # Role-based access control
│   ├── abac.ts                # Attribute-based access control
│   ├── middleware.ts          # Express/Next.js middleware
│   ├── decorators.ts          # Authorization decorators
│   └── index.ts
├── tests/
│   ├── permissions.test.ts
│   ├── rbac.test.ts
│   └── middleware.test.ts
└── package.json
\`\`\`

**Example: packages/api-contracts/**
\`\`\`
packages/api-contracts/
├── src/
│   ├── schemas/
│   │   ├── lead.schema.ts     # Zod schemas for leads
│   │   ├── invoice.schema.ts  # Zod schemas for invoices
│   │   └── common.schema.ts   # Shared schemas (pagination, etc.)
│   ├── types/
│   │   ├── lead.types.ts      # TypeScript types for leads
│   │   ├── invoice.types.ts   # TypeScript types for invoices
│   │   └── api.types.ts       # API request/response types
│   ├── events/
│   │   ├── crm.events.ts      # CRM domain events
│   │   ├── sales.events.ts    # Sales domain events
│   │   └── event.types.ts     # Event type definitions
│   └── index.ts
├── tests/
│   └── schemas.test.ts
└── package.json
\`\`\``
    },
    {
      id: 'RS-6',
      title: '6. Configuration and Tooling',
      content: `**Root package.json (Workspace):**
\`\`\`json
{
  "name": "clickit-platform",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "modules/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "playwright test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write .",
    "db:migrate": "pnpm --filter @clickit/database prisma migrate dev",
    "db:seed": "pnpm --filter @clickit/database prisma db seed",
    "db:studio": "pnpm --filter @clickit/database prisma studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.7.0"
  }
}
\`\`\`

**pnpm-workspace.yaml:**
\`\`\`yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'modules/*'
\`\`\`

**turbo.json (Turborepo):**
\`\`\`json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
\`\`\`

**Tooling Choices:**
- Package manager: pnpm (fast, disk-efficient, strict dependency resolution)
- Build orchestration: Turborepo (monorepo task runner with caching)
- TypeScript: Strict mode, project references
- Linting: ESLint with TypeScript plugin
- Formatting: Prettier
- Testing: Vitest (unit/integration), Playwright (E2E)
- Database: Prisma (schema, migrations, client)`
    }
  ]
};

export const stage3Doc2: Document = {
  id: 'development-environment',
  number: 2,
  title: 'Development Environment Plan',
  shortTitle: 'Dev Environment',
  description: 'Local development setup, runtime versions, services, environment variables, and onboarding procedures.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'DE-1',
      title: '1. Required Runtime Versions',
      content: `**Node.js and Package Management:**
- Node.js: 20.x LTS (Long Term Support)
- pnpm: 9.x (recommended for monorepo efficiency)
- npm: 10.x (fallback, not preferred)

**Python (for ML services):**
- Python: 3.11+ (for ML training and inference services)
- pip: Latest stable
- virtualenv or pyenv for environment isolation

**Database:**
- PostgreSQL: 15+ (with Row-Level Security support)
- Redis: 7+ (for caching and job queues)

**Development Tools:**
- Git: 2.40+
- Docker: 24+ (for containerized services)
- Docker Compose: 2.20+

**Version Management:**
- Use .nvmrc for Node.js version
- Use .python-version for Python version
- Document exact versions in README.md
- CI should validate versions match`
    },
    {
      id: 'DE-2',
      title: '2. Local Services with Docker Compose',
      content: `**docker-compose.yml (Development):**
\`\`\`yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: clickit_dev
      POSTGRES_PASSWORD: \${DB_PASSWORD:-dev_password_change_me}
      POSTGRES_DB: clickit_development
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clickit_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: clickit_test
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: clickit_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"

volumes:
  postgres_data:
\`\`\`

**Service Ports:**
- PostgreSQL (dev): localhost:5432
- PostgreSQL (test): localhost:5433
- Redis (dev): localhost:6379
- Redis (test): localhost:6380
- Next.js app: localhost:3000
- ML services: localhost:8000

**Starting Services:**
\`\`\`bash
# Start development services
docker-compose up -d

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
pnpm db:migrate
pnpm db:seed
\`\`\``
    },
    {
      id: 'DE-3',
      title: '3. Environment Variables',
      content: `**.env.example (Template — No Real Secrets):**
\`\`\`bash
# Database
DATABASE_URL="postgresql://clickit_dev:dev_password_change_me@localhost:5432/clickit_development"
DATABASE_URL_TEST="postgresql://clickit_test:test_password@localhost:5433/clickit_test"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_URL_TEST="redis://localhost:6380"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_SECRET="dev_secret_change_me_in_production"

# Authentication (provider-specific)
# AUTH_PROVIDER="nextauth"  # or "clerk", "auth0", etc.
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="dev_nextauth_secret"

# File Storage
STORAGE_PROVIDER="local"  # or "s3", "r2"
STORAGE_LOCAL_PATH="./uploads"
# STORAGE_S3_BUCKET=""
# STORAGE_S3_REGION=""
# STORAGE_S3_ACCESS_KEY=""
# STORAGE_S3_SECRET_KEY=""

# Email (development)
EMAIL_PROVIDER="console"  # Logs emails to console in dev
# EMAIL_PROVIDER="smtp"
# SMTP_HOST=""
# SMTP_PORT=""
# SMTP_USER=""
# SMTP_PASSWORD=""

# ML Services
ML_SERVICE_URL="http://localhost:8000"

# Monitoring (development)
LOG_LEVEL="debug"
ENABLE_TELEMETRY="false"
\`\`\`

**Environment Variable Management:**
- .env.example: Template with placeholder values (committed to repo)
- .env.local: Local overrides (gitignored, never committed)
- .env.test: Test environment variables (committed if safe)
- Production secrets: Managed via cloud provider secrets manager
- Never commit real credentials, API keys, or production secrets

**Loading Order (Next.js):**
1. .env (default values)
2. .env.local (local overrides)
3. .env.development / .env.production (environment-specific)
4. Process environment (system variables)`
    },
    {
      id: 'DE-4',
      title: '4. Initial Setup Procedure',
      content: `**Step 1: Clone and Install**
\`\`\`bash
git clone <repository-url>
cd clickit-platform

# Install Node.js dependencies
pnpm install

# Install Python dependencies (for ML services)
cd apps/ml-services
python -m venv venv
source venv/bin/activate  # or 'venv\\Scripts\\activate' on Windows
pip install -r requirements.txt
cd ../..
\`\`\`

**Step 2: Configure Environment**
\`\`\`bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your local settings
# (defaults should work for most cases)
\`\`\`

**Step 3: Start Services**
\`\`\`bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
\`\`\`

**Step 4: Database Setup**
\`\`\`bash
# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# (Optional) Open Prisma Studio to explore data
pnpm db:studio
\`\`\`

**Step 5: Start Development Servers**
\`\`\`bash
# Start all development servers
pnpm dev

# Or start individually:
pnpm --filter @clickit/web dev      # Next.js app
pnpm --filter @clickit/workers dev  # Background workers
cd apps/ml-services && python serving/main.py  # ML service
\`\`\`

**Step 6: Verify Setup**
- Open http://localhost:3000 in browser
- Should see authentication page
- Login with seeded test credentials
- Verify dashboard loads`
    },
    {
      id: 'DE-5',
      title: '5. Development Commands',
      content: `**Common Commands:**
\`\`\`bash
# Development
pnpm dev                    # Start all dev servers
pnpm --filter @clickit/web dev          # Start web app only
pnpm --filter @clickit/workers dev      # Start workers only

# Building
pnpm build                  # Build all packages and apps
pnpm --filter @clickit/web build        # Build web app only

# Testing
pnpm test                   # Run all tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only
pnpm test:e2e               # End-to-end tests (Playwright)
pnpm --filter @clickit/crm test         # Test specific module

# Code Quality
pnpm lint                   # Run ESLint on all code
pnpm lint:fix               # Auto-fix linting issues
pnpm format                 # Format code with Prettier
pnpm typecheck              # TypeScript type checking

# Database
pnpm db:migrate             # Run pending migrations
pnpm db:migrate:create      # Create new migration
pnpm db:seed                # Seed development data
pnpm db:reset               # Reset database (drop + migrate + seed)
pnpm db:studio              # Open Prisma Studio

# Docker
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
\`\`\`

**Testing Specific Scenarios:**
\`\`\`bash
# Run tests for a specific module
pnpm --filter @clickit/crm test

# Run tests matching a pattern
pnpm test -- --grep "tenant isolation"

# Run tests with coverage
pnpm test -- --coverage

# Run E2E tests in headed mode
pnpm test:e2e -- --headed
\`\`\``
    },
    {
      id: 'DE-6',
      title: '6. Troubleshooting and Onboarding',
      content: `**Common Issues:**

**Issue: Database connection failed**
- Check Docker services are running: \`docker-compose ps\`
- Verify DATABASE_URL in .env.local
- Check PostgreSQL is accepting connections on port 5432

**Issue: Port already in use**
- Check what's using the port: \`lsof -i :3000\` (or other port)
- Stop conflicting services or change port in .env.local

**Issue: Migration errors**
- Ensure database is running and accessible
- Check for pending migrations: \`pnpm db:migrate:status\`
- Reset database if needed: \`pnpm db:reset\`

**Issue: Module not found errors**
- Run \`pnpm install\` to ensure all dependencies installed
- Check workspace configuration in pnpm-workspace.yaml
- Verify package.json names match workspace paths

**Issue: TypeScript errors**
- Run \`pnpm typecheck\` to see all errors
- Ensure all packages are built: \`pnpm build\`
- Check tsconfig.json paths configuration

**Onboarding Documentation:**
- README.md: Quick start guide
- docs/getting-started.md: Detailed setup instructions
- docs/architecture/overview.md: System architecture
- docs/modules/README.md: Module documentation index
- CONTRIBUTING.md: Contribution guidelines
- CODE_OF_CONDUCT.md: Community standards

**Developer Experience Improvements:**
- VS Code workspace settings (.vscode/settings.json)
- Recommended extensions (.vscode/extensions.json)
- Git hooks for pre-commit checks (Husky + lint-staged)
- EditorConfig for consistent formatting (.editorconfig)`
    }
  ]
};
