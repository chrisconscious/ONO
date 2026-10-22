import { Document } from './types';

export const stage12Doc4: Document = {
  id: 'infrastructure-network-security',
  number: 4,
  title: 'Infrastructure and Network Security Plan',
  shortTitle: 'Infrastructure Security',
  description: 'Network security, infrastructure hardening, access control, and security monitoring.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.4.1',
      title: '1. Network Security Architecture',
      content: `**Network Segmentation:**

**Public Subnet:**
- Load balancers
- CDN endpoints
- Public API gateways
- Web application firewalls

**Private Subnet:**
- Application servers
- Background workers
- ML services
- Internal APIs

**Data Subnet:**
- Databases
- Cache servers
- Message queues
- Object storage

**Management Subnet:**
- Monitoring tools
- Logging infrastructure
- CI/CD runners
- Bastion hosts

**Network Controls:**

**Firewall Rules:**
- Default deny all inbound
- Allow only necessary ports (443, 22 for bastion)
- Allow internal communication within VPC
- Block direct database access from internet
- Log all denied traffic

**Security Groups:**
- Web tier: Allow 443 from internet
- App tier: Allow from web tier only
- Data tier: Allow from app tier only
- Management: Allow from VPN/bastion only

**Ingress/Egress Control:**
- Ingress: Only HTTPS (443) from internet
- Egress: Only to approved external services
- Internal: Only between authorized services
- Database: Only from application servers`
    },
    {
      id: '12.4.2',
      title: '2. TLS and Certificate Management',
      content: `**TLS Configuration:**

**Requirements:**
- TLS 1.3 only (disable TLS 1.0, 1.1, 1.2)
- Strong cipher suites only
- HSTS enabled (max-age: 31536000)
- Certificate pinning for critical services
- Automatic certificate renewal

**Certificate Sources:**
- Let's Encrypt: Free, automated, 90-day certs
- Cloud provider certificates: Integrated, auto-renewed
- Commercial CA: Enterprise requirements

**Certificate Lifecycle:**
1. Request certificate (automated)
2. Validate domain ownership
3. Install certificate
4. Monitor expiration (30 days before)
5. Renew automatically
6. Rotate keys annually

**Internal TLS:**
- Service-to-service communication encrypted
- Internal certificates for microservices
- mTLS for critical services
- Certificate rotation automated`
    },
    {
      id: '12.4.3',
      title: '3. Access Control and Privileged Access',
      content: `**Access Control Model:**

**Principle of Least Privilege:**
- Users get minimum necessary access
- Services get minimum necessary permissions
- Temporary access for specific tasks
- Regular access reviews

**Access Categories:**

**1. Production Access**
- Who: Operations team only
- How: VPN + MFA + bastion host
- Duration: Session-based
- Audit: Full logging

**2. Staging Access**
- Who: Development and QA teams
- How: VPN + MFA
- Duration: Session-based
- Audit: Basic logging

**3. Development Access**
- Who: Development team
- How: Local environment
- Duration: Permanent
- Audit: Code review

**Privileged Access Management:**

**Break-Glass Access:**
- Emergency access procedure
- Requires dual approval
- Time-limited (4 hours)
- Full audit trail
- Post-incident review

**Just-In-Time Access:**
- Request temporary access
- Specify duration and reason
- Approval workflow
- Automatic expiration
- Audit logging

**Service Accounts:**
- Dedicated accounts for services
- Minimal permissions
- Rotated credentials
- No interactive login
- Audit all usage`
    },
    {
      id: '12.4.4',
      title: '4. Infrastructure Hardening',
      content: `**Server Hardening:**

**Operating System:**
- Minimal installation (no unnecessary packages)
- Automatic security updates
- Firewall enabled (default deny)
- SSH key-only authentication
- Disable root login
- Fail2ban for brute force protection

**Application Security:**
- Run as non-root user
- Read-only filesystem where possible
- No unnecessary ports open
- Security headers (CSP, HSTS, X-Frame-Options)
- Input validation and sanitization
- Output encoding

**Database Security:**
- Encrypted connections (TLS)
- Strong authentication
- Limited user permissions
- Regular security patches
- Audit logging enabled
- Backup encryption

**Container Security:**
- Non-root containers
- Read-only filesystem
- Resource limits (CPU, memory)
- Security scanning (Trivy, Snyk)
- Minimal base images
- Signed images`
    },
    {
      id: '12.4.5',
      title: '5. Vulnerability Management',
      content: `**Vulnerability Scanning:**

**Automated Scanning:**
- Dependency scanning (npm audit, Snyk)
- Container scanning (Trivy)
- Infrastructure scanning (AWS Inspector)
- Web application scanning (OWASP ZAP)
- Code scanning (GitHub CodeQL)

**Scan Frequency:**
- Dependencies: Every PR + daily
- Containers: Every build
- Infrastructure: Weekly
- Web application: Monthly
- Code: Every PR

**Vulnerability Triage:**

**Severity Levels:**
- Critical: Fix within 24 hours
- High: Fix within 7 days
- Medium: Fix within 30 days
- Low: Fix within 90 days

**Triage Process:**
1. Detect vulnerability
2. Assess severity and impact
3. Determine if exploitable
4. Assign to owner
5. Schedule fix
6. Verify fix
7. Document resolution

**Patch Management:**

**Patch Categories:**
- Security patches: Priority (24-72 hours)
- Bug fixes: Standard (1-2 weeks)
- Feature updates: Planned (monthly)
- Major upgrades: Scheduled (quarterly)

**Patch Process:**
1. Test in development
2. Deploy to staging
3. Validate functionality
4. Schedule production deployment
5. Deploy with rollback plan
6. Monitor post-deployment
7. Document changes`
    }
  ]
};

