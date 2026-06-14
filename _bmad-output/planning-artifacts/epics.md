---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-06-14'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-farm-tracking-2026-06-14/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-farm-tracking-2026-06-14/EXPERIENCE.md
---

# Farm Tracking - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Farm Tracking, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-001: All users authenticate via email and password.
FR-002: Super-admin creates all user accounts (farmer and vet). A credential set is delivered to the new user upon account creation.
FR-003: Password reset is available via email link.
FR-004: Sessions expire after a configurable idle timeout (default 8 hours).
FR-005: Each user belongs to exactly one role; role cannot be self-changed.
FR-006: Super-admin can create, view, edit, and deactivate farms. Deactivating a farm blocks new scan ingestion and hides the farm from non-admin users; existing records are preserved.
FR-007: Super-admin can create farmer accounts and associate each farmer to exactly one farm.
FR-008: Super-admin can create vet accounts.
FR-009: Super-admin can assign one or more vets to a farm; a vet may be assigned to multiple farms simultaneously.
FR-010: Super-admin can remove a vet's assignment from a farm.
FR-011: Super-admin has read and write access to all farms, cattle, scans, and health reports across the platform.
FR-012: Super-admin has a platform overview listing all farms with key stats: cattle count, assigned vets, and date of last scan.
FR-013: Farmers can add new cattle to their farm. Minimum record fields: tag ID, name, breed, date of birth, sex.
FR-014: Farmers can view a list of all cattle in their farm with each animal's current health status (healthy / sick).
FR-015: Farmers can view an individual cattle profile showing metadata, current health status, and a chronological history of scan records and health reports.
FR-016: A cattle's health status is set to "sick" when a vet creates a health report marking it as sick. Status returns to "healthy" only when a subsequent health report marks it as recovered.
FR-017: Farmers cannot edit or delete cattle records once created.
FR-018: The platform exposes a REST API endpoint that accepts scan submissions containing: cattle identifier, thermal scan image, environment data (temperature and humidity minimum), and a source identifier.
FR-019: API callers authenticate via API key (per-device / per-source keys issued and managed by super-admin).
FR-020: A successful submission returns HTTP 200 with a generated scan ID. Failed submissions return structured error responses.
FR-021: Submissions referencing an unrecognized cattle identifier are rejected with HTTP 422; no partial record is stored.
FR-022: The API spec is versioned. Breaking changes require a version increment. The external vet mobile app is an active consumer.
FR-023: The system stores the scan image and environment data together as a single scan record linked to the cattle.
FR-024: Vets can view a list of scan records across all cattle on their assigned farms, ordered by date descending.
FR-025: The scan viewer displays the thermal image alongside the cattle's previous health reports and full scan record history in chronological order.
FR-026: Vets can annotate a scan by drawing circles or ellipses on the thermal image. Minimum zero annotations; undo of last-drawn shape supported; partially drawn shapes can be saved.
FR-027: The system saves annotations as part of the scan record and surfaces them as the modified scan result in the resulting health report.
FR-028: A scan record has at most one active annotation set per vet session. Re-annotating overwrites the previous annotation.
FR-029: The annotated image (base thermal + annotation overlay) can be exported as a combined PNG file.
FR-030: A vet creates a health report from the scan viewer after reviewing the scan. Annotation is recommended but not enforced.
FR-031: A health report contains: cattle reference (auto), scan reference (auto), sickness name (required), severity (required), recommended treatment (optional), recovery status (required), vet name and timestamp (auto).
FR-032: Submitting a health report immediately updates the linked cattle's health status.
FR-033: Health reports are read-only once submitted.
FR-034: Farmers can view health reports for cattle in their farm (read-only).
FR-035: Vets can view all health reports across their assigned farms.
FR-036: The farmer's homepage displays: total cattle count, number of cattle currently sick, total scan records, monthly scan count trend for the last 6 calendar months.
FR-037: Dashboard data refreshes on page load. Real-time streaming is not required.
FR-038: The sick cattle count is a clickable link that navigates to the cattle list filtered to sick animals only.
FR-039: When a vet submits a health report, the farmer of the affected farm receives an alert via in-app notification and email.
FR-040: The farmer alert contains: cattle name/tag ID, sickness name, severity, and a direct link to the health report.
FR-041: Vets receive a daily morning digest at 07:00 local time (configurable by super-admin) summarizing: new scans pending review since last digest, and cattle with open sick health reports.
FR-042: The vet digest is delivered via email.
FR-043: If a vet has no pending activity, their digest is suppressed for that day.

### NonFunctional Requirements

NFR-001: Farmers are scoped strictly to their single assigned farm; they cannot view or access data from any other farm.
NFR-002: Vets can only access farms they are explicitly assigned to by a super-admin.
NFR-003: Super-admin has unrestricted platform-wide read and write access.
NFR-004: Scan ingestion API endpoints use API key authentication independent of web session; web sessions cannot call ingestion endpoints.
NFR-005: All role and farm scoping is enforced server-side. The client cannot escalate privileges.
NFR-006: The scan ingestion API must handle concurrent submissions without data loss or duplication. Up to 10 devices per farm, peak 30 submissions per minute across the platform.
NFR-007: The API spec is versioned and published. Breaking changes require a version bump; the external vet mobile app must not be broken by routine updates.
NFR-008: Thermal scan images are stored in durable object storage (AWS S3).
NFR-009: Cattle records, scan records, and health reports are soft-deleted only; hard deletion is not permitted. Super-admin can recover deactivated records.
NFR-010: Environment data is stored alongside each scan record and queryable per scan.
NFR-011: Farmer dashboard must load within 3 seconds on a standard broadband connection.
NFR-012: Scan viewer with thermal image and annotation canvas must be ready to accept user input within 5 seconds of page open.
NFR-013: Scan ingestion API must respond within 2 seconds for a successful submission under normal load.

### Additional Requirements

