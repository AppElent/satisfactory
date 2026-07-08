# FICSIT Design System — Page Re-skins (Spec 2) — Design

**Date:** 2026-06-29
**Status:** Approved design, pending implementation plan
**Goal:** Apply the FICSIT industrial-HUD visual language to every page of the app using the Spec 1 primitive layer, build the new Overview dashboard at `/`, and remove the legacy coastal-var bridge entirely — without changing any feature logic.

**Predecessor:** Spec 1 (`docs/superpowers/specs/2026-06-29-ficsit-design-system-foundation-design.md`, merged to `master`) delivered the tokens, the sidebar/topbar shell, and the primitive layer (`src/components/ui/`). This spec consumes those.

**Source design:** the 6 page layouts in `FICSIT Planner.dc.html` (Claude Design handoff): Overview, Calculator, Factories, Factory detail, Game Data, World Map.

## Decisions locked (from brainstorming)

1. **`/` becomes the Overview dashboard** (marketing landing dropped); Overview uses **static placeholder data**, shaped for an easy later swap to real data.
2. **Preserve all existing functionality**; apply the FICSIT visual treatment and extend the mock's layout where the real feature is richer. No feature loss.
3. **One combined plan** for all 6 pages (this spec → one implementation plan).
4. **Keep the real interactive calculator graph** (`@xyflow`/elk), not the mock's static staged columns.
5. **Keep the per-entity Data structure** (list + detail per items/recipes/buildings/buildables/schematics), not the mock's single 4-tab view.
6. **Full bridge teardown**: end state has zero coastal-var references in `src`; the bridge block is deleted from `styles.css`.

## Shared conventions

Every page migrates off the legacy bridge onto FICSIT tokens + Spec 1 primitives:

| Old (coastal/bridge) | New (FICSIT) |
|---|---|
| `.island-shell` / `.feature-card` / ad-hoc cards | `Panel` (`src/components/ui/panel.tsx`) — header strip, optional `topRail`/`hazard` |
| inline metric markup | `Stat` |
| ad-hoc tab bars | `Tabs` (controlled: `items`/`value`/`onChange`) |
| `<button>` / link-buttons | `Button` / `IconButton` |
| status pills | `Badge` (tones success/warning/danger/info/accent/neutral, `dot`) |
| checkbox/toggle | `Switch` / `Checkbox` |
| progress/efficiency meters | `Progress` (tone + `glow`) |
| `<input>` | `Input` |
| coastal-var text/borders (`var(--sea-ink)`, `var(--line)`, …) | FICSIT tokens (`var(--text-*)`, `var(--border-*)`, `var(--surface-*)`, mono via `font-[var(--font-mono)]`) |
| lucide icons inline | keep lucide where used; use `Icon` for the HUD symbol set |

Page wrappers follow the design's container widths/padding (e.g. `max-width:1280px; padding:26px 28px 60px`) over the existing blueprint-grid `<main>`. Numeric readouts use `--font-mono`; section headers use `--font-display` uppercase. **Status/efficiency color logic** from the design's script (`effFill`/`effColor`: ≥95 green, ≥80 yellow, else red; `STATUS` map operational/building/paused/planned) is reused as a small shared helper.

**No feature logic changes**: the LP solver (`useSolver`), Convex queries/mutations, Leaflet map, and all editing/round-trip flows are untouched — only their presentation changes.

## 1. Overview — NEW page (replaces `/`)

- New `src/features/overview/OverviewPage.tsx`; `src/routes/index.tsx` renders it (the marketing hero + feature-card grid is removed). Page title/subtitle already provided by `TopBar` route-meta ("Overview" / "Live factory network status").
- Layout (from design lines 131–213): a 4-up `Stat` grid (Total Power Draw [orange top-rail], Network Throughput, Factories Online, Avg Efficiency [danger delta]), then a 1.6fr/1fr split:
  - **Factory Network** `Panel` with a "View all" action → `/factories`; rows of {status dot, name + output summary, mono power, efficiency `Progress` + value}.
  - Right column: **Alerts** `Panel` (alert icon + count; rows of {colored dot, uppercase tag, text}) and an **Active Milestone** card (`Panel` with `hazard` top-stripe; label, milestone name, HUB progress `Progress`, needs line).
