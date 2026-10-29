import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/auth/api";
import { requireTenantApi } from "@/lib/api/tenant";
import { hasPermission } from "@/lib/permissions/authorize";
import { runCopilot } from "@/server/services/crm/copilot.service";

const requestSchema = z.object({
  prompt: z.string().trim().min(1, "Ask a question.").max(1200),
  scope: z
    .enum(["workspace", "lead", "contact", "company", "opportunity"])
    .optional(),
  recordId: z.string().trim().max(40).optional(),
});

/**
 * Answers CRM questions from the actor's own records.
 *
 * The endpoint is read-only: it never executes an action, sends a message or
 * changes a record. Output is computed server-side and labelled as either
 * deterministic analysis or a configured generative provider.
 */
export async function POST(request: NextRequest) {
  const auth = await requireTenantApi();
  if (auth.error) return auth.error;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Provide a question.",
    );
  }

  try {
    const result = await runCopilot({
      tenantId: auth.tenantId,
      userId: auth.actor.id,
      prompt: parsed.data.prompt,
      scope: parsed.data.scope,
      recordId: parsed.data.recordId ?? null,
      permissions: {
        leads: hasPermission(auth.context, "PERM-LEAD.READ"),
        contacts: hasPermission(auth.context, "PERM-CONTACT.READ"),
        companies: hasPermission(auth.context, "PERM-COMPANY.READ"),
        opportunities: hasPermission(auth.context, "PERM-OPPORTUNITY.READ"),
        tasks: hasPermission(auth.context, "PERM-TASK.READ"),
        automation: hasPermission(auth.context, "PERM-AUTOMATION.READ"),
        analytics: hasPermission(auth.context, "PERM-ANALYTICS.READ"),
      },
    });

    return Response.json({ result });
  } catch (error) {
    console.error("CRM copilot error:", error);
    return jsonError(500, "The copilot could not analyse the workspace.");
  }
}
