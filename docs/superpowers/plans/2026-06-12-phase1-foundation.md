# Phase 1: Foundation — Data Pipeline + App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the game-data pipeline (greeny's data1.0.json → our typed schema → generated JSON modules + access layer) and the app shell with every route from the spec live as informative placeholders.

**Architecture:** A node script validates the vendored source with Zod, transforms it into our own schema (strict reference resolution, building/buildable classification, slug de-duplication), and emits committed JSON modules into `src/data/generated/`. `src/data/index.ts` is the only consumer of those files and exposes typed accessors. The shell is TanStack Start file routes: top nav from a feature registry, a `/data` section with sub-sidebar, and `<ComingSoon>` placeholder pages driven by the same registry.

**Tech Stack:** TanStack Start/Router, React 19, Zod 4, Vitest 4, Tailwind 4, Biome, Convex (untouched this phase), Node 26 (runs `.ts` scripts natively — no tsx needed).

**Spec:** `docs/superpowers/specs/2026-06-12-satisfactory-webapp-design.md`

---

## Verified facts about the source data (already inspected — do not re-derive)

`data/vendor/greeny-data1.0.json` (1.7MB, already downloaded) has top-level keys `items` (175), `recipes` (797), `schematics` (437), `generators` (4), `resources` (13), `miners` (5), `buildings` (500). All keyed by `className`. Every field listed in the Zod schemas below is present and non-null on every entry (verified exhaustively). Known quirks the transform must handle:

- **Duplicate slugs:** 1 duplicate in `buildings`, 6 in `schematics` → de-dupe by suffixing `-2`, `-3`, …
- **Dangling refs (drop + warn, do NOT fail):** 86 `schematics[].unlock.recipes` entries and 8 `schematics[].requiredSchematics` entries reference classNames absent from the file.
- **Clean refs (resolve strictly, fail on miss):** all recipe `ingredients`/`products`/`producedIn`, all generator `fuel`, all miner `allowedResources`, all `resources[].item`, all schematic `cost` items. Generator/miner classNames all exist in `buildings`.
- **Classification:** the producer set = every className in any recipe's `producedIn` ∪ generator keys ∪ miner keys = exactly 20 classes, all present in `buildings` → 20 buildings, 480 buildables.
- Fluid amounts are already in m³ (no ÷1000 conversion needed).

Other verified environment facts:

- `npx vitest run` currently **fails at startup** (Cloudflare Vite plugin incompatible with Vitest) → Task 2 adds a dedicated `vitest.config.ts`, which Vitest automatically prefers over `vite.config.ts`.
- `node --version` = v26 → `node scripts/generate-data.ts` runs TypeScript directly (type stripping). Use explicit `.ts` extensions in script-land imports (`allowImportingTsExtensions` is already on).
- tsconfig paths `#/*` → `./src/*` (also wired in `package.json` `imports`). Biome enforces formatting — run `npx biome check --write .` before every commit.
- Repo currently has exactly one commit (the spec). The scaffold is untracked.

---

### Task 1: Commit the scaffold + housekeeping

**Files:**
- Modify: `.gitignore`
- Commit: everything untracked (scaffold + `data/vendor/greeny-data1.0.json`)

- [ ] **Step 1: Extend .gitignore**

Append to `.gitignore`:

```
# claude local files
.claude/settings.local.json
CLAUDE.local.md
.superpowers/

# generated docs
docs/.generated
```

- [ ] **Step 2: Verify no secrets get staged**

Run: `git add -A && git status --short | grep -E "\.env"`
Expected: only `.env.example` appears. `.env.local` must NOT appear (covered by the existing `*.local` rule). If it appears, STOP and fix `.gitignore` first.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: commit tanstack scaffold and vendored game data snapshot"
```

---

### Task 2: Make Vitest work (dedicated config)

**Files:**
- Create: `vitest.config.ts`
- Modify: `tsconfig.json` (add `resolveJsonModule`)

- [ ] **Step 1: Confirm the failure (known)**

Run: `npx vitest run --passWithNoTests`
Expected: Startup Error mentioning "incompatible with the Cloudflare Vite plugin".

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 3: Add `"resolveJsonModule": true` to `tsconfig.json` `compilerOptions`**

(Needed so TS understands the generated JSON imports in `src/data/index.ts` later.)

- [ ] **Step 4: Verify Vitest starts**

Run: `npx vitest run --passWithNoTests`
Expected: exits 0, "No test files found" message, no startup error. If `resolve.tsconfigPaths` is rejected by the installed Vitest major, replace it with an explicit alias: `resolve: { alias: { '#': fileURLToPath(new URL('./src', import.meta.url)) } }` (import `fileURLToPath` from `node:url`) and re-run.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "chore: dedicated vitest config (cloudflare plugin is vitest-incompatible)"
```

---

### Task 3: Source schema (Zod model of greeny's format)

**Files:**
- Create: `scripts/lib/source-schema.ts`
- Test: `scripts/lib/source-schema.test.ts`

- [ ] **Step 1: Write the failing test**

`scripts/lib/source-schema.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sourceDataSchema } from './source-schema.ts'

describe('sourceDataSchema', () => {
  it('parses the vendored greeny data file', () => {
    const raw = JSON.parse(
      readFileSync('data/vendor/greeny-data1.0.json', 'utf8'),
    )
    const parsed = sourceDataSchema.parse(raw)
    expect(Object.keys(parsed.items)).toHaveLength(175)
    expect(Object.keys(parsed.recipes)).toHaveLength(797)
    expect(Object.keys(parsed.schematics)).toHaveLength(437)
    expect(Object.keys(parsed.buildings)).toHaveLength(500)
    expect(Object.keys(parsed.generators)).toHaveLength(4)
    expect(Object.keys(parsed.resources)).toHaveLength(13)
    expect(Object.keys(parsed.miners)).toHaveLength(5)
  })

  it('rejects malformed data', () => {
    expect(() => sourceDataSchema.parse({ items: 'nope' })).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/lib/source-schema.test.ts`