- **Static placeholder data** lives in the component, typed and shaped as `factories[]` / `alerts[]` / milestone — mirroring the design's mock — so a future swap to real Convex/game data is a localized change. (Real wiring is explicitly out of scope.)

## 2. Calculator

Re-skin [CalculatorPage](src/features/calculator/CalculatorPage.tsx) into the design's two-column grid (332px / 1fr, lines 215–358); all child components keep their logic, only markup/classes change:

- **Left column:**
  - `CalculatorControls` → Solve Mode (Produce/Maximize) and Resource Weighting (Balanced/Min Ore) as **segmented toggles** (inset well + sliding active fill, design lines 219–244), inside a `Panel`.
  - `TargetEditor` + `ItemPicker` → **Targets** `Panel` with an "Add" `Button` and target rows (item icon tile, name, mono rate `/min`).
  - `RecipeOptions` → **Alternate Recipes** `Panel` with `Switch` rows.
- **Right column:**
  - 4 `Stat` cards derived from the current `Solution` (Total Power, Machines, top raw input, Sink Points; first with orange top-rail).
  - `ResultTabs` → a `Panel` with a `Tabs` bar (Graph/Items/Buildings/Power) + a "Save as Factory" `Button` (existing `SaveAsFactoryButton`). **Graph tab keeps the real `ProductionGraph` (`@xyflow`/elk)**; Items/Buildings/Power tabs restyle their tables/cards/bars to the design (mono readouts, inset wells, orange bars).
- Loading/infeasible/empty states keep current behavior, restyled to FICSIT (muted text in a `Panel`).

## 3. Factories list

Re-skin [FactoriesPage](src/features/factories/FactoriesPage.tsx) + [FactoryCard](src/features/factories/FactoryCard.tsx) (design lines 360–396):

- Header row: site count line (factory icon + "N sites · M online") and a "New Factory" `Button` → calculator.
- 4 `Stat` cards (Network Power, Total Output, Surpluses, Shortfalls) **derived from real factory data** (existing derive helpers), in a bordered grid with an orange top-rail.
- 3-up grid of `FactoryCard`s: name (display font), mono power, status `Badge` (`dot`), output rows (icon + name + mono rate), efficiency `Progress` + value. Hover → orange border.
- Empty/sign-in states (`SignInPrompt`) restyled. Real game-scoped Convex data and navigation preserved.

## 4. Factory detail

Re-skin [FactoryDetail](src/features/factories/FactoryDetail.tsx) (design lines 398–455). **All editing, `MachineEditor`, `ItemRateEditor`, `ManualFactoryForm`, status/description edit, delete, and the calculator round-trip stay**:

- Breadcrumb (Factories → name), title (display font) + status `Badge`, "Open in Calculator" `Button` (secondary) + delete `IconButton` (hover red).
- `Tabs`: Overview / Plan / Build Cost / Notes.
  - **Overview**: overall-efficiency readout (big mono value + full-width `Progress`), planned-vs-actual output rows.
  - **Plan**: machine table (or the live-solved `ResultTabs` graph for manual factories — unchanged logic), restyled.
  - **Build Cost**: total-power accent bar + ingredient grid in inset wells.
  - **Notes**: textarea/notes in an inset well.
- Edit affordances slot into the FICSIT layout (e.g. editable fields use `Input`; `MachineEditor` rows use FICSIT wells).

## 5. Game Data

Keep the existing per-entity routes (`/data`, `/data/<type>.index`, `/data/<type>.$slug`) and the config-driven architecture — richer than the mock's single 4-tab page. Restyle the shared components (design lines 457–525):

- `EntityListPage` (`src/features/data/EntityListPage.tsx`): table/grid layout per the design — `Panel` container, uppercase column headers in a darkened strip, mono numeric cells, hover row wash.
- `SearchFilterBar`: search `Input` (with search icon) + filter **chips** (active = accent-soft + orange border; inactive = inset).
- `RecipeRow`: recipe card (name in display font, building sub-label, mono ingredients → orange arrow → mono products, optional "Alt" `Badge`, mono rate).
- `EntityCardGrid` (buildings/buildables/schematics): FICSIT cards (icon tile, name, category, power/cost footer row).
- `DetailLayout` (`src/components/data/DetailLayout.tsx`) and `EntityIcon`: restyle to FICSIT surfaces/borders.
- The design's entity tabs map to the existing `/data` entity navigation (restyled as a `Tabs`/chip row). Buildables (5th type) retained.

