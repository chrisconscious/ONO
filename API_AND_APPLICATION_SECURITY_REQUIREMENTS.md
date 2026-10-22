# API and Application Security Requirements

**Document ID:** SEC-7.6  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines security requirements for all API endpoints and application interfaces in the ClickIT platform. It covers authentication, authorization, input validation, output handling, rate limiting, and protection against common web vulnerabilities.

**Key Principles:**
- Authentication and authorization on every protected operation
- Input validation at all boundaries
- Safe output handling and encoding
- Rate limiting and abuse prevention
- Comprehensive error handling without information leakage
- Protection against injection attacks

---

## 2. Authentication and Authorization

### 2.1 API Authentication

**Authentication Methods:**
- Session-based authentication (web application)
- API key authentication (integrations)
- OAuth 2.0 (future, for third-party integrations)

**Session Authentication:**
```typescript
// All API routes require authentication
app.use('/api/*', async (req, res, next) => {
  const session = await getSession(req);
  
  if (!session) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
  
  req.userId = session.userId;
  req.tenantId = session.organizationId;
  
  next();
});
```

**API Key Authentication:**
```typescript
// Integration endpoints use API keys
app.use('/api/integrations/*', async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key required'
      }
    });
  }
  
  const key = await validateApiKey(apiKey);
  
  if (!key) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key'
      }
    });
  }
  
  req.userId = key.userId;
  req.tenantId = key.organizationId;
  req.apiKeyId = key.id;
  
  next();
});
```

### 2.2 Authorization Enforcement

**Permission Checks:**
```typescript
// Require specific permission
function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hasPermission = await checkPermission(
      req.userId,
      permission,
      req.tenantId
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    
    next();
  };
}

// Usage
app.post('/api/leads',
  requirePermission('crm:lead:create'),
  createLeadHandler
);
```

**Data Scope Enforcement:**
```typescript
// Apply data scope to queries
function applyScope(query: any, user: User, scope: string) {
  switch (scope) {
    case 'own':
      return { ...query, where: { ...query.where, createdById: user.id } };
    case 'team':
      return { ...query, where: { ...query.where, teamId: { in: user.teamIds } } };
    case 'department':
      return { ...query, where: { ...query.where, departmentId: { in: user.departmentIds } } };
    case 'organization':
      return query;
  }
}
```

---

## 3. Input Validation

### 3.1 Request Validation

**Schema Validation with Zod:**
```typescript
import { z } from 'zod';

const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  companyId: z.string().uuid().optional(),
  source: z.enum(['website', 'referral', 'cold_call', 'event']).optional(),
});

app.post('/api/leads', async (req, res) => {
  try {
    const input = CreateLeadSchema.parse(req.body);
    const lead = await createLead(input, req.auth);
    return res.status(201).json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors
        }
      });
    }
    throw error;
  }
});
```

**Validation Rules:**
- All string inputs have maximum length
- Email addresses validated with regex
- UUIDs validated format
- Enums validated against allowed values
- Numbers validated for range
- Dates validated for format and range

### 3.2 File Upload Validation

**File Validation:**
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function validateFileUpload(file: File) {
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError({ file: ['Invalid file type'] });
  }
  
  // Check file size
  if (file.size > MAX_SIZE) {
    throw new ValidationError({ file: ['File too large'] });
  }
  
  // Scan for viruses
  const scanResult = await virusScanner.scan(file);
  if (!scanResult.clean) {
    throw new ValidationError({ file: ['File contains malware'] });
  }
  
  // Validate file content (magic numbers)
  const isValid = await validateFileContent(file);
  if (!isValid) {
    throw new ValidationError({ file: ['Invalid file content'] });
  }
}
```

### 3.3 Path Traversal Prevention

**Path Validation:**
```typescript
import path from 'path';

function safeFilePath(basePath: string, userPath: string): string {
  const resolved = path.resolve(basePath, userPath);
  
  if (!resolved.startsWith(basePath)) {
    throw new ForbiddenError('Path traversal attempt detected');
  }
  
  return resolved;
}
```

---

## 4. Output Handling

### 4.1 Response Formatting

**Standard Response Format:**
```typescript
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// Success response
res.json({
  data: lead,
  meta: { page: 1, pageSize: 50, total: 1 }
});

