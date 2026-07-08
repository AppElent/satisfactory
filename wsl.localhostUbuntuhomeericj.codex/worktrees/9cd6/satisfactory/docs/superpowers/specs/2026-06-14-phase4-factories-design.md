# Phase 4 — Factories — Design

**Date:** 2026-06-14
**Status:** Approved design, pending implementation plan
**Parent spec:** [2026-06-12-satisfactory-webapp-design.md](./2026-06-12-satisfactory-webapp-design.md) §5
**Goal:** Persist user factories (from a frozen calculator plan or manual entry), derive build cost / power / efficiency from static game data, and surface them in a grid + detail UI. This is the first phase to use the Convex + Clerk persistence layer end to end.

## Scope

**In (v1):**

- Convex + Clerk auth integration (the foundation — nothing persists without it).
- `factories` Convex table + authenticated CRUD.
- `/factories` card grid and `/factories/$id` detail.
- Build-cost / power derivation (pure, from static game data).
- **Save as factory** from the calculator (frozen plan snapshot).
- **Manual production entry** (inputs / outputs / machines).
- **Efficiency tracking** via user-entered actual rates.

**Out (deferred, with reasons):**

- Saved-plan presets (`savedPlans` table) — independent of factories; a small later phase.
- Cross-factory totals (surplus / unmet need) — feeds Logistics (Phase 6); built there.
- Map `location` pin interaction — needs the Map (Phase 5). The schema field is reserved now so no migration is needed later.
- Somersloop amplification, save-file import — already registry placeholders.

## 1. Auth integration (foundation)

The scaffold currently mounts `ClerkProvider` and a plain `ConvexProvider` separately, so Convex functions never receive the Clerk identity. Phase 4 wires them together.

