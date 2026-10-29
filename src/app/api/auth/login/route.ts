import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createAuditLog } from "@/server/services/audit/audit.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address and password." },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { tenant: { select: { id: true, name: true, slug: true, status: true } } },
        },
      },
    });

    // Deliberately identical responses for unknown accounts and bad passwords.
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 },
      );
    }

    if (!verifyPassword(password, user.passwordHash)) {
      await createAuditLog({
        tenantId: user.tenantId,
        userId: user.id,
        action: AuditAction.LOGIN,
        resource: "auth",
        metadata: { outcome: "failed" },
      });

      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 },
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined;

    await createSession(user.id, userAgent, ipAddress);

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: "auth",
      ipAddress,
      userAgent,
      metadata: { outcome: "success" },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
    const redirectTo =
      user.memberships.length > 0
        ? "/app"
        : isPlatformAdmin
          ? "/admin"
          : "/access-denied?scope=workspace";

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        workspaceCount: user.memberships.length,
      },
      redirectTo,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 },
    );
  }
}
