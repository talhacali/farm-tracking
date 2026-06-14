---
date: 2026-06-14
project: farm-tracking
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
filesIncluded:
  prd: prds/prd-farm-tracking-2026-06-14/prd.md
  architecture: architecture.md
  epics: epics.md
  ux:
    - ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md
    - ux-designs/ux-farm-tracking-2026-06-14/EXPERIENCE.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-14
**Project:** farm-tracking

## Document Inventory

| Type | File(s) | Size | Modified |
|------|---------|------|----------|
| PRD | `prds/prd-farm-tracking-2026-06-14/prd.md` | 16,837 bytes | Jun 14 18:13 |
| Architecture | `architecture.md` | 51,620 bytes | Jun 14 19:09 |
| Epics & Stories | `epics.md` | 57,360 bytes | Jun 14 19:32 |
| UX Design | `ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md` | 14,488 bytes | Jun 14 18:48 |
| UX Design | `ux-designs/ux-farm-tracking-2026-06-14/EXPERIENCE.md` | 29,171 bytes | Jun 14 18:48 |

**Issues:** None — no duplicates found.

---

## PRD Analysis

### Functional Requirements

FR-001: All users authenticate via email and password.
FR-002: Super-admin creates all user accounts (farmer and vet). A credential set or invite link is delivered to the new user upon account creation.
FR-003: Password reset is available via email link.
FR-004: Sessions expire after a configurable idle timeout. (Default: 8 hours)
FR-005: Each user belongs to exactly one role; role cannot be self-changed.
FR-006: Super-admin can create, view, edit, and deactivate farms. Deactivating a farm blocks new scan ingestion and hides the farm from non-admin users; existing records are preserved per NFR-009.
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
FR-017: Farmers cannot edit or delete cattle records once created. Super-admin can edit cattle records via the admin panel.
FR-018: The platform exposes a REST API endpoint accepting scan submissions containing: cattle identifier, thermal scan image, environment data (min: temperature and humidity), and a source identifier (IoT device ID or mobile app identifier).
FR-019: API callers authenticate via API key (per-device / per-source keys issued and managed by super-admin).
FR-020: A successful submission returns HTTP 200 with a generated scan ID. Failed submissions return structured error responses.
FR-021: Submissions referencing an unrecognized cattle identifier are rejected with HTTP 422; no partial record is stored.
FR-022: The API spec (endpoints, request/response schema, error codes) is versioned. Breaking changes require a version increment. The external vet mobile app is an active consumer.
FR-023: The system stores the scan image and environment data together as a single scan record linked to the cattle.
FR-024: Vets can view a list of scan records across all cattle on their assigned farms, ordered by date descending.
FR-025: The scan viewer displays the thermal image alongside the cattle's previous health reports and full scan record history in chronological order.
FR-026: Vets can annotate a scan by drawing circles (or ellipses) directly on the thermal image to mark affected body areas. Annotations are rendered as overlays. Undo of last-drawn shape is supported. Minimum zero annotations required (not mandatory for report submission).
FR-027: The system saves annotations as part of the scan record and surfaces them as the "modified scan result" in the resulting health report.
FR-028: A scan record has at most one active annotation set per vet session. Re-annotating overwrites the previous annotation. Concurrent annotation by multiple vets is not supported.
FR-029: The annotated image (base thermal + annotation overlay) can be exported as a combined image file.
FR-030: A vet creates a health report from the scan viewer after reviewing the scan. Annotation is recommended but not enforced.
FR-031: A health report contains: cattle reference (auto-populated, required), scan reference with annotation overlay (auto-populated, required), sickness name/diagnosis (required), severity — mild/moderate/severe (required), recommended treatment (free text, optional), recovery status: sick or recovered (required), vet name and report timestamp (auto-populated, required).
FR-032: Submitting a health report immediately updates the linked cattle's health status per FR-016.
FR-033: Health reports are read-only once submitted. Corrections require super-admin.
FR-034: Farmers can view health reports for cattle in their farm (read-only).
FR-035: Vets can view all health reports across their assigned farms.
FR-036: The farmer's homepage displays: total cattle count, number of cattle currently marked sick, total scan records (all-time), and monthly scan count trend chart for the last 6 calendar months.
FR-037: Dashboard data refreshes on page load. Real-time streaming is not required.
FR-038: The sick cattle count is a clickable link that navigates to the cattle list filtered to sick animals only.
FR-039: When a vet submits a health report, the farmer of the affected cattle's farm receives an alert (in-app notification and email).
FR-040: The farmer alert contains: cattle name/tag ID, sickness name, severity, and a direct link to the health report.
FR-041: Vets receive a daily morning digest summarizing activity across all their assigned farms: new scans pending review since the last digest, and cattle with open (sick, unresolved) health reports. Digest sent at 07:00 local time by default; delivery time configurable by super-admin.
FR-042: The vet digest is delivered via email.
FR-043: If a vet has no pending activity, their digest is suppressed for that day.

