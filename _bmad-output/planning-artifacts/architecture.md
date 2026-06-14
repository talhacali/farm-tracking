---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-14'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-farm-tracking-2026-06-14/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-farm-tracking-2026-06-14/EXPERIENCE.md
workflowType: 'architecture'
project_name: 'farm-tracking'
user_name: 'Talhacali'
date: '2026-06-14'
---

# Architecture Decision Document
## Farm Tracking

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

43 FRs across 8 categories, each with architectural weight:

| Category | FRs | Architectural implication |
|---|---|---|
| Authentication & Account Management | FR-001–005 | Session-based auth with idle timeout; no self-service sign-up; all accounts created by Super-Admin |
| Farm & Assignment Management | FR-006–012 | Many-to-many vet-farm assignments; farm deactivation with data preservation (soft-disable, not delete) |
| Cattle Management | FR-013–017 | Farmer-owned records, read-only once created; health status derived from health report submissions |
| Scan Ingestion API | FR-018–023 | External REST API with API-key auth, versioned contract, rejection on unrecognized cattle ID |
| Scan Viewer & Annotation | FR-024–029 | Canvas-based vector annotation stored per scan record; export as composite PNG; no concurrent annotation on same scan |
| Health Reports | FR-030–035 | Immutable after submission; drives cattle health status state machine; vet and farmer read-only views |
| Farmer Dashboard | FR-036–038 | Aggregate metrics + 6-month bar chart; on-load refresh (no streaming); sick count drills into filtered cattle list |
| Alerts & Notifications | FR-039–043 | Near-real-time in-app + email alert to farmer on report submission; scheduled daily digest to vet at 07:00 local time (suppressed on zero activity) |

**Non-Functional Requirements:**

| NFR | Architectural driver |
|---|---|
| NFR-001–005: Server-side RBAC + farm scoping | Every data query must enforce role and farm boundary server-side; client routing guards are secondary |
| NFR-006: Concurrent scan ingestion (up to 30 submissions/min, 10 devices/farm) | API layer must be stateless and horizontally scalable; idempotency strategy required |
| NFR-007: Versioned API contract | Scan ingestion API must support version increments without breaking the external mobile app consumer |
| NFR-008: Durable object storage for thermal images | Thermal image bytes live in object storage (S3-compatible); database stores only the reference URL |
| NFR-009: Soft delete only | All cattle, scan, and health report records carry a `deleted_at` field; no hard deletes permitted |
| NFR-010: Environment data queryable per scan | Environment data (temperature, humidity, extensible fields) stored as structured data on the scan record |
| NFR-011: Dashboard load <3s | Aggregate queries must be efficient; consider denormalized counters or materialized views for cattle/scan counts |
| NFR-012: Scan viewer ready <5s | Thermal image load from object storage is the critical path; CDN or presigned URL delivery recommended |
| NFR-013: API response <2s | Ingestion endpoint must not block on image processing; async processing pattern for any post-ingest work |

**Scale & Complexity:**

- Primary domain: Full-stack web application + versioned external REST API
- Complexity level: **Medium** — no AI/ML, no real-time streaming, no billing, no i18n
- Estimated architectural components: ~6 backend domain modules, ~12 frontend surfaces, 1 background job scheduler, 1 object storage integration
- Peak load: ~30 scan submissions/min across platform (modest; standard web tier handles this comfortably)

### Technical Constraints & Dependencies

- **External mobile app** consumes the scan ingestion API — breaking changes require version bump; this app is out of scope to build
- **No offline mode** — network connectivity assumed throughout
- **No dark mode** — UX spec explicitly excludes it
- **No real-time streaming** — dashboard and scan queue refresh on page load; in-app notifications can be polled or delivered via lightweight push (SSE acceptable)
- **WCAG 2.2 AA** — including keyboard fallback for the annotation canvas, which is a non-trivial frontend implementation
- **Annotation export** — composite PNG generation (base thermal + shape overlays) must happen client-side or via a server-side render endpoint
- **Timezone-aware scheduling** — vet digest delivery at 07:00 local time per vet; configurable by Super-Admin

### Cross-Cutting Concerns Identified

| Concern | Scope |
|---|---|
| **RBAC + farm scoping** | Every API route, every data query, every frontend route guard |
| **Soft delete** | Every data model; every list query filters `deleted_at IS NULL` |
| **Immutability** | Health reports and annotation sets are read-only after submission |
| **File storage** | Thermal image upload (ingestion API), presigned URL delivery (scan viewer), composite export (annotation export) |
| **Background jobs** | Daily vet digest (cron, timezone-aware); farmer notification delivery (triggered, near-real-time) |
| **API versioning** | Scan ingestion endpoint versioned in URL path (`/v1/scans`); breaking changes bump version |
| **Session management** | 8h idle timeout; 15-minute warning dialog; annotation canvas state loss on expiry is documented behavior |
| **Cattle health state machine** | Status transitions are strictly controlled by health report submissions; no direct status editing by any user |

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application + external REST API, based on project requirements analysis.

### Starter Options Considered

| Option | Verdict |
|---|---|
| `create-t3-app` (Next.js + tRPC + Auth.js + Drizzle) | ✅ Selected — covers auth, DB, and type-safe internal API out of the box |
| `create-next-app@latest` + manual stack assembly | ❌ More boilerplate without meaningful control gains for this project shape |

### Selected Starter: T3 Stack

**Rationale:** The project needs session auth, a PostgreSQL-backed data layer, and a type-safe internal API — exactly what T3 provides. The external scan ingestion API lives as standard Next.js API routes (`/api/v1/scans`) alongside tRPC, which is a first-class and documented T3 pattern. shadcn/ui (already pinned by the UX spec) is added in a post-init step.

**Initialization Commands:**

