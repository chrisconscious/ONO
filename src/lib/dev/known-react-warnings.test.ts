import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isKnownReactWarning,
  REACT_CONDITIONAL_USE_WARNING,
} from "./known-react-warnings";

describe("isKnownReactWarning", () => {
  it("matches the exact Error React emits", () => {
    const warning = new Error(
      "This library called use() to suspend in a previous render but did not call use() when it finished. This indicates an incorrect use of use(). Learn more: https://react.dev/warnings/conditional-use-of-use",
    );

    expect(isKnownReactWarning([warning])).toBe(true);
  });

  it("matches string messages", () => {
    expect(isKnownReactWarning([REACT_CONDITIONAL_USE_WARNING])).toBe(true);
  });

  it("matches error-like objects", () => {
    expect(isKnownReactWarning([{ message: REACT_CONDITIONAL_USE_WARNING }])).toBe(true);
  });

  it("leaves unrelated warnings untouched", () => {
    expect(isKnownReactWarning([])).toBe(false);
    expect(isKnownReactWarning(["Something else went wrong"])).toBe(false);
    expect(isKnownReactWarning([new Error("Hydration failed because the server rendered HTML didn't match the client")])).toBe(false);
    expect(isKnownReactWarning([42, null, undefined, { message: 1 }])).toBe(false);
  });
});

describe("suppressKnownReactWarnings", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", {});
    console.error = vi.fn() as unknown as typeof console.error;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.unstubAllGlobals();
  });

  it("passes unrelated errors through and removes itself after the known warning", async () => {
    const mod = await import("./known-react-warnings");
    const target = console.error;

    mod.suppressKnownReactWarnings();
    const filtered = console.error;
    expect(filtered).not.toBe(target);

    filtered("keep me");
    expect(target).toHaveBeenCalledWith("keep me");

    filtered(new Error(mod.REACT_CONDITIONAL_USE_WARNING));
    expect(console.error).toBe(target);
    expect(target).toHaveBeenCalledTimes(1);
  });

  it("does not install again after catching the warning", async () => {
    const mod = await import("./known-react-warnings");

    mod.suppressKnownReactWarnings();
    const filtered = console.error;
    filtered(new Error(mod.REACT_CONDITIONAL_USE_WARNING));
    const restored = console.error;

    mod.suppressKnownReactWarnings();

    expect(console.error).toBe(restored);
    expect(console.error).not.toBe(filtered);
  });
});
