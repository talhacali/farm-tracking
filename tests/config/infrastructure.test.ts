import { existsSync, readFileSync } from "fs";
import { describe, it, expect } from "vitest";

describe("Dockerfile (AC-1)", () => {
  it("Dockerfile exists at project root", () => {
    expect(existsSync("Dockerfile")).toBe(true);
  });
  it("Dockerfile exposes port 3000", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("EXPOSE 3000");
  });
  it("Dockerfile uses multi-stage build with runner stage", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("AS runner");
  });
  it("Dockerfile runs as non-root user", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("USER nextjs");
  });
  it("Dockerfile sets SKIP_ENV_VALIDATION in builder stage", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("SKIP_ENV_VALIDATION=true");
  });
});

describe("next.config.js standalone output (AC-1)", () => {
  it("next.config.js contains output: standalone", () => {
    const content = readFileSync("next.config.js", "utf-8");
    expect(content).toContain("standalone");
  });
});

describe("GitHub Actions CI workflow (AC-3)", () => {
  it(".github/workflows/ci.yml exists", () => {
    expect(existsSync(".github/workflows/ci.yml")).toBe(true);
  });
  it("ci.yml triggers on pull_request to main", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toContain("pull_request");
    expect(content).toContain("main");
  });
  it("ci.yml runs typecheck with SKIP_ENV_VALIDATION", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toContain("SKIP_ENV_VALIDATION");
    expect(content).toContain("typecheck");
  });
  it("ci.yml runs lint", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toContain("lint");
  });
  it("ci.yml runs tests", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toMatch(/npm (run )?test/);
  });
});

describe("GitHub Actions Deploy workflow (AC-4)", () => {
  it(".github/workflows/deploy.yml exists", () => {
    expect(existsSync(".github/workflows/deploy.yml")).toBe(true);
  });
  it("deploy.yml triggers on push to main", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content).toContain("push");
    expect(content).toContain("main");
  });
  it("deploy.yml uses GitHub secrets (no hardcoded AWS account IDs)", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content).toContain("secrets.");
    expect(content).not.toMatch(/arn:aws:iam::\d{12}:/);
  });
  it("deploy.yml pushes to ECR", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content.toLowerCase()).toContain("ecr");
  });
  it("deploy.yml deploys to ECS", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content.toLowerCase()).toContain("ecs");
  });
});

describe("AWS setup documentation (AC-2)", () => {
  it("docs/aws-setup.md exists", () => {
    expect(existsSync("docs/aws-setup.md")).toBe(true);
  });
});