```bash
npm create t3-app@latest farm-tracking
# Select: TypeScript ✅ | Tailwind ✅ | tRPC ✅ | Auth.js ✅ | Drizzle ✅ | DB: postgres

npx shadcn@latest init
# Follow prompts — imports DESIGN.md color tokens into components.json
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript strict mode throughout. Next.js 16.x App Router.

**Styling Solution:** Tailwind CSS (T3 default) + shadcn/ui CLI v4 for component registry. Design tokens from `DESIGN.md` configured in `components.json`.

**Build Tooling:** Turbopack for dev server (Next.js 16 default). Standard Next.js production build for Docker packaging.

**ORM & Migrations:** Drizzle ORM + `drizzle-kit` for schema migrations. Schema lives in `src/server/db/schema.ts`. Migrations are explicit SQL files checked into version control.

**Auth:** Auth.js v5 (NextAuth). Email/password provider via credentials adapter. Session stored in PostgreSQL via Drizzle adapter. Idle timeout enforced via `maxAge` session config (8h default per FR-004).

**Internal API Layer:** tRPC v11 with App Router integration. All web-app-to-server calls go through tRPC procedures with role-checked context. External scan ingestion lives in `src/app/api/v1/` as standard Next.js route handlers with separate API-key middleware.

**Code Organization:**
```
src/
  app/           # Next.js App Router pages + layout per role
  server/
    api/         # tRPC routers (one per domain: cattle, scans, reports, farms, users)
    db/          # Drizzle schema + connection
    auth/        # Auth.js config
    jobs/        # pg-boss worker setup + job handlers
  components/    # shadcn/ui components + brand-layer overrides
  app/api/v1/    # External REST endpoints (scan ingestion)
