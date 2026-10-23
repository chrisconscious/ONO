# Data Classification and Privacy Policy

**Document ID:** SEC-7.7  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines the data classification framework and privacy governance policies for the ClickIT platform. It establishes how different types of data are classified, protected, and handled throughout their lifecycle.

**Key Principles:**
- Data minimization: Collect only what is necessary
- Purpose limitation: Use data only for stated purposes
- Classification-based protection: Higher classification = stronger protection
- Privacy by design: Privacy considerations in all features
- Transparent data handling: Clear policies and user communication
- Compliance with applicable regulations

---

## 2. Data Classification Framework

### 2.1 Classification Levels

**Level 1: Public**
- **Definition:** Information that can be freely shared
- **Examples:**
  - Public product catalog (if enabled)
  - Help documentation
  - Marketing materials
  - Public API documentation
- **Protection Requirements:**
  - Standard access controls
  - TLS in transit
  - Standard encryption at rest
- **Access:** Anyone (including unauthenticated users where appropriate)

**Level 2: Internal**
- **Definition:** Information for internal business use
- **Examples:**
  - Employee directory (within organization)
  - Internal reports and metrics
  - Operational procedures
  - Internal communications
  - System configurations
- **Protection Requirements:**
  - Authenticated access required
  - Tenant isolation enforced
  - TLS in transit
  - Standard encryption at rest
  - Access logged
- **Access:** Authenticated users within appropriate scope

**Level 3: Confidential**
- **Definition:** Sensitive business information requiring protection
- **Examples:**
  - Customer data (PII, contact information)
  - Financial records (invoices, payments, expenses)
  - Contracts and agreements
  - Pricing and cost information
  - Employee personal information
  - Business strategies and plans
  - Performance reviews
- **Protection Requirements:**
  - Role-based access control
  - Field-level security where appropriate
  - TLS in transit
  - Encrypted at rest
  - Field-level encryption for PII
  - Enhanced audit logging
  - Access requires business justification
  - Export restrictions
- **Access:** Authorized users with business need

**Level 4: Highly Restricted**
- **Definition:** Critical information requiring maximum protection
- **Examples:**
  - Authentication credentials (passwords, API keys, tokens)
  - Encryption keys and certificates
  - Payment card data (if applicable)
  - Health information (if applicable)
  - Government IDs (passport, national ID)
  - Bank account details
  - Security configurations
  - Audit logs (immutable)
- **Protection Requirements:**
  - Minimal access (explicit authorization required)
  - Enhanced audit logging
  - Encrypted at rest with separate key management
  - Never logged in plaintext
  - Never exposed via API
  - Access requires multi-party approval
  - Time-limited access grants
  - Automatic access revocation
- **Access:** Minimal personnel with explicit authorization

### 2.2 Classification Assignment

**Automatic Classification:**
```typescript
const DATA_CLASSIFICATIONS = {
  // Public
  'help.documentation': 'public',
  'marketing.materials': 'public',
  
  // Internal
  'employee.directory': 'internal',
  'internal.reports': 'internal',
  'system.configuration': 'internal',
  
  // Confidential
  'customer.data': 'confidential',
  'financial.records': 'confidential',
  'contracts': 'confidential',
  'pricing': 'confidential',
  'employee.personal': 'confidential',
  'performance.reviews': 'confidential',
  
  // Highly Restricted
  'credentials': 'highly_restricted',
  'encryption.keys': 'highly_restricted',
  'payment.cards': 'highly_restricted',
  'health.data': 'highly_restricted',
  'government.ids': 'highly_restricted',
  'bank.accounts': 'highly_restricted',
  'audit.logs': 'highly_restricted'
};
```

**Manual Classification:**
- Data owners can classify data
- Classification must be reviewed by security team
- Classification changes logged
- Reclassification requires approval

### 2.3 Data Entity Classification

**User Data:**
- Email: Confidential
- Name: Confidential
- Phone: Confidential
- Password hash: Highly Restricted
- MFA secret: Highly Restricted
- Avatar: Internal

