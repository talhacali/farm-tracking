# PRD Quality Review — Farm Tracking

## Overall verdict

This PRD is structurally solid and unusually honest for a draft: it names omissions explicitly, ties Open Questions to specific FRs, and includes a counter-metric. The two genuine risks are done-ness clarity — several FRs describe capability without a testable consequence, which will generate ambiguity in story creation — and a thin performance/NFR section that stops at latency targets without covering scale assumptions, error rate budgets, or concurrent-user bounds.

---

## Decision-readiness — adequate

The PRD makes real decisions and names them as decisions. The role model (three roles, hard scoped) is stated without hedging. Non-Goals are written as actual non-goals, not as "future considerations." Open Questions are keyed to specific FRs with owners and revisit conditions — this is better than most drafts at this stage.

Two areas fall short of strong. First, the success metrics (§2 Goals) are directional but lack targets: "percentage of scans reviewed within 48 hours" has no stated acceptable threshold, so a decision-maker cannot use it to evaluate launch readiness. Second, the alert delivery question (OQ-4) is left open, but FR-039–FR-040 describe the farmer alert as if the channel is known, and FR-042 commits the vet digest to email. The OQ and the FRs are in mild tension — a reader who notices will wonder whether FR-039 is a real decision or a placeholder.

The `[NOTE FOR PM]` convention is not used anywhere in the PRD. All tensions are surfaced as `[ASSUMPTION]` or Open Questions, which is acceptable but means there is no signal distinguishing "we assumed this and it's probably fine" from "this is a real unresolved tension that could change scope."

### Findings
- **medium** Missing SM thresholds (§2 Success Metrics) — All four SMs are directional ratios with no targets. The counter-metric threshold is called out as "agreed threshold" without stating what that threshold is or who owns it. A decision-maker cannot use these to evaluate launch readiness. *Fix:* Add provisional targets (even if rough) or explicitly tag each SM as "baseline TBD — revisit at launch" so the gap is acknowledged, not implicit.
- **low** OQ-4 / FR-039 channel tension (§4.8 and §6) — FR-039 leaves delivery channel open via OQ-4, but FR-042 commits the vet digest to email without a matching open question. This asymmetry will confuse implementers. *Fix:* Either close OQ-4 as a PRD decision or tag FR-039 with `[ASSUMPTION: email + in-app, pending OQ-4]` to match the pattern used elsewhere.

---

## Substance over theater — strong

This PRD avoids the most common forms of theater. There are no inflated persona sections — the three roles (§3) map directly to features. Each persona section is two sentences describing scope and restriction, not a marketing narrative. There is no "differentiation" section that doesn't differentiate anything.

The NFR section (§5) avoids pure boilerplate in most places: access control NFRs (NFR-001 through NFR-005) are role-specific, not generic; performance NFRs (NFR-011 through NFR-013) give time bounds against specific features. The weak spot is NFR-006 ("handle concurrent submissions without data loss or duplication"), which is a real requirement but states no bound — how many concurrent submissions? What constitutes "normal load"? This is the one NFR that reads like furniture.

The Vision/Problem statement (§1) is specific to the product — thermal imaging ingestion + vet annotation + farmer visibility — and would not swap cleanly into a generic farm management PRD.

### Findings
- **medium** NFR-006 is unbounded (§5.2) — "concurrent submissions from multiple IoT devices and mobile apps" has no numeric floor. Without a device count or submission rate assumption, an architect cannot validate whether a simple queue or a more robust ingestion design is needed. *Fix:* Add `[ASSUMPTION: up to N devices per farm, peak M submissions/minute]` or move the concurrency bound to an Open Question.

---

## Strategic coherence — strong

The PRD has a clear thesis: thermal scan data is underused because there is no structured workflow connecting ingestion → vet review → report → farmer awareness. Every major feature cluster (Scan Ingestion API, Scan Viewer + Annotation, Health Reports, Farmer Dashboard, Alerts) maps to a stage of that workflow. Nothing in the feature list is obviously off-thesis.

Scope prioritization is coherent: the external vet mobile app is out of scope but the API contract it consumes is in scope, which is the right call for an internal platform. Automated diagnosis is explicitly excluded. The MVP boundary feels like a real MVP — the minimum needed to close the ingestion-to-awareness loop.

Success metrics (§2) mostly validate the thesis: scan-to-report time and 48-hour review rate measure workflow throughput, which is what the thesis cares about. The farmer daily active usage rate is slightly off-thesis (the thesis is about awareness, not engagement), but it is defensible as a proxy. Counter-metric is present and specific.

No findings — this dimension holds up.

---

