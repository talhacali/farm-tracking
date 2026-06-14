---
title: PRD–UX Reconciliation Report
created: 2026-06-14
sources:
  - prds/prd-farm-tracking-2026-06-14/prd.md
  - ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md
  - ux-designs/ux-farm-tracking-2026-06-14/EXPERIENCE.md
---

# PRD–UX Reconciliation Report

This report maps every PRD requirement (FR, NFR, and OQ) against the two UX spines (DESIGN.md and EXPERIENCE.md) and identifies what was fully carried over, what was partially captured, and what was silently dropped.

---

## Section 1 — Fully Reflected Requirements

The following PRD requirements are substantively covered in the spines with no meaningful gaps.

- **FR-001 / FR-003 / FR-005** — Email/password auth, password reset, and single-role model are assumed throughout EXPERIENCE.md (role-based shell routing, no self-service registration).
- **FR-013 (minimum fields)** — Tag ID, name, breed are all surfaced in Cattle Row and Cattle Profile flows.
- **FR-014** — Cattle List with health status badge is specified in Component Pattern 1 and Farmer flows.
- **FR-015** — Cattle Profile with metadata and chronological history is represented in Flow 1 and the Surface Map.
- **FR-016** — Health status updating on report submission is described in Report Submission Flow step 4 and confirmed in the success toast copy.
- **FR-024** — Vet scan list ordered by date is covered by the Scan Queue surface and Component Pattern 4 (newest-first ordering).
- **FR-025** — Scan Viewer showing thermal image alongside history is the Scan Viewer surface.
- **FR-026 (core tools)** — Circle and ellipse annotation tools, undo, and "annotation not required" are all captured in Component Pattern 5 and Interaction Primitives.
- **FR-027** — Annotations as part of scan record / "modified scan result" in health report is reflected in Flow 1 step 8 (annotated image visible to farmer).
- **FR-029** — Export of annotated image is not specified in the spines, but this is an API-level concern without a UX pattern required (see Partial section below for nuance).
- **FR-030** — Annotation optional for report submission is explicitly stated in Component Pattern 5.
- **FR-031 (form fields)** — All four form fields (sickness name, severity as three-tier, treatment optional, recovery status toggle) are in Component Pattern 6.
- **FR-032** — Health report updates cattle status is in the Report Submission Flow.
- **FR-033** — Health reports are read-only post-submission is in the confirmation dialog copy and in step 6 of Report Submission Flow (panel transitions to read-only view).
- **FR-034 / FR-035** — Farmer and vet access to health reports is in the Surface Map (Health Report View surface).
- **FR-036 (four KPIs)** — All four stat cards are in Component Pattern 2.
- **FR-037** — On-load refresh (no real-time streaming) is implied by skeleton loading pattern; no WebSocket or polling pattern is specified.
- **FR-038** — Sick count as clickable drill-down is in Component Pattern 2 and the Sick Count Drill-Down interaction.
- **FR-039 / FR-040** — Farmer alert with cattle name, sickness, severity, and View Report link is in Component Pattern 7 and the In-App Notification interaction. Content matches FR-040 exactly.
- **FR-042** — Vet daily digest is email-only; no in-app surface is defined for the digest (consistent with FR-042 and non-delivery of FR-041 in-app component).
- **NFR-001 / NFR-002 / NFR-003 / NFR-005** — Role scoping is enforced throughout EXPERIENCE.md (no cross-role nav items, server-side route guards stated).
- **NFR-011** — Dashboard 3-second load target is implicit in skeleton/cold-load pattern but not explicitly called out (this is acceptable — NFR-011 is an engineering concern, not a UX pattern concern).
- **NFR-012** — Scan viewer 5-second canvas-ready target is implicit; annotation canvas keyboard fallback improves responsiveness perception.

---

## Section 2 — Partially Reflected Requirements

Requirements where the spines captured the intent but dropped a nuance, constraint, or edge case from the PRD.

