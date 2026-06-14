---
baseline_commit: NO_VCS
---

# Story 1.1: Project Scaffold & Brand Foundation

Status: review

## Story

As a developer,
I want the T3 application initialized with Farm Tracking brand configuration and observability tooling,
So that all implementation work starts from a consistent, production-ready foundation.

## Acceptance Criteria

1. **T3 Init + Dev Server**: Given `npm create t3-app@latest farm-tracking` is run with TypeScript, Tailwind, tRPC, Auth.js, Drizzle, PostgreSQL selected — When `npm run dev` is started — Then the application runs locally, `npm run typecheck` passes, and `npm run lint` passes with no errors.

2. **shadcn + Brand Tokens**: Given `npx shadcn@latest init` is run and `components.json` is configured — When the Tailwind config is applied — Then the following brand tokens are active: `primary: #1E3A5F`, `accent: #D97706`, `background: #FAFAF8`, `card: #FFFFFF`, `muted: #F1F0EE`, `muted-foreground: #6B6B6B`, `border: #E2E1DF`; dark mode Tailwind variants are suppressed at the application level.

3. **Sentry**: Given Sentry is configured via `sentry.client.config.ts` and `sentry.server.config.ts` — When an unhandled error occurs in a server or client component — Then the error is captured in Sentry with a full stack trace; the DSN is loaded from `SENTRY_DSN` env var, not hardcoded.

4. **Directory Structure**: Given the project is initialized — Then the directory structure matches the architecture: `src/app/(farmer)/`, `src/app/(vet)/`, `src/app/(admin)/`, `src/server/api/routers/`, `src/server/db/`, `src/server/auth/`, `src/server/jobs/handlers/`, `src/server/services/`, `src/components/ui/`, `src/components/brand/`, `src/components/shared/`, `src/lib/constants.ts`, `src/lib/validations/`, `docs/api/`.

## Tasks / Subtasks

- [x] Task 1: Initialize T3 application (AC: 1)
  - [x] Run T3 init with TypeScript, Tailwind, tRPC, Auth.js, Drizzle, PostgreSQL, App Router selected
  - [x] Verify `npm run dev` starts the Next.js server without errors
  - [x] Run `npm run typecheck` — must exit 0
  - [x] Run `npm run lint` — must exit 0

- [x] Task 2: Initialize shadcn/ui and apply Farm Tracking brand tokens (AC: 2)
  - [x] Run `npx shadcn@latest init` (select Default style, CSS variables enabled)
  - [x] Override CSS custom properties in `src/styles/globals.css` with all 7 brand token values from DESIGN.md
  - [x] Remove or suppress dark mode from globals.css (no `.dark {}` block, no `@custom-variant dark`)
  - [x] Write config test asserting all 7 brand oklch values are present in `globals.css`
  - [x] Run `npm run typecheck` — still exits 0 after shadcn changes

- [x] Task 3: Configure Sentry for client and server error tracking (AC: 3)
  - [x] Install `@sentry/nextjs`
  - [x] Create `sentry.client.config.ts` at project root reading DSN from `process.env.SENTRY_DSN`
  - [x] Create `sentry.server.config.ts` at project root reading DSN from `process.env.SENTRY_DSN`
  - [x] Wrap `next.config.js` export with `withSentryConfig`
  - [x] Write test asserting both Sentry config files exist and contain no hardcoded DSN string

- [x] Task 4: Create the full architecture directory skeleton (AC: 4)
  - [x] Create `src/app/(farmer)/layout.tsx`, `src/app/(vet)/layout.tsx`, `src/app/(admin)/layout.tsx` with minimal valid layouts
  - [x] Create `src/server/api/routers/` — T3 generates `root.ts` and `trpc.ts`; verify they exist
  - [x] Create `src/server/auth/` directory with T3-generated `config.ts`
  - [x] Create `src/server/jobs/handlers/` directory
  - [x] Create `src/server/services/` directory
  - [x] Create `src/components/brand/` and `src/components/shared/` directories
  - [x] Create `src/lib/constants.ts` with all typed constants (ROLES, HEALTH_STATUS, SEVERITY, RECOVERY_STATUS, JOB_NAMES)
  - [x] Create `src/lib/validations/` directory
  - [x] Create `docs/api/` directory
  - [x] Write structure test using `fs.existsSync` asserting all required paths from AC-4 exist
  - [x] Run `npm run typecheck` — still exits 0

- [x] Task 5: Create `.env.example` and verify `.gitignore` (AC: 1 supporting)
  - [x] Create `.env.example` documenting all required env vars with descriptions
  - [x] Verify `.env.local` is in `.gitignore` (covered by `.env*.local` pattern)
  - [x] Create `playwright.config.ts` at project root (placeholder — E2E tests added in later stories)

## Dev Notes

### T3 Stack Initialization Command