## Done-ness clarity — thin

This is the dimension that will cause the most friction in story creation. Several FRs describe what the system does without stating what "done" looks like:

- **FR-006** ("Super-admin can create, view, edit, and deactivate farms") — "deactivate" has no stated consequence. Does deactivating a farm hide it from all users? Block new scans? Preserve historical data? FR-006 combined with NFR-009 (soft-delete only) implies the data is preserved, but the behavioral consequence for active users is unstated.
- **FR-026** ("Vets can annotate a scan by drawing circles or ellipses") — no constraint on the annotation UI behavior: minimum/maximum number of annotations, undo behavior, whether partial annotations can be saved or only completed ones.
- **FR-030** ("A vet creates a health report from the scan viewer, after annotating the scan") — the sequencing constraint ("after annotating") is stated but what happens if a vet tries to create a report without annotating is not. Is annotation mandatory? FR-031 lists the report fields but does not mark any as required vs. optional.
- **FR-036** (Farmer dashboard) — lists four metrics but states no layout, no empty-state behavior, and the chart (monthly scan count trend) has no spec for what the x-axis and y-axis show or how months with zero scans are rendered.
- **FR-037** ("Dashboard data refreshes on page load") — acceptable, but "standard broadband connection" in NFR-011 is the only performance bound and it covers only the dashboard. The scan viewer load target (NFR-012, 5 seconds) is reasonable but "interactive" is an adjective, not a testable state — interactive means the canvas accepts input, not just that the image is displayed.

The FRs that are done well: FR-020 through FR-023 (API responses) are testable. FR-016 (cattle health status state machine) is precise. FR-028 (annotation overwrite) is clear. FR-038 (sick count link) is clear.

### Findings
- **high** FR-031 field optionality unspecified (§4.6) — The health report fields listed in FR-031 include free text ("recommended treatment"), a linked enum ("severity"), and auto-populated fields. No field is marked required vs. optional. A vet could submit an empty diagnosis name; an empty treatment field may or may not be valid. *Fix:* Mark each field as required or optional. Minimum: flag the diagnosis / sickness name and severity as required.
- **high** FR-006 deactivate consequence unstated (§4.2) — "Deactivate farms" has no stated behavioral consequence for farmers and vets currently assigned to that farm. *Fix:* Add one sentence: e.g., "Deactivating a farm blocks new scan ingestion and hides the farm from non-admin users; existing records are preserved (per NFR-009)."
- **medium** FR-026 annotation constraints missing (§4.5) — No upper bound on annotations per scan, no undo behavior specified, no clarity on whether a scan can be saved with zero annotations. *Fix:* Add explicit constraints: minimum 0 annotations allowed (annotation is not mandatory for report creation) or minimum 1; maximum N per scan; undo supported or not.
- **medium** NFR-012 "interactive" is an adjective (§5.4) — "Must be interactive within 5 seconds" does not define interactive. *Fix:* Replace with "canvas must accept input (pan, draw) within 5 seconds of page open."
- **medium** FR-030 annotation-before-report enforcement ambiguous (§4.6) — "After annotating the scan" does not state whether annotation is enforced or advisory. A vet who skips annotation: can they still submit a report? *Fix:* Add one line — either "Annotation is required before a report can be submitted" or "Annotation is recommended but not enforced."
- **low** FR-036 chart spec absent (§4.7) — Monthly scan count chart has no axis spec, no empty-state behavior, no behavior when fewer than 6 months of data exist. *Fix:* Either add a one-line spec or tag with `[NOTE FOR PM: UX to define chart behavior]`.

---

## Scope honesty — strong

This is the strongest dimension in the PRD. Non-Goals (§2 and §7) are written twice — once as bullets in §2, again in §7 — and they are consistent. Each exclusion is specific and would otherwise be silently assumed: the external vet mobile app, automated diagnosis, farmer-to-vet messaging.

The `[ASSUMPTION: …]` pattern is used correctly and consistently: 12 inline assumptions across the FRs, each tagged and most keyed to an Open Question. Assumptions Index is not present as a standalone section, but the Open Questions table (§6) functions as one — every major assumption that needs resolution is represented there with an owner and revisit condition.

The OQ table is particularly well-formed: owners are named (not "TBD"), revisit conditions are FR-specific rather than vague ("before FR-013 development" is a real gate). This is actionable.

One gap: FR-017 ("Farmers cannot edit or delete cattle records once created") assumes corrections require super-admin intervention but does not flag what the super-admin correction workflow looks like. This is probably fine for MVP but could be mistaken for "corrections are impossible."