- `convex/auth.config.ts` registers Clerk as the auth provider:
  ```ts
  export default {
    providers: [
      { domain: process.env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" },
    ],
  };
  ```
  `CLERK_JWT_ISSUER_DOMAIN` is a Convex deployment env var (set in the Convex dashboard from the Clerk JWT template's issuer URL), **not** a client/`t3env` var.
- Replace `ConvexProvider` with `ConvexProviderWithClerk` (passed Clerk's `useAuth`). Ensure `ClerkProvider` wraps the Convex provider in `src/routes/__root.tsx`.
- Add `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` to the validated `env.ts` client schema (today they're read raw via `import.meta.env`). Both are required client vars.

**External setup (already done by the user):** Convex dev deployment running, Clerk app with a JWT template named `convex`, `.env.local` populated with real keys. Phase 4 only writes the code wiring and verifies against that live deployment.

## 2. Convex schema + functions

Remove the unused scaffold demo tables (`products`, `todos`) — and the demo `convex/todos.ts` functions — when introducing the real schema.

```ts
factories: defineTable({
  userId: v.string(),                       // Clerk subject from ctx.auth
  name: v.string(),
  description: v.optional(v.string()),
  notes: v.optional(v.string()),
  status: v.union(
    v.literal("planned"), v.literal("building"),
    v.literal("operational"), v.literal("paused"),
  ),
  location: v.optional(v.object({ x: v.number(), y: v.number() })), // reserved (Map)
  production: v.union(
    // Frozen calculator result, stored as a JSON string (see below).
    v.object({ source: v.literal("plan"), plan: v.string() }),
    v.object({
      source: v.literal("manual"),
      inputs: v.array(itemRate),
      outputs: v.array(itemRate),
      machines: v.array(v.object({
        building: v.string(),
        count: v.number(),
        clock: v.optional(v.number()),
      })),
    }),
  ),
  actuals: v.optional(v.array(itemRate)),   // user-entered measured rates
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

`itemRate = v.object({ item: v.string(), rate: v.number() })` (item = data-layer slug).

**Plan snapshots** (`{ spec, solution }`) are stored as a **JSON string** (`plan: v.string()`) and Zod-parsed on read. Rationale: the `Solution`/`ProblemSpec` shapes are large and evolve with the solver; a typed Convex mirror would drift and force schema migrations on every solver change. A JSON string keeps the table stable and matches the design's "frozen snapshot" and "Zod at every boundary" principles. Manual `inputs/outputs/machines` are small and stable, so they use typed validators.

**Functions — `convex/factories.ts`:**

- `list` (query) — factories for the authed user via the `by_user` index.
- `get` (query) — one factory by id; returns `null` if not owned by the caller.
- `create` (mutation) — insert with `userId` from `ctx.auth.getUserIdentity()`; sets timestamps.
- `update` (mutation) — patch name/status/description/notes/actuals/production; ownership-checked.
- `remove` (mutation) — delete; ownership-checked.

Every function resolves `ctx.auth.getUserIdentity()` and throws when it is `null` or when the target factory's `userId` does not match.

## 3. Derived values — `src/features/factories/derive.ts`

Pure functions, no Convex import, fully Vitest-tested:

- `buildCost(machines)` → aggregated construction materials + total power draw, reusing `src/data/queries.ts` `getBuildCost` and the calculator's existing power/cost logic. (Shared logic is extracted rather than duplicated.)
- `efficiency(planned, actuals)` → per-output `actual ÷ planned` plus an aggregate score for the headline badge. `planned` comes from the frozen `solution` (plan source) or the entered `outputs` (manual source).

## 4. Pages & routing

Apply the established `.index.tsx`-parent convention (Phase 2 routing lesson): rename `src/routes/factories.tsx` → `factories.index.tsx` and add `factories.$factoryId.tsx`.

- **`/factories`** — card grid: name, status badge, top outputs, efficiency badge (when `actuals` present), reserved pin indicator. A "New factory" action opens the manual-entry form. Signed-out visitors see a sign-in prompt + a short feature tour instead of the grid.
- **`/factories/$id`** — tabs:
  - **Overview** — I/O summary + efficiency (when actuals entered).
  - **Plan** — read-only embedded `ResultTabs` for plan-source factories (re-hydrated from the snapshot).
  - **Build cost** — aggregated materials + power.
  - **Notes** — free text.
  - Name / status / notes / actuals are editable inline (→ `update` mutation, optimistic).

## 5. Save as factory (calculator wiring)

Add a "Save as factory" action to the calculator results area:

- Signed in → call `create` with the frozen `{ spec, solution }` (JSON-stringified), then navigate to the new `/factories/$id`.
- Signed out → sign-in prompt.

## 6. Manual entry form

A form to add / edit `inputs[]`, `outputs[]`, `machines[]` (building + count + optional clock), reusing the slug-autocomplete patterns from `TargetEditor` / `AvailableInputsEditor`. Used both for "New factory" and for editing a manual factory.

## 7. Error handling & registry

- Unknown item/building slugs (after a future game-data update) render a warning badge, never crash — applies to plan snapshots and manual entries alike.
- Route-level error boundary + not-found component for missing or forbidden factory ids.
- Convex mutations use optimistic updates where safe with toast-based error recovery.
- Flip the `factories` feature registry entry from `planned` to `beta` (drops the "soon" nav badge).

## 8. Testing

- **Vitest (pure):** `derive.ts` (efficiency, build-cost aggregation) and plan-snapshot Zod parse / round-trip.
- **Component (testing-library):** manual-entry form and factory card.
- **Convex auth/ownership:** verified manually against the running deployment. `convex-test` is intentionally **not** added (avoids a new dependency); the auth-gating logic is small and exercised through the live UI.

## Verification gates (per phase convention)

`biome check` · `tsc --noEmit` · `vitest run` · `vite build` all green, plus a manual end-to-end pass on the live deployment: sign in → save a calculator plan as a factory → see it in the grid → open detail → enter actuals → see efficiency → edit/delete.
