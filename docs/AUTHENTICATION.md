# Authentication and session management

This document describes the authentication, session, account-security and
tenant-authorization behaviour implemented for ONO.

## Routes

| Route | Purpose |
| --- | --- |
| `/sign-in` | Canonical sign-in screen. `/login` permanently redirects here and preserves the query string. |
| `/sign-up` | Self-service registration. Creates an unprivileged account with no workspace membership. |
| `/forgot-password` | Requests a reset link. The response is identical for known and unknown addresses. |
| `/reset-password?token=…` | Validates the token before rendering and lets the visitor choose a new password. |
| `/verify-email?token=…` | Shows the token status; the address is verified only when the visitor presses the button (a POST). |
| `/session-expired` | Explains an ended session for direct visits and old links. |
| `/account/security` | Account settings: profile, status, password, active sessions, preferences. `/account` redirects here. |

`src/proxy.ts` performs a cookie-presence check for `/app`, `/admin` and
`/account`. It is not an authorization boundary: every layout and route
handler validates the opaque token against PostgreSQL.

## Session model

Sessions are database rows (`sessions`) referenced by a random 32-byte opaque
token. The browser receives the token in an HTTP-only, `SameSite=Lax`,
`Path=/` cookie named `ono_session`; production cookies also set `Secure`.
Only the SHA-256 hash of the token is stored in `Session.tokenHash`.

Each session records:

- `lastActivityAt` — drives the idle deadline.
- `absoluteExpiresAt` — hard ceiling that activity can never extend.
- `expiresAt` — the effective deadline (`min(idle, absolute)`), kept in sync.
- `rememberMe`, `userAgent`, `ipAddress`, `revokedAt`.

Both deadlines are evaluated server-side in `getSession()`:

1. the token must resolve to a row;
2. `revokedAt` must be null;
3. the account must be `ACTIVE` and email-verified;
4. the session window must not be expired.

`/api/auth/me` reports state and deadlines but deliberately does not extend the
session. Ordinary page loads refresh activity through `touchSession()`, which is
throttled by `SESSION_TOUCH_SECONDS` so request floods cannot keep a session
alive. A hidden tab does not poll anything.

### Defaults and configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `SESSION_IDLE_MINUTES` | `30` | Idle timeout for a standard session. |
| `SESSION_ABSOLUTE_HOURS` | `12` | Hard ceiling for a standard session. |
| `SESSION_WARNING_MINUTES` | `2` | Countdown window before expiry. |
| `SESSION_REMEMBER_IDLE_DAYS` | `7` | Idle timeout when “Keep me signed in” is used. |
| `SESSION_REMEMBER_ABSOLUTE_DAYS` | `30` | Hard ceiling for a remembered session. |
| `SESSION_TOUCH_SECONDS` | `60` | Minimum gap between idle-timestamp writes. |

Values are parsed and clamped by `src/lib/auth/policy.ts`; a typo cannot create
a session that never expires. The browser countdown uses server-provided
deadlines and a server-clock offset, never a client-only timer.

### Warning and continuation

`SessionExpiryPrompt` is mounted by the workspace shell, the platform console
and the account page. When the warning window opens it shows the remaining time
and two actions:

- **Continue session** calls `POST /api/auth/session/touch`, which is the only
  endpoint that force-extends the idle deadline.
- **Log out** revokes the session and returns to `/sign-in?reason=signed-out`.

The component revalidates on `visibilitychange` and on a `pageshow` restore from
the back/forward cache, so a revoked/expired session cannot be used from a stale
tab. A non-sensitive `localStorage` signal (`ono:session-event`) synchronises
sign-out and session extension across tabs; it contains no token, email or user
identifier.

## Flows

### Sign-in

1. `SignInForm` validates the input in the browser and posts to
   `/api/auth/login`.
2. The route validates the origin, applies IP + email rate limits, verifies the
   scrypt hash with constant-time comparison, and returns the same generic 401
   for unknown accounts and wrong passwords.
3. Suspended accounts are rejected; unverified accounts receive
   `EMAIL_UNVERIFIED` and a link to resend verification.
4. Any pre-authentication session is destroyed before a new row is created
   (session-fixation defence).
5. `resolvePostAuthDestination()` chooses a destination based on server-side
   memberships and platform role. The client prefers this server result over
   the requested `next` path.
6. Login success/failure is written to the audit log.

### Registration and verification

Registration creates a `MEMBER` account with `status = ACTIVE`, no tenant
membership and `emailVerifiedAt = null`. Sign-in is refused until verification.
Verification and reset tokens are stored as SHA-256 hashes in `auth_tokens`,
expire, and are single-use. The verification page only *peeks* at a token;
consumption requires an explicit POST, so mail scanners cannot verify addresses.

New accounts have no workspace access until an administrator creates a
membership or invitation. This is intentional: public registration never grants
tenant or platform privilege.

### Password reset and change

