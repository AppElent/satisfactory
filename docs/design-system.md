# FICSIT Design System — Conventions

This is the discoverable, day-to-day reference for keeping new UI consistent with
the FICSIT design system. It complements the foundation design spec
([`docs/superpowers/specs/2026-06-29-ficsit-design-system-foundation-design.md`](superpowers/specs/2026-06-29-ficsit-design-system-foundation-design.md)).
The token sources live in [`src/styles/ficsit/`](../src/styles/ficsit) and the
shadcn bridge in [`src/styles.css`](../src/styles.css).

## Rules

1. **Use the `ui/` primitives** for inputs, buttons, badges, switches,
   checkboxes, panels, progress bars, stats, tabs, and dialogs. Do not hand-roll
   a raw `<input>`/`<button>` with bespoke classes when a primitive exists:
   - text inputs → [`Input`](../src/components/ui/input.tsx)
   - buttons → [`Button`](../src/components/ui/button.tsx) /
     [`IconButton`](../src/components/ui/icon-button.tsx)
   - badges/chips → [`Badge`](../src/components/ui/badge.tsx)
   - containers → [`Panel`](../src/components/ui/panel.tsx)

2. **Radii: use the FICSIT radius tokens, not Tailwind defaults.** The design
   language is sharp (2–8px). Use `rounded-[var(--radius-sm)]` /
   `rounded-[var(--radius-md)]` etc. — never `rounded-md` / `rounded-lg` /
   `rounded-xl` / `rounded-2xl`.
   - **Exception:** `rounded-full` is allowed **only for true circles** — status
     dots, avatars, small indicator wells (e.g. an `h-2 w-2` dot). Never use
     `rounded-full` to make a pill-shaped input/button/chip.

3. **Fonts: use the registered theme utilities.** Use `font-display` (Saira
   Condensed) and `font-mono` (JetBrains Mono), which are registered via
   `@theme inline` in [`src/styles.css`](../src/styles.css). Do **not** use the
   arbitrary `font-[var(--font-display)]` / `font-[var(--font-mono)]` form — that
   utility does not win the cascade here, so headings silently fall back to the
   generic sans stack.

4. **Colors: use FICSIT color tokens, never raw Tailwind palette colors or hex.**
   Use `var(--text-primary)`, `var(--danger)`, `var(--green-400)`, etc. — never
   `text-red-700` / `bg-red-50` / raw `#rrggbb`. The FICSIT orange accent is
   `var(--accent)` (= `var(--orange-500)`); `var(--accent-soft)` for soft fills.
   - Note for shadcn primitives: Tailwind's `bg-accent` / `text-accent-foreground`
     utilities resolve to the **neutral hover surface** (mapped on
     `--color-accent` / `--color-accent-foreground` in `styles.css`), *not* the
     orange. For the orange, use `var(--accent)` directly.

## Off-token catalogue (follow-up)

These are the remaining Tailwind-default radii outside the primitive layer.
Per the audit's scope, the **shared** leaks were fixed; **per-feature-page**
conversions are deferred (converting each page pixel-faithfully is out of scope
for the foundation pass). Run this to refresh the list:

```sh
rg -noE 'rounded-(full|sm|md|lg|xl|2xl)[a-z0-9-]*' src --glob '*.tsx' | rg -v 'rounded-\['
```

### Fixed in the audit pass
- `src/features/calculator/ItemPicker.tsx` — was `rounded-full` pill input +
  `rounded-xl` dropdown → routed through `Input` primitive + `--radius-sm`.
- `src/components/shell/TopBar.tsx` — search input replaced by the new
  `GlobalSearch` component (uses `--radius-sm`).
- `src/components/Toast.tsx` — `rounded-lg` → `--radius-md`; error tone moved
  off raw `red-400/red-50/red-700` to FICSIT `--danger` tokens.

### Keep (legitimate circles — `rounded-full` on true dots)
- `src/components/shell/TopBar.tsx:86` (synced status dot)
- `src/components/ui/badge.tsx:59` (badge indicator dot)
- `src/features/overview/OverviewPage.tsx:144,212` (status dots)
- `src/features/map/MapPage.tsx:81` (legend dot)

### Convert — follow-up (per-page, deferred)
Decision: **convert** to `--radius-*` tokens when each page is next touched.
None are shared primitives, so they do not block the foundation.

- **Detail-route tag chips** (pill `rounded-full ... px-3 py-1` link chips):
  `src/routes/data/items.$slug.tsx:115`,
  `src/routes/data/schematics.$slug.tsx:92,113`
- **Detail-route cards** (`rounded-lg`):
  `src/routes/data/items.$slug.tsx`, `recipes.$slug.tsx`, `buildings.$slug.tsx`,
  `buildables.$slug.tsx`, `schematics.$slug.tsx`, `src/routes/g.$gameId.tsx:53`
- **Games** (`rounded-md/lg/xl`): `src/features/games/GamesPage.tsx`,
  `GameSettings.tsx`, `GameSwitcher.tsx`, `AcceptInvite.tsx`
- **Logistics** (`rounded-md/lg/xl`): `src/features/logistics/LogisticsPage.tsx`,
  `LinkForm.tsx`, `SummaryCard.tsx`, `NetworkGraph.tsx`
- **Factories** (`rounded-md/lg/xl`): `src/features/factories/ManualFactoryForm.tsx`,
  `SaveAsFactoryButton.tsx`

These pages also tend to use raw `<input>`/`<button>` rather than the `ui/`
primitives — route them through the primitives during the same follow-up.
