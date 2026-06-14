# Phase 3a: Calculator Solver + Table UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working production calculator: a pure, tested LP-solver module (HiGHS/WASM) that turns production targets into optimal machine counts — accounting for inputs the user already produces — plus a functional UI with target editing, available-input declaration, alternate-recipe toggles, and table / raw-resources / power+build-cost result views.

**Architecture:** A pure solver module (`src/features/calculator/solver/`) builds a linear program from the recipe graph — one variable per enabled recipe (= machines at 100%), one balance row per item, and a per-input "import" variable — minimizes weighted raw-resource imports, solves with `highs` (HiGHS compiled to WASM), and parses the result into a typed `Solution` (machines, imports, byproducts, item flows, power, build cost) or a structured infeasibility diagnosis. The UI calls the solver through an async hook and renders the result as tabs. Graph view, maximize-output mode, shareable URLs, and save-as-factory are deferred to Phase 3b.

**Tech Stack:** TanStack Start/Router, React 19, `highs` (WASM LP/MIP solver) ^1.14, Zod 4, Vitest 4, Tailwind 4 + shadcn, Biome.

**Spec:** `docs/superpowers/specs/2026-06-12-satisfactory-webapp-design.md` (Section 4)

---

## Verified facts (already prototyped against real data — do not re-derive)

- **`highs` ^1.14.2** is the package (`npm i highs`). API: `import highsLoader from "highs"; const highs = await highsLoader(opts); const sol = highs.solve(lpString)`. Returns `{ Status: "Optimal" | "Infeasible" | …, ObjectiveValue: number, Columns: Record<varName, { Primal: number, … }>, Rows: … }`. Verified solving in Node (the test env).
- **LP-string (CPLEX LP format) is the interface.** Variables are `>= 0` by default. Use machine-safe var names (`r0`, `r1`, … for recipes; `m0`, `m1`, … for imports) and map back via arrays — never embed slugs in the LP.
- **Formulation (verified correct on real data):** For target 30 `reinforced-iron-plate`/min the solver returns 12 iron-ingot + 9 iron-plate + 6 iron-rod + 9 screw + 6 reinforced-iron-plate machines importing 360 `iron-ore`/min; for 60 `iron-plate`/min → 3 constructors + 3 smelters, 90 ore. Infeasible targets return `Status: "Infeasible"`. Continuous LP yields fractional machine counts (e.g. 1.4286).
- **Recipe data:** 276 automatable recipes (`inMachine === true && producedIn.length > 0`); 111 are alternates; 37 are multi-product. Per-minute rate of an item in a recipe = `amount * 60 / time`. The producing machine is `producedIn[0]` (a building slug).
- **Inputs are dynamic, not just the 13 resources.** 13 mineable resources (`resources.json`: bauxite, caterium-ore, coal, copper-ore, crude-oil, iron-ore, limestone, nitrogen-gas, raw-quartz, sam, sulfur, uranium, water) PLUS 13 items no recipe produces (wood, leaves, mycelia, sam, the 3 power-slugs, the 4 creature-remains, uranium-waste, plutonium-waste). Rule: an item is an **input** (freely importable, weighted in the objective) iff it is a raw resource OR it is produced by no *enabled* recipe OR the user declared it as an available input. Every other item gets a `net >= demand` balance row.
- **Available inputs** (items the user already produces) get a weight-0 import variable with an optional upper bound — the solver consumes them before building machines. Verified: target 60 iron-plate/min with iron-ingot available → 3 constructors, 0 smelters, 90 ingot imported, 0 ore; cap ingot at 30 → smelters return and 60 ore reappears.
- **Raw resources double as recipe products.** 12 of 13 raws are also produced by some recipe; water alone has 8 producers (byproducts of aluminium scrap / battery / non-fissile uranium, and the *standard* `recipe-unpackagewater-c`). The import-variable + balance-row formulation handles this: byproduct production offsets imports, and `unpackage`/alternate water recipes are used when enabled. Byproduct reporting includes raw resources whose `produced − consumed − demand > 0` (e.g. surplus water the factory must sink).
- **Power/build cost:** machine count for recipe `r` = its LP variable value (machines at 100%). Power (MW) = Σ machines × `producedIn` building `powerConsumption`. Build cost = Σ `ceil(machines)` × the build recipe's ingredients (from `getBuildCost(buildingSlug)` — Phase 2, returns the `forBuilding` recipe). Constructor `powerConsumption` = 4 MW.
- **Alternate recipes default OFF.** Standards always enabled; alternates only when the user enables them.

## Environment facts
- Gates after every group: `npm run check` (0 errors), `npm run typecheck` (0 errors), `npm test`, `npm run build`. Run `npx biome check --write .` before each commit.
- Node runs `.ts` directly; vitest runs in jsdom with `vitest.setup.ts` (Testing Library cleanup registered).
- Data access layer (`#/data`): `listRecipes()`, `getRecipe(slug)`, `getItem`, `getBuilding`, `getBuildable`, `listResources()`. Derived (`#/data/queries`): `getBuildCost(slug)`. Formatting (`#/lib/format`): `perMinute(amount, time)`, `formatNumber`, `formatPower`.
- The calculator route already exists as a placeholder: `src/routes/calculator.tsx` renders `<ComingSoon featureId="calculator" />`. This plan replaces it.
- `src/features/data/...` shows the established feature-folder + config pattern; `EntityIcon` (`#/components/EntityIcon`) renders item/building icons by slug.
- **highs WASM in the browser:** `highs` ships `highs.wasm`. Under Vite, resolve its URL with `import highsWasmUrl from "highs/build/highs.wasm?url"` and pass `highsLoader({ locateFile: () => highsWasmUrl })`. In Node (tests) call `highsLoader()` with no options (it finds the wasm itself). Task 5 implements this env split. (If the `?url` subpath differs for the installed version, Task 5 Step 2 says how to find the real path.)

## File structure