- Forgot-password returns the same message for every address. A development-only
  `devResetUrl` is included when the console email transport is active.
- Reset consumes the token, re-hashes the password, invalidates other reset
  tokens and revokes every session.
- Changing a password requires the current password, revokes all other sessions,
  rotates the current session token, and invalidates outstanding reset tokens.
- Password reset/change events are audited.

### Logout and revocation

`/api/auth/logout` revokes the current row and clears the cookie.
`/api/auth/logout-all` revokes every session for the account. The account screen
can revoke individual sessions; revoking the current session also signs the
browser out. All auth responses are `Cache-Control: no-store`.

## Multi-tenant authorization

- The browser never supplies an authoritative `tenantId`.
- `requireWorkspace()` resolves the requested workspace (explicit value or
  `ono_workspace` cookie) only against the actor's active memberships, and
  re-checks tenant and membership status.
- Platform privilege is read from `User.role`, never from a URL or client state.
- Platform administrators without a membership are sent to `/admin`; they do
  not receive implicit access to tenant data.
- `/api/workspace/switch` rejects tenants the actor does not belong to.
- Permission checks use the membership permission catalog; UI filtering is
  presentation only and does not replace server-side API authorization.

## Account data and business data

Profile, email verification state, status and preferences live on the `users`
row or in `User.preferences` (JSON). Session expiry only revokes `sessions`
rows. No business record is deleted or modified when a session ends, a password
changes, or an account is suspended. Preferences are explicitly presentation-only
and never participate in authorization.

## Security controls

- Hashed opaque session tokens; no token or token hash returned to the client.
- HTTP-only, `SameSite=Lax` cookies; `Secure` in production.
- Session rotation on password change; revocation on logout, password
  change/reset, session revoke, account suspension and membership removal.
- Server-enforced idle and absolute expiry; no heartbeat dependency.
- DB-backed fixed-window rate limits for sign-in, registration, recovery,
  verification and password changes. Keys containing email addresses are
  hashed before storage.
- Generic sign-in and recovery responses for unknown accounts.
- Same-origin validation for cookie-authenticated mutations.
- Safe redirect validation (`isSafeInternalPath`) blocks absolute and
  protocol-relative destinations.
- Server-side tenant and platform authorization on every protected page/API.
- Audit logging for login outcomes, password changes, session revocation and
  account verification.
- CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, referrer and
  permissions policies configured in `next.config.ts`; auth pages are no-store.
- Email links use the configured `NEXT_PUBLIC_APP_URL`, never the Host header.

## Database changes

Applied with `prisma db push` (this repository has no migrations directory):

- `UserStatus` enum (`ACTIVE`, `SUSPENDED`).
- `AuthTokenType` enum (`PASSWORD_RESET`, `EMAIL_VERIFICATION`).
- `User.status`, `User.emailVerifiedAt`, `User.preferences`.
- `Session.lastActivityAt`, `Session.absoluteExpiresAt`, `Session.rememberMe`.
- `AuthToken` model (`auth_tokens`).
- `RateLimitBucket` model (`rate_limit_buckets`).

Existing provisioned accounts were backfilled with
`emailVerifiedAt = createdAt` so they can continue to sign in. The seed script
sets the same fields for new installations.

## Email delivery

`src/lib/email/email.service.ts` supports two transports:

- `console` — development only; prints verification/reset links to the server
  log and enables the development-only link fields in API responses.
- `disabled` — production fail-closed default.

No SMTP or provider adapter exists in this repository. Until one is added,
production password recovery and verification cannot deliver mail; the API
still returns neutral responses so account existence is not disclosed.

## Tests and verification

Unit tests (Vitest):

```bash
npm test
```

Coverage includes session policy/deadline math, safe redirects, post-auth
destination policy, validation/password rules, device labelling, token hashing
and password verification.

Static checks:

```bash
npm run typecheck
npm run lint
npm run build
```

End-to-end smoke verification against a running dev server and database:

```bash
node scripts/auth-smoke.mjs
```

The script exercises sign-in success/failure, cookie flags, protected routes,
account settings, origin rejection, warning/continue, idle expiry, revocation,
platform-admin separation, registration/verification, single-use tokens,
password reset/change (including rotation and other-session revocation), neutral
recovery responses and database rate limiting.

## Known limitations

- There is no email provider, so real delivery is not verified. The console
  transport is disabled in production.
- There is no self-service tenant creation or invitation-accept UI. A verified
  user without a membership reaches the `access-denied` workspace state.
- Rate limiting trusts `X-Forwarded-For`; deploy behind a proxy that overwrites
  this header, or bind the limit to the platform's trusted client address.
- Session maintenance (pruning expired rows/tokens and old rate-limit buckets)
  is best-effort in application code; a scheduled job is recommended for large
  deployments.
- The smoke script is a development utility. It creates and deletes throwaway
  users and clears only the rate-limit buckets it uses.
