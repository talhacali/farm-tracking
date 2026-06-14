---
title: Farm Tracking PRD
status: final
created: 2026-06-14
updated: 2026-06-14
---

# Farm Tracking
**Product Requirements Document**

---

## 1. Problem & Context

Farms managing cattle herds currently lack a centralized, structured way to monitor cattle health over time. Vets visiting multiple farms must rely on paper records or disconnected tools, and farmers have no real-time visibility into herd health status. Thermal imaging provides an objective, non-invasive signal for detecting illness — but without tooling to ingest, annotate, and act on those scans, the data goes underused.

Farm Tracking is a web-based internal platform that unifies farmers, vets, and scanning devices into one workflow: scan ingestion → vet review and annotation → health report → farmer awareness.

---

## 2. Goals & Non-Goals

### Goals
- Give farmers a real-time view of their herd's health status and scan history.
- Give vets a structured workflow to review thermal scans, annotate affected areas, and produce health reports.
- Enable reliable, multi-source scan and environment data ingestion via API.
- Support a super-admin with full platform control over farms, users, and assignments.
- Deliver timely, role-appropriate notifications that reduce the need for manual follow-up.

### Non-Goals
- The external vet-facing mobile app is out of scope; we own and publish the API it conforms to, but we do not build the app.
- Automated diagnosis or AI-based scan analysis is not in scope.
- Farmer-to-vet communication (messaging, scheduling) is not in scope.
- Billing, invoicing, or commercial features are not in scope.
- Multi-language / i18n support is not in scope.
- Offline / low-connectivity mode for the web app is not in scope.

### Success Metrics
- Average time from scan upload to health report creation. [Baseline to be established at launch; target to be set after first 30 days of data]
- Percentage of uploaded scans reviewed within 48 hours. [Baseline to be established at launch; provisional target ≥80%]
- Farmer dashboard daily active usage rate. [Baseline to be established at launch]
- **Counter-metric:** Vet morning digest open rate — if it drops below 50% over a rolling 2-week window, digest frequency or content should be reviewed to address alert fatigue. [Threshold provisional; revisit at launch]

---

## 3. Users & Roles

### 3.1 Farmer
A farm operator responsible for a single herd. Manages cattle records for their assigned farm and monitors herd health via the dashboard. Cannot access other farms or manage users.

### 3.2 Vet
A veterinarian assigned to one or more farms by a super-admin. Reviews thermal scans, annotates affected areas, and creates health reports. Receives a daily morning digest of pending activity across all assigned farms.

### 3.3 Super-Admin
Platform administrator with unrestricted access. Creates and manages all accounts, farms, and vet-to-farm assignments. Has no farm-specific operational restriction.

---

## 4. Features & Requirements

### 4.1 Authentication & Account Management

**FR-001** — All users authenticate via email and password.

**FR-002** — Super-admin creates all user accounts (farmer and vet). A credential set or invite link is delivered to the new user upon account creation.

**FR-003** — Password reset is available via email link.

**FR-004** — Sessions expire after a configurable idle timeout. [ASSUMPTION: default 8 hours]

**FR-005** — Each user belongs to exactly one role; role cannot be self-changed.

---

### 4.2 Farm & Assignment Management (Super-Admin)

**FR-006** — Super-admin can create, view, edit, and deactivate farms. Deactivating a farm blocks new scan ingestion and hides the farm from non-admin users; existing records are preserved per NFR-009.

**FR-007** — Super-admin can create farmer accounts and associate each farmer to exactly one farm.

**FR-008** — Super-admin can create vet accounts.

**FR-009** — Super-admin can assign one or more vets to a farm; a vet may be assigned to multiple farms simultaneously.

**FR-010** — Super-admin can remove a vet's assignment from a farm.

**FR-011** — Super-admin has read and write access to all farms, cattle, scans, and health reports across the platform.

**FR-012** — Super-admin has a platform overview listing all farms with key stats: cattle count, assigned vets, and date of last scan.

---

### 4.3 Cattle Management

**FR-013** — Farmers can add new cattle to their farm. Minimum record fields: tag ID, name, breed, date of birth, sex. [ASSUMPTION: additional fields TBD by operations team — see OQ-1]

**FR-014** — Farmers can view a list of all cattle in their farm with each animal's current health status (healthy / sick).

**FR-015** — Farmers can view an individual cattle profile showing metadata, current health status, and a chronological history of scan records and health reports.

**FR-016** — A cattle's health status is set to "sick" when a vet creates a health report marking it as sick. Status returns to "healthy" only when a subsequent health report marks it as recovered. [ASSUMPTION: recovery is a field within the health report — see OQ-8]

**FR-017** — Farmers cannot edit or delete cattle records once created. [ASSUMPTION: super-admin can edit cattle records directly via the admin panel; no formal correction-request workflow exists for MVP]

---

### 4.4 Scan Ingestion API

**FR-018** — The platform exposes a REST API endpoint that accepts scan submissions containing: cattle identifier, thermal scan image, environment data (at minimum: temperature and humidity [ASSUMPTION — see OQ-6]), and a source identifier (IoT device ID or mobile app identifier).

