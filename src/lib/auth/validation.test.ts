import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  changePasswordSchema,
  emailSchema,
  passwordIssues,
  passwordSchema,
  parsePreferences,
  signUpSchema,
  tokenSchema,
} from "./validation";

const strongPassword = "Correct-Horse-9!";

describe("emailSchema", () => {
  it("trims and lowercases addresses", () => {
    expect(emailSchema.parse("  Owner@Northwind.Local ")).toBe(
      "owner@northwind.local",
    );
  });

  it("rejects malformed addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});

describe("password policy", () => {
  it("accepts a password that meets every rule", () => {
    expect(passwordSchema.safeParse(strongPassword).success).toBe(true);
    expect(passwordIssues(strongPassword)).toEqual([]);
  });

  it("requires length, mixed case, a number and a symbol", () => {
    const issues = passwordIssues("alllowercase1");
    expect(issues).toContain("One uppercase letter");
    expect(issues).toContain("One symbol");
  });

  it("enforces the minimum and maximum lengths", () => {
    expect(passwordSchema.safeParse("Aa1!".repeat(2)).success).toBe(false);
    expect(
      passwordSchema.safeParse(`${strongPassword}${"a".repeat(PASSWORD_MAX_LENGTH)}`)
        .success,
    ).toBe(false);
    expect(passwordIssues("short1!A")).toContain(
      `At least ${PASSWORD_MIN_LENGTH} characters`,
    );
  });
});

describe("signUpSchema", () => {
  const base = {
    name: "Ada Lovelace",
    email: "Ada@Example.com",
    password: strongPassword,
    confirmPassword: strongPassword,
    acceptTerms: true as const,
  };

  it("normalizes the email and accepts valid input", () => {
    expect(signUpSchema.parse(base)).toMatchObject({
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  it("rejects mismatched passwords and missing terms", () => {
    const mismatch = signUpSchema.safeParse({
      ...base,
      confirmPassword: "Different-Pass-1!",
    });
    expect(mismatch.success).toBe(false);

    const noTerms = signUpSchema.safeParse({ ...base, acceptTerms: false });
    expect(noTerms.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("rejects reusing the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: strongPassword,
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe("tokenSchema", () => {
  it("accepts only 64 lowercase hex characters", () => {
    expect(tokenSchema.safeParse("a".repeat(64)).success).toBe(true);
    expect(tokenSchema.safeParse("A".repeat(64)).success).toBe(false);
    expect(tokenSchema.safeParse("../etc/passwd").success).toBe(false);
    expect(tokenSchema.safeParse("a".repeat(63)).success).toBe(false);
  });
});

describe("parsePreferences", () => {
  it("falls back to defaults for invalid or missing data", () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ theme: "neon", timeZone: "Mars/Olympus" })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it("keeps valid preferences and strips unknown keys", () => {
    expect(
      parsePreferences({
        theme: "dark",
        locale: "en",
        timeZone: "Africa/Dar_es_Salaam",
        emailNotifications: false,
        admin: true,
      }),
    ).toEqual({
      theme: "dark",
      locale: "en",
      timeZone: "Africa/Dar_es_Salaam",
      emailNotifications: false,
    });
  });
});
