# File, Export, and Integration Security

**Document ID:** SEC-7.10  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document defines security requirements for file uploads, data exports, and external integrations in the ClickIT platform. These features present unique security challenges including malware upload, data exfiltration, and third-party compromise.

**Key Principles:**
- Validate all file uploads (type, size, content)
- Scan files for malware
- Enforce export permissions and limits
- Secure integration credentials
- Verify webhook signatures
- Complete audit trail for all operations
- Tenant isolation for all file and integration operations

---

## 2. File Upload Security

### 2.1 File Validation

**Validation Layers:**
1. **File Type Validation** - Check MIME type and extension
2. **File Size Validation** - Enforce size limits
3. **Content Validation** - Verify file content matches type
4. **Malware Scanning** - Scan for viruses and malware
5. **Path Traversal Prevention** - Prevent directory traversal attacks

**Validation Implementation:**
```typescript
const ALLOWED_TYPES = {
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], maxSize: 5 * 1024 * 1024 },
  'image/png': { extensions: ['.png'], maxSize: 5 * 1024 * 1024 },
  'application/pdf': { extensions: ['.pdf'], maxSize: 10 * 1024 * 1024 },
  'text/csv': { extensions: ['.csv'], maxSize: 50 * 1024 * 1024 },
};

async function validateFileUpload(file: File): Promise<ValidationResult> {
  // 1. Check MIME type
  if (!ALLOWED_TYPES[file.type]) {
    throw new ValidationError('File type not allowed');
  }
  
  // 2. Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_TYPES[file.type].extensions.includes(extension)) {
    throw new ValidationError('File extension does not match type');
  }
  
  // 3. Check file size
  if (file.size > ALLOWED_TYPES[file.type].maxSize) {
    throw new ValidationError('File too large');
  }
  
  // 4. Validate file content (magic numbers)
  const isValid = await validateFileContent(file);
  if (!isValid) {
    throw new ValidationError('Invalid file content');
  }
  
  // 5. Scan for malware
  const scanResult = await virusScanner.scan(file);
  if (!scanResult.clean) {
    throw new ValidationError('File contains malware');
  }
  
  return { valid: true };
}
```

### 2.2 File Storage Security

**Storage Requirements:**
- Store files outside web root
- Use tenant-scoped paths
- Encrypt files at rest
- Generate unique filenames
- Prevent path traversal

**Storage Implementation:**
```typescript
async function storeFile(
  file: File,
  tenantId: string,
  userId: string
): Promise<StoredFile> {
  // Generate unique filename
  const fileId = generateUUID();
  const extension = file.name.split('.').pop();
  const storedFilename = `${fileId}.${extension}`;
  
  // Create tenant-scoped path
  const storagePath = `/tenants/${tenantId}/files/${storedFilename}`;
  
  // Encrypt and store file
  const encryptedData = await encryptFile(file.data);
  await objectStorage.put(storagePath, encryptedData);
  
  // Store file metadata
  const metadata = await db.file.create({
    data: {
      id: fileId,
      originalName: file.name,
      storedName: storedFilename,
      mimeType: file.type,
      size: file.size,
      storagePath,
      organizationId: tenantId,
      uploadedById: userId,
      uploadedAt: new Date(),
      classification: 'confidential',
    },
  });
  
  // Log upload
  await logAuditEvent({
    eventType: 'file.upload',
    actor: { id: userId },
    tenant: { id: tenantId },
    action: { type: 'upload', resource: 'file', resourceId: fileId },
    context: { filename: file.name, size: file.size, mimeType: file.type },
  });
  
  return metadata;
}
```

### 2.3 File Access Control

**Access Rules:**
- Verify user has permission to access file
- Verify file belongs to user's tenant
- Check data scope (own/team/department/org)
- Verify file classification allows access
- Log all file access

**Access Implementation:**
```typescript
async function getFile(
  fileId: string,
  context: AuthContext
): Promise<File> {
  // 1. Get file metadata
  const file = await db.file.findUnique({
    where: { id: fileId },
  });
  
  if (!file) {
    throw new NotFoundError('File not found');
  }
  
  // 2. Verify tenant ownership
  if (file.organizationId !== context.tenantId) {
    throw new ForbiddenError('File belongs to different tenant');
  }
  
  // 3. Check permissions
  if (!await hasPermission(context.userId, 'file:read', context.tenantId)) {
    throw new ForbiddenError('User cannot read files');
  }
  
  // 4. Check data scope
  if (!await isInScope(file, context.userId, context.membership)) {
    throw new ForbiddenError('File not in user scope');
  }
  
  // 5. Check classification
  if (file.classification === 'highly_restricted') {
    if (!await hasPermission(context.userId, 'file:read:restricted', context.tenantId)) {
      throw new ForbiddenError('User cannot access restricted files');
    }
  }
  
  // 6. Log access
  await logAuditEvent({
    eventType: 'file.access',
    actor: { id: context.userId },
    tenant: { id: context.tenantId },
    action: { type: 'read', resource: 'file', resourceId: fileId },
  });
  
  // 7. Retrieve and decrypt file
  const encryptedData = await objectStorage.get(file.storagePath);
  const decryptedData = await decryptFile(encryptedData);
  
  return {
    ...file,
    data: decryptedData,
  };
}
```

