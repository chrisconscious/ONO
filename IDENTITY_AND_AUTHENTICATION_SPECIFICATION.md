# Identity and Authentication Specification

**Document ID:** SEC-7.2  
**Stage:** 7 — Security, Identity, Permissions, Privacy, and Audit Design  
**Status:** Recorded  
**Last Updated:** 2026-01-29

---

## 1. Overview

This document specifies the identity lifecycle and authentication requirements for the ClickIT platform. It covers account creation, authentication methods, session management, and account lifecycle operations.

**Key Principles:**
- Use established, maintained authentication mechanisms
- Never invent custom cryptography or password storage
- Support multi-factor authentication
- Enforce strong session security
- Provide secure account recovery
- Maintain complete audit trails

---

## 2. Account Creation and Activation

### 2.1 Account Creation Methods

**Method 1: Organization Invitation**
- Organization admin invites user via email
- Invitation includes time-limited token (7 days)
- User accepts invitation and sets password
- Account activated upon acceptance

**Method 2: Self-Registration (if enabled)**
- User registers with email and password
- Email verification required
- Account activated after verification
- User must join or create organization

**Method 3: Platform Admin Creation**
- Platform admin creates account for support purposes
- Temporary password generated
- User must change password on first login
- Account activated immediately

### 2.2 Account Activation Requirements

**Required Fields:**
- Email address (unique, valid format)
- Password (meets complexity requirements)
- First name
- Last name

**Optional Fields:**
- Avatar URL
- Phone number
- Timezone preference
- Language preference

**Activation Process:**
1. Validate required fields
2. Check email uniqueness
3. Hash password (bcrypt/argon2)
4. Create user record
5. Send verification email (if self-registration)
6. Log account creation

### 2.3 Email Verification

**Verification Flow:**
1. Send verification email with token
2. Token valid for 24 hours
3. User clicks verification link
4. Mark email as verified
5. Log verification event

**Verification Email Content:**
- Verification link with token
- Expiration time
- Organization name (if invitation)
- Support contact information

---

## 3. Password Requirements and Storage

### 3.1 Password Complexity Requirements

**Default Requirements (configurable per tenant):**
- Minimum length: 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Cannot contain user's email or name
- Cannot be in top 10,000 common passwords list

**Tenant-Specific Configuration:**
- Organization admins can configure password policy
- Policy applies to all users in organization
- Policy changes do not affect existing passwords
- Users prompted to update password if policy changes

### 3.2 Password Storage

**Storage Method:**
- Algorithm: bcrypt (cost factor 12) or argon2id
- Salt: Automatically generated per password
- Hash stored in database
- Never store plaintext passwords
- Never log passwords