## 6. Map

Preserve the Leaflet map and all layers/pins (design lines 527–577). Restyle chrome only:

- `MapPage` (`src/features/map/MapPage.tsx`): two-column grid — the `MapView` inside a bordered `Panel`-style container (the existing Leaflet canvas stays), and a right rail with a **Resource Nodes** `Panel` (legend rows: colored dot + name + mono purity count) and a **Save File** `Panel` (orange top-rail, description, "Load Save File" `Button`).
- `LayerPanel` (`src/features/map/LayerPanel.tsx`): restyle toggles to `Switch`/FICSIT.
- Map overlays/markers and the SC tile proxy are unchanged.

## 7. Bridge teardown

As each page migrates, remove its coastal-var usages. Also migrate the shared/peripheral files still on the bridge:

- Shared: `src/components/Toast.tsx`, `src/components/EntityIcon.tsx`, `src/features/games/GameSwitcher.tsx`, `src/integrations/clerk/header-user.tsx`.
- Peripheral routes (no bespoke mock — light token migration to FICSIT surfaces/text, consistent but not pixel-designed): `logistics` (`LogisticsPage`, `LinkForm`, `SummaryCard`, `NetworkGraph`), `games.index`, `g.$gameId.settings` (`GameSettings`), `invite.$token` (`AcceptInvite`), `GamesPage`, `SignInPrompt`.

**Verification of teardown:** `git grep -nE "var\(--(sea-ink|sea-ink-soft|lagoon|lagoon-deep|palm|sand|foam|surface|surface-strong|line|inset-glint|kicker|header-bg|chip-bg|chip-line|link-bg-hover|hero-a|hero-b)\)|island-shell|feature-card|display-title|nav-link|island-kicker|site-footer|rise-in" -- src` returns **no matches**. Then delete the legacy bridge `:root` aliases and the `.island-shell`/`.feature-card`/`.nav-link`/`.island-kicker`/`.site-footer`/`.display-title`/`.rise-in` rules from `src/styles.css` (keep `.page-wrap`, `a`, `code`, `pre`, base layer). Confirm `npm run build` + full suite still pass after deletion.

## Out of scope

- Real data wiring for Overview, the sidebar grid-load widget, alerts, and the active-milestone card (remain static placeholders).
- Making the TopBar search input functional.
- Any new features or behavior changes; the `logistics` "Soon" sidebar state is unchanged.

## Verification

- `npm run check` (biome), `npm run typecheck`, `npm test` — **all existing suites stay green** (logic untouched). Tests that assert on coastal classes/markup (if any) are updated to the new structure; component behavior tests are unaffected.
- `npm run build` succeeds.
- The teardown grep (above) returns zero matches; bridge block removed.
- Manual `npm run dev` smoke pass per page: Overview (`/`), Calculator (solve a target; all 4 result tabs), Factories list + a factory detail (all tabs; edit + save), Data (each entity list + a detail), Map (tiles + nodes + pins render; layer toggles), plus logistics/games/settings/invite render in FICSIT. No coastal colors remain; no console errors.

## Risks / notes

- **`EntityListPage` is config-driven and shared across 5 entity types** — restyle once, verify all five render (especially differing column sets). Its tests (`EntityListPage.test.tsx`, `SearchFilterBar.test.tsx`, `EntityCardGrid.test.tsx`) may assert on current markup; update assertions to match new structure without weakening coverage.
- **Leaflet theming**: the map canvas is third-party; only style the surrounding `Panel` and controls — don't fight Leaflet's internal DOM. Verify dark tiles/controls don't clash.
- **Calculator graph**: `ProductionGraph` (xyflow) has its own node styling; restyle nodes/edges to FICSIT within xyflow's API rather than replacing the graph.
- **Single large plan** (6 pages): the implementation plan should still sequence pages as independent, separately-committable task groups (Overview → Calculator → Factories → Factory detail → Data → Map → teardown) so progress is reviewable even within one plan.
- **Test churn**: re-skins may touch markup that existing render tests assert on. Expect to update those tests; keep behavioral assertions intact.