- **Project scaffold**: T3 Stack initialization (`npm create t3-app@latest` + `npx shadcn@latest init`) is the first implementation story before any feature work begins.
- **Drizzle schema first**: All database tables (users, farms, vet_farm_assignments, cattle, scan_records, health_reports, api_keys, notifications, sessions, accounts) must be defined and migrated before routers are built.
- **GAP-001 — Vet timezone**: `users` table requires `digest_timezone VARCHAR(64) DEFAULT 'UTC'` (IANA format) for scheduling the daily vet digest at local time. Super-admin sets this on vet creation.
- **GAP-002 — Notification polling**: `NotificationBell` component must poll `notifications.getUnreadCount` tRPC query every 30 seconds to detect new farmer alerts.
- **Auth sessions**: Auth.js v5 database sessions with `maxAge: 8 * 60 * 60`. Idle timeout enforced server-side.
- **AWS infrastructure**: ECS Fargate (Docker), RDS PostgreSQL (private VPC), S3 (thermal images), CloudFront (presigned URL delivery), SES (email), Secrets Manager (production secrets).
- **GitHub Actions CI/CD**: PR pipeline (type-check + lint + test); deploy pipeline (build → ECR → ECS rolling update) on main merge.
- **OpenAPI spec**: `docs/api/openapi.yaml` must be authored and maintained alongside the scan ingestion API. Version increments on breaking changes.
- **Rate limiting**: In-memory token-bucket on scan ingestion API, 60 req/min per API key.
- **Background jobs**: pg-boss v12 co-located in Next.js process. Two job types: `notify-farmer` (triggered) and `vet-morning-digest` (cron).
- **RFC 7807**: All external REST API errors return Problem Details format (`type`, `title`, `status`, `detail`).
- **RBAC two-layer**: Next.js middleware guards route groups; tRPC procedure builders (`farmerProcedure`, `vetProcedure`, `adminProcedure`) enforce data scoping on every query.
- **Soft-delete pattern**: Every query on cattle, scan_records, health_reports must include `isNull(table.deletedAt)`.
- **health_reports immutability**: Table is append-only — no `updated_at`, no `deleted_at`, no update procedure.
- **Sentry**: Error tracking configured for both client (`sentry.client.config.ts`) and server (`sentry.server.config.ts`).
- **API key security**: SHA-256 hash stored in DB; raw key shown once at creation only.

### UX Design Requirements

UX-DR1: Implement shadcn/ui brand token overrides in `components.json`: primary `#1E3A5F`, accent `#D97706`, background `#FAFAF8`, card `#FFFFFF`, muted `#F1F0EE`, muted-foreground `#6B6B6B`, border `#E2E1DF`. Suppress dark mode Tailwind variants at application level.
UX-DR2: Implement `HealthBadge` component — sick variant (amber `#D97706` bg, `#1A0E00` text, pill 9999px, 12px/600) and healthy variant (`#DCFCE7` bg, `#14532D` text, same pill shape). Used in cattle list rows, profile headers, and scan cards.
UX-DR3: Implement `StatCard` component (white card, 1px `#E2E1DF` border, 12px radius, 24px padding, 32px/600 metric, 14px muted-foreground label) and `SickStatCard` variant (identical except metric renders in `#D97706`).
UX-DR4: Implement `AnnotationToolbar` — semi-transparent primary navy overlay (`rgba(30,58,95,0.9)`), white icons, circle/ellipse/undo/clear buttons, `shadow-md`, `8px` radius. Active tool indicated by 20% white tint on button background.
UX-DR5: Implement role-based persistent sidebar at ≥1024px with `nav-item-active` state: `3px solid #1E3A5F` left border, `rgba(30,58,95,0.10)` background tint, `#1E3A5F` foreground, 600 weight. Inactive items use shadcn defaults.
UX-DR6: Sidebar collapses to icon-only rail (48px) at 768–1023px with hover tooltips. Collapses to hamburger Sheet trigger at <768px (full-width left Sheet with same nav items).
UX-DR7: Implement HTML5 Canvas annotation on scan viewer: circle tool (drag from center, radius = cursor distance), ellipse tool (drag from corner, natural dimensions), shape boundary clipping at canvas edge. Shapes rendered as translucent amber stroke-only outlines (no fill).
UX-DR8: Implement annotation keyboard fallback: `C`/`E` keys select circle/ellipse tool; arrow keys move 16px position cursor (Shift = 4px fine control); `Enter`/`Space` commits shape at cursor with default size; `Ctrl+Z`/`Cmd+Z` undoes. Screen reader announces canvas focus state and shape additions (`aria-live`).
UX-DR9: Implement 6-month scan trend bar chart — non-interactive v1, primary-color bars, zero-height 2px stub for months with no data, all 6 month labels always visible, horizontal scroll at sm breakpoint.
UX-DR10: Sick-count number on Dashboard renders as suppressed-style link (no visible underline, underline on hover) navigating to `/farmer/cattle?health=sick`. Cattle List renders with removable filter chip `Sick ×` when `?health=sick` param is present. Clearing chip removes param and shows all cattle.
UX-DR11: Implement vet farm switcher dropdown in sidebar — options: "All Farms" (aggregate) + one entry per assigned farm; selection scopes Scan Queue and Cattle List; URL updates to include farm ID; browser back/forward restores scope.
UX-DR12: Health report form: segmented control for severity (Mild/Moderate/Severe), two-state toggle for recovery status (Sick/Recovered), Submit button disabled until all required fields filled (label "Fill required fields" when disabled), inline field errors on blur, submit confirmation `AlertDialog` ("cannot be edited after submission").
UX-DR13: Notification bell in farmer top bar — amber dot badge with unread count (shows "9+" above 9); clicking opens right-side Sheet (380px at lg, full-width at sm); all items marked read on panel open; empty state "No notifications." centered.
UX-DR14: Session idle timeout warning — `AlertDialog` at 7h45m inactivity: "Your session will expire in 15 minutes. Stay logged in?" with Stay/Logout actions. On expiry, redirect to login with message "Your session expired. Log in again."
UX-DR15: All list surfaces (Cattle List, Scan Queue, Farms Overview, Platform Overview) use `shadcn Skeleton` blocks matching real row height during cold load. Sidebar and top bar render immediately. No page-level spinners.
UX-DR16: "Export Image" button below annotation canvas — composites base thermal image + annotation overlays as PNG download via `canvas.toDataURL('image/png')`; available before report submission; exports base image only if no annotations present.
UX-DR17: Sick-stat-card zero state — when sick count is 0, metric renders in `#14532D` (green) not amber; no pulse animation; card is still a link to filtered cattle list (destination will be empty).
UX-DR18: Report submission success flow — form panel replaced by read-only `HealthReportView`; success toast appears bottom-right for 5 seconds ("Report submitted. [Cattle name]'s status updated."); scan card status chip updates to `Reviewed`.
UX-DR19: WCAG 2.2 AA compliance — all text contrast ≥4.5:1; all interactive elements Tab-reachable and operable by Enter/Space; arrow key navigation in Cattle List rows and Scan Queue cards; focus rings use shadcn `ring` token (never suppressed); status colors always accompanied by text labels.
UX-DR20: Farm deactivation UI in admin — Platform Overview farm card shows `Deactivated` badge (muted background); Farm Detail shows top-of-page banner ("This farm is deactivated. Data is preserved. New scans are not accepted."); `Reactivate` button in Farm Detail header.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR-001–005 | Epic 1 | Auth, account creation, password reset, sessions, roles |
| FR-006–012 | Epic 2 | Farm CRUD, user creation, vet assignments, platform overview |
| FR-013–017 | Epic 3 | Add cattle, cattle list, cattle profile, health status display |
| FR-018–023 | Epic 4 | Scan ingestion REST API, API key auth, S3 storage |
| FR-024–035 | Epic 5 | Scan queue, viewer, annotation, health reports, read access |
| FR-036–043 | Epic 6 | Dashboard stats, trend chart, farmer alerts, vet digest |
| FR-019 | Epics 2+4 | API key admin UI (Epic 2) + API key auth middleware (Epic 4) |
| FR-016 | Epics 3+5 | Health status display (Epic 3) + state machine trigger (Epic 5) |

