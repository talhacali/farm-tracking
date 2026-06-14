---
name: Farm Tracking
status: final
created: 2026-06-14
updated: 2026-06-14
sources:
  - _bmad-output/planning-artifacts/prds/prd-farm-tracking-2026-06-14/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-farm-tracking-2026-06-14/DESIGN.md
---

# Farm Tracking — UX Experience Specification

## Foundation

Farm Tracking is a single-surface responsive web application built on React with shadcn/ui components and Tailwind CSS. It is an internal tool — no public sign-up, no self-service registration. All accounts are created by the Super-Admin.

The application's primary form factor is desktop (≥1024px). All surfaces are also usable on tablet and mobile through a responsive layout, but no surface has been designed mobile-first. The annotation canvas in the Scan Viewer enters a dedicated full-screen mode on small viewports.

Authentication is email/password. On successful login the server returns the user's role. The client renders a completely different navigation shell and surface set depending on that role — Farmer, Vet, or Super-Admin. No surface from one role's shell is reachable by another role; routing is guarded server-side and enforced on the client.

The visual identity reference is DESIGN.md. All color, typography, shadow, and component tokens used throughout this document reference DESIGN.md via `{colors.xxx}` and `{components.xxx}` syntax.

---

## Information Architecture

### Surface Map

| Surface | Role(s) | Reached from | Purpose |
|---|---|---|---|
| **Dashboard** | Farmer | Login redirect; sidebar nav | Herd overview — cattle count, sick count, scan count, 6-month trend chart |
| **Cattle List** | Farmer | Sidebar nav; sick count drill-down from Dashboard | Full list of cattle on the farm, filterable by health status |
| **Cattle Profile** | Farmer | Cattle List row click | Individual animal detail — tag ID, breed, health history, linked health reports |
| **Notification Panel** | Farmer | Bell icon in top bar | In-app alerts for new health reports; slide-in panel |
| **Farms Overview** | Vet | Login redirect; sidebar nav | List of farms assigned to the vet; entry point to each farm |
| **Farm Cattle List** | Vet | Farms Overview; farm switcher in sidebar | Cattle in a specific assigned farm, with health status |
| **Scan Queue** | Vet | Sidebar nav; "All Farms" or scoped to selected farm | Scans pending review and recently reviewed, ordered by submission date |
| **Scan Viewer + Annotation** | Vet | Scan Queue card click | Thermal image display with annotation canvas and health report form panel |
| **Health Report View** | Vet, Farmer | Scan Viewer (post-submit, vet); Cattle Profile (farmer); Notification Panel "View Report" link (farmer) | Read-only view of a submitted health report, with the annotated thermal image |
| **Platform Overview** | Super-Admin | Login redirect; sidebar nav | All farms, aggregate stats, farm status indicators |
| **Farm Detail / Management** | Super-Admin | Platform Overview farm card click | Edit farm name/status, view assigned farmer and vets, manage vet assignments |
| **User Management** | Super-Admin | Sidebar nav | Create and edit Farmer and Vet accounts; assign vets to farms |
| **API Key Management** | Super-Admin | Sidebar nav (Settings or dedicated nav item) | Issue, view, and revoke per-device / per-source API keys for scan ingestion |

→ Composition references: [`mockups/farmer-dashboard.html`](mockups/farmer-dashboard.html) · [`mockups/cattle-list.html`](mockups/cattle-list.html) · [`mockups/scan-queue.html`](mockups/scan-queue.html) · [`mockups/scan-viewer.html`](mockups/scan-viewer.html) · [`mockups/health-report.html`](mockups/health-report.html). Spines win on conflict.

### Navigation Shell

Each role has its own sidebar. The sidebar is persistent at desktop widths (≥1024px) and collapses to a hamburger Sheet trigger at smaller widths. The hamburger button appears in the top bar. The Sheet opens from the left and contains the same nav items as the desktop sidebar.

No cross-role navigation item is ever rendered. A vet never sees "Dashboard" (Farmer's). A farmer never sees "Scan Queue" (Vet's). Super-admin sees only admin surfaces.