Expected: FAIL — cannot resolve `./source-schema.ts`.

- [ ] **Step 3: Implement `scripts/lib/source-schema.ts`**

```ts
import { z } from 'zod'

const color = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
  a: z.number(),
})

const itemAmount = z.object({ item: z.string(), amount: z.number() })

export const sourceItemSchema = z.object({
  slug: z.string(),
  icon: z.string(),
  name: z.string(),
  description: z.string(),
  sinkPoints: z.number(),
  className: z.string(),
  stackSize: z.number(),
  energyValue: z.number(),
  radioactiveDecay: z.number(),
  liquid: z.boolean(),
  fluidColor: color,
})

export const sourceRecipeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  className: z.string(),
  alternate: z.boolean(),
  time: z.number(),
  inHand: z.boolean(),
  forBuilding: z.boolean(),
  inWorkshop: z.boolean(),
  inMachine: z.boolean(),
  manualTimeMultiplier: z.number(),
  ingredients: z.array(itemAmount),
  products: z.array(itemAmount),
  producedIn: z.array(z.string()),
  isVariablePower: z.boolean(),
  minPower: z.number(),
  maxPower: z.number(),
})

export const sourceSchematicSchema = z.object({
  className: z.string(),
  type: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  cost: z.array(itemAmount),
  unlock: z.object({
    recipes: z.array(z.string()),
    scannerResources: z.array(z.string()),
    inventorySlots: z.number(),
    giveItems: z.array(itemAmount),
  }),
  requiredSchematics: z.array(z.string()),
  tier: z.number(),
  time: z.number(),
  mam: z.boolean(),
  alternate: z.boolean(),
})

export const sourceGeneratorSchema = z.object({
  className: z.string(),
  fuel: z.array(z.string()),
  powerProduction: z.number(),
  powerProductionExponent: z.number(),
  waterToPowerRatio: z.number(),
})

export const sourceResourceSchema = z.object({
  item: z.string(),
  pingColor: color,
  speed: z.number(),
})

export const sourceMinerSchema = z.object({
  className: z.string(),
  allowedResources: z.array(z.string()),
  allowLiquids: z.boolean(),
  allowSolids: z.boolean(),
  itemsPerCycle: z.number(),
  extractCycleTime: z.number(),
})

export const sourceBuildingSchema = z.object({
  slug: z.string(),
  icon: z.string(),
  name: z.string(),
  description: z.string(),
  className: z.string(),
  categories: z.array(z.string()),
  buildMenuPriority: z.number(),
  metadata: z.object({
    powerConsumption: z.number().default(0),
    powerConsumptionExponent: z.number().default(0),
    manufacturingSpeed: z.number().default(0),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
    length: z.number(),
  }),
})

export const sourceDataSchema = z.object({
  items: z.record(z.string(), sourceItemSchema),
  recipes: z.record(z.string(), sourceRecipeSchema),
  schematics: z.record(z.string(), sourceSchematicSchema),
  generators: z.record(z.string(), sourceGeneratorSchema),
  resources: z.record(z.string(), sourceResourceSchema),
  miners: z.record(z.string(), sourceMinerSchema),
  buildings: z.record(z.string(), sourceBuildingSchema),
})

export type SourceData = z.infer<typeof sourceDataSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/lib/source-schema.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: zod schema for greeny source data"
```

---

### Task 4: Target schema (our game-data format)

**Files:**
- Create: `src/data/schema.ts`

No dedicated test — these are declarations exercised heavily by Task 5's transform tests and Task 7's integrity tests.

- [ ] **Step 1: Create `src/data/schema.ts`**

```ts
import { z } from 'zod'

export const itemAmountSchema = z.object({
  /** Slug of an item or buildable. */
  item: z.string(),
  amount: z.number(),
})

export const itemSchema = z.object({
  slug: z.string(),
  className: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  form: z.enum(['solid', 'fluid']),
  stackSize: z.number(),
  sinkPoints: z.number(),
  energyValue: z.number(),
  radioactiveDecay: z.number(),
})

export const recipeSchema = z.object({
  slug: z.string(),
  className: z.string(),
  name: z.string(),
  alternate: z.boolean(),
  /** Seconds per craft. Per-minute rate = amount * 60 / time. */
  time: z.number(),
  ingredients: z.array(itemAmountSchema),
  products: z.array(itemAmountSchema),
  /** Building slugs. Empty for hand/workshop/build-gun recipes. */
  producedIn: z.array(z.string()),
  forBuilding: z.boolean(),
  inMachine: z.boolean(),
  inHand: z.boolean(),
  inWorkshop: z.boolean(),
  isVariablePower: z.boolean(),
  minPower: z.number(),
  maxPower: z.number(),
})

export const buildingSchema = z.object({
  slug: z.string(),
  className: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  powerConsumption: z.number(),
  powerConsumptionExponent: z.number(),
  manufacturingSpeed: z.number(),
  size: z.object({
    width: z.number(),
    height: z.number(),
    length: z.number(),
  }),
})

export const buildableSchema = z.object({
  slug: z.string(),
  className: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  categories: z.array(z.string()),
  size: z.object({
    width: z.number(),
    height: z.number(),
    length: z.number(),
  }),
})

export const schematicSchema = z.object({
  slug: z.string(),
  className: z.string(),
  name: z.string(),
  type: z.string(),
  tier: z.number(),
  cost: z.array(itemAmountSchema),
  /** Recipe slugs. Source refs that don't resolve are dropped (known data quirk). */
  unlockRecipes: z.array(z.string()),
  /** Schematic slugs. Source refs that don't resolve are dropped (known data quirk). */
  requiredSchematics: z.array(z.string()),
  mam: z.boolean(),
  alternate: z.boolean(),
})

export const resourceSchema = z.object({
  /** Item slug. */
  item: z.string(),
  /** Extraction speed multiplier. */
  speed: z.number(),
})

export const generatorSchema = z.object({
  className: z.string(),
  /** Building slug. */
  building: z.string(),
  /** Item slugs. */
  fuels: z.array(z.string()),
  powerProduction: z.number(),
  powerProductionExponent: z.number(),
  waterToPowerRatio: z.number(),
})

export const minerSchema = z.object({
  className: z.string(),
  /** Building slug. */
  building: z.string(),
  /** Item slugs. */
  allowedResources: z.array(z.string()),
  allowLiquids: z.boolean(),
  allowSolids: z.boolean(),
  itemsPerCycle: z.number(),
  extractCycleTime: z.number(),
})

export const gameDataSchema = z.object({
  items: z.array(itemSchema),
  recipes: z.array(recipeSchema),
  buildings: z.array(buildingSchema),
  buildables: z.array(buildableSchema),
  schematics: z.array(schematicSchema),
  resources: z.array(resourceSchema),
  generators: z.array(generatorSchema),
  miners: z.array(minerSchema),
})

export type ItemAmount = z.infer<typeof itemAmountSchema>
export type Item = z.infer<typeof itemSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type Building = z.infer<typeof buildingSchema>
export type Buildable = z.infer<typeof buildableSchema>
export type Schematic = z.infer<typeof schematicSchema>
export type Resource = z.infer<typeof resourceSchema>
export type Generator = z.infer<typeof generatorSchema>
export type Miner = z.infer<typeof minerSchema>
export type GameData = z.infer<typeof gameDataSchema>
```

