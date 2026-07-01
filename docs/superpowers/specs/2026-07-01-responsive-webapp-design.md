# Responsive Webapp — Design

**Date:** 2026-07-01
**Status:** Approved design, pending implementation plan
**Goal:** Make the FICSIT Planner usable on phone (~375px) and tablet (~768px) widths, not just desktop, while keeping the FICSIT design system's look and interaction language intact. The main nav moves to the bottom on phone; every route gets a working layout at all three tiers.

## Decisions locked (from brainstorming)

1. **Full scope, one spec.** Covers the app shell (Sidebar/TopBar) *and* bespoke mobile/tablet layouts for the pages that need them (Overview, Calculator, Map, Logistics) — not deferred to a follow-up spec.
2. **Three tiers:** phone (`<768px`), tablet (`768–1023px`, `md:`), desktop (`≥1024px`, `lg:` — unchanged from today).
3. **CSS-first.** Plain reflow (Tailwind responsive classes) wherever a page just needs to restack. A small `useMediaQuery` hook is introduced only for the handful of spots where a component needs to *know* its layout mode: the AppShell nav-variant switch, and the Calculator/Map/Logistics Tabs↔grid switch.
4. **Phone bottom nav:** `Overview / Calculator / Game Data / Map / More` — Factories and the not-yet-shipped Logistics live behind **More**.
5. **Tablet nav:** collapsed icon-rail sidebar (~72px, icons only), not a bottom bar and not a hamburger drawer — nav stays persistently visible since this is a planning tool people jump around in constantly.
6. **Dual-pane pages (Calculator, Map, Logistics)** switch to the existing `Tabs` primitive below `lg`, rather than plain stacking or a bottom-sheet overlay — reuses an existing component instead of introducing new interaction surface.
7. **"More" overflow menu** extends the existing `Dialog` primitive with a bottom-anchored variant, instead of building a new generic Sheet/Drawer primitive.
8. **Factories, Data, Games, Account pages need no structural redesign** — confirmed already reflow correctly (existing `sm:`/`lg:` grid classes, narrow max-width forms); this spec only requires a verification pass on them at phone width.

## Current state (from codebase survey)

- `AppShell`/`Sidebar`/`TopBar` (`src/components/shell/`) are fixed-width with no responsive behavior at all: the 244px sidebar and 280px search box do not adapt below desktop widths.
- `Sidebar` nav content comes from `NAV_GROUPS` in `src/components/shell/nav-model.ts` (5 enabled items + disabled Logistics) plus `isItemActive`/`resolveHref` helpers in `Sidebar.tsx`.
- `TopBar` (`src/components/shell/TopBar.tsx`) packs: route-derived title/subtitle, a 280px search input (visual only, non-functional today), a pulsing "Synced" status, `GameSwitcher`, and the Clerk user menu (`integrations/clerk/header-user.tsx`).
- Feature pages, by current responsiveness:
  - **Already fine:** Factories (card grid `sm:grid-cols-2 lg:grid-cols-3`), Data/entity browser (card grid, column-flow detail layout), Games (card grid), Account (`max-w-md` stacked forms).
  - **Partially responsive, needs the Tabs treatment:** Map (`lg:grid-cols-[1fr_300px]`, currently plain-stacks below `lg`), Logistics (`lg:grid-cols-[300px_1fr]`, currently plain-stacks below `lg`).
  - **Not responsive at all:** Calculator (fixed 332px sidebar + fluid main, no breakpoint), Overview (`grid-cols-4` stat bar and a fixed-column Factory Network table, both rigid).

## 1. Breakpoints & strategy

Use Tailwind's default `md` (768px) and `lg` (1024px) breakpoints, matching what Factories/Map/Logistics already use:

- **`<768px` (phone):** `BottomNav` replaces `Sidebar`; `TopBar` collapses to title + user menu; Calculator/Map/Logistics render as Tabs.
- **`768–1023px` (tablet, `md:`):** `Sidebar` renders as a collapsed icon-rail; `TopBar` shows more (icon-collapsed search, dot-only sync, GameSwitcher, user menu); Calculator/Map/Logistics still render as Tabs (portrait tablet is still narrow for two dense panes side by side).
- **`≥1024px` (desktop, `lg:`):** unchanged from today.