**Password Hash Schema:**
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;  // bcrypt or argon2 hash
  // ... other fields
}
```

**Hash Verification:**
```typescript
async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plaintext, hash);
}
```

### 3.3 Password Change

**Change Process:**
1. User provides current password
2. Verify current password
3. Validate new password meets requirements
4. Check new password not in password history (last 5)
5. Hash new password
6. Update password hash
7. Invalidate all active sessions
8. Log password change

**Forced Password Change:**
- Admin can force password change
- User must change password on next login
- Temporary password generated if needed

---

## 4. Password Recovery and Reset

### 4.1 Password Reset Flow

**Reset Process:**
1. User requests password reset via email
2. Generate time-limited reset token (1 hour)
3. Send reset email with token
4. User clicks reset link
5. User enters new password
6. Validate new password
7. Update password hash
8. Invalidate all active sessions
9. Log reset event

**Reset Token:**
- Cryptographically secure random token
- Stored in database with expiration
- Single-use only
- Invalidated after use or expiration

### 4.2 Reset Email Content

**Email Includes:**
- Reset link with token
- Expiration time (1 hour)
- Organization name
- IP address of request
- Support contact if not requested by user

**Security Considerations:**
- Do not reveal if email exists in system
- Same message for existing and non-existing emails
- Rate limit reset requests (3 per hour per email)
- Log all reset attempts

### 4.3 Security Questions (Not Recommended)

**Status:** Not implemented

**Rationale:**
- Security questions are weak authentication
- Answers often discoverable via social media
- Phishing-resistant methods preferred (MFA)

---

## 5. Multi-Factor Authentication (MFA)

### 5.1 MFA Support

**Supported Methods:**
- TOTP (Time-based One-Time Password) via authenticator apps
  - Google Authenticator
  - Authy
  - Microsoft Authenticator
  - 1Password
- SMS-based OTP (if approved by tenant)
- Email-based OTP (fallback)

**MFA Enrollment Process:**
1. User enables MFA in profile settings
2. System generates secret key
3. Display QR code for authenticator app
4. User scans QR code
5. User enters verification code
6. Verify code matches
7. Save encrypted secret
8. Generate backup codes
9. Log MFA enrollment

### 5.2 MFA Login Flow

**Login with MFA:**
1. User enters email and password
2. Verify credentials
3. Check if MFA enabled
4. If MFA enabled:
   - Prompt for MFA code
   - User enters TOTP/SMS/email code
   - Verify code
   - If valid, create session
   - If invalid, reject login
5. If MFA not enabled:
   - Create session directly

### 5.3 MFA Backup Codes

**Backup Codes:**
- 10 single-use backup codes generated
- User must store codes securely
- Each code can be used once
- Codes invalidated after use
- User can regenerate codes

**Backup Code Usage:**
1. User cannot access authenticator app
2. User enters backup code instead of TOTP
3. Verify backup code
4. Invalidate used code
5. Prompt user to re-enroll MFA

### 5.4 MFA Recovery

**Recovery Process:**
1. User loses access to MFA device
2. User contacts organization admin
3. Admin verifies user identity
4. Admin disables MFA for user
5. User re-enrolls MFA
6. Log MFA recovery

---

## 6. Session Management

### 6.1 Session Creation

**Session Creation Process:**
1. User successfully authenticates
2. Generate session ID (cryptographically secure)
3. Create session record in database
4. Set session cookie (httpOnly, secure, sameSite)
5. Log session creation

**Session Data:**
```typescript
interface Session {
  id: string;              // Session ID
  userId: string;          // User ID
  organizationId: string;  // Current organization
  createdAt: Date;         // Session creation time
  expiresAt: Date;         // Session expiration
  lastActivityAt: Date;    // Last activity time
  ipAddress: string;       // Client IP address
  userAgent: string;       // Client user agent
  mfaVerified: boolean;    // MFA verified flag
}
```

### 6.2 Session Cookie Configuration

**Cookie Attributes:**
- `httpOnly: true` — Prevent JavaScript access
- `secure: true` — HTTPS only
- `sameSite: 'strict'` — CSRF protection
- `maxAge: 86400` — 24 hours (configurable)
- `path: '/'` — All paths
- `domain: undefined` — Current domain only

**Cookie Name:** `clickit_session`

### 6.3 Session Renewal

**Renewal Strategy:**
- Sliding window expiration
- Session extended on activity
- Maximum session lifetime: 30 days (configurable)
- Inactivity timeout: 8 hours (configurable)

**Renewal Process:**
1. Check session validity
2. Check expiration
3. If valid and not expired:
   - Update lastActivityAt
   - Extend expiresAt
   - Continue request
4. If expired:
   - Invalidate session
   - Redirect to login

### 6.4 Session Revocation

**Revocation Scenarios:**
- User logs out
- Password changed
- MFA enabled/disabled
- Admin revokes session
- Session expired
- Suspicious activity detected

**Revocation Process:**
1. Delete session from database
2. Clear session cookie
3. Log revocation event
4. Redirect to login (if active session)

### 6.5 Concurrent Sessions

**Concurrent Session Policy:**
- Default: Allow multiple concurrent sessions
- Configurable per tenant:
  - Allow unlimited sessions
  - Limit to N concurrent sessions
  - Single session only (new login invalidates old)

**Session Management UI:**
- User can view all active sessions
- User can revoke specific sessions
- User can revoke all other sessions
- Session details: IP, device, location, last activity

---

## 7. Account Lockout and Throttling

### 7.1 Failed Login Lockout

**Lockout Policy:**
- After 5 failed login attempts: Lock account for 15 minutes
- After 10 failed attempts: Lock account for 1 hour
- After 20 failed attempts: Lock account for 24 hours
- Configurable per tenant

**Lockout Process:**
1. Track failed login attempts per email
2. On threshold breach:
   - Lock account
   - Send notification email to user
   - Log lockout event
3. After lockout period:
   - Automatically unlock
   - Reset failed attempt counter

### 7.2 Rate Limiting

**Rate Limits:**
- Login attempts: 10 per minute per IP
- Password reset requests: 3 per hour per email
- MFA verification attempts: 5 per minute per user
- API requests: 1000 per minute per user (configurable)

**Rate Limiting Implementation:**
- In-memory cache (Redis)
- Sliding window algorithm
- Return 429 Too Many Requests
- Include Retry-After header

### 7.3 Suspicious Login Detection

**Detection Signals:**
- Login from new device
- Login from new location
- Login at unusual time
- Multiple failed attempts
- Impossible travel (login from distant locations)

**Detection Response:**
- Low risk: Log and continue
- Medium risk: Require MFA verification
- High risk: Block login, notify user
- Critical risk: Lock account, require admin review

---

## 8. Account Suspension and Deactivation

### 8.1 Account Suspension

**Suspension Reasons:**
- Security incident
- Policy violation
- Payment failure
- Admin request
- Legal requirement

**Suspension Process:**
1. Admin suspends account
2. Invalidate all active sessions
3. Send notification email to user
4. Log suspension event
5. User cannot login
6. User data preserved

**Suspension Reversal:**
1. Admin reviews suspension reason
2. Admin reactivates account
3. Send notification email to user
4. Log reactivation event
5. User can login again

### 8.2 Account Deactivation

**Deactivation Process:**
1. User requests deactivation OR admin deactivates
2. Invalidate all active sessions
3. Mark account as deactivated
4. Send confirmation email
5. Log deactivation event
6. User cannot login
7. User data preserved for retention period

**Deactivation Reversal:**
- User can reactivate within 30 days
- After 30 days, account permanently deleted
- Reactivation requires admin approval

### 8.3 Account Deletion

**Deletion Process:**
1. User requests deletion OR retention period expired
2. Soft delete account (mark as deleted)
3. Wait retention period (30 days)
4. Hard delete account and all data
5. Log deletion event

**Data Deletion:**
- User record deleted
- All memberships deleted
- All sessions deleted
- Audit logs preserved (anonymized)
- No data recovery possible

---

## 9. Organization Membership Changes

### 9.1 Adding User to Organization

**Add Process:**
1. Organization admin invites user
2. User receives invitation email
3. User accepts invitation
4. Create membership record
5. Assign initial roles
6. Log membership creation

### 9.2 Removing User from Organization

**Remove Process:**
1. Organization admin removes user
2. Revoke all organization-specific sessions
3. Deactivate membership
4. Reassign owned records (if any)
5. Log membership removal

### 9.3 Role Changes

**Role Change Process:**
1. Organization admin modifies user roles
2. Validate role assignments
3. Update membership roles
4. Invalidate affected sessions (optional)
5. Log role change

---

## 10. Audit Logging

### 10.1 Authentication Events

**Logged Events:**
- Account creation
- Email verification
- Login success
- Login failure
- Logout
- Password change
- Password reset request
- Password reset completion
- MFA enrollment
- MFA verification
- MFA recovery
- Session creation
- Session revocation
- Account suspension
- Account reactivation
- Account deactivation
- Account deletion

### 10.2 Audit Log Schema

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: string;
  userId: string | null;
  organizationId: string | null;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure';
  failureReason?: string;
}
```