## Epic List

### Epic 1: Foundation & Authenticated Access
Developers initialize the T3 scaffold, define the complete Drizzle schema, configure Auth.js with database sessions and RBAC, and build the role-specific navigation shells. After this epic: all three roles can log in, reach their correct shell, and are scoped by RBAC. The authenticated product exists.
**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005
**UX covered:** UX-DR1 (brand tokens), UX-DR5, UX-DR6 (sidebar + responsive collapse), UX-DR14 (session timeout warning), UX-DR15 (skeleton loading states)
**NFRs covered:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005
**Architecture:** T3 scaffold, full Drizzle schema, Auth.js, two-layer RBAC, AWS infrastructure, GitHub Actions CI/CD, Sentry

### Epic 2: Platform Administration
Super-admin can create and manage farms, create farmer and vet accounts, assign vets to farms, and issue/revoke API keys. After this epic: the platform has real farms, users, and device credentials — all downstream epics have the data they need to operate.
**FRs covered:** FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-019 (API key admin UI)
**UX covered:** UX-DR20 (farm deactivation state)
**NFRs covered:** NFR-003, NFR-009

### Epic 3: Cattle Management
Farmers can add cattle to their farm, view their herd with health status badges, and view individual cattle profiles with history. After this epic: the herd is in the system and the farmer can see their animals' current health at a glance.
**FRs covered:** FR-013, FR-014, FR-015, FR-016, FR-017
**UX covered:** UX-DR2 (HealthBadge sick/healthy), UX-DR19 (WCAG cattle list)
**NFRs covered:** NFR-001, NFR-009

### Epic 4: Scan Ingestion API
IoT devices and mobile apps can submit thermal scans via API key authentication. Images are stored in S3, environment data is captured, and scans are linked to cattle. After this epic: the platform receives real scan data — vets have a queue to work from.
**FRs covered:** FR-018, FR-019 (API auth middleware), FR-020, FR-021, FR-022, FR-023
**Architecture:** `/api/v1/scan-submissions`, S3 upload, OpenAPI 3.x spec, rate limiting, RFC 7807 errors
**NFRs covered:** NFR-004, NFR-006, NFR-007, NFR-008, NFR-010, NFR-013

### Epic 5: Scan Review, Annotation & Health Reports
Vets can access their scan queue, open the thermal image viewer, draw circle/ellipse annotations on scans, export annotated images, and submit structured health reports. Farmers can view submitted health reports from their cattle profile. Health status transitions are driven by report submissions. After this epic: the full clinical workflow operates end-to-end.
**FRs covered:** FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035
**UX covered:** UX-DR4 (AnnotationToolbar), UX-DR7 (canvas drawing), UX-DR8 (keyboard fallback), UX-DR11 (farm switcher), UX-DR12 (report form), UX-DR16 (image export), UX-DR18 (success flow), UX-DR19 (WCAG canvas + forms)
**NFRs covered:** NFR-002, NFR-009, NFR-012

### Epic 6: Farmer Dashboard & Notifications
Farmers see their herd health at a glance — stats, 6-month scan trend, sick-cattle drill-down. In-app and email alerts notify farmers when a vet submits a health report. Vets receive a daily morning digest of pending activity. After this epic: the platform closes the feedback loop — the right people are informed at the right time.
**FRs covered:** FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043
**UX covered:** UX-DR3 (StatCard/SickStatCard), UX-DR9 (6-month chart), UX-DR10 (sick drill-down), UX-DR13 (notification bell + panel), UX-DR17 (zero-state for sick count)
**Architecture:** pg-boss `notify-farmer` + `vet-morning-digest` jobs, AWS SES, GAP-002 (30s polling)
**NFRs covered:** NFR-011

---

## Epic 1: Foundation & Authenticated Access

Developers initialize the T3 scaffold, define the complete Drizzle schema, configure Auth.js with database sessions and RBAC, and build the role-specific navigation shells. After this epic: all three roles can log in, reach their correct shell, and are scoped by RBAC. The authenticated product exists.

### Story 1.1: Project Scaffold & Brand Foundation

As a developer,
I want the T3 application initialized with Farm Tracking brand configuration and observability tooling,
So that all implementation work starts from a consistent, production-ready foundation.

**Acceptance Criteria:**

**Given** `npm create t3-app@latest farm-tracking` is run with TypeScript, Tailwind, tRPC, Auth.js, Drizzle, PostgreSQL selected
**When** `npm run dev` is started
**Then** the application runs locally, `npm run typecheck` passes, and `npm run lint` passes with no errors

**Given** `npx shadcn@latest init` is run and `components.json` is configured
**When** the Tailwind config is applied
**Then** the following brand tokens are active: `primary: #1E3A5F`, `accent: #D97706`, `background: #FAFAF8`, `card: #FFFFFF`, `muted: #F1F0EE`, `muted-foreground: #6B6B6B`, `border: #E2E1DF`; dark mode Tailwind variants are suppressed at the application level

**Given** Sentry is configured via `sentry.client.config.ts` and `sentry.server.config.ts`
**When** an unhandled error occurs in a server or client component
**Then** the error is captured in Sentry with a full stack trace; the DSN is loaded from an environment variable, not hardcoded

**Given** the project is initialized
**Then** the directory structure matches the architecture: `src/app/(farmer)/`, `src/app/(vet)/`, `src/app/(admin)/`, `src/server/api/routers/`, `src/server/db/`, `src/server/auth/`, `src/server/jobs/handlers/`, `src/server/services/`, `src/components/ui/`, `src/components/brand/`, `src/components/shared/`, `src/lib/constants.ts`, `src/lib/validations/`, `docs/api/`

### Story 1.2: AWS Infrastructure & CI/CD Pipeline

As a developer,
I want the AWS infrastructure provisioned and the CI/CD pipeline active,
So that the application can be deployed and PRs are validated automatically.

**Acceptance Criteria:**

**Given** the Dockerfile is present at the project root
**When** `docker build -t farm-tracking .` is run
**Then** the image builds successfully and `docker run -p 3000:3000` starts the Next.js server on port 3000

**Given** AWS infrastructure is set up
**Then** the following resources exist and are referenced in `.env.example`: ECS Fargate cluster + service, RDS PostgreSQL instance in a private VPC subnet, S3 bucket for thermal images, CloudFront distribution fronting S3, SES domain verification, AWS Secrets Manager secrets for `DATABASE_URL`, `AUTH_SECRET`, `S3_BUCKET_NAME`, `S3_REGION`, `SES_FROM_ADDRESS`, `SENTRY_DSN`

