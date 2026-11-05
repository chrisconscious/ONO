import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

/*
 * Conservative browser hardening. The content security policy still permits
 * the inline bootstrap scripts and styles emitted by Next.js, while blocking
 * third-party script, frame and object sources. Development additionally needs
 * eval and websocket access for hot reload.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Ignored by browsers on plain HTTP, effective on every HTTPS deployment.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/** Authenticated and credential-bearing responses must never be cached. */
const noStore = [{ key: "Cache-Control", value: "no-store, must-revalidate" }];

const noStoreRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/session-expired",
  "/app/:path*",
  "/admin/:path*",
  "/account/:path*",
  "/api/auth/:path*",
  "/api/workspace/:path*",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...noStoreRoutes.map((source) => ({ source, headers: noStore })),
    ];
  },
};

export default nextConfig;