```
src/features/calculator/solver/types.ts          # ProblemSpec, Solution, LpModel (internal)
src/features/calculator/solver/model.ts          # buildModel(spec) + toLpString(model)
src/features/calculator/solver/model.test.ts
src/features/calculator/solver/derive.ts         # power / build cost / flows from raw solution
src/features/calculator/solver/derive.test.ts
src/features/calculator/solver/highs.ts          # env-aware HiGHS loader
src/features/calculator/solver/solve.ts          # solve(spec): Promise<Solution>
src/features/calculator/solver/solve.test.ts     # golden tests vs real data
src/features/calculator/solver/index.ts          # re-exports solve + types
src/features/calculator/useSolver.ts             # React hook (async)
src/features/calculator/CalculatorPage.tsx       # page shell + state
src/features/calculator/ItemPicker.tsx           # shared item search/add control
src/features/calculator/TargetEditor.tsx         # add/edit production targets
src/features/calculator/AvailableInputsEditor.tsx# declare items already produced
src/features/calculator/RecipeOptions.tsx        # alternate-recipe toggles
src/features/calculator/ResultTabs.tsx           # table / resources / power+cost views
src/routes/calculator.tsx                         # route (replace ComingSoon)
```

---

### Task 1: Install highs + solver types

**Files:**
- Modify: `package.json` (dependency)
- Create: `src/features/calculator/solver/types.ts`

- [ ] **Step 1: Install the solver**

Run: `npm install highs@^1.14`
Expected: `highs` added to `dependencies`. Verify: `node -e "console.log(require('highs/package.json').version)"` prints `1.14.x`.

- [ ] **Step 2: Create `src/features/calculator/solver/types.ts`**

```ts
/** A production target: produce `rate` of `item` per minute. */
export interface Target {
	item: string;
	rate: number;
}

/** An item the user already produces elsewhere, available to this plan as a
 *  free input. `rate` caps how much per minute (omit = unlimited). */
export interface AvailableInput {
	item: string;
	rate?: number;
}

/** Inputs to the solver. */
export interface ProblemSpec {
	targets: Target[];
	/** Slugs of alternate recipes the user has enabled. Standard recipes are
	 *  always enabled; alternates only when listed here. */
	allowedAlternates: string[];
	/** Items the user already produces — consumed before building from scratch,
	 *  at zero raw-resource cost, up to their optional `rate` cap. */
	availableInputs?: AvailableInput[];
	/** Per-resource objective weight (higher = more costly to consume). Missing
	 *  resources default to 1; non-resource imports always weigh 1. */
	resourceWeights?: Record<string, number>;
}

/** One recipe running in the solution. */
export interface RecipeUsage {
	recipe: string;
	/** Machines at 100% clock (fractional). */
	machines: number;
	building: string;
}

/** An item amount per minute. */
export interface Flow {
	item: string;
	rate: number;
}

/** Net production/consumption of an item across the whole plan. */
export interface ItemFlow {
	item: string;
	produced: number;
	consumed: number;
}

export interface Solution {
	status: "optimal" | "infeasible";
	recipes: RecipeUsage[];
	/** Raw/imported inputs consumed (the factory's "shopping list"). */
	rawInputs: Flow[];
	/** Items produced beyond demand (byproducts / overflow). */
	byproducts: Flow[];
	/** Per-item produced vs consumed, for the table view. */
	flows: ItemFlow[];
	/** Total power draw, MW. */
	power: number;
	/** Aggregated construction materials (ceil machines). */
	buildCost: Flow[];
	/** When infeasible: human-readable reason + the unreachable target items. */
	diagnosis?: { message: string; unreachable: string[] };
}

/** Internal LP model — pure data, no solver dependency. */
export interface LpModel {
	/** Enabled recipes, index-aligned with `recipeVar(i)` = `r{i}`. */
	recipes: import("#/data/schema").Recipe[];
	/** Input item slug → import var name `m{i}`. */
	importVars: Map<string, string>;
	/** Item slugs that are user-provided available inputs (subset of importVars keys). */
	providedInputs: Set<string>;
	/** Objective coefficient per variable name. */
	objective: Map<string, number>;
	/** Upper bounds per variable name (e.g. a capped available input). */
	bounds: Map<string, number>;
	/** One row per constrained item: Σ coef·var >= rhs. */
	rows: Array<{ item: string; coefs: Map<string, number>; rhs: number }>;
}
```

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: install highs solver and calculator solver types"
```

---

### Task 2: Build the LP model

**Files:**
- Create: `src/features/calculator/solver/model.ts`
- Test: `src/features/calculator/solver/model.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/features/calculator/solver/model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildModel, toLpString } from "./model";
import type { ProblemSpec } from "./types";

const spec = (over: Partial<ProblemSpec> = {}): ProblemSpec => ({
	targets: [{ item: "iron-plate", rate: 60 }],
	allowedAlternates: [],
	...over,
});