```

**Background Jobs:** `pg-boss` v12 co-located in the Next.js server process. Job types: `notify-farmer` (triggered on health report submission) and `vet-morning-digest` (cron, timezone-aware per vet). No Redis required.

**Development Experience:** Turbopack dev server, TypeScript strict, ESLint + Prettier (T3 default), Drizzle Studio for DB inspection.

**AWS Deployment Target:**
- Compute: ECS Fargate (single container — Next.js process hosts both web app and pg-boss worker)
- Database: RDS PostgreSQL (private VPC subnet, no public internet access)
- Object Storage: S3 (thermal images) + CloudFront (presigned URL delivery to scan viewer)
- Email: AWS SES (farmer alerts + vet digest)

**Note:** Project initialization using these commands should be the first implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Annotation data storage model (JSONB column)
- Session type (database sessions — required for instant revocability)
- RBAC enforcement layer (Next.js middleware + tRPC context)
- Farm scoping pattern (explicit `farm_id` denormalized on cattle + scan records)

**Important Decisions (Shape Architecture):**
- API key hashing (SHA-256, raw key shown once)
- External API documentation (OpenAPI 3.x spec)
- Canvas implementation (native HTML5 Canvas API)
- Client state approach (URL state + local React state, no global store)
- CI/CD (GitHub Actions → ECR → ECS)
- Secrets management (AWS Secrets Manager)

**Deferred Decisions (Post-MVP):**
- Multi-container ECS task (background worker as separate container — not needed at 30 submissions/min)
- Redis-backed rate limiting (in-memory token bucket sufficient for single-container MVP)
- CDN image optimization (beyond CloudFront presigned URLs)

---

### Data Architecture

**Annotation Storage — JSONB column on `scan_records`**
- Decision: `annotations JSONB` column storing an array of shape descriptors, e.g. `[{type:"circle", cx:120, cy:80, r:40}, ...]`
- Rationale: Annotations are always read/written as a set; no query filters by individual shape. JSONB avoids a join and keeps the shape schema flexible for future shape types.
- Affects: `scan_records` table schema, Scan Viewer write path, annotation export

**Soft Delete — `deleted_at` timestamp pattern**
- Decision: All cattle, scan records, and health reports carry a `deleted_at TIMESTAMP` column. Hard deletes are never performed.
- Rationale: NFR-009 compliance. Drizzle query helpers enforce `WHERE deleted_at IS NULL` consistently.
- Affects: All domain table schemas, all list queries, super-admin recovery UI

**Farm Scoping — Explicit `farm_id` denormalization**
- Decision: `farm_id` FK on `cattle` (primary). `farm_id` denormalized (redundant but indexed) on `scan_records` for direct aggregate queries. Health reports derive farm scope via scan FK.
- Rationale: Dashboard aggregate queries (total cattle, sick count, scan count) hit `scan_records` directly without a join chain. Explicit `farm_id` makes scoping audits straightforward.
- Affects: Schema design, dashboard query performance (NFR-011), data ingestion write path

**Data Validation — Zod**
- Decision: Zod schemas for all tRPC input validation and all external API request body parsing. Single source of truth for shape — Zod schema infers TypeScript type.
- Rationale: Already included in T3 starter. Consistent validation across internal and external surfaces.

---

### Authentication & Security

**Session Type — Database sessions**
- Decision: Auth.js v5 Drizzle adapter with database-backed sessions (not JWT).
- Rationale: Sessions are immediately revokable by super-admin. A terminated vet or farmer cannot hold a valid session beyond the revocation moment. The additional DB read per request is acceptable for an internal tool.
- Affects: Auth.js config, `sessions` table in schema, super-admin user management

**API Key Storage — SHA-256 hashed**
- Decision: Raw API key generated at creation (shown once, never stored). DB stores `key_hash = SHA-256(raw_key)`. Ingestion middleware matches `WHERE key_hash = sha256($incomingKey)`.
- Rationale: Standard credential hygiene. Mirrors GitHub PAT model. UX spec already specifies "copy once" behavior.
- Affects: API key management UI, scan ingestion middleware, `api_keys` table schema

**RBAC Enforcement — Two-layer**
- Decision:
  1. **Next.js middleware** — route-level guards on `/farmer/*`, `/vet/*`, `/admin/*`. Unauthenticated or wrong-role requests are redirected.
  2. **tRPC context** — every procedure receives `ctx.session.user` (role + farmId). Procedures assert role and farm scope before any DB operation.
- Rationale: Defense in depth per NFR-005. Client routing guards are cosmetic; server-side enforcement is authoritative.
- Affects: `src/middleware.ts`, all tRPC routers, every API route handler

**Idle Session Timeout — Auth.js `maxAge`**
- Decision: `maxAge: 8 * 60 * 60` (8 hours) on the Auth.js session config. Frontend timer triggers a 15-minute warning dialog at 7h 45m of inactivity, then redirects on expiry per the UX spec.
- Affects: Auth.js config, client-side session timer component

---

### API & Communication Patterns

**External Scan Ingestion API — REST, URL-versioned**
- Decision: Standard Next.js route handlers at `src/app/api/v1/scans/route.ts`. Version in URL path (`/api/v1/`). Breaking changes require `/api/v2/`.
- Rationale: FR-022 requires versioning; the external mobile app must never be broken by routine updates. URL versioning is explicit and cacheable.
- Affects: `src/app/api/v1/` directory, OpenAPI spec, external mobile app contract

**External API Documentation — OpenAPI 3.x**
- Decision: OpenAPI 3.x YAML spec committed to repo at `docs/api/openapi.yaml`. Swagger UI served at `/api-docs` in development (not production).
- Rationale: Machine-readable contract for the external mobile app team. Low overhead at one versioned endpoint for MVP.
- Affects: `docs/api/openapi.yaml`, developer workflow on API changes

**Error Handling — RFC 7807 for external API, tRPC errors internally**
- Decision: External REST endpoints return RFC 7807 Problem Details (`type`, `title`, `status`, `detail`). tRPC uses its native `TRPCError` format for internal calls.
- Rationale: External consumers (mobile app, IoT devices) get a standard, parseable error format. Internal tRPC errors remain typesafe end-to-end.
- Affects: Ingestion API route handler, error middleware, external API documentation

**Rate Limiting — In-memory token bucket, keyed by API key**
- Decision: Token bucket rate limiter in Next.js middleware, keyed by the incoming API key hash. Limit: 60 requests/minute per key (2× the expected peak per NFR-006). In-memory store — single ECS container at MVP.
- Rationale: 30 submissions/min platform-wide peak does not justify Redis at MVP. Revisit if multi-container scaling is needed.
- Affects: Scan ingestion middleware, API key lifecycle

---

### Frontend Architecture

**Server State — tRPC + React Query (T3 default)**
- Decision: All server data fetching and mutations via tRPC procedures backed by React Query. No additional data fetching library.
- Rationale: Included in T3. End-to-end typesafe. React Query handles caching, revalidation, and optimistic updates.

**Client State — URL state + local React state only**
- Decision: No global client state library (no Zustand, no Redux). Filter params live in URL query strings (e.g. `?health=sick`). Annotation canvas state lives in `useState`/`useReducer` local to the Scan Viewer page.
- Rationale: The project has no cross-page shared client state that persists beyond navigation. URL state is the correct home for filters (shareable, bookmarkable, back-button aware — UX spec explicitly requires this).
- Affects: Cattle List filter implementation, Scan Viewer canvas state, Farm Switcher URL pattern

**Annotation Canvas — Native HTML5 Canvas API**
- Decision: React `useRef` on a `<canvas>` element. No third-party canvas library.
- Rationale: Only two shape primitives (circle, ellipse). PNG export is `canvas.toDataURL('image/png')`. Keyboard fallback implemented via position cursor + keyboard events on the canvas element. A library would add bundle weight for no gain.
- Affects: `src/components/scan-viewer/AnnotationCanvas.tsx`, export handler, accessibility implementation

**Routing — Next.js App Router with role-based layouts**
- Decision: Separate layout files per role (`app/(farmer)/layout.tsx`, `app/(vet)/layout.tsx`, `app/(admin)/layout.tsx`). Route groups enforce navigation shell separation per UX spec.
- Affects: `src/app/` directory structure, sidebar navigation components

---

### Infrastructure & Deployment

**CI/CD — GitHub Actions → ECR → ECS**
- Decision: GitHub Actions pipeline: build + type-check + test → build Docker image → push to AWS ECR → deploy to ECS Fargate service with rolling update.
- Affects: `.github/workflows/`, Dockerfile, ECS task definition

**Secrets — AWS Secrets Manager**
- Decision: All production secrets (DB password, Auth.js secret, SES credentials, S3 keys) stored in AWS Secrets Manager. Injected as environment variables into the ECS task definition at deploy time. `.env.local` for local development (not committed).
- Affects: ECS task definition, GitHub Actions deploy step, local dev setup docs

**Monitoring — CloudWatch + Sentry**
- Decision: CloudWatch for infrastructure metrics (ECS CPU/memory, RDS connections, ALB latency). Sentry Next.js SDK for application error tracking and performance monitoring (both server and client).
- Affects: `sentry.client.config.ts`, `sentry.server.config.ts`, ECS log group config

### Decision Impact Analysis

**Implementation Sequence (order matters):**
1. T3 project init + shadcn setup
2. Drizzle schema (all tables, `deleted_at`, `farm_id` denorm, `annotations` JSONB)
3. Auth.js database sessions + RBAC middleware
4. Role-based App Router layouts + route guards
5. Farm/user/cattle tRPC routers
6. Scan ingestion REST API + API key auth + rate limiting + OpenAPI spec
7. Annotation canvas component + pg-boss job setup
8. Health report flow + cattle health state machine
9. Notification system (in-app + SES email)
10. Dashboard aggregates + 6-month chart
11. AWS infrastructure (ECS, RDS, S3, CloudFront, SES, Secrets Manager)
12. GitHub Actions CI/CD pipeline

**Cross-Component Dependencies:**
- RBAC middleware must exist before any feature router is built
- Drizzle schema must be finalized before tRPC routers
- API key table must exist before scan ingestion API
- `annotations` JSONB column must exist before Scan Viewer
- pg-boss schema (auto-created) initializes on first app start — no manual migration needed
- Sentry DSN required before deploying to production

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

9 areas where agents could diverge and break cross-component compatibility: database naming convention, API JSON field casing, tRPC procedure naming, file/directory naming, test placement, date format, error handling approach, loading state pattern, form validation strategy.

---

### Naming Patterns

**Database Naming (Drizzle schema)**

| Element | Convention | Example |
|---|---|---|
| Table names | `snake_case`, plural | `scan_records`, `health_reports`, `api_keys` |
| Column names | `snake_case` | `farm_id`, `deleted_at`, `created_at` |
| Foreign keys | `{referenced_table_singular}_id` | `cattle_id`, `farm_id`, `vet_id` |
| Indexes | `{table}_{column(s)}_idx` | `scan_records_farm_id_idx` |
| Enum types | `snake_case` | `user_role`, `severity_level`, `health_status` |

All Drizzle column definitions use `.notNull()` unless the field is explicitly nullable by design. Every table includes `id` (UUID, default `gen_random_uuid()`), `created_at`, and `updated_at`. Every soft-deletable table includes `deleted_at`.

**API Naming (REST external endpoints)**

| Element | Convention | Example |
|---|---|---|
| Path segments | `kebab-case`, plural resources | `/api/v1/scan-submissions` |
| Route parameters | `:id` form (Next.js `[id]`) | `/api/v1/scan-submissions/[id]` |
| Query parameters | `snake_case` | `?farm_id=123&status=pending` |
| Request headers | Standard HTTP + `X-` prefix for custom | `X-API-Key`, `Content-Type` |

**Code Naming (TypeScript)**

| Element | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `AnnotationCanvas`, `SickStatCard` |
| Component files | `PascalCase.tsx` | `AnnotationCanvas.tsx` |
| Page files | `page.tsx` (Next.js App Router) | `app/(farmer)/dashboard/page.tsx` |
| Utility functions | `camelCase` verbs | `formatScanDate`, `hashApiKey` |
| tRPC routers | `camelCase` domain name | `cattleRouter`, `scanRouter` |
| tRPC procedures | `camelCase` verb+noun | `getById`, `listByFarm`, `create`, `markRecovered` |
| Drizzle table exports | `camelCase`, plural | `scanRecords`, `healthReports`, `apiKeys` |
| Zod schemas | `PascalCase` + `Schema` suffix | `CreateHealthReportSchema`, `ScanSubmissionSchema` |
| pg-boss job names | `kebab-case` | `notify-farmer`, `vet-morning-digest` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `AUTH_SECRET`, `S3_BUCKET_NAME` |

---

### Structure Patterns

**Project Organization**

```
src/
  app/
    (farmer)/          # Route group — Farmer shell
      layout.tsx       # Farmer sidebar + nav
      dashboard/
        page.tsx
      cattle/
        page.tsx
        [id]/
          page.tsx
    (vet)/             # Route group — Vet shell
      layout.tsx
      scan-queue/
        page.tsx
      scan-viewer/
        [scanId]/
          page.tsx
    (admin)/           # Route group — Super-Admin shell
      layout.tsx
    api/
      v1/
        scan-submissions/
          route.ts     # External REST — scan ingestion
      auth/            # Auth.js handler
    login/
      page.tsx

  server/
    api/
      routers/         # One file per domain
        cattle.ts
        scans.ts
        health-reports.ts
        farms.ts
        users.ts
        api-keys.ts
      root.ts          # AppRouter merge
      trpc.ts          # Context + procedure helpers
    db/
      schema.ts        # Single Drizzle schema file
      index.ts         # DB connection singleton
    auth/
      config.ts        # Auth.js config
      middleware.ts    # Role + farm scope helpers
    jobs/
      index.ts         # pg-boss instance + worker start
      handlers/
        notify-farmer.ts
        vet-morning-digest.ts
    services/          # Business logic called by routers
      annotation-export.ts
      email.ts

  components/
    ui/                # shadcn/ui generated components (do not edit)
    brand/             # Brand-layer overrides (DESIGN.md components)
      HealthBadge.tsx
      SickStatCard.tsx
      AnnotationToolbar.tsx
    shared/            # Shared across roles
    farmer/            # Farmer-only components
    vet/               # Vet-only components
    admin/             # Admin-only components

  lib/
    utils.ts           # shadcn cn() utility + shared helpers
    constants.ts       # App-wide constants (role names, status values)
    validations/       # Shared Zod schemas
```

**Test Placement**

Co-located tests alongside the file they test:
```
server/api/routers/cattle.ts
server/api/routers/cattle.test.ts

components/vet/AnnotationCanvas.tsx
components/vet/AnnotationCanvas.test.tsx
```

Integration and E2E tests in `tests/` at project root.

---

### Format Patterns

**tRPC Responses — Direct return, no wrapper**

Procedures return data directly. React Query on the client wraps it in `{ data, isLoading, error }`.

```typescript
// ✅ Correct
export const cattleRouter = createTRPCRouter({
  listByFarm: protectedProcedure
    .input(z.object({ farmId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(cattle)
        .where(and(eq(cattle.farmId, input.farmId), isNull(cattle.deletedAt)));
    }),
});

// ❌ Wrong — don't wrap in { data: ..., success: true }
```

**External REST API Responses**

Success: direct JSON body matching the OpenAPI schema (no envelope wrapper).
Error: RFC 7807 Problem Details:
```json
{
  "type": "/errors/unrecognized-cattle",
  "title": "Cattle not found",
  "status": 422,
  "detail": "No cattle with tag ID 'EAR-0042' exists on this farm."
}
```

**Date/Time Format — ISO 8601 strings throughout**

All dates stored as `TIMESTAMP WITH TIME ZONE` in PostgreSQL. All JSON representations as ISO 8601 strings (`"2026-06-14T07:00:00Z"`). Never Unix timestamps in API responses. The UI formats dates for display using `Intl.DateTimeFormat` — no date formatting library.

**JSON Field Naming — camelCase in tRPC, snake_case in external REST**

tRPC uses TypeScript objects (camelCase naturally). External REST API request/response bodies use `snake_case` to match the IoT/device ecosystem convention. OpenAPI spec documents the `snake_case` contract.

---

### Communication Patterns

**pg-boss Job Payloads**

Each job handler file exports a typed payload interface and the handler function:

```typescript
// jobs/handlers/notify-farmer.ts
export interface NotifyFarmerPayload {
  farmerId: string;
  cattleId: string;
  healthReportId: string;
}

export async function handleNotifyFarmer(job: Job<NotifyFarmerPayload>) { ... }
```

Job names are kebab-case string constants defined in `lib/constants.ts`:
```typescript
export const JOB_NAMES = {
  NOTIFY_FARMER: 'notify-farmer',
  VET_MORNING_DIGEST: 'vet-morning-digest',
} as const;
```

**tRPC Error Throwing**

All tRPC procedures throw `TRPCError` — never raw `Error`:
```typescript
throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm access denied.' });
throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan record not found.' });
```

---

### Process Patterns

**RBAC in tRPC Procedures**

Every procedure that touches farm-scoped data uses a shared procedure builder defined in `server/api/trpc.ts`. Do not inline role checks.

```typescript
// ✅ Correct — uses shared procedure builder
export const scanRouter = createTRPCRouter({
  getById: vetProcedure
    .input(z.object({ scanId: z.string().uuid() }))
    .query(...)
});

// ❌ Wrong — manual role check inline
.query(async ({ ctx, input }) => {
  if (ctx.session.user.role !== 'vet') throw new TRPCError(...)
```

Procedure builder hierarchy:
- `publicProcedure` — unauthenticated (login page only)
- `protectedProcedure` — any authenticated user
- `farmerProcedure` — role === 'farmer', scopes to `ctx.session.user.farmId`
- `vetProcedure` — role === 'vet', scopes to assigned farm IDs
- `adminProcedure` — role === 'admin', no farm restriction

**Soft Delete — Always filter `deleted_at`**

Every query on a soft-deletable table must include `isNull(table.deletedAt)`. Never omit this filter.

```typescript
// ✅ Correct
.where(and(eq(cattle.farmId, farmId), isNull(cattle.deletedAt)))

// ❌ Wrong — missing soft delete filter
.where(eq(cattle.farmId, farmId))
```

**Loading States — shadcn Skeleton, not spinners**

All list surfaces use `shadcn Skeleton` blocks matching real row height during cold load. Sidebars and top bars render immediately. Spinners are reserved for inline button actions only (submit, save).

**Form Validation — Zod on blur, server re-validates**

Client-side: validate on blur using the same Zod schema as the server (imported from `lib/validations/`). Show inline error below the field. Server always re-validates — client validation is UX only.

**Error Recovery in UI**

tRPC mutation errors surface as inline messages above the form (`role="alert"`). Toast is reserved for success confirmations only. Network errors during page-level data load show a full-page error state with a Retry button.

---

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `snake_case` for all database table and column names in Drizzle schema
- Include `isNull(table.deletedAt)` on every query against soft-deletable tables
- Use shared procedure builders (`farmerProcedure`, `vetProcedure`, `adminProcedure`) — never inline role checks
- Return data directly from tRPC procedures — no envelope wrappers
- Use ISO 8601 strings for all dates in API responses
- Define pg-boss job names from `JOB_NAMES` constants — never raw strings
- Use `TRPCError` for all tRPC errors — never raw `throw new Error(...)`
- Place component test files co-located alongside the component
- Use URL query params (not state or localStorage) for filterable list state

**Pattern Violations to Watch:**
- A `WHERE` clause on `cattle`, `scan_records`, or `health_reports` without `deletedAt` filter
- A tRPC procedure with an inline `ctx.session.user.role` check instead of a procedure builder
- An API response body wrapped in `{ data: ..., success: true }` format
- A date returned as a Unix timestamp instead of ISO 8601

---

## Supplementary Decisions (2026-06-14 — post-readiness review)

### Annotation Persistence — Explicit Save

- **Decision:** Annotations are persisted to the database via an explicit "Save Annotations" action, independently of health report submission. The `scans.saveAnnotations` tRPC `vetProcedure` writes the annotation array to `scan_records.annotations JSONB`. Saving with no shapes sets the column to `NULL`.
- **Rationale:** The 8-hour session idle timeout creates real risk of annotation loss under the local-only model. A vet annotating a complex thermal scan for 30+ minutes would lose all work on session expiry or accidental navigation. The explicit save eliminates this risk at the cost of one additional button press.
- **Implications for implementation:**
  - `scan_records.annotations` may be non-NULL on records that have no associated `health_reports` row — this is a valid and expected database state.
  - The Scan Viewer initialises the canvas with pre-existing annotations from `scan_records.annotations` if present (already handled in Story 5.2 AC).
  - Re-saving overwrites the entire JSONB column — no version history is stored (FR-028).
  - Navigating away from the Scan Viewer with *unsaved* shapes (shapes drawn since the last save) triggers a browser-native "Leave page?" prompt. Shapes already saved to DB are safe.
  - A "Save Annotations" success toast appears for 3 seconds: "Annotations saved."
- **Affects:** Story 5.4, `scan_records` schema, `scans` tRPC router, EXPERIENCE.md (update: annotations are not local-only).

---

### In-App Farmer Notification Delivery — Poll-Triggered Toast

- **Decision:** The `NotificationBell` component polls `notifications.getUnreadCount` every 30 seconds (GAP-002). On each poll response, the client compares the returned count against the previously cached count. If the count has *increased*, a toast is fired immediately: "[Cattle name] — [Sickness] ([Severity]). View Report." (8-second persist, manually dismissible). The bell badge also updates to reflect the new count.
- **Rationale:** EXPERIENCE.md specifies a farmer toast on health report submission. The architecture explicitly excludes real-time streaming (no WebSockets, no SSE). Poll-triggered toast delivers the farmer's notification within a maximum of 30 seconds — imperceptible for a health alert use case — with zero architectural change. SSE would add a persistent connection pattern inconsistent with the stateless ECS deployment model at MVP scale.
- **Implications for implementation:**
  - `NotificationBell` stores the previous unread count in `useRef` between polls. On each successful poll response, if `newCount > prevCount`, fire the toast and update the ref.
  - Toast content requires knowing *which* notification is new. Two options: (a) fire a generic "You have a new health alert. Open notifications." toast, or (b) fetch the latest notification detail on count increase. **Option (a) is the MVP implementation** — simpler, no extra round-trip.
  - The `notifications.getUnreadCount` tRPC query returns an integer. The `notifications.list` query (opened when the bell is clicked) provides the full content.
  - No WebSockets, SSE, or long-polling are introduced. The 30-second polling interval is fixed at MVP; it may be made configurable post-launch if farmer feedback demands tighter latency.
- **Affects:** Story 6.3 (`NotificationBell` implementation), EXPERIENCE.md (update: toast fires within 30s via poll detection, not on real-time push).

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
farm-tracking/
├── .env.example                     # All required env vars documented (no values)
├── .env.local                       # Local dev secrets — never committed
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Type-check + lint + test on PR
│       └── deploy.yml               # Build → ECR push → ECS deploy on main merge
├── Dockerfile
├── drizzle.config.ts                # drizzle-kit config (migrations output path, DB URL)
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── components.json                  # shadcn/ui config (color tokens from DESIGN.md)
├── sentry.client.config.ts
├── sentry.server.config.ts
│
├── docs/
│   └── api/
│       └── openapi.yaml             # OpenAPI 3.x spec for /api/v1/ (scan ingestion)
│
├── drizzle/
│   └── migrations/                  # Generated SQL migration files (committed)
│
├── tests/
│   ├── e2e/                         # Playwright E2E tests (key user flows)
│   │   ├── farmer-dashboard.spec.ts
│   │   ├── vet-scan-review.spec.ts
│   │   └── admin-onboarding.spec.ts
│   └── fixtures/
│       └── factories.ts             # Shared test data factories
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── middleware.ts                 # Next.js middleware — role-based route guards
    │
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx               # Root layout (fonts, Sentry, providers)
    │   │
    │   ├── login/
    │   │   └── page.tsx             # FR-001: email/password login
    │   │
    │   ├── (farmer)/                # Route group — Farmer shell
    │   │   ├── layout.tsx           # Farmer sidebar nav + notification bell
    │   │   ├── dashboard/
    │   │   │   └── page.tsx         # FR-036–038: herd stats + 6-month chart
    │   │   └── cattle/
    │   │       ├── page.tsx         # FR-014: cattle list (filterable by health status)
    │   │       └── [id]/
    │   │           ├── page.tsx     # FR-015: cattle profile + health history
    │   │           └── reports/
    │   │               └── [reportId]/
    │   │                   └── page.tsx  # FR-034: read-only health report view (farmer)
    │   │
    │   ├── (vet)/                   # Route group — Vet shell
    │   │   ├── layout.tsx           # Vet sidebar nav + farm switcher
    │   │   ├── scan-queue/
    │   │   │   └── page.tsx         # FR-024: scan queue (all farms or scoped)
    │   │   └── scan-viewer/
    │   │       └── [scanId]/
    │   │           └── page.tsx     # FR-025–029: thermal image + annotation canvas
    │   │                            # FR-030–033: health report form panel
    │   │
    │   ├── (admin)/                 # Route group — Super-Admin shell
    │   │   ├── layout.tsx           # Admin sidebar nav
    │   │   ├── overview/
    │   │   │   └── page.tsx         # FR-012: platform overview — all farms + stats
    │   │   ├── farms/
    │   │   │   ├── page.tsx         # FR-006: farm list
    │   │   │   └── [id]/
    │   │   │       └── page.tsx     # FR-007–010: farm detail + vet assignments
    │   │   ├── users/
    │   │   │   └── page.tsx         # FR-007–008: create farmer/vet accounts
    │   │   └── api-keys/
    │   │       └── page.tsx         # FR-019, NFR-004: issue/revoke API keys
    │   │
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts     # Auth.js handler
    │       ├── trpc/
    │       │   └── [trpc]/
    │       │       └── route.ts     # tRPC HTTP handler
    │       └── v1/
    │           └── scan-submissions/
    │               └── route.ts     # FR-018–023: external scan ingestion REST API
    │
    ├── server/
    │   ├── auth/
    │   │   └── config.ts            # Auth.js config — credentials provider, Drizzle adapter, maxAge 8h
    │   │
    │   ├── db/
    │   │   ├── index.ts             # Drizzle connection singleton
    │   │   └── schema.ts            # All table definitions (see schema boundary below)
    │   │
    │   ├── api/
    │   │   ├── trpc.ts              # createTRPCContext + procedure builders
    │   │   │                        # (publicProcedure, protectedProcedure,
    │   │   │                        #  farmerProcedure, vetProcedure, adminProcedure)
    │   │   ├── root.ts              # AppRouter — merges all routers
    │   │   └── routers/
    │   │       ├── auth.ts          # Password reset, session info
    │   │       ├── farms.ts         # FR-006–012: CRUD farms, vet assignments
    │   │       ├── users.ts         # FR-007–008: create/deactivate farmer+vet accounts
    │   │       ├── cattle.ts        # FR-013–017: add cattle, list, profile
    │   │       ├── scans.ts         # FR-024–029: list scans, get scan, save annotations
    │   │       ├── health-reports.ts # FR-030–035: create report, list by farm/cattle
    │   │       ├── api-keys.ts      # FR-019: issue/revoke API keys
    │   │       ├── dashboard.ts     # FR-036–038: aggregate stats, 6-month trend
    │   │       └── notifications.ts # FR-039: list in-app notifications, mark read
    │   │
    │   ├── jobs/
    │   │   ├── index.ts             # pg-boss instance + worker registration + cron setup
    │   │   └── handlers/
    │   │       ├── notify-farmer.ts # FR-039–040: triggered on health report submit
    │   │       └── vet-morning-digest.ts # FR-041–043: cron 07:00 per vet timezone
    │   │
    │   └── services/
    │       ├── email.ts             # AWS SES wrapper (farmer alerts + vet digest)
    │       ├── storage.ts           # AWS S3 wrapper (upload, presigned URL generation)
    │       ├── annotation-export.ts # FR-029: composite thermal + annotation → PNG
    │       └── api-key.ts           # Key generation, SHA-256 hashing
    │
    ├── components/
    │   ├── ui/                      # shadcn/ui generated — DO NOT EDIT MANUALLY
    │   │   └── ... (button, card, sheet, alert-dialog, skeleton, etc.)
    │   │
    │   ├── brand/                   # DESIGN.md brand-layer components only
    │   │   ├── HealthBadge.tsx      # health-badge-sick / health-badge-healthy
    │   │   ├── SickStatCard.tsx     # sick-stat-card (amber metric color)
    │   │   ├── StatCard.tsx         # base stat-card
    │   │   └── AnnotationToolbar.tsx # floating canvas toolbar
    │   │
    │   ├── shared/                  # Cross-role components
    │   │   ├── HealthReportView.tsx  # FR-034–035: read-only report (farmer + vet)
    │   │   ├── SessionTimeoutWarning.tsx # 15-min idle warning dialog
    │   │   └── ErrorState.tsx       # Full-page error + retry
    │   │
    │   ├── farmer/
    │   │   ├── FarmerSidebar.tsx
    │   │   ├── NotificationBell.tsx  # FR-039: bell icon + unread badge
    │   │   ├── NotificationPanel.tsx # FR-039–040: slide-in sheet, mark-read on open
    │   │   ├── DashboardStats.tsx    # FR-036: 4-stat card grid
    │   │   ├── ScanTrendChart.tsx    # FR-036: 6-month bar chart
    │   │   ├── CattleList.tsx        # FR-014: table + health filter chip + URL state
    │   │   └── CattleProfile.tsx     # FR-015: profile header + scan/report history
    │   │
    │   ├── vet/
    │   │   ├── VetSidebar.tsx
    │   │   ├── FarmSwitcher.tsx      # Dropdown — All Farms or specific assigned farm
    │   │   ├── ScanQueue.tsx         # FR-024: card list, pending/reviewed tabs
    │   │   ├── ScanCard.tsx          # Individual scan card with status chip
    │   │   ├── ScanViewer.tsx        # FR-025: layout — canvas panel + report panel
    │   │   ├── AnnotationCanvas.tsx  # FR-026–029: HTML5 canvas draw/undo/export
    │   │   └── HealthReportForm.tsx  # FR-030–033: report form (slide-in panel)
    │   │
    │   └── admin/
    │       ├── AdminSidebar.tsx
    │       ├── PlatformOverview.tsx   # FR-012: farm grid + aggregate stats
    │       ├── FarmDetail.tsx         # FR-006–010: farm mgmt + vet assignment UI
    │       ├── UserManagement.tsx     # FR-007–008: create accounts, list users
    │       └── ApiKeyManagement.tsx   # FR-019: key list, issue new, revoke
    │
    └── lib/
        ├── utils.ts                  # shadcn cn() + general helpers
        ├── constants.ts              # JOB_NAMES, ROLES, HEALTH_STATUS, SEVERITY
        ├── date.ts                   # Intl.DateTimeFormat wrappers (no date library)
        └── validations/
            ├── scan-submission.ts    # ScanSubmissionSchema (external API)
            ├── health-report.ts      # CreateHealthReportSchema
            ├── cattle.ts             # CreateCattleSchema
            ├── user.ts               # CreateUserSchema
            └── farm.ts               # CreateFarmSchema
```

---

### Database Schema Boundaries

```
users                ← id, email, password_hash, role ENUM, farm_id FK (farmers only),
                       created_at, updated_at, deleted_at
farms                ← id, name, is_active, created_at, updated_at, deleted_at
vet_farm_assignments ← id, vet_id FK, farm_id FK, assigned_at
cattle               ← id, farm_id FK, tag_id, name, breed, date_of_birth, sex,
                       health_status ENUM, created_at, updated_at, deleted_at
scan_records         ← id, cattle_id FK, farm_id FK (denorm), thermal_image_s3_key,
                       environment_data JSONB, annotations JSONB, source_identifier,
                       api_key_id FK, reviewed BOOLEAN,
                       created_at, updated_at, deleted_at
health_reports       ← id, scan_record_id FK, cattle_id FK, farm_id FK (denorm),
                       vet_id FK, sickness_name, severity ENUM, treatment,
                       recovery_status ENUM, created_at
                       (no updated_at, no deleted_at — append-only / immutable)
api_keys             ← id, label, source_type, key_hash, last_used_at, revoked_at, created_at
notifications        ← id, farmer_id FK, health_report_id FK, read_at, created_at
sessions             ← Auth.js managed (Drizzle adapter)
accounts             ← Auth.js managed (Drizzle adapter)
```

---

### Architectural Boundaries

**API Boundaries**

| Boundary | Direction | Auth | Location |
|---|---|---|---|
| Web app → tRPC | Internal | Session cookie | `app/api/trpc/[trpc]/route.ts` |
| IoT/mobile → scan ingestion | External inbound | `X-API-Key` header | `app/api/v1/scan-submissions/route.ts` |
| Next.js server → S3 | Outbound | AWS SDK (ECS IAM role) | `server/services/storage.ts` |
| Next.js server → SES | Outbound | AWS SDK (ECS IAM role) | `server/services/email.ts` |
| pg-boss → PostgreSQL | Internal | DB connection string | `server/jobs/index.ts` |

**Component Boundaries**

- `components/ui/` — generated by shadcn CLI, never edited manually; add overrides in `components/brand/`
- `components/farmer/`, `components/vet/`, `components/admin/` — role-scoped; never import across role directories
- `components/shared/` — the only cross-role component directory
- `components/brand/` — brand-layer overrides only; references DESIGN.md tokens

**Service Boundaries**

- `server/services/` — side-effect logic (S3, SES, image export); called by tRPC routers and job handlers
- `server/jobs/handlers/` — pg-boss handlers call services and Drizzle directly; never call tRPC
- tRPC routers call services and Drizzle; never call other routers directly

---

### Requirements to Structure Mapping

| FR Category | Primary location |
|---|---|
| Auth & Account Management (FR-001–005) | `server/auth/config.ts`, `app/login/`, `src/middleware.ts` |
| Farm & Assignment Management (FR-006–012) | `server/api/routers/farms.ts`, `app/(admin)/farms/`, `app/(admin)/users/` |
| Cattle Management (FR-013–017) | `server/api/routers/cattle.ts`, `app/(farmer)/cattle/`, `components/farmer/CattleList.tsx` |
| Scan Ingestion API (FR-018–023) | `app/api/v1/scan-submissions/route.ts`, `server/services/storage.ts`, `docs/api/openapi.yaml` |
| Scan Viewer & Annotation (FR-024–029) | `app/(vet)/scan-viewer/`, `components/vet/AnnotationCanvas.tsx`, `server/services/annotation-export.ts` |
| Health Reports (FR-030–035) | `server/api/routers/health-reports.ts`, `components/vet/HealthReportForm.tsx`, `components/shared/HealthReportView.tsx` |
| Farmer Dashboard (FR-036–038) | `app/(farmer)/dashboard/`, `server/api/routers/dashboard.ts`, `components/farmer/ScanTrendChart.tsx` |
| Alerts & Notifications (FR-039–043) | `server/jobs/handlers/`, `server/services/email.ts`, `components/farmer/NotificationPanel.tsx` |

---

### Data Flow

**Scan Ingestion Flow:**
```
IoT/mobile → POST /api/v1/scan-submissions (X-API-Key auth)
  → validate cattle exists on keyed farm
  → upload thermal image → S3
  → INSERT scan_records (image S3 key, environment_data JSONB, annotations: null)
  → return 200 + scan_id
```

**Vet Review & Report Flow:**
```
Vet browser → tRPC scans.listByFarm (vetProcedure)
  → presigned CloudFront URL for thermal image
  → canvas renders image + annotation overlay
  → tRPC scans.saveAnnotations → UPDATE scan_records.annotations JSONB
  → tRPC health-reports.create
    → INSERT health_reports
    → UPDATE cattle.health_status
    → INSERT notifications (in-app)
    → pg-boss.send('notify-farmer', { farmerId, cattleId, healthReportId })
  → pg-boss worker → SES email to farmer
```

**Daily Vet Digest Flow:**
```
pg-boss cron (07:00 per vet timezone, configured by admin)
  → query: vets with assigned farms
  → per vet: COUNT(pending scans) + COUNT(open sick cattle)
  → if count > 0: SES digest email
  → if count = 0: suppress (FR-043)
```

---

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Next.js 16.x App Router + T3 stack (tRPC v11, Auth.js v5, Drizzle) are actively co-maintained. shadcn/ui CLI v4 supports Next.js App Router natively. pg-boss v12 is Postgres-native with no Redis dependency. AWS SDK v3 integrates cleanly with the Next.js Node.js runtime on ECS Fargate.

**Pattern Consistency:** Naming conventions (snake_case DB, camelCase TS, kebab-case routes), the soft-delete filter pattern, procedure builder hierarchy, and tRPC direct-return format are all internally consistent and aligned with the T3 conventions agents will find in the scaffold.

**Structure Alignment:** The App Router route group layout (`(farmer)`, `(vet)`, `(admin)`) directly implements the role-shell separation specified in the UX EXPERIENCE.md. Server code is fully separated from client components. Service layer boundaries prevent circular dependencies.

---

### Requirements Coverage Validation

**Functional Requirements (43/43 covered):**

All 8 FR categories are architecturally supported:
- FR-001–005 (Auth): Auth.js v5 credentials provider, database sessions, SES for password reset
- FR-006–012 (Farm/Admin): `adminProcedure`, farms + vet_farm_assignments tables, admin route group
- FR-013–017 (Cattle): `farmerProcedure` with create-only access, cattle table + health_status enum
- FR-018–023 (Scan API): `/api/v1/scan-submissions`, API key middleware, S3, OpenAPI spec
- FR-024–029 (Scan Viewer): HTML5 Canvas annotation, JSONB storage, CloudFront delivery, PNG export
- FR-030–035 (Health Reports): Append-only health_reports table, health status state machine on submit
- FR-036–038 (Dashboard): Denormalized farm_id for fast aggregates, URL state for sick filter drill-down
- FR-039–043 (Notifications): pg-boss for farmer alerts + vet digest, SES, in-app notifications table

**Non-Functional Requirements (13/13 covered):**
- NFR-001–005 (RBAC): Two-layer enforcement (Next.js middleware + procedure builders)
- NFR-006–007 (API): Stateless route handler + in-memory rate limit; URL-versioned OpenAPI spec
- NFR-008–010 (Data): S3 for images, soft-delete pattern, JSONB for environment data
- NFR-011 (Dashboard <3s): Denormalized farm_id avoids join chains on aggregate queries
- NFR-012 (Scan viewer <5s): CloudFront presigned URL delivery for thermal images
- NFR-013 (API <2s): Async/stateless route handler, no blocking post-ingest processing

---

### Gap Analysis Results

**Important Gaps (2 — addressed):**

**GAP-001: Vet timezone field missing from schema**
- Impact: `vet-morning-digest` job cannot send at 07:00 local time without a stored timezone preference
- Resolution: Add `digest_timezone VARCHAR(64) DEFAULT 'UTC'` to `users` table (IANA format). Super-admin sets it on vet account creation. pg-boss cron uses stored timezone to compute correct UTC fire time.
- Affects: `server/db/schema.ts` (users table), `server/jobs/handlers/vet-morning-digest.ts`, admin User Management UI

**GAP-002: In-app notification delivery strategy unspecified**
- Impact: UX spec describes a toast appearing on the farmer's open browser when a vet submits a report — without a delivery mechanism this cannot happen
- Resolution: **30-second polling** via tRPC `notifications.getUnreadCount`. `NotificationBell` polls on `setInterval`. When returned count exceeds locally stored previous count, toast fires and bell badge updates. Notifications marked read when panel opens.
- Affects: `components/farmer/NotificationBell.tsx`, `server/api/routers/notifications.ts`

**Minor Gaps (noted, not blocking):**
- Presigned S3 URL TTL: Recommend 1-hour TTL; add `scans.refreshImageUrl` tRPC procedure if vet sessions regularly exceed 1 hour
- `playwright.config.ts` not listed in project tree — add to project root alongside `drizzle.config.ts`

---

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

---

### Architecture Readiness Assessment

**Overall Status: READY WITH MINOR GAPS**

All 16 checklist items confirmed. Two important gaps (GAP-001, GAP-002) are documented with resolutions — neither blocks the implementation sequence. Both are additive (a schema column and a polling interval) addressable in the first implementation story.

**Confidence Level: High**

**Key Strengths:**
- T3 starter eliminates auth and ORM boilerplate — implementation stories focus on domain logic from day one
- pg-boss on existing PostgreSQL avoids operational complexity of a second data store
- HTML5 Canvas for annotation avoids library bundle weight while satisfying all FR-026 requirements
- URL state for filters makes farmer list shareable and browser-back-safe per UX spec
- Append-only `health_reports` table enforces immutability at schema level — no application code needed to prevent edits

**Areas for Future Enhancement:**
- Multi-container ECS task (separate pg-boss worker) if job volume grows beyond single-container limits
- Redis-backed rate limiting if platform scales to multiple ECS containers
- SSE or WebSocket notification delivery if 30-second polling latency proves unacceptable
- S3 presigned URL refresh mechanism if vet sessions routinely exceed 1 hour in scan viewer

---

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented — do not introduce alternative patterns
- Use shared procedure builders (`farmerProcedure`, `vetProcedure`, `adminProcedure`) for every tRPC procedure touching scoped data
- Every query on `cattle`, `scan_records`, or `health_reports` must include `isNull(table.deletedAt)`
- `health_reports` has no `deleted_at` and no update path by design — enforce this at the router level
- Add `digest_timezone` to users schema before running first migration (GAP-001)
- Implement 30-second polling in `NotificationBell` for in-app notification delivery (GAP-002)
- Refer to this document for all architectural questions before making independent decisions

**First Implementation Priority:**
```bash
npm create t3-app@latest farm-tracking
# Select: TypeScript ✅ | Tailwind ✅ | tRPC ✅ | Auth.js ✅ | Drizzle ✅ | DB: postgres

npx shadcn@latest init
```
