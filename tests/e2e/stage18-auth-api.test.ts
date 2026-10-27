import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NextRequest } from "next/server";
import { prisma, truncateAll } from "../helpers/dbBootstrap";
import { hashPassword } from "@/lib/auth/password";
import * as loginRoute from "@/app/api/v1/auth/login/route";
import * as publicTestimonialsRoute from "@/app/api/v1/public/testimonials/route";
import * as platformTestimonialsRoute from "@/app/api/v1/platform/testimonials/route";
import * as platformOverviewRoute from "@/app/api/v1/platform/overview/route";

/**
 * HTTP-level end-to-end tests for the authentication and testimonial API.
 *
 * A minimal loopback server forwards every request to the real Next.js route
 * handlers (the same functions production invokes), so cookies, status codes,
 * and JSON envelopes are exercised exactly as a browser would see them.
 */

let server: Server;
let baseUrl: string;

function toNextRequest(req: IncomingMessage): NextRequest {
  const url = `${baseUrl}${req.url ?? "/"}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) for (const item of v) headers.append(k, item);
    else if (v !== undefined) headers.set(k, v);
  }
  return new NextRequest(url, {
    method: req.method ?? "GET",
    headers,
    body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : req,
    duplex: "half",
  });
}

beforeAll(async () => {
  await truncateAll();
  server = createServer(async (req, res: ServerResponse) => {
    // Route table mirrors the App Router paths under test.
    const request = toNextRequest(req);
    const handle = async (): Promise<Response> => {
      const path = new URL(request.url).pathname;
      switch (`${request.method} ${path}`) {
        case "POST /api/v1/auth/login":
          return loginRoute.POST(request);
        case "GET /api/v1/public/testimonials":
          return publicTestimonialsRoute.GET();
        case "GET /api/v1/platform/testimonials":
          return platformTestimonialsRoute.GET(request);
        case "POST /api/v1/platform/testimonials":
          return platformTestimonialsRoute.POST(request);
        case "GET /api/v1/platform/overview":
          return platformOverviewRoute.GET();
        default:
          return new Response("not found", { status: 404 });
      }
    };
    const response = await handle();
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (addr === null || typeof addr === "string") throw new Error("server address missing");
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
  await prisma.$disconnect();
});

async function seedPlatformAdmin(password: string) {
  const email = `e2e-admin-${Date.now()}@example.test`;
  await prisma.user.create({
    data: {
      email,
      name: "E2E Platform Admin",
      role: "PLATFORM_ADMIN",
      passwordHash: await hashPassword(password),
      isVerified: true,
    },
  });
  return email;
}

async function login(email: string, password: string): Promise<{ cookie: string; status: number }> {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  return { cookie, status: res.status };
}

describe("authentication API over HTTP", () => {
  it("rejects invalid credentials with 401 and no session cookie", async () => {
    const email = await seedPlatformAdmin("correct-horse-battery");
    const { status, cookie } = await login(email, "wrong-password-123");
    expect(status).toBe(401);
    expect(cookie).toBe("");
  });

  it("issues an HttpOnly session cookie on successful login", async () => {
    const email = await seedPlatformAdmin("correct-horse-battery");
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "correct-horse-battery" }),
    });
    expect(res.status).toBe(200);
    const raw = res.headers.get("set-cookie") ?? "";
    // Security-critical flags must be present on the session cookie.
    expect(raw).toMatch(/ono_session=/i);
    expect(raw.toLowerCase()).toContain("httponly");
    expect(raw.toLowerCase()).toContain("samesite=lax");
  });

  it("rejects malformed JSON bodies with 400 instead of 500", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    expect(res.status).toBe(400);
  });
});

describe("testimonial API authorization over HTTP", () => {
  it("public carousel feed works without authentication", async () => {
    const res = await fetch(`${baseUrl}/api/v1/public/testimonials`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("platform moderation endpoints require a session (401 anonymous)", async () => {
    const listRes = await fetch(`${baseUrl}/api/v1/platform/testimonials`);
    expect(listRes.status).toBe(401);
    const overviewRes = await fetch(`${baseUrl}/api/v1/platform/overview`);
    expect(overviewRes.status).toBe(401);
  });

  it("tenant users cannot reach platform moderation endpoints (403)", async () => {
    // Regular user with a valid session but WITHOUT the PLATFORM_ADMIN role.
    const email = `tenant-user-${Date.now()}@example.test`;
    await prisma.user.create({
      data: {
        email,
        name: "Tenant Person",
        role: "MEMBER",
        passwordHash: await hashPassword("tenant-password-123"),
        isVerified: true,
      },
    });
    const { cookie, status } = await login(email, "tenant-password-123");
    expect(status).toBe(200);
    const res = await fetch(`${baseUrl}/api/v1/platform/testimonials`, {
      headers: { cookie },
    });
    expect(res.status).toBe(403);
  });

  it("platform admin can create a draft via HTTP and it stays unpublished", async () => {
    const email = await seedPlatformAdmin("admin-passw0rd-long");
    const { cookie } = await login(email, "admin-passw0rd-long");
    const createRes = await fetch(`${baseUrl}/api/v1/platform/testimonials`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        authorName: "Amina Juma",
        authorTitle: "Operations Director",
        companyName: "Kilimanjaro Traders Ltd",
        quote: "The platform unified our sales and inventory reporting.",
        rating: 5,
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { data: { id: string; isPublished: boolean } };
    expect(created.data.isPublished).toBe(false);
    // The draft must not appear in the public feed.
    const publicRes = await fetch(`${baseUrl}/api/v1/public/testimonials`);
    const feed = (await publicRes.json()) as { data: { id: string }[] };
    expect(feed.data.map((t) => t.id)).not.toContain(created.data.id);
  });
});