export const stage12Doc5: Document = {
  id: 'scaling-capacity-cost',
  number: 5,
  title: 'Scaling, Capacity, and Cost Management',
  shortTitle: 'Scaling & Cost',
  description: 'Scaling strategy, capacity planning, performance optimization, and cost management.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.5.1',
      title: '1. Scaling Strategy',
      content: `**Scaling Dimensions:**

**1. Application Scaling**
- Horizontal: Add more instances
- Vertical: Increase instance size
- Auto-scaling: Based on metrics
- Manual scaling: For predictable loads

**Application Auto-Scaling:**
\`\`\`
Trigger: CPU > 70% for 5 minutes
Action: Add 1 instance
Cooldown: 5 minutes
Min instances: 2
Max instances: 10
\`\`\`

**2. Database Scaling**
- Read replicas: For read-heavy workloads
- Connection pooling: Reduce connection overhead
- Query optimization: Index tuning, query rewriting
- Vertical scaling: Increase database size
- Sharding: For very large datasets (future)

**Database Scaling Triggers:**
- CPU > 70% sustained
- Connection count > 80% of limit
- Query latency > 100ms (p95)
- Storage > 70% of capacity

**3. Cache Scaling**
- Redis cluster: Distributed cache
- Cache eviction: LRU policy
- Cache warming: Pre-load hot data
- Multi-tier cache: L1 (in-memory), L2 (Redis)

**4. Background Worker Scaling**
- Worker count: Based on queue depth
- Auto-scaling: Add workers when queue grows
- Priority queues: Critical jobs first
- Dead letter queue: Failed job handling

**Scaling Milestones:**

**Phase 1: Initial (0-1000 users)**
- 2 application instances
- 1 database (primary)
- 1 Redis instance
- 2 background workers
- Estimated cost: $200-500/month

**Phase 2: Growth (1000-10,000 users)**
- 4-6 application instances (auto-scaling)
- 1 database primary + 1 read replica
- Redis cluster (3 nodes)
- 4-6 background workers
- Estimated cost: $1000-3000/month

**Phase 3: Scale (10,000-100,000 users)**
- 10-20 application instances
- Database cluster with multiple replicas
- Redis cluster (6+ nodes)
- 10-20 background workers
- Estimated cost: $5000-15000/month`
    },
    {
      id: '12.5.2',
      title: '2. Capacity Planning',
      content: `**Capacity Metrics:**

**Application:**
- Requests per second (RPS)
- Concurrent users
- CPU utilization
- Memory usage
- Response time (p50, p95, p99)

**Database:**
- Queries per second
- Connection count
- Storage usage
- Replication lag
- Query latency

**Cache:**
- Hit rate
- Memory usage
- Eviction rate
- Connection count

**Queue:**
- Queue depth
- Processing rate
- Retry rate
- Dead letter count

**Capacity Planning Process:**

**1. Baseline Measurement**
- Measure current performance
- Identify bottlenecks
- Document resource usage
- Establish baseline metrics

**2. Growth Projection**
- Project user growth (monthly)
- Project data growth (monthly)
- Project transaction growth
- Factor in seasonal patterns

**3. Capacity Requirements**
- Calculate required resources
- Identify scaling triggers
- Plan scaling timeline
- Budget for infrastructure

**4. Scaling Plan**
- Define scaling milestones
- Plan infrastructure upgrades
- Schedule capacity additions
- Document scaling procedures

**Capacity Buffer:**
- Maintain 30% headroom for unexpected growth
- Plan for 2x peak load
- Scale before reaching limits
- Monitor trends continuously`
    },
    {
      id: '12.5.3',
      title: '3. Performance Optimization',
      content: `**Optimization Areas:**

**1. Application Performance**
- Code optimization: Reduce complexity
- Caching: Cache frequently accessed data
- Lazy loading: Load data on demand
- Pagination: Limit result sets
- Compression: Compress responses

**2. Database Performance**
- Indexing: Add indexes for common queries
- Query optimization: Rewrite slow queries
- Connection pooling: Reuse connections
- Read replicas: Offload read queries
- Partitioning: Partition large tables

**3. Cache Performance**
- Cache hit rate: Target > 90%
- Cache TTL: Appropriate expiration
- Cache invalidation: Efficient updates
- Cache warming: Pre-load hot data

**4. Network Performance**
- CDN: Cache static assets
- Compression: Reduce payload size
- HTTP/2: Multiplexing
- Connection pooling: Reuse connections

**Performance Monitoring:**
- APM tools: New Relic, Datadog, or similar
- Custom metrics: Business-specific metrics
- Real-user monitoring: Frontend performance
- Synthetic monitoring: Automated tests

**Performance Budgets:**
- Page load: < 3 seconds
- API response: < 500ms (p95)
- Database query: < 100ms (p95)
- Cache hit: > 90%`
    },
    {
      id: '12.5.4',
      title: '4. Cost Management',
      content: `**Cost Categories:**

**1. Infrastructure Costs**
- Compute: Application servers, workers
- Database: PostgreSQL, Redis
- Storage: Object storage, backups
- Network: Data transfer, CDN
- Monitoring: Logging, APM tools

**2. Service Costs**
- Authentication provider
- Email service
- AI/ML providers (LLM API calls)
- Third-party integrations
- Support tools

**3. Personnel Costs**
- Development team
- Operations team
- Support team
- Management

**Cost Optimization Strategies:**

**1. Right-Sizing**
- Monitor actual usage
- Downsize over-provisioned resources
- Use auto-scaling for variable loads
- Reserve instances for predictable loads

**2. Spot/Preemptible Instances**
- Use for batch jobs
- Use for non-critical workloads
- 60-90% cost savings
- Accept interruptions

**3. Caching**
- Reduce database queries
- Reduce API calls
- Reduce compute costs
- Improve performance

**4. Data Lifecycle**
- Archive old data
- Delete unnecessary data
- Compress data
- Use appropriate storage tiers

**Cost Monitoring:**
- Daily cost reports
- Budget alerts (80%, 90%, 100%)
- Cost allocation by team/project
- Trend analysis
- Forecasting

**Cost Targets:**
- Infrastructure: < 10% of revenue (initial)
- Services: < 5% of revenue
- Personnel: < 50% of revenue
- Total: < 65% of revenue`
    }
  ]
};