CSS-only reflow (grid column count, stacking, max-width) is used everywhere a page just needs to look different at a smaller size. JS breakpoint awareness is reserved for:
- AppShell's choice of nav component (`Sidebar` full vs. rail vs. `BottomNav`).
- The Calculator/Map/Logistics Tabs↔grid mode switch, because Leaflet (Map) and the Logistics network graph canvas must be told to re-measure when their container's layout mode changes (see Risks).

Introduce `useMediaQuery(query: string): boolean` in `src/lib/use-media-query.ts` (SSR-safe: returns a stable default on the server, updates after mount via `matchMedia`) for these cases.

## 2. App shell & navigation

**`AppShell.tsx`** picks the nav variant based on viewport tier (via `useMediaQuery`) and renders exactly one of: `Sidebar` (desktop), `Sidebar` in rail mode (tablet), or `BottomNav` (phone) — plus the corresponding `TopBar` treatment.

**Phone (`<768px`):**
- `BottomNav` (new, `src/components/shell/BottomNav.tsx`): fixed bottom bar, 5 slots — Overview, Calculator, Game Data, Map, More — reading from a phone-specific subset of `NAV_GROUPS` (Factories and Logistics excluded from the primary 4, included in More).
- **More** opens the bottom-anchored `Dialog` variant listing: Factories link, Logistics (disabled, "Soon" — same as today), a compact `GameSwitcher`, the "Synced" status indicator, and a search entry point (icon → expands to a full-width input).
- `TopBar` shows only the route title (left) and the Clerk user menu (right). Search collapses to an icon button that opens a full-width overlay input on tap.

