# Phase 6 — Logistics — Design

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan
**Parent spec:** [2026-06-12-satisfactory-webapp-design.md](./2026-06-12-satisfactory-webapp-design.md) §7
**Goal:** Connect saved factories into a logistics network: compute each factory's surplus and unmet needs, visualise the network as a graph, let users create transport links between factories with belt/pipe throughput math, and surface cross-factory totals.

## Scope

**In (v1):** `transports` Convex table + authenticated CRUD; per-factory surplus/need computation (pure); a react-flow factory network graph with surplus/shortfall badges; manual link creation; surplus→need suggestions; belt + pipe throughput math (pure, exact); a cross-factory summary card shown on `/logistics` and `/factories`; `logistics` feature flipped to `beta`.

**Out (deferred; registry sub-features stay `planned`):** truck / train / drone throughput math; distance-based auto-settings (using map pins). These modes are still creatable with a free-text `note`.

## 1. Data model — `transports` Convex table

```ts
transports: defineTable({
  userId: v.string(),
  fromFactoryId: v.id("factories"),
  toFactoryId: v.id("factories"),
  item: v.string(),              // resource slug moved across the link
  rate: v.number(),              // per minute
  mode: v.union(
    v.literal("belt"), v.literal("pipe"), v.literal("truck"),
    v.literal("train"), v.literal("drone"),
  ),
  note: v.optional(v.string()),  // free-text settings for manual modes
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

Belt and pipe link "settings" (tier + count) are **derived on the fly** from `rate` by the throughput module — they are display-only and not stored, keeping the table stable. Truck/train/drone carry an optional free-text `note`.

## 2. Convex functions — `convex/transports.ts`

- `list` (query) — transports for the authed user via `by_user`.
- `create` (mutation) — inserts with server-side `userId`; verifies **both** `fromFactoryId` and `toFactoryId` resolve to factories owned by the caller (else throw).
- `update` (mutation) — patch `item`/`rate`/`mode`/`note`; ownership-checked.
- `remove` (mutation) — delete; ownership-checked.

Every function resolves `ctx.auth.getUserIdentity()` and throws when absent. A shared `requireUser` helper mirrors the factories module.

## 3. Surplus / need computation — `src/features/logistics/logistics.ts` (pure, Vitest-tested)

- New helper `plannedInputs(production)` in `src/features/factories/factory-view.ts`:
  - manual source → `production.inputs`
  - plan source → `solution.rawInputs` + `solution.providedInputs` (everything consumed from outside the factory)
  - unparseable plan → `[]`
- `computeNetwork(factories, transports)` → for each factory: `surplus: ItemRate[]` (planned output − Σ outbound transports of that item) and `needs: ItemRate[]` (planned input − Σ inbound transports), keeping only positive remainders. Also returns global net per-item totals.
- `suggestSources(item, factories, transports)` → factories whose current surplus of `item` is positive, sorted by surplus descending.

All take plain factory/transport records, no Convex import — fully unit-testable.

## 4. Throughput math — `src/features/logistics/throughput.ts` (pure, Vitest-tested)

- Belt tiers Mk1–Mk6 = `[60, 120, 270, 480, 780, 1200]` items/min. `beltFor(rate)` → `{ tier: number /*1-6*/, count: number }`: the **highest** tier whose single-belt capacity is needed, with `count = ceil(rate / 1200)` belts at Mk6 when one belt can't carry it; for `rate ≤ 1200` it returns the smallest single tier that covers `rate` with `count: 1`.
- Pipe tiers Mk1/Mk2 = `[300, 600]` m³/min. `pipeFor(rate)` → `{ tier: number /*1-2*/, count: number }` by the same rule (`count = ceil(rate / 600)` above 600).
- `rate <= 0` → `{ tier: 1, count: 0 }`. These functions are exact and distance-independent.
- The link UI renders `beltFor`/`pipeFor` output for belt/pipe modes; truck/train/drone render the `note`.

## 5. Network graph — `src/features/logistics/NetworkGraph.tsx`

- Lazy / client-only react-flow (`@xyflow/react`) + elkjs auto-layout — the exact pattern already used by `src/features/calculator/ProductionGraph.tsx`.
- Nodes: one per factory, showing the name and a status indicator — red when the factory has any unmet need, green when it has surplus, neutral when balanced.
- Edges: one per transport, labelled `item · rate/min · mode`.
- Clicking a node navigates to `/factories/$factoryId`.

## 6. Link creation + suggestions — `src/features/logistics/LinkForm.tsx`

- Fields: from-factory (select), to-factory (select), item (slug; defaults to an item the from-factory has surplus of), rate (number), mode (select), optional note. Submit → `create`.
- For a selected unmet need, a "sources" list (via `suggestSources`) shows factories with surplus of that item; clicking one prefills `from-factory` + `item` in the form.
- Existing links are listed with their derived belt/pipe figure (or note) and a remove button.

## 7. Summary card — `src/features/logistics/SummaryCard.tsx`

- Cross-factory totals: total power across all factories (`solution.power` for plan source, `manualPower(machines)` for manual) and net per-item surplus/shortfall from `computeNetwork`.
- Rendered on `/logistics` and embedded on `/factories` (modifying `FactoriesPage`), per spec §7.

## 8. Pages & registry

- `/logistics` becomes an auth-gated page (`Authenticated`/`Unauthenticated`, same pattern as `/factories`): network graph + link form + summary card; signed-out → sign-in prompt.
- Flip the `logistics` feature registry entry `planned` → `beta`.

## 9. Error handling

- Unknown item/factory slugs fall back to the raw slug, never crash.
- Transports referencing a deleted factory are filtered out of the graph and computations (guard on missing factory lookup).
- The react-flow graph is lazy-loaded and client-only (it's heavy and DOM-dependent), like the calculator graph.
- Convex mutations are ownership-checked; both endpoints of a link must be owned by the caller.

## 10. Testing

- **Vitest (pure):** `throughput.ts` (belt/pipe exact tier+count, zero/boundary rates); `logistics.ts` (`computeNetwork` surplus/need with inbound+outbound transports, `suggestSources` ordering); `plannedInputs` (manual, plan, unparseable).
- **Component (testing-library):** `LinkForm` — submitting creates a link; a suggestion click prefills the form.
- Network graph is client-only — light smoke only.

## Verification gates

`biome check` · `tsc --noEmit` · `vitest run` · `vite build` all green, plus a manual pass: signed in with ≥2 factories, create a transport link; the graph shows both nodes with a labelled edge; a factory's shortfall turns red and its surplus elsewhere suggests it as a source; belt/pipe links show a derived tier+count; the summary card totals appear on `/factories`.
