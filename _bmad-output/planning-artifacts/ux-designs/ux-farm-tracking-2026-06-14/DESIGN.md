---
name: Farm Tracking
status: final
created: 2026-06-14
updated: 2026-06-14
sources:
  - _bmad-output/planning-artifacts/prds/prd-farm-tracking-2026-06-14/prd.md

colors:
  primary: "#1E3A5F"
  primary-foreground: "#FFFFFF"
  accent: "#D97706"
  accent-foreground: "#1A0E00"
  background: "#FAFAF8"
  card: "#FFFFFF"
  muted: "#F1F0EE"
  muted-foreground: "#6B6B6B"
  border: "#E2E1DF"
  # All other shadcn color tokens inherit defaults.

typography:
  body: inherit # Inter or system-ui via shadcn defaults
  labels: inherit
  captions: inherit
  display: none # No display font — operational tool, not editorial
  # All type is sans-serif. No overrides to shadcn typography scale.

rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
  # Slightly softer than shadcn defaults. All other radii inherit.

spacing: inherit # shadcn/Tailwind 4-based scale; no overrides

components:
  health-badge-sick:
    description: Amber pill badge indicating a sick cattle status
    background: "{colors.accent}"
    foreground: "{colors.accent-foreground}"
    rounded: full
    font-weight: 600
    font-size: "12px"

  health-badge-healthy:
    description: Green-tinted pill badge indicating a healthy cattle status
    background: "#DCFCE7"
    foreground: "#14532D"
    rounded: full
    font-weight: 600
    font-size: "12px"

  stat-card:
    description: Dashboard metric card displaying a single KPI
    background: "{colors.card}"
    border: "1px solid {colors.border}"
    rounded: lg
    padding: "24px"
    metric:
      font-size: "32px"
      font-weight: 600
      color: inherit # defaults to foreground
    label:
      font-size: "14px"
      color: "{colors.muted-foreground}"

  sick-stat-card:
    description: Variant of stat-card where the metric number renders in accent color to signal urgency
    extends: stat-card
    metric:
      color: "{colors.accent}"

  annotation-toolbar:
    description: Vet drawing tool toolbar overlaid on the thermal scan canvas
    background: "rgba(30, 58, 95, 0.90)" # {colors.primary} at 90% opacity
    foreground: "{colors.primary-foreground}"
    rounded: md
    shadow: md
    buttons:
      - circle-tool
      - ellipse-tool
      - undo
      - clear

  nav-item-active:
    description: Sidebar navigation active state
    background: "rgba(30, 58, 95, 0.10)" # {colors.primary} at 10% tint
    foreground: "{colors.primary}"
    font-weight: 600
    border-left: "3px solid {colors.primary}"
---

# Farm Tracking — Design System

## Brand & Style

Farm Tracking is a professional operational tool for internal use across three distinct user roles: Farmer (single-farm dashboard and cattle management), Vet (thermal scan viewer with annotation canvas and health reporting), and Super-Admin (platform management). It is not a consumer product and carries no agricultural clichés.

The brand discipline is **restraint**. Structure and authority are expressed through `{colors.primary}` (deep slate-navy). `{colors.background}` (warm off-white) reduces eye strain during extended operational use compared to pure white. Attention is reserved for the single accent color, `{colors.accent}` (warm amber).

The amber accent is a **signal, not a decoration.** It appears exclusively on sick-cattle counts, health-alert badges, and annotation canvas highlights. It must never appear for hover states, decorative accents, or informational chrome. Every other interactive element — active states, navigation highlights, focus rings — uses the primary navy.

The brand layer is intentionally thin. shadcn/ui is inherited wholesale for all components not listed in this document. Only the delta required to express the Farm Tracking brand identity is specified here.

---

## Colors

| Token | Value | Usage |
|---|---|---|
| `primary` | `#1E3A5F` | Navigation, active states, structural chrome, focus rings |
| `primary-foreground` | `#FFFFFF` | Text/icons on primary surfaces |
| `accent` | `#D97706` | Sick-cattle alerts, health badges, annotation highlights only |
| `accent-foreground` | `#1A0E00` | Text/icons on accent (amber) surfaces |
| `background` | `#FAFAF8` | Page background — warm off-white to reduce eye strain |
| `card` | `#FFFFFF` | Card and panel surfaces |
| `muted` | `#F1F0EE` | Table row stripes, secondary surface fills |
| `muted-foreground` | `#6B6B6B` | Labels, secondary text, captions |
| `border` | `#E2E1DF` | Dividers, card borders, input outlines |