// Error response
res.status(400).json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: errors
  }
});
```

### 4.2 Error Handling

**Error Categories:**
- 400 Bad Request: Validation errors, malformed requests
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found (or not accessible)
- 409 Conflict: Resource conflict (duplicate, version mismatch)
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Unexpected errors

**Error Response Rules:**
- Never expose stack traces
- Never expose database errors
- Never expose internal paths
- Never expose sensitive data
- Provide actionable error messages
- Include error code for debugging

**Error Handler:**
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      }
    });
  }
  
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
  
  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }
    });
  }
  
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    });
  }
  
  // Generic error (do not expose details)
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

### 4.3 Data Sanitization

**Output Sanitization:**
```typescript
function sanitizeOutput<T>(data: T, fields: string[]): T {
  const sanitized = { ...data };
  
  for (const field of fields) {
    if (field in sanitized) {
      delete (sanitized as any)[field];
    }
  }
  
  return sanitized;
}

// Remove sensitive fields from response
const safeLead = sanitizeOutput(lead, [
  'internalNotes',
  'sensitiveData',
  'auditTrail'
]);
```

---

## 5. Rate Limiting

### 5.1 Rate Limiting Strategy

**Rate Limit Tiers:**
- Anonymous: 10 requests/minute
- Authenticated: 100 requests/minute
- Premium: 1000 requests/minute
- API Key: Configurable per key

**Rate Limit Implementation:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### 5.2 Endpoint-Specific Limits

**Sensitive Endpoints:**
```typescript
// Stricter limits for sensitive operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later'
    }
  }
});

app.post('/api/auth/login', authLimiter, loginHandler);
```

---

## 6. Protection Against Common Vulnerabilities

### 6.1 SQL Injection Prevention

**Prevention Measures:**
- Use Prisma ORM (parameterized queries by default)
- Never concatenate user input into SQL
- Validate all input before database operations
- Use prepared statements for raw queries

**Example:**
```typescript
// ✅ Safe (Prisma ORM)
const lead = await db.lead.findFirst({
  where: { id: leadId }
});

// ❌ Dangerous (string concatenation)
const lead = await db.$queryRaw(
  `SELECT * FROM leads WHERE id = '${leadId}'`
);

// ✅ Safe (parameterized raw query)
const lead = await db.$queryRaw(
  `SELECT * FROM leads WHERE id = $1`,
  leadId
);
```

### 6.2 Cross-Site Scripting (XSS) Prevention

**Prevention Measures:**
- React automatically escapes output
- Never use `dangerouslySetInnerHTML` without sanitization
- Use Content Security Policy (CSP) headers
- Validate and sanitize all user input

**CSP Headers:**
```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  next();
});
```

### 6.3 Cross-Site Request Forgery (CSRF) Prevention

**Prevention Measures:**
- CSRF tokens on all state-changing forms
- SameSite cookie attribute
- Custom headers for API calls
- Referer header validation

**CSRF Token Implementation:**
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Send CSRF token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Validate CSRF token on state-changing requests
app.post('/api/leads', csrfProtection, createLeadHandler);
```

### 6.4 Clickjacking Prevention

**Prevention Measures:**
```typescript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

---

## 7. Request Size Limits

### 7.1 Body Size Limits

**Configuration:**
```typescript
import express from 'express';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

**Limits:**
- JSON body: 1 MB
- URL-encoded body: 1 MB
- File upload: 10 MB (per file)
- Total request: 15 MB

### 7.2 Query Parameter Limits

**Limits:**
- Maximum query string length: 2000 characters
- Maximum number of parameters: 100
- Maximum array length: 100 items

**Validation:**
```typescript
function validateQueryParams(req: Request) {
  const queryString = req.url.split('?')[1] || '';
  
  if (queryString.length > 2000) {
    throw new ValidationError('Query string too long');
  }
  
  const params = new URLSearchParams(queryString);
  if (params.toString().split('&').length > 100) {
    throw new ValidationError('Too many query parameters');
  }
}
```

---

