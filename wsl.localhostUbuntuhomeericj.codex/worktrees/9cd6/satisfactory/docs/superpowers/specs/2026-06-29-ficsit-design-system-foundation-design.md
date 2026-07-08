# FICSIT Design System — Foundation — Design

**Date:** 2026-06-29
**Status:** Approved design, pending implementation plan
**Goal:** Replace the app's coastal light/dark identity with the FICSIT industrial-HUD design system: drop in the FICSIT design tokens, swap the top-nav header for the design's left-sidebar shell, and stand up a reusable primitive layer (shadcn-based where possible) — without rewriting any feature page's logic. Existing pages restyle automatically via a token bridge; pixel-faithful page re-skins are deferred to Spec 2.

## Source design

Handoff bundle from Claude Design: `Satisfactory webapp designs` (FICSIT Planner). The design ships 5 CSS token files (colors, typography, spacing, effects, fonts — 175 custom properties), a set of React primitives, an app shell (244px sidebar + 68px top bar), and 6 page layouts (Overview, Calculator, Factories, Factory detail, Game Data, World Map). This spec covers **only the foundation** (tokens + shell + primitives); the page layouts are Spec 2.

Design language summary (from the bundle readme): dark graphite control-panel with a single hero **FICSIT orange (`#FA9549`)** accent, used surgically; **Saira Condensed** display / **Saira** UI / **JetBrains Mono** readouts; sharp 2–8px radii; stamped-steel panels (1px metal border + top bevel + machined shadow); blueprint-grid background; hazard caution stripes on warnings; mechanical motion (90/150/260ms); no emoji; UPPERCASE wide-tracked labels.

## Decisions locked (from brainstorming)

1. **Dark-only, full replacement.** FICSIT becomes the only theme; the coastal light/dark palette and `ThemeToggle` are removed.
2. **Full sidebar shell.** Replace the top `Header`/`Footer` with the design's sidebar + top bar.
3. **Overview = styled placeholder (Spec 2).** Not built in this spec.
4. **Approach A — tokens + thin primitive layer**, hybrid with shadcn.
5. **Two specs.** This is Spec 1 (Foundation). Page re-skins are Spec 2.

## Scope

**In (Spec 1):**

- FICSIT token files added and wired into `styles.css`; fonts swapped to Saira / Saira Condensed / JetBrains Mono.
- FICSIT raw tokens mapped onto shadcn semantic vars in `@theme` (proper shadcn dark theme).
- **Legacy-var bridge:** coastal var names + `.island-shell`/`.feature-card` aliased to FICSIT tokens so the ~51 existing files restyle with no markup edits.
- App shell: `AppShell` + `Sidebar` + `TopBar`, wired into `__root.tsx`; `Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx` deleted; theme-flash script removed.
- Primitive layer under `src/components/ui/`: shadcn-based (Button, Badge, Card, Input, Checkbox, Switch, Tabs, Dialog, Progress) restyled to FICSIT; hand-rolled where shadcn has no equivalent (Stat, hazard Panel, Icon symbol-set, IconButton).
- Global base: graphite background + blueprint-grid texture, FICSIT scrollbars, `ficsit-pulse` keyframe, reduced-motion handling.

**Out (→ Spec 2):**

- Pixel-faithful page re-skins (Overview, Calculator, Factories, Factory detail, Game Data, Map).
- Real data wiring for Overview, the sidebar grid-load widget, alerts, and the active-milestone card (all static placeholders or absent in Spec 1).
- Migrating the ~51 files off the legacy coastal var names (the bridge keeps them working until then).
- Replacing the existing `Toast.tsx` / `ToastProvider` (kept as-is).
- Design-system specimen/showcase pages.

## Theming architecture

Three layers, each with a clear purpose:

```
FICSIT raw tokens   →   shadcn semantic vars   →   new components (Spec 1 + 2)
(palette, from design)  (--background, --primary,
                         --card, --border, --ring, --radius)
        ↘  legacy coastal aliases  →  the ~51 existing files (temporary shim, removed in Spec 2)
```

