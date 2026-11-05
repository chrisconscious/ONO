import { describe, expect, it } from "vitest";
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./password";

describe("password hashing", () => {
  it("verifies the original password and rejects another", () => {
    const hash = hashPassword("Correct-Horse-9!");
    expect(verifyPassword("Correct-Horse-9!", hash)).toBe(true);
    expect(verifyPassword("Wrong-Horse-9!", hash)).toBe(false);
  });

  it("uses a unique salt per hash", () => {
    const first = hashPassword("Correct-Horse-9!");
    const second = hashPassword("Correct-Horse-9!");
    expect(first).not.toBe(second);
    expect(first.split(":")).toHaveLength(2);
  });

  it("returns false for malformed hashes instead of throwing", () => {
    expect(verifyPassword("Correct-Horse-9!", "not-a-hash")).toBe(false);
    expect(verifyPassword("Correct-Horse-9!", "")).toBe(false);
  });
});

describe("token helpers", () => {
  it("generates unpredictable tokens of the requested size", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
  });

  it("hashes tokens deterministically without storing the raw value", () => {
    const token = generateToken();
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