- [ ] **Step 2: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: target game-data schema and types"
```

---

### Task 5: Transform (source → target)

**Files:**
- Create: `scripts/lib/transform.ts`
- Test: `scripts/lib/transform.test.ts`

- [ ] **Step 1: Write the failing tests**

`scripts/lib/transform.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { SourceData } from './source-schema.ts'
import { TransformError, transform } from './transform.ts'

const color = { r: 0, g: 0, b: 0, a: 0 }
const size = { width: 0, height: 0, length: 0 }
const meta = {
  powerConsumption: 4,
  powerConsumptionExponent: 1.3,
  manufacturingSpeed: 1,
}

function item(className: string, slug: string, liquid = false) {
  return {
    slug,
    icon: slug,
    name: slug,
    description: '',
    sinkPoints: 1,
    className,
    stackSize: 100,
    energyValue: 0,
    radioactiveDecay: 0,
    liquid,
    fluidColor: color,
  }
}

function building(className: string, slug: string) {
  return {
    slug,
    icon: slug,
    name: slug,
    description: '',
    className,
    categories: [],
    buildMenuPriority: 0,
    metadata: meta,
    size,
  }
}

function recipe(
  className: string,
  slug: string,
  overrides: Partial<SourceData['recipes'][string]> = {},
) {
  return {
    slug,
    name: slug,
    className,
    alternate: false,
    time: 2,
    inHand: false,
    forBuilding: false,
    inWorkshop: false,
    inMachine: true,
    manualTimeMultiplier: 1,
    ingredients: [{ item: 'Desc_OreIron_C', amount: 1 }],
    products: [{ item: 'Desc_IronIngot_C', amount: 1 }],
    producedIn: ['Desc_SmelterMk1_C'],
    isVariablePower: false,
    minPower: 0,
    maxPower: 1,
    ...overrides,
  }
}

function schematic(
  className: string,
  slug: string,
  overrides: Partial<SourceData['schematics'][string]> = {},
) {
  return {
    className,
    type: 'EST_Milestone',
    name: slug,
    slug,
    icon: slug,
    cost: [{ item: 'Desc_OreIron_C', amount: 10 }],
    unlock: {
      recipes: ['Recipe_IngotIron_C'],
      scannerResources: [],
      inventorySlots: 0,
      giveItems: [],
    },
    requiredSchematics: [],
    tier: 1,
    time: 0,
    mam: false,
    alternate: false,
    ...overrides,
  }
}

function fixture(): SourceData {
  return {
    items: {
      Desc_OreIron_C: item('Desc_OreIron_C', 'iron-ore'),
      Desc_IronIngot_C: item('Desc_IronIngot_C', 'iron-ingot'),
      Desc_Water_C: item('Desc_Water_C', 'water', true),
    },
    recipes: {
      Recipe_IngotIron_C: recipe('Recipe_IngotIron_C', 'iron-ingot'),
      Recipe_Wall_C: recipe('Recipe_Wall_C', 'wall', {
        forBuilding: true,
        inMachine: false,
        ingredients: [{ item: 'Desc_IronIngot_C', amount: 2 }],
        products: [{ item: 'Desc_Wall_C', amount: 1 }],
        producedIn: [],
      }),
    },
    schematics: {
      Schematic_T1_C: schematic('Schematic_T1_C', 'tier-1'),
    },
    generators: {},
    resources: {
      Desc_OreIron_C: { item: 'Desc_OreIron_C', pingColor: color, speed: 1 },
    },
    miners: {},
    buildings: {
      Desc_SmelterMk1_C: building('Desc_SmelterMk1_C', 'smelter'),
      Desc_Wall_C: building('Desc_Wall_C', 'wall'),
    },
  }
}