**Given** a PR is opened against `main`
**When** the GitHub Actions CI workflow (`ci.yml`) runs
**Then** `tsc --noEmit`, `eslint`, and unit tests all pass; a failed check blocks merge

**Given** a commit lands on `main`
**When** the GitHub Actions deploy workflow (`deploy.yml`) runs
**Then** a Docker image is built, pushed to AWS ECR, and the ECS Fargate service is updated with a rolling deployment; all secrets are sourced from GitHub Actions secrets — nothing is hardcoded

**Given** a developer clones the repo
**Then** `.env.example` lists every required environment variable with a description; `.env.local` is present in `.gitignore`

### Story 1.3: Database Schema & Email/Password Authentication

As a super-admin,
I want to log in with email and password and have my session persist securely,
So that I can access the platform and begin managing farms and users.

**Acceptance Criteria:**

**Given** the Drizzle schema is defined in `src/server/db/schema.ts` and migration is run
**Then** the `users` table exists with columns: `id UUID DEFAULT gen_random_uuid()`, `email VARCHAR UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `role ENUM('farmer','vet','admin') NOT NULL`, `farm_id UUID NULLABLE FK → farms(id)`, `digest_timezone VARCHAR(64) NOT NULL DEFAULT 'UTC'`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ NULLABLE`; `sessions` and `accounts` tables exist (Auth.js Drizzle adapter managed)

**Given** `npm run db:seed` is run
**When** the seed script executes
**Then** a super-admin account is created with email from `SEED_ADMIN_EMAIL` and a bcrypt-hashed password (min 12 rounds) from `SEED_ADMIN_PASSWORD`

**Given** an unauthenticated user visits any protected route
**When** Next.js middleware evaluates the request
**Then** the user is redirected to `/login`

**Given** the user is on `/login` and submits valid credentials
**When** Auth.js validates them
**Then** a database session is created with `maxAge: 28800` (8h); the user is redirected to their role's default route: `/admin/overview` for admin, `/farmer/dashboard` for farmer, `/vet/scan-queue` for vet

**Given** the user submits invalid credentials
**Then** an inline error "Invalid email or password." appears; no redirect occurs; the form remains usable

### Story 1.4: Role-Based Navigation Shells & Route Protection

As a logged-in user,
I want to see a navigation shell appropriate for my role and be blocked from accessing other roles' surfaces,
So that I work in a focused, secure environment.

**Acceptance Criteria:**

**Given** Next.js middleware is configured at `src/middleware.ts`
**When** a logged-in farmer requests `/vet/scan-queue` or `/admin/overview`
**Then** they are redirected to `/farmer/dashboard`; the same scoping applies for vet and admin roles

**Given** a farmer is logged in at ≥1024px viewport
**Then** a persistent 240px left sidebar is visible with nav items: Dashboard, Cattle; the active item has `border-left: 3px solid #1E3A5F`, `background: rgba(30,58,95,0.10)`, `color: #1E3A5F`, `font-weight: 600`; inactive items use shadcn defaults

**Given** a vet is logged in at ≥1024px viewport
**Then** the sidebar shows: Farms Overview, Scan Queue (with the same active state styling)

**Given** a super-admin is logged in at ≥1024px viewport
**Then** the sidebar shows: Platform Overview, Users, API Keys

**Given** any logged-in user at 768–1023px viewport
**Then** the sidebar collapses to a 48px icon-only rail; hovering an icon shows a tooltip with the nav label

**Given** any logged-in user at <768px viewport
**Then** the sidebar is hidden; a hamburger icon appears in the top bar; clicking it opens a full-width left Sheet containing the same nav items

**And** no navigation item from one role's shell is ever rendered for a different role's session

### Story 1.5: Password Reset & Session Idle Timeout

As a user,
I want to reset my password via email and receive a warning before my session expires,
So that I can recover account access and avoid losing unsaved work unexpectedly.

**Acceptance Criteria:**

**Given** the user clicks "Forgot password?" on `/login` and enters their email
**When** the form is submitted
**Then** if the email matches a user, an Auth.js password reset link is delivered via AWS SES from `SES_FROM_ADDRESS`; the UI always shows "If that email is registered, you'll receive a reset link." (no email enumeration)

**Given** the user clicks a valid, unexpired reset link
**When** they enter and submit a new password
**Then** the password is updated; they are redirected to `/login` with message "Password updated. Log in with your new password."

**Given** a logged-in user has been idle for 7 hours and 45 minutes with no navigation or interaction
**When** the client-side idle timer fires
**Then** a shadcn `AlertDialog` appears: "Your session will expire in 15 minutes. Stay logged in?" with buttons "Stay logged in" (resets the idle timer and extends the session) and "Log out" (immediate logout)

**Given** the AlertDialog appeared and the user took no action
**When** the 8-hour session expires
**Then** the user is redirected to `/login` with message "Your session expired. Log in again."

---

## Epic 2: Platform Administration

Super-admin can create and manage farms, create farmer and vet accounts, assign vets to farms, and issue/revoke API keys. After this epic: the platform has real farms, users, and device credentials — all downstream epics have the data they need to operate.

### Story 2.1: Farm Management & Platform Overview