**Total FRs: 43**

---

### Non-Functional Requirements

NFR-001: Farmers are scoped strictly to their single assigned farm; they cannot view or access data from any other farm.
NFR-002: Vets can only access farms they are explicitly assigned to by a super-admin.
NFR-003: Super-admin has unrestricted platform-wide read and write access.
NFR-004: Scan ingestion API endpoints use API key authentication independent of the web session; farmer and vet web sessions cannot call ingestion endpoints.
NFR-005: All role and farm scoping is enforced server-side. The client cannot escalate privileges.
NFR-006: The scan ingestion API must handle concurrent submissions from multiple IoT devices and mobile apps without data loss or duplication. (Assumed: up to 10 devices per farm, peak 30 submissions/min across the platform)
NFR-007: The API spec is versioned and published. Breaking changes require a version bump; the external vet mobile app must not be broken by routine updates.
NFR-008: Thermal scan images are stored in durable object storage (implementation detail deferred to architecture).
NFR-009: Cattle records, scan records, and health reports are soft-deleted only; hard deletion is not permitted. Super-admin can recover deactivated records.
NFR-010: Environment data is stored alongside each scan record and queryable per scan.
NFR-011: Farmer dashboard must load within 3 seconds on a standard broadband connection.
NFR-012: Scan viewer with thermal image and annotation canvas must be ready to accept user input within 5 seconds of page open on a standard broadband connection.
NFR-013: Scan ingestion API must respond within 2 seconds for a successful submission under normal load.

**Total NFRs: 13**

---

### Additional Requirements / Constraints

- **API Spec Companion Document** (FR-022 note): API spec must be authored as a companion document before FR-018 development begins.
- **8 Open Questions** (OQ-1 through OQ-8) remain unresolved — none block assessment but several affect specific FR implementations before development starts.
- **Out of Scope**: External vet mobile app, AI-based diagnosis, farmer-to-vet messaging, billing, i18n, offline mode.

---

### PRD Completeness Assessment

The PRD is well-structured and thorough. Requirements are clearly numbered and traceable. All major functional areas have corresponding NFRs. The open questions are explicitly called out with owners and revisit conditions, which is good practice. No requirements appear to be missing at the macro level — gaps are acknowledged rather than omitted.