describe('transform', () => {
  it('classifies producers as buildings and the rest as buildables', () => {
    const { data } = transform(fixture())
    expect(data.buildings.map((b) => b.slug)).toEqual(['smelter'])
    expect(data.buildables.map((b) => b.slug)).toEqual(['wall'])
  })

  it('resolves references to slugs', () => {
    const { data } = transform(fixture())
    const ingot = data.recipes.find((r) => r.slug === 'iron-ingot')
    expect(ingot?.ingredients).toEqual([{ item: 'iron-ore', amount: 1 }])
    expect(ingot?.producedIn).toEqual(['smelter'])
    const wall = data.recipes.find((r) => r.slug === 'wall')
    expect(wall?.products).toEqual([{ item: 'wall', amount: 1 }])
    expect(data.resources[0]?.item).toBe('iron-ore')
  })

  it('marks fluids', () => {
    const { data } = transform(fixture())
    expect(data.items.find((i) => i.slug === 'water')?.form).toBe('fluid')
    expect(data.items.find((i) => i.slug === 'iron-ore')?.form).toBe('solid')
  })

  it('de-duplicates colliding slugs deterministically', () => {
    const source = fixture()
    source.buildings.Desc_Wall2_C = building('Desc_Wall2_C', 'wall')
    const { data } = transform(source)
    expect(data.buildables.map((b) => b.slug).sort()).toEqual([
      'wall',
      'wall-2',
    ])
  })

  it('throws TransformError on unresolved recipe ingredient', () => {
    const source = fixture()
    source.recipes.Recipe_IngotIron_C.ingredients = [
      { item: 'Desc_DoesNotExist_C', amount: 1 },
    ]
    expect(() => transform(source)).toThrow(TransformError)
  })

  it('drops unresolved schematic unlock refs with a warning', () => {
    const source = fixture()
    source.schematics.Schematic_T1_C.unlock.recipes.push('Recipe_Missing_C')
    source.schematics.Schematic_T1_C.requiredSchematics.push(
      'Schematic_Missing_C',
    )
    const { data, warnings } = transform(source)
    const schem = data.schematics[0]
    expect(schem?.unlockRecipes).toEqual(['iron-ingot'])
    expect(schem?.requiredSchematics).toEqual([])
    expect(warnings).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/lib/transform.test.ts`
Expected: FAIL — cannot resolve `./transform.ts`.

- [ ] **Step 3: Implement `scripts/lib/transform.ts`**

```ts
import {
  type GameData,
  gameDataSchema,
} from '../../src/data/schema.ts'
import type { SourceData } from './source-schema.ts'

export class TransformError extends Error {}

export interface TransformResult {
  data: GameData
  warnings: string[]
}

/** Maps className → unique slug, suffixing -2, -3, … on collisions (source has dupes). */
function uniqueSlugMap(
  entries: Array<{ className: string; slug: string }>,
): Map<string, string> {
  const counts = new Map<string, number>()
  const map = new Map<string, string>()
  for (const entry of entries) {
    const n = (counts.get(entry.slug) ?? 0) + 1
    counts.set(entry.slug, n)
    map.set(entry.className, n === 1 ? entry.slug : `${entry.slug}-${n}`)
  }
  return map
}

const bySlug = <T extends { slug: string }>(a: T, b: T) =>
  a.slug.localeCompare(b.slug)

export function transform(source: SourceData): TransformResult {
  const warnings: string[] = []

  const itemSlugs = uniqueSlugMap(Object.values(source.items))
  const buildingSlugs = uniqueSlugMap(Object.values(source.buildings))
  const recipeSlugs = uniqueSlugMap(Object.values(source.recipes))
  const schematicSlugs = uniqueSlugMap(Object.values(source.schematics))

  const resolveStrict = (
    map: Map<string, string>,
    className: string,
    context: string,
  ): string => {
    const slug = map.get(className)
    if (!slug) {
      throw new TransformError(`Unresolved reference ${className} in ${context}`)
    }
    return slug
  }

  /** Items and buildables share the amount-reference namespace. */
  const resolveItemRef = (className: string, context: string): string =>
    itemSlugs.get(className) ??
    resolveStrict(buildingSlugs, className, context)

  const producerClasses = new Set<string>()
  for (const r of Object.values(source.recipes)) {
    for (const c of r.producedIn) producerClasses.add(c)
  }
  for (const c of Object.keys(source.generators)) producerClasses.add(c)
  for (const c of Object.keys(source.miners)) producerClasses.add(c)

  const items = Object.values(source.items)
    .map((i) => ({
      slug: itemSlugs.get(i.className) as string,
      className: i.className,
      name: i.name,
      description: i.description,
      icon: i.icon,
      form: i.liquid ? ('fluid' as const) : ('solid' as const),
      stackSize: i.stackSize,
      sinkPoints: i.sinkPoints,
      energyValue: i.energyValue,
      radioactiveDecay: i.radioactiveDecay,
    }))
    .sort(bySlug)

  const buildings = Object.values(source.buildings)
    .filter((b) => producerClasses.has(b.className))
    .map((b) => ({
      slug: buildingSlugs.get(b.className) as string,
      className: b.className,
      name: b.name,
      description: b.description,
      icon: b.icon,
      powerConsumption: b.metadata.powerConsumption,
      powerConsumptionExponent: b.metadata.powerConsumptionExponent,
      manufacturingSpeed: b.metadata.manufacturingSpeed,
      size: b.size,
    }))
    .sort(bySlug)

  const buildables = Object.values(source.buildings)
    .filter((b) => !producerClasses.has(b.className))
    .map((b) => ({
      slug: buildingSlugs.get(b.className) as string,
      className: b.className,
      name: b.name,
      description: b.description,
      icon: b.icon,
      categories: b.categories,
      size: b.size,
    }))
    .sort(bySlug)

  const recipes = Object.values(source.recipes)
    .map((r) => ({
      slug: recipeSlugs.get(r.className) as string,
      className: r.className,
      name: r.name,
      alternate: r.alternate,
      time: r.time,
      ingredients: r.ingredients.map((x) => ({
        item: resolveItemRef(x.item, `recipe ${r.className} ingredients`),
        amount: x.amount,
      })),
      products: r.products.map((x) => ({
        item: resolveItemRef(x.item, `recipe ${r.className} products`),
        amount: x.amount,
      })),
      producedIn: r.producedIn.map((c) =>
        resolveStrict(buildingSlugs, c, `recipe ${r.className} producedIn`),
      ),
      forBuilding: r.forBuilding,
      inMachine: r.inMachine,
      inHand: r.inHand,
      inWorkshop: r.inWorkshop,
      isVariablePower: r.isVariablePower,
      minPower: r.minPower,
      maxPower: r.maxPower,
    }))
    .sort(bySlug)

  const schematics = Object.values(source.schematics)
    .map((s) => {
      const unlockRecipes: string[] = []
      for (const c of s.unlock.recipes) {
        const slug = recipeSlugs.get(c)
        if (slug) unlockRecipes.push(slug)
        else warnings.push(`schematic ${s.className}: unknown unlock recipe ${c}`)
      }
      const requiredSchematics: string[] = []
      for (const c of s.requiredSchematics) {
        const slug = schematicSlugs.get(c)
        if (slug) requiredSchematics.push(slug)
        else
          warnings.push(`schematic ${s.className}: unknown required schematic ${c}`)
      }
      return {
        slug: schematicSlugs.get(s.className) as string,
        className: s.className,
        name: s.name,
        type: s.type,
        tier: s.tier,
        cost: s.cost.map((x) => ({
          item: resolveItemRef(x.item, `schematic ${s.className} cost`),
          amount: x.amount,
        })),
        unlockRecipes,
        requiredSchematics,
        mam: s.mam,
        alternate: s.alternate,
      }
    })
    .sort(bySlug)

  const resources = Object.values(source.resources)
    .map((r) => ({
      item: resolveStrict(itemSlugs, r.item, 'resources'),
      speed: r.speed,
    }))
    .sort((a, b) => a.item.localeCompare(b.item))

  const generators = Object.values(source.generators)
    .map((g) => ({
      className: g.className,
      building: resolveStrict(buildingSlugs, g.className, 'generators'),
      fuels: g.fuel.map((c) =>
        resolveStrict(itemSlugs, c, `generator ${g.className} fuel`),
      ),
      powerProduction: g.powerProduction,
      powerProductionExponent: g.powerProductionExponent,
      waterToPowerRatio: g.waterToPowerRatio,
    }))
    .sort((a, b) => a.className.localeCompare(b.className))

  const miners = Object.values(source.miners)
    .map((m) => ({
      className: m.className,
      building: resolveStrict(buildingSlugs, m.className, 'miners'),
      allowedResources: m.allowedResources.map((c) =>
        resolveStrict(itemSlugs, c, `miner ${m.className} allowedResources`),
      ),
      allowLiquids: m.allowLiquids,
      allowSolids: m.allowSolids,
      itemsPerCycle: m.itemsPerCycle,
      extractCycleTime: m.extractCycleTime,
    }))
    .sort((a, b) => a.className.localeCompare(b.className))

  const data = gameDataSchema.parse({
    items,
    recipes,
    buildings,
    buildables,
    schematics,
    resources,
    generators,
    miners,
  })

  return { data, warnings }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run scripts/lib/transform.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: source-to-target game data transform"
```

---

### Task 6: Generate script + generated data

**Files:**
- Create: `scripts/generate-data.ts`
- Modify: `package.json` (add script)
- Generated: `src/data/generated/*.json` (committed)

- [ ] **Step 1: Create `scripts/generate-data.ts`**

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { sourceDataSchema } from './lib/source-schema.ts'
import { transform } from './lib/transform.ts'

const SOURCE = 'data/vendor/greeny-data1.0.json'
const OUT_DIR = 'src/data/generated'

const raw = JSON.parse(readFileSync(SOURCE, 'utf8'))
const source = sourceDataSchema.parse(raw)
const { data, warnings } = transform(source)

mkdirSync(OUT_DIR, { recursive: true })
for (const [name, entries] of Object.entries(data)) {
  writeFileSync(
    `${OUT_DIR}/${name}.json`,
    `${JSON.stringify(entries, null, 1)}\n`,
  )
  console.log(`${name}: ${entries.length}`)
}
console.log(`warnings: ${warnings.length}`)
for (const w of warnings) console.warn(`  ${w}`)
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, add:

```json
"generate-data": "node scripts/generate-data.ts"
```

- [ ] **Step 3: Run it**

Run: `npm run generate-data`
Expected output (exact counts — verified against the source):

```
items: 175
recipes: 797
buildings: 20
buildables: 480
schematics: 437
resources: 13
generators: 4
miners: 5
warnings: 94
```

(94 = 86 unknown unlock recipes + 8 unknown required schematics.)

- [ ] **Step 4: Commit (generated output included)**

```bash
npx biome check --write . && git add -A && git commit -m "feat: generate-data script and generated game data modules"
```

---

### Task 7: Data access layer

**Files:**
- Create: `src/data/index.ts`
- Test: `src/data/index.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/data/index.test.ts` — these are integrity tests over the REAL generated data:

```ts
import { describe, expect, it } from 'vitest'
import {
  getBuildable,
  getBuilding,
  getItem,
  getRecipesProducing,
  getRecipesUsing,
  getSchematic,
  listBuildables,
  listBuildings,
  listItems,
  listRecipes,
  listSchematics,
  searchEntities,
} from './index'

describe('data access layer', () => {
  it('loads all domains', () => {
    expect(listItems()).toHaveLength(175)
    expect(listRecipes()).toHaveLength(797)
    expect(listBuildings()).toHaveLength(20)
    expect(listBuildables()).toHaveLength(480)
    expect(listSchematics()).toHaveLength(437)
  })

  it('looks up entities by slug', () => {
    expect(getItem('iron-plate')?.name).toBe('Iron Plate')
    expect(getBuilding('constructor')?.name).toBe('Constructor')
    expect(getBuildable('lookout-tower')?.name).toBe('Lookout Tower')
    expect(getItem('does-not-exist')).toBeUndefined()
  })

  it('every recipe reference resolves', () => {
    for (const recipe of listRecipes()) {
      for (const { item } of [...recipe.ingredients, ...recipe.products]) {
        expect(
          getItem(item) ?? getBuildable(item) ?? getBuilding(item),
          `${recipe.slug} -> ${item}`,
        ).toBeDefined()
      }
      for (const building of recipe.producedIn) {
        expect(getBuilding(building), `${recipe.slug} -> ${building}`).toBeDefined()
      }
    }
  })

  it('every schematic reference resolves', () => {
    const recipeSlugs = new Set(listRecipes().map((r) => r.slug))
    for (const schematic of listSchematics()) {
      for (const slug of schematic.unlockRecipes) {
        expect(recipeSlugs.has(slug), `${schematic.slug} -> ${slug}`).toBe(true)
      }
      for (const slug of schematic.requiredSchematics) {
        expect(getSchematic(slug), `${schematic.slug} -> ${slug}`).toBeDefined()
      }
    }
  })

  it('finds recipes producing and using an item', () => {
    const producing = getRecipesProducing('iron-plate')
    expect(producing.length).toBeGreaterThanOrEqual(1)
    expect(producing.some((r) => !r.alternate)).toBe(true)
    const using = getRecipesUsing('iron-plate')
    expect(using.length).toBeGreaterThanOrEqual(1)
  })

  it('searches across entity types', () => {
    const results = searchEntities('iron pla')
    expect(results.some((r) => r.type === 'item' && r.slug === 'iron-plate')).toBe(
      true,
    )
    expect(searchEntities('')).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/index.test.ts`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Implement `src/data/index.ts`**

```ts
import buildablesJson from './generated/buildables.json'
import buildingsJson from './generated/buildings.json'
import generatorsJson from './generated/generators.json'
import itemsJson from './generated/items.json'
import minersJson from './generated/miners.json'
import recipesJson from './generated/recipes.json'
import resourcesJson from './generated/resources.json'
import schematicsJson from './generated/schematics.json'
import type {
  Buildable,
  Building,
  Generator,
  Item,
  Miner,
  Recipe,
  Resource,
  Schematic,
} from './schema'

const items = itemsJson as Item[]
const recipes = recipesJson as Recipe[]
const buildings = buildingsJson as Building[]
const buildables = buildablesJson as Buildable[]
const schematics = schematicsJson as Schematic[]
const resources = resourcesJson as Resource[]
const generators = generatorsJson as Generator[]
const miners = minersJson as Miner[]

const itemsBySlug = new Map(items.map((x) => [x.slug, x]))
const recipesBySlug = new Map(recipes.map((x) => [x.slug, x]))
const buildingsBySlug = new Map(buildings.map((x) => [x.slug, x]))
const buildablesBySlug = new Map(buildables.map((x) => [x.slug, x]))
const schematicsBySlug = new Map(schematics.map((x) => [x.slug, x]))

const producingIndex = new Map<string, Recipe[]>()
const usingIndex = new Map<string, Recipe[]>()
for (const recipe of recipes) {
  for (const { item } of recipe.products) {
    producingIndex.set(item, [...(producingIndex.get(item) ?? []), recipe])
  }
  for (const { item } of recipe.ingredients) {
    usingIndex.set(item, [...(usingIndex.get(item) ?? []), recipe])
  }
}

export const listItems = (): Item[] => items
export const listRecipes = (): Recipe[] => recipes
export const listBuildings = (): Building[] => buildings
export const listBuildables = (): Buildable[] => buildables
export const listSchematics = (): Schematic[] => schematics
export const listResources = (): Resource[] => resources
export const listGenerators = (): Generator[] => generators
export const listMiners = (): Miner[] => miners

export const getItem = (slug: string): Item | undefined => itemsBySlug.get(slug)
export const getRecipe = (slug: string): Recipe | undefined =>
  recipesBySlug.get(slug)
export const getBuilding = (slug: string): Building | undefined =>
  buildingsBySlug.get(slug)
export const getBuildable = (slug: string): Buildable | undefined =>
  buildablesBySlug.get(slug)
export const getSchematic = (slug: string): Schematic | undefined =>
  schematicsBySlug.get(slug)

export const getRecipesProducing = (itemSlug: string): Recipe[] =>
  producingIndex.get(itemSlug) ?? []
export const getRecipesUsing = (itemSlug: string): Recipe[] =>
  usingIndex.get(itemSlug) ?? []

export interface SearchResult {
  type: 'item' | 'recipe' | 'building' | 'buildable' | 'schematic'
  slug: string
  name: string
}

const searchCorpus: SearchResult[] = [
  ...items.map((x) => ({ type: 'item' as const, slug: x.slug, name: x.name })),
  ...recipes.map((x) => ({
    type: 'recipe' as const,
    slug: x.slug,
    name: x.name,
  })),
  ...buildings.map((x) => ({
    type: 'building' as const,
    slug: x.slug,
    name: x.name,
  })),
  ...buildables.map((x) => ({
    type: 'buildable' as const,
    slug: x.slug,
    name: x.name,
  })),
  ...schematics.map((x) => ({
    type: 'schematic' as const,
    slug: x.slug,
    name: x.name,
  })),
]

export function searchEntities(query: string, limit = 20): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return []
  return searchCorpus.filter((x) => x.name.toLowerCase().includes(q)).slice(0, limit)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/index.test.ts`
Expected: 6 passed. If a slug spot-check fails (e.g. `lookout-tower`), inspect the generated JSON for the actual slug and fix the TEST, not the data.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: typed game-data access layer with integrity tests"
```

---

### Task 8: Remove scaffold demo routes

**Files:**
- Delete: `src/routes/demo/clerk.tsx`, `src/routes/demo/convex.tsx`, `src/routes/demo/tanstack-query.tsx`, `src/routes/about.tsx`

Leave `convex/schema.ts` + `convex/todos.ts` alone for now — Convex is untouched until phase 4, and regenerating `convex/_generated` requires a running `convex dev`.

- [ ] **Step 1: Delete the files**

```bash
git rm src/routes/demo/clerk.tsx src/routes/demo/convex.tsx src/routes/demo/tanstack-query.tsx src/routes/about.tsx
```

- [ ] **Step 2: Regenerate the route tree**

Run: `npm run generate-routes`
Expected: `src/routeTree.gen.ts` no longer references demo/about routes.

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "chore: remove scaffold demo routes"
```

---

### Task 9: Feature registry + ComingSoon component

**Files:**
- Create: `src/config/features.ts`
- Create: `src/components/ComingSoon.tsx`

- [ ] **Step 1: Create `src/config/features.ts`**

```ts
import {
  Calculator,
  Database,
  Factory,
  Map as MapIcon,
  Route as RouteIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type FeatureStatus = 'live' | 'beta' | 'planned'

export type FeatureId =
  | 'data'
  | 'calculator'
  | 'factories'
  | 'map'
  | 'logistics'

export interface Feature {
  id: FeatureId
  title: string
  path: '/data' | '/calculator' | '/factories' | '/map' | '/logistics'
  status: FeatureStatus
  icon: LucideIcon
  description: string
  planned: string[]
}

export const FEATURES: Feature[] = [
  {
    id: 'data',
    title: 'Game data',
    path: '/data',
    status: 'planned',
    icon: Database,
    description:
      'Browse every item, recipe, building, buildable and schematic — searchable, filterable and fully cross-linked.',
    planned: [
      'Searchable, filterable overviews per entity type',
      'Detail pages with per-minute rates and alternate recipe comparisons',
      'Deep links into the calculator from any item',
    ],
  },
  {
    id: 'calculator',
    title: 'Calculator',
    path: '/calculator',
    status: 'planned',
    icon: Calculator,
    description:
      'Plan optimal production chains with a linear-programming solver — alternate recipes, byproduct loops and resource weighting included.',
    planned: [
      'LP-optimized production chains (like satisfactorytools.com)',
      'Produce-target and maximize-output modes',
      'Graph and table views with power and build costs',
      'Shareable plan links',
    ],
  },
  {
    id: 'factories',
    title: 'Factories',
    path: '/factories',
    status: 'planned',
    icon: Factory,
    description:
      'Save your factories with their production plans, track efficiency against reality and see total build costs.',
    planned: [
      'Save calculator plans as factories or enter I/O manually',
      'Efficiency tracking (actual vs planned output)',
      'Build cost and power breakdowns',
    ],
  },
  {
    id: 'map',
    title: 'Map',
    path: '/map',
    status: 'planned',
    icon: MapIcon,
    description:
      'The full world map with resource nodes and your factory pins — save-file loading planned.',
    planned: [
      'Interactive world map with resource node overlay',
      'Factory pins linked to your saved factories',
      'Save-file loading (parsed locally in your browser)',
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics',
    path: '/logistics',
    status: 'planned',
    icon: RouteIcon,
    description:
      'Connect your factories into a logistics network: spot shortfalls, match surpluses and get transport suggestions.',
    planned: [
      'Factory network graph with shortfall and surplus badges',
      'Transport link suggestions between factories',
      'Belt, pipe, truck, train and drone throughput math',
    ],
  },
]

export function getFeature(id: FeatureId): Feature {
  const feature = FEATURES.find((f) => f.id === id)
  if (!feature) throw new Error(`Unknown feature: ${id}`)
  return feature
}
```

- [ ] **Step 2: Create `src/components/ComingSoon.tsx`**

```tsx
import { Link } from '@tanstack/react-router'
import { type FeatureId, getFeature } from '#/config/features'

interface ComingSoonProps {
  featureId: FeatureId
  heading?: string
}

export default function ComingSoon({ featureId, heading }: ComingSoonProps) {
  const feature = getFeature(featureId)
  const Icon = feature.icon
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] p-8">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        <Icon aria-hidden className="h-3.5 w-3.5" />
        Coming soon
      </span>
      <h1 className="mt-4 text-2xl font-bold text-[var(--sea-ink)]">
        {heading ?? feature.title}
      </h1>
      <p className="mt-2 text-[var(--sea-ink-soft)]">{feature.description}</p>
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        Planned
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--sea-ink-soft)]">
        {feature.planned.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Link to="/" className="nav-link mt-6 inline-block">
        ← Back home
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx vitest run --passWithNoTests && npx biome check .`
Expected: no errors (registry has no tests of its own; it's exercised by routes next).

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: feature registry and ComingSoon placeholder component"
```

---

### Task 10: Header + app title

**Files:**
- Modify: `src/components/Header.tsx` (full rewrite below)
- Modify: `src/routes/__root.tsx` (title only)

- [ ] **Step 1: Replace `src/components/Header.tsx` entirely with:**

```tsx
import { Link } from '@tanstack/react-router'
import { FEATURES } from '#/config/features'
import ClerkHeader from '../integrations/clerk/header-user.tsx'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#f59e0b,#fb923c)]" />
            Satisfactory Planner
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
          {FEATURES.map((feature) => (
            <Link
              key={feature.id}
              to={feature.path}
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              {feature.title}
              {feature.status === 'planned' && (
                <span className="ml-1 rounded-full border border-[var(--chip-line)] px-1.5 text-[10px] font-medium text-[var(--sea-ink-soft)]">
                  soon
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ClerkHeader />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Update the title in `src/routes/__root.tsx`**

Change `title: 'TanStack Start Starter'` to `title: 'Satisfactory Planner'`.

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: app header with feature nav and title"
```

---

### Task 11: /data section (layout + sub-sidebar + 5 placeholder pages)

**Files:**
- Create: `src/routes/data/route.tsx`
- Create: `src/routes/data/index.tsx`
- Create: `src/routes/data/items.tsx`, `src/routes/data/recipes.tsx`, `src/routes/data/buildings.tsx`, `src/routes/data/buildables.tsx`, `src/routes/data/schematics.tsx`

- [ ] **Step 1: Create `src/routes/data/route.tsx` (section layout, spec layout C)**

```tsx
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/data')({
  component: DataLayout,
})

const SECTIONS = [
  { to: '/data/items', label: 'Items' },
  { to: '/data/recipes', label: 'Recipes' },
  { to: '/data/buildings', label: 'Buildings' },
  { to: '/data/buildables', label: 'Buildables' },
  { to: '/data/schematics', label: 'Schematics' },
] as const

function DataLayout() {
  return (
    <main className="page-wrap flex flex-col gap-6 px-4 py-6 sm:flex-row">
      <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-44 sm:flex-col">
        {SECTIONS.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="nav-link whitespace-nowrap rounded-lg px-3 py-2"
            activeProps={{
              className: 'nav-link is-active whitespace-nowrap rounded-lg px-3 py-2',
            }}
          >
            {section.label}
          </Link>
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create `src/routes/data/index.tsx` (redirect to items)**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/data/')({
  beforeLoad: () => {
    throw redirect({ to: '/data/items' })
  },
})
```

- [ ] **Step 3: Create the five placeholder pages**

`src/routes/data/items.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/data/items')({
  component: () => <ComingSoon featureId="data" heading="Items" />,
})
```

`src/routes/data/recipes.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/data/recipes')({
  component: () => <ComingSoon featureId="data" heading="Recipes" />,
})
```

`src/routes/data/buildings.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/data/buildings')({
  component: () => <ComingSoon featureId="data" heading="Buildings" />,
})
```

`src/routes/data/buildables.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/data/buildables')({
  component: () => <ComingSoon featureId="data" heading="Buildables" />,
})
```

`src/routes/data/schematics.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/data/schematics')({
  component: () => <ComingSoon featureId="data" heading="Schematics" />,
})
```

- [ ] **Step 4: Regenerate routes and verify**

Run: `npm run generate-routes && npx biome check .`
Expected: routeTree regenerates without errors.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: data section layout with placeholder overview pages"
```

---

### Task 12: Top-level placeholder routes

**Files:**
- Create: `src/routes/calculator.tsx`, `src/routes/factories.tsx`, `src/routes/map.tsx`, `src/routes/logistics.tsx`

- [ ] **Step 1: Create the four routes**

`src/routes/calculator.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/calculator')({
  component: () => (
    <main className="page-wrap px-4 py-10">
      <ComingSoon featureId="calculator" />
    </main>
  ),
})
```

`src/routes/factories.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/factories')({
  component: () => (
    <main className="page-wrap px-4 py-10">
      <ComingSoon featureId="factories" />
    </main>
  ),
})
```

`src/routes/map.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/map')({
  component: () => (
    <main className="page-wrap px-4 py-10">
      <ComingSoon featureId="map" />
    </main>
  ),
})
```

`src/routes/logistics.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import ComingSoon from '#/components/ComingSoon'

export const Route = createFileRoute('/logistics')({
  component: () => (
    <main className="page-wrap px-4 py-10">
      <ComingSoon featureId="logistics" />
    </main>
  ),
})
```

- [ ] **Step 2: Regenerate routes**

Run: `npm run generate-routes`

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: placeholder routes for calculator, factories, map, logistics"
```

---

### Task 13: Home page

**Files:**
- Modify: `src/routes/index.tsx` (full rewrite below)

- [ ] **Step 1: Replace `src/routes/index.tsx` entirely with:**

```tsx
import { Link, createFileRoute } from '@tanstack/react-router'
import { FEATURES } from '#/config/features'

export const Route = createFileRoute('/')({
  component: Home,
})

const STATUS_LABEL = { live: 'Live', beta: 'Beta', planned: 'Coming soon' } as const

function Home() {
  return (
    <main className="page-wrap px-4 py-10">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Plan the perfect factory
        </h1>
        <p className="mt-3 text-[var(--sea-ink-soft)]">
          Game data, an optimizing production calculator, factory management,
          the world map and logistics planning — all in one place.
        </p>
        <input
          type="search"
          disabled
          placeholder="Search items, recipes, buildings… (arrives with the data overviews)"
          className="mt-6 w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-5 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
        />
      </section>

      <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <Link
              key={feature.id}
              to={feature.path}
              className="rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] p-5 no-underline transition hover:border-[var(--chip-line)]"
            >
              <div className="flex items-center justify-between">
                <Icon aria-hidden className="h-5 w-5 text-[var(--sea-ink-soft)]" />
                <span className="rounded-full border border-[var(--chip-line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                  {STATUS_LABEL[feature.status]}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[var(--sea-ink)]">
                {feature.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                {feature.description}
              </p>
              <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-[var(--sea-ink-soft)]">
                {feature.planned.slice(0, 3).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: home page with feature roadmap cards"
```

---

### Task 14: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "ci: lint, test and build on every push"
```

---

### Task 15: Full verification + smoke check

- [ ] **Step 1: Full local pipeline**

Run: `npm run check && npm test && npm run build`
Expected: biome clean, 14 tests passed (2 source-schema + 6 transform + 6 data layer), build succeeds.

- [ ] **Step 2: Manual smoke check**

Run: `npm run dev` and verify in the browser:
- `/` shows the hero + 5 feature cards with "Coming soon" badges
- Header shows Satisfactory Planner + 5 nav links with "soon" badges, theme toggle works
- `/data` redirects to `/data/items`, sub-sidebar shows 5 sections, content is a ComingSoon card
- `/calculator`, `/factories`, `/map`, `/logistics` each render their ComingSoon page
- No console errors

- [ ] **Step 3: Commit any straggler fixes**

```bash
npx biome check --write . && git add -A && git status
```

If anything is dirty: `git commit -m "fix: phase 1 smoke check fixes"`. Otherwise done.

---

## Out of scope for this plan (later phases)

- Real overview pages (phase 2 — includes vendoring the icon set into `public/icons/`)
- Calculator, factories, map, logistics implementations (phases 3–6)
- Convex schema changes (`factories`/`savedPlans`/`transports` arrive in phase 4; demo tables removed then)
- Playwright smoke suite (added once there is real UI to test, phase 2+)