As a super-admin,
I want to create, view, edit, and deactivate farms and see a platform-wide overview,
So that I can control which farms are active on the platform and monitor overall status.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `farms` table exists with: `id UUID DEFAULT gen_random_uuid()`, `name VARCHAR NOT NULL`, `is_active BOOLEAN NOT NULL DEFAULT true`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ NULLABLE`

**Given** a super-admin is on `/admin/overview`
**Then** a grid of farm cards is displayed; each card shows farm name, cattle count, assigned vet count, date of last scan, and active/deactivated status; `shadcn Skeleton` blocks render while data loads

**Given** a super-admin clicks "Add Farm"
**When** they enter a farm name and save
**Then** a new active farm appears on Platform Overview; the form is presented in a right-side Sheet

**Given** a super-admin edits a farm name
**When** they save
**Then** the farm name updates across all views

**Given** a super-admin deactivates a farm
**When** the action is confirmed
**Then** the farm card shows a `Deactivated` badge (muted background); the farm is hidden from non-admin users; existing records are preserved; new scan ingestion for that farm is rejected

**Given** a super-admin views a deactivated farm's detail page
**Then** a top-of-page banner reads "This farm is deactivated. Data is preserved. New scans are not accepted." and a "Reactivate" button is present in the Farm Detail header

### Story 2.2: Farmer Account Creation & Farm Assignment

As a super-admin,
I want to create farmer accounts and assign each farmer to exactly one farm,
So that farmers can log in and manage their assigned herd.

**Acceptance Criteria:**

**Given** a super-admin is on `/admin/users` and clicks "Add Farmer"
**Then** a right-side Sheet opens with fields: First name, Last name, Email, and an auto-generated temporary password shown once in a copy-to-clipboard field; role is pre-set to `farmer` and is not a form field

**Given** the super-admin completes the form and selects a farm and clicks "Create Account"
**When** the `users.createFarmer` tRPC procedure runs
**Then** a new user record is created with `role: 'farmer'`; the password is stored as a bcrypt hash (min 12 rounds); `farm_id` is set to the selected farm; the account is immediately active

**Given** the super-admin is on Farm Detail for a specific farm
**Then** an "Assigned Farmer" section shows the farmer's name, or "No farmer assigned" if empty

**Given** a farmer account is created and they visit `/login` with their credentials
**When** they authenticate
**Then** they are redirected to `/farmer/dashboard`

**And** a farmer can only be assigned to exactly one farm; the form prevents duplicate farm assignment

### Story 2.3: Vet Account Creation & Farm Assignments

As a super-admin,
I want to create vet accounts and assign vets to one or more farms,
So that vets can access the scan queues for their assigned farms.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `vet_farm_assignments` table exists with: `id UUID`, `vet_id UUID NOT NULL FK → users(id)`, `farm_id UUID NOT NULL FK → farms(id)`, `assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()`; a unique constraint prevents duplicate vet-farm pairs

**Given** a super-admin clicks "Add Vet" on `/admin/users`
**When** they complete the form (First name, Last name, Email, auto-generated password)
**Then** a new user record is created with `role: 'vet'`; no farm assignment is made at this step

**Given** a super-admin is on Farm Detail and clicks "Assign Vet"
**When** they select a vet from the dropdown of all vets not already assigned to that farm and save
**Then** a `vet_farm_assignments` record is created; the vet appears in the Farm Detail "Assigned Vets" list; the Platform Overview farm card updates its vet count

**Given** a super-admin clicks "Remove" next to an assigned vet on Farm Detail
**When** they confirm the inline confirmation ("Remove Dr. [Name] from this farm? They will lose access immediately.")
**Then** the `vet_farm_assignments` record is deleted; the vet no longer has access to that farm's data

### Story 2.4: API Key Management

As a super-admin,
I want to issue and revoke API keys for IoT devices and mobile app sources,
So that scan ingestion sources can authenticate with the platform.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `api_keys` table exists with: `id UUID`, `label VARCHAR NOT NULL`, `source_type ENUM('iot','mobile') NOT NULL`, `key_hash TEXT NOT NULL UNIQUE`, `last_used_at TIMESTAMPTZ NULLABLE`, `revoked_at TIMESTAMPTZ NULLABLE`, `created_at TIMESTAMPTZ NOT NULL`

**Given** a super-admin is on `/admin/api-keys`
**Then** a list of all API keys is displayed showing: label, source type, date created, last used, and status (active or revoked); revoked keys show a `Revoked` badge and remain visible for 30 days before being hidden; `shadcn Skeleton` blocks render while loading

**Given** a super-admin clicks "Issue New Key" and enters a label and source type
**When** they click Create
**Then** a cryptographically random API key is generated; `SHA-256(raw_key)` is stored in `api_keys.key_hash`; the raw key is shown once in a copy-to-clipboard field in the Sheet and is never retrievable again; the Sheet displays "Copy this key now — it won't be shown again."

**Given** a super-admin clicks "Revoke" on an active API key and confirms the inline confirmation
**Then** `revoked_at` is set to the current timestamp; the key is immediately rejected by the scan ingestion API; the key shows a `Revoked` badge in the list

---

## Epic 3: Cattle Management

Farmers can add cattle to their farm, view their herd with health status badges, and view individual cattle profiles with history. After this epic: the herd is in the system and the farmer can see their animals' current health at a glance.

### Story 3.1: Add Cattle to Farm

As a farmer,
I want to add new cattle to my farm with their core details,
So that my herd is registered on the platform and can be tracked.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `cattle` table exists with: `id UUID DEFAULT gen_random_uuid()`, `farm_id UUID NOT NULL FK → farms(id)`, `tag_id VARCHAR NOT NULL`, `name VARCHAR NOT NULL`, `breed VARCHAR NOT NULL`, `date_of_birth DATE NOT NULL`, `sex ENUM('male','female') NOT NULL`, `health_status ENUM('healthy','sick') NOT NULL DEFAULT 'healthy'`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ NULLABLE`; a unique constraint on `(farm_id, tag_id)` prevents duplicate tag IDs within a farm

**Given** a farmer is on `/farmer/cattle` and clicks "Add Cattle"
**Then** a form opens with required fields: Tag ID, Name, Breed, Date of Birth, Sex

**Given** the farmer completes the form and submits
**When** the `cattle.create` tRPC `farmerProcedure` runs
**Then** a new cattle record is created with `health_status: 'healthy'` and `farm_id` set automatically to `ctx.session.user.farmId`; the farmer cannot set `farm_id` directly

**Given** the farmer submits a tag ID that already exists on their farm
**Then** an inline error appears: "A cattle with this tag ID already exists on your farm."

**And** once created, the cattle record has no edit or delete controls for the farmer (FR-017)

### Story 3.2: Cattle List with Health Status

As a farmer,
I want to view a list of all cattle on my farm with their current health status,
So that I can quickly identify which animals need attention.

**Acceptance Criteria:**

**Given** a farmer navigates to `/farmer/cattle`
**Then** `shadcn Skeleton` blocks matching row height render immediately while the `cattle.listByFarm` tRPC query loads; once loaded, a table shows all cattle with columns: health badge, tag ID (monospace), name, breed (`#6B6B6B`)

**Given** the cattle list has loaded
**Then** each row displays a `HealthBadge`: sick variant (`#D97706` background, `#1A0E00` text, pill `9999px`, 12px/600) for `health_status: 'sick'`; healthy variant (`#DCFCE7` background, `#14532D` text) for `health_status: 'healthy'`

**Given** the farmer clicks a cattle row
**Then** they navigate to `/farmer/cattle/[id]`

**Given** the farmer navigates to `/farmer/cattle?health=sick`
**Then** the list filters to sick cattle only; a removable chip "Sick ×" appears at the top; clicking "×" clears the filter, removes the URL param, and shows all cattle

**Given** there are no cattle on the farm
**Then** a full-width empty state appears: "No cattle on this farm yet."

**And** the query filters `WHERE deleted_at IS NULL AND farm_id = ctx.session.user.farmId` (NFR-001, NFR-009); rows and row click targets are keyboard-navigable with arrow keys and Enter (UX-DR19)

### Story 3.3: Cattle Profile

As a farmer,
I want to view an individual cattle's profile with their metadata, current health status, and history,
So that I can understand the full health picture for a specific animal.