---

## Voice and Tone

The product is operational. The people using it are working — a farmer doing morning rounds, a vet moving through a queue of scans, an admin setting up a new account. The interface does not celebrate or encourage. It reports accurately and tells the user what to do next when something fails.

**Principles:**
- Numbers before labels ("3 sick cattle," not "You have some sick cattle")
- Active voice, subject first ("Dr. Ayşe submitted a report," not "A report was submitted")
- Errors name the failure and the next action, not the system state
- No exclamation marks anywhere in the product
- No onboarding cheerleading ("Let's get started," "You're all set," "Great job")

### Microcopy Do / Don't

| Context | Do | Don't |
|---|---|---|
| Cattle health badge (sick) | `Sick` | `Not feeling well` |
| Empty Scan Queue | `No scans pending review.` | `You're all caught up! Great work.` |
| Report submitted | `Report submitted. Bella's status updated to Sick.` | `Report saved successfully!` |
| Health alert toast | `Bella — Mastitis (Moderate). View Report.` | `A new health alert has been created for one of your cattle.` |
| Required field missing on report form | `Sickness name is required.` | `Please fill in all the fields before continuing.` |
| Farm deactivated warning | `This farm is deactivated. Data is preserved. New scans are not accepted.` | `Oops! This farm isn't active right now.` |

---

## Component Patterns

### 1. Cattle Row (Cattle List)

Each row in the Cattle List renders four pieces of information inline: health badge, tag ID, name, and breed. The row is a full-width clickable target that opens the Cattle Profile for that animal.

