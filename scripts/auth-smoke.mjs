import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const base = "http://localhost:3000";
let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function rateKey(namespace, value) {
  return `${namespace}:${createHash("sha256").update(value).digest("hex").slice(0, 40)}`;
}

// The throttle test needs one stable client address. Ordinary calls use a
// unique address each time so unrelated sign-ins in the smoke run never trip
// the shared sign-in limit.
const testIp = `10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
function randomIp() {
  return `10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
}

async function request(path, options = {}) {
  const { method = "GET", body, cookie, origin = base, ip = randomIp(), headers = {}, redirect = "manual" } = options;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(origin ? { origin } : {}),
      "x-forwarded-for": ip,
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  const rawCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
  return { response, status: response.status, text, json, rawCookies };
}

function cookieFrom(result) {
  const raw = result.rawCookies.find((item) => item.startsWith("ono_session="));
  return raw ? raw.split(";")[0] : null;
}

function tokenFrom(url) {
  if (!url) return null;
  return new URL(url, base).searchParams.get("token");
}

async function main() {
  // Remove stale throttling for the accounts used by this smoke run only.
  await prisma.rateLimitBucket.deleteMany({
    where: {
      key: {
        in: [
          rateKey("signin:email", "owner@northwind.local"),
          rateKey("signin:email", "admin@ono.local"),
          rateKey("signin:ip", testIp),
        ],
      },
    },
  });

  console.log("\n# Authentication and redirects");
  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "owner@northwind.local", password: "Wrong-Password-1!" },
  });
  check("wrong password returns generic 401", badLogin.status === 401 && badLogin.json?.error === "Incorrect email or password.", `${badLogin.status} ${badLogin.text}`);

  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: "owner@northwind.local", password: "Workspace!2026" },
  });
  const ownerCookie = cookieFrom(login);
  check("valid credentials sign in", login.status === 200 && Boolean(ownerCookie), `${login.status} ${login.text}`);
  check("sign-in redirects a member to the workspace", login.json?.redirectTo === "/app", login.json?.redirectTo);
  const setCookie = login.rawCookies.find((item) => item.startsWith("ono_session=")) ?? "";
  check("session cookie is HttpOnly, SameSite=Lax, path=/", /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie) && /Path=\//i.test(setCookie), setCookie);
  check("session cookie is not Secure in development", !/;\s*Secure/i.test(setCookie), setCookie);

  const me = await request("/api/auth/me", { cookie: ownerCookie });
  check("session status is authenticated", me.status === 200 && me.json?.authenticated === true, `${me.status} ${me.text}`);
  check("session status exposes deadlines and state", Boolean(me.json?.session?.expiresAt && me.json?.session?.warningAt && me.json?.session?.state), JSON.stringify(me.json?.session));
  check("session status is never cached", /no-store/i.test(me.response.headers.get("cache-control") ?? ""), me.response.headers.get("cache-control"));

  const appPage = await request("/app", { cookie: ownerCookie });
  check("member can open the workspace", appPage.status === 200, String(appPage.status));

  const accountRedirect = await request("/account", { cookie: ownerCookie });
  check("/account redirects to canonical settings", accountRedirect.status === 307 && accountRedirect.response.headers.get("location") === "/account/security", `${accountRedirect.status} ${accountRedirect.response.headers.get("location")}`);

  const accountPage = await request("/account/security", { cookie: ownerCookie });
  check("account settings render", accountPage.status === 200 && accountPage.text.includes("Profile and security"), String(accountPage.status));

  const adminAsOwner = await request("/admin", { cookie: ownerCookie });
  check("non-admin cannot open the platform console", adminAsOwner.status === 307 && (adminAsOwner.response.headers.get("location") ?? "").includes("/access-denied"), `${adminAsOwner.status} ${adminAsOwner.response.headers.get("location")}`);

  const crossTenant = await request("/api/workspace/switch", {
    method: "POST",
    cookie: ownerCookie,
    body: { tenantId: "ck-not-a-real-tenant" },
  });
  check("workspace switch rejects a non-member tenant", crossTenant.status === 403, `${crossTenant.status} ${crossTenant.text}`);

  const sessions = await request("/api/auth/account/sessions", { cookie: ownerCookie });
  const currentSession = sessions.json?.sessions?.find((session) => session.current);
  check("account lists the current session", sessions.status === 200 && Boolean(currentSession), `${sessions.status} ${sessions.text}`);

  const prefs = await request("/api/auth/account/preferences", {
    method: "PUT",
    cookie: ownerCookie,
    body: { theme: "dark", locale: "en", timeZone: "Africa/Dar_es_Salaam", emailNotifications: false },
  });
  check("preferences can be saved", prefs.status === 200, `${prefs.status} ${prefs.text}`);
  const revertPrefs = await request("/api/auth/account/preferences", {
    method: "PUT",
    cookie: ownerCookie,
    body: { theme: "system", locale: "en", timeZone: "", emailNotifications: true },
  });
  check("preferences can be reverted", revertPrefs.status === 200, `${revertPrefs.status} ${revertPrefs.text}`);

  console.log("\n# Origin validation");
  const evilOrigin = await request("/api/auth/logout", {
    method: "POST",
    cookie: ownerCookie,
    origin: "https://evil.example",
  });
  check("cross-origin mutation is rejected", evilOrigin.status === 403, `${evilOrigin.status} ${evilOrigin.text}`);

  console.log("\n# Session expiry and revocation");
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "owner@northwind.local" }, select: { id: true } });

  // One minute of idle time left: the warning window has started. Reading the
  // status must not extend the session; only the explicit continue action may.
  const nearIdle = new Date(Date.now() - (30 * 60_000 - 60_000));
  await prisma.session.updateMany({
    where: { userId: owner.id },
    data: {
      lastActivityAt: nearIdle,
      expiresAt: new Date(nearIdle.getTime() + 30 * 60_000),
    },
  });
  const warningMe = await request("/api/auth/me", { cookie: ownerCookie });
  check("session reports the warning state", warningMe.status === 200 && warningMe.json?.session?.state === "warning", `${warningMe.status} ${warningMe.json?.session?.state}`);
  const warningAgain = await request("/api/auth/me", { cookie: ownerCookie });
  check("reading session status does not extend the session", warningAgain.status === 200 && warningAgain.json?.session?.expiresAt === warningMe.json?.session?.expiresAt, `${warningMe.json?.session?.expiresAt} -> ${warningAgain.json?.session?.expiresAt}`);
  const touch = await request("/api/auth/session/touch", { method: "POST", cookie: ownerCookie });
  check("continue session extends the idle deadline", touch.status === 200 && Date.parse(touch.json?.session?.expiresAt) > Date.parse(warningMe.json?.session?.expiresAt), `${touch.status} ${touch.text}`);
  const afterTouch = await request("/api/auth/me", { cookie: ownerCookie });
  check("session returns to active after continuing", afterTouch.status === 200 && afterTouch.json?.session?.state === "active", `${afterTouch.status} ${afterTouch.json?.session?.state}`);

  await prisma.session.updateMany({
    where: { userId: owner.id },
    data: {
      lastActivityAt: new Date(Date.now() - 31 * 60_000),
      expiresAt: new Date(Date.now() - 60_000),
    },
  });
  const expiredMe = await request("/api/auth/me", { cookie: ownerCookie });
  check("expired session is rejected by the API", expiredMe.status === 401, `${expiredMe.status} ${expiredMe.text}`);
  const expiredPage = await request("/app", { cookie: ownerCookie });
  check("expired session redirects with an explanation", expiredPage.status === 307 && (expiredPage.response.headers.get("location") ?? "").includes("reason=expired"), `${expiredPage.status} ${expiredPage.response.headers.get("location")}`);

  const secondLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "owner@northwind.local", password: "Workspace!2026" },
  });
  const secondCookie = cookieFrom(secondLogin);
  check("sign-in works again after expiry", secondLogin.status === 200 && Boolean(secondCookie), String(secondLogin.status));
  const secondSessions = await request("/api/auth/account/sessions", { cookie: secondCookie });
  const secondCurrent = secondSessions.json?.sessions?.find((session) => session.current);
  await prisma.session.update({ where: { id: secondCurrent.id }, data: { revokedAt: new Date() } });
  const revokedMe = await request("/api/auth/me", { cookie: secondCookie });
  check("revoked session is rejected", revokedMe.status === 401, `${revokedMe.status} ${revokedMe.text}`);

  console.log("\n# Platform administrator");
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@ono.local", password: "Platform!2026" },
  });
  const adminCookie = cookieFrom(adminLogin);
  const adminPage = await request("/admin", { cookie: adminCookie });
  check("platform admin opens the console", adminLogin.status === 200 && adminPage.status === 200, `${adminLogin.status}/${adminPage.status}`);
  const logout = await request("/api/auth/logout", { method: "POST", cookie: adminCookie });
  check("logout succeeds and clears the cookie", logout.status === 200 && logout.rawCookies.some((item) => item.startsWith("ono_session=;") || /Max-Age=0/i.test(item)), `${logout.status} ${logout.rawCookies.join(" | ")}`);

  console.log("\n# Registration, verification, and password reset");
  const stamp = Date.now();
  const email = `smoke+${stamp}@ono.local`;
  const password = "Smoke-Test-2026!";
  const newPassword = "Smoke-Test-2027#";
  const register = await request("/api/auth/register", {
    method: "POST",
    body: { name: "Smoke Tester", email, password, confirmPassword: password, acceptTerms: true },
  });
  check("self-registration creates an account", register.status === 201 && Boolean(register.json?.devVerificationUrl), `${register.status} ${register.text}`);
  const verifyToken = tokenFrom(register.json?.devVerificationUrl);

  const unverifiedLogin = await request("/api/auth/login", { method: "POST", body: { email, password } });
  check("unverified account cannot sign in", unverifiedLogin.status === 403 && unverifiedLogin.json?.code === "EMAIL_UNVERIFIED", `${unverifiedLogin.status} ${unverifiedLogin.text}`);

  const verify = await request("/api/auth/verify-email", { method: "POST", body: { token: verifyToken } });
  check("verification token is accepted", verify.status === 200, `${verify.status} ${verify.text}`);
  const reuseVerify = await request("/api/auth/verify-email", { method: "POST", body: { token: verifyToken } });
  check("verification token is single-use", reuseVerify.status === 400, `${reuseVerify.status} ${reuseVerify.text}`);

  const verifiedLogin = await request("/api/auth/login", { method: "POST", body: { email, password } });
  const newUserCookie = cookieFrom(verifiedLogin);
  check("verified account signs in", verifiedLogin.status === 200 && Boolean(newUserCookie), `${verifiedLogin.status} ${verifiedLogin.text}`);
  check("account without membership is sent to access-denied", verifiedLogin.json?.redirectTo === "/access-denied?scope=workspace", verifiedLogin.json?.redirectTo);
  const noWorkspace = await request("/app", { cookie: newUserCookie });
  check("no-membership account cannot open /app", noWorkspace.status === 307 && (noWorkspace.response.headers.get("location") ?? "").includes("/access-denied"), `${noWorkspace.status} ${noWorkspace.response.headers.get("location")}`);

  const forgot = await request("/api/auth/forgot-password", { method: "POST", body: { email } });
  const resetToken = tokenFrom(forgot.json?.devResetUrl);
  check("password reset link is issued in development", forgot.status === 200 && Boolean(resetToken), `${forgot.status} ${forgot.text}`);
  const reset = await request("/api/auth/reset-password", {
    method: "POST",
    body: { token: resetToken, password: newPassword, confirmPassword: newPassword },
  });
  check("password reset is accepted", reset.status === 200, `${reset.status} ${reset.text}`);
  const reuseReset = await request("/api/auth/reset-password", {
    method: "POST",
    body: { token: resetToken, password: newPassword, confirmPassword: newPassword },
  });
  check("reset token is single-use", reuseReset.status === 400, `${reuseReset.status} ${reuseReset.text}`);
  const oldPasswordLogin = await request("/api/auth/login", { method: "POST", body: { email, password } });
  check("old password no longer works", oldPasswordLogin.status === 401, `${oldPasswordLogin.status} ${oldPasswordLogin.text}`);
  const newPasswordLogin = await request("/api/auth/login", { method: "POST", body: { email, password: newPassword } });
  check("new password works", newPasswordLogin.status === 200, `${newPasswordLogin.status} ${newPasswordLogin.text}`);

  console.log("\n# Password change rotates and revokes sessions");
  const deviceALogin = await request("/api/auth/login", { method: "POST", body: { email, password: newPassword } });
  const deviceBLogin = await request("/api/auth/login", { method: "POST", body: { email, password: newPassword } });
  const deviceACookie = cookieFrom(deviceALogin);
  const deviceBCookie = cookieFrom(deviceBLogin);
  const newerPassword = "Smoke-Test-2028%";
  const change = await request("/api/auth/account/password", {
    method: "POST",
    cookie: deviceACookie,
    body: { currentPassword: newPassword, password: newerPassword, confirmPassword: newerPassword },
  });
  const rotatedCookie = cookieFrom(change);
  check("password change succeeds", change.status === 200, `${change.status} ${change.text}`);
  check("password change rotates the current cookie", Boolean(rotatedCookie) && rotatedCookie !== deviceACookie, String(rotatedCookie));
  const rotatedMe = await request("/api/auth/me", { cookie: rotatedCookie });
  check("rotated session stays signed in", rotatedMe.status === 200, String(rotatedMe.status));
  const otherDevice = await request("/api/auth/me", { cookie: deviceBCookie });
  check("password change revokes other devices", otherDevice.status === 401, `${otherDevice.status} ${otherDevice.text}`);
  const staleToken = await request("/api/auth/me", { cookie: deviceACookie });
  check("old session token is no longer valid after rotation", staleToken.status === 401, String(staleToken.status));
  const revertedByPassword = await request("/api/auth/login", { method: "POST", body: { email, password: newPassword } });
  check("pre-change password no longer works", revertedByPassword.status === 401, String(revertedByPassword.status));
  const finalLogin = await request("/api/auth/login", { method: "POST", body: { email, password: newerPassword } });
  check("post-change password works", finalLogin.status === 200, `${finalLogin.status} ${finalLogin.text}`);

  const unknownForgot = await request("/api/auth/forgot-password", { method: "POST", body: { email: `missing+${stamp}@ono.local` } });
  check("unknown email gets a neutral recovery response", unknownForgot.status === 200 && !unknownForgot.json?.devResetUrl, `${unknownForgot.status} ${unknownForgot.text}`);

  console.log("\n# Database rate limiting");
  const limitedEmail = `limited+${stamp}@ono.local`;
  await prisma.rateLimitBucket.deleteMany({ where: { key: rateKey("signin:ip", testIp) } });
  let lastStatus = 0;
  let retryAfter = null;
  for (let attempt = 0; attempt < 9; attempt += 1) {
    const result = await request("/api/auth/login", { method: "POST", ip: testIp, body: { email: limitedEmail, password: "Wrong-Password-1!" } });
    lastStatus = result.status;
    retryAfter = result.response.headers.get("retry-after");
  }
  check("repeated failures are rate limited", lastStatus === 429, String(lastStatus));
  check("rate limit returns Retry-After", Boolean(retryAfter), String(retryAfter));

  await prisma.user.deleteMany({ where: { email: { in: [email, limitedEmail] } } });
  await prisma.rateLimitBucket.deleteMany({
    where: { key: { in: [rateKey("signin:ip", testIp), rateKey("signin:email", limitedEmail)] } },
  });
  await prisma.$disconnect();

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