**FR-019** — API callers authenticate via API key. [ASSUMPTION: per-device / per-source keys issued and managed by super-admin]

**FR-020** — A successful submission returns an HTTP 200 with a generated scan ID. Failed submissions return structured error responses.

**FR-021** — Submissions referencing an unrecognized cattle identifier are rejected with HTTP 422; no partial record is stored.

**FR-022** — The API spec (endpoints, request/response schema, error codes) is versioned. Breaking changes require a version increment. The external vet mobile app is an active consumer of this spec; any change that would break it is treated as a breaking change. [NOTE FOR PM: API spec to be authored as a companion document before FR-018 development begins]

**FR-023** — The system stores the scan image and environment data together as a single scan record linked to the cattle.

---

### 4.5 Scan Viewer & Annotation

**FR-024** — Vets can view a list of scan records across all cattle on their assigned farms, ordered by date descending.

**FR-025** — The scan viewer displays the thermal image alongside the cattle's previous health reports and full scan record history in chronological order.

**FR-026** — Vets can annotate a scan by drawing circles (or ellipses) directly on the thermal image to mark affected body areas. The system renders annotations as overlays on the image. Constraints: a minimum of zero annotations is required (annotation is not mandatory for report submission — see FR-030); no hard maximum per scan record [ASSUMPTION: UX to define a practical limit]; undo of the last-drawn shape is supported; partially drawn annotations can be saved without completing a closed shape.

**FR-027** — The system saves annotations as part of the scan record and surfaces them as the "modified scan result" in the resulting health report.

**FR-028** — A scan record has at most one active annotation set per vet session. Re-annotating overwrites the previous annotation. [ASSUMPTION: concurrent vet annotation on the same scan record is not supported — see OQ-7]

**FR-029** — The annotated image (base thermal + annotation overlay) can be exported as a combined image file.

---

### 4.6 Health Reports

**FR-030** — A vet creates a health report from the scan viewer after reviewing the scan. Annotation is recommended but not enforced — a vet may submit a report without annotating the scan.

**FR-031** — A health report contains:
  - Cattle reference (linked) — auto-populated, required
  - Scan reference (linked, includes annotation overlay if present) — auto-populated, required
  - Sickness name / diagnosis — required
  - Severity — required [ASSUMPTION: three-tier scale — mild / moderate / severe — see OQ-2]
  - Recommended treatment (free text) — optional
  - Recovery status: sick or recovered — required [ASSUMPTION — see OQ-8]
  - Vet name and report timestamp — auto-populated, required

**FR-032** — Submitting a health report immediately updates the linked cattle's health status per FR-016.

**FR-033** — Health reports are read-only once submitted. [ASSUMPTION: corrections require super-admin]

**FR-034** — Farmers can view health reports for cattle in their farm (read-only).

**FR-035** — Vets can view all health reports across their assigned farms.

---

### 4.7 Farmer Dashboard

**FR-036** — The farmer's homepage displays:
  - Total cattle count in the farm
  - Number of cattle currently marked sick
  - Total scan records [ASSUMPTION: all-time total — see OQ-3]
  - Monthly scan count trend — chart for the last 6 calendar months [NOTE FOR PM: UX to define chart type, axis labels, and empty-state behavior for months with zero scans or fewer than 6 months of history]

**FR-037** — Dashboard data refreshes on page load. Real-time streaming is not required. [ASSUMPTION: on-load refresh is sufficient; confirm SLA with operations]

**FR-038** — The sick cattle count is a clickable link that navigates to the cattle list filtered to sick animals only.

---

### 4.8 Alerts & Notifications

**FR-039** — When a vet submits a health report, the farmer of the affected cattle's farm receives an alert. [ASSUMPTION: delivered via both in-app notification and email, pending OQ-4]

**FR-040** — The farmer alert contains: cattle name / tag ID, sickness name, severity, and a direct link to the health report.

**FR-041** — Vets receive a daily morning digest summarizing activity across all their assigned farms: new scans pending review since the last digest, and cattle with open (sick, unresolved) health reports. [ASSUMPTION: digest sent at 07:00 local time by default; delivery time is configurable by super-admin]

**FR-042** — The vet digest is delivered via email.

**FR-043** — If a vet has no pending activity, their digest is suppressed for that day. [ASSUMPTION — see OQ-5]

---

## 5. Non-Functional Requirements

### 5.1 Access Control

**NFR-001** — Farmers are scoped strictly to their single assigned farm; they cannot view or access data from any other farm.

**NFR-002** — Vets can only access farms they are explicitly assigned to by a super-admin.

**NFR-003** — Super-admin has unrestricted platform-wide read and write access.

**NFR-004** — Scan ingestion API endpoints use API key authentication independent of the web session; farmer and vet web sessions cannot call ingestion endpoints.

**NFR-005** — All role and farm scoping is enforced server-side. The client cannot escalate privileges.

### 5.2 API Contract