### 2.4 File Download Security

**Secure Download:**
```typescript
async function downloadFile(
  fileId: string,
  context: AuthContext
): Promise<Response> {
  const file = await getFile(fileId, context);
  
  // Generate signed URL (expires in 1 hour)
  const signedUrl = await objectStorage.getSignedUrl(
    file.storagePath,
    3600 // 1 hour
  );
  
  // Log download
  await logAuditEvent({
    eventType: 'file.download',
    actor: { id: context.userId },
    tenant: { id: context.tenantId },
    action: { type: 'download', resource: 'file', resourceId: fileId },
  });
  
  // Redirect to signed URL
  return Response.redirect(signedUrl);
}
```

---

## 3. Data Export Security

### 3.1 Export Authorization

**Authorization Requirements:**
- Explicit export permission required
- Data scope enforced (own/team/department/org)
- Classification-based restrictions
- Export size limits
- Export rate limiting

**Authorization Implementation:**
```typescript
async function authorizeExport(
  exportType: string,
  filters: any,
  context: AuthContext
): Promise<void> {
  // 1. Check export permission
  if (!await hasPermission(context.userId, 'data:export', context.tenantId)) {
    throw new ForbiddenError('User cannot export data');
  }
  
  // 2. Check data scope
  const scope = getScope(filters);
  if (!await hasScope(context.userId, scope, context.tenantId)) {
    throw new ForbiddenError('User cannot export data in this scope');
  }
  
  // 3. Check classification
  const classification = getExportClassification(exportType);
  if (classification === 'highly_restricted') {
    if (!await hasPermission(context.userId, 'data:export:restricted', context.tenantId)) {
      throw new ForbiddenError('User cannot export restricted data');
    }
    
    // Require approval for highly restricted exports
    const approval = await requestApproval({
      type: 'data_export',
      exportType,
      requestedBy: context.userId,
      tenantId: context.tenantId,
    });
    
    if (approval.status !== 'approved') {
      throw new ApprovalRequiredError('Export requires approval');
    }
  }
  
  // 4. Check export limits
  const recentExports = await getRecentExports(context.userId, '24h');
  if (recentExports.length >= 10) {
    throw new RateLimitError('Too many exports');
  }
}
```

### 3.2 Export Execution

**Export Process:**
```typescript
async function executeExport(
  exportType: string,
  filters: any,
  format: 'csv' | 'json' | 'pdf',
  context: AuthContext
): Promise<ExportResult> {
  // 1. Authorize export
  await authorizeExport(exportType, filters, context);
  
  // 2. Query data (with tenant filter)
  const data = await queryExportData(exportType, filters, context.tenantId);
  
  // 3. Check export size
  if (data.length > 10000) {
    throw new ValidationError('Export too large');
  }
  
  // 4. Format data
  let formattedData: string;
  if (format === 'csv') {
    formattedData = convertToCSV(data);
  } else if (format === 'json') {
    formattedData = JSON.stringify(data, null, 2);
  } else {
    formattedData = await generatePDF(data);
  }
  
  // 5. Store export file
  const exportId = generateUUID();
  const storagePath = `/tenants/${context.tenantId}/exports/${exportId}.${format}`;
  await objectStorage.put(storagePath, formattedData);
  
  // 6. Create export record
  const exportRecord = await db.export.create({
    data: {
      id: exportId,
      type: exportType,
      format,
      storagePath,
      recordCount: data.length,
      organizationId: context.tenantId,
      exportedById: context.userId,
      exportedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });
  
  // 7. Log export
  await logAuditEvent({
    eventType: 'data.export',
    actor: { id: context.userId },
    tenant: { id: context.tenantId },
    action: { type: 'export', resource: exportType },
    context: { format, recordCount: data.length, exportId },
  });
  
  return {
    exportId,
    downloadUrl: `/api/exports/${exportId}/download`,
    expiresAt: exportRecord.expiresAt,
  };
}
```