| # | PRD Requirement | What the Spines Captured | What Was Dropped or Understated |
|---|---|---|---|
| FR-002 | Super-admin creates all accounts; credential set or invite link delivered on creation | Flow 3 shows admin creating a farmer with a "temporary password" field | The PRD allows for an **invite link** as an alternative to a credential set. The spine only models the temporary-password flow. Invite-link delivery is a distinct UX pattern (email action vs. credential handoff) that was not addressed. |
| FR-006 | Farm deactivation blocks new scan ingestion and hides farm from non-admin users; records preserved | Deactivated state pattern is in State Patterns and Farm Detail banner; a Reactivate button is specified | The PRD says deactivated farms are **hidden from non-admin users**. EXPERIENCE.md only describes the super-admin view of deactivation. There is no specified behavior for what a vet or farmer sees if their farm is deactivated (e.g., does the vet's farm disappear from their switcher? does the farmer get a locked-state landing page?). |
| FR-007 | Each farmer is associated to exactly one farm | Flow 3 assigns a farmer to a farm via "Add Farmer" in Farm Detail | The one-to-one constraint (a farmer cannot be on two farms) has no UX enforcement or error state. If an admin tries to assign an already-assigned farmer to a second farm, there is no specified error message or prevention pattern. |
| FR-026 (annotation constraints) | Undo of last shape supported; partially drawn shapes can be saved without a closed shape | Undo and Clear All are specified; "annotation not required" is called out | Two PRD constraints are absent: (1) The **practical limit on annotations per scan** (A-7: "UX to define") was explicitly delegated to UX but the spines never define it. (2) **Partially drawn (open) shapes** saving without a closed contour has no UX treatment — the spine only discusses completed circles/ellipses. |
| FR-028 | At most one active annotation set per vet session; re-annotating overwrites previous | Component Pattern 5 describes the annotation as local state before submission | The **overwrite behavior** when a vet re-opens a scan that already has annotations (from a previous session) is not addressed. Does the canvas pre-populate with existing shapes? Does the vet see a warning that re-annotating will overwrite? This is a non-trivial UX gap for the re-annotation case. |
| FR-036 / FR-037 | Dashboard scan count is all-time total (A-11); data refreshes on page load | Component Pattern 2 spec says "Total Scans (last 30 days)" — this contradicts A-11 | The spine **diverges from the PRD assumption**: A-11 says all-time total; the spine says last 30 days. This is an active conflict requiring PM resolution before development. The empty-state note ("fewer than 6 months of history") in the chart section is correct per PRD. |
| FR-039 / FR-041 | Farmer alert: both in-app AND email (A-13); vet digest at 07:00 configurable by super-admin | In-app notification panel and toast are fully specified. Email channel for farmer alert is mentioned in passing | The **email notification to farmers** has no UX surface (email template, subject line, content structure). Similarly, the super-admin surface for **configuring vet digest delivery time** (A-14: configurable by super-admin) is entirely absent — no settings panel, no field, no surface in the Information Architecture. |
| FR-043 | Empty vet digest is suppressed | No in-app UX surface for digest (correct — it's email-only) | The suppression logic (A-15) has no UX implication per se, but there is no specified empty-state or confirmation affordance when a super-admin adjusts the digest schedule — the super-admin settings surface for digest time is missing entirely (see FR-041 gap above). |
| NFR-004 | Scan ingestion API uses API key auth independent of web session; super-admin manages API keys | Not a web UI interaction per se | The super-admin Information Architecture has no surface for **API key management** (issuance, revocation, per-device key listing). A-6 says super-admin issues and manages keys — this requires a UX surface that is absent from the Surface Map. |
| NFR-009 | Soft-delete only; super-admin can recover deactivated records | Deactivation of farms is in the admin flow | **Record recovery** by super-admin (cattle, scan, health report) has no UX surface or pattern. No "Restore" or "View Archived" affordance is shown in admin surfaces. |

---

## Section 3 — Requirements with No Coverage in the Spines

Genuine gaps — PRD requirements that have no corresponding UX pattern, surface, or component.

| # | PRD Requirement | Impact | Notes |
|---|---|---|---|
| FR-004 | Session idle timeout (8-hour default); configurable | Medium | No session-expiry UX state is defined: no timeout warning, no "Your session has expired, please log in again" interstitial, no redirect-on-expiry pattern. Users could lose unsaved annotation work silently. |
| FR-008 / FR-009 / FR-010 | Super-admin creates vet accounts; assigns vets to farms; removes vet assignments | High | Flow 3 only shows assigning a vet via a dropdown. **Vet account creation** is never shown (contrast with farmer creation, which is fully modeled in step 7–9). **Vet removal from a farm** (FR-010) has no UX surface, confirmation state, or consequence description (e.g., does the vet's pending scan queue for that farm freeze?). |
| FR-011 | Super-admin has read/write access to all cattle, scans, and health reports | Low–Medium | The super-admin Information Architecture never addresses this. Platform Overview and Farm Detail are specified, but there is no admin surface for browsing or editing cattle records, scan records, or health reports directly. A-4 states super-admin can edit cattle records via admin panel — no such panel surface is defined. |
| FR-012 | Platform Overview: per-farm stats showing cattle count, assigned vets, date of last scan | Medium | Flow 3 shows a farm card reading "0 Farmer · 0 Vets · 0 Cattle. Active" — but **date of last scan** (a required PRD stat) is absent from the card spec. The Platform Overview surface is mentioned but never fully component-specified. |
| FR-017 | Farmers cannot edit or delete cattle records; super-admin can edit directly | Medium | No UX pattern specifies what the farmer sees when they attempt to edit (read-only state, hidden edit controls, or disabled controls with explanatory text). The super-admin cattle editing path is also unspecified. |
| FR-019 | API key management by super-admin (per-device / per-source keys) | High | Entirely absent from the Information Architecture. No surface, no component, no flow. This is an operational capability the super-admin needs before any IoT device can submit scans. |
| FR-020 / FR-021 | API structured error responses (HTTP 422 for unrecognized cattle ID) | Low | API contract concerns, not web UI — but there is no developer-facing documentation surface or admin-visible scan rejection log. If a scan is rejected, no one in the UI is informed. An admin scan error log or rejection audit trail may be needed. |
| FR-022 | API spec is versioned; breaking changes require version bump | Low | Out of scope for web UI UX — but the super-admin surface should probably show current API version and possibly changelog. Not addressed. |
| FR-029 | Annotated image export as a combined image file | High | Completely absent from the Scan Viewer surface spec. No export button, no download affordance, no format specification (PNG, JPEG), no success/failure state for the export action. This is a named FR with no UX representation. |
| FR-033 (correction path) | Health report corrections require super-admin (A-10) | Medium | The PRD implies a correction workflow exists at the super-admin level, but no admin surface for viewing, locating, or editing submitted health reports is defined. Neither the Surface Map nor Flow 3 addresses this. |
| NFR-006 | Concurrent scan submissions (up to 10 devices/farm, 30/min platform-wide) | Low | No UX implication by itself — but if the system is under load and a submission is queued or delayed, there is no UX pattern for the vet-side scan queue to reflect "scan ingestion in progress" vs. "scan ready to review." |
| NFR-013 | Scan ingestion API 2-second response target | Low | Engineering NFR; no direct UX impact. Mentioned for completeness. |

---

## Section 4 — Open Questions with UX Implications

| OQ | Question | UX Implication | Status in Spines |
|---|---|---|---|
| **OQ-1** | What additional cattle record fields beyond the minimum (tag ID, name, breed, DOB, sex)? | Cattle Profile layout, Cattle Row density, and "Add Cattle" form fields all depend on the answer. The spines show tag ID, name, and breed but never model DOB or sex — and any additions will require a form and profile layout update. | Not addressed. The spines assume the minimum field set only. **Flag for UX:** form layout and profile card will need revision once OQ-1 is resolved. |
| **OQ-2** | Severity scale — three-tier (mild/moderate/severe) or numeric? | The Severity segmented control in Component Pattern 6 hardcodes "Mild / Moderate / Severe." If a numeric scale is chosen, the control type changes entirely (slider, number input, or radio group). | The spines assumed three-tier — consistent with A-9 — but this is flagged as unresolved in the PRD. If changed, the component spec must be revised. |
| **OQ-3** | Dashboard scan count — all-time or configurable window? | This is an active conflict: A-11 says all-time; Component Pattern 2 says "last 30 days." The label on the stat card, the data query, and potentially a filter control all change depending on the answer. | **Active discrepancy between PRD assumption and spine spec.** Must be resolved before FR-036 development. |
| **OQ-4** | Farmer alert — in-app, email, or both? | A-13 assumes both. EXPERIENCE.md specifies in-app thoroughly (toast + notification panel) but the email delivery surface is undesigned. If email-only is chosen, the notification panel and bell icon become unnecessary. | Partially addressed (in-app is designed; email is not). Resolution will add or remove a significant UX surface. |
| **OQ-5** | Empty vet digest — suppress or always send? | No direct UX surface impact (digest is email-only), but the super-admin configuration surface (where digest time and suppression rules might be managed) is absent regardless. | Not addressed in spines. Low UX risk unless an admin toggle for suppression is expected. |
| **OQ-6** | Environment data fields beyond temperature and humidity? | If additional fields are added (e.g., wind speed, UV index, barometric pressure), they need to be surfaced in the Scan Viewer alongside the thermal image. The current Scan Viewer spec shows no environment data panel at all. | Not addressed. The Scan Viewer surface makes no mention of displaying environment data to the vet, which is a gap independent of how OQ-6 is resolved. |
| **OQ-7** | Concurrent vet annotation on the same scan — supported or exclusive? | A-8 says not supported. The spines do not address what happens when a second vet opens the same scan while another has it open — no lock indicator, no "scan in use" warning, no conflict-resolution pattern is defined. | Not addressed. If OQ-7 resolves to "exclusive," the UX needs a scan-lock affordance. If concurrent, the merge/overwrite model needs specification. Either way, the spines are silent. |
| **OQ-8** | Recovery — a field on the health report or a separate vet action? | A-3 assumes it is a field. Component Pattern 6 implements it as a toggle ("Sick / Recovered"). If OQ-8 resolves to a separate action, the toggle disappears and a new explicit "Mark as Recovered" flow must be designed — possibly on the Cattle Profile or a dedicated action in the vet's Farm Cattle List. | The spines adopted A-3 (toggle in report form). If OQ-8 changes this assumption, the impact on the report form and cattle status update flow is significant. Flag this as a design dependency. |

---

## Summary

| Category | Count |
|---|---|
| Fully reflected | ~22 requirements |
| Partially reflected | 10 requirements |
| No coverage | 12 requirements |
| OQs with UX implications | 8 of 8 |

**Top 3 gaps by UX impact:**

1. **FR-029 — Annotated image export** is a named, non-negotiable functional requirement with zero UX representation. No button, no download affordance, no format or error state. Blocks vet workflow completion.
2. **FR-008/FR-009/FR-010 — Vet account creation and assignment management** is only partially modeled (assignment via dropdown in Flow 3) but vet account creation and vet removal from farms have no UX surface at all. Core admin workflow is incomplete.
3. **FR-019 / NFR-004 — API key management surface and session expiry UX** are both absent. API key management is a pre-requisite for any IoT device to submit scans (no keys = no scan ingestion = the core data pipeline is blocked). Session expiry with no warning or recovery state risks silent data loss for vets mid-annotation.