describe("buildModel", () => {
	it("includes standard recipes and excludes alternates by default", () => {
		const model = buildModel(spec());
		const slugs = model.recipes.map((r) => r.slug);
		expect(slugs).toContain("recipe-ironplate-c");
		expect(slugs.every((s) => !s.startsWith("recipe-alternate"))).toBe(true);
	});

	it("includes an allowed alternate recipe", () => {
		const model = buildModel(
			spec({ allowedAlternates: ["recipe-alternate-coatedironplate-c"] }),
		);
		expect(model.recipes.map((r) => r.slug)).toContain(
			"recipe-alternate-coatedironplate-c",
		);
	});

	it("treats raw resources and unproducible items as imports", () => {
		const model = buildModel(spec());
		// iron-ore is a raw resource → has an import var
		expect(model.importVars.has("iron-ore")).toBe(true);
		// iron-plate is produced by a recipe → no import var
		expect(model.importVars.has("iron-plate")).toBe(false);
	});

	it("sets the target demand as the row rhs and 0 elsewhere", () => {
		const model = buildModel(spec());
		const plateRow = model.rows.find((r) => r.item === "iron-plate");
		expect(plateRow?.rhs).toBe(60);
		const ingotRow = model.rows.find((r) => r.item === "iron-ingot");
		expect(ingotRow?.rhs).toBe(0);
	});

	it("weights raw imports in the objective (default 1)", () => {
		const model = buildModel(spec());
		const oreVar = model.importVars.get("iron-ore") as string;
		expect(model.objective.get(oreVar)).toBe(1);
	});

	it("applies custom resource weights", () => {
		const model = buildModel(spec({ resourceWeights: { "iron-ore": 0.5 } }));
		const oreVar = model.importVars.get("iron-ore") as string;
		expect(model.objective.get(oreVar)).toBe(0.5);
	});

	it("gives a provided input a zero-weight import var", () => {
		const model = buildModel(
			spec({ availableInputs: [{ item: "iron-ingot" }] }),
		);
		expect(model.providedInputs.has("iron-ingot")).toBe(true);
		const v = model.importVars.get("iron-ingot") as string;
		expect(model.objective.get(v)).toBe(0);
		// unbounded → no entry in bounds
		expect(model.bounds.has(v)).toBe(false);
	});

	it("caps a provided input with an upper bound", () => {
		const model = buildModel(
			spec({ availableInputs: [{ item: "iron-ingot", rate: 30 }] }),
		);
		const v = model.importVars.get("iron-ingot") as string;
		expect(model.bounds.get(v)).toBe(30);
		expect(toLpString(model)).toContain("Bounds");
	});
});

