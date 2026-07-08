# Phase 5 — Map — Design

**Date:** 2026-06-14
**Status:** Approved design, pending implementation plan
**Parent spec:** [2026-06-12-satisfactory-webapp-design.md](./2026-06-12-satisfactory-webapp-design.md) §6
**Goal:** An interactive Leaflet map of the game world with a tested game-coordinate transform, a factory-pin layer wired to saved factories (drag to relocate, right-click to add), a layer toggle panel, a pluggable tile background, and a data-driven resource-node layer left empty until a licensed dataset is supplied.

## Asset-sourcing decision (why no tiles/nodes are vendored)

Investigation found no cleanly-licensed source for either map tiles or resource-node coordinates:

- **greeny's SatisfactoryTools** repo (our icons/data source) contains no map assets.
- **Satisfactory-Calculator's** interactive map tiles are, per their own terms, "solely intended to be used on the satisfactory-calculator.com domain" — hotlinking or re-hosting is off-limits.
- **AnthorNet/SC-InteractiveMap** is public but has **no license** (legally all-rights-reserved), and its node coordinates are embedded in JS source, not a drop-in dataset.

So Phase 5 ships the full map infrastructure from data we own, and keeps third-party assets cleanly separable: the tile background is a configurable URL the user points at assets they have rights to, and resource nodes load from a documented pipeline slot the user populates with a dataset they're comfortable using. Real tiles and nodes become a config/data drop with no code change.

## Scope

**In (v1):** client-only Leaflet map (`CRS.Simple`); pure, tested coordinate transform (game cm ↔ map pixels); factory-pin layer (drag-relocate, add-here, popups); layer toggle panel; pluggable tile background via env var; `resource-nodes.json` pipeline slot (empty) + the resource-node layer that renders it; `map` feature flipped to `beta`.

**Out (deferred; registry sub-features stay `planned`):** populated resource-node data; geyser / slug / drop-pod layers; save-file (`.sav`) parsing/rendering. Each is a cheap data/layer addition later.

## 1. Dependencies

Add `leaflet` and `react-leaflet` (the design mandates Leaflet — this install is in-scope). No other new packages.

## 2. Routing & rendering

- `/map` becomes a **client-only route** (`ssr: false` in the route options) — Leaflet accesses `window`, so it must never render server-side.
- `src/features/map/MapView.tsx` is **lazy-loaded** (same pattern as `ProductionGraph`), rendering a react-leaflet `MapContainer` configured with `CRS.Simple`, the tile layer (§4), and the active overlay layers.
- `import "leaflet/dist/leaflet.css"` in the lazy module only.

## 3. Coordinate transform — `src/features/map/coords.ts`

Pure functions, no Leaflet import in the testable core, fully Vitest-tested.

- Satisfactory stores world positions in **centimetres with the origin at the world centre** — identical to save files and our factory `location` field. We never store pixel coordinates.
- A `WORLD_BOUNDS` constant gives the world extent in cm; a `CANVAS_SIZE` constant gives the Leaflet pixel canvas size. The transform is a linear map between them:
  - `worldToPixel({ x, y }) → { px, py }`
  - `pixelToWorld({ px, py }) → { x, y }`
  - round-trip is identity (within float epsilon).
- Default `WORLD_BOUNDS`: the documented Satisfactory playable extents (≈ ±375,000 cm per axis). Exact values matter only when real tiles are aligned; they live in one constant so a future tile set adjusts them in one place.
- `MapView` wraps these to convert to/from Leaflet `LatLng` (CRS.Simple treats lat=y, lng=x in pixel space).

## 4. Tile background — configurable URL

- `VITE_MAP_TILE_URL` (optional, added to `env.ts` client schema as `z.string().optional()`) is the `L.tileLayer` URL template (e.g. `https://…/{z}/{x}/{y}.png`).
- Unset → no tile layer; the `MapContainer` shows a neutral themed background colour. No broken-tile icons ever appear.
- A short `MAP_README` note in `src/features/map/` documents the expected tile scheme and that tiles must be a source the user has rights to.

## 5. Factory-pin layer — `src/features/map/FactoryPinsLayer.tsx` (sign-in)

- Reads `api.factories.list`; renders a Leaflet marker for every factory whose `location` is set, placed via `worldToPixel`.
- Marker popup: factory name, status badge, efficiency badge (when actuals exist — reuse `efficiency` from the factories feature), and a link to `/factories/$factoryId`.
- **Drag** a marker → on drag-end, `update({ id, location: pixelToWorld(latlng) })` (optimistic).
- **Right-click / long-press** on empty map → "Add factory here": calls `create` with `{ name: "New factory", status: "planned", production: { source: "manual", inputs: [], outputs: [], machines: [] }, location }`, then navigates to the new `/factories/$factoryId`.
- **Convex extension (in-scope):** add `location: v.optional(v.object({ x: v.number(), y: v.number() }))` to both `create` and `update` args in `convex/factories.ts` (the schema field already exists from Phase 4; only the function args need it).
- Anonymous visitors: the pin layer is simply absent; the map and resource layer still render. A small "sign in to see your factories" note appears in the layer panel.

## 6. Layer panel — `src/features/map/LayerPanel.tsx`

A toggle panel listing:

- **Factory pins** — on by default (sign-in gated).
- **Resource nodes** — on by default (renders nothing until data is supplied).
- **Geysers**, **Slugs**, **Save-file** — disabled "soon" rows, each a registry sub-feature.

Layer visibility is local component state (not persisted in v1).

## 7. Resource-node layer + pipeline slot

- `scripts/generate-data.ts` emits `src/data/generated/resource-nodes.json`. In v1 this is `[]` (or read from an optional `data/vendor/resource-nodes.json` source if present, validated). The build never fails on an empty set.
- Zod schema `ResourceNode = { id: string, x: number, y: number, type: string, purity: "impure" | "normal" | "pure" }` in `src/data/schema.ts`; accessor `listResourceNodes()` in the data layer.
- `src/features/map/ResourceNodesLayer.tsx` renders a marker per node via `worldToPixel`, with type + purity filters in the layer panel. Empty data → no markers, no error.

## 8. Error handling & registry

- Client-only route + lazy load keeps Leaflet (and its `window` use) off the server and out of the main bundle.
- Missing tile URL → neutral background, never broken tiles.
- Unknown factory/node fields degrade gracefully (no crash).
- Flip the `map` feature registry entry `planned` → `beta`; keep resource-node/geyser/slug/save-file as `planned` sub-features in the registry copy.

## 9. Testing

- **Vitest (pure):** `coords.ts` round-trip + known-point transforms; the `ResourceNode` Zod schema (valid parse + rejects bad purity).
- **Component (testing-library):** `LayerPanel` toggling layer visibility.
- The Leaflet `MapView` is DOM/client-only — light smoke only (it renders without crashing given an empty factory list); no deep Leaflet interaction tests.

## Verification gates

`biome check` · `tsc --noEmit` · `vitest run` · `vite build` all green, plus a manual pass: `/map` renders the neutral map; signed in, a factory with a `location` shows a pin; dragging it persists; right-click creates a factory and navigates to it; layer toggles work.