**CRM Data:**
- Lead: Confidential
- Contact: Confidential
- Company: Confidential
- Activity: Internal
- Communication: Confidential

**Sales Data:**
- Opportunity: Confidential
- Quotation: Confidential
- Order: Confidential
- Contract: Confidential
- Pricing: Confidential

**Finance Data:**
- Invoice: Confidential
- Payment: Confidential
- Expense: Confidential
- Budget: Confidential
- Financial reports: Confidential

**HR Data:**
- Employee record: Confidential
- Salary: Highly Restricted
- Performance review: Confidential
- Medical data: Highly Restricted (if applicable)

**System Data:**
- Audit logs: Highly Restricted
- System configuration: Internal
- Integration credentials: Highly Restricted
- API keys: Highly Restricted

---

## 3. Data Handling Rules

### 3.1 Data Collection

**Collection Principles:**
- Collect only data necessary for business purpose
- Inform users what data is collected and why
- Obtain consent where required
- Minimize data collection from third parties

**Collection Requirements:**
```typescript
interface DataCollection {
  purpose: string;           // Why collecting
  legalBasis: string;        // Legal justification
  retentionPeriod: string;   // How long to keep
  dataMinimized: boolean;    // Is collection minimized?
  userInformed: boolean;     // User informed?
  consentObtained: boolean;  // Consent obtained (if required)?
}
```

### 3.2 Data Storage

**Storage Requirements by Classification:**

**Public:**
- Standard storage
- TLS in transit
- Standard encryption at rest

**Internal:**
- Tenant-isolated storage
- TLS in transit
- Standard encryption at rest
- Access logging

**Confidential:**
- Tenant-isolated storage
- TLS in transit
- Encrypted at rest
- Field-level encryption for PII
- Enhanced access logging
- Access control enforcement

**Highly Restricted:**
- Tenant-isolated storage
- TLS in transit
- Encrypted at rest with separate key management
- Field-level encryption
- Enhanced access logging
- Strict access control
- Time-limited access grants

**Encryption Standards:**
- In transit: TLS 1.3
- At rest: AES-256
- Field-level: AES-256-GCM
- Key management: Separate KMS for highly restricted data

### 3.3 Data Access

**Access Control by Classification:**

**Public:**
- No authentication required (where appropriate)
- No special restrictions

**Internal:**
- Authentication required
- Tenant isolation enforced
- Access logged

**Confidential:**
- Authentication required
- Role-based access control
- Data scope enforcement
- Enhanced audit logging
- Business justification may be required

**Highly Restricted:**
- Authentication required
- Explicit authorization required
- Multi-party approval for access
- Time-limited access grants
- Enhanced audit logging
- Access justification required
- Automatic access revocation

### 3.4 Data Processing

**Processing Rules:**
- Process data only for stated purpose
- Minimize data processing
- Use anonymization where possible
- Protect data during processing
- Log processing activities

**AI/ML Processing:**
- Tenant data not used for cross-tenant model training
- Explicit consent required for analytics use
- Data minimization in AI context
- Anonymization where possible
- Processing logged and auditable

### 3.5 Data Sharing

**Sharing Rules:**

**Internal Sharing:**
- Within tenant: Based on permissions and scope
- Cross-tenant: Never (except explicit integrations)

**External Sharing:**
- Requires explicit authorization
- Data processing agreement required
- Purpose limitation enforced
- Retention limits applied
- Audit trail maintained

**Sharing with AI Providers:**
- Explicit consent required
- Data minimization applied
- Provider must meet security requirements
- No cross-tenant data mixing
- Processing logged

### 3.6 Data Export

**Export Controls by Classification:**

**Public:**
- No restrictions

**Internal:**
- Authenticated users can export
- Export logged
- Size limits apply

**Confidential:**
- Export requires explicit permission
- Export logged with full details
- Size limits apply
- Rate limiting
- Sensitive fields may be masked

