# API Standards and Contracts

**Document ID:** INT-10.2  
**Stage:** 10 — Integration Architecture, External APIs, Events, Background Jobs, and Automation Infrastructure  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the API standards and contracts for the ClickIT platform, ensuring consistency, security, and reliability across all internal and external APIs.

**Key Principles:**
- RESTful design with consistent conventions
- Strong typing with TypeScript and Zod validation
- Tenant isolation enforced at every layer
- Comprehensive error handling and reporting
- Versioning for backward compatibility
- Rate limiting and resource protection

---

## 2. API Design Principles

### 2.1 RESTful Conventions

**Resource Naming:**
- Use plural nouns: `/leads`, `/invoices`, `/products`
- Use hyphens for multi-word: `/purchase-orders`, `/customer-support`
- Avoid verbs in URLs: Use HTTP methods instead
- Nest resources logically: `/leads/{id}/activities`

**HTTP Methods:**
- `GET` - Retrieve resources (idempotent, safe)
- `POST` - Create resources (not idempotent)
- `PUT` - Replace entire resource (idempotent)
- `PATCH` - Partial update (idempotent)
- `DELETE` - Remove resource (idempotent)

**Status Codes:**
- `200 OK` - Successful GET, PUT, PATCH, DELETE
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE with no response body
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Resource conflict (duplicate, version mismatch)
- `422 Unprocessable Entity` - Validation error with details
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## 3. Request and Response Standards

### 3.1 Request Format

**Headers:**
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
X-Tenant-ID: {tenantId}
X-Request-ID: {requestId}
X-Correlation-ID: {correlationId}
```

**Query Parameters:**
```http
GET /api/leads?status=qualified&owner=123&sort=-createdAt&page=1&pageSize=50
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "source": "website"
}
```

### 3.2 Response Format

**Success Response:**
```json
{
  "data": {
    "id": "lead-123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-29T10:00:00Z",
    "updatedAt": "2026-01-29T10:00:00Z"
  },
  "meta": {
    "requestId": "req-456",
    "timestamp": "2026-01-29T10:00:00Z"
  }
}
```

**List Response:**
```json
{
  "data": [
    { "id": "lead-123", "name": "John Doe" },
    { "id": "lead-124", "name": "Jane Smith" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 100,
    "totalPages": 2
  },
  "meta": {
    "requestId": "req-456",
    "timestamp": "2026-01-29T10:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      }
    ],
    "requestId": "req-456",
    "timestamp": "2026-01-29T10:00:00Z"
  }
}
```

---

## 4. Validation and Error Handling

### 4.1 Input Validation

**Validation Library:** Zod (TypeScript-first schema validation)

**Validation Schema Example:**
```typescript
import { z } from 'zod';

const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  source: z.enum(['website', 'referral', 'cold_call', 'event']).optional()
});

