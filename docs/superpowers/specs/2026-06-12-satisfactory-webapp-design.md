# Satisfactory Tools Webapp — Design

**Date:** 2026-06-12
**Status:** Approved design, pending implementation plan
**Goal:** The best Satisfactory tools/calculator webapp: game-data overviews, an LP-based production calculator, factory management with efficiency and build costs, an interactive map, and a logistics network between factories.

## Tech stack (already scaffolded)

TanStack Start (React 19, file-based routing, SSR) · TanStack Query · Convex (user data) · Clerk (auth) · shadcn/ui + Tailwind 4 · Biome · Vitest · Zod · t3env · Cloudflare Workers (hosting/deploy). Matches the AppElent/workouts and AppElent/roadmaps stack.

## Core decisions

| Decision | Choice |
|---|---|
| Game data source | greeny's SatisfactoryTools `data1.0.json` (vendored snapshot) behind our own typed abstraction layer; our own Docs.json parser can replace it later without touching feature code |
| Game data at runtime | Static typed JSON modules generated at build time, bundled with the app, split per domain. Game data never lives in Convex |
| Auth model | Public browse + calculator; Clerk login unlocks persistence (factories, pins, saved plans) |
| Calculator engine | Linear-programming solver (highs-js WASM) client-side in a web worker |
| Map v1 | Leaflet + game tiles + resource nodes + manual factory pins; save-file loading is a placeholder (post-v1, client-side parsing) |
| Transport feature | Logistics network between saved factories (suggested links, shortfall/surplus flags, transport settings math) |
| Factory production data | Either a frozen calculator-plan snapshot or manual entry |
| Navigation | Top nav for the five main areas + contextual sub-sidebar inside sections that need it (layout C) |
| Compute architecture | Client-heavy with SSR shell (approach 1): SSR for SEO on overview pages, all interaction client-side, Convex only for user data |

## Build order

Each phase ships independently. Every feature has at least a placeholder route from phase 1.

1. **Foundation** — data pipeline + app shell with ALL routes (placeholders via feature registry)
2. **Overviews** — items, recipes, buildings, buildables, schematics
3. **Calculator** — LP solver + graph/table results
4. **Factories** — save, efficiency, build costs
5. **Map** — tiles, resource nodes, factory pins
6. **Logistics** — factory network + transport math

## 1. Architecture & data pipeline

### Pipeline (build time)

`scripts/generate-data.ts` (run via `npm run generate-data`):

1. Reads a vendored snapshot of greeny's `data1.0.json` (checked into `data/vendor/`).
2. Validates and transforms it into **our own** Zod-defined schema.
3. Emits typed JSON modules into `src/data/generated/`, split per domain (items, recipes, buildings, buildables, schematics, resources, generators) plus a precomputed search index.

Generated output is committed to git: builds are deterministic, game updates are "replace snapshot → re-run → review diff". The build **fails** on malformed data, including referential integrity (every recipe ingredient/product/machine must resolve).

### Data access layer

`src/data/` is the only code allowed to import generated files. Typed pure functions: `getItem(slug)`, `getRecipesProducing(item)`, `getRecipesUsing(item)`, `getBuilding(slug)`, `searchEntities(query)`, etc. Swapping the upstream source (e.g. our own Docs.json parser) only ever changes the pipeline.

### Icons & map tiles

- Community-extracted item/building icon set vendored into `public/icons/`, keyed by slug.
- Community-extracted in-game map tile pyramid vendored into `public/map-tiles/`.

### Runtime

- TanStack Start SSR on Cloudflare Workers; overview pages SSR'd with meta tags for SEO.
- Convex (via TanStack Query integration) stores only user data; Clerk identity on every Convex function.
- Route-level code splitting; heavy assets (solver WASM, Leaflet, react-flow) lazy-loaded per feature.

## 2. App shell, routing & placeholders

### Routes (all exist from day one)