describe("toLpString", () => {
	it("produces a Minimize/Subject To/End LP with the import var in the target row", () => {
		const lp = toLpString(buildModel(spec()));
		expect(lp).toMatch(/^Minimize/);
		expect(lp).toContain("Subject To");
		expect(lp.trimEnd().endsWith("End")).toBe(true);
		// the iron-ore import var appears in the objective
		expect(lp).toMatch(/obj:.*m\d+/);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/solver/model.test.ts`
Expected: FAIL — cannot resolve `./model`.

- [ ] **Step 3: Implement `src/features/calculator/solver/model.ts`**

```ts
import { listRecipes, listResources } from "#/data";
import { perMinute } from "#/lib/format";
import type { LpModel, ProblemSpec } from "./types";

const EPSILON = 1e-9;

/** Recipes that can run in a machine and produce something. */
function automatableRecipes() {
	return listRecipes().filter((r) => r.inMachine && r.producedIn.length > 0);
}

export function buildModel(spec: ProblemSpec): LpModel {
	const allowed = new Set(spec.allowedAlternates);
	const recipes = automatableRecipes().filter(
		(r) => !r.alternate || allowed.has(r.slug),
	);

	const rawResources = new Set(listResources().map((r) => r.item));
	const producible = new Set<string>();
	for (const r of recipes) for (const p of r.products) producible.add(p.item);

	// Universe of items touched by the enabled recipes.
	const items = new Set<string>();
	for (const r of recipes) {
		for (const x of [...r.ingredients, ...r.products]) items.add(x.item);
	}

	// User-provided available inputs (consumed before building, at zero cost).
	const provided = new Map(
		(spec.availableInputs ?? []).map((a) => [a.item, a.rate]),
	);

	const isInput = (item: string) =>
		rawResources.has(item) || !producible.has(item) || provided.has(item);

	const demand = new Map(spec.targets.map((t) => [t.item, t.rate]));

	// Import variable per input item (raw resource, unproducible, or provided).
	const importVars = new Map<string, string>();
	const providedInputs = new Set<string>();
	const objective = new Map<string, number>();
	const bounds = new Map<string, number>();
	let m = 0;
	for (const item of items) {
		if (!isInput(item)) continue;
		const name = `m${m++}`;
		importVars.set(item, name);
		if (provided.has(item)) {
			// Provided inputs are free (weight 0) and optionally capped.
			providedInputs.add(item);
			objective.set(name, 0);
			const cap = provided.get(item);
			if (cap !== undefined) bounds.set(name, cap);
		} else {
			const weight = rawResources.has(item)
				? (spec.resourceWeights?.[item] ?? 1)
				: 1;
			objective.set(name, weight);
		}
	}

	// One balance row per item: Σ (perMin product − perMin ingredient)·r + import >= demand.
	const rows: LpModel["rows"] = [];
	for (const item of items) {
		const coefs = new Map<string, number>();
		recipes.forEach((r, i) => {
			let c = 0;
			for (const p of r.products) if (p.item === item) c += perMinute(p.amount, r.time);
			for (const g of r.ingredients) if (g.item === item) c -= perMinute(g.amount, r.time);
			if (Math.abs(c) > EPSILON) coefs.set(`r${i}`, c);
		});
		const imp = importVars.get(item);
		if (imp) coefs.set(imp, 1);
		if (coefs.size === 0) continue;
		rows.push({ item, coefs, rhs: demand.get(item) ?? 0 });
	}

	return { recipes, importVars, providedInputs, objective, bounds, rows };
}

function terms(coefs: Map<string, number>): string {
	const parts: string[] = [];
	for (const [name, c] of coefs) {
		const sign = c >= 0 ? "+" : "-";
		parts.push(`${sign} ${Math.abs(c)} ${name}`);
	}
	return parts.join(" ").replace(/^\+ /, "");
}

export function toLpString(model: LpModel): string {
	const obj = [...model.objective]
		.map(([name, c]) => `${c} ${name}`)
		.join(" + ");
	const lines = ["Minimize", ` obj: ${obj || "0"}`, "Subject To"];
	model.rows.forEach((row, i) => {
		lines.push(` c${i}: ${terms(row.coefs)} >= ${row.rhs}`);
	});
	if (model.bounds.size > 0) {
		lines.push("Bounds");
		for (const [name, ub] of model.bounds) lines.push(` ${name} <= ${ub}`);
	}
	lines.push("End");
	return lines.join("\n");
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/calculator/solver/model.test.ts`
Expected: 8 passed. If a recipe slug (e.g. `recipe-ironplate-c`, `recipe-alternate-coatedironplate-c`) doesn't match real data, look it up in `src/data/generated/recipes.json` and fix the TEST literal, not the code; report the change.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: LP model builder for the production solver"
```

---

### Task 3: Derive power, build cost, and flows

**Files:**
- Create: `src/features/calculator/solver/derive.ts`
- Test: `src/features/calculator/solver/derive.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/features/calculator/solver/derive.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildCost, totalPower } from "./derive";
import type { RecipeUsage } from "./types";

describe("derive", () => {
	const usage: RecipeUsage[] = [
		{ recipe: "recipe-ironplate-c", machines: 3, building: "constructor" },
	];

	it("sums power from machine counts × building power", () => {
		// constructor = 4 MW, 3 machines → 12 MW
		expect(totalPower(usage)).toBe(12);
	});

	it("aggregates build cost using ceil(machines) × build recipe ingredients", () => {
		// constructor build cost exists; 3 machines → 3× its ingredients
		const cost = buildCost(usage);
		expect(cost.length).toBeGreaterThan(0);
		expect(cost.every((c) => c.rate > 0)).toBe(true);
	});

	it("rounds fractional machines up for build cost", () => {
		const cost = buildCost([
			{ recipe: "recipe-ironplate-c", machines: 1.2, building: "constructor" },
		]);
		const costAt2 = buildCost([
			{ recipe: "recipe-ironplate-c", machines: 2, building: "constructor" },
		]);
		// ceil(1.2) === 2 → same materials as exactly 2 machines
		expect(cost).toEqual(costAt2);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/solver/derive.test.ts`
Expected: FAIL — cannot resolve `./derive`.

- [ ] **Step 3: Implement `src/features/calculator/solver/derive.ts`**

```ts
import { getBuilding } from "#/data";
import { getBuildCost } from "#/data/queries";
import type { Flow, RecipeUsage } from "./types";

/** Total power draw in MW (fractional machines × building power). */
export function totalPower(usage: RecipeUsage[]): number {
	let mw = 0;
	for (const u of usage) {
		const building = getBuilding(u.building);
		if (building) mw += u.machines * building.powerConsumption;
	}
	return mw;
}

/** Aggregated construction materials, rounding each machine count up. */
export function buildCost(usage: RecipeUsage[]): Flow[] {
	const totals = new Map<string, number>();
	for (const u of usage) {
		const recipe = getBuildCost(u.building);
		if (!recipe) continue;
		const count = Math.ceil(u.machines - 1e-9);
		for (const ing of recipe.ingredients) {
			totals.set(ing.item, (totals.get(ing.item) ?? 0) + ing.amount * count);
		}
	}
	return [...totals]
		.map(([item, rate]) => ({ item, rate }))
		.sort((a, b) => b.rate - a.rate);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/calculator/solver/derive.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: power and build-cost derivation from solver usage"
```

---

### Task 4: HiGHS loader (env-aware)

**Files:**
- Create: `src/features/calculator/solver/highs.ts`

No dedicated test — exercised by Task 5's integration tests (which run in Node).

- [ ] **Step 1: Create `src/features/calculator/solver/highs.ts`**

```ts
import highsLoader from "highs";

type Highs = Awaited<ReturnType<typeof highsLoader>>;

let instance: Promise<Highs> | undefined;

/** True under Node and Vitest (which runs on Node even with the jsdom
 *  environment, where `window` is defined). Distinguishes a real browser. */
const isNode =
	typeof process !== "undefined" && Boolean(process.versions?.node);

/** Load HiGHS once. In a real browser, resolve the bundled wasm URL via Vite;
 *  under Node/Vitest let the loader find the wasm itself. */
export function loadHighs(): Promise<Highs> {
	if (!instance) {
		instance = isNode
			? highsLoader()
			: import("highs/build/highs.wasm?url").then((m) =>
					highsLoader({ locateFile: () => m.default }),
				);
	}
	return instance;
}
```

(Note: the solver tests in Task 5 carry a `// @vitest-environment node` pragma so they run without jsdom's `window`, matching the verified Node prototype. `isNode` is still correct under jsdom, but the pragma keeps the test env identical to production Node and avoids any jsdom/highs interaction.)

- [ ] **Step 2: Verify the wasm URL subpath resolves**

Run: `node -e "const fs=require('fs');const p=require.resolve('highs/package.json').replace(/package.json$/,'');console.log('has build/highs.wasm:', fs.existsSync(p+'build/highs.wasm'))"`
Expected: `true`. If `false`, find the real wasm path: `node -e "const{execSync}=require('child_process');console.log(execSync('node -e \"console.log(require.resolve(String.raw\\'highs\\'))\"').toString())"` then `ls` the `highs` package dir for the `.wasm` file, and update the `import("highs/build/highs.wasm?url")` path in `highs.ts` to the actual subpath. Report any change.

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: env-aware HiGHS loader"
```

---

### Task 5: Solve — model → LP → Solution

**Files:**
- Create: `src/features/calculator/solver/solve.ts`
- Create: `src/features/calculator/solver/index.ts`
- Test: `src/features/calculator/solver/solve.test.ts`

- [ ] **Step 1: Write the failing tests (golden, against real data)**

`src/features/calculator/solver/solve.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { solve } from "./solve";

describe("solve (real data, standard recipes)", () => {
	it("makes 60 iron plate/min from 3 constructors + 3 smelters, 90 ore", async () => {
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		expect(sol.status).toBe("optimal");
		const machines = new Map(
			sol.recipes.map((r) => [r.recipe, Math.round(r.machines * 100) / 100]),
		);
		expect(machines.get("recipe-ironplate-c")).toBeCloseTo(3, 2);
		expect(machines.get("recipe-ingotiron-c")).toBeCloseTo(3, 2);
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(90, 2);
	});

	it("reports power and build cost for the plan", async () => {
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		// 3 constructors (4 MW) + 3 smelters (4 MW) = 24 MW
		expect(sol.power).toBeCloseTo(24, 1);
		expect(sol.buildCost.length).toBeGreaterThan(0);
	});

	it("traces a multi-step chain (reinforced iron plate)", async () => {
		const sol = await solve({
			targets: [{ item: "reinforced-iron-plate", rate: 30 }],
			allowedAlternates: [],
		});
		expect(sol.status).toBe("optimal");
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(360, 0);
		// uses screws and rods on the way
		const slugs = sol.recipes.map((r) => r.recipe);
		expect(slugs).toContain("recipe-screw-c");
		expect(slugs).toContain("recipe-ironrod-c");
	});

	it("consumes a provided input instead of building it from scratch", async () => {
		// iron-plate (60/min) needs 90 iron-ingot/min. If ingot is available, the
		// solver should skip smelting: 3 constructors, 90 ingot imported, 0 ore.
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
			availableInputs: [{ item: "iron-ingot" }],
		});
		expect(sol.status).toBe("optimal");
		const slugs = sol.recipes.map((r) => r.recipe);
		expect(slugs).toContain("recipe-ironplate-c");
		expect(slugs).not.toContain("recipe-ingotiron-c");
		expect(sol.rawInputs.find((f) => f.item === "iron-ore")).toBeUndefined();
		const ingot = sol.rawInputs.find((f) => f.item === "iron-ingot");
		expect(ingot?.rate).toBeCloseTo(90, 1);
	});

	it("caps a provided input and builds machines for the shortfall", async () => {
		// Only 30 ingot/min available (need 90) → solver smelts the other 60.
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
			availableInputs: [{ item: "iron-ingot", rate: 30 }],
		});
		expect(sol.status).toBe("optimal");
		const ingot = sol.rawInputs.find((f) => f.item === "iron-ingot");
		expect(ingot?.rate).toBeCloseTo(30, 1);
		// remaining 60 ingot smelted from 60 ore
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(60, 1);
	});

	it("returns infeasible with a diagnosis for an unmakeable target", async () => {
		// plastic needs crude-oil refining; with only standard recipes it's fine,
		// so instead target an item whose only recipes are alternates we didn't enable.
		const sol = await solve({
			targets: [{ item: "wood", rate: 10 }],
			allowedAlternates: [],
		});
		// wood is an input (no recipe produces it) → asking to *produce* it via
		// machines is infeasible; diagnosis names it.
		expect(sol.status).toBe("infeasible");
		expect(sol.diagnosis?.unreachable).toContain("wood");
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/solver/solve.test.ts`
Expected: FAIL — cannot resolve `./solve`.

- [ ] **Step 3: Implement `src/features/calculator/solver/solve.ts`**

```ts
import { buildModel, toLpString } from "./model";
import { buildCost, totalPower } from "./derive";
import { loadHighs } from "./highs";
import type {
	Flow,
	ItemFlow,
	LpModel,
	ProblemSpec,
	RecipeUsage,
	Solution,
} from "./types";
import { perMinute } from "#/lib/format";

const EPSILON = 1e-6;

/** Targets whose item has no enabled producing recipe → unreachable. */
function unreachableTargets(spec: ProblemSpec, model: LpModel): string[] {
	const producible = new Set<string>();
	for (const r of model.recipes) for (const p of r.products) producible.add(p.item);
	return spec.targets.map((t) => t.item).filter((i) => !producible.has(i));
}

function infeasible(unreachable: string[]): Solution {
	const message =
		unreachable.length > 0
			? `No enabled recipe produces: ${unreachable.join(", ")}. Enable an alternate recipe or change the target.`
			: "No feasible plan with the current recipes. Try enabling alternate recipes.";
	return {
		status: "infeasible",
		recipes: [],
		rawInputs: [],
		byproducts: [],
		flows: [],
		power: 0,
		buildCost: [],
		diagnosis: { message, unreachable },
	};
}

export async function solve(spec: ProblemSpec): Promise<Solution> {
	const model = buildModel(spec);

	// Fast pre-check: a target nothing produces is definitively infeasible.
	const unreachable = unreachableTargets(spec, model);
	if (unreachable.length > 0) return infeasible(unreachable);

	const highs = await loadHighs();
	const result = highs.solve(toLpString(model));

	if (result.Status !== "Optimal") return infeasible(unreachable);

	const primal = (name: string): number => result.Columns[name]?.Primal ?? 0;

	// Recipe usages (machines at 100%).
	const recipes: RecipeUsage[] = [];
	model.recipes.forEach((r, i) => {
		const machines = primal(`r${i}`);
		if (machines > EPSILON) {
			recipes.push({ recipe: r.slug, machines, building: r.producedIn[0] });
		}
	});

	// Raw inputs (import variables).
	const rawInputs: Flow[] = [];
	for (const [item, varName] of model.importVars) {
		const rate = primal(varName);
		if (rate > EPSILON) rawInputs.push({ item, rate });
	}
	rawInputs.sort((a, b) => b.rate - a.rate);

	// Per-item produced/consumed across the plan.
	const flowMap = new Map<string, ItemFlow>();
	const bump = (item: string, produced: number, consumed: number) => {
		const f = flowMap.get(item) ?? { item, produced: 0, consumed: 0 };
		f.produced += produced;
		f.consumed += consumed;
		flowMap.set(item, f);
	};
	model.recipes.forEach((r, i) => {
		const machines = primal(`r${i}`);
		if (machines <= EPSILON) return;
		for (const p of r.products) bump(p.item, perMinute(p.amount, r.time) * machines, 0);
		for (const g of r.ingredients) bump(g.item, 0, perMinute(g.amount, r.time) * machines);
	});
	const flows = [...flowMap.values()].sort((a, b) => b.produced - a.produced);

	// Byproducts: anything produced beyond what's consumed + demanded — including
	// raw resources produced as a byproduct (e.g. surplus water from aluminium or
	// unpackage-water), which the factory must still sink. Importing an item makes
	// its surplus <= 0, so imports never show up here.
	const demand = new Map(spec.targets.map((t) => [t.item, t.rate]));
	const byproducts: Flow[] = [];
	for (const f of flows) {
		if (f.produced <= EPSILON) continue;
		const surplus = f.produced - f.consumed - (demand.get(f.item) ?? 0);
		if (surplus > EPSILON) byproducts.push({ item: f.item, rate: surplus });
	}
	byproducts.sort((a, b) => b.rate - a.rate);

	return {
		status: "optimal",
		recipes,
		rawInputs,
		byproducts,
		flows,
		power: totalPower(recipes),
		buildCost: buildCost(recipes),
	};
}
```

- [ ] **Step 4: Create `src/features/calculator/solver/index.ts`**

```ts
export { solve } from "./solve";
export type {
	AvailableInput,
	Flow,
	ItemFlow,
	ProblemSpec,
	RecipeUsage,
	Solution,
	Target,
} from "./types";
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run src/features/calculator/solver/solve.test.ts`
Expected: 4 passed. If the multi-step test's exact ore figure or recipe slugs differ from real data, fix the TEST literals against `src/data/generated/recipes.json` (the solver is correct; the assertions must match real data) and report the change.

- [ ] **Step 6: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: production solver — solve() with golden tests"
```

---

### Task 6: Solver hook

**Files:**
- Create: `src/features/calculator/useSolver.ts`

- [ ] **Step 1: Create `src/features/calculator/useSolver.ts`**

```tsx
import { useEffect, useRef, useState } from "react";
import { type ProblemSpec, type Solution, solve } from "./solver";

interface SolverState {
	solution: Solution | undefined;
	solving: boolean;
}

/** Solve whenever `spec` changes. Runs async (HiGHS loads lazily); the latest
 *  spec wins if results arrive out of order. No solve when there are no targets. */
export function useSolver(spec: ProblemSpec): SolverState {
	const [state, setState] = useState<SolverState>({
		solution: undefined,
		solving: false,
	});
	const runId = useRef(0);
	const key = JSON.stringify(spec);

	useEffect(() => {
		if (spec.targets.length === 0) {
			setState({ solution: undefined, solving: false });
			return;
		}
		const id = ++runId.current;
		setState((s) => ({ ...s, solving: true }));
		solve(spec).then((solution) => {
			if (runId.current === id) setState({ solution, solving: false });
		});
		// biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the
		// stable JSON encoding of `spec`; depending on `spec` identity would re-run every render.
	}, [key]);

	return state;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: 0 errors. (Biome may flag the eslint-disable comment as unused since the repo uses Biome, not eslint — if so, remove that comment line; the `key` dependency is intentional and Biome's `useExhaustiveDependencies` accepts it or can be suppressed with `// biome-ignore lint/correctness/useExhaustiveDependencies: key encodes spec contents`.)

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: useSolver hook"
```

---

### Task 7: Target editor + available inputs + recipe options components

**Files:**
- Create: `src/features/calculator/ItemPicker.tsx`
- Create: `src/features/calculator/TargetEditor.tsx`
- Create: `src/features/calculator/AvailableInputsEditor.tsx`
- Create: `src/features/calculator/RecipeOptions.tsx`

- [ ] **Step 0: Create the shared `src/features/calculator/ItemPicker.tsx`**

Both the target editor and the available-inputs editor search items and add one. Factor the picker out:

```tsx
import { useState } from "react";
import EntityIcon from "#/components/EntityIcon";
import { listItems } from "#/data";

interface ItemPickerProps {
	placeholder: string;
	/** Slugs already chosen — excluded from results. */
	exclude: string[];
	onPick: (slug: string) => void;
}

export default function ItemPicker({
	placeholder,
	exclude,
	onPick,
}: ItemPickerProps) {
	const [query, setQuery] = useState("");
	const excluded = new Set(exclude);
	const matches =
		query.trim().length > 0
			? listItems()
					.filter(
						(i) =>
							!excluded.has(i.slug) &&
							i.name.toLowerCase().includes(query.toLowerCase()),
					)
					.slice(0, 6)
			: [];

	return (
		<div className="relative">
			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm"
			/>
			{matches.length > 0 && (
				<div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--header-bg)] shadow-lg">
					{matches.map((i) => (
						<button
							key={i.slug}
							type="button"
							onClick={() => {
								onPick(i.slug);
								setQuery("");
							}}
							className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--link-bg-hover)]"
						>
							<EntityIcon icon={i.icon} name={i.name} size={20} />
							{i.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 1: Create `src/features/calculator/TargetEditor.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import ItemPicker from "./ItemPicker";
import type { Target } from "./solver";

interface TargetEditorProps {
	targets: Target[];
	onChange: (targets: Target[]) => void;
}

export default function TargetEditor({ targets, onChange }: TargetEditorProps) {
	const add = (item: string) => onChange([...targets, { item, rate: 60 }]);
	const setRate = (item: string, rate: number) =>
		onChange(targets.map((t) => (t.item === item ? { ...t, rate } : t)));
	const remove = (item: string) =>
		onChange(targets.filter((t) => t.item !== item));

	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Targets
			</h2>
			{targets.map((t) => {
				const item = getItem(t.item);
				return (
					<div key={t.item} className="flex items-center gap-2">
						<EntityIcon icon={item?.icon} name={item?.name ?? t.item} size={24} />
						<span className="flex-1 text-sm text-[var(--sea-ink)]">
							{item?.name ?? t.item}
						</span>
						<input
							type="number"
							min={0}
							value={t.rate}
							onChange={(e) => setRate(t.item, Number(e.target.value))}
							aria-label={`${item?.name ?? t.item} per minute`}
							className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
						/>
						<span className="text-xs text-[var(--sea-ink-soft)]">/min</span>
						<button
							type="button"
							onClick={() => remove(t.item)}
							aria-label={`Remove ${item?.name ?? t.item}`}
							className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							×
						</button>
					</div>
				);
			})}
			<ItemPicker
				placeholder="Add an item to produce…"
				exclude={targets.map((t) => t.item)}
				onPick={add}
			/>
		</div>
	);
}
```

- [ ] **Step 1b: Create `src/features/calculator/AvailableInputsEditor.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import ItemPicker from "./ItemPicker";
import type { AvailableInput } from "./solver";

interface AvailableInputsEditorProps {
	inputs: AvailableInput[];
	onChange: (inputs: AvailableInput[]) => void;
}

/** Items the user already produces. A blank rate means "unlimited". */
export default function AvailableInputsEditor({
	inputs,
	onChange,
}: AvailableInputsEditorProps) {
	const add = (item: string) => onChange([...inputs, { item }]);
	const setRate = (item: string, rate: number | undefined) =>
		onChange(inputs.map((i) => (i.item === item ? { ...i, rate } : i)));
	const remove = (item: string) =>
		onChange(inputs.filter((i) => i.item !== item));

	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Available inputs{" "}
				<span className="font-normal normal-case">(already produced)</span>
			</h2>
			{inputs.map((input) => {
				const item = getItem(input.item);
				return (
					<div key={input.item} className="flex items-center gap-2">
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? input.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--sea-ink)]">
							{item?.name ?? input.item}
						</span>
						<input
							type="number"
							min={0}
							value={input.rate ?? ""}
							placeholder="∞"
							onChange={(e) =>
								setRate(
									input.item,
									e.target.value === "" ? undefined : Number(e.target.value),
								)
							}
							aria-label={`${item?.name ?? input.item} available per minute`}
							className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
						/>
						<span className="text-xs text-[var(--sea-ink-soft)]">/min</span>
						<button
							type="button"
							onClick={() => remove(input.item)}
							aria-label={`Remove ${item?.name ?? input.item}`}
							className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							×
						</button>
					</div>
				);
			})}
			<ItemPicker
				placeholder="Add an input you already make…"
				exclude={inputs.map((i) => i.item)}
				onPick={add}
			/>
		</div>
	);
}
```

- [ ] **Step 2: Create `src/features/calculator/RecipeOptions.tsx`**

```tsx
import { useState } from "react";
import { listRecipes } from "#/data";

interface RecipeOptionsProps {
	allowedAlternates: string[];
	onChange: (allowed: string[]) => void;
}

/** All alternate, automatable recipes, sorted by name. */
function alternateRecipes() {
	return listRecipes()
		.filter((r) => r.alternate && r.inMachine && r.producedIn.length > 0)
		.sort((a, b) => a.name.localeCompare(b.name));
}

export default function RecipeOptions({
	allowedAlternates,
	onChange,
}: RecipeOptionsProps) {
	const [query, setQuery] = useState("");
	const allowed = new Set(allowedAlternates);
	const alts = alternateRecipes().filter((r) =>
		r.name.toLowerCase().includes(query.toLowerCase()),
	);

	const toggle = (slug: string) => {
		const next = new Set(allowed);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		onChange([...next]);
	};

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Alternate recipes{" "}
				<span className="font-normal normal-case">({allowed.size} enabled)</span>
			</h2>
			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Filter alternates…"
				aria-label="Filter alternate recipes"
				className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm"
			/>
			<div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
				{alts.map((r) => (
					<label
						key={r.slug}
						className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[var(--link-bg-hover)]"
					>
						<input
							type="checkbox"
							checked={allowed.has(r.slug)}
							onChange={() => toggle(r.slug)}
						/>
						{r.name}
					</label>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: target, available-inputs and recipe-options panels"
```

---

### Task 8: Result tabs

**Files:**
- Create: `src/features/calculator/ResultTabs.tsx`

- [ ] **Step 1: Create `src/features/calculator/ResultTabs.tsx`**

```tsx
import { useState } from "react";
import EntityIcon from "#/components/EntityIcon";
import { getBuilding, getItem } from "#/data";
import { formatNumber, formatPower } from "#/lib/format";
import type { Solution } from "./solver";

const TABS = ["Table", "Resources", "Power & cost"] as const;
type Tab = (typeof TABS)[number];

function name(slug: string): string {
	return getItem(slug)?.name ?? getBuilding(slug)?.name ?? slug;
}
function icon(slug: string): string | undefined {
	return getItem(slug)?.icon ?? getBuilding(slug)?.icon;
}

export default function ResultTabs({ solution }: { solution: Solution }) {
	const [tab, setTab] = useState<Tab>("Table");

	if (solution.status === "infeasible") {
		return (
			<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-6 text-sm text-[var(--sea-ink)]">
				<p className="font-semibold">No feasible plan</p>
				<p className="mt-1 text-[var(--sea-ink-soft)]">
					{solution.diagnosis?.message}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-1 border-b border-[var(--line)]">
				{TABS.map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						className={`px-3 py-2 text-sm font-medium ${
							tab === t
								? "border-b-2 border-[var(--sea-ink)] text-[var(--sea-ink)]"
								: "text-[var(--sea-ink-soft)]"
						}`}
					>
						{t}
					</button>
				))}
			</div>

			{tab === "Table" && (
				<div className="flex flex-col gap-2">
					{solution.recipes.map((u) => {
						const building = getBuilding(u.building);
						return (
							<div
								key={u.recipe}
								className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
							>
								<EntityIcon icon={building?.icon} name={building?.name ?? u.building} size={24} />
								<span className="flex-1 text-[var(--sea-ink)]">
									{name(u.recipe)}
								</span>
								<span className="font-semibold text-[var(--sea-ink)]">
									{formatNumber(u.machines)}×
								</span>
								<span className="text-xs text-[var(--sea-ink-soft)]">
									{building?.name}
								</span>
							</div>
						);
					})}
					{solution.byproducts.length > 0 && (
						<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
							Byproducts:{" "}
							{solution.byproducts
								.map((b) => `${formatNumber(b.rate)}/min ${name(b.item)}`)
								.join(", ")}
						</p>
					)}
				</div>
			)}

			{tab === "Resources" && (
				<div className="flex flex-col gap-2">
					{solution.rawInputs.map((f) => (
						<div
							key={f.item}
							className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
						>
							<EntityIcon icon={icon(f.item)} name={name(f.item)} size={24} />
							<span className="flex-1 text-[var(--sea-ink)]">{name(f.item)}</span>
							<span className="font-semibold">{formatNumber(f.rate)}/min</span>
						</div>
					))}
				</div>
			)}

			{tab === "Power & cost" && (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3">
						<p className="text-xs uppercase text-[var(--sea-ink-soft)]">Power</p>
						<p className="text-lg font-semibold">{formatPower(solution.power)}</p>
					</div>
					<div>
						<p className="mb-2 text-xs uppercase text-[var(--sea-ink-soft)]">
							Build cost
						</p>
						<div className="flex flex-col gap-2">
							{solution.buildCost.map((c) => (
								<div
									key={c.item}
									className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
								>
									<EntityIcon icon={icon(c.item)} name={name(c.item)} size={24} />
									<span className="flex-1">{name(c.item)}</span>
									<span className="font-semibold">{formatNumber(c.rate)}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: calculator result tabs (table/resources/power+cost)"
```

---

### Task 9: Calculator page + route

**Files:**
- Create: `src/features/calculator/CalculatorPage.tsx`
- Modify: `src/routes/calculator.tsx`

- [ ] **Step 1: Create `src/features/calculator/CalculatorPage.tsx`**

```tsx
import { useState } from "react";
import type { AvailableInput, Target } from "./solver";
import AvailableInputsEditor from "./AvailableInputsEditor";
import RecipeOptions from "./RecipeOptions";
import ResultTabs from "./ResultTabs";
import TargetEditor from "./TargetEditor";
import { useSolver } from "./useSolver";

export default function CalculatorPage() {
	const [targets, setTargets] = useState<Target[]>([]);
	const [availableInputs, setAvailableInputs] = useState<AvailableInput[]>([]);
	const [allowedAlternates, setAllowedAlternates] = useState<string[]>([]);
	const { solution, solving } = useSolver({
		targets,
		availableInputs,
		allowedAlternates,
	});

	return (
		<main className="page-wrap px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">
				Production calculator
			</h1>
			<div className="grid gap-8 lg:grid-cols-[320px_1fr]">
				<div className="flex flex-col gap-6">
					<TargetEditor targets={targets} onChange={setTargets} />
					<AvailableInputsEditor
						inputs={availableInputs}
						onChange={setAvailableInputs}
					/>
					<RecipeOptions
						allowedAlternates={allowedAlternates}
						onChange={setAllowedAlternates}
					/>
				</div>
				<div>
					{targets.length === 0 ? (
						<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Add a target item to plan a production line.
						</p>
					) : solving && !solution ? (
						<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Solving…
						</p>
					) : solution ? (
						<ResultTabs solution={solution} />
					) : null}
				</div>
			</div>
		</main>
	);
}
```

- [ ] **Step 2: Replace `src/routes/calculator.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import CalculatorPage from "#/features/calculator/CalculatorPage";

export const Route = createFileRoute("/calculator")({
	head: () => ({
		meta: [
			{ title: "Production calculator — Satisfactory Planner" },
			{
				name: "description",
				content:
					"Plan optimal Satisfactory production lines: set targets, toggle alternate recipes, and see machines, raw resources, power and build cost.",
			},
		],
	}),
	component: CalculatorPage,
});
```

- [ ] **Step 3: Regenerate routes, typecheck**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: calculator page and route"
```

---

### Task 10: Browser smoke + mark calculator beta + verification

**Files:**
- Modify: `src/config/features.ts`

- [ ] **Step 1: Mark the calculator `beta`**

In `src/config/features.ts`, change the `calculator` feature's `status` from `"planned"` to `"beta"`. (It's functional but graph/share/save land in 3b — `beta` shows it's live-but-evolving; the nav "soon" badge only renders for `planned`, so the badge disappears.)

- [ ] **Step 2: Full gate run**

Run: `npm run check && npm run typecheck && npm test && npm run build`
Expected: all pass. New solver tests (9 model + 3 derive + 6 solve = 18) join the suite.

- [ ] **Step 3: Browser smoke**

Run `npm run build && npm run preview` (read the port from output — often 4173; 3000/3001/3002 may be taken). In the browser at `/calculator`:
- Add target "Iron Plate", set 60/min → results appear: Table shows 3× Constructor + 3× Smelter; Resources shows 90/min Iron Ore; Power & cost shows 24 MW + build cost.
- Add target "Reinforced Iron Plate" 30/min → plan expands (screws, rods); Resources shows 360/min Iron Ore.
- Enable an alternate recipe (e.g. filter "Coated Iron Plate", check it) → the plan re-solves and may change.
- Under "Available inputs", add "Iron Ingot" (leave rate blank = unlimited) → the Smelter rows disappear, Iron Ore drops to 0, and Iron Ingot shows in Resources as a consumed input. Set its rate to 30 → Smelters return for the shortfall and Iron Ore reappears (~60/min for a 60/min plate target).
- Type a target then clear all targets → results clear, prompt returns.
- 0 console errors (Clerk dev-key warning is expected).
Kill node watchers afterward (`taskkill //F //IM node.exe`).

- [ ] **Step 4: Normalize route tree + commit**

If `src/routeTree.gen.ts` churned during build, commit the build-accurate version. Then:

```bash
npx biome check --write . && git add -A && git commit -m "feat: mark calculator beta; phase 3a verification"
```

---

## Out of scope (Phase 3b)

- react-flow + elkjs **graph view** of the production chain
- **Maximize-output mode** ("given X inputs, make the most Y") — a second objective/formulation
- **Resource weighting UI** (the solver already accepts `resourceWeights`; 3a ships default weights = 1, no UI control yet)
- **Shareable plan URLs** (encode `ProblemSpec` in search params) and **Save as factory**
- **Overclocking / somersloop** machine-count adjustments (3a reports fractional machines at 100%)
- Moving the solver into a **web worker** (3a runs it async on the main thread; fast enough at these sizes — revisit if large plans jank)
- **Tier/preset alternate toggles** (3a toggles alternates individually; bulk "enable all unlocked at tier N" presets are a 3b convenience)
- **Explicit loop-recipe golden tests** (recycled plastic/rubber). The import/byproduct formulation handles loops correctly — verified structurally — but a dedicated regression test is deferred to 3b alongside the broader solver test matrix.