**Acceptance Criteria:**

**Given** a farmer navigates to `/farmer/cattle/[id]`
**Then** the page displays: tag ID (monospace), name, breed, date of birth, sex, current `HealthBadge`; if the cattle does not belong to the farmer's farm, a 404 is returned (NFR-001)

**Given** the cattle has no scan records or health reports yet
**Then** the chronological history section shows: "No scan records or health reports yet."

**Given** the cattle has health reports (populated in Epic 5)
**Then** the history lists reports newest-first, each showing: report date, vet name, sickness name, severity, recovery status, and a "View Report" link

**Given** `health_status` is `sick`
**Then** the badge uses the sick variant and the label reads "Sick"

**Given** `health_status` is `healthy`
**Then** the badge uses the healthy variant and the label reads "Healthy"

**And** no edit or delete controls appear for the farmer (FR-017); all data is scoped to the farmer's farm (NFR-001)

---

## Epic 4: Scan Ingestion API

IoT devices and the external vet mobile app can submit thermal scans via an authenticated REST API. The platform stores the image, environment data, and source metadata as a scan record linked to a cattle. After this epic: raw scan data reliably enters the system; vets have records to review in Epic 5.

### Story 4.1: Scan Ingestion Endpoint & OpenAPI Spec

As an IoT device or external mobile app,
I want to submit a thermal scan via REST API with my API key,
So that scan data lands in the platform without vet or farmer involvement.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `scan_records` table exists with: `id UUID DEFAULT gen_random_uuid()`, `cattle_id UUID NOT NULL FK → cattle(id)`, `farm_id UUID NOT NULL FK → farms(id)`, `s3_key VARCHAR NOT NULL` (path to thermal image in S3), `environment_data JSONB NOT NULL` (at minimum: `temperature`, `humidity`), `source_identifier VARCHAR NOT NULL`, `annotations JSONB NULLABLE DEFAULT NULL` (populated later by vets), `created_at TIMESTAMPTZ`, `deleted_at TIMESTAMPTZ NULLABLE`

**Given** a POST request arrives at `POST /api/v1/scan-submissions`
**Then** the Next.js Route Handler reads the `X-API-Key` header, SHA-256-hashes it, and looks up the matching `api_keys` row; if no match or `revoked_at IS NOT NULL`, the endpoint returns HTTP 401 with RFC 7807 Problem Details: `{"type":"...", "title":"Unauthorized", "status":401}`

**Given** a valid API key and a `cattle_id` that exists in the platform with `deleted_at IS NULL`
**Then** the handler: (1) uploads the thermal image binary to S3 under key `scans/{farm_id}/{uuid}.png`; (2) inserts a `scan_records` row with `s3_key`, `environment_data`, `source_identifier`, and `farm_id` (looked up from the cattle record); (3) returns HTTP 200 `{"scanId": "<uuid>"}`

**Given** the `cattle_id` in the request body references a cattle record where `deleted_at IS NOT NULL` or does not exist
**Then** the endpoint returns HTTP 422 with RFC 7807 body `{"title":"Unprocessable Entity","status":422,"detail":"Cattle not found or is inactive."}`; no S3 upload occurs and no partial row is stored (FR-021)

**Given** any unhandled server error occurs
**Then** the endpoint returns HTTP 500 with RFC 7807 format; the error is logged server-side; no stack trace is exposed to the caller

**And** an OpenAPI 3.x spec exists at `docs/api/openapi.yaml` documenting: the endpoint path and method, request body schema (cattle_id, thermal_image multipart field, environment_data object), response schemas for 200/401/422/500, and the API key security scheme (`X-API-Key` header); breaking changes to this contract require a version bump to `/api/v2/…` (FR-022, NFR-007)

### Story 4.2: Rate Limiting & API Robustness

As the platform,
I want to rate-limit scan ingestion per API key and handle concurrent submissions safely,
So that no single device can overwhelm the system and duplicate scans are not created.

**Acceptance Criteria:**

**Given** an API key makes more than 60 requests within any 60-second window
**Then** subsequent requests within that window receive HTTP 429 with RFC 7807 body `{"title":"Too Many Requests","status":429}` and a `Retry-After` header indicating seconds until the next token is available; valid requests within the limit are unaffected

**Given** the rate limiter is implemented
**Then** it uses an in-memory token-bucket (no Redis dependency): 60 tokens per key, refilled at 1 token/second, keyed by the hashed API key string; the bucket state is a module-level singleton per Next.js server process

**Given** two concurrent POST requests arrive for the same cattle and the same `source_identifier` within 500ms
**Then** both generate distinct `scan_records` rows with distinct `id` values; the handler does not deduplicate by `source_identifier` — idempotency is the caller's responsibility

**Given** a successful scan submission under normal load
**Then** the endpoint responds within 2 seconds end-to-end including the S3 upload (NFR-013); if S3 upload exceeds 1.5 seconds, the request logs a server-side warning but still returns successfully if completed

---

## Epic 5: Scan Review, Annotation & Health Reports

Vets access their scan queue, open the thermal image viewer, draw circle/ellipse annotations, export annotated images, and submit structured health reports. Farmers can read submitted reports from their cattle profile. Health status transitions are driven by report submissions. After this epic: the full clinical workflow operates end-to-end.

### Story 5.1: Vet Scan Queue

As a vet,
I want to see a list of scan records across my assigned farms ordered newest-first,
So that I can triage and prioritize which scans need review.

**Acceptance Criteria:**

**Given** a vet navigates to `/vet/scans`
**Then** `shadcn Skeleton` rows render immediately while the `scans.listForVet` tRPC `vetProcedure` loads; once loaded, a list shows scan cards with: thumbnail of thermal image (served via CloudFront presigned URL), cattle tag ID + name, farm name, scan date, and a status chip (`Pending` / `Reviewed`)

**Given** the vet is assigned to multiple farms
**Then** the farm switcher dropdown in the sidebar shows "All Farms" (default) + one entry per assigned farm; selecting a farm scopes the list to that farm only; the URL updates to include the farm filter; browser back/forward restores the selected scope (UX-DR11)

**Given** the list is filtered to a specific farm with no pending scans
**Then** an empty state renders: "No scans pending review for this farm."

**And** only farms where the vet has an active `vet_farm_assignments` row appear in the switcher (NFR-002); `deleted_at IS NULL` is applied to all `scan_records` queries

### Story 5.2: Scan Viewer

As a vet,
I want to open a scan and see the thermal image alongside the cattle's full history,
So that I have complete context before annotating or writing a report.

**Acceptance Criteria:**

**Given** a vet clicks a scan card in the queue
**Then** they navigate to `/vet/scans/[scanId]`; the page renders within 5 seconds, ready for annotation input (NFR-012)