- **Raw tokens** = the canonical palette, edited for future tweaks (e.g. `--accent`, `--surface-card`, `--border-default`, `--graphite-950`).
- **Semantic vars** = what installed shadcn components read; mapped to raw tokens so the whole primitive set inherits the look automatically.
- **Legacy aliases** = `--sea-ink`, `--lagoon`, `--line`, `--surface*`, `--bg-base`, `.island-shell`, `.feature-card`, etc. repointed to raw tokens; explicitly temporary, deleted as Spec 2 migrates each page.

## 1. Token foundation

- Add the 5 FICSIT token files verbatim under `src/styles/ficsit/`: `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css`.
- In `src/styles.css`:
  - Replace the Fraunces/Manrope Google-Fonts `@import` with the FICSIT fonts import (Saira:300–700 + Saira Condensed:500–800 + JetBrains Mono:400–700). (May be moved into `fonts.css` to keep one import; either is fine as long as it loads before use.)
  - `@import` the five token files (after `@import 'tailwindcss'`).
  - In `@theme`: set `--font-sans: 'Saira', …`, add `--font-mono: 'JetBrains Mono', …` and `--font-display: 'Saira Condensed', …`.
  - **Map shadcn semantic vars → FICSIT raw tokens** (in `:root`): `--background: var(--graphite-950)`, `--foreground: var(--text-primary)`, `--card: var(--surface-card)`, `--card-foreground: var(--text-primary)`, `--popover: var(--surface-panel)`, `--primary: var(--accent)`, `--primary-foreground: var(--text-on-accent)`, `--secondary: var(--bg-inset)`, `--muted: var(--bg-inset)`, `--muted-foreground: var(--text-muted)`, `--accent: var(--accent-soft)` (note: keep FICSIT `--accent` as the orange; shadcn's `--accent` is its hover-surface — resolve the name clash by giving the shadcn alias a distinct mapping such as `--accent` shadcn → `var(--surface-hover)`), `--destructive: var(--danger)`, `--border: var(--border-default)`, `--input: var(--border-default)`, `--ring: var(--focus-ring)`, `--radius: var(--radius-md)`. (Exact name-clash resolution finalized in the plan; the rule is: FICSIT raw names win as the palette, shadcn names are derived aliases.)
  - **Legacy bridge:** redefine coastal vars as aliases — `--sea-ink: var(--text-primary)`, `--sea-ink-soft: var(--text-secondary)`, `--line: var(--border-default)`, `--surface: var(--surface-card)`, `--surface-strong: var(--surface-card)`, `--bg-base: var(--graphite-950)`, `--lagoon`/`--lagoon-deep`/`--palm` → `var(--accent)`/`var(--accent-hover)`, `--kicker: var(--text-muted)`, `--header-bg`/`--chip-bg`/`--chip-line`/`--link-bg-hover` → appropriate FICSIT surfaces/borders.
  - Repoint `.island-shell` and `.feature-card` to the FICSIT panel treatment: `background: var(--surface-card)`, `border: 1px solid var(--border-default)`, `box-shadow: var(--bevel-top), var(--shadow-md)`, remove backdrop-blur and the coastal hover lift (`.feature-card:hover` → `border-color: var(--border-accent)`).
  - Delete the `.dark` block, the coastal `body` gradient stack, and `body::before`/`body::after` coastal overlays; replace with graphite base + blueprint grid (see §4).

## 2. App shell (replaces Header + Footer)

New directory `src/components/shell/`:

- **`AppShell.tsx`** — `display:flex; height:100vh` frame: `<Sidebar/>` + a `flex-1` column of `<TopBar/>` over a scrollable `<main>` (graphite bg + grid texture). Receives `children` (the routed page) into `<main>`.
- **`Sidebar.tsx`** (244px, `--graphite-900`, right metal border):
  - Brand: hex icon (`#i-hex`) in orange with a glowing square + "FICSIT" (display, uppercase) / "Factory Planner" (muted, tracked).
  - Grouped nav using a small nav model adapted from `FEATURES`:
    - **Operations:** Overview (`#i-gauge` → `/`), Calculator (`#i-calc` → `/calculator`, "Beta" pill), Factories (`#i-factory`), Game Data (`#i-data` → `/data`).
    - **World:** World Map (`#i-map`), Logistics (`#i-route`, "Soon" pill, disabled).
  - **Game-scoping preserved exactly as today:** Factories / World Map / Logistics link to `/g/$gameId/...` when an active game id exists (read the same way `Header` does today), otherwise to `/games`. Calculator, Game Data, Overview are global.
  - Active state: absolute `--accent-soft` fill + 3px orange left rail + orange icon (matches design); uses TanStack Router active detection (replacing the current `activeProps` approach). Factories nav item is active for both `/factories` and the factory detail route.
  - Bottom **grid-load widget**: static placeholder (70% green meter, "420.6 MW / 600 MW"). No data source in Spec 1.
- **`TopBar.tsx`** (68px, `--graphite-900`, bottom border):
  - Left: page **title** + **subtitle** derived per route (a `routeMeta` map keyed by matched route; falls back to a default). Title in Saira Condensed uppercase.
  - Right: search field (visual only — non-functional input this spec), pulsing green "Synced" dot + label, and — **relocated from the old header** — `GameSwitcher` and the Clerk user control (`integrations/clerk/header-user.tsx`). `ThemeToggle` is **not** carried over.
- **`__root.tsx`:** replace `<Header />{children}<Footer />` with `<AppShell>{children}</AppShell>`. Remove the `THEME_INIT_SCRIPT` `<script>` and its import. Body classes simplified (drop coastal selection color or repoint to `--accent-soft`).
- Delete `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ThemeToggle.tsx`.
- The "Overview" nav item points to `/` for now; the Overview **page content** is built in Spec 2. Every nav target must resolve to an existing route so the shell is self-contained.

## 3. Primitive layer (`src/components/ui/`)

Built on the existing `cn` (`src/lib/utils.ts`, clsx + tailwind-merge) and `class-variance-authority` (both already installed). All read FICSIT tokens (via shadcn semantic vars where applicable).

**shadcn-based (install via `npx shadcn add …`, then restyle to FICSIT):**

- **Button** — variants primary (orange, `--text-on-accent`) / secondary (inset metal) / ghost; sizes sm(30)/md(38)/lg(46) from `--control-h-*`; `fullWidth`; press feel `translateY(1px)`; focus ring `--glow-accent`.
- **Badge** — tones success / warning / danger / info / accent / neutral; optional leading `dot`; `sm` size; soft-bg + colored text per tone.
- **Card** — base panel (used as the shadcn primitive); FICSIT panel chrome layered via the hand-rolled **Panel** wrapper (below) where the design needs header strips / top rails.
- **Input** — inset well (`--surface-input`, `--bevel-inset`), focus ring.
- **Checkbox**, **Switch** — restyled to FICSIT (orange when on, metal track); Radix-backed for accessibility.
- **Tabs** — underline/segmented style matching the design's tab bars (used heavily in Spec 2).
- **Dialog** — scrim `--bg-overlay` + `blur(2px)`, panel chrome; Radix focus trap.
- **Progress** — meter with `--bevel-inset` track; tone variants (success/warning/danger/accent) with optional glow; gradient fill.

**Hand-rolled (no shadcn equivalent):**

- **Icon** — renders from the design's inline SVG `<symbol>` set (factory, calc, data, route, map, gauge, zap, plus, search, chevron, alert, check, box, arrow, trash, cog, power, hex). The symbol `<defs>` block is mounted once (in `AppShell`). `currentColor`, square footprint, `size` prop. Also passes through lucide icons by name for everything outside the symbol set.
- **IconButton** — square icon-only control (thin Button variant).
- **Stat** — `label` (uppercase muted) / `value` (mono, large) / `unit` (muted) / optional `delta` + `deltaTone` (positive/negative/neutral). Matches the dashboard stat cards.
- **Panel** — the stamped-steel panel chrome: `--surface-card` + `--border-default` + `--bevel-top` + `--shadow-md`; optional `title` header strip (uppercase condensed, darkened bg), optional 2px orange `topRail`, optional `hazard` top stripe (`--tex-hazard`). This is the workhorse container for Spec 2.

APIs mirror the `x-import` usages in `FICSIT Planner.dc.html` (e.g. `Stat label value unit delta delta-tone`, `Badge tone dot size`, `Tabs items value onChange`, `Switch checked onChange`, `Button variant size full-width`).

**Note on the design's runtime bundle:** `window.DesignSystem_9db823.*` (the compiled `_ds_bundle.js`) is **not** used at runtime; primitives are recreated as real components. The bundle/HTML are read only as the visual + API reference.

## 4. Global base

In `src/styles.css` (replacing the deleted coastal body styling):

- `body` / `#app`: `background: var(--graphite-950)`; blueprint grid via `--tex-grid` at `--tex-grid-size` applied on the scroll container (mirrors the design's `<main>` background), not full-bleed behind the sidebar.
- Scrollbars: `::-webkit-scrollbar` 10px, thumb `--graphite-600` with a 2px graphite-950 border, transparent track (from the design's global `<style>`).
- `@keyframes ficsit-pulse` (opacity 1 → .35) for the Synced dot.
- `@media (prefers-reduced-motion: reduce)`: disable `ficsit-pulse` and any meter/fill transitions (show end state).
- Keep `box-sizing: border-box` globally.

## 5. Files touched

**Added:**
- `src/styles/ficsit/{colors,typography,spacing,effects,fonts}.css`
- `src/components/shell/{AppShell,Sidebar,TopBar}.tsx`
- `src/components/ui/` — shadcn components (button, badge, card, input, checkbox, switch, tabs, dialog, progress) + hand-rolled `icon.tsx`, `icon-button.tsx`, `stat.tsx`, `panel.tsx`
- Test files for hand-rolled primitives (`*.test.tsx`) following existing patterns

**Modified:**
- `src/styles.css` — fonts, token imports, semantic-var mapping, legacy bridge, global base
- `src/routes/__root.tsx` — `AppShell`, remove theme script + Header/Footer
- `src/config/features.ts` — only if the sidebar nav model needs an `overview` entry / icon additions (additive; keep existing exports intact for any current consumers)

**Deleted:**
- `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ThemeToggle.tsx`

**Untouched (must keep working):** all `src/features/**`, `src/routes/**` page bodies, `convex/**`, solver, `Toast.tsx`/`ToastProvider`, data generation.

## 6. Verification

- `npm run check` (biome lint+format) clean.
- `npm run typecheck` clean.
- `npm test` — **all existing suites stay green** (no feature logic changed); new hand-rolled primitives get light render/unit tests.
- Manual `npm run dev` smoke pass: every existing route (`/`, `/calculator`, `/data` + sub-routes, `/factories`, `/map`, `/logistics`, `/games`, `/g/$gameId/*`, `/invite/$token`) renders inside the shell, dark theme applies, sidebar nav + game-scoping work, no light-theme flash, no console errors. Confirm removal of `ThemeToggle` doesn't break any route.

## Risks / notes

- **Token name clash:** FICSIT defines `--accent` (orange) and shadcn also uses `--accent` (a neutral hover surface). The plan must resolve this deterministically — FICSIT raw names are the palette; shadcn's same-named vars are derived aliases pointing at the correct FICSIT surface. Verify no component reads the wrong one.
- **Legacy bridge fidelity:** aliasing gets the ~51 files into the dark palette but they won't be pixel-faithful to the design until Spec 2 — expected and acceptable. Watch for low-contrast text where a coastal var mapped to an unintended FICSIT token; fix the alias, not the page.
- **SSR / TanStack Start:** shadcn Radix primitives (Dialog portal, Switch) must render under SSR without hydration mismatch; verify in the smoke pass.
- **Active-route detection:** the sidebar must mark Factories active on both the list and detail routes, and respect game-scoped paths.