**NFR-006** — The scan ingestion API must handle concurrent submissions from multiple IoT devices and mobile apps without data loss or duplication. [ASSUMPTION: up to 10 devices per farm, peak 30 submissions per minute across the platform — validate with IoT/Device team before architecture]

**NFR-007** — The API spec is versioned and published. Breaking changes require a version bump; the external vet mobile app is an active consumer and must not be broken by routine updates.

### 5.3 Data & Storage

**NFR-008** — Thermal scan images are stored in durable object storage (implementation detail deferred to architecture).

**NFR-009** — Cattle records, scan records, and health reports are soft-deleted only; hard deletion is not permitted. Super-admin can recover deactivated records.

**NFR-010** — Environment data is stored alongside each scan record and queryable per scan.

### 5.4 Performance

**NFR-011** — Farmer dashboard must load within 3 seconds on a standard broadband connection.

**NFR-012** — Scan viewer with thermal image and annotation canvas must be ready to accept user input (pan, draw) within 5 seconds of page open on a standard broadband connection.

**NFR-013** — Scan ingestion API must respond within 2 seconds for a successful submission under normal load.

---

## 6. Open Questions

| # | Question | Owner | Revisit Condition |
|---|----------|-------|-------------------|
| OQ-1 | What additional fields should the cattle record carry beyond the assumed minimum (tag ID, name, breed, DOB, sex)? | Operations team | Before FR-013 development |
| OQ-2 | What is the severity scale for health reports — three-tier (mild / moderate / severe) or numeric? | Vet stakeholders | Before FR-031 development |
| OQ-3 | Should the farmer dashboard scan count be all-time or a configurable window? | Product owner | Before FR-036 development |
| OQ-4 | Should the farmer health report alert be delivered in-app, via email, or both? | Operations team | Before FR-039 development |
| OQ-5 | Should empty vet morning digests be suppressed, or should vets always receive a digest? | Vet stakeholders | Before FR-043 development |
| OQ-6 | What environment data fields are included in scan submissions beyond temperature and humidity? | IoT / Device team | Before FR-018 API spec is finalized |
| OQ-7 | Can multiple vets annotate the same scan concurrently, or is annotation access exclusive? | Vet stakeholders | Before FR-028 development |
| OQ-8 | Is "recovered" a field on the health report, or a separate explicit action by the vet? | Vet stakeholders | Before FR-016 and FR-031 development |

---

## 8. Glossary

- **Scan** — a thermal image captured by an IoT device or mobile app, together with its associated environment data, submitted via the ingestion API and linked to a cattle record.
- **Scan record** — the stored entity comprising a scan's thermal image, environment data, source identifier, and (if annotated) the annotation overlay. "Scan" and "scan record" are used interchangeably in this document.
- **Annotation** — a set of circles or ellipses drawn by a vet on a thermal scan image to mark affected body areas. Stored as part of the scan record.
- **Scan result** (also: modified scan result) — the thermal image rendered with its annotation overlay applied. Referenced in health reports to show which areas the vet identified.
- **Health report** — a structured record created by a vet documenting a cattle's diagnosed condition, severity, recommended treatment, and recovery status, linked to a specific scan record.

---

## 9. Assumptions Index

| # | FR / NFR | Assumption | OQ Ref |
|---|----------|------------|--------|
| A-1 | FR-004 | Default session timeout is 8 hours | — |
| A-2 | FR-013 | Additional cattle record fields TBD by operations team | OQ-1 |
| A-3 | FR-016 | Recovery is a field within the health report | OQ-8 |
| A-4 | FR-017 | Super-admin can edit cattle records directly via the admin panel; no formal correction-request workflow exists for MVP | — |
| A-5 | FR-018 | Environment data fields at minimum include temperature and humidity | OQ-6 |
| A-6 | FR-019 | API keys are per-device / per-source, issued and managed by super-admin | — |
| A-7 | FR-026 | UX to define a practical limit on annotations per scan | — |
| A-8 | FR-028 | Concurrent vet annotation on the same scan is not supported | OQ-7 |
| A-9 | FR-031 | Severity uses a three-tier scale — mild / moderate / severe | OQ-2 |
| A-10 | FR-033 | Corrections to submitted health reports require super-admin | — |
| A-11 | FR-036 | Dashboard scan count is an all-time total | OQ-3 |
| A-12 | FR-037 | On-load refresh is sufficient for dashboard data; SLA to be confirmed with operations | — |
| A-13 | FR-039 | Farmer health report alert delivered via both in-app notification and email | OQ-4 |
| A-14 | FR-041 | Vet morning digest sent at 07:00 local time by default; delivery time is configurable by super-admin | — |
| A-15 | FR-043 | Empty vet morning digests are suppressed | OQ-5 |
| A-16 | NFR-006 | Up to 10 devices per farm, peak 30 submissions per minute across the platform | — |

---

## 10. Out of Scope

- External vet-facing mobile app (we own and publish the API spec; they build and maintain the app)
- Automated / AI-assisted scan diagnosis or triage
- Farmer-to-vet messaging, scheduling, or communication tools
- Billing, invoicing, or subscription management
- Multi-language / i18n support
- Offline or low-connectivity mode for the web app