**Given** the scan viewer has loaded
**Then** it displays: the thermal image (fetched from S3 via CloudFront presigned URL, rendered behind the annotation canvas), environment data (`temperature`, `humidity` from `environment_data` JSONB), source identifier, and scan date

**Given** the cattle linked to the scan has previous health reports
**Then** a panel alongside the image lists all previous reports for that cattle, newest-first: report date, vet name, sickness name, severity, recovery status; empty state "No prior health reports for this animal." if none exist

**Given** the scan already has saved annotations (`annotations` JSONB is not null)
**Then** the annotation canvas initializes with those shapes pre-rendered; the vet can continue annotating or clear all

**And** if the scan's `cattle_id` is on a farm not in the vet's assignments, the page returns 404 (NFR-002)

### Story 5.3: Annotation Canvas

As a vet,
I want to draw circle and ellipse annotations directly on the thermal image,
So that I can mark affected body areas precisely before submitting a health report.

**Acceptance Criteria:**

**Given** the scan viewer has loaded
**Then** an HTML5 `<canvas>` element is layered over the thermal image at the same dimensions; the `AnnotationToolbar` (`rgba(30,58,95,0.9)`, white icons, shadow-md, 8px radius) renders with four buttons: Circle, Ellipse, Undo, Clear (UX-DR4)

**Given** the Circle tool is selected and the vet drags on the canvas
**Then** a circle is drawn with center at drag-start and radius equal to cursor distance from center; shape is clipped at canvas boundaries; rendered as translucent amber stroke-only (`#D97706`, no fill) (UX-DR7)

**Given** the Ellipse tool is selected and the vet drags on the canvas
**Then** an ellipse is drawn from corner to corner of the drag bounding box; same amber stroke style; clipped at canvas boundaries

**Given** the vet clicks Undo
**Then** the last-drawn shape is removed; if no shapes exist, Undo is a no-op

**Given** the vet clicks Clear
**Then** an inline confirmation appears directly below the toolbar: "Clear all annotations? This cannot be undone." with Confirm and Cancel buttons (not a modal dialog); on Confirm, all shapes are removed from the canvas; on Cancel, no change occurs

**Given** the canvas has keyboard focus
**Then** `C`/`E` keys select circle/ellipse tool; arrow keys move a 16px position cursor (Shift = 4px fine step); `Enter`/`Space` commits a default-size shape at cursor position; `Ctrl+Z`/`Cmd+Z` triggers undo; `aria-live` announces shape additions and removals (UX-DR8, UX-DR19)

**And** the active tool button shows a 20% white tint background to indicate selection; switching tools does not clear existing shapes

### Story 5.4: Annotation Save & Image Export

As a vet,
I want to save my annotations and export the annotated image as a PNG,
So that the scan record captures my clinical markings and the image is available for records.

**Acceptance Criteria:**

**Given** the vet has drawn shapes and clicks "Save Annotations"
**Then** the annotation array `[{type:"circle", cx, cy, r}, ...]` or `[{type:"ellipse", cx, cy, rx, ry}, ...]` is serialized to JSON and written to `scan_records.annotations` via the `scans.saveAnnotations` tRPC `vetProcedure`; a success toast "Annotations saved." appears for 3 seconds

**Given** the vet has no shapes drawn and clicks "Save Annotations"
**Then** `scan_records.annotations` is set to `null`; the save succeeds (annotation is not required — FR-030)

**Given** the vet clicks "Export Image"
**Then** the HTML5 canvas composites the base thermal image + current annotation overlays and triggers a PNG download via `canvas.toDataURL('image/png')` with filename `scan-{scanId}.png`; if no annotations are present, the base thermal image is exported without overlays (UX-DR16)

**Given** a subsequent "Save Annotations" call is made
**Then** the `annotations` JSONB column is replaced entirely; no version history is stored (FR-028)

### Story 5.5: Health Report Creation

As a vet,
I want to submit a structured health report from the scan viewer,
So that the cattle's diagnosis, severity, and recovery status are formally recorded.

**Acceptance Criteria:**

**Given** the vet clicks "Write Report" in the scan viewer
**Then** a `HealthReportForm` panel opens with: Sickness Name (text input, required), Severity (segmented control Mild/Moderate/Severe, required), Recommended Treatment (textarea, optional), Recovery Status (two-state toggle Sick/Recovered, required); Submit button is disabled and labelled "Fill required fields" until all required fields are complete (UX-DR12)

**Given** the vet completes required fields and clicks Submit
**Then** an `AlertDialog` confirmation appears: "This report cannot be edited after submission. Proceed?" with Submit and Cancel actions

**Given** the vet confirms submission
**Then** the `healthReports.create` tRPC `vetProcedure` inserts a `health_reports` row with: `cattle_id`, `scan_record_id`, `sickness_name`, `severity`, `recommended_treatment`, `recovery_status`, `vet_id`, `created_at`; the table has no `updated_at` or `deleted_at` columns (append-only — FR-033)

**Given** `recovery_status: 'sick'`
**Then** `cattle.health_status` is set to `'sick'` in a single transaction with the report insert (FR-032)

**Given** `recovery_status: 'recovered'`
**Then** `cattle.health_status` is set to `'healthy'` in a single transaction (FR-016)

**And** each required field shows an inline error on blur; submission is blocked until all required errors are resolved (UX-DR12)

### Story 5.6: Post-Submission & Vet Report Read Access

As a vet,
I want to see a read-only view of the report immediately after submitting and access past reports,
So that I can confirm what was recorded and review history across my assigned farms.

**Acceptance Criteria:**

**Given** the vet confirms report submission
**Then** the `HealthReportForm` panel is replaced by a read-only `HealthReportView` showing all submitted fields; a success toast appears bottom-right for 5 seconds: "Report submitted. [Cattle name]'s status updated." (UX-DR18)

**Given** the scan card in the Scan Queue is visible after submission
**Then** its status chip updates from `Pending` to `Reviewed` without requiring a page reload (UX-DR18)

**Given** a vet navigates to a scan that already has a submitted report
**Then** the page renders `HealthReportView` directly with no form and no edit or delete controls (FR-033)

**Given** a vet wants to view reports across their assigned farms
**Then** `healthReports.listForVet` tRPC `vetProcedure` returns all reports for farms in `vet_farm_assignments`, ordered by `created_at DESC` (FR-035)

### Story 5.7: Health Report View (Farmer)

As a farmer,
I want to read health reports linked to my cattle,
So that I understand what the vet found and what treatment was recommended.

**Acceptance Criteria:**

**Given** a farmer views a cattle profile (Story 3.3)
**Then** the history section lists health reports newest-first, each showing: report date, vet name, sickness name, severity, recovery status, and a "View Report" link

**Given** the farmer clicks "View Report"
**Then** they navigate to `/farmer/cattle/[id]/reports/[reportId]` and see the full read-only `HealthReportView`: sickness name, severity, recommended treatment, recovery status, vet name, report date, annotated scan thumbnail

