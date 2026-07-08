# Future Improvements — Feature Backlog

A living list of advanced features beyond the six shipped phases (data, calculator,
factories, map, logistics). Check items off as they ship; each gets its own
brainstorm → spec → plan → implementation cycle when picked up.

Effort/Value are rough gut estimates to help prioritise.

## Headline candidates

- [ ] **1. Whole-base global optimizer ("mega-plan")** — Value: ★★★★★ · Effort: ★★★★★
  Extend the LP solver from one plan to the *entire* network: given end-product
  targets plus saved factories and map resource nodes, decide which nodes to tap,
  where to place factories, and how to route — minimising total power, belts and
  transport distance. Builds on: calculator solver + factories + map + logistics.
  The crown-jewel feature; also the hardest.

- [ ] **2. Power-grid simulator** — Value: ★★★★ · Effort: ★★★
  Model generators (coal/fuel/nuclear/geothermal), fuel chains, and capacity vs.
  draw across all factories. Brownout warnings, battery buffering, "this factory
  trips the grid" alerts. Builds on: factories already track power draw — this
  adds the generation/balance half.

- [ ] **3. Save-file import (`.sav`)** — Value: ★★★★★ · Effort: ★★★★
  Parse a real save client-side in a web worker to auto-populate factories,
  *actual* production and map pins from the user's game. Already flagged as the
  map's placeholder killer feature. Turns the app from planner into connected
  companion. Library: `@etothepii/satisfactory-file-parser`.

- [ ] **4. Somersloop + overclocking optimizer** — Value: ★★★★ · Effort: ★★★
  The calculator defers these. Add a post-solve layer: exact clock-setting,
  machine rounding, power-cost curves, and somersloop production amplification
  within a shard/sloop budget. Endgame min/max optimisation.

- [ ] **5. Alternate-recipe advisor / what-if** — Value: ★★★★ · Effort: ★★★
  Given a target, evaluate *all* alternate-recipe combinations and rank by raw
  cost / power / build cost / complexity. Recommend *which hard-drive alternates
  to unlock* for the biggest payoff. Decision support on top of the LP. High
  value-to-effort.

- [ ] **6. On-map auto-router** — Value: ★★★★ · Effort: ★★★★★
  Draw real logistics routes on the map between factories — belt/lift/tower
  counts, pipe runs, train track + station placement — following terrain, with
  lengths and build cost. Builds on: map + logistics + throughput, made spatial.

- [ ] **7. Tech-tree-aware build-order planner** — Value: ★★★ · Effort: ★★★
  Given a goal item, compute the milestone/MAM/tier unlock path (which schematics
  you need) and a step-by-step "build this → unlocks that" roadmap. Builds on:
  the schematics data that's currently only browsable.

- [ ] **8. Real-time collaborative bases** — Value: ★★★★ · Effort: ★★★★
  Convex is already real-time — add multiplayer planning: shared factories/plans
  with live presence, cursors, comments, per-member ownership. Co-op groups plan
  one base together.

- [ ] **9. AWESOME Sink optimizer** — Value: ★★★ · Effort: ★★
  Plan production purely for coupon/ticket farming: sink-point throughput, best
  items to sink, and an "excess → sink" auto-balancer that routes every factory's
  surplus into sinks in the logistics view.

- [ ] **10. Natural-language planner ("AI architect")** — Value: ★★★★ · Effort: ★★★★
  "Give me 100 supercomputers/min using only nodes near the northern forest" →
  assembles targets, picks alternates, runs the solver, drops a plan. Builds on:
  everything — LP + data + map as tools behind an LLM.

## Smaller / supporting ideas

- [ ] Dependency & impact analysis — "change this recipe → what breaks downstream".
- [ ] Resource-node utilisation heatmap on the map (over/under-tapped nodes).
- [ ] 3D factory visualisation.
- [ ] Ramp-up / cost-over-time simulator (how long to bootstrap a plan).
- [ ] PWA / offline mode + mobile companion layout.
- [ ] Goal/progress dashboard tracking your run vs. game phases.

## Polish / tech debt

- [ ] Production tile independence — optionally self-host a vendored tile subset
  (z3–6, ~30 MB) and drop the SC tile proxy (`src/server-entry.ts`) to remove the
  runtime dependency on SC's CDN. See `src/features/map/MAP_README.md`.
- [ ] Map initial-view tuning (fit/zoom defaults on `/map`).