---

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Summary | Epic / Story | Status |
|---|---|---|---|
| FR-001 | Email/password auth | Epic 1 / Story 1.3 | ✓ Covered |
| FR-002 | Super-admin creates accounts + invite | Epic 1 / Story 1.3, Epic 2 / Stories 2.2–2.3 | ✓ Covered |
| FR-003 | Password reset via email | Epic 1 / Story 1.5 | ✓ Covered |
| FR-004 | Configurable idle session timeout | Epic 1 / Story 1.3, 1.5 | ✓ Covered |
| FR-005 | Single role per user; role not self-changeable | Epic 1 / Story 1.3 | ✓ Covered |
| FR-006 | Super-admin CRUD + deactivate farms | Epic 2 / Story 2.1 | ✓ Covered |
| FR-007 | Super-admin creates farmer + assigns to one farm | Epic 2 / Story 2.2 | ✓ Covered |
| FR-008 | Super-admin creates vet accounts | Epic 2 / Story 2.3 | ✓ Covered |
| FR-009 | Super-admin assigns vets to farms (multi-farm) | Epic 2 / Story 2.3 | ✓ Covered |
| FR-010 | Super-admin removes vet assignment | Epic 2 / Story 2.3 | ✓ Covered |
| FR-011 | Super-admin full read/write across platform | Epic 2 (all admin procedures) | ✓ Covered |
| FR-012 | Platform overview with farm stats | Epic 2 / Story 2.1 | ✓ Covered |
| FR-013 | Farmer adds cattle (tag ID, name, breed, DOB, sex) | Epic 3 / Story 3.1 | ✓ Covered |
| FR-014 | Farmer views cattle list with health status | Epic 3 / Story 3.2 | ✓ Covered |
| FR-015 | Farmer views cattle profile + history | Epic 3 / Story 3.3 | ✓ Covered |
| FR-016 | Health status state machine (sick/recovered via report) | Epic 3 / Story 3.3 (display) + Epic 5 / Story 5.5 (trigger) | ✓ Covered |
| FR-017 | Farmer cannot edit/delete cattle | Epic 3 / Stories 3.1–3.3 | ✓ Covered |
| FR-018 | REST scan ingestion endpoint | Epic 4 / Story 4.1 | ✓ Covered |
| FR-019 | API key authentication | Epic 2 / Story 2.4 (admin UI) + Epic 4 / Story 4.1 (middleware) | ✓ Covered |
| FR-020 | HTTP 200 + scanId on success; structured errors on failure | Epic 4 / Story 4.1 | ✓ Covered |
| FR-021 | HTTP 422 on unknown cattle; no partial record | Epic 4 / Story 4.1 | ✓ Covered |
| FR-022 | Versioned API spec; breaking changes = version bump | Epic 4 / Story 4.1 | ✓ Covered |
| FR-023 | Scan image + env data stored as one record | Epic 4 / Story 4.1 | ✓ Covered |
| FR-024 | Vet views scan list (assigned farms, date desc) | Epic 5 / Story 5.1 | ✓ Covered |
| FR-025 | Scan viewer: thermal image + history + context | Epic 5 / Story 5.2 | ✓ Covered |
| FR-026 | Annotation canvas: circle/ellipse, undo, zero-minimum | Epic 5 / Story 5.3 | ✓ Covered |
| FR-027 | Annotations saved as scan record / modified scan result | Epic 5 / Story 5.4 | ✓ Covered |
| FR-028 | One annotation set per vet session; re-annotate overwrites | Epic 5 / Story 5.4 | ✓ Covered |
| FR-029 | Export annotated image as PNG | Epic 5 / Story 5.4 | ✓ Covered |
| FR-030 | Vet creates health report; annotation not mandatory | Epic 5 / Story 5.5 | ✓ Covered |
| FR-031 | Health report fields (all required/optional per spec) | Epic 5 / Story 5.5 | ✓ Covered |
| FR-032 | Report submission immediately updates cattle health status | Epic 5 / Story 5.5 | ✓ Covered |
| FR-033 | Health reports read-only after submission | Epic 5 / Stories 5.5–5.7 | ✓ Covered |
| FR-034 | Farmer reads health reports (read-only) | Epic 5 / Story 5.7 | ✓ Covered |
| FR-035 | Vet reads all health reports across assigned farms | Epic 5 / Story 5.6 | ✓ Covered |
| FR-036 | Farmer dashboard: cattle count, sick count, scan count, 6-month trend | Epic 6 / Story 6.1 | ✓ Covered |
| FR-037 | Dashboard refreshes on page load; no streaming | Epic 6 / Story 6.1 | ✓ Covered |
| FR-038 | Sick count is clickable link to filtered cattle list | Epic 6 / Story 6.1 | ✓ Covered |
| FR-039 | Farmer receives alert on vet health report submission | Epic 6 / Story 6.2 | ✓ Covered |
| FR-040 | Alert content: cattle name/tag, sickness, severity, report link | Epic 6 / Story 6.2 | ✓ Covered |
| FR-041 | Vet daily morning digest (configurable time) | Epic 6 / Story 6.4 | ✓ Covered |
| FR-042 | Vet digest delivered via email | Epic 6 / Story 6.4 | ✓ Covered |
| FR-043 | Digest suppressed if no pending activity | Epic 6 / Story 6.4 | ✓ Covered |

### Missing Requirements

None. All 43 FRs have clear, traceable coverage in the epics and stories.

### Coverage Statistics

- Total PRD FRs: 43
- FRs covered in epics: 43
- **Coverage: 100%**
- Total PRD NFRs: 13
- NFRs covered in epics: 13
- **NFR Coverage: 100%**
- UX Design Requirements (UX-DR1–DR20): 20/20 covered across epics

---

## UX Alignment Assessment

### UX Document Status

Found — two documents:
- `ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md` — brand system, component tokens
- `ux-designs/ux-farm-tracking-2026-06-14/EXPERIENCE.md` — surfaces, flows, interaction patterns