All other shadcn color tokens (destructive, secondary, popover, ring, etc.) inherit their default values unchanged.

### Accent Discipline

`{colors.accent}` is reserved exclusively for health-alert signals:

- Sick-cattle count on `sick-stat-card`
- `health-badge-sick` pill badges
- Thermal annotation highlights on the vet canvas
- Any count or numeric value that exceeds a health threshold

It must **not** appear on hover states, active link underlines, decorative borders, button fills (outside alert contexts), or any surface that does not represent an animal health concern.

---

## Typography

Farm Tracking inherits the full shadcn/ui typography system without modification. All type is sans-serif (Inter or system-ui stack). There is no display font — this is an operational tool, not an editorial or marketing surface.

| Role | Spec |
|---|---|
| Body | shadcn default (inherit) |
| Labels | shadcn default (inherit) |
| Captions | shadcn default (inherit) |
| Display | Not used |

Key brand-layer type rules (applied via component specs, not global overrides):

- Stat card primary metrics: **32px, font-weight 600** — large enough to scan at a glance across dashboard panels
- Stat card labels: **14px, `{colors.muted-foreground}`** — visually subordinate to the metric value
- Health badges: **12px, font-weight 600** — legible at small sizes, bold enough to read in dense table rows
- `sick-stat-card` metrics: **32px, font-weight 600, color `{colors.accent}`** — the color shift communicates urgency without a change in type scale

---

## Layout & Spacing

Spacing inherits the shadcn/Tailwind 4-based scale with no overrides. The 4px base unit is used consistently throughout.

**Desktop-first, mobile-responsive.** Primary breakpoints follow Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px). The dashboard and thermal scan viewer are optimized for 1280px+ wide desktop displays used in farm office or clinic contexts. Mobile views collapse sidebar navigation and reflow stat cards to single-column.

**Layout principles:**

- Sidebar navigation: fixed-width left rail, `{colors.primary}` for active items via `nav-item-active`
- Content area: `{colors.background}` page fill, `{colors.card}` surfaces for panels
- Stat card grids: 3- or 4-column at desktop, 1-column on mobile
- Data tables: `{colors.muted}` row stripes for readability in dense cattle lists
- Thermal scan canvas: full-width within its panel; annotation toolbar overlaid at top or bottom edge

---

## Elevation & Depth

Elevation is minimal and functional — this is not a layered consumer UI. Depth signals hierarchy rather than decoration.

| Context | Shadow |
|---|---|
| Cards (`stat-card`, `sick-stat-card`) | None by default — border defines the card edge |
| Dropdowns, popovers | shadcn default shadow (inherit) |
| `annotation-toolbar` | `shadow-md` — lifts the toolbar visually above the scan image |
| Modals / dialogs | shadcn default (inherit) |

No custom shadow tokens are introduced. Flat card surfaces with `{colors.border}` borders are preferred over shadow-heavy elevation.

---

## Shapes

Border radii are slightly softer than shadcn defaults to convey a professional but approachable tool aesthetic.

| Token | Value | Usage |
|---|---|---|
| `sm` | `4px` | Small chips, tags, compact inputs |
| `md` | `8px` | Buttons, inputs, annotation toolbar, popovers |
| `lg` | `12px` | Cards (`stat-card`), panels, dialogs |
| `full` | `9999px` | Pill badges (`health-badge-sick`, `health-badge-healthy`) |

All other radius values inherit from shadcn defaults. No sharp (0px) or fully-square corners are used on interactive elements.

---

## Components

All components not listed below inherit shadcn/ui defaults unchanged. The following are brand-layer deltas only.

### `health-badge-sick`

Amber pill badge for sick or at-risk cattle status. Displayed in table rows, cattle detail headers, and dashboard alert counts.

```
background:    {colors.accent}          #D97706
foreground:    {colors.accent-foreground} #1A0E00
border-radius: full (9999px)
font-size:     12px
font-weight:   600
padding:       2px 8px
```

The amber background is the only use of `{colors.accent}` as a surface fill. It must not be replicated for any other badge type or status indicator.

---

### `health-badge-healthy`

Green-tinted pill badge for healthy cattle status. Paired with `health-badge-sick` in cattle lists and status columns.

```
background:    #DCFCE7   (Tailwind green-100 equivalent)
foreground:    #14532D   (Tailwind green-900 equivalent)
border-radius: full (9999px)
font-size:     12px
font-weight:   600
padding:       2px 8px
```

Green here is a semantic status color (healthy = green is a universal convention). It is not `{colors.accent}`. Do not repurpose this green for decorative or non-health-status uses.

---

### `stat-card`

