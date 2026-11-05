/**
 * Outbound email boundary.
 *
 * The project has no email provider configured, so this module exposes a small
 * transport contract instead of pretending delivery works. Two transports are
 * supported today:
 *
 *   console  – development/test only. Writes the message (including the link)
 *              to the server log so the flow can be completed locally.
 *   disabled – fails closed. Callers must still return a neutral response to
 *              the visitor, so account existence is not revealed.
 *
 * To add a real provider, implement `deliver` for it and set EMAIL_TRANSPORT.
 * No provider credentials exist in this repository.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailTransport = "console" | "disabled";

export type EmailDelivery = {
  transport: EmailTransport;
  delivered: boolean;
};

export class EmailTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailTransportError";
  }
}

export function resolveEmailTransport(
  env: Record<string, string | undefined> = process.env,
): EmailTransport {
  const configured = env.EMAIL_TRANSPORT?.trim().toLowerCase();

  if (configured === "console") {
    // Printing a reset link in a production log would leak account recovery
    // material, so the console transport is development-only.
    return env.NODE_ENV === "production" ? "disabled" : "console";
  }

  if (configured === "disabled") return "disabled";

  return env.NODE_ENV === "production" ? "disabled" : "console";
}

export async function sendEmail(
  message: EmailMessage,
  env: Record<string, string | undefined> = process.env,
): Promise<EmailDelivery> {
  const transport = resolveEmailTransport(env);

  if (transport === "disabled") {
    return { transport, delivered: false };
  }

  // Development-only sink. The caller decides what goes into `text`.
  console.info(
    `[email:console] to=${message.to} subject=${message.subject}\n${message.text}`,
  );

  return { transport, delivered: true };
}

/** True when a real delivery channel is configured. */
export function isEmailDeliveryConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  return resolveEmailTransport(env) !== "disabled";
}
