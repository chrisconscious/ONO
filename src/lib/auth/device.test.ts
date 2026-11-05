import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./device";

describe("describeUserAgent", () => {
  it("reports a readable browser and platform", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
      ),
    ).toBe("Chrome on Windows");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.1 Safari/605.1.15",
      ),
    ).toBe("Safari on macOS");
  });

  it("prefers the Chromium-based browser token", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 Edg/131.0",
      ),
    ).toBe("Edge on Windows");
  });

  it("falls back for missing or unknown agents", () => {
    expect(describeUserAgent(null)).toBe("Unknown device");
    expect(describeUserAgent("curl/8.0")).toBe("Browser on Unknown platform");
  });
});
