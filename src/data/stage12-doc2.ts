import { Document } from './types';

export const stage12Doc2: Document = {
  id: 'environment-configuration-secrets',
  number: 2,
  title: 'Environment Configuration and Secret Management',
  shortTitle: 'Configuration & Secrets',
  description: 'Environment-specific configuration, secret management, credential rotation, and security controls.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.2.1',
      title: '1. Configuration Management Strategy',
      content: `**Configuration Layers:**

**1. Application Configuration**
- Environment variables (runtime)
- Configuration files (version-controlled, non-sensitive)
- Feature flags (dynamic, per-environment)
- Tenant-specific settings (database)

**2. Infrastructure Configuration**
- Infrastructure as Code (Terraform, Pulumi, or similar)
- Container configuration (Dockerfile, docker-compose)
- Service configuration (platform-specific)
- Network configuration (VPC, security groups)

**3. Secret Configuration**
- Secrets manager (cloud-native or third-party)
- Encrypted at rest
- Rotated regularly
- Access controlled

**Configuration Hierarchy:**
\`\`\`
Default values (code)
  ↓
Environment variables (override defaults)
  ↓
Configuration files (override env vars)
  ↓
Feature flags (dynamic overrides)
  ↓
Tenant settings (per-tenant overrides)
\`\`\`

**Configuration Validation:**
- Schema validation on startup
- Required fields checked
- Type checking enforced
- Dependency validation
- Fail-fast on invalid configuration`
    },
    {
      id: '12.2.2',
      title: '2. Environment Variables',
      content: `**Environment Variable Categories:**

**1. Application Settings**
\`\`\`bash
# Application
NODE_ENV=production
APP_NAME=clickit-platform
APP_VERSION=1.0.0
APP_URL=https://app.clickit.com
APP_PORT=3000

# Features
FEATURE_AI_ENABLED=true
FEATURE_MARKETPLACE_ENABLED=false
FEATURE_DARK_MODE=false
\`\`\`

**2. Database Configuration**
\`\`\`bash
# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_SSL=true

# Redis
REDIS_URL=redis://user:pass@host:6379
REDIS_TLS=true
\`\`\`

**3. Authentication**
\`\`\`bash
# Auth Provider
AUTH_PROVIDER=nextauth
AUTH_SECRET=<encrypted-secret>
AUTH_SESSION_MAX_AGE=28800

# OAuth (if applicable)
OAUTH_CLIENT_ID=<client-id>
OAUTH_CLIENT_SECRET=<encrypted-secret>
\`\`\`

**4. External Services**
\`\`\`bash
# Email
EMAIL_PROVIDER=resend
EMAIL_API_KEY=<encrypted-secret>
EMAIL_FROM=noreply@clickit.com

# Storage
STORAGE_PROVIDER=cloudflare-r2
STORAGE_BUCKET=clickit-files
STORAGE_ACCESS_KEY=<encrypted-secret>
STORAGE_SECRET_KEY=<encrypted-secret>

# AI/ML
ML_SERVICE_URL=http://ml-service:8000
LLM_PROVIDER=openai
LLM_API_KEY=<encrypted-secret>
\`\`\`

**5. Monitoring**
\`\`\`bash
# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Error Tracking
SENTRY_DSN=<encrypted-secret>
SENTRY_ENVIRONMENT=production

# Metrics
METRICS_ENABLED=true
METRICS_ENDPOINT=/metrics
\`\`\`

**Environment Variable Rules:**
- Never commit secrets to source control
- Use different values per environment
- Validate on application startup
- Document all required variables
- Provide sensible defaults where safe`
    },
    {
      id: '12.2.3',
      title: '3. Secret Management',
      content: `**Secret Management Strategy:**

**Option A: Cloud-Native Secrets Manager**
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- Pros: Integrated, automatic rotation, audit logging
- Cons: Vendor lock-in, cost

**Option B: Third-Party Secrets Manager**
- Doppler
- Vault (HashiCorp)
- 1Password Secrets
- Pros: Multi-cloud, advanced features
- Cons: Additional service, cost

**Option C: Environment Variables (Encrypted)**
- Platform-specific encrypted env vars
- Vercel Environment Variables
- Railway Secrets
- Pros: Simple, integrated
- Cons: Limited rotation, less audit

**Recommendation:** Start with platform-native encrypted environment variables, migrate to dedicated secrets manager when scale justifies complexity.

**Secret Categories:**

**Highly Restricted:**
- Database credentials
- API keys with write access
- Encryption keys
- OAuth client secrets
- Payment gateway credentials

**Restricted:**
- Read-only API keys
- Service account credentials
- Webhook secrets
- Signing keys

**Internal:**
- Internal service URLs
- Feature flags
- Configuration values

**Secret Lifecycle:**

**1. Creation**
- Generate strong random values
- Store in secrets manager
- Document purpose and owner
- Set expiration date

**2. Distribution**
- Inject at runtime (environment variables)
- Never log or expose in code
- Use least-privilege access
- Audit all access

**3. Rotation**
- Rotate regularly (90 days for critical secrets)
- Automate rotation where possible
- Test rotation in staging first
- Document rotation procedure

**4. Revocation**
- Revoke immediately on compromise
- Rotate all dependent services
- Audit access logs
- Document incident

**Secret Rotation Schedule:**
- Database credentials: 90 days
- API keys: 90 days
- Encryption keys: 1 year
- OAuth secrets: 180 days
- Webhook secrets: 1 year`
    },
    {
      id: '12.2.4',
      title: '4. Configuration Per Environment',
      content: `**Environment Configuration Template:**

**Local Development:**
\`\`\`bash
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/clickit_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
FEATURE_AI_ENABLED=false
\`\`\`

**CI/CD Testing:**
\`\`\`bash
NODE_ENV=test
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://test-db:5432/clickit_test
REDIS_URL=redis://test-redis:6379
LOG_LEVEL=error
FEATURE_AI_ENABLED=false
\`\`\`

**Staging:**
\`\`\`bash
NODE_ENV=staging
APP_URL=https://staging.clickit.dev
DATABASE_URL=<staging-db-url>
REDIS_URL=<staging-redis-url>
LOG_LEVEL=info
FEATURE_AI_ENABLED=true
SENTRY_ENVIRONMENT=staging
\`\`\`

**Production:**
\`\`\`bash
NODE_ENV=production
APP_URL=https://app.clickit.com
DATABASE_URL=<production-db-url>
REDIS_URL=<production-redis-url>
LOG_LEVEL=warn
FEATURE_AI_ENABLED=true
SENTRY_ENVIRONMENT=production
\`\`\`

**Configuration Differences:**

| Setting | Local | CI/CD | Staging | Production |
|---------|-------|-------|---------|------------|
| Database | Local | Test DB | Staging DB | Prod DB |
| Data | Synthetic | Synthetic | Anonymized | Real |
| Logging | Debug | Error | Info | Warn |
| AI Features | Disabled | Disabled | Enabled | Enabled |
| Monitoring | None | None | Basic | Full |
| Backups | None | None | Daily | Hourly |
| Scaling | 1 instance | 1 instance | 2 instances | Auto-scale |

**Environment Promotion Rules:**
- Configuration must be version-controlled
- Secrets must be environment-specific
- No production secrets in non-production
- Validate configuration on deployment
- Document all environment differences`
    },
    {
      id: '12.2.5',
      title: '5. Security Controls',
      content: `**Secret Protection:**

**1. At Rest**
- Encrypted in secrets manager
- Encrypted in transit between services
- Encrypted in backups
- Access logged and audited

**2. In Transit**
- TLS 1.3 for all connections
- Certificate validation enforced
- No secrets in URLs or logs
- Secure headers (HSTS, CSP)

**3. In Memory**
- Minimize secret exposure
- Clear from memory when not needed
- No secrets in error messages
- No secrets in stack traces

**4. In Logs**
- Never log secrets
- Mask sensitive values
- Audit log access
- Redact from error reports

**Access Control:**

**Principle of Least Privilege:**
- Services access only required secrets
- Developers access only needed environments
- Production access restricted to operations
- Audit all secret access

**Access Patterns:**
\`\`\`
Developer → Local/CI/CD secrets
QA Team → Staging secrets
Operations → Production secrets
CI/CD Pipeline → Deployment secrets
Services → Runtime secrets (injected)
\`\`\`

**Secret Injection:**

**Method 1: Environment Variables**
- Injected at container startup
- Read-only during runtime
- Platform-managed
- Simple, widely supported

**Method 2: Secrets Manager API**
- Fetched at runtime
- Cached with TTL
- Automatic rotation
- More complex, more secure

**Method 3: Sidecar Pattern**
- Sidecar fetches secrets
- Injects into application
- Automatic rotation
- Kubernetes-specific

**Recommendation:** Environment variables for initial deployment, migrate to secrets manager API for advanced rotation.

**Audit and Monitoring:**

**Audit Logging:**
- All secret access logged
- Include: who, what, when, where
- Retain for 7 years
- Review quarterly

**Alerting:**
- Alert on unusual access patterns
- Alert on failed access attempts
- Alert on secret rotation failures
- Alert on expired secrets

**Compliance:**
- Meet regulatory requirements
- Document secret handling
- Regular access reviews
- Incident response plan`
    },
    {
      id: '12.2.6',
      title: '6. Configuration Validation',
      content: `**Validation Strategy:**

**1. Schema Validation**
\`\`\`typescript
import { z } from 'zod';

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'staging', 'production']),
  appUrl: z.string().url(),
  database: z.object({
    url: z.string().url(),
    poolMin: z.number().min(0),
    poolMax: z.number().min(1),
  }),
  redis: z.object({
    url: z.string().url(),
  }),
  features: z.object({
    aiEnabled: z.boolean(),
    marketplaceEnabled: z.boolean(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function validateConfig(env: NodeJS.ProcessEnv): Config {
  return configSchema.parse({
    nodeEnv: env.NODE_ENV,
    appUrl: env.APP_URL,
    database: {
      url: env.DATABASE_URL,
      poolMin: parseInt(env.DATABASE_POOL_MIN || '5'),
      poolMax: parseInt(env.DATABASE_POOL_MAX || '20'),
    },
    redis: {
      url: env.REDIS_URL,
    },
    features: {
      aiEnabled: env.FEATURE_AI_ENABLED === 'true',
      marketplaceEnabled: env.FEATURE_MARKETPLACE_ENABLED === 'true',
    },
  });
}
\`\`\`

**2. Dependency Validation**
- Check database connectivity
- Check Redis connectivity
- Check external service availability
- Validate API keys (format, not value)

**3. Security Validation**
- Verify secrets are not in code
- Verify secrets are not in logs
- Verify TLS is enabled
- Verify CORS is configured correctly

**4. Performance Validation**
- Verify connection pool sizes
- Verify cache TTLs
- Verify timeout values
- Verify rate limits

**Validation Timing:**
- On application startup (fail-fast)
- On configuration change (hot reload if supported)
- On deployment (pre-deployment check)
- Periodically (health check)

**Validation Failure Handling:**
- Log detailed error message
- Exit with non-zero code
- Alert operations team
- Do not start application
- Provide remediation guidance`
    }
  ]
};