export const stage12Doc6: Document = {
  id: 'monitoring-logging-tracing',
  number: 6,
  title: 'Monitoring, Logging, and Tracing Specification',
  shortTitle: 'Monitoring & Observability',
  description: 'Comprehensive observability strategy including monitoring, logging, tracing, and alerting.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.6.1',
      title: '1. Observability Strategy',
      content: `**Three Pillars of Observability:**

**1. Metrics**
- What is happening?
- Quantitative measurements
- Time-series data
- Aggregated views

**2. Logs**
- What happened?
- Discrete events
- Detailed records
- Searchable history

**3. Traces**
- How did it happen?
- Request flow across services
- Latency breakdown
- Dependency mapping

**Observability Tools:**

**Metrics:**
- Prometheus: Open-source metrics collection
- Grafana: Metrics visualization
- Datadog: All-in-one platform (paid)
- New Relic: APM and metrics (paid)

**Logging:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki + Grafana: Lightweight logging
- Datadog Logs: Integrated logging
- CloudWatch Logs: AWS-native

**Tracing:**
- Jaeger: Open-source distributed tracing
- Zipkin: Distributed tracing
- OpenTelemetry: Unified observability standard
- Datadog APM: Integrated tracing

**Recommendation:** Start with open-source (Prometheus + Grafana + Loki), migrate to Datadog/New Relic if budget allows.

**Observability Requirements:**
- Collect metrics from all services
- Centralized logging
- Distributed tracing for critical paths
- Real-time dashboards
- Automated alerting
- Long-term retention (30 days metrics, 90 days logs)`
    },
    {
      id: '12.6.2',
      title: '2. Metrics and Monitoring',
      content: `**Application Metrics:**

**HTTP Metrics:**
\`\`\`
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}
http_request_size_bytes{method, path}
http_response_size_bytes{method, path}
\`\`\`

**Database Metrics:**
\`\`\`
db_query_duration_seconds{query_type}
db_connections_active{pool}
db_connections_waiting{pool}
db_query_errors_total{error_type}
\`\`\`

**Business Metrics:**
\`\`\`
leads_created_total{tenant_id}
opportunities_won_total{tenant_id}
invoices_paid_total{tenant_id}
background_jobs_completed_total{job_type}
\`\`\`

**Infrastructure Metrics:**
\`\`\`
cpu_usage_percent{instance}
memory_usage_bytes{instance}
disk_usage_bytes{instance}
network_io_bytes{instance}
\`\`\`

**Dashboards:**

**1. System Overview**
- Request rate
- Error rate
- Response time (p50, p95, p99)
- Active users
- System health

**2. Application Performance**
- API endpoint performance
- Database query performance
- Cache hit rate
- Background job performance

**3. Business Metrics**
- User activity
- Transaction volume
- Revenue metrics
- Feature usage

**4. Infrastructure Health**
- Server health
- Database health
- Cache health
- Queue health

**Alerting Rules:**

**Critical Alerts (Page immediately):**
- Application down
- Database down
- Error rate > 5% for 5 minutes
- Response time > 5s for 5 minutes

**Warning Alerts (Notify within 15 minutes):**
- Error rate > 1% for 10 minutes
- Response time > 2s for 10 minutes
- Disk usage > 80%
- Memory usage > 85%

**Info Alerts (Notify during business hours):**
- Deployment completed
- Backup completed
- Certificate expiring in 30 days
- Unusual traffic patterns`
    },
    {
      id: '12.6.3',
      title: '3. Logging Strategy',
      content: `**Logging Standards:**

**Log Format:**
\`\`\`json
{
  "timestamp": "2026-01-29T10:00:00Z",
  "level": "info",
  "message": "User logged in",
  "service": "web",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "request_id": "req-789",
  "duration_ms": 150,
  "metadata": {}
}
\`\`\`

**Log Levels:**
- **DEBUG**: Detailed debugging information
- **INFO**: Normal operational messages
- **WARN**: Warning conditions
- **ERROR**: Error conditions
- **FATAL**: Critical errors requiring immediate attention

**What to Log:**

**Always Log:**
- Application startup/shutdown
- User authentication events
- Authorization decisions
- API requests (summary)
- Errors and exceptions
- Security events
- Business-critical operations

**Log with Caution:**
- Request/response bodies (sanitize)
- Database queries (no sensitive data)
- External API calls (no secrets)
- Background job details

**Never Log:**
- Passwords or credentials
- API keys or secrets
- Credit card numbers
- Personal identifiable information (PII)
- Session tokens
- Database connection strings

**Log Sanitization:**
\`\`\`typescript
function sanitizeLog( any): any {
  const sensitiveFields = [
    'password', 'secret', 'token', 'apiKey',
    'creditCard', 'ssn', 'authorization'
  ];
  
  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
\`\`\`

**Log Retention:**
- Application logs: 30 days
- Security logs: 1 year
- Audit logs: 7 years
- Debug logs: 7 days

**Log Aggregation:**
- Centralized logging service
- Structured log format (JSON)
- Log indexing for search
- Log rotation and archival
- Log access control`
    },
    {
      id: '12.6.4',
      title: '4. Distributed Tracing',
      content: `**Tracing Strategy:**

**What to Trace:**
- User requests end-to-end
- API calls across services
- Database queries
- External service calls
- Background job processing
- AI/ML inference

**Trace Context:**
\`\`\`
Trace ID: Unique identifier for entire request
Span ID: Identifier for individual operation
Parent Span ID: Parent operation
Service Name: Service generating span
Operation Name: What operation occurred
Start Time: When operation started
Duration: How long operation took
Tags: Key-value metadata
Logs: Events within span
\`\`\`

**Implementation:**

**OpenTelemetry (Recommended):**
\`\`\`typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('clickit-web');

async function handleRequest(req: Request) {
  return tracer.startActiveSpan('http.request', async (span) => {
    try {
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.url);
      
      const result = await processRequest(req);
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
\`\`\`

**Trace Visualization:**
- Service map: Visualize service dependencies
- Trace timeline: See request flow across services
- Latency breakdown: Identify bottlenecks
- Error tracking: Find failure points

**Trace Retention:**
- Recent traces: 7 days (detailed)
- Sampled traces: 30 days (representative)
- Error traces: 90 days (all errors)

**Performance Impact:**
- Sampling rate: 10% for normal traffic, 100% for errors
- Overhead: < 5% performance impact
- Storage: Monitor trace storage costs`
    }
  ]
};