- **Health badge:** Two states — `Healthy` (uses #DCFCE7 background, #14532D text label) and `Sick` (uses {components.sick-stat-card} treatment: {colors.accent} (#D97706) background, white label, subtle pulse animation to draw attention without alarming).
- Tag ID is displayed in a monospace variant to distinguish it from free-text fields.
- Name and breed are plain text; breed is de-emphasized with {colors.muted-foreground}.
- On hover the row background shifts to {colors.muted} (#F1F0EE). No separate click target — the entire row is the link.
- On mobile (sm), breed may be truncated to one line with an ellipsis; tag ID and name always visible.

### 2. Dashboard Stat Card (Farmer)

The farmer Dashboard contains three stat cards and one trend chart in a 2×2 grid at md and a single row at lg:

1. Total Cattle
2. Sick Cattle
3. Total Scan Records (all-time)
4. 6-month scan count trend chart (see Section 3)

Each stat card follows a consistent layout: large number at top, label below, optional icon top-right.

- **Sick Cattle card** uses {components.sick-stat-card} treatment: {colors.accent} (#D97706) border-left accent and number color. The sick count number is rendered as an anchor element. Clicking it navigates to Cattle List with the health filter pre-set to "Sick." The link styling is suppressed — the number looks like data, not a hyperlink, until hovered (underline appears).
- Cards with a zero value are not hidden. Zero is meaningful data.

### 3. 6-Month Trend Chart (Farmer Dashboard)

A vertical bar chart showing scan activity for the most recent 6 calendar months (current month through 5 months prior, ordered left-to-right oldest to newest).

- X-axis: abbreviated month names (Jan, Feb, Mar…). Always 6 labels, even if some months have no data.
- Y-axis: scan count, integer, minimum 0.
- Zero-scan months render a zero-height bar stub (2px tall, {colors.muted} fill) so the column position remains visible. The month label is still present. Bars are never omitted.
- Fewer than 6 months of historical data: render available months left-aligned. Empty slots to the right remain as labeled columns with zero-height stubs.
- Bar fill: {colors.primary} for standard months; {colors.destructive} tint for months where sick count exceeded a threshold (TBD with product).
- Chart is non-interactive at v1 — no tooltips, no click-through. Resize-responsive: at sm the chart scrolls horizontally rather than compressing bars.

### 4. Scan Card (Scan Queue)

Each scan in the Scan Queue is a card showing:

- Thumbnail of the thermal image (fixed 80×80px, object-cover, rounded border)
- Cattle name and tag ID (stacked)
- Farm name (de-emphasized, {colors.muted-foreground})
- Date submitted (relative: "2 hours ago"; absolute on hover in a tooltip)
- Status chip: `Pending Review` (amber tint: #D97706 at 15% opacity background, #D97706 border and text) or `Reviewed` (green tint: #DCFCE7 background, #14532D text and border)

The entire card is a click target that opens the Scan Viewer for that scan. Cards are ordered newest-first. Reviewed cards appear in the All tab; the Pending Review tab filters to pending only.

### 5. Annotation Canvas (Scan Viewer)

The annotation canvas is an overlay rendered directly on top of the thermal image in the Scan Viewer. It does not obscure image content — shapes are drawn in translucent {colors.accent} (amber) stroke-only outlines with no fill.

- **Tools (toolbar above canvas):** Circle (default, keyboard: `C`), Ellipse (`E`), Undo Last Shape, Clear All. Active tool is visually distinguished with {colors.primary} background on its icon button.
- **Drawing:** Click and drag to draw. Circle snaps to equal width/height from the drag origin. Ellipse uses natural drag dimensions. Both tools constrain to the canvas boundary — the shape clips at the image edge and cannot extend outside it.
- **Undo:** Removes the last-drawn shape. Repeatable until no shapes remain. Clear All removes all shapes with a single confirmation (inline: "Clear all annotations? This cannot be undone." with Confirm / Cancel inline — not a modal dialog).
- **Annotation is not required.** The vet may proceed to submit a health report without drawing any shapes. The report form is available whether or not the canvas has shapes.
- **Save Annotations:** A "Save Annotations" button below the toolbar persists the current shape set to the database via `scans.saveAnnotations`. Saving with no shapes sets the annotation to null. Saved annotations survive session expiry and browser refresh — the canvas re-initialises with them on next open. Navigating away with *unsaved* shapes (drawn since the last save) triggers a browser-native "Leave page?" confirmation. Already-saved shapes are never lost on navigation.
- **Export:** An "Export Image" button sits below the canvas (not in the toolbar). Clicking it downloads the thermal image with annotation overlays composited as a single image file (PNG). The button is always visible; if no annotations are present the base thermal image is exported without overlays. Export does not require a report to be submitted first.

### 6. Health Report Form (Scan Viewer)

The report form slides in as a panel to the right of the annotation canvas at lg. At sm it stacks below the canvas.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| Sickness name | Text input | Yes | Free text; no autocomplete at v1 |
| Severity | Segmented control | Yes | Three options: Mild / Moderate / Severe |
| Treatment | Textarea | No | Placeholder: "Recommended treatment or notes (optional)" |
| Recovery status | Toggle (two-state) | Yes | Sick / Recovered |

- Submit button is disabled until all required fields have values. The button label reads "Submit Report" when enabled, "Fill required fields" (grayed) when not.
- Required field errors appear inline below the field on blur, not on submit attempt.
- On submit, a confirmation dialog opens (shadcn `AlertDialog`): "Submit this report? It cannot be edited after submission." with Cancel and Confirm buttons.

### 7. Notification Badge and Panel (Farmer)

A bell icon sits in the top bar for Farmer users. The badge is an amber dot ({colors.accent}) overlaid on the icon showing the count of unread notifications. At counts above 9, the badge shows "9+".

- Clicking the bell opens a slide-in panel from the top-right (shadcn `Sheet`, position right, width 380px at lg, full-width at sm).
- The panel is announced via `aria-live="polite"` when it opens.
- Each notification item shows: cattle name (bold), sickness and severity (one line), time received, and a "View Report" text link.
- Notifications are marked read when the panel is opened (all items) — not on individual click.
- Empty state: "No notifications." (single line, centered, {colors.muted-foreground}).

### 8. Farm Switcher (Vet)

A dropdown in the vet's sidebar showing the farms assigned to them. It renders above the primary nav items.

- Default selection on login: "All Farms" (aggregate view across all assigned farms).
- Options: one entry per assigned farm, plus "All Farms" at the top of the list.
- Selecting a farm immediately scopes the Farm Cattle List and Scan Queue to that farm. The URL updates to include the farm ID (e.g., `/vet/farms/123/scan-queue`).
- Selecting "All Farms" shows the aggregate Scan Queue across all assigned farms and a combined Farm Cattle List. URL: `/vet/scan-queue`.
- Browser back/forward restores the previously selected farm scope.
- If the vet has only one assigned farm, the switcher still renders (no special single-farm treatment) to keep the layout predictable.

### 9. User Management (Super-Admin)

The User Management surface handles both Farmer and Vet account lifecycle.

**Account creation (both roles):**
- "Add Farmer" and "Add Vet" are separate primary action buttons on the User Management page.
- Each opens a right-side Sheet with a creation form: First name, Last name, Email, temporary password (auto-generated and shown once). Role is set by which button was clicked — not a field on the form.
- On create: the account is active immediately. Credentials are displayed in the Sheet for the admin to copy and share manually. No in-app invite email at v1. [ASSUMPTION]

**Vet-to-farm assignment (from Farm Detail):**
- The Assigned Vets section on Farm Detail lists currently assigned vets with a "Remove" action on each row.
- "Remove" is an inline button (not a menu item). Clicking it shows an inline confirmation: "Remove Dr. Ayşe from this farm? She will lose access immediately." with Confirm / Cancel inline (no modal).
- On confirm: the vet's farm scope is updated immediately; they are redirected to Farms Overview on their next page load if they were viewing a surface scoped to the removed farm.
- "Assign Vet" button opens a dropdown of all vet accounts not already assigned to this farm.

**API Key Management:**
- Listed under a "Settings" or "API Keys" nav item in the Super-Admin shell.
- Each key entry shows: key name/label, source type (IoT device or mobile), date created, last used, and a "Revoke" action.
- Revoking a key requires inline confirmation. Revoked keys are shown with a `Revoked` badge for 30 days before being hidden. [ASSUMPTION: 30-day grace period for audit visibility]
- "Issue New Key" opens a small form: key label, source type selection. On create, the key value is shown once in a copy-to-clipboard field and never again.

---

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold load (skeleton) | All list surfaces (Cattle List, Scan Queue, Farms Overview, Platform Overview) | shadcn `Skeleton` blocks in place of each row/card. Sidebar and top bar render immediately. Skeletons match the height of a real row to prevent layout shift. |
| No cattle yet | Cattle List (Farmer + Vet) | Full-width empty state block: icon (a simple cattle silhouette), "No cattle on this farm yet." If user is Super-Admin: add a subtle note "Add cattle through the Farm Detail page." |
| No scans yet | Scan Queue | Empty state: "No scans in the queue." No call to action (scan ingestion is not a UI action). |
| All cattle healthy (zero sick) | Dashboard stat card | Sick Cattle card shows `0` in #14532D color instead of {colors.destructive}. No badge pulse. The `0` is still a link to Cattle List filtered to Sick but the destination will be empty. |
| Annotation in progress | Scan Viewer canvas | Unsaved shapes (drawn since last save) are shown at slightly lower opacity than saved shapes. A "Save Annotations" button persists the current shape set to the database. Navigating away with unsaved shapes triggers a browser-native "Leave page?" confirmation; already-saved shapes are safe. A "Annotations saved." toast appears on successful save (3s). |
| Report submitted successfully | Scan Viewer | Report form panel replaced by a read-only Health Report View. Success toast appears bottom-right for 5 seconds: "Report submitted. [Cattle name]'s status updated." Scan card in queue updates status chip to `Reviewed`. |
| Farm deactivated (Super-Admin view) | Platform Overview, Farm Detail | Farm card shows a `Deactivated` badge ({colors.muted} background). Farm Detail renders a top-of-page banner: "This farm is deactivated. Data is preserved. New scans are not accepted." Banner uses {colors.warning} background. A "Reactivate" button appears in the Farm Detail header. |
| Empty vet scan queue | Scan Queue | Empty state: "No scans pending review." No animation, no illustration beyond a simple inbox icon. |
| Notification panel empty | Notification Panel | "No notifications." centered in panel body. Bell icon badge does not render when count is zero. |
| Session idle timeout warning | All surfaces | At 7h 45min of inactivity (15 minutes before the 8-hour default expiry), a shadcn `AlertDialog` appears: "Your session will expire in 15 minutes. Stay logged in?" with "Stay logged in" (resets timer) and "Log out" buttons. If no action is taken, the session expires and the user is redirected to the login page with message: "Your session expired. Log in again." Any unsaved annotation canvas state is lost — the warning gives the vet time to submit or export before expiry. |

---

## Interaction Primitives

### Annotation Drawing

The vet draws by clicking and dragging on the canvas overlay. Circle tool (default): the drag origin is the center; the radius is the distance to the cursor on release. Ellipse tool: drag origin is top-left corner; release point defines width and height. Both tools constrain shapes to the canvas boundary — if the user drags past the edge, the shape clips at the image border and does not extend outside it.

Undo removes the last drawn shape (stack-based; repeatable). Clear All shows an inline prompt — not a modal — and removes all shapes on confirmation.

Keyboard equivalent: `C` activates circle tool, `E` activates ellipse tool, `Ctrl+Z` / `Cmd+Z` triggers undo.

### Farm Switching (Vet)

Selecting a farm from the sidebar dropdown is an immediate navigation action — no confirmation, no loading state beyond the standard skeleton. The URL updates to reflect the selected farm. Browser back restores the previous farm scope. The farm switcher selection persists in URL state, not in local storage, so a shared link opens the correct farm context.

### Report Submission Flow

1. Vet fills all required fields in the report form panel.
2. Vet clicks "Submit Report."
3. shadcn `AlertDialog` opens: "Submit this report? It cannot be edited after submission." Two buttons: "Cancel" (closes dialog, returns to form) and "Confirm" (proceeds).
4. On confirm: report is saved, cattle health status updates per FR-016, farmer notification is triggered.
5. Success toast appears: "[Cattle name] — report submitted." (5-second auto-dismiss, also manually dismissible).
6. Report form panel transitions to read-only Health Report View.
7. Scan card in the Scan Queue updates status chip to `Reviewed` (reflected on next queue load or via optimistic update).

### Sick Count Drill-Down (Farmer)

Clicking the Sick Cattle stat card number on the Dashboard navigates to `/farmer/cattle?health=sick`. On arrival the Cattle List renders with a health filter chip visible at the top of the list: `Sick ×`. The chip is removable — clicking `×` clears the filter and shows all cattle. The URL parameter is also cleared. The filter is not persisted between sessions.

### In-App Notification (Farmer)

When a health report is submitted for a cattle on the farmer's farm:
- A `notifications` row is inserted server-side. Within up to 30 seconds, the `NotificationBell`'s poll detects the unread count increase and fires a toast at bottom-right: "You have a new health alert. Open notifications." The toast persists for 8 seconds and has a manual close button.
- The bell badge count increments on the next poll cycle (within 30 seconds of report submission).
- Clicking the bell opens the Notification Panel, which lists full notification detail: cattle name, sickness, severity, and a link to the health report.
- Opening the Notification Panel marks all items read (badge clears).

### Banned Interactions

The following patterns are prohibited in this product:

| Banned | Reason |
|---|---|
| Drag-to-reorder | No ranked lists; creates accessibility burden |
| Infinite scroll | Pagination preserves position and is predictable on slow connections |
| Hover-only affordances | Inaccessible on touch; all affordances must be visible or keyboard-reachable |
| Modal stacks deeper than 1 level | Creates disorienting context; the confirmation dialog is the maximum modal depth |

---

## Accessibility Floor

Farm Tracking targets WCAG 2.2 AA compliance across all surfaces.

### Color and Contrast

All text against its background meets the 4.5:1 contrast ratio at normal size and 3:1 at large size. Status colors (sick/healthy badges, warning banners) never rely on color alone — a text label is always present alongside the color.

### Keyboard Navigation

- Tab order follows visual reading order (left-to-right, top-to-bottom) on all surfaces.
- Cattle List and Scan Queue are navigable with arrow keys when a row/card is focused (`↑`/`↓` to move, `Enter` to open).
- All interactive controls — buttons, links, form fields, the farm switcher dropdown — are reachable by Tab and operable by Enter or Space.
- Focus rings use shadcn's `ring` token. Focus is never suppressed on interactive elements.

### Annotation Canvas Keyboard Fallback

The annotation canvas provides a keyboard alternative to mouse drawing:

- Tab to focus the canvas area.
- `C` / `E` to select circle or ellipse tool.
- Arrow keys move a position cursor within the canvas (16px increments; hold Shift for 4px fine control).
- `Enter` or `Space` starts and commits the shape at the current position with a default size.
- `Ctrl+Z` / `Cmd+Z` undoes the last shape.
- Screen reader announcement on canvas focus: "Annotation canvas. [Tool name] tool active. [N] shapes drawn."
- Screen reader announces shape addition: "Circle added. [N] shapes total."

### Forms

- All form fields have visible `<label>` elements. Placeholder text is supplementary only — it is never the sole label.
- Required fields are marked with `aria-required="true"` and a visible asterisk adjacent to the label.
- Inline validation errors are associated with their field via `aria-describedby`.

### Dynamic Content

- Notification panel uses `aria-live="polite"` on the container so screen readers announce it when it opens.
- Toast notifications use `role="status"` and `aria-live="polite"`.
- The confirmation dialog (`AlertDialog`) traps focus within it while open and restores focus to the trigger element on close.

---

## Responsive and Platform

| Breakpoint | Layout behavior |
|---|---|
| **≥1024px (lg)** | Persistent sidebar (240px wide). Main content area fills remaining width. Dashboard stat cards in a single row (4 columns). Scan Viewer: annotation canvas and report form panel side by side (60/40 split). Notification panel slides in as a 380px right Sheet. |
| **768–1023px (md)** | Sidebar collapses to an icon-only rail (48px wide) showing icon + tooltip on hover. Dashboard stat cards in a 2×2 grid. Scan Viewer: annotation canvas full-width above; report form panel scrolls below. Notification panel slides in as a 320px right Sheet. |
| **<768px (sm)** | Sidebar hidden; hamburger icon in top bar opens a full-width left Sheet with the nav items. Dashboard stat cards in a 2×2 grid. Annotation canvas enters full-screen mode (fills viewport minus top bar); a "Done annotating" button returns to the split view. Report form stacks below the canvas. Notification panel is full-width Sheet from top. 6-month trend chart scrolls horizontally. |

Touch targets are a minimum of 44×44px on all interactive elements at all breakpoints.

---

## Key Flows

### Flow 1 — Farmer Checks Herd Health

**Protagonist:** Mehmet, dairy farmer with 47 cattle. It's 7am; he's in the barn.

1. Mehmet opens Farm Tracking on his phone browser and logs in with his credentials.
2. He lands on his Dashboard. The four stat cards load: 47 cattle total, 3 sick, 12 scans this month, last report yesterday.
3. The Sick Cattle card shows `3` in {colors.accent}. He taps it.
4. Cattle List loads, pre-filtered to Sick. A filter chip at the top reads `Sick ×`. Three rows appear: Bella, Kara, Duman.
5. Mehmet taps the row for Bella.
6. Bella's Cattle Profile opens. He sees her tag ID, breed, and health history. Under "Latest Health Report" he sees a report from Dr. Ayşe dated yesterday: Mastitis, Moderate.
7. He taps "View Report."
8. Health Report View opens. He sees the thermal image with an amber circle drawn around the left flank. Below the image: Sickness — Mastitis. Severity — Moderate. Treatment — Antibiotic course, 5 days. Recovery status — Sick.

**Climax:** Mehmet sees exactly where the problem is and what to do. He knows before he calls Dr. Ayşe. He closes the report and moves on to Kara.

**Failure path:** If the network drops between the Dashboard and the Cattle Profile, the app shows a full-page error state: "Could not load cattle profile. Check your connection and try again." with a Retry button. The filter state is preserved in the URL so returning via browser back restores the filtered Cattle List.

---

### Flow 2 — Vet Reviews Scan and Creates Health Report

**Protagonist:** Dr. Ayşe, visiting vet. She's at her clinic desk, desktop browser.

1. Dr. Ayşe logs in. She lands on Farms Overview — two farms assigned to her.
2. She selects "Mehmet's Farm." The sidebar farm switcher updates; the URL becomes `/vet/farms/12/scan-queue`.
3. Scan Queue shows 2 cards with `Pending Review` chips. Both are for Bella, submitted within the last 24 hours.
4. She clicks the first scan card.
5. Scan Viewer opens. The thermal image fills the left panel. The annotation canvas is overlaid. The report form panel is on the right.
6. She clicks the Circle tool. She clicks and drags on the left-flank hotspot in the image. An amber circle appears around the area.
7. She opens the report form. She types "Mastitis" in Sickness name. She selects "Moderate" in the Severity segmented control. She types "Antibiotic course, 5 days" in Treatment. She sets Recovery status to "Sick."
8. The Submit Report button enables. She clicks it.
9. The confirmation `AlertDialog` appears: "Submit this report? It cannot be edited after submission." She clicks "Confirm."
10. A success toast appears: "Bella — report submitted." The report form transitions to read-only. The scan card she opened now shows `Reviewed`.

**Climax:** Dr. Ayşe does not need to navigate away. She sees Bella's card flip to `Reviewed` and knows Mehmet was just notified. She presses browser back — or clicks the second scan card in the queue — and moves on immediately.

**Failure path:** If the report submission fails (network error or server error), the confirmation dialog closes and an inline error appears at the top of the report form: "Submission failed. Your annotations and report text are preserved. Try again." The form remains editable. No data is lost.

---

### Flow 3 — Super-Admin Onboards a New Farm

**Protagonist:** Admin (platform operator). Desktop, admin panel.

1. Admin logs in. Lands on Platform Overview — a grid of farm cards.
2. Admin clicks "Add Farm" in the page header.
3. A form slide-in panel (right Sheet) opens with a single required field: Farm Name. Admin types "Mehmet's Farm" and clicks Save.
4. The new farm card appears on Platform Overview: "Mehmet's Farm — 0 Farmer · 0 Vets · 0 Cattle. Active."
5. Admin clicks the farm card to open Farm Detail.
6. Farm Detail shows sections: Farm Info, Assigned Farmer (empty), Assigned Vets (empty), Cattle (empty).
7. Admin clicks "Add Farmer" in the Assigned Farmer section.
8. A user-creation form opens in the same panel: First name, Last name, Email, temporary password. Admin fills in Mehmet's details and clicks "Create Account."
9. Mehmet's name now appears under Assigned Farmer.
10. Admin clicks "Assign Vet." A dropdown appears listing all vet accounts on the platform. Admin selects "Dr. Ayşe." Clicks Save.
11. Farm Detail updates: Assigned Vets now shows Dr. Ayşe.

**Climax:** Admin switches back to Platform Overview. The farm card for "Mehmet's Farm" now reads: "1 Farmer · 1 Vet assigned · 0 Cattle. Active." The farm is live. The next action belongs to Mehmet — he will log in and add his cattle.

**Failure path:** If Admin tries to assign a vet who is already at their maximum assigned farms (a business rule enforced server-side), the Save returns an inline error: "Dr. Ayşe is already assigned to the maximum number of farms. Contact support to adjust this limit." The farm is saved but the vet assignment is not applied. The Admin can choose a different vet from the dropdown without losing the farm or the farmer assignment.