**Given** the health report's `cattle_id` is not on the farmer's farm
**Then** the page returns 404 (NFR-001)

**And** no create, edit, or delete controls appear for farmers (FR-033, FR-034); the `healthReports.getForFarmer` tRPC `farmerProcedure` scopes all queries to `ctx.session.user.farmId`

---

## Epic 6: Farmer Dashboard & Notifications

Farmers see herd health at a glance — stats, 6-month scan trend, sick-cattle drill-down. In-app and email alerts notify farmers when a vet submits a health report. Vets receive a daily morning digest of pending activity. After this epic: the platform closes the feedback loop — the right people are informed at the right time.

### Story 6.1: Farmer Dashboard

As a farmer,
I want a homepage that shows my herd's health at a glance with key stats and a scan trend,
So that I can quickly assess the state of my farm without navigating multiple pages.

**Acceptance Criteria:**

**Given** a farmer navigates to `/farmer` (the homepage)
**Then** `shadcn Skeleton` blocks render immediately for all four stat cards and the chart area while tRPC queries load; sidebar and top bar render immediately (UX-DR15)

**Given** the data has loaded
**Then** four stat cards appear: (1) `StatCard` — Total Cattle (`cattle.countByFarm`); (2) `SickStatCard` — Sick Cattle (`cattle.countSickByFarm`); (3) `StatCard` — Total Scan Records (`scanRecords.countByFarm`, all-time); (4) a 6-month scan trend chart

**Given** the Sick Cattle count is greater than 0
**Then** the `SickStatCard` metric renders in `#D97706`; the metric is a suppressed-style link (no underline, underline on hover) navigating to `/farmer/cattle?health=sick` (FR-038, UX-DR10)

**Given** the Sick Cattle count is 0
**Then** the `SickStatCard` metric renders in `#14532D` (green); the link still navigates to `/farmer/cattle?health=sick` but the destination will be empty (UX-DR17)

**Given** the data has loaded
**Then** a 6-month scan trend bar chart renders: non-interactive v1, primary-color (`#1E3A5F`) bars, all 6 month labels always visible (current + 5 prior calendar months), months with zero scans render a 2px stub bar, chart scrolls horizontally at sm breakpoint (FR-036, UX-DR9)

**And** all dashboard data loads on page load; no streaming or real-time push (FR-037); page loads within 3 seconds on standard broadband (NFR-011); all queries scope to `ctx.session.user.farmId` (NFR-001)

### Story 6.2: Farmer Health Report Alerts (Email + Background Job)

As a farmer,
I want to receive an email alert when a vet submits a health report for my cattle,
So that I'm immediately informed about a diagnosis without having to check the platform manually.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `notifications` table exists with: `id UUID DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL FK → users(id)`, `type VARCHAR NOT NULL` (e.g. `'health_report'`), `payload JSONB NOT NULL`, `read_at TIMESTAMPTZ NULLABLE DEFAULT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`; index on `(user_id, read_at)` for efficient unread count queries

**Given** a vet submits a health report (Story 5.5)
**Then** after the `health_reports` row is inserted, the procedure enqueues a `notify-farmer` pg-boss v12 job with payload: `{ farmerId, cattleId, cattleName, tagId, sicknessName, severity, reportId }`

**Given** the pg-boss worker picks up a `notify-farmer` job
**Then** a `notifications` row is inserted for the farmer: `{ user_id: farmerId, type: 'health_report', payload: {...}, read_at: NULL, created_at }`

**Given** the `notifications` row is inserted
**Then** AWS SES sends an email to the farmer with: subject "Health Alert: [cattle name] — [sickness name]"; body containing cattle name, tag ID, sickness name, severity, and a direct link to `/farmer/cattle/[id]/reports/[reportId]` (FR-039, FR-040)

**Given** SES send fails
**Then** the pg-boss job retries up to 3 times with exponential backoff; the `notifications` row persists regardless of email delivery status

### Story 6.3: In-App Notification Bell & Panel

As a farmer,
I want to see unread notifications in a bell icon in the top bar and open a panel to review them,
So that I can catch health alerts without relying solely on email.

**Acceptance Criteria:**

**Given** a farmer is logged in and on any farmer-shell page
**Then** the `NotificationBell` component polls `notifications.getUnreadCount` tRPC `farmerProcedure` every 30 seconds (GAP-002); if unread count > 0, an amber dot badge displays the count; if count > 9, the badge shows "9+"

**Given** the farmer clicks the notification bell
**Then** a right-side `Sheet` opens (380px at lg+, full-width at sm); notifications are listed newest-first, each showing: cattle name, sickness name, severity, time ago, and a link to the health report; all notifications are marked `read_at = NOW()` on panel open via `notifications.markAllRead` (UX-DR13)

**Given** there are no notifications
**Then** the sheet shows centered empty state: "No notifications."

**And** `notifications.getUnreadCount` and `notifications.list` both scope to `ctx.session.user.id`; unread count badge disappears on next poll after `markAllRead` succeeds

### Story 6.4: Vet Morning Digest

As a vet,
I want to receive a daily morning email digest summarizing my pending activity,
So that I can plan my scan review schedule for the day without logging in first.

**Acceptance Criteria:**

**Given** the Drizzle migration is run
**Then** the `users` table has an additional column: `last_digest_sent_at TIMESTAMPTZ NULLABLE DEFAULT NULL`; this column is updated to `NOW()` each time a digest email is successfully dispatched for that vet

**Given** the pg-boss cron job `vet-morning-digest` is registered
**Then** it runs once per minute; for each vet whose local time (derived from `users.digest_timezone` IANA field — GAP-001) falls between 07:00:00 and 07:00:59, enqueue a digest job only if `last_digest_sent_at IS NULL OR last_digest_sent_at::date < CURRENT_DATE AT TIME ZONE users.digest_timezone`; this condition enforces at-most-one digest per vet per calendar day

**Given** a `vet-morning-digest` job is picked up for a vet
**Then** the worker queries: scans with `created_at > last_digest_sent_at` (or all scans if `last_digest_sent_at IS NULL`) across all assigned farms; cattle with `health_status = 'sick'` across all assigned farms

**Given** the vet has pending activity (at least one new scan or one open sick cattle)
**Then** AWS SES sends an email to the vet with: subject "Farm Tracking — Morning Digest [date]"; body listing new scans pending review (cattle name, farm, scan date) and open sick cattle (name, tag, sickness name, severity); each item links directly to its resource in the platform (FR-041, FR-042)

**Given** the vet has no pending activity
**Then** no email is sent and no SES call is made (FR-043)

**Given** the super-admin has configured a custom digest time for a vet
**Then** `users.digest_timezone` is updated; the cron worker respects the new value from the next run
