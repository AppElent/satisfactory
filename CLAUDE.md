# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

TanStack React Start + Router (file-based routing) on Vite/SSR, deployed to Cloudflare Workers. Convex backend, Clerk auth (bridged to Convex via a JWT template named `convex`), Tailwind v4, Biome (not ESLint/Prettier), Vitest + jsdom + Testing Library. Package manager is **pnpm** — never npm/npx/yarn.

## Commands

```bash
pnpm install                # install deps (needs @appelent GitHub Packages auth, see README)
pnpm dev                     # vite dev, port 3000
pnpm run dev:watch           # convex dev (watching) + vite dev concurrently — use when editing convex/
pnpm run dev:all             # convex dev --once, then vite dev — convex fns won't re-sync after this
pnpm test                    # vitest run (all tests)
pnpm exec vitest run path/to/file.test.ts   # single test file
pnpm exec vitest run -t "test name"          # single test by name
pnpm run typecheck           # tsc --noEmit
pnpm run check               # biome check
pnpm run lint:fix            # biome check --write
pnpm run generate-routes     # tsr generate — regenerates src/routeTree.gen.ts
pnpm run generate-data       # regenerate src/data/generated/*.json from vendored source data
pnpm run cf-typegen          # wrangler types -> worker-configuration.d.ts
pnpm run deploy:dev          # convex dev --once, build:development, wrangler deploy --env dev
pnpm run deploy              # deploy:prod: convex deploy && vite build && wrangler deploy
```

`routeTree.gen.ts` is committed. There are two ways to produce it (`tsr generate` vs the Vite plugin during `vite build`) and they can disagree — **commit the build-produced version**, not the standalone `tsr generate` output, if the two diverge.

The dev server tends to land on port 3002 if 3000/3001 are already in use by other worktrees/sessions — check before assuming a stale process.

## Architecture

### Game data (`src/data/`)
Static Satisfactory game data (items, recipes, buildings, buildables, schematics, resources, resource nodes, generators, miners) lives as generated JSON under `src/data/generated/*.json`, produced by `pnpm run generate-data` and validated against `gameDataSchema` at generation time — **not** re-validated at runtime, so `src/data/index.ts` casts the JSON imports directly. Regenerate after touching `scripts/lib` or the vendored source data (`pnpm run vendor-nodes`, `pnpm run vendor-icons`). `src/data/index.ts` builds lookup maps (by slug) and cross-reference indexes (recipes producing/using an item) once at module load, and exposes a flat `searchEntities()` corpus across all entity types.

### Data browsing (`src/features/data/`, `src/routes/data/`)
Generic list/detail browsing for each entity type is driven by an `EntityListConfig<T>` (`src/features/data/list-config.ts`): each entity type (`configs/items.tsx`, `configs/recipes.tsx`, etc.) declares its detail route, search text, filters, and card renderer, and `EntityListPage` renders generically against that config. Routing requires **both** halves per entity: `data/<entity>.index.tsx` (list) and `data/<entity>.$slug.tsx` (detail) — a detail page silently won't render if the `.index` route is missing.

### Calculator / solver (`src/features/calculator/`)
Production-planning calculator built on a linear-programming solver (`solver/` — `highs.ts` wraps the `highs` WASM solver, `model.ts`/`solve.ts`/`derive.ts` build and interpret the LP model). The WASM loader needs the `highs/runtime?url` import form. Solver unit tests that touch the WASM module need `// @vitest-environment node` (jsdom breaks the WASM loader). `graph.ts` builds the production graph for visualization (rendered via `@xyflow/react` in `ProductionGraph.tsx`).

### Factories & multiplayer state (`src/features/factories/`, `convex/`)
Factories, games, and transports are persisted in Convex (`convex/schema.ts`, `convex/games.ts`, `convex/transports.ts`, `convex/factories.ts`) and scoped per-game under routes like `g.$gameId.factories.$factoryId.tsx`. `SignInPrompt.tsx` gates factory features behind auth.

### Auth (`@appelent/auth`)
Clerk↔Convex glue is provided by the shared private package `@appelent/auth` rather than hand-rolled — see `src/routes/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`, `src/integrations/clerk/`, and `src/features/account/AccountPanel.tsx`. `convex/auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` from the Convex deployment env (set via `convex env set`, not committed anywhere).

### Env validation (`src/env.ts`)
`@t3-oss/env-core` schema; client vars must be `VITE_`-prefixed (`VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_MAP_TILE_URL`, `VITE_TEST_USER_EMAIL`/`VITE_TEST_USER_PASSWORD` for the dev test-login button). Only `SERVER_URL` is server-side so far.

### Cloudflare Worker entry (`src/server-entry.ts`)
Custom Worker `fetch` handler, **not** the default `@tanstack/react-start/server-entry` — it proxies `/sc-tiles/*` map tile requests to `satisfactory-calculator.com` with a spoofed `Referer` (that site blocks hotlinking/cross-origin image loads otherwise) before delegating everything else to the TanStack SSR handler. `wrangler.jsonc`'s `main` points at this file deliberately; don't "fix" it back to the framework default.

## Supply-chain / pnpm config

`pnpm-workspace.yaml` holds `allowBuilds` (only `esbuild`, `workerd`, `sharp` — the last two are pulled in by `wrangler`/`miniflare` for local Worker execution; `@clerk/shared`'s postinstall is just a telemetry notice and stays denied) and `minimumReleaseAge: 4320` (3-day cooldown on new package versions, excluding `@appelent/*`). If a transitive dependency gets blocked by the release-age cooldown, prefer pinning it to an older compatible version via `overrides` (with a comment explaining why) over relaxing the policy.

<!-- appelent-managed:start -->
## Appelent Managed Project

This repo follows the shared Appelent project baseline.

Source of truth:
- `C:\Users\ericj\.claude\appelent\projects.json`
- `C:\Users\ericj\.claude\appelent\capabilities.json`
- `C:\Users\ericj\.claude\skills`

Web/browser fallback:
- `.claude\appelent`
- `.claude\skills`

Before adding functionality that could apply to multiple apps, check whether it belongs in:
- an existing or new `@appelent/*` package
- `custom-bootstrap`
- a capability skill such as `add-cli` or `add-i18n`

If you add, remove, or generalize cross-app functionality, update the Appelent registry files or explain why no registry change is needed.
<!-- appelent-managed:end -->