### 3.3 Export Download

**Secure Download:**
```typescript
async function downloadExport(
  exportId: string,
  context: AuthContext
): Promise<Response> {
  // 1. Get export record
  const exportRecord = await db.export.findUnique({
    where: { id: exportId },
  });
  
  if (!exportRecord) {
    throw new NotFoundError('Export not found');
  }
  
  // 2. Verify tenant ownership
  if (exportRecord.organizationId !== context.tenantId) {
    throw new ForbiddenError('Export belongs to different tenant');
  }
  
  // 3. Verify user ownership
  if (exportRecord.exportedById !== context.userId) {
    throw new ForbiddenError('User cannot download this export');
  }
  
  // 4. Check expiration
  if (exportRecord.expiresAt < new Date()) {
    throw new ValidationError('Export has expired');
  }
  
  // 5. Generate signed URL
  const signedUrl = await objectStorage.getSignedUrl(
    exportRecord.storagePath,
    3600 // 1 hour
  );
  
  // 6. Log download
  await logAuditEvent({
    eventType: 'data.export.download',
    actor: { id: context.userId },
    tenant: { id: context.tenantId },
    action: { type: 'download', resource: 'export', resourceId: exportId },
  });
  
  // 7. Redirect to signed URL
  return Response.redirect(signedUrl);
}
```

---

## 4. Integration Security

### 4.1 Integration Credentials

**Credential Storage:**
```typescript
interface IntegrationCredentials {
  id: string;
  integrationId: string;
  organizationId: string;
  credentialType: 'api_key' | 'oauth_token' | 'basic_auth';
  encryptedCredentials: string;  // Encrypted at rest
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
}

async function storeCredentials(
  integrationId: string,
  tenantId: string,
  credentials: any
): Promise<void> {
  // Encrypt credentials
  const encrypted = await encrypt(JSON.stringify(credentials));
  
  // Store encrypted credentials
  await db.integrationCredentials.create({
    data: {
      integrationId,
      organizationId: tenantId,
      credentialType: credentials.type,
      encryptedCredentials: encrypted,
      createdAt: new Date(),
    },
  });
  
  // Log credential storage
  await logAuditEvent({
    eventType: 'integration.credentials.stored',
    actor: { type: 'system' },
    tenant: { id: tenantId },
    action: { type: 'store', resource: 'credentials' },
    context: { integrationId },
  });
}
```

**Credential Access:**
```typescript
async function getCredentials(
  integrationId: string,
  tenantId: string
): Promise<any> {
  // Get encrypted credentials
  const record = await db.integrationCredentials.findFirst({
    where: {
      integrationId,
      organizationId: tenantId,
    },
  });
  
  if (!record) {
    throw new NotFoundError('Credentials not found');
  }
  
  // Decrypt credentials
  const decrypted = await decrypt(record.encryptedCredentials);
  const credentials = JSON.parse(decrypted);
  
  // Update last used
  await db.integrationCredentials.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });
  
  return credentials;
}
```

### 4.2 Webhook Security

**Webhook Signature Verification:**
```typescript
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/api/webhooks/:integrationId', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  // Get integration secret
  const integration = await getIntegration(req.params.integrationId);
  const secret = await getWebhookSecret(integration.id);
  
  // Verify signature
  const isValid = await verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    secret
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  await processWebhook(req.body, integration);
  
  res.status(200).json({ success: true });
});
```

**Webhook Replay Protection:**
```typescript
async function processWebhook(
  payload: any,
  integration: Integration
): Promise<void> {
  // Check for replay
  const webhookId = payload.id;
  const existing = await db.webhookProcessing.findUnique({
    where: { webhookId },
  });
  
  if (existing) {
    // Already processed (replay)
    return;
  }
  
  // Mark as processing
  await db.webhookProcessing.create({
    data: {
      webhookId,
      integrationId: integration.id,
      processedAt: new Date(),
    },
  });
  
  // Process webhook
  await handleWebhook(payload, integration);
}
```

### 4.3 Integration Access Control

**Access Rules:**
- Integration scoped to tenant
- Integration credentials encrypted
- Webhook signatures verified
- Integration actions logged
- Credential rotation supported