Dashboard metric card displaying a single KPI (e.g., total cattle count, days since last health check).

```
background:    {colors.card}             #FFFFFF
border:        1px solid {colors.border} 1px solid #E2E1DF
border-radius: lg (12px)
padding:       24px
shadow:        none

metric (primary number):
  font-size:   32px
  font-weight: 600
  color:       foreground (inherit)

label (metric description):
  font-size:   14px
  color:       {colors.muted-foreground}  #6B6B6B
```

Stat cards tile in 3- or 4-column grids at desktop breakpoints. They are information-dense by design — keep content to metric + label only. Avoid adding sub-labels, trend lines, or sparklines unless explicitly scoped.

---

### `sick-stat-card`

Variant of `stat-card` where the metric value renders in `{colors.accent}` to communicate urgency. Used for sick cattle count and overdue health check count.

```
extends:       stat-card (all other properties identical)

metric (primary number):
  color:       {colors.accent}  #D97706   ← override only
```

The amber metric number is the signal. No other visual change is made to the card surface — border, background, and label remain identical to `stat-card`. The contrast between a neutral card surface and the amber number creates focused urgency without visual noise.

---

### `annotation-toolbar`

Floating toolbar overlaid on the vet's thermal scan canvas. Provides drawing tools for health annotation: circle selection, ellipse selection, undo, and clear.

```
background:    rgba(30, 58, 95, 0.90)   {colors.primary} at 90% opacity
foreground:    {colors.primary-foreground}  #FFFFFF
border-radius: md (8px)
shadow:        md
padding:       8px 12px

buttons (in order):
  1. Circle tool     — draw circular region of interest
  2. Ellipse tool    — draw elliptical region of interest
  3. Undo            — remove last annotation
  4. Clear           — remove all annotations on current scan
```

The semi-transparent primary background ensures the toolbar is legible against variable thermal imagery (color-mapped heat maps) without fully obscuring the scan underneath. Button icons use `{colors.primary-foreground}` (white). Active/selected tool uses a `{colors.primary-foreground}` at 20% background tint to indicate selection without introducing a new color.

---

### `nav-item-active`

Sidebar navigation active state. Indicates the currently selected section for the logged-in user role.

```
background:    rgba(30, 58, 95, 0.10)   {colors.primary} at 10% tint
foreground:    {colors.primary}          #1E3A5F
font-weight:   600
border-left:   3px solid {colors.primary}
```

Inactive nav items inherit shadcn defaults (transparent background, default foreground, normal weight). The left border accent is the primary visual indicator of active state — the background tint is a secondary reinforcement. Hover state for inactive items: shadcn default (muted background tint), no amber, no border-left.

---

## Do's and Don'ts

### Do's

- **Use `{colors.accent}` exclusively for health-alert signals** — sick-cattle counts, `health-badge-sick`, annotation highlights, and `sick-stat-card` metrics. Amber means something is wrong with an animal.
- **Inherit shadcn defaults for all unlisted components** — buttons, inputs, selects, dialogs, tables, toasts, and all other UI primitives use shadcn without modification unless a specific component override is listed above.
- **Keep data surfaces information-dense but visually calm** — use `{colors.muted}` backgrounds for table row stripes, `{colors.border}` for dividers, and `{colors.primary}` for active states. Let the data speak, not the chrome.
- **Use `{colors.primary}` for all interactive authority signals** — active navigation, focus rings on branded elements, selected tool states in the annotation toolbar.
- **Use `{colors.background}` (#FAFAF8) for all page-level fills** — the slight warmth over pure white reduces eye strain for farmers and vets using the platform for extended sessions.

### Don'ts

- **Don't use `{colors.accent}` decoratively** — not for hover states, active buttons, link underlines, icon fills, chart series colors, or any UI element that does not represent a cattle health alert.
- **Don't use green/farm iconography literally in UI chrome** — no barn icons, no cow silhouettes, no tractor graphics in navigation, empty states, or illustrations. The tool's credibility comes from clarity, not theming.
- **Don't apply gradients to surfaces** — all backgrounds are flat fills. No gradient headers, gradient cards, or gradient buttons. This applies to both `{colors.primary}` and `{colors.accent}`.
- **Don't implement dark mode** — not in scope. Do not add `dark:` Tailwind variants to brand-layer components. shadcn's built-in dark mode variants are also suppressed at the application level.
- **Don't introduce new semantic colors** — if a new health status (e.g., "quarantine," "recovering") requires a badge, reuse the existing badge shape with a new background/foreground pair, and document it as a new component delta rather than adding to the global color palette.
