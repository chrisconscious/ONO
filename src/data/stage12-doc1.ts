import { Document } from './types';

export const stage12Doc1: Document = {
  id: 'deployment-architecture-environment',
  number: 1,
  title: 'Deployment Architecture and Environment Plan',
  shortTitle: 'Deployment Architecture',
  description: 'Deployment architecture, hosting model, environment separation, and infrastructure components.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.1.1',
      title: '1. Deployment Architecture Overview',
      content: `**Deployment Model:** Managed application hosting with separate services for specialized workloads.

**Recommended Approach:**
- **Primary Application:** Next.js application hosted on managed platform (Vercel, Railway, or similar)
- **Background Workers:** Separate Node.js worker processes
- **ML Services:** Python/FastAPI services on managed container platform
- **Database:** Managed PostgreSQL with RLS support
- **Cache:** Managed Redis
- **Object Storage:** S3-compatible storage (AWS S3, Cloudflare R2, or similar)
- **Message Queue:** Managed queue service (Redis Streams, RabbitMQ, or cloud-native)

**Rationale:**
- Managed services reduce operational burden
- Automatic scaling and high availability
- Built-in monitoring and backup
- Lower total cost of ownership for small team
- Can migrate to self-hosted later if needed

**Alternative Considered:**
- Self-hosted on VMs: More control but higher operational cost
- Kubernetes: Overkill for initial deployment
- Serverless only: Limited by execution time and cold starts`
    },
    {
      id: '12.1.2',
      title: '2. Deployment Diagram',
      content: `\`\`\`mermaid
graph TB
    subgraph "Edge Layer"
        CDN[CDN / Edge Cache]
        LB[Load Balancer]
    end
    
    subgraph "Application Layer"
        WEB1[Next.js App Instance 1]
        WEB2[Next.js App Instance 2]
        WEBn[Next.js App Instance N]
    end
    
    subgraph "Worker Layer"
        WORKER1[Background Worker 1]
        WORKER2[Background Worker 2]
        WORKERn[Background Worker N]
    end
    
    subgraph "ML Services Layer"
        ML1[ML Inference Service 1]
        ML2[ML Inference Service 2]
        MLn[ML Inference Service N]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary + Read Replica)]
        REDIS[(Redis Cluster)]
        S3[(Object Storage)]
        QUEUE[(Message Queue)]
    end
    
    subgraph "External Services"
        AUTH[Auth Provider]
        EMAIL[Email Service]
        LLM[LLM Provider]
    end
    
    CDN --> LB
    LB --> WEB1 & WEB2 & WEBn
    WEB1 & WEB2 & WEBn --> PG & REDIS & S3 & QUEUE
    WORKER1 & WORKER2 & WORKERn --> PG & REDIS & S3 & QUEUE
    WEB1 & WEB2 & WEBn --> ML1 & ML2 & MLn
    ML1 & ML2 & MLn --> PG & REDIS & S3
    WEB1 & WEB2 & WEBn --> AUTH & EMAIL & LLM
\`\`\`

**Component Responsibilities:**

**Edge Layer:**
- CDN: Static asset caching, DDoS protection
- Load Balancer: Traffic distribution, SSL termination, health checks

**Application Layer:**
- Next.js instances: Handle HTTP requests, API routes, server actions
- Stateless: Can scale horizontally
- Share session store (Redis)

**Worker Layer:**
- Background job processors
- Scheduled task executors
- Event consumers
- Isolated from request path

**ML Services Layer:**
- Model inference endpoints
- Feature computation
- Prediction serving
- Separate scaling from web tier

**Data Layer:**
- PostgreSQL: Primary data store with RLS
- Redis: Session store, cache, job queue
- Object Storage: Files, documents, ML artifacts
- Message Queue: Async job processing, event distribution`
    },
    {
      id: '12.1.3',
      title: '3. Environment Separation',
      content: `**Environments:**

**1. Local Development**
- Purpose: Developer workstation
- Infrastructure: Docker Compose
- Database: Local PostgreSQL
- Cache: Local Redis
- Storage: Local filesystem
- ML Services: Local Python environment
- Data: Synthetic test data
- Access: Developer only

**2. CI/CD Testing**
- Purpose: Automated testing
- Infrastructure: Ephemeral containers
- Database: Test database (reset per run)
- Cache: Test Redis
- Storage: Temporary storage
- ML Services: Mock or test instances
- Data: Synthetic test data
- Access: CI/CD pipeline only

**3. Staging**
- Purpose: Pre-production validation
- Infrastructure: Production-like (smaller scale)
- Database: Staging PostgreSQL (anonymized production data)
- Cache: Staging Redis
- Storage: Staging object storage
- ML Services: Staging ML instances
- Data: Anonymized production data + synthetic
- Access: QA team, developers, product owners

**4. Production**
- Purpose: Live customer environment
- Infrastructure: Full scale, multi-AZ
- Database: Production PostgreSQL (primary + replicas)
- Cache: Production Redis cluster
- Storage: Production object storage
- ML Services: Production ML instances
- Data: Real customer data
- Access: Operations team only

**Environment Promotion:**
\`\`\`
Local → CI/CD → Staging → Production
\`\`\`

**Deployment Flow:**
1. Code merged to main branch
2. CI/CD runs all tests
3. Deploy to staging
4. Run smoke tests
5. Manual QA validation
6. Production deployment (with approval)
7. Post-deployment monitoring`
    },
    {
      id: '12.1.4',
      title: '4. Infrastructure Components',
      content: `**Application Hosting:**

**Option A: Vercel (Recommended for initial deployment)**
- Pros: Native Next.js support, automatic scaling, edge functions, easy deployment
- Cons: Vendor lock-in, limited customization, cost at scale
- Use case: Small to medium scale, rapid iteration

**Option B: Railway / Render / Fly.io**
- Pros: More flexible, container-based, reasonable cost
- Cons: Less Next.js optimization than Vercel
- Use case: Medium scale, need more control

**Option C: AWS/Azure/GCP (EC2, ECS, Cloud Run)**
- Pros: Maximum control, full feature set, enterprise features
- Cons: Higher operational complexity, requires DevOps expertise
- Use case: Large scale, enterprise requirements

**Recommendation:** Start with Vercel or Railway for simplicity, migrate to cloud provider when scale justifies complexity.

**Database Hosting:**

**Managed PostgreSQL Options:**
- Supabase: PostgreSQL + auth + realtime (good for Next.js)
- Neon: Serverless PostgreSQL, branching
- AWS RDS/Aurora: Enterprise features, multi-AZ
- Azure Database for PostgreSQL: Azure ecosystem
- Google Cloud SQL: GCP ecosystem

**Recommendation:** Supabase or Neon for initial deployment (developer-friendly, good Next.js integration), migrate to RDS/Aurora for enterprise scale.

**Cache and Queue:**

**Redis Options:**
- Upstash: Serverless Redis, pay-per-request
- Redis Cloud: Managed Redis clusters
- AWS ElastiCache: Enterprise Redis
- Azure Cache for Redis: Azure ecosystem

**Recommendation:** Upstash for initial deployment (serverless, cost-effective), migrate to Redis Cloud or ElastiCache for scale.

**Object Storage:**

**Options:**
- AWS S3: Industry standard, extensive features
- Cloudflare R2: S3-compatible, no egress fees
- Supabase Storage: Integrated with Supabase
- Vercel Blob: Integrated with Vercel

**Recommendation:** Cloudflare R2 for cost efficiency (no egress fees), or AWS S3 for enterprise features.

**ML Service Hosting:**

**Options:**
- Railway: Easy Python deployment
- Fly.io: Global distribution, good for inference
- AWS SageMaker: Enterprise ML platform
- Modal: Serverless GPU for inference
- Self-hosted: Maximum control

**Recommendation:** Railway or Fly.io for initial deployment, migrate to SageMaker or Modal for GPU workloads.`
    },
    {
      id: '12.1.5',
      title: '5. Network and Security Boundaries',
      content: `**Network Architecture:**

**Public-Facing:**
- Application endpoints (HTTPS only)
- API endpoints (HTTPS only)
- Webhook receivers (HTTPS with signature verification)
- Static assets (CDN)

**Private Network:**
- Database connections (VPC peering or private link)
- Redis connections (VPC internal)
- Internal service communication (VPC internal)
- Background worker communication (VPC internal)

**External Services:**
- Authentication provider (HTTPS)
- Email service (HTTPS/API)
- LLM provider (HTTPS/API)
- Payment gateway (HTTPS/API)
- Other integrations (HTTPS/API)

**Security Boundaries:**

**Perimeter Security:**
- WAF (Web Application Firewall) at edge
- DDoS protection at CDN/load balancer
- Rate limiting at application layer
- IP whitelisting for admin access (optional)

**Internal Security:**
- VPC isolation for all services
- Private subnets for databases and caches
- Security groups restricting access
- TLS encryption for all internal communication

**Data Security:**
- Encryption at rest (database, storage)
- Encryption in transit (TLS 1.3)
- Tenant isolation (RLS + middleware)
- Secret management (encrypted, rotated)

**Access Control:**
- Service accounts with least privilege
- IAM roles for infrastructure access
- VPN or bastion host for admin access
- Audit logging for all access`
    },
    {
      id: '12.1.6',
      title: '6. High Availability and Disaster Recovery',
      content: `**High Availability Strategy:**

**Application Tier:**
- Multiple instances across availability zones
- Auto-scaling based on load
- Health checks and automatic failover
- Zero-downtime deployments

**Database Tier:**
- Primary + read replicas
- Automatic failover (if supported)
- Point-in-time recovery
- Daily backups with 30-day retention

**Cache Tier:**
- Redis cluster with replication
- Automatic failover
- Persistence enabled (optional)

**Storage Tier:**
- Cross-region replication (optional)
- Versioning enabled
- Lifecycle policies for cost optimization

**Disaster Recovery:**

**RPO (Recovery Point Objective):**
- Database: < 1 hour (continuous backups)
- Files: < 24 hours (daily backups)
- Configuration: < 1 hour (version controlled)

**RTO (Recovery Time Objective):**
- Application: < 30 minutes (auto-scaling)
- Database: < 1 hour (automated failover)
- Full recovery: < 4 hours (manual intervention)

**DR Strategy:**
1. Automated backups to separate region
2. Infrastructure as Code for rapid rebuild
3. Runbook for manual recovery steps
4. Quarterly DR testing
5. Documented recovery procedures`
    },
    {
      id: '12.1.7',
      title: '7. Multi-Region Considerations',
      content: `**Single Region (Initial Deployment):**
- All services in one region
- Simpler operations, lower cost
- Acceptable for most use cases
- DR via backups to secondary region

**Multi-Region (Future Scale):**
- Active-active or active-passive
- Global load balancing
- Data replication between regions
- Complex conflict resolution
- Higher cost and complexity

**Recommendation:** Start with single region, add multi-region only when:
- Regulatory requirements demand it
- Latency requirements cannot be met
- Disaster recovery requirements exceed single-region capabilities
- User base justifies the cost

**Data Residency:**
- Identify regulatory requirements (GDPR, local laws)
- Select region(s) accordingly
- Document data residency policy
- Implement data routing if multi-region`
    },
    {
      id: '12.1.8',
      title: '8. Deployment Decisions Requiring Approval',
      content: `**DECISION-001: Application Hosting Platform**
- Options: Vercel, Railway, Render, Fly.io, AWS/Azure/GCP
- Recommendation: Vercel or Railway for initial deployment
- Status: PENDING APPROVAL
- Dependencies: Budget, team expertise, scale requirements

**DECISION-002: Database Hosting**
- Options: Supabase, Neon, AWS RDS, Azure PostgreSQL, GCP Cloud SQL
- Recommendation: Supabase or Neon for initial deployment
- Status: PENDING APPROVAL
- Dependencies: Integration requirements, scale, cost

**DECISION-003: Cache and Queue Service**
- Options: Upstash, Redis Cloud, AWS ElastiCache, Azure Cache
- Recommendation: Upstash for initial deployment
- Status: PENDING APPROVAL
- Dependencies: Scale requirements, cost

**DECISION-004: Object Storage**
- Options: AWS S3, Cloudflare R2, Supabase Storage, Vercel Blob
- Recommendation: Cloudflare R2 for cost efficiency
- Status: PENDING APPROVAL
- Dependencies: Integration requirements, egress costs

**DECISION-005: ML Service Hosting**
- Options: Railway, Fly.io, AWS SageMaker, Modal, self-hosted
- Recommendation: Railway or Fly.io for initial deployment
- Status: PENDING APPROVAL
- Dependencies: GPU requirements, scale, cost

**DECISION-006: Cloud Provider**
- Options: AWS, GCP, Azure, Vercel, multi-cloud
- Recommendation: Single provider initially (Vercel + Supabase or Railway)
- Status: PENDING APPROVAL
- Dependencies: Team expertise, compliance, cost

**DECISION-007: Multi-Region Deployment**
- Options: Single region, multi-region active-passive, multi-region active-active
- Recommendation: Single region initially
- Status: PENDING APPROVAL
- Dependencies: Regulatory requirements, latency requirements, user distribution

**All decisions documented with rationale. Awaiting explicit approval before implementation.**`
    }
  ]
};