## 8. Pagination and Query Complexity

### 8.1 Pagination

**Pagination Parameters:**
```typescript
interface PaginationParams {
  page: number;      // Page number (1-indexed)
  pageSize: number;  // Items per page (max 100)
  cursor?: string;   // Cursor for cursor-based pagination
}
```

**Pagination Response:**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### 8.2 Query Complexity Limits

**Limits:**
- Maximum filter complexity: 10 conditions
- Maximum sort fields: 5 fields
- Maximum include depth: 3 levels
- Maximum result set: 10,000 records

**Complexity Validation:**
```typescript
function validateQueryComplexity(query: any) {
  const filterCount = countFilters(query.where);
  if (filterCount > 10) {
    throw new ValidationError('Query too complex: too many filters');
  }
  
  const sortCount = query.orderBy?.length || 0;
  if (sortCount > 5) {
    throw new ValidationError('Query too complex: too many sort fields');
  }
}
```

---

## 9. Idempotency

### 9.1 Idempotency Keys

**Idempotency Implementation:**
```typescript
app.post('/api/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  if (!idempotencyKey) {
    return res.status(400).json({
      error: {
        code: 'MISSING_IDEMPOTENCY_KEY',
        message: 'Idempotency key required for payment operations'
      }
    });
  }
  
  // Check if request already processed
  const existing = await getIdempotencyRecord(idempotencyKey);
  if (existing) {
    return res.status(200).json(existing.response);
  }
  
  // Process request
  const result = await processPayment(req.body, req.auth);
  
  // Store idempotency record
  await storeIdempotencyRecord(idempotencyKey, result);
  
  return res.status(201).json(result);
});
```

**Idempotency Record:**
```typescript
interface IdempotencyRecord {
  key: string;
  response: any;
  createdAt: Date;
  expiresAt: Date; // 24 hours
}
```

---

## 10. Security Headers

### 10.1 Required Security Headers

**Headers:**
```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  
  // Strict Transport Security
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  next();
});
```

---

## 11. CORS Configuration

### 11.1 CORS Policy

**Configuration:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Idempotency-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

**Allowed Origins:**
- Development: `http://localhost:3000`
- Staging: `https://staging.clickit.dev`
- Production: `https://app.clickit.com`

---

## 12. API Versioning

### 12.1 Versioning Strategy

**URL-Based Versioning:**
```
/api/v1/leads
/api/v2/leads
```

**Header-Based Versioning (Alternative):**
```
Accept: application/vnd.clickit.v1+json
```

**Version Deprecation:**
- Announce deprecation 6 months in advance
- Provide migration guide
- Monitor usage of deprecated versions
- Remove after 12 months

---

## 13. Security Testing

### 13.1 API Security Tests

**Test Categories:**
- Authentication bypass tests
- Authorization bypass tests
- Input validation tests
- Injection tests (SQL, XSS, command)
- Rate limiting tests
- File upload tests
- Error handling tests
- CORS tests
- CSRF tests

**Test Examples:**
```typescript
describe('API Security', () => {
  it('should reject requests without authentication', async () => {
    const response = await api.get('/api/leads');
    expect(response.status).toBe(401);
  });
  
  it('should reject requests with invalid API key', async () => {
    const response = await api.get('/api/leads', {
      headers: { 'X-API-Key': 'invalid' }
    });
    expect(response.status).toBe(401);
  });
  
  it('should validate input data', async () => {
    const response = await api.post('/api/leads', {
      firstName: '' // Invalid: empty
    });
    expect(response.status).toBe(400);
  });
  
  it('should prevent SQL injection', async () => {
    const response = await api.get('/api/leads', {
      params: { search: "'; DROP TABLE leads; --" }
    });
    expect(response.status).toBe(200);
    // Verify table still exists
  });
  
  it('should enforce rate limits', async () => {
    const promises = Array(150).fill(null).map(() => 
      api.get('/api/leads')
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

## 14. References

- Stage 2: System Architecture
- Stage 3: Engineering Standards
- Stage 4: UI/UX Design System
- OWASP API Security Top 10
- OWASP Testing Guide
- NIST SP 800-53 (Security and Privacy Controls)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
