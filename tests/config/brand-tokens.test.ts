import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";

const css = readFileSync("src/styles/globals.css", "utf-8");

describe("Brand tokens (DESIGN.md → globals.css)", () => {
  it("sets primary navy (#1E3A5F) as --primary", () => {
    // oklch(0.3105 0.0752 240.0) ≈ #1E3A5F
    expect(css).toContain("--primary: oklch(0.3105 0.0752 240.0)");
  });

  it("sets accent amber (#D97706) as --accent", () => {
    // oklch(0.6197 0.1516 54.6) ≈ #D97706
    expect(css).toContain("--accent: oklch(0.6197 0.1516 54.6)");
  });

  it("sets warm off-white (#FAFAF8) as --background", () => {
    // oklch(0.9844 0.0023 82.9) ≈ #FAFAF8
    expect(css).toContain("--background: oklch(0.9844 0.0023 82.9)");
  });

  it("sets white (#FFFFFF) as --card", () => {
    expect(css).toContain("--card: oklch(1 0 0)");
  });

  it("sets muted (#F1F0EE) as --muted", () => {
    // oklch(0.9494 0.0041 82.9) ≈ #F1F0EE
    expect(css).toContain("--muted: oklch(0.9494 0.0041 82.9)");
  });

  it("sets muted-foreground (#6B6B6B) as --muted-foreground", () => {
    // oklch(0.5041 0 0) ≈ #6B6B6B neutral gray
    expect(css).toContain("--muted-foreground: oklch(0.5041 0 0)");
  });

  it("sets border (#E2E1DF) as --border", () => {
    // oklch(0.8942 0.0033 82.9) ≈ #E2E1DF
    expect(css).toContain("--border: oklch(0.8942 0.0033 82.9)");
  });

  it("uses primary navy for --ring (focus rings)", () => {
    expect(css).toContain("--ring: oklch(0.3105 0.0752 240.0)");
  });

  it("has no .dark {} block (dark mode suppressed)", () => {
    expect(css).not.toMatch(/\.dark\s*\{/);
  });

  it("has no @custom-variant dark line (dark mode suppressed)", () => {
    expect(css).not.toContain("@custom-variant dark");
  });
});