### Findings
- **low** FR-017 correction path implicit (§4.3) — "Corrections require super-admin intervention" (inline assumption) does not state whether super-admin can edit cattle records directly or whether there is a formal correction request flow. *Fix:* Add `[ASSUMPTION: super-admin can edit cattle records directly via the admin panel; no formal correction-request workflow exists for MVP]`.

---

## Downstream usability — adequate

The PRD will support story creation adequately but has several traceability gaps that will slow an architect or story writer.

**Glossary:** No dedicated Glossary section. Domain nouns are used consistently within the PRD — "scan," "health report," "farm," "cattle," "annotation" appear to be used with single meanings throughout. However, "scan record" (FR-023) and "scan" are used interchangeably. "Scan result" appears in FR-027 ("modified scan result") but is not defined — it appears to mean the annotated image, but this is not explicit. "Active annotation set" (FR-028) is not defined elsewhere.

**ID continuity:** FR IDs run FR-001 through FR-043 with no visible gaps. NFR IDs run NFR-001 through NFR-013 with no visible gaps. OQ IDs run OQ-1 through OQ-8. Inline `[ASSUMPTION — see OQ-N]` references all resolve to entries in the OQ table. Cross-references between FRs (FR-016 referenced from FR-032, FR-031 referenced from FR-031 itself) appear to resolve.

**UJ coverage:** No User Journey section exists. For this internal tool shape, this is acceptable (see Shape Fit below) — the workflow is described inline via the problem statement and feature ordering, which is sufficient for a two-role operational tool. An architect can trace the workflow from FR-018 (ingestion) → FR-024–FR-029 (vet review) → FR-030–FR-035 (report) → FR-036–FR-043 (farmer awareness).

**API spec:** FR-022 / NFR-007 reference a versioned published API spec, but the spec itself is not included or referenced. Downstream API integration work will need to generate this from FRs 018–023, which is workable but not ideal.

### Findings
- **medium** No Glossary; "scan result" undefined (§4.5 FR-027) — "Modified scan result" appears once and is not defined. An implementer might interpret this as a new entity vs. a view of the annotated image. *Fix:* Add a 5-entry Glossary section (scan, scan record, health report, annotation, scan result) or inline-define "scan result" in FR-027.
- **low** API spec not referenced (§4.4, §5.2) — FR-022 and NFR-007 commit to a versioned published API spec, but no link, attachment, or working title for that spec is provided. *Fix:* Add `[NOTE FOR PM: API spec to be authored as a companion document before FR-018 development begins]`.

---

## Shape fit — strong

This PRD is correctly shaped for its product type: an internal operational tool with three role types, not a consumer product. It does not over-formalize with UJ sections or persona narratives; the three role descriptions (§3) are brief and functional. Features are organized by capability cluster (ingestion, annotation, reporting, notifications), which is the right shape for a tool that different roles use in sequence rather than concurrently.

The absence of a formal UJ section is appropriate given the product shape. The workflow is recoverable from feature sequencing and the problem statement. An explicit E2E flow description (scan arrives → vet reviews → report created → farmer notified) would help a new reader orient, but its absence is not a usability blocker given the feature ordering.

The Super-Admin role is correctly treated as platform infrastructure (§4.2) rather than a primary user, which matches its operational reality.

No findings — shape is well-matched to product type.

---

## Mechanical notes

**Glossary drift:** "scan" and "scan record" are used interchangeably (FR-018, FR-023, FR-024). "Scan result" appears only in FR-027. "Active annotation set" (FR-028) is an undefined term. No other significant drift detected.

**ID continuity:** FR-001 through FR-043, NFR-001 through NFR-013, OQ-1 through OQ-8 — all contiguous. No gaps or duplicates found.

**Assumptions Index roundtrip:** Inline `[ASSUMPTION]` tags appear at FR-004, FR-013, FR-016, FR-017, FR-019, FR-028, FR-033, FR-036, FR-037, FR-039, FR-041, FR-043, FR-147 (severity in FR-031). All assumptions that reference an OQ number resolve to a table entry. Assumptions without an OQ reference (FR-004 "default 8 hours," FR-017 "corrections require super-admin," FR-019 "per-device keys," FR-033 "corrections require super-admin," FR-037 "on-load refresh is sufficient") are low-risk but are not independently tracked. A standalone Assumptions Index would catch these.

**Section duplication:** Non-Goals appear in both §2 and §7. The content is consistent, but the duplication will require keeping both in sync as the PRD evolves.

**Missing section:** There is no Assumptions Index as a standalone section. The OQ table partially substitutes for it, but assumptions without OQ references (noted above) are invisible in the table.
