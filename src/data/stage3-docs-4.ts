import { Document } from './types';

export const stage3Doc7: Document = {
  id: 'security-engineering',
  number: 7,
  title: 'Security Engineering Controls',
  shortTitle: 'Security Controls',
  description: 'Development controls for tenant isolation, authorization, secure coding, and security testing.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'SEC-1',
      title: '1. Tenant Isolation Controls',
      content: `**Development Controls for Tenant Isolation:**

**1. Database Level (RLS):**
- Every tenant-scoped table has RLS enabled
- RLS policy uses \`current_setting('app.current_tenant')\`
- Tenant context set on every database connection
- Automated tests verify RLS on all tenant tables

**2. Application Level (Middleware):**
\`\`\`typescript
// packages/auth/src/middleware.ts
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = await getSession(req);

  if (!session?.organizationId) {
    throw new UnauthorizedError();
  }

  // Set tenant context for database
  await db.setTenantContext(session.organizationId);

  // Attach to request
  req.tenantId = session.organizationId;
  req.userId = session.userId;

  next();
}
\`\`\`

**3. Service Level (Explicit Checks):**
\`\`\`typescript
// Every service method includes tenant check
async function getLead(id: string, context: AuthContext) {
  const lead = await db.lead.findFirst({
    where: {
      id,
      organizationId: context.tenantId  // Explicit filter
    }
  });

  if (!lead) throw new NotFoundError();
  return lead;
}
\`\`\`

**4. Testing:**
\`\`\`typescript
// Automated tenant isolation tests
describe('Tenant Isolation', () => {
  const entities = ['Lead', 'Contact', 'Opportunity', 'Invoice', 'Order'];

  for (const entity of entities) {
    it(\`should isolate \${entity} between tenants\`, async () => {
      const tenant1 = await createTenant();
      const tenant2 = await createTenant();
      const record = await createRecord(entity, tenant1.id);

      // Attempt cross-tenant access
      await expect(
        getRecord(entity, record.id, tenant2.id)
      ).rejects.toThrow();
    });
  }
});
\`\`\``
    },
    {
      id: 'SEC-2',
      title: '2. Authorization Controls',
      content: `**Authorization Development Controls:**

**1. Permission Definitions:**
\`\`\`typescript
// packages/auth/src/permissions.ts
export const PERMISSIONS = {
  // CRM
  'crm:lead:create': { description: 'Create leads', resource: 'lead' },
  'crm:lead:read': { description: 'View leads', resource: 'lead' },
  'crm:lead:update': { description: 'Edit leads', resource: 'lead' },
  'crm:lead:delete': { description: 'Delete leads', resource: 'lead' },

  // Finance
  'finance:invoice:approve': { description: 'Approve invoices', resource: 'invoice' },
  'finance:expense:approve': { description: 'Approve expenses', resource: 'expense' },

  // ... all permissions defined here
} as const;

export type Permission = keyof typeof PERMISSIONS;
\`\`\`

**2. Authorization Middleware:**
\`\`\`typescript
// Require permission for route
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hasPermission = await checkPermission(
      req.userId,
      permission,
      req.tenantId
    );

    if (!hasPermission) {
      throw new ForbiddenError(permission, req.path);
    }

    next();
  };
}

// Usage
app.post('/api/leads',
  requirePermission('crm:lead:create'),
  createLeadHandler
);
\`\`\`

**3. Data Scope Enforcement:**
\`\`\`typescript
// Apply data scope to queries
export function applyScope<T>(
  query: Prisma.Query,
  user: User,
  scope: DataScope
): Prisma.Query {
  switch (scope) {
    case 'own':
      return { ...query, where: { ...query.where, createdById: user.id } };
    case 'team':
      return { ...query, where: { ...query.where, teamId: { in: user.teamIds } } };
    case 'department':
      return { ...query, where: { ...query.where, departmentId: { in: user.departmentIds } } };
    case 'branch':
      return { ...query, where: { ...query.where, branchId: { in: user.branchIds } } };
    case 'organization':
      return query;  // Already filtered by tenant
  }
}
\`\`\`

**4. Testing:**
- Test every permission check
- Test multi-role permission resolution
- Test data scope enforcement
- Test approval workflows
- Test self-approval prevention`
    },
    {
      id: 'SEC-3',
      title: '3. Input Validation and Output Encoding',
      content: `**Input Validation Controls:**

**1. API Boundary Validation:**
\`\`\`typescript
// Every API route validates input
import { CreateLeadSchema } from '@clickit/api-contracts';

export async function createLeadHandler(req: Request) {
  // Validate input
  const input = CreateLeadSchema.parse(await req.json());

  // Input is now type-safe and validated
  const lead = await createLead(input, req.auth);

  return Response.json(lead);
}
\`\`\`

**2. File Upload Validation:**
\`\`\`typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function validateFileUpload(file: File) {
  // Check type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError({ file: ['Invalid file type'] });
  }

  // Check size
  if (file.size > MAX_SIZE) {
    throw new ValidationError({ file: ['File too large'] });
  }

  // Scan for viruses (using ClamAV or similar)
  const scanResult = await virusScanner.scan(file);
  if (!scanResult.clean) {
    throw new ValidationError({ file: ['File contains malware'] });
  }
}
\`\`\`

**3. SQL Injection Prevention:**
- Use Prisma ORM (parameterized queries by default)
- Never concatenate user input into SQL
- Use prepared statements for raw queries
- Test with SQL injection payloads

**4. XSS Prevention:**
- React escapes output by default
- Use \`dangerouslySetInnerHTML\` only with sanitized content
- Validate and sanitize user-generated content
- Use Content Security Policy headers

**5. Path Traversal Prevention:**
\`\`\`typescript
import path from 'path';

export function safeFilePath(basePath: string, userPath: string): string {
  const resolved = path.resolve(basePath, userPath);

  if (!resolved.startsWith(basePath)) {
    throw new ForbiddenError('Path traversal attempt');
  }

  return resolved;
}
\`\`\``
    },
    {
      id: 'SEC-4',
      title: '4. Secret Management',
      content: `**Secret Management Controls:**

**1. Never Commit Secrets:**
\`\`\`gitignore
# .gitignore
.env
.env.local
.env.production
*.pem
*.key
service-account.json
\`\`\`

**2. Environment Variables:**
\`\`\`bash
# .env.example (committed, no real secrets)
DATABASE_URL="postgresql://user:password@localhost:5432/db"
APP_SECRET="change-me-in-production"

# .env.local (gitignored, real secrets)
DATABASE_URL="postgresql://user:REAL_PASSWORD@prod-host:5432/db"
APP_SECRET="actual-production-secret"
\`\`\`

**3. Production Secrets:**
- Use cloud provider secrets manager (AWS Secrets Manager, GCP Secret Manager)
- Inject via environment variables at runtime
- Rotate secrets regularly (quarterly)
- Audit secret access
- Use different secrets per environment

**4. Secret Scanning:**
\`\`\`yaml
# .github/workflows/security.yml
- name: Secret Scanning
  uses: trufflesecurity/trufflehog@v3
  with:
    path: ./
    extra_args: --only-verified
\`\`\`

**5. API Key Management:**
\`\`\`typescript
// Hash API keys before storing
import { hash, verify } from 'argon2';

async function createApiKey(userId: string): Promise<string> {
  const rawKey = generateSecureRandomString(32);
  const hashedKey = await hash(rawKey);

  await db.apiKey.create({
    data: {
      userId,
      keyHash: hashedKey,
      name: 'My API Key',
      // Store prefix for identification only
      prefix: rawKey.slice(0, 8),
    }
  });

  // Return raw key once (user must save it)
  return rawKey;
}

async function validateApiKey(rawKey: string): Promise<User | null> {
  const keys = await db.apiKey.findMany();

  for (const key of keys) {
    if (await verify(key.keyHash, rawKey)) {
      return db.user.findUnique({ where: { id: key.userId } });
    }
  }

  return null;
}
\`\`\``
    },
    {
      id: 'SEC-5',
      title: '5. Audit Logging',
      content: `**Audit Logging Controls:**

**1. What to Log:**
- Authentication events (login, logout, failures)
- Authorization decisions (access granted, denied)
- Data modifications (create, update, delete)
- Approval decisions (approved, rejected)
- Administrative actions (role changes, config changes)
- Data exports and bulk operations
- AI/ML activities (predictions, recommendations, actions)

**2. Audit Log Structure:**
\`\`\`typescript
interface AuditLog {
  id: string;
  timestamp: string;
  organizationId: string;
  actor: {
    userId: string;
    userType: 'user' | 'system' | 'integration';
    ipAddress: string;
    userAgent: string;
  };
  action: string;
  resource: {
    type: string;
    id: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}
\`\`\`

**3. Audit Service:**
\`\`\`typescript
// packages/infrastructure/src/audit/service.ts
export class AuditService {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    await db.auditLog.create({
      data: {
        ...entry,
        id: uuid(),
        timestamp: new Date(),
      }
    });
  }

  // Convenience methods
  async logCreate(actor: AuthContext, resource: string, id: string, data: unknown) {
    await this.log({
      organizationId: actor.tenantId,
      actor: { userId: actor.userId, userType: 'user', ipAddress: actor.ip, userAgent: actor.userAgent },
      action: 'create',
      resource: { type: resource, id },
      changes: { after: data as Record<string, unknown> },
    });
  }

  async logUpdate(actor: AuthContext, resource: string, id: string, before: unknown, after: unknown) {
    await this.log({
      organizationId: actor.tenantId,
      actor: { userId: actor.userId, userType: 'user', ipAddress: actor.ip, userAgent: actor.userAgent },
      action: 'update',
      resource: { type: resource, id },
      changes: { before: before as Record<string, unknown>, after: after as Record<string, unknown> },
    });
  }
}
\`\`\`

**4. Usage in Services:**
\`\`\`typescript
async function createLead(input: CreateLeadInput, context: AuthContext) {
  const lead = await db.lead.create({ data: { ...input, organizationId: context.tenantId } });

  await audit.logCreate(context, 'Lead', lead.id, lead);

  return lead;
}
\`\`\`

**5. Audit Log Security:**
- Immutable (append-only, no update/delete)
- Tenant-scoped (organization can only see own logs)
- Retained per policy (minimum 7 years)
- Encrypted at rest
- Export available for compliance`
    },
    {
      id: 'SEC-6',
      title: '6. Security Testing in Development',
      content: `**Security Testing Controls:**

**1. Automated Security Tests:**
\`\`\`typescript
// tests/security/tenant-isolation.test.ts
describe('Tenant Isolation', () => {
  // Test every entity type
  const entities = ['Lead', 'Contact', 'Opportunity', 'Invoice', 'Order', 'Product'];

  for (const entity of entities) {
    it(\`should prevent cross-tenant access to \${entity}\`, async () => {
      // ... test implementation
    });
  }
});

// tests/security/authorization.test.ts
describe('Authorization', () => {
  it('should enforce permission checks on all API routes', async () => {
    // Test every API route without auth token
    const routes = ['/api/leads', '/api/contacts', '/api/invoices'];

    for (const route of routes) {
      const response = await fetch(route);
      expect(response.status).toBe(401);
    }
  });
});
\`\`\`

**2. Dependency Scanning:**
\`\`\`yaml
# .github/workflows/security.yml
name: Security

on: [push, pull_request, schedule: [{ cron: '0 0 * * 0' }]]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Audit dependencies
        run: pnpm audit --audit-level=high

      - name: Secret scanning
        uses: trufflesecurity/trufflehog@v3

      - name: CodeQL analysis
        uses: github/codeql-action/analyze@v2
\`\`\`

**3. OWASP Testing:**
- SQL injection (automated + manual)
- XSS (automated + manual)
- CSRF (verify protection on all forms)
- Authentication bypass
- Session management
- Error handling (no information leakage)
- Rate limiting verification

**4. Penetration Testing:**
- Quarterly manual penetration testing
- Automated scanning with OWASP ZAP
- Focus on tenant isolation
- Focus on authorization bypass
- Focus on data leakage

**5. Security Code Review:**
- Every PR reviewed for security implications
- Security-focused reviewers for auth/permissions code
- Automated security checks in CI
- Security training for all developers`
    }
  ]
};