**T3 init is interactive. Use non-interactive flags where possible:**

```bash
npm create t3-app@latest farm-tracking -- \
  --CI \
  --trpc \
  --tailwind \
  --auth \
  --drizzle \
  --dbProvider postgres \
  --appRouter \
  --noGit
```

If `--CI` does not produce App Router (varies by create-t3-app version), run interactively and confirm selections:
- Language: **TypeScript** ✅
- Tailwind CSS: **Yes** ✅
- tRPC: **Yes** ✅
- Authentication: **Auth.js** ✅
- Database ORM: **Drizzle** ✅
- Database: **PostgreSQL** ✅
- App Router: **Yes** ✅ (NOT Pages Router)

**After init, all work happens inside the `farm-tracking/` subdirectory.** The project root is `farm-tracking/`.

T3 generates a working scaffold with a placeholder Posts schema, example tRPC router, and Auth.js config skeleton. Leave all T3-generated files intact in this story — Story 1.3 replaces the schema.

### shadcn/ui Initialization

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default** (not New York)
- Base color: **Slate** (will be overridden by brand tokens)
- CSS variables: **Yes**

shadcn writes color CSS custom properties to `src/app/globals.css`. **Override the entire `:root` block** with Farm Tracking brand tokens.

### Brand Token CSS Variables

shadcn uses HSL format (space-separated, no `hsl()` wrapper). Conversions from DESIGN.md hex values:

```css
/* src/app/globals.css — replace the shadcn-generated :root block */
@layer base {
  :root {
    /* Farm Tracking brand tokens */
    --background: 60 15% 97%;          /* #FAFAF8 warm off-white */
    --foreground: 214 51% 13%;         /* dark text */
    --card: 0 0% 100%;                 /* #FFFFFF */
    --card-foreground: 214 51% 13%;
    --popover: 0 0% 100%;
    --popover-foreground: 214 51% 13%;
    --primary: 214 51% 24%;            /* #1E3A5F navy */
    --primary-foreground: 0 0% 100%;   /* #FFFFFF */
    --secondary: 40 8% 94%;            /* #F1F0EE muted */
    --secondary-foreground: 214 51% 24%;
    --muted: 40 8% 94%;                /* #F1F0EE */
    --muted-foreground: 0 0% 42%;      /* #6B6B6B */
    --accent: 32 95% 44%;              /* #D97706 amber */
    --accent-foreground: 32 100% 5%;   /* #1A0E00 */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 40 6% 88%;               /* #E2E1DF */
    --input: 40 6% 88%;
    --ring: 214 51% 24%;               /* primary navy — focus rings */
    --radius: 0.5rem;
  }
  /* NO .dark {} block — dark mode is explicitly excluded from this product */
}
```

**Hex reference for test assertions:**
| Token | Hex | HSL |
|---|---|---|
| primary | `#1E3A5F` | `214 51% 24%` |
| accent | `#D97706` | `32 95% 44%` |
| background | `#FAFAF8` | `60 15% 97%` |
| card | `#FFFFFF` | `0 0% 100%` |
| muted | `#F1F0EE` | `40 8% 94%` |
| muted-foreground | `#6B6B6B` | `0 0% 42%` |
| border | `#E2E1DF` | `40 6% 88%` |

### Dark Mode Suppression

In `tailwind.config.ts`, ensure the `darkMode` key is NOT present or is set to `false`:

```typescript
// tailwind.config.ts
const config: Config = {
  // darkMode: "class",  ← DELETE THIS if T3 generates it
  content: ["./src/**/*.{ts,tsx}"],
  // ...
};
```

In `globals.css`, do NOT add any `.dark {}` CSS block. shadcn may generate one — delete it entirely. The product has no dark mode (DESIGN.md "Don'ts", EXPERIENCE.md "Foundation").

If using Tailwind v4: add `@media (prefers-color-scheme: dark) {}` as an empty rule with a comment `/* dark mode suppressed by design */`, or simply omit all dark variants.

### Sentry Configuration

Install: `npm install @sentry/nextjs`

Run the wizard OR create manually:
```bash
npx @sentry/wizard@latest -i nextjs --saas
```

**`sentry.client.config.ts`** (project root — NOT in `src/`):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === "development",
});
```

**`sentry.server.config.ts`** (project root):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === "development",
});
```

**`next.config.ts`**:
```typescript
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // existing T3 config
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  disableLogger: true,
});
```

**CRITICAL:** `dsn` field must be `process.env.SENTRY_DSN`. Any hardcoded DSN string (starting with `https://`) fails AC-3.

### Route Group Layout Placeholders

App Router route groups require `layout.tsx` files. Minimal valid TypeScript placeholders:

```typescript
// src/app/(farmer)/layout.tsx
export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

Same pattern for `(vet)/layout.tsx` and `(admin)/layout.tsx`. These are replaced with full sidebar layouts in Story 1.4.

### `src/lib/constants.ts` — Full Contents

This file must be created in this story. All future stories import from here — never use raw strings for roles, statuses, or job names:

```typescript
export const ROLES = {
  FARMER: "farmer",
  VET: "vet",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  SICK: "sick",
} as const;

export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export const SEVERITY = {
  MILD: "mild",
  MODERATE: "moderate",
  SEVERE: "severe",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const RECOVERY_STATUS = {
  SICK: "sick",
  RECOVERED: "recovered",
} as const;

export type RecoveryStatus = (typeof RECOVERY_STATUS)[keyof typeof RECOVERY_STATUS];

export const JOB_NAMES = {
  NOTIFY_FARMER: "notify-farmer",
  VET_MORNING_DIGEST: "vet-morning-digest",
} as const;
```

### `.env.example` Contents

```env
# ─── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/farm_tracking

# ─── Auth.js ───────────────────────────────────────────────────────────────────
AUTH_SECRET=                    # Required. Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# ─── Seed (local dev only) ─────────────────────────────────────────────────────
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=                # Min 12 chars; bcrypt-hashed on seed run

# ─── AWS S3 (thermal image storage) ───────────────────────────────────────────
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_REGION=us-east-1
CLOUDFRONT_DOMAIN=               # e.g. d1234abcd.cloudfront.net

# ─── AWS SES (email) ───────────────────────────────────────────────────────────
SES_FROM_ADDRESS=               # Verified SES identity, e.g. alerts@farm-tracking.com

# ─── Observability ─────────────────────────────────────────────────────────────
SENTRY_DSN=                     # Required for error tracking; omit to disable
```

`.env.local` is already in T3's default `.gitignore`. Verify it is present.

### What T3 Generates (Do Not Modify in This Story)

| File | Purpose | Action |
|---|---|---|
| `src/server/db/schema.ts` | Placeholder Posts schema | Leave as-is; Story 1.3 replaces |
| `src/server/api/routers/post.ts` | Example tRPC router | Leave as-is; Story 1.3 adds domain routers |
| `src/server/api/trpc.ts` | tRPC context + `publicProcedure`, `protectedProcedure` | Leave as-is; Story 1.3 adds `farmerProcedure`, `vetProcedure`, `adminProcedure` |
| `src/server/auth/config.ts` | Auth.js skeleton | Leave as-is; Story 1.3 fully configures |
| `src/middleware.ts` | Empty or basic middleware | Leave as-is; Story 1.4 adds RBAC |

### Testing Approach

This story has no business logic — tests verify configuration correctness:

**Test file locations** (co-located pattern from architecture):
- `tests/config/brand-tokens.test.ts`
- `tests/config/sentry.test.ts`
- `tests/config/project-structure.test.ts`

**Brand token test** — read `globals.css` and assert HSL values are present:
```typescript
import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";

describe("Brand tokens", () => {
  const css = readFileSync("src/app/globals.css", "utf-8");
  it("includes primary navy token", () => expect(css).toContain("214 51% 24%"));
  it("includes accent amber token", () => expect(css).toContain("32 95% 44%"));
  it("includes background token", () => expect(css).toContain("60 15% 97%"));
  it("has no .dark block", () => expect(css).not.toMatch(/\.dark\s*\{/));
});
```

**Structure test** — verify required directories and files:
```typescript
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
  "src/components/brand",
  "src/components/shared",
  "src/lib/constants.ts",
  "src/lib/validations",
  "docs/api",
];

describe("Project structure", () => {
  REQUIRED_PATHS.forEach((p) => {
    it(`${p} exists`, () => expect(existsSync(p)).toBe(true));
  });
});
```

**Sentry test** — verify no hardcoded DSN:
```typescript
import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";

describe("Sentry config", () => {
  ["sentry.client.config.ts", "sentry.server.config.ts"].forEach((file) => {
    it(`${file} uses SENTRY_DSN env var`, () => {
      const content = readFileSync(file, "utf-8");
      expect(content).toContain("SENTRY_DSN");
      expect(content).not.toMatch(/dsn:\s*["']https:\/\//);
    });
  });
});
```

**Primary validation gate**: `npm run typecheck` and `npm run lint` exiting 0 after all file creation.

### Architecture Compliance Checklist

- `src/components/ui/` — generated by shadcn; never edited manually (architecture boundary)
- `src/components/brand/` — brand-layer overrides only; create directory but no components in this story (HealthBadge, StatCard etc. are in Story 3.2)
- No dark mode variants anywhere (DESIGN.md "Don'ts", EXPERIENCE.md "Foundation")
- `JOB_NAMES` constants use kebab-case strings (`notify-farmer`, not `NOTIFY_FARMER`) per architecture naming
- `components/ui/` and `components/brand/` must never be cross-imported across role directories

### Scope Boundary (Do NOT Implement in This Story)

- Any tRPC procedure builders beyond `publicProcedure` / `protectedProcedure`
- Drizzle schema tables (Story 1.3)
- Auth.js credentials provider or session config (Story 1.3)
- RBAC middleware (Story 1.4)
- Any AWS infrastructure or GitHub Actions workflows (Story 1.2)
- Any brand-layer components (HealthBadge, StatCard, etc.) — directories only
- Any farmer, vet, or admin page content — layouts only

### References

- [Source: architecture.md — Starter Template Evaluation] — T3 init command and selections
- [Source: architecture.md — Code Organization] — complete directory structure
- [Source: architecture.md — First Implementation Priority] — init commands are step 1 of 12
- [Source: architecture.md — Implementation Sequence] — sequence awareness for what NOT to implement
- [Source: architecture.md — Enforcement Guidelines] — JOB_NAMES, naming conventions
- [Source: DESIGN.md — Colors] — all 7 brand hex values
- [Source: DESIGN.md — Don'ts] — no dark mode, no decorative amber
- [Source: EXPERIENCE.md — Foundation] — no dark mode, App Router required
- [Source: epics.md — Story 1.1 ACs] — authoritative acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- T3 CLI v7.40.0 fails in non-TTY environment even with `--CI` when run in a directory with existing files — scaffolded in `/tmp/t3-scaffold/` then rsync'd to project root
- shadcn v4.11.0 with Tailwind v4 uses `oklch()` format for CSS colors, not HSL — brand token tests updated to check oklch values
- T3 puts `globals.css` at `src/styles/globals.css`, not `src/app/globals.css` — tests and references updated accordingly
- `next.config.js` (not `.ts`) is the T3-generated file; `withSentryConfig` wrapped around the ESM default export
- `playwright.config.ts` excluded from `tsconfig.json` since `@playwright/test` is not yet installed (Epic 2+)

### Completion Notes List

- All 5 tasks complete; 35/35 tests pass (`npm test`)
- `SKIP_ENV_VALIDATION=true npm run typecheck` exits 0; `npm run lint` exits 0 (no errors)
- Tailwind v4 uses `@theme` directive and `oklch()` colors — no `tailwind.config.ts` file; config lives entirely in `globals.css`
- Dark mode suppressed by removing `@custom-variant dark` and `.dark {}` block from `globals.css` per DESIGN.md "Don'ts"
- shadcn style is `base-nova` (Tailwind v4 default); component aliases point to `~/components/ui`, `~/lib/utils`
- `package.json` has `"test": "vitest run"` and `"test:watch": "vitest"` scripts added

### File List

**Created:**
- `src/styles/globals.css` — brand tokens in oklch, dark mode suppressed
- `src/app/(farmer)/layout.tsx` — placeholder route group layout
- `src/app/(vet)/layout.tsx` — placeholder route group layout
- `src/app/(admin)/layout.tsx` — placeholder route group layout
- `src/lib/constants.ts` — ROLES, HEALTH_STATUS, SEVERITY, RECOVERY_STATUS, JOB_NAMES
- `src/server/jobs/handlers/.gitkeep` — directory placeholder
- `src/server/services/.gitkeep` — directory placeholder
- `src/components/brand/.gitkeep` — directory placeholder
- `src/components/shared/.gitkeep` — directory placeholder
- `src/lib/validations/.gitkeep` — directory placeholder
- `docs/api/.gitkeep` — directory placeholder
- `sentry.client.config.ts` — Sentry client init reading SENTRY_DSN
- `sentry.server.config.ts` — Sentry server init reading SENTRY_DSN
- `tests/config/brand-tokens.test.ts` — 10 tests for brand oklch values
- `tests/config/sentry.test.ts` — 7 tests for Sentry config
- `tests/config/project-structure.test.ts` — 18 tests for directory structure + constants
- `.env.example` — farm-tracking specific env vars (replaced T3 Discord template)
- `playwright.config.ts` — placeholder E2E config (excluded from tsconfig)

**Modified:**
- `next.config.js` — wrapped with `withSentryConfig`
- `package.json` — added `test`, `test:watch` scripts
- `tsconfig.json` — excluded `playwright.config.ts` from compilation
- `components.json` — shadcn config with base-nova style, oklch colors

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-06-14 | Used oklch() instead of HSL for brand tokens | shadcn v4.11.0 + Tailwind v4 uses oklch format |
| 2026-06-14 | globals.css at src/styles/ not src/app/ | T3 v7.40.0 places globals.css under src/styles/ |
| 2026-06-14 | next.config.js not .ts | T3 v7.40.0 generates .js with ESM export |
| 2026-06-14 | Excluded playwright.config.ts from tsconfig | @playwright/test not installed until Epic 2+ |