**Access Implementation:**
```typescript
async function callIntegration(
  integrationId: string,
  action: string,
  params: any,
  context: AuthContext
): Promise<any> {
  // 1. Verify integration belongs to tenant
  const integration = await db.integration.findFirst({
    where: {
      id: integrationId,
      organizationId: context.tenantId,
    },
  });
  
  if (!integration) {
    throw new NotFoundError('Integration not found');
  }
  
  // 2. Check permissions
  if (!await hasPermission(context.userId, 'integration:execute', context.tenantId)) {
    throw new ForbiddenError('User cannot execute integrations');
  }
  
  // 3. Get credentials
  const credentials = await getCredentials(integrationId, context.tenantId);
  
  // 4. Execute integration
  const result = await integrationService.execute(
    integration,
    credentials,
    action,
    params
  );
  
  // 5. Log execution
  await logAuditEvent({
    eventType: 'integration.execute',
    actor: { id: context.userId },
    tenant: { id: context.tenantId },
    action: { type: 'execute', resource: 'integration', resourceId: integrationId },
    context: { action, params: sanitizeParams(params) },
  });
  
  return result;
}
```

---

## 5. Security Testing

### 5.1 File Upload Tests

```typescript
describe('File Upload Security', () => {
  it('should reject files with invalid type', async () => {
    const file = createFile('test.exe', 'application/x-executable');
    
    await expect(uploadFile(file, context)).rejects.toThrow(ValidationError);
  });
  
  it('should reject files that are too large', async () => {
    const file = createLargeFile(20 * 1024 * 1024); // 20MB
    
    await expect(uploadFile(file, context)).rejects.toThrow(ValidationError);
  });
  
  it('should reject files with malware', async () => {
    const file = createMaliciousFile();
    
    await expect(uploadFile(file, context)).rejects.toThrow(ValidationError);
  });
  
  it('should prevent path traversal', async () => {
    const file = createFile('../../../etc/passwd', 'text/plain');
    
    await expect(uploadFile(file, context)).rejects.toThrow(ValidationError);
  });
  
  it('should enforce tenant isolation', async () => {
    const tenant1User = await createUser(tenant1.id);
    const tenant2File = await uploadFile(file, { tenantId: tenant2.id });
    
    await expect(
      getFile(tenant2File.id, { userId: tenant1User.id, tenantId: tenant1.id })
    ).rejects.toThrow(ForbiddenError);
  });
});
```

### 5.2 Export Tests

```typescript
describe('Export Security', () => {
  it('should require export permission', async () => {
    const user = await createUserWithoutPermission('data:export');
    
    await expect(exportData('leads', {}, context)).rejects.toThrow(ForbiddenError);
  });
  
  it('should enforce data scope', async () => {
    const user = await createUserWithScope('own');
    
    const result = await exportData('leads', { scope: 'organization' }, user);
    
    // Should only export own leads
    expect(result.recordCount).toBeLessThan(totalLeads);
  });
  
  it('should require approval for restricted exports', async () => {
    const exportType = 'financial_report';
    
    await expect(
      exportData(exportType, {}, context)
    ).rejects.toThrow(ApprovalRequiredError);
  });
  
  it('should enforce export limits', async () => {
    // Create 10 recent exports
    for (let i = 0; i < 10; i++) {
      await exportData('leads', {}, context);
    }
    
    // 11th export should fail
    await expect(exportData('leads', {}, context)).rejects.toThrow(RateLimitError);
  });
});
```

### 5.3 Integration Tests

```typescript
describe('Integration Security', () => {
  it('should verify webhook signatures', async () => {
    const payload = { data: 'test' };
    const invalidSignature = 'invalid';
    
    const response = await api.post('/api/webhooks/test', payload, {
      headers: { 'x-webhook-signature': invalidSignature }
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should prevent webhook replay', async () => {
    const payload = { id: 'webhook-123', data: 'test' };
    
    // First call should succeed
    await api.post('/api/webhooks/test', payload, {
      headers: { 'x-webhook-signature': validSignature }
    });
    
    // Second call should be ignored (replay)
    const result = await api.post('/api/webhooks/test', payload, {
      headers: { 'x-webhook-signature': validSignature }
    });
    
    expect(result.processed).toBe(false);
  });
  
  it('should encrypt integration credentials', async () => {
    const credentials = await getCredentials(integrationId, tenantId);
    
    // Verify credentials are encrypted in database
    const record = await db.integrationCredentials.findFirst({
      where: { integrationId },
    });
    
    expect(record.encryptedCredentials).not.toEqual(JSON.stringify(credentials));
  });
});
```

---

## 6. References

- Stage 2: System Architecture
- Stage 3: Security Engineering Controls
- Stage 5: Data Architecture Plan
- OWASP File Upload Cheat Sheet
- NIST SP 800-53 (Security and Privacy Controls)

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
