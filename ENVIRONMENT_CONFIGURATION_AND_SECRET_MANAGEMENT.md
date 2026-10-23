# Environment Configuration and Secret Management

**Document ID:** OPS-12.2  
**Stage:** 12  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the configuration management strategy for the ClickIT platform, covering environment variables, secrets management, and configuration validation across all environments.

---

## 2. Configuration Strategy

### 2.1 Configuration Layers

**Layer 1: Application Configuration**
- Environment variables (runtime)
- Configuration files (version-controlled, non-sensitive)
- Feature flags (dynamic, per-environment)
- Tenant-specific settings (database)

**Layer 2: Infrastructure Configuration**
- Infrastructure as Code (Terraform/Pulumi)
- Container configuration (Docker)
- Service configuration (platform-specific)
- Network configuration (VPC, security groups)

**Layer 3: Secret Configuration**
- Secrets manager (platform-native or third-party)
- Encrypted at rest
- Rotated regularly
- Access controlled

### 2.2 Configuration Hierarchy

```
Default values (code)
  ↓
Environment variables (override defaults)
  ↓
Configuration files (override env vars)
  ↓
Feature flags (dynamic overrides)
  ↓
Tenant settings (per-tenant overrides)
```

---

## 3. Environment Variables

### 3.1 Variable Categories

**Application Settings:**
```bash
NODE_ENV=production
APP_NAME=clickit-platform
APP_VERSION=1.0.0
APP_URL=https://app.clickit.com
APP_PORT=3000
```

**Database Configuration:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_SSL=true
```

**Authentication:**
```bash
AUTH_PROVIDER=nextauth
AUTH_SECRET=<encrypted-secret>
AUTH_SESSION_MAX_AGE=28800
```

**External Services:**
```bash
EMAIL_PROVIDER=resend
EMAIL_API_KEY=<encrypted-secret>
STORAGE_PROVIDER=cloudflare-r2
STORAGE_BUCKET=clickit-files
ML_SERVICE_URL=http://ml-service:8000
```

**Monitoring:**
```bash
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=<encrypted-secret>
METRICS_ENABLED=true
```

### 3.2 Environment Variable Rules

- Never commit secrets to source control
- Use different values per environment
- Validate on application startup
- Document all required variables
- Provide sensible defaults where safe

---

## 4. Secret Management

### 4.1 Secret Management Strategy

**Option A: Cloud-Native Secrets Manager**
- AWS Secrets Manager, Azure Key Vault, GCP Secret Manager
- Pros: Integrated, automatic rotation, audit logging
- Cons: Vendor lock-in, cost

**Option B: Third-Party Secrets Manager**
- Doppler, Vault, 1Password Secrets
- Pros: Multi-cloud, advanced features
- Cons: Additional service, cost

**Option C: Platform-Native Encrypted Variables**
- Vercel Environment Variables, Railway Secrets
- Pros: Simple, integrated
- Cons: Limited rotation, less audit

**Recommendation:** Start with platform-native encrypted environment variables, migrate to dedicated secrets manager when scale justifies complexity.

### 4.2 Secret Categories

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

### 4.3 Secret Lifecycle

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

### 4.4 Secret Rotation Schedule

- Database credentials: 90 days
- API keys: 90 days
- Encryption keys: 1 year
- OAuth secrets: 180 days
- Webhook secrets: 1 year

---

## 5. Configuration Per Environment

### 5.1 Environment Configuration Template

**Local Development:**
```bash
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/clickit_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
FEATURE_AI_ENABLED=false
```

**CI/CD Testing:**
```bash
NODE_ENV=test
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://test-db:5432/clickit_test
REDIS_URL=redis://test-redis:6379
LOG_LEVEL=error
FEATURE_AI_ENABLED=false
```

**Staging:**
```bash
NODE_ENV=staging
APP_URL=https://staging.clickit.dev
DATABASE_URL=<staging-db-url>
REDIS_URL=<staging-redis-url>
LOG_LEVEL=info
FEATURE_AI_ENABLED=true
SENTRY_ENVIRONMENT=staging
```

**Production:**
```bash
NODE_ENV=production
APP_URL=https://app.clickit.com
DATABASE_URL=<production-db-url>
REDIS_URL=<production-redis-url>
LOG_LEVEL=warn
FEATURE_AI_ENABLED=true
SENTRY_ENVIRONMENT=production
```

### 5.2 Configuration Differences

| Setting | Local | CI/CD | Staging | Production |
|---------|-------|-------|---------|------------|
| Database | Local | Test DB | Staging DB | Prod DB |
| Data | Synthetic | Synthetic | Anonymized | Real |
| Logging | Debug | Error | Info | Warn |
| AI Features | Disabled | Disabled | Enabled | Enabled |
| Monitoring | None | None | Basic | Full |
| Backups | None | None | Daily | Hourly |
| Scaling | 1 instance | 1 instance | 2 instances | Auto-scale |

---

## 6. Security Controls

### 6.1 Secret Protection

**At Rest:**
- Encrypted in secrets manager
- Encrypted in transit between services
- Encrypted in backups
- Access logged and audited

**In Transit:**
- TLS 1.3 for all connections
- Certificate validation enforced
- No secrets in URLs or logs
- Secure headers (HSTS, CSP)

**In Memory:**
- Minimize secret exposure
- Clear from memory when not needed
- No secrets in error messages
- No secrets in stack traces

**In Logs:**
- Never log secrets
- Mask sensitive values
- Audit log access
- Redact from error reports

### 6.2 Access Control

**Principle of Least Privilege:**
- Services access only required secrets
- Developers access only needed environments
- Production access restricted to operations
- Audit all secret access

**Access Patterns:**
```
Developer → Local/CI/CD secrets
QA Team → Staging secrets
Operations → Production secrets
CI/CD Pipeline → Deployment secrets
Services → Runtime secrets (injected)
```

### 6.3 Secret Injection

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

**Recommendation:** Environment variables for initial deployment, migrate to secrets manager API for advanced rotation.

---

## 7. Configuration Validation

### 7.1 Validation Strategy

**Schema Validation:**
```typescript
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
```

**Dependency Validation:**
- Check database connectivity
- Check Redis connectivity
- Check external service availability
- Validate API keys (format, not value)

**Security Validation:**
- Verify secrets are not in code
- Verify secrets are not in logs
- Verify TLS is enabled
- Verify CORS is configured correctly

### 7.2 Validation Timing

- On application startup (fail-fast)
- On configuration change (hot reload if supported)
- On deployment (pre-deployment check)
- Periodically (health check)

### 7.3 Validation Failure Handling

- Log detailed error message
- Exit with non-zero code
- Alert operations team
- Do not start application
- Provide remediation guidance

---

## 8. Acceptance Criteria

### 8.1 Configuration Management

- [ ] All configuration defined and documented
- [ ] Environment variables validated on startup
- [ ] Secrets managed securely
- [ ] Configuration per environment defined
- [ ] Secret rotation schedule established
- [ ] Access control implemented
- [ ] Audit logging enabled

### 8.2 Security

- [ ] No secrets in source code
- [ ] No secrets in logs
- [ ] Secrets encrypted at rest
- [ ] Secrets encrypted in transit
- [ ] Access control enforced
- [ ] Rotation automated where possible
- [ ] Compromise response plan documented

---

## 9. References

- Stage 3: Repository and Development Infrastructure
- Stage 7: Security Architecture
- Industry standards: OWASP Secrets Management Cheat Sheet

---

**Document Status:** Recorded  
**Owner:** DevOps Lead / Security Architect