### 10.3 Log Retention

**Retention Policy:**
- Authentication logs: 7 years
- Security events: 7 years
- Session logs: 1 year
- Failed login attempts: 1 year

---

## 11. Security Considerations

### 11.1 Credential Storage

- Never store plaintext passwords
- Use bcrypt or argon2 for password hashing
- Encrypt MFA secrets at rest
- Never log credentials

### 11.2 Session Security

- Use httpOnly, secure, sameSite cookies
- Implement session expiration
- Validate session on every request
- Protect against session fixation

### 11.3 Brute Force Protection

- Implement account lockout
- Rate limit authentication endpoints
- Use CAPTCHA after failed attempts
- Monitor for suspicious patterns

### 11.4 Phishing Protection

- Use clear, consistent email templates
- Include security indicators in emails
- Educate users about phishing
- Implement MFA to reduce impact

---

## 12. Testing Requirements

### 12.1 Authentication Tests

- Test account creation with valid/invalid data
- Test login with correct/incorrect credentials
- Test MFA enrollment and verification
- Test password reset flow
- Test session creation and expiration
- Test concurrent session handling
- Test account lockout after failed attempts
- Test session revocation

### 12.2 Security Tests

- Test password complexity enforcement
- Test session cookie security attributes
- Test CSRF protection
- Test brute force protection
- Test session fixation prevention
- Test credential leakage in logs
- Test MFA bypass attempts

---

## 13. References

- Stage 2: Tenancy and Authorization Architecture
- Stage 3: Security Engineering Controls
- Stage 5: Business Entity Catalog (User, Membership entities)
- OWASP Authentication Cheat Sheet
- NIST SP 800-63B Digital Identity Guidelines

---

**Document Status:** Recorded  
**Next Review:** Before implementation  
**Owner:** Security Architect
