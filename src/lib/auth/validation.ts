import { z } from "zod";

/**
 * Shared authentication validation.
 *
 * The same schemas run in the browser (inline feedback) and in the route
 * handlers (authority). Client validation is never trusted on its own.
 */

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .email("Enter a valid email address.")
  .transform(normalizeEmail);

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "digit",
    label: "One number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "symbol",
    label: "One symbol",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
  {
    id: "max",
    label: `No more than ${PASSWORD_MAX_LENGTH} characters`,
    test: (value) => value.length <= PASSWORD_MAX_LENGTH,
  },
];

export function passwordIssues(value: string): string[] {
  return passwordRules
    .filter((rule) => !rule.test(value))
    .map((rule) => rule.label);
}

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Use no more than ${PASSWORD_MAX_LENGTH} characters.`,
  )
  .superRefine((value, ctx) => {
    for (const rule of passwordRules) {
      if (rule.id === "length" || rule.id === "max") continue;
      if (!rule.test(value)) {
        ctx.addIssue({ code: "custom", message: rule.label + " is required." });
      }
    }
  });

export const tokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/, "This link is not valid.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(PASSWORD_MAX_LENGTH, "That password is too long."),
  rememberMe: z.boolean().optional().default(false),
  next: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "Use 80 characters or fewer."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your password."),
    acceptTerms: z.literal(true, {
      message: "Accept the terms and privacy policy to continue.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.password, {
    message: "Choose a password you have not used here before.",
    path: ["password"],
  });

export const phoneSchema = z
  .string()
  .trim()
  .max(32, "Use 32 characters or fewer.")
  .refine(
    (value) => value === "" || /^\+?[0-9][0-9\s().-]{5,30}$/.test(value),
    "Enter a valid phone number, including the country code.",
  );

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Use 80 characters or fewer."),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

/**
 * Workspace preferences are presentation-only. They are stored on the user
 * record and never grant access. Unknown keys are stripped by Zod.
 */
export const SUPPORTED_LOCALES = ["en"] as const;
export const SUPPORTED_THEMES = ["system", "light", "dark"] as const;

export const preferencesSchema = z.object({
  theme: z.enum(SUPPORTED_THEMES).default("system"),
  locale: z.enum(SUPPORTED_LOCALES).default("en"),
  timeZone: z
    .string()
    .trim()
    .max(64)
    .refine((value) => {
      if (!value) return true;
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid time zone.")
    .default(""),
  emailNotifications: z.boolean().default(true),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  locale: "en",
  timeZone: "",
  emailNotifications: true,
};

/** Reads stored preferences defensively; invalid data falls back to defaults. */
export function parsePreferences(value: unknown): Preferences {
  const parsed = preferencesSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
}