**Highly Restricted:**
- Export requires multi-party approval
- Enhanced logging
- Strict size limits
- Time-limited export access
- Automatic expiration

### 3.7 Data Retention

**Retention Policies:**

**Transactional Data:**
- Active records: Indefinite (while business active)
- Archived records: 7 years after archival
- Deleted records: 30 days (soft delete), then hard delete

**Audit Logs:**
- Security events: 10 years
- Operational events: 7 years
- System events: 3 years

**User Data:**
- Active accounts: Indefinite
- Deactivated accounts: 7 years after deactivation
- Deleted accounts: 30 days (soft delete), then hard delete

**Financial Records:**
- Invoices and payments: 7 years (legal requirement)
- Tax records: 7 years (legal requirement)
- Financial reports: 7 years

**Legal Hold:**
- Data under legal hold preserved indefinitely
- Normal retention suspended
- Hold released by legal team

### 3.8 Data Deletion

**Deletion Process:**

**Soft Delete:**
- Mark record as deleted (deleted_at timestamp)
- Record excluded from normal queries
- Record preserved for retention period
- Can be restored if needed

**Hard Delete:**
- Permanently remove record
- Remove all references
- Log deletion event
- Cannot be restored

**Deletion Triggers:**
- User request (right to erasure)
- Retention period expired
- Legal requirement
- Business decision

**Deletion Verification:**
- Verify all references removed
- Verify backups handled
- Verify logs anonymized
- Verify deletion logged

---

## 4. Privacy Governance

### 4.1 Privacy Principles

**Data Minimization:**
- Collect only necessary data
- Limit data processing to purpose
- Anonymize where possible
- Delete when no longer needed

**Purpose Limitation:**
- Collect data for specified purposes
- Use data only for those purposes
- Obtain consent for new purposes
- Document purpose changes

**Transparency:**
- Clear privacy policy
- Inform users of data collection
- Explain data usage
- Provide access to data

**User Rights:**
- Right to access data
- Right to correct data
- Right to delete data
- Right to data portability
- Right to object to processing

### 4.2 Consent Management

**Consent Requirements:**
- Explicit consent for marketing
- Explicit consent for analytics (beyond operational)
- Explicit consent for third-party sharing
- Consent withdrawal mechanism
- Consent audit trail

**Consent Record:**
```typescript
interface Consent {
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  method: string;  // How consent obtained
  version: string; // Consent form version
}
```

### 4.3 Data Subject Rights

**Right to Access:**
- Users can request copy of their data
- Response within 30 days
- Data provided in machine-readable format
- No charge for first request

**Right to Correction:**
- Users can correct inaccurate data
- Corrections logged
- Corrections propagated to integrations

**Right to Erasure:**
- Users can request data deletion
- Deletion within 30 days
- Exceptions for legal requirements
- Deletion logged

**Right to Portability:**
- Users can request data export
- Export in standard format (JSON, CSV)
- Export within 30 days
- No charge for export

**Right to Object:**
- Users can object to processing
- Processing stopped unless legitimate grounds
- Objection logged and reviewed

### 4.4 Privacy Impact Assessment

**PIA Requirements:**
- Required for new features processing personal data
- Required for changes to data processing
- Required for new integrations
- Required for AI/ML features

**PIA Process:**
1. Identify data processing activity
2. Assess necessity and proportionality
3. Identify privacy risks
4. Identify mitigation measures
5. Document assessment
6. Obtain approval
7. Implement controls
8. Monitor and review

---

## 5. Regulatory Compliance

### 5.1 Applicable Regulations

**Tanzania Data Protection Act (if applicable):**
- Data protection principles
- Data subject rights
- Data processor obligations
- Data breach notification
- Cross-border transfer restrictions

**General Data Protection Regulation (GDPR) (if EU data subjects):**
- Lawful basis for processing
- Data subject rights
- Data protection by design
- Data breach notification (72 hours)
- Data protection officer (if required)
- Cross-border transfer mechanisms