**Tablet (`768–1023px`):**
- `Sidebar` gets a `rail` size variant: ~72px wide, icons only (no labels, no group headings), same active-state treatment (left accent bar + icon color) as today, tooltip on hover/long-press. Reuses `NAV_GROUPS`/`isItemActive`/`resolveHref` — no new nav data model.
- The Grid Load widget at the bottom of the sidebar is hidden in rail mode (no room; it's a static placeholder today regardless).
- `TopBar`: search collapses to an icon button (same expand-on-tap as phone); "Synced" shows the pulsing dot without the text label; `GameSwitcher` and the user menu remain visible as today.
- No bottom nav.

**Desktop (`≥1024px`):** unchanged — full 244px `Sidebar`, full `TopBar`.

**"More" menu implementation:** extend `src/components/ui/dialog.tsx` with a bottom-anchored position variant (slides up from the bottom edge, full viewport width, rounded top corners, same Radix scrim/focus-trap/dismiss behavior the centered variant already has). The nav overflow content (`MoreMenu`, new, small component) is the first consumer; no other bottom-sheet consumers are introduced by this spec.

## 3. Dual-pane pages: Calculator, Map, Logistics

All three currently pair a fixed-width side pane with a main content area:
- Calculator: 332px controls sidebar + results (stats + tables), no existing breakpoint.
- Map: canvas + 300px legend/layers rail, currently plain-stacks below `lg` via `lg:grid-cols-[1fr_300px]`.
- Logistics: 300px form/suggestions/transports panel + `NetworkGraph` canvas, currently plain-stacks below `lg` via `lg:grid-cols-[300px_1fr]`.

**Below `lg` (both phone and tablet tiers):** each page renders the existing `Tabs` primitive as a segmented control switching between its two panes, each getting full width:
- Calculator: **Setup** (controls/targets/inputs/recipes) / **Results** (stat grid + tables) — defaults to Setup.
- Map: **Map** (canvas) / **Layers** (legend + layer controls).
- Logistics: **Network** (graph) / **Panel** (link form, suggestions, transports list).

**At `lg` and above:** the tab bar hides and both panes render side-by-side in the existing grid layout — no change from current behavior.

Since all three pages need the same "Tabs below `lg`, grid at `lg`+" logic, this spec factors it into one shared piece (e.g. a small `useDualPaneMode()` hook or a thin wrapper component) so the breakpoint logic and `useMediaQuery` call live in one place rather than being duplicated three times. The exact shape (hook vs. wrapper component) is left to the implementation plan.

## 4. Overview page

- The 4-column stat bar (`grid-cols-4`) becomes 2 columns below `md`, 4 columns at `md` and above.
- The Factory Network table converts to a stacked card-per-row layout below `md`: each row's columns (name, output, power, status, etc.) become labeled fields within a card, consistent with the card treatment used elsewhere (Factories list, Data browser).
- The Alerts panel is already a vertical list and needs no layout change.

## 5. Other pages (verification only)

Factories, Data/entity browser, Games, and Account already reflow correctly at phone width (existing `sm:`/`lg:` grid classes, `max-w-md` stacked forms) per the codebase survey. This spec includes a manual verification pass on these routes at 375px to confirm no regressions, but no structural changes are planned.

## 6. Files touched

**Added:**
- `src/components/shell/BottomNav.tsx` (+ test)
- `src/components/shell/MoreMenu.tsx` (+ test)
- `src/lib/use-media-query.ts` (+ test)
- Shared dual-pane mode logic (hook or wrapper component, exact location TBD in plan)

**Modified:**
- `src/components/shell/AppShell.tsx` — nav-variant switch by tier
- `src/components/shell/Sidebar.tsx` — add `rail` size variant, hide Grid Load widget in rail mode
- `src/components/shell/TopBar.tsx` — responsive collapse of search/sync-label/game-switcher by tier
- `src/components/ui/dialog.tsx` — add bottom-anchored position variant
- `src/features/calculator/CalculatorPage.tsx` — wrap panes in dual-pane pattern
- `src/features/map/MapPage.tsx` (and `MapView.tsx` as needed) — wrap panes in dual-pane pattern; handle Leaflet `invalidateSize()` on mode switch
- `src/features/logistics/LogisticsPage.tsx` — wrap panes in dual-pane pattern; handle `NetworkGraph` canvas resize on mode switch
- `src/features/overview/OverviewPage.tsx` — responsive stat grid, table→cards below `md`

**Untouched:** `src/features/factories/**`, `src/features/data/**`, `src/features/games/**`, `src/features/account/**`, `convex/**`, solver, data generation.

## 7. Verification

- `npm run check` (biome) and `npm run typecheck` clean.
- Existing test suites stay green (no feature logic changed, only layout/presentation).
- New components (`BottomNav`, `MoreMenu`, `useMediaQuery`) get unit/render tests following existing patterns (`Sidebar.test.tsx`, `TopBar.test.tsx`, `panel.test.tsx`).
- Manual pass at 375px, 768px, and 1024px+ viewports across every route: no horizontal overflow, correct nav variant per tier, dual-pane pages switch correctly between Tabs and grid at the `lg` boundary, Leaflet map and Logistics network graph resize correctly when crossing that boundary (e.g. tablet rotation).

## Risks / notes

- **Canvas re-measurement on mode switch:** Leaflet (Map) does not automatically detect a CSS-only display change from `hidden` (Tabs mode) to visible (grid mode) or a container resize crossing the `lg` boundary. The `useMediaQuery`-driven mode switch must explicitly call `invalidateSize()` (Leaflet) and trigger a resize on the `NetworkGraph` canvas (Logistics) after the transition. This is real integration work, not just CSS, and should get its own step in the implementation plan.
- **SSR/hydration:** `useMediaQuery` must return a consistent default on the server to avoid a flash/hydration mismatch when the client's actual viewport differs (mirrors the care already taken elsewhere in this app around SSR, e.g. the removed `THEME_INIT_SCRIPT` flash-prevention pattern from the design-system spec).
- **Sidebar rail mode duplicates active-state styling logic** with the full sidebar — keep `isItemActive`/`resolveHref` shared and only vary rendering (icon-only vs. icon+label), not the underlying nav data or active-detection logic.
- **Dialog bottom-anchored variant** must keep the same Radix focus-trap/escape/backdrop-click behavior as the existing centered variant — this is a position/animation change, not a new interaction model.
