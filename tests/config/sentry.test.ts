import { readFileSync, existsSync } from "fs";
import { describe, it, expect } from "vitest";

describe("Sentry configuration (AC-3)", () => {
  const FILES = ["sentry.client.config.ts", "sentry.server.config.ts"];

  FILES.forEach((file) => {
    it(`${file} exists`, () => {
      expect(existsSync(file)).toBe(true);
    });

    it(`${file} reads DSN from SENTRY_DSN env var`, () => {
      const content = readFileSync(file, "utf-8");
      expect(content).toContain("SENTRY_DSN");
    });

    it(`${file} does not contain a hardcoded DSN string`, () => {
      const content = readFileSync(file, "utf-8");
      expect(content).not.toMatch(/dsn:\s*["']https:\/\//);
    });
  });

  it("next.config.js wraps with withSentryConfig", () => {
    const content = readFileSync("next.config.js", "utf-8");
    expect(content).toContain("withSentryConfig");
    expect(content).toContain("@sentry/nextjs");
  });
});