**Industry-Specific Regulations:**
- Healthcare: HIPAA (if applicable)
- Finance: PCI DSS (if handling payment cards)
- Other industry regulations as applicable

### 5.2 Compliance Controls

**Data Protection Controls:**
- Encryption in transit and at rest
- Access control enforcement
- Audit logging
- Data minimization
- Purpose limitation
- Retention policies
- Deletion procedures

**User Rights Controls:**
- Data access requests
- Data correction requests
- Data deletion requests
- Data portability requests
- Consent management

**Breach Notification:**
- Breach detection mechanisms
- Breach assessment procedures
- Notification timelines (72 hours for GDPR)
- Notification templates
- Regulatory reporting

### 5.3 Cross-Border Data Transfers

**Transfer Restrictions:**
- Data residency requirements (if applicable)
- Adequacy decisions
- Standard contractual clauses
- Binding corporate rules
- Explicit consent for transfers

**Transfer Controls:**
- Identify data transfers
- Assess transfer legality
- Implement transfer mechanisms
- Document transfers
- Monitor transfers

---

## 6. Data Breach Response

### 6.1 Breach Detection

**Detection Mechanisms:**
- Security monitoring
- Anomaly detection
- User reports
- Third-party notifications
- Audit log analysis

**Breach Indicators:**
- Unauthorized access detected
- Data exfiltration detected
- System compromise detected
- Credential theft detected
- Unusual access patterns

### 6.2 Breach Assessment

**Assessment Process:**
1. Confirm breach occurred
2. Identify data affected
3. Identify users affected
4. Assess impact severity
5. Determine notification requirements
6. Document assessment

**Impact Assessment:**
- Data classification level
- Number of users affected
- Data sensitivity
- Potential harm to users
- Regulatory requirements

### 6.3 Breach Notification

**Notification Requirements:**

**To Regulators:**
- Within 72 hours (GDPR)
- As required by local regulations
- Include breach details
- Include mitigation measures

**To Users:**
- Without undue delay
- Clear description of breach
- Description of data affected
- Description of potential impact
- Description of mitigation measures
- Contact information

**Notification Template:**
```
Subject: Security Incident Notification

Dear [User],

We are writing to inform you of a security incident that may have affected your personal data.

What happened:
[Description of incident]

What data was affected:
[List of data types]

What we are doing:
[Description of response measures]

What you can do:
[Recommended actions]

Contact us:
[Contact information]

We apologize for any inconvenience this may cause.

Sincerely,
[Company] Security Team
```

---

## 7. Training and Awareness

### 7.1 Security Training

**Training Requirements:**
- All employees: Annual security awareness training
- Developers: Secure coding training
- Administrators: Privileged access training
- Support staff: Data handling training

**Training Topics:**
- Data classification
- Privacy principles
- Security best practices
- Incident reporting
- Phishing awareness
- Password security

### 7.2 Privacy Awareness

**Awareness Programs:**
- Privacy policy communication
- Data handling procedures
- User rights procedures
- Breach reporting procedures
- Consent management

---

## 8. Compliance Monitoring

### 8.1 Monitoring Activities

**Regular Monitoring:**
- Access pattern analysis
- Data usage monitoring
- Export monitoring
- Integration monitoring
- AI/ML monitoring

**Compliance Audits:**
- Internal audits (quarterly)
- External audits (annual)
- Regulatory audits (as required)
- Customer audits (as required)

### 8.2 Compliance Reporting

**Reports:**
- Data processing activities
- Data subject requests
- Breach incidents
- Compliance status
- Risk assessment

---

## 9. References

- Stage 2: Data Architecture Plan
- Stage 3: Security Engineering Controls
- Stage 5: Data Architecture Plan
- GDPR (if applicable)
- Tanzania Data Protection Act (if applicable)
- ISO 27001 (Information Security Management)
- ISO 27701 (Privacy Information Management)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Privacy Officer / Security Architect