type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
```

**Validation Middleware:**
```typescript
function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
              code: 'INVALID_VALUE'
            }))
          }
        });
      }
      next(error);
    }
  };
}
```

### 4.2 Error Handling

**Error Classes:**
```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(details: any) {
    super('VALIDATION_ERROR', 'Invalid input data', 422, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found: ${id}`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}
```

**Error Handler Middleware:**
```typescript
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    tenantId: req.tenantId,
    userId: req.userId
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}
```

---

## 5. Authentication and Authorization

### 5.1 Authentication

**JWT Token Structure:**
```typescript
interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

**Authentication Middleware:**
```typescript
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyJWT(token);
    req.userId = payload.userId;
    req.tenantId = payload.tenantId;
    req.userRoles = payload.roles;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

### 5.2 Authorization

**Permission Check Middleware:**
```typescript
function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hasPermission = await checkPermission(
      req.userId,
      permission,
      req.tenantId
    );
    
    if (!hasPermission) {
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }
    
    next();
  };
}
```

**Data Scope Enforcement:**
```typescript
function enforceDataScope(scope: DataScope) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.dataScope = scope;
    next();
  };
}

// Usage
app.get('/api/leads',
  authenticate,
  requirePermission('leads:read'),
  enforceDataScope('team'),
  listLeads
);
```

---

## 6. Pagination, Filtering, and Sorting

### 6.1 Pagination

**Cursor-Based Pagination (Recommended):**
```typescript
interface CursorPagination {
  cursor?: string;  // Opaque cursor
  limit: number;    // Page size (default: 50, max: 100)
}

interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}
```

**Offset-Based Pagination (Alternative):**
```typescript
interface OffsetPagination {
  page: number;     // Page number (1-indexed)
  pageSize: number; // Items per page (default: 50, max: 100)
}

interface OffsetPaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### 6.2 Filtering

**Filter Syntax:**
```http
GET /api/leads?status=qualified&owner=123&createdAfter=2026-01-01
```

**Filter Implementation:**
```typescript
interface LeadFilters {
  status?: LeadStatus[];
  owner?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;  // Full-text search
}

function applyFilters(query: Prisma.LeadWhereInput, filters: LeadFilters) {
  if (filters.status) {
    query.status = { in: filters.status };
  }
  if (filters.owner) {
    query.ownerId = { in: filters.owner };
  }
  if (filters.createdAfter) {
    query.createdAt = { gte: filters.createdAfter };
  }
  if (filters.createdBefore) {
    query.createdAt = { lte: filters.createdBefore };
  }
  if (filters.search) {
    query.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  return query;
}
```

### 6.3 Sorting

**Sort Syntax:**
```http
GET /api/leads?sort=-createdAt,name
```

**Sort Implementation:**
```typescript
type SortDirection = 'asc' | 'desc';

interface SortField {
  field: string;
  direction: SortDirection;
}

function parseSort(sortParam: string): SortField[] {
  return sortParam.split(',').map(field => {
    if (field.startsWith('-')) {
      return { field: field.substring(1), direction: 'desc' };
    }
    return { field, direction: 'asc' };
  });
}

function applySort(sort: SortField[]): Prisma.LeadOrderByWithRelationInput[] {
  return sort.map(s => ({
    [s.field]: s.direction
  }));
}
```

---

## 7. Versioning and Backward Compatibility

### 7.1 API Versioning

**URL-Based Versioning:**
```http
GET /api/v1/leads
GET /api/v2/leads
```

**Header-Based Versioning (Alternative):**
```http
GET /api/leads
Accept: application/vnd.clickit.v1+json
```

**Version Management:**
```typescript
const API_VERSIONS = {
  v1: {
    status: 'deprecated',
    sunsetDate: '2026-12-31',
    migrationGuide: '/docs/migration/v1-to-v2'
  },
  v2: {
    status: 'stable',
    releasedDate: '2026-01-01'
  }
};
```

### 7.2 Backward Compatibility Rules

**Breaking Changes (Require New Version):**
- Removing or renaming fields
- Changing field types
- Changing required/optional status
- Changing endpoint URLs
- Changing authentication mechanism

**Non-Breaking Changes (Same Version):**
- Adding new optional fields
- Adding new endpoints
- Adding new query parameters
- Extending enum values
- Improving error messages

---

## 8. Rate Limiting

### 8.1 Rate Limit Strategy

**Rate Limit Tiers:**
```typescript
const RATE_LIMITS = {
  anonymous: {
    requests: 10,
    window: '1m'
  },
  authenticated: {
    requests: 100,
    window: '1m'
  },
  premium: {
    requests: 1000,
    window: '1m'
  }
};
```

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**Rate Limit Middleware:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
```

---

## 9. Idempotency

### 9.1 Idempotency Keys

**Idempotency Key Header:**
```http
POST /api/payments
Idempotency-Key: unique-request-id-123
```

**Idempotency Implementation:**
```typescript
async function withIdempotency(
  key: string,
  tenantId: string,
  handler: () => Promise<any>
) {
  // Check if request already processed
  const existing = await db.idempotencyKey.findUnique({
    where: { key, tenantId }
  });
  
  if (existing) {
    return existing.response;
  }
  
  // Execute handler
  const result = await handler();
  
  // Store result
  await db.idempotencyKey.create({
    data: {
      key,
      tenantId,
      response: result,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });
  
  return result;
}
```

---

## 10. API Documentation

### 10.1 OpenAPI Specification

**OpenAPI 3.0 Example:**
```yaml
openapi: 3.0.0
info:
  title: ClickIT API
  version: 2.0.0
  description: ClickIT Platform API

paths:
  /api/leads:
    post:
      summary: Create a new lead
      operationId: createLead
      tags:
        - Leads
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateLeadRequest'
      responses:
        '201':
          description: Lead created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Lead'
        '422':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    CreateLeadRequest:
      type: object
      required:
        - name
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 200
        email:
          type: string
          format: email
        phone:
          type: string
          maxLength: 50
        company:
          type: string
          maxLength: 200
        source:
          type: string
          enum: [website, referral, cold_call, event]
    
    Lead:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
        createdAt:
          type: string
          format: date-time
    
    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
```

### 10.2 API Documentation Tools

**Recommended Tools:**
- **Swagger UI** - Interactive API documentation
- **Redoc** - Alternative API documentation
- **Postman** - API testing and documentation
- **Insomnia** - API client and testing

**Documentation Generation:**
```bash
# Generate OpenAPI spec from code
npm run generate:openapi

# Serve documentation
npm run serve:docs
```

---

## 11. Testing

### 11.1 Contract Testing

**Pact Example:**
```typescript
import { Pact } from '@pact-foundation/pact';

const provider = new Pact({
  consumer: 'LeadService',
  provider: 'CRMService'
});

describe('Lead API', () => {
  it('should create a lead', async () => {
    await provider.addInteraction({
      state: 'a lead exists',
      uponReceiving: 'a request to create a lead',
      withRequest: {
        method: 'POST',
        path: '/api/leads',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      },
      willRespondWith: {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          id: like('lead-123'),
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    });
    
    const result = await createLead({
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    expect(result.id).to.exist;
  });
});
```

### 11.2 Integration Testing

**Test Example:**
```typescript
describe('Lead API Integration', () => {
  beforeEach(async () => {
    await db.lead.deleteMany();
  });
  
  it('should create and retrieve a lead', async () => {
    // Create lead
    const createResponse = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      });
    
    expect(createResponse.status).toBe(201);
    const leadId = createResponse.body.data.id;
    
    // Retrieve lead
    const getResponse = await request(app)
      .get(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.name).toBe('John Doe');
  });
});
```

---

## 12. Acceptance Criteria

### 12.1 API Standards

- [ ] All endpoints follow RESTful conventions
- [ ] Request/response formats consistent
- [ ] Error responses include code, message, details
- [ ] Input validation with Zod schemas
- [ ] Authentication enforced on all endpoints
- [ ] Authorization checked per operation
- [ ] Tenant isolation enforced
- [ ] Rate limiting implemented
- [ ] Idempotency keys supported for POST/PUT
- [ ] API versioning implemented
- [ ] OpenAPI documentation generated
- [ ] Contract tests passing

### 12.2 Performance

- [ ] API latency < 1 second (p95)
- [ ] Support 1000+ concurrent requests
- [ ] Rate limiting prevents abuse
- [ ] Pagination for large result sets
- [ ] Efficient database queries

### 12.3 Security

- [ ] All communication encrypted (TLS)
- [ ] JWT tokens with expiration
- [ ] Permission checks on all operations
- [ ] Tenant isolation verified
- [ ] Input sanitization prevents injection
- [ ] Audit logging complete

---

## 13. References

- Stage 2: System Architecture
- Stage 3: Repository and Development Infrastructure
- Stage 7: Security Architecture
- REST API Design Best Practices
- OpenAPI Specification 3.0
- Zod Documentation

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** API Architect