export const stage3Doc8: Document = {
  id: 'ai-ml-devops',
  number: 8,
  title: 'AI/ML Development Operations Plan',
  shortTitle: 'AI/ML DevOps',
  description: 'Engineering controls for ML development, model versioning, inference services, and AI safety.',
  status: 'Recorded',
  stage: 3,
  sections: [
    {
      id: 'ML-1',
      title: '1. Separation of Concerns',
      content: `**Component Boundaries:**

**1. Business Rules Engine (TypeScript, Application Layer):**
- Deterministic rules (permissions, approvals, limits)
- 100% reliable, no uncertainty
- Cannot be overridden by ML
- Tested with unit tests

**2. Analytics Engine (TypeScript, Application Layer):**
- Metric calculations from verified data
- Documented formulas, traceable lineage
- Used for dashboards and reports
- Tested with integration tests

**3. ML Training (Python, Separate Service):**
- Dataset preparation and versioning
- Feature engineering
- Model training and evaluation
- Experiment tracking
- Batch processing, offline

**4. Model Serving (Python/FastAPI, Separate Service):**
- Real-time inference API
- Input validation
- Structured output with metadata
- Monitored for latency and accuracy

**5. Inference Orchestrator (TypeScript, Application Layer):**
- Coordinates analytics + models + rules
- Authorization-aware
- Evidence-based recommendations
- Uncertainty disclosure

**6. AI Assistant (TypeScript + LLM, Application Layer):**
- Natural language interface
- Authorized tool execution only
- Safety controls (prompt injection prevention)
- Sandboxed execution

**Communication:**
- TypeScript app ↔ Python ML: REST APIs
- TypeScript app ↔ LLM: API calls with safety controls
- All boundaries have typed contracts
- All AI outputs validated before use`
    },
    {
      id: 'ML-2',
      title: '2. Model and Dataset Versioning',
      content: `**Model Versioning:**
\`\`\`typescript
// packages/api-contracts/src/types/ml.types.ts
interface ModelVersion {
  id: string;
  modelId: string;
  version: string;          // Semantic version (1.2.3)
  status: 'training' | 'evaluating' | 'approved' | 'deployed' | 'deprecated';
  artifactUrl: string;      // Object storage URL
  trainingConfig: {
    algorithm: string;
    hyperparameters: Record<string, unknown>;
    datasetVersion: string;
    featureVersion: string;
  };
  evaluationResults: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    rmse?: number;
    custom: Record<string, number>;
  };
  deploymentCriteria: {
    minAccuracy?: number;
    maxLatencyMs?: number;
    requiresHumanApproval: boolean;
  };
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
}
\`\`\`

**Dataset Versioning:**
\`\`\`typescript
interface DatasetVersion {
  id: string;
  name: string;
  version: string;
  description: string;
  dataUrl: string;           // Object storage URL
  schema: Record<string, string>;
  rowCount: number;
  timeRange: { start: string; end: string };
  filters: Record<string, unknown>;
  qualityMetrics: {
    completeness: number;
    consistency: number;
    accuracy: number;
  };
  createdAt: string;
  createdBy: string;
}
\`\`\`

**Feature Versioning:**
\`\`\`typescript
interface FeatureDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  computation: string;       // Code or formula
  inputFeatures: string[];
  outputType: string;
  validation: {
    min?: number;
    max?: number;
    allowedValues?: unknown[];
  };
  createdAt: string;
}
\`\`\`

**Storage:**
- Model artifacts: Object storage (S3-compatible)
- Datasets: Object storage (Parquet files)
- Metadata: PostgreSQL database
- All versioned and immutable`
    },
    {
      id: 'ML-3',
      title: '3. Reproducible Training',
      content: `**Training Reproducibility:**

**1. Environment Pinning:**
\`\`\`
# apps/ml-services/requirements.txt
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
torch==2.0.1
mlflow==2.6.0
\`\`\`

**2. Random Seed Control:**
\`\`\`python
# apps/ml-services/training/utils.py
import numpy as np
import random
import torch

def set_seeds(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
\`\`\`

**3. Experiment Tracking:**
\`\`\`python
# apps/ml-services/training/train_lead_scoring.py
import mlflow
from utils import set_seeds

def train(dataset_version: str, feature_version: str):
    set_seeds(42)

    with mlflow.start_run():
        # Log parameters
        mlflow.log_param("dataset_version", dataset_version)
        mlflow.log_param("feature_version", feature_version)
        mlflow.log_param("algorithm", "random_forest")
        mlflow.log_param("n_estimators", 100)

        # Load data
        X_train, X_test, y_train, y_test = load_data(dataset_version)

        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)

        # Log metrics
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("f1", f1)

        # Save model
        mlflow.sklearn.log_model(model, "model")

        return model
\`\`\`

**4. Baseline Comparison:**
- Every new model compared to current production model
- Must exceed baseline by defined margin
- Comparison metrics logged and reviewed
- Human approval required for promotion

**5. Data Leakage Prevention:**
- Temporal split (train on past, test on future)
- No future information in training features
- Cross-validation respects time boundaries
- Feature computation identical in training and serving`
    },
    {
      id: 'ML-4',
      title: '4. Model Serving Controls',
      content: `**Inference Service Controls:**

**1. Input Validation:**
\`\`\`python
# apps/ml-services/serving/main.py
from pydantic import BaseModel, validator
from fastapi import FastAPI

app = FastAPI()

class InferenceRequest(BaseModel):
    model_id: str
    model_version: str
    inputs: dict
    context: dict

    @validator('inputs')
    def validate_inputs(cls, v):
        # Check required fields
        # Check value ranges
        # Check data types
        return v

class InferenceResponse(BaseModel):
    prediction: Any
    confidence: float
    uncertainty_range: Optional[dict]
    model_version: str
    data_freshness: dict
    warnings: list[str]
    processing_time_ms: float
\`\`\`

**2. Timeout Protection:**
\`\`\`python
import asyncio

INFERENCE_TIMEOUT = 5.0  # seconds

async def run_inference(model, inputs):
    try:
        result = await asyncio.wait_for(
            model.predict(inputs),
            timeout=INFERENCE_TIMEOUT
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Inference timeout")
\`\`\`

**3. Circuit Breaker:**
\`\`\`python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def call_model_service(model_id, inputs):
    # Call model service
    # If 5 failures in row, stop calling for 60 seconds
    pass
\`\`\`

**4. Rate Limiting:**
\`\`\`python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/inference")
@limiter.limit("100/minute")  # Per user
async def inference(request: Request, body: InferenceRequest):
    pass
\`\`\`

**5. Monitoring:**
- Latency per model (p50, p95, p99)
- Error rate per model
- Prediction distribution (detect drift)
- Input data distribution (detect drift)
- Feature importance stability
- All metrics logged and alerted`
    },
    {
      id: 'ML-5',
      title: '5. AI Safety Controls',
      content: `**AI Assistant Safety:**

**1. Prompt Injection Prevention:**
\`\`\`typescript
// Sanitize user input before sending to LLM
function sanitizePrompt(userInput: string): string {
  // Remove potential injection patterns
  const sanitized = userInput
    .replace(/ignore previous instructions/gi, '')
    .replace(/you are now/gi, '')
    .replace(/system prompt/gi, '');

  return sanitized;
}

// Use system message separation
const messages = [
  {
    role: 'system',
    content: 'You are a helpful business assistant. You can only perform authorized actions.'
  },
  {
    role: 'user',
    content: sanitizePrompt(userInput)
  }
];
\`\`\`

**2. Tool Authorization:**
\`\`\`typescript
// Only authorized tools can be executed
const authorizedTools = {
  'search_leads': { permission: 'crm:lead:read', risk: 'low' },
  'create_task': { permission: 'projects:task:create', risk: 'medium' },
  'approve_expense': { permission: 'finance:expense:approve', risk: 'high', requiresConfirmation: true },
};

async function executeTool(toolName: string, params: unknown, context: AuthContext) {
  const tool = authorizedTools[toolName];

  if (!tool) {
    throw new Error('Unauthorized tool');
  }

  // Check permission
  if (!await hasPermission(context.userId, tool.permission, context.tenantId)) {
    throw new ForbiddenError(tool.permission, toolName);
  }

  // High-risk tools require user confirmation
  if (tool.requiresConfirmation) {
    const confirmed = await requestUserConfirmation(toolName, params);
    if (!confirmed) throw new Error('Action cancelled');
  }

  // Execute tool
  return await tools[toolName].execute(params, context);
}
\`\`\`

**3. Output Validation:**
\`\`\`typescript
// Validate LLM output before using
function validateLLMOutput(output: string, expectedSchema: ZodSchema) {
  try {
    return expectedSchema.parse(JSON.parse(output));
  } catch (error) {
    throw new Error('Invalid LLM output');
  }
}
\`\`\`

**4. Logging (Without Sensitive Data):**
\`\`\`typescript
// Log AI interactions without storing sensitive prompts
await audit.log({
  action: 'ai.assistant.query',
  actor: context.userId,
  metadata: {
    toolUsed: toolName,
    permission: tool.permission,
    // NOT logging: actual prompt or response content
  }
});
\`\`\`

**5. Human Approval for Consequential Actions:**
- All write operations require explicit approval
- Financial operations require additional approval
- Bulk operations require confirmation
- No automated execution of high-risk actions`
    }
  ]
};