export const stage12Doc7: Document = {
  id: 'backup-restore-disaster-recovery',
  number: 7,
  title: 'Backup, Restore, and Disaster Recovery Plan',
  shortTitle: 'Backup & DR',
  description: 'Backup strategy, restore procedures, disaster recovery planning, and business continuity.',
  status: 'Recorded',
  stage: 12,
  sections: [
    {
      id: '12.7.1',
      title: '1. Backup Strategy',
      content: `**Backup Types:**

**1. Database Backups**
- **Full Backup:** Complete database snapshot
  - Frequency: Daily
  - Retention: 30 days
  - Storage: Encrypted, separate region
  
- **Incremental Backup:** Changes since last backup
  - Frequency: Hourly
  - Retention: 7 days
  - Storage: Encrypted, same region
  
- **Point-in-Time Recovery (PITR):** Continuous WAL archiving
  - Capability: Restore to any second
  - Retention: 7 days
  - Storage: Encrypted, separate region

**2. File Storage Backups**
- **Object Storage:** Cross-region replication
  - Frequency: Continuous
  - Retention: Versioning enabled
  - Storage: Multiple regions
  
- **Configuration Files:** Version controlled
  - Frequency: Every change (Git)
  - Retention: Permanent
  - Storage: Git repository

**3. Application Backups**
- **Code:** Version controlled
  - Frequency: Every commit
  - Retention: Permanent
  - Storage: Git repository
  
- **Secrets:** Encrypted backups
  - Frequency: Daily
  - Retention: 30 days
  - Storage: Secrets manager

**Backup Schedule:**

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Database Full | Daily 2 AM | 30 days | Separate region |
| Database Incremental | Hourly | 7 days | Same region |
| Database PITR | Continuous | 7 days | Separate region |
| File Storage | Continuous | Versioning | Multiple regions |
| Configuration | Every change | Permanent | Git |
| Secrets | Daily | 30 days | Secrets manager |

**Backup Verification:**
- Automated backup success checks
- Weekly restore tests (random sample)
- Monthly full restore test
- Quarterly disaster recovery test
- Document all test results`
    },
    {
      id: '12.7.2',
      title: '2. Recovery Procedures',
      content: `**Recovery Scenarios:**

**Scenario 1: Accidental Data Deletion**
- **Impact:** Single tenant or specific records
- **RPO:** < 1 hour (PITR)
- **RTO:** < 2 hours
- **Procedure:**
  1. Identify deletion time
  2. Restore database to point before deletion
  3. Extract deleted records
  4. Re-insert into production
  5. Verify data integrity

**Scenario 2: Database Corruption**
- **Impact:** Entire database unavailable
- **RPO:** < 1 hour (PITR)
- **RTO:** < 4 hours
- **Procedure:**
  1. Stop application
  2. Restore from latest backup
  3. Apply WAL logs to desired point
  4. Verify database integrity
  5. Restart application
  6. Monitor for issues

**Scenario 3: Complete Infrastructure Loss**
- **Impact:** All services unavailable
- **RPO:** < 24 hours (daily backups)
- **RTO:** < 8 hours
- **Procedure:**
  1. Provision new infrastructure (IaC)
  2. Restore database from backup
  3. Restore file storage from backup
  4. Deploy application
  5. Restore secrets
  6. Verify all services
  7. Update DNS if needed
  8. Monitor closely

**Scenario 4: Security Breach**
- **Impact:** Data compromise
- **RPO:** Before breach
- **RTO:** < 4 hours
- **Procedure:**
  1. Isolate affected systems
  2. Preserve evidence
  3. Assess breach scope
  4. Restore from clean backup (before breach)
  5. Rotate all credentials
  6. Patch vulnerabilities
  7. Notify affected parties
  8. Document incident

**Recovery Testing:**

**Weekly Tests:**
- Restore random database backup
- Verify data integrity
- Document results

**Monthly Tests:**
- Full database restore
- Application deployment
- End-to-end verification
- Document results

**Quarterly Tests:**
- Complete disaster recovery simulation
- All services restored
- Business continuity verified
- Document results
- Update procedures based on lessons learned`
    },
    {
      id: '12.7.3',
      title: '3. Disaster Recovery Plan',
      content: `**DR Strategy:**

**Recovery Point Objective (RPO):**
- Database: < 1 hour (PITR capability)
- Files: < 24 hours (daily backups)
- Configuration: < 1 hour (version controlled)
- **Recommended RPO:** 1 hour for critical data

**Recovery Time Objective (RTO):**
- Application: < 30 minutes (auto-scaling)
- Database: < 1 hour (automated failover)
- Full recovery: < 4 hours (manual intervention)
- **Recommended RTO:** 4 hours for full recovery

**DR Site Strategy:**

**Option A: Warm Standby (Recommended)**
- Secondary region with scaled-down infrastructure
- Database replication to secondary region
- Application can be scaled up quickly
- Cost: 30-50% of production
- RTO: < 2 hours

**Option B: Pilot Light**
- Minimal infrastructure in secondary region
- Database backups replicated
- Application deployed on-demand
- Cost: 10-20% of production
- RTO: < 4 hours

**Option C: Multi-Region Active-Active**
- Both regions handle traffic
- Real-time data replication
- Automatic failover
- Cost: 100% of production (double)
- RTO: < 15 minutes

**Recommendation:** Pilot light for initial, evolve to warm standby as business grows.

**DR Activation Procedure:**

**1. Declaration**
- Incident commander declares DR activation
- Notify all stakeholders
- Activate DR team

**2. Assessment**
- Assess primary site status
- Determine recovery strategy
- Estimate recovery time

**3. Failover**
- Switch DNS to DR site
- Scale up DR infrastructure
- Restore database from replication
- Verify data integrity

**4. Verification**
- Test all critical functions
- Verify data consistency
- Confirm user access
- Monitor performance

**5. Communication**
- Notify customers of incident
- Provide status updates
- Communicate resolution timeline

**6. Recovery**
- Monitor DR site closely
- Plan primary site recovery
- Execute failback when ready

**DR Testing:**
- Quarterly DR drills
- Document all test results
- Update procedures based on lessons
- Train team on DR procedures`
    }
  ]
};