- `/` — home: search, quick links, roadmap card
- `/data` — overview section with contextual sub-sidebar
  - `/data/items`, `/data/items/$slug`
  - `/data/recipes`, `/data/recipes/$slug`
  - `/data/buildings`, `/data/buildings/$slug`
  - `/data/buildables`, `/data/buildables/$slug`
  - `/data/schematics`, `/data/schematics/$slug`
- `/calculator` — plan state URL-encoded (`?plan=...`) for shareable links
- `/factories`, `/factories/$factoryId`
- `/map`
- `/logistics`

Top nav: logo, five section links, theme toggle, Clerk sign-in/user button. Sub-sidebar renders inside `/data`. Mobile: nav collapses to a sheet; sub-sidebar becomes horizontal tabs.

### Feature registry (the placeholder mechanism)

`src/config/features.ts` lists every feature and sub-feature with `status: 'live' | 'beta' | 'planned'`, a one-paragraph description, and planned capabilities. Consumed by:

1. Nav — "soon" badges on planned sections.
2. `<ComingSoon>` — informative placeholder page/card for any non-live feature or sub-feature (e.g. the map's save-file panel).
3. Home page roadmap card.

Flipping a feature live is a one-line change.

## 3. Data overviews

**List pages:** searchable, filterable grids/tables. Filters per entity (items: form/tier; recipes: machine, alternate/standard; buildings: category; schematics: tier). Filter + search state in typed URL search params (shareable, back-button friendly). All filtering client-side.

**Detail pages:** header (icon, name, description, stat cards) + cross-reference sections:

- **Item:** produced-by recipes (standard + alternates, with rates), used-in recipes, sink points, unlock source, "Open in calculator" button (deep-links with the item as target).
- **Recipe:** ingredients/products with per-minute rates, machine, power, comparison vs alternate recipes for the same product.
- **Building/buildable:** build costs, power use/generation, processed recipes, dimensions.
- **Schematic:** tier, unlock costs, unlocked entities.

Every entity mention anywhere in the app links to its detail page. Overview pages are SSR'd with meta tags.

## 4. Calculator

### Solver module

`src/features/calculator/solver/` — pure TypeScript, zero UI dependencies.

- **Input:** `ProblemSpec` = targets, allowed recipe set, input constraints, resource weights.
- **Output:** `Solution` = recipe usages, machine counts, item flows, raw inputs, byproducts, power, build cost — or a structured infeasibility diagnosis.
- **Formulation:** LP with one variable per allowed recipe, one balance constraint per item; objective = minimize weighted raw resource use (default weights = world node scarcity). Byproduct loops, sink overflow, and multi-target plans fall out of the formulation.
- **Execution:** highs-js (WASM) in a web worker, lazy-loaded, with a timeout guard.

### Modes & options

- Mode 1: produce X/min of target item(s). Mode 2: maximize output from given inputs.
- Alternate recipes toggleable individually or via tier presets; resource weighting strategy; overclocking applied post-solve (machines rounded up, clocks set to exact rates). Somersloop amplification: registry placeholder.

### Results UI

Left panel (targets, recipe toggles, options) + main area tabs:

- **Graph** — react-flow + elkjs auto-layout; pan/zoom; nodes link to recipe pages.
- **Table** — recipes, machines, rates.
- **Resources** — raw inputs with % of world supply.
- **Power & cost** — total power, aggregated construction materials.

Share (compact URL encoding) and "Save as factory" (login required, hands plan to factories feature).

### Infeasibility UX

Report *why*: which target has no enabled recipe path, which input runs out — with actionable hints ("enable an alternate recipe for X or add Y as input").

## 5. Factories

### Convex schema

```ts
factories: {
  userId, name, description?, notes?,
  status: 'planned' | 'building' | 'operational' | 'paused',
  location?: { x: number, y: number },          // game world coords → map pin
  production:
    | { source: 'plan', plan: PlanSnapshot }     // frozen calculator result
    | { source: 'manual', inputs: ItemRate[], outputs: ItemRate[],
        machines: { building: string, count: number, clock?: number }[] },
  actuals?: ItemRate[],
  createdAt, updatedAt
}
savedPlans: { userId, name, spec: PlanSpec }     // calculator presets
```

Shared types: `ItemRate = { item: string /* slug */, rate: number /* per min */ }`. `PlanSpec` is the calculator's `ProblemSpec` (targets, allowed recipes, constraints, weights — the same object the URL codec encodes). `PlanSnapshot = { spec: PlanSpec, solution: Solution }` — both halves frozen at save time.

- Plan snapshots are frozen (no live reference); "Open in calculator" re-hydrates for editing, result can be re-attached.
- Item/building references are data-layer slugs; unknown slugs (after a game-data update) render with a warning badge, never crash.

### Derived values (client-side, from static game data)

- **Efficiency:** per output `actual ÷ planned`, plus aggregate score (headline badge).
- **Build cost:** machine list → total construction materials (expandable to raw), power draw, building counts.

### Pages

- `/factories` — card grid (status, efficiency badge, top outputs, pin indicator) + cross-factory totals (total power, net output per item — feeds logistics). Anonymous visitors: sign-in prompt + feature tour.
- `/factories/$id` — tabs: overview (I/O + efficiency), plan (read-only embedded result), build cost, notes.

## 6. Map

- Leaflet (react-leaflet), `CRS.Simple`, vendored game tiles. Client-only route (SSR disabled).
- Coordinate module converts game world coordinates (cm, origin center — same as save files) ↔ map pixels. Everything stores world coordinates so save-file rendering needs no migration.
- **Layers** (toggle panel; each a registry-tracked sub-feature):
  - *Resource nodes* (v1) — position/type/purity from community data via the data pipeline; filter by resource and purity.
  - *Factory pins* (v1, sign-in) — factories with `location`; popup with name/status/efficiency + detail link; drag to relocate; right-click/long-press "Add factory here" creates a draft factory.
  - *Save-file layer* (placeholder) — post-v1: parse `.sav` client-side with `@etothepii/satisfactory-file-parser` in a web worker (no upload to server); renders real factories/vehicles/trains as another layer.
  - *Geysers, drop pods, slugs* (placeholders) — same data source, cheap to add later.

## 7. Logistics network

- Convex table: `transports: { userId, fromFactoryId, toFactoryId, item, rate, mode: 'belt' | 'pipe' | 'truck' | 'train' | 'drone', settings }` — `settings` is a mode-specific object produced by the throughput module (e.g. belt: `{ tier, count }`; train: `{ wagons, roundTripMin }`), editable manually.
- `/logistics` renders factories as a react-flow network: nodes show surplus (planned outputs minus outbound transports) and unmet needs (inputs minus inbound). Red badges = shortfall, green = surplus.
- Link creation: pick an unmet need → tool suggests source factories with surplus. If both ends have map pins, distance feeds a pure `throughput` math module that derives settings per mode (belt tier counts, pipe capacity, train wagons + round-trip time, drone battery cost). Accept a suggestion or configure manually.
- Shortfall/surplus summary card also appears on `/factories`.

## Error handling

- **Zod at every boundary:** data pipeline fails the build on bad data; plan-URL decoding failures show a friendly "corrupt link" state; Convex functions validate args server-side.
- Route-level error boundaries + 404 components (TanStack Router); unknown entity slugs → proper not-found with search suggestions.
- Solver worker: timeout guard; infeasibility → structured diagnosis (section 4).
- Convex mutations: optimistic updates where safe; toast-based error recovery.

## Testing

- **Vitest**, heaviest on pure modules: solver (golden chains incl. loops/byproducts, both modes, cross-checked against satisfactorytools), data pipeline (schema + referential integrity), throughput math, coordinate transforms, plan URL codec.
- Component tests (testing-library) for calculator panel and factory forms.
- Small Playwright smoke suite: home → item page → calculator run.
- CI (GitHub Actions): `biome check`, `vitest run`, `vite build` on every push.

## Out of scope (registry placeholders, not designed yet)

Save-file parsing/rendering, somersloop amplification, geyser/drop-pod/slug map layers, command-palette global search. Each gets a `planned` registry entry so the UI shows it's coming.
