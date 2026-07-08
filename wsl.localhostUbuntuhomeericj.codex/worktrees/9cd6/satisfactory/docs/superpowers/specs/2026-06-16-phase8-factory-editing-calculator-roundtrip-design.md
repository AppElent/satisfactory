# Phase 8 — Factory/Game editing + Calculator round-trip — Design

**Date:** 2026-06-16
**Status:** Approved design, pending implementation plan
**Goal:** Make factory and game detail views fully editable, give manual factories a real production graph, and let any factory be opened in the calculator, edited, and saved back in place.

## Scope

**In (v1):**

- A `factoryToSpec` helper turning a factory's production into a calculator `ProblemSpec`.
- Manual factories show a solved production graph in their Plan tab.
- "Open in calculator" from a factory, with **save-back-in-place** (re-save onto the same factory).
- Factory detail editing: status, description, and full manual production (inputs/outputs/machines).
- Game settings editing (owner-only): rename, description, delete.

**Out:** changing a plan factory's production by hand (it's edited via the calculator round-trip); per-machine recipe assignment on manual factories (machines remain a building+count list).

## 1. `factoryToSpec` helper

Pure function in `src/features/factories/factory-view.ts`, unit-tested:

```ts
factoryToSpec(production: Production): ProblemSpec
```

- **plan** source → `decodeSnapshot(plan)?.spec` (the exact saved spec); falls back to an empty spec (`{ targets: [], allowedAlternates: [] }`) if the snapshot is unparseable.
- **manual** source → `{ targets: production.outputs, availableInputs: production.inputs, allowedAlternates: [] }`.

This single helper feeds both the manual-factory graph (§2) and "open in calculator" (§3).

## 2. Manual factory graph (solve I/O → real graph)

In `FactoryDetail`'s **Plan** tab:

- **plan** factories keep rendering their stored `snapshot.solution` via `ResultTabs` (no re-solve).
- **manual** factories run `useSolver(factoryToSpec(production))` and render the resulting `Solution` via `ResultTabs` — the same graph/table/resources/power views, showing how the outputs are produced from the inputs (and raws). Loading → "Solving…"; infeasible/empty → the existing `ResultTabs` infeasibility/empty state.

The literally-entered I/O still drives the **Overview** (planned vs actual) and **Build cost** (`manualBuildCost`/`manualPower` from the machine list) tabs unchanged.

## 3. Open in calculator + save-back-in-place

- A **"Open in calculator"** button on `FactoryDetail` links to
  `/calculator?plan=<encodePlan(factoryToSpec(production))>&fromFactory=<factoryId>&fromGame=<gameId>`.
- `src/routes/calculator.tsx` `validateSearch` accepts optional `fromFactory` and `fromGame` strings (alongside the existing `plan`).
- `CalculatorPage` reads them and passes them to `SaveAsFactoryButton`.
- **`SaveAsFactoryButton`** behaviour:
  - When `fromFactory` is present → a **"Save changes to this factory"** button that calls
    `factories.update({ id: fromFactory, production: { source: "plan", plan: encodeSnapshot({ spec, solution }) } })`
    then navigates to `/g/$fromGame/factories/$fromFactory`. (Re-saving always writes a **plan-source** production — re-saving a manual factory converts it to a plan factory; this is intended.)
  - When `fromFactory` is absent → the existing **"Save as new factory"** game-picker flow, unchanged.

## 4. Factory detail editing

`FactoryDetail` gains, alongside the existing inline name/notes/actuals editing:

- a **status `<select>`** (planned/building/operational/paused) → inline `patch({ id, status })`.
- a **description** input → inline `patch({ id, description })`.
- an **"Open in calculator"** button (§3).
- for **manual** factories, an **"Edit production"** toggle that renders `ManualFactoryForm` in **edit mode**.

`ManualFactoryForm` is extended to support both create and edit:

- new optional props `factoryId?: Id<"factories">` and `initial?: { name, status, inputs, outputs, machines }`.
- when `factoryId` is set it pre-fills from `initial` and saves via `factories.update({ id, production: { source: "manual", inputs, outputs, machines } })` (and name/status) instead of `create`.

A new **`MachineEditor`** component (mirroring `ItemRateEditor`) edits the machine list: a building picker (from the data layer's buildings/buildables that process recipes) + count + optional clock. It's used inside `ManualFactoryForm`.

## 5. Game settings editing (owner-only)

`GameSettings` gains an owner-only section:

- **rename + description**: a small form (name input + description input) → `games.rename({ gameId, name, description })` (the existing mutation already takes both).
- **delete**: a button with a typed "delete" confirmation → `games.remove({ gameId })` → navigate to `/games`.

Non-owners don't see this section (gated on `game.role === "owner"`, like the invite UI).

## 6. Error handling

- Mutations are wrapped with the existing toast-on-failure pattern.
- Manual-factory solve infeasibility/empty handled by `ResultTabs`.
- `factoryToSpec` returns a safe empty spec on an unparseable plan snapshot.
- Re-save / update failures surface a toast; ownership is enforced server-side by `requireMember(editor)`.

## 7. Testing

- **Vitest (pure):** `factoryToSpec` — plan source returns the stored spec; manual source maps outputs→targets and inputs→availableInputs; unparseable plan → empty spec.
- **Component (testing-library):** `ManualFactoryForm` edit mode (pre-fills + calls update); `GameSettings` rename (calls `games.rename`).
- Convex behaviour verified against the deployment; manual end-to-end pass.

## Verification gates

`biome check` · `tsc --noEmit` · `vitest run` · `vite build` all green, plus a manual pass: edit a factory's status/description/manual I/O+machines; open a manual factory's Plan tab and see a solved graph; "Open in calculator" from a plan and a manual factory, tweak, "Save changes to this factory", and see the factory updated; rename + delete a game from settings.