Both are marked `status: final` and reference the PRD as a source.

---

### Alignment Issues

**ISSUE-UX-01 (Medium) — Dashboard stat card definition conflict**
- **EXPERIENCE.md** lists the 4 farmer dashboard cards as: Total Cattle, Sick Cattle, Total Scans (last 30 days), Latest Report Date.
- **PRD FR-036** specifies: Total cattle count, Sick count, Total scan records (all-time per assumption A-11), and a monthly scan count *trend chart* for last 6 months (not a stat card).
- **Architecture** confirms: "Aggregate metrics + 6-month bar chart."
- **Epics Story 6.1** follows the PRD: 3 stat cards + a 6-month chart — no "Latest Report Date" card.
- **Impact:** If devs follow EXPERIENCE.md they build the wrong dashboard. Epics and PRD are consistent; EXPERIENCE.md is the outlier.
- **Recommendation:** Epics / PRD take precedence. EXPERIENCE.md stat card list needs updating: card 3 is all-time scan count; card 4 is the 6-month trend chart (not a stat card).

**ISSUE-UX-02 (Low) — Sick stat card color references `{colors.destructive}` in a key flow**
- **EXPERIENCE.md Flow 1** reads: "The Sick Cattle card shows `3` in `{colors.destructive}`."
- **DESIGN.md** `sick-stat-card` specifies metric color: `{colors.accent}` (#D97706).
- **Epics UX-DR3** also specifies #D97706.
- **Impact:** A developer reading the key flow would use the wrong color token. Low risk since DESIGN.md and epics are explicit, but the flow description will confuse reviewers.
- **Recommendation:** Update EXPERIENCE.md Flow 1 to use `{colors.accent}`.

**ISSUE-UX-03 (Medium) — Annotation Clear All: inline confirmation vs no confirmation**
- **EXPERIENCE.md**: "Clear All removes all shapes with a single confirmation (inline: 'Clear all annotations? This cannot be undone.' with Confirm / Cancel inline — not a modal dialog)."
- **Epics Story 5.3**: "Given the vet clicks Clear — Then all shapes are removed from the canvas; no confirmation is required."
- **Impact:** Developers implementing Story 5.3 will skip the confirmation step that EXPERIENCE.md describes. These are directly contradictory.
- **Recommendation:** Decide and align. The epics (no confirmation) were generated from the UX docs, so the EXPERIENCE.md may have been updated after. A confirmation is better UX for a destructive action; recommend updating Story 5.3 to match EXPERIENCE.md.

**ISSUE-UX-04 (High) — Annotation persistence model conflict**
- **EXPERIENCE.md**: "Shapes are finalized when the report is submitted. Before submission they are local state only." Also: "Navigating away triggers a browser-native 'Leave page?' confirmation."
- **Epics Story 5.4**: Includes an explicit "Save Annotations" button that calls `scans.saveAnnotations` tRPC, persisting annotations to the DB independently of report submission.
- **Impact:** Fundamental behavioral difference. EXPERIENCE.md implies annotations are ephemeral until report; epics have a separate, explicit server-side save. This affects: (a) whether DB annotations can be non-null without a report; (b) the vet's mental model of what "save" means; (c) the "Leave page?" prompt logic.
- **Recommendation:** Decide which model to implement before Story 5.4 development begins. The explicit save (epics approach) is safer for vets on long annotation sessions. If chosen, update EXPERIENCE.md to reflect the "Save Annotations" step.

**ISSUE-UX-05 (High) — Real-time farmer notification toast is architecturally impossible**
- **EXPERIENCE.md**: Describes a real-time toast appearing immediately when a vet submits a report: "A toast appears at bottom-right: '[Cattle name] — [Sickness] ([Severity]). View Report.' The toast persists for 8 seconds."
- **Architecture**: Explicitly states "No real-time streaming." Uses 30-second polling via `notifications.getUnreadCount` (GAP-002). No WebSockets or SSE in the stack.
- **Impact:** The EXPERIENCE.md implies sub-second push notification; the architecture delivers it within up to 30 seconds. The toast described cannot fire in real-time. Farmers may not see the notification immediately.
- **Recommendation:** Two options: (1) accept the 30-second delay — the bell badge increments on next poll, and the "real-time" toast is removed from the UX spec; (2) introduce SSE for push notifications (added scope, architectural change). Option 1 is the conservative choice given the architecture's explicit "no streaming" constraint.

**ISSUE-UX-06 (Low) — Farm switcher default selection conflict**
- **EXPERIENCE.md**: "Default selection on login: first assigned farm alphabetically."
- **Epics Story 5.1 and UX-DR11**: Default is "All Farms" (aggregate).
- **Impact:** Minor behavioral difference on login. Either works, but devs will encounter conflicting specs.
- **Recommendation:** Align on "All Farms" as default (epics and UX-DR11 are consistent); update EXPERIENCE.md.

**ISSUE-UX-07 (Low) — Cattle row hover violates accent discipline**
- **EXPERIENCE.md** (Cattle Row section): "On hover the row background shifts to `{colors.accent}` at low opacity."
- **DESIGN.md Do's and Don'ts**: "Don't use `{colors.accent}` decoratively — not for hover states, active buttons, link underlines..."
- **Impact:** A developer following EXPERIENCE.md would violate the design system's own rules. The hover state should use the muted background per DESIGN.md's guidance for inactive items.
- **Recommendation:** Update EXPERIENCE.md cattle row hover to use `{colors.muted}` or shadcn default hover.

---

### Warnings

- **WARNING-UX-01:** ISSUE-UX-04 (annotation persistence) and ISSUE-UX-05 (real-time toast) are the two highest-impact misalignments. Both must be resolved before Epic 5 and Epic 6 stories are assigned to developers.
- **WARNING-UX-02:** ISSUE-UX-01 (dashboard stat cards) must be resolved before Epic 6 / Story 6.1 is built. Following EXPERIENCE.md would produce a materially different dashboard than the PRD specifies.

---

## Epic Quality Review

### Best Practices Compliance Checklist

| Epic | Delivers User Value | Epics Independent | Stories Sized Right | No Forward Deps | Schema Created JIT | Clear ACs | FR Traceability |
|---|---|---|---|---|---|---|---|
| Epic 1: Foundation & Auth | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ | ✅ |
| Epic 2: Platform Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 3: Cattle Mgmt | ✅ | ✅ | ✅ | ✅† | ✅ | ✅ | ✅ |
| Epic 4: Scan Ingestion API | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 5: Scan Review & Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 6: Dashboard & Notifications | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ |

*Developer stories (1.1, 1.2) are acceptable per greenfield project guidelines.
†Story 3.3 contains a descriptive forward reference to Epic 5 but handles the empty state correctly.

---

### 🔴 Critical Violations

None.

---

### 🟠 Major Issues

**EPIC-QA-01 — `notifications` table schema never explicitly defined**
- **Where:** Epic 6, Stories 6.2 and 6.3 both write to and read from a `notifications` table (`user_id`, `type`, `health_report`, `payload`, `read_at`, `created_at`).
- **Problem:** No story contains a schema AC that defines this table with columns, constraints, or indexes. Story 6.2 inserts rows into it; Story 6.3 queries it — but neither creates it.
- **Contrast:** Every other table in the project has an explicit schema AC in the story where it is first needed: `users` in 1.3, `farms` in 2.1, `vet_farm_assignments` in 2.3, `api_keys` in 2.4, `cattle` in 3.1, `scan_records` in 4.1. `notifications` breaks this pattern.
- **Impact:** A developer implementing Story 6.2 will need to infer the schema from the insert statement. Missing columns or wrong types (especially `payload JSONB`) will cause runtime failures.
- **Remediation:** Add a schema AC to Story 6.2 (the first story to use the table): `notifications` table with `id UUID`, `user_id UUID NOT NULL FK → users(id)`, `type VARCHAR NOT NULL`, `payload JSONB NOT NULL`, `read_at TIMESTAMPTZ NULLABLE`, `created_at TIMESTAMPTZ NOT NULL`.

**EPIC-QA-02 — `last_digest_sent_at` tracking mechanism undefined**
- **Where:** Epic 6, Story 6.4 — the vet morning digest cron job.
- **Problem:** Story 6.4's AC states: "the worker queries: scans with `created_at > last_digest_sent_at`" — but `last_digest_sent_at` is never defined in any schema or data model. The `users` table schema (Story 1.3) defines: id, email, password_hash, role, farm_id, digest_timezone, created_at, updated_at, deleted_at. No `last_digest_sent_at` column exists.
- **Additionally:** The AC says "each vet receives at most one digest job per calendar day" — the idempotency mechanism for this constraint is not specified. pg-boss can enforce uniqueness per job name+key but this is not described.
- **Impact:** Developers implementing Story 6.4 will encounter an undefined field reference. They must decide whether to add a column to `users`, create a separate `digest_send_log` table, or use pg-boss job deduplication — with no guidance.
- **Remediation:** Add `last_digest_sent_at TIMESTAMPTZ NULLABLE DEFAULT NULL` to the `users` table schema (update Story 1.3 or add to Story 6.4 as a schema migration AC), and specify the idempotency approach explicitly in Story 6.4.

---

### 🟡 Minor Concerns

**EPIC-QA-03 — Epic 4 title reads as a technical milestone**
- **Epic 4 title:** "Scan Ingestion API" — this describes a technical artifact, not a user outcome.
- **Assessment:** The "user" is the IoT device / external mobile app team, which is a valid user type. The epic goal is clearly stated: "IoT devices and the external vet mobile app can submit thermal scans via an authenticated REST API." This is acceptable given the API-consumer context — external teams benefit from this epic directly. Not a critical violation, but the title could be improved.
- **Recommendation (optional):** Rename to "External Scan Submission" to make the actor and outcome clearer.

**EPIC-QA-04 — Story 3.3 descriptive forward reference**
- **Where:** Story 3.3 — Cattle Profile — contains the line: "Given the cattle has health reports (populated in Epic 5)."
- **Assessment:** This is descriptive, not a blocking dependency. The story explicitly handles the zero-state: "Given the cattle has no scan records or health reports yet — Then 'No scan records or health reports yet.'" The story is independently completable and testable.
- **Recommendation:** Remove the parenthetical "(populated in Epic 5)" from the AC to eliminate any potential confusion. Replace with the zero-state AC as the primary testable scenario.

**EPIC-QA-05 — Story 6.4 AC missing email content specification**
- **Where:** Story 6.4 — Vet Morning Digest.
- **Problem:** The AC says the email body contains "new scans pending review (cattle name, farm, scan date)" and "open sick cattle (name, tag, sickness name, severity)" — but the subject format and body structure are not specified to the same precision as Story 6.2 (farmer alert), which provides exact subject format: "Health Alert: [cattle name] — [sickness name]".
- **Assessment:** Minor inconsistency in AC specificity. Developers implementing the email template have enough guidance but the subject format and body layout are underspecified compared to the farmer alert story.
- **Recommendation:** Add explicit subject format to Story 6.4: e.g., `"Farm Tracking — Morning Digest [YYYY-MM-DD]"` and specify body section ordering (new scans first, then open sick cattle).

**EPIC-QA-06 — Annotation "Clear All" confirmation inconsistency (cross-reference to UX)**
- **Where:** Story 5.3 — Annotation Canvas.
- **EXPERIENCE.md** specifies an inline confirmation before clearing; **Story 5.3** says no confirmation required.
- **Already flagged as ISSUE-UX-03.** Included here for completeness — the epics story needs updating once the UX decision is made.

---

### Story Sizing Summary

All 17 stories are appropriately sized for 1–3 day implementation windows. No story is too broad to be independently completable. The "just-in-time" schema creation pattern is consistently applied across Stories 1.3, 2.1, 2.3, 2.4, 3.1, 4.1, and 5.5 — the `notifications` table (EPIC-QA-01) is the single exception to this well-maintained pattern.

---

## Summary and Recommendations

### Overall Readiness Status

**🟢 READY — Blocking decisions resolved**

The two High-priority blocking decisions (annotation persistence, notification delivery) have been made and documented in the architecture. Two schema gaps remain to be patched in the epics before Story 6 tickets are handed to developers. All other issues are low-friction cleanup.

---

### Issues by Priority

| ID | Severity | Category | Summary |
|---|---|---|---|
| ISSUE-UX-04 | ✅ Resolved | UX vs Epics | Annotation persistence: **Explicit Save adopted** — `scans.saveAnnotations` persists to DB independently of report submission. Architecture doc updated. |
| ISSUE-UX-05 | ✅ Resolved | UX vs Architecture | Notification delivery: **Poll-triggered toast adopted** — toast fires within 30s on unread count delta. No SSE/WebSockets. Architecture doc updated. |
| EPIC-QA-01 | ✅ Resolved | Epic Quality | `notifications` table schema AC added to Story 6.2 (id, user_id, type, payload, read_at, created_at + index) |
| EPIC-QA-02 | ✅ Resolved | Epic Quality | `last_digest_sent_at TIMESTAMPTZ NULLABLE` added to users table in Story 6.4; idempotency condition specified |
| ISSUE-UX-01 | 🟠 Medium | UX vs PRD | Dashboard stat card list in EXPERIENCE.md conflicts with PRD FR-036 and epics |
| ISSUE-UX-03 | 🟠 Medium | UX vs Epics | Clear All annotation: EXPERIENCE.md requires confirmation; Story 5.3 says no confirmation |
| ISSUE-UX-02 | 🟡 Low | UX internal | Flow 1 references `{colors.destructive}`; should be `{colors.accent}` |
| ISSUE-UX-06 | 🟡 Low | UX vs Epics | Farm switcher default: EXPERIENCE.md says first farm; epics say "All Farms" |
| ISSUE-UX-07 | 🟡 Low | UX internal | Cattle row hover uses `{colors.accent}` — violates DESIGN.md accent discipline |
| EPIC-QA-03 | 🟡 Minor | Epic naming | Epic 4 title reads as technical milestone rather than user value |
| EPIC-QA-04 | 🟡 Minor | Forward ref | Story 3.3 descriptive Epic 5 reference — not blocking, cleanup only |
| EPIC-QA-05 | 🟡 Minor | AC detail | Story 6.4 email subject format underspecified vs. Story 6.2 |
| EPIC-QA-06 | 🟡 Minor | Cross-ref | Duplicate of ISSUE-UX-03 — see above |

**Total: 2 High, 3 Medium, 7 Minor/Low | 0 Critical violations**

---

### Recommended Next Steps

**Before Epic 5 development begins:**
1. **Decide annotation persistence model (ISSUE-UX-04):** Choose either (a) explicit "Save Annotations" button persists to DB independently (follow epics Story 5.4 as written), or (b) annotations are local-only until report submission (follow EXPERIENCE.md). Update whichever document is the outlier. The epics approach (explicit save) is recommended — it protects vet work on long annotation sessions.

2. **Resolve Clear All confirmation (ISSUE-UX-03):** Accept EXPERIENCE.md (inline confirmation required — better UX for a destructive action) and update Story 5.3 AC. One-line change.

**Before Epic 6 development begins:**
3. **Add `notifications` table schema AC (EPIC-QA-01):** Insert a schema AC into Story 6.2 defining the `notifications` table. Prevents a developer from having to infer schema from the insert statement.

4. **Define `last_digest_sent_at` mechanism (EPIC-QA-02):** Add `last_digest_sent_at TIMESTAMPTZ NULLABLE` to the `users` table schema (update Story 1.3 or add a migration AC in Story 6.4) and specify the one-per-day idempotency mechanism explicitly.

5. **Align dashboard stat cards (ISSUE-UX-01):** Update EXPERIENCE.md stat card list to match PRD FR-036 and epics: card 3 = Total Scan Records (all-time); card 4 replaced by the 6-month trend chart (already described separately in DESIGN.md).

6. **Resolve notification delivery model (ISSUE-UX-05):** Accept the 30-second polling model. Remove the real-time toast description from EXPERIENCE.md's Interaction Primitives and Flow 1. Replace with: "Within up to 30 seconds, the notification bell badge increments. Clicking it opens the Notification Panel." This aligns with the architecture's explicit no-streaming constraint.

**Low-friction cleanup (can be done anytime):**
7. Align farm switcher default to "All Farms" in EXPERIENCE.md (ISSUE-UX-06).
8. Fix `{colors.destructive}` → `{colors.accent}` in EXPERIENCE.md Flow 1 (ISSUE-UX-02).
9. Remove accent hover color from cattle row in EXPERIENCE.md (ISSUE-UX-07).
10. Add email subject format to Story 6.4 AC (EPIC-QA-05).

---

### Final Note

This assessment reviewed 43 FRs, 13 NFRs, 20 UX Design Requirements, 6 Epics, and 17 Stories across 4 planning artifacts. **Coverage is 100% across all requirement types** — the planning team has done thorough work. The 13 issues identified are predominantly document consistency gaps between the UX specification and the epics, not missing features or architectural holes. Address the 5 items flagged for pre-Epic-5 and pre-Epic-6 resolution, and this plan is ready to hand to developers.

**Assessor:** Winston (System Architect) via Implementation Readiness workflow
**Assessment date:** 2026-06-14
**Report:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-06-14.md`
