import { existsSync } from "fs";
import { describe, it, expect } from "vitest";

const REQUIRED_PATHS = [
  "src/app/(farmer)",
  "src/app/(vet)",
  "src/app/(admin)",
  "src/server/api/routers",
  "src/server/db",
  "src/server/auth",
  "src/server/jobs/handlers",
  "src/server/services",
  "src/components/ui",
  "src/components/brand",
  "src/components/shared",
  "src/lib/constants.ts",
  "src/lib/validations",
  "docs/api",
];

describe("Project structure (AC-4)", () => {
  REQUIRED_PATHS.forEach((p) => {
    it(`${p} exists`, () => {
      expect(existsSync(p)).toBe(true);
    });
  });

  it("constants.ts exports ROLES with farmer, vet, admin", async () => {
    const { ROLES } = await import("../../src/lib/constants.js");
    expect(ROLES.FARMER).toBe("farmer");
    expect(ROLES.VET).toBe("vet");
    expect(ROLES.ADMIN).toBe("admin");
  });

  it("constants.ts exports JOB_NAMES with kebab-case values", async () => {
    const { JOB_NAMES } = await import("../../src/lib/constants.js");
    expect(JOB_NAMES.NOTIFY_FARMER).toBe("notify-farmer");
    expect(JOB_NAMES.VET_MORNING_DIGEST).toBe("vet-morning-digest");
  });

  it("constants.ts exports HEALTH_STATUS", async () => {
    const { HEALTH_STATUS } = await import("../../src/lib/constants.js");
    expect(HEALTH_STATUS.HEALTHY).toBe("healthy");
    expect(HEALTH_STATUS.SICK).toBe("sick");
  });

  it("constants.ts exports SEVERITY", async () => {
    const { SEVERITY } = await import("../../src/lib/constants.js");
    expect(SEVERITY.MILD).toBe("mild");
    expect(SEVERITY.MODERATE).toBe("moderate");
    expect(SEVERITY.SEVERE).toBe("severe");
  });
});
