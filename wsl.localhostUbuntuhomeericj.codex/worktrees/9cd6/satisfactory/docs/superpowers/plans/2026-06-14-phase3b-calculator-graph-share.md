# Phase 3b: Calculator Graph, Maximize Mode, Share & Weighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the production calculator: a react-flow graph view of the production chain, a maximize-output solver mode, shareable plan URLs, and resource-weighting UI controls.

**Architecture:** Extend the pure 3a solver with a `mode: "produce" | "maximize"` (maximize reuses the LP but flips the objective to maximize a target's net output, with only the bounded available inputs importable). A pure `buildGraph(solution)` turns a `Solution` into nodes/edges; a lazy-loaded `ProductionGraph` component lays them out with elkjs and renders with `@xyflow/react`. A pure `plan-codec` encodes/decodes the `ProblemSpec` to/from a single `?plan=` URL param; `CalculatorPage` treats its state as the source of truth and mirrors it to the URL. A small controls panel exposes the mode toggle and resource weighting.

**Tech Stack:** `@xyflow/react` ^12 (react-flow), `elkjs` ^0.11 (layout), TanStack Start/Router (typed search params), React 19, `highs` (existing), Vitest 4, Tailwind 4 + shadcn, Biome.

**Spec:** `docs/superpowers/specs/2026-06-12-satisfactory-webapp-design.md` (Section 4)

---

## Verified facts (already prototyped — do not re-derive)

- **Maximize LP works.** "Maximize target net output, only bounded available inputs importable, every other item balances ≥ 0." Verified: max `plastic` from 480 `crude-oil` (cap) = **320 plastic/min**, using all 480 oil. LP uses `Maximize` sense; objective = Σ over recipes of `net-coef(target, recipe)·r`; rows have rhs 0; import vars only for provided (capped) inputs.
- **Libraries:** `@xyflow/react@12.11` (react-flow v12, react peer `>=17` → React 19 OK) + `elkjs@0.11`. Import elkjs as `elkjs/lib/elk.bundled.js` (self-contained, no separate worker file — Vite-friendly). react-flow CSS: `@xyflow/react/dist/style.css`.
- **Existing solver** (`src/features/calculator/solver/`): `ProblemSpec` = `{ targets: {item,rate}[], allowedAlternates: string[], availableInputs?: {item,rate?}[], resourceWeights?: Record<string,number> }`. `Solution` = `{ status, recipes: {recipe,machines,building}[], rawInputs: Flow[], providedInputs: Flow[], byproducts: Flow[], flows: ItemFlow[], power, buildCost: Flow[], diagnosis? }`. `Flow = {item, rate}`. `solve(spec): Promise<Solution>`. `buildModel`/`toLpString` build/serialize the LP; `LpModel` = `{ recipes, importVars, providedInputs, objective, bounds, rows }`. The objective is always minimized today (`toLpString` hardcodes `"Minimize"`).
- **Data/format helpers:** `#/data` (`getRecipe`, `getItem`, `getBuilding`, `listRecipes`, `listResources`), `#/lib/format` (`perMinute(amount, time)`, `formatNumber`, `formatPower`). `EntityIcon` from `#/components/EntityIcon`.
- **Calculator UI** (`src/features/calculator/`): `CalculatorPage.tsx` holds `targets`/`availableInputs`/`allowedAlternates` state and calls `useSolver`. `ResultTabs.tsx` has Table/Resources/Power & cost tabs. `useSolver(spec)` solves async with a `runId` race-guard, keyed on `JSON.stringify(spec)`. Route: `src/routes/calculator.tsx` (top-level `/calculator`, has `head` SEO meta).

## Environment facts
- Gates after every group: `npm run check` (0 errors), `npm run typecheck` (0 errors), `npm test` (60 passing now), `npm run build`. Run `npx biome check --write .` before each commit.
- `// @vitest-environment node` is required as line 1 of any test that calls `solve()` (loads HiGHS WASM; jsdom's `window` misleads env detection). Pure tests (buildGraph, plan-codec) run in the default jsdom env.
- react-flow needs the DOM → its component must be client-only. Load `ProductionGraph` via `React.lazy` so its module (and react-flow/elkjs) never executes during SSR. The Graph tab only renders after a solution exists (client-side), so this is safe.
- After a route change run `npm run generate-routes`; commit the build-accurate `routeTree.gen.ts` if it churns; never hand-edit it.
- Dev/preview: `npm run dev`/`preview` may bind 3002/4173 (read the actual port). Kill node watchers (`taskkill //F //IM node.exe`) before final git ops.

## File structure

```
src/features/calculator/solver/types.ts        # + ProblemSpec.mode, LpModel.sense, Solution.outputs
src/features/calculator/solver/model.ts        # maximize branch + toLpString sense
src/features/calculator/solver/model.test.ts   # + maximize model tests
src/features/calculator/solver/solve.ts        # maximize handling + outputs
src/features/calculator/solver/solve.test.ts   # + maximize golden test
src/features/calculator/graph.ts               # pure buildGraph(solution) → nodes/edges
src/features/calculator/graph.test.ts
src/features/calculator/ProductionGraph.tsx    # lazy, client-only: elkjs layout + react-flow
src/features/calculator/plan-codec.ts          # encode/decode ProblemSpec ↔ ?plan=
src/features/calculator/plan-codec.test.ts
src/features/calculator/CalculatorControls.tsx # mode toggle + resource weighting
src/features/calculator/ResultTabs.tsx         # + Graph tab (lazy ProductionGraph)
src/features/calculator/CalculatorPage.tsx     # mode state + URL sync + controls
src/routes/calculator.tsx                       # validateSearch reads ?plan=
package.json                                     # + @xyflow/react, elkjs
```

---

### Task 1: Solver types for maximize mode + outputs

**Files:**
- Modify: `src/features/calculator/solver/types.ts`

- [ ] **Step 1: Add `mode` to `ProblemSpec`**

In `ProblemSpec`, add after `targets`:

```ts
	/** "produce": hit the target rates minimizing raw resources (default).
	 *  "maximize": maximize the target's output given the available inputs. */
	mode?: "produce" | "maximize";
```

- [ ] **Step 2: Add `outputs` to `Solution`**

In `Solution`, add after `recipes`:

```ts
	/** Net production of each target item (the demanded rate in produce mode,
	 *  the achieved maximum in maximize mode). */
	outputs: Flow[];
```

- [ ] **Step 3: Add `sense` to `LpModel`**

In `LpModel`, add after `recipes`:

```ts
	/** LP objective sense. */
	sense: "minimize" | "maximize";
```

- [ ] **Step 4: Verify typecheck fails where Solution/LpModel are constructed**

Run: `npm run typecheck`
Expected: errors in `model.ts` (missing `sense`) and `solve.ts` (missing `outputs`) — these are fixed in Tasks 2–3. (If you prefer green-between-tasks, proceed straight to Task 2; the type errors are expected interim state.)

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: solver types for maximize mode and outputs"
```

---

### Task 2: Maximize model + objective sense

**Files:**
- Modify: `src/features/calculator/solver/model.ts`
- Test: `src/features/calculator/solver/model.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/features/calculator/solver/model.test.ts` (new `describe`):

```ts
import { buildModel, toLpString } from "./model";

describe("buildModel — maximize mode", () => {
	const maxSpec = {
		mode: "maximize" as const,
		targets: [{ item: "plastic", rate: 1 }],
		allowedAlternates: [],
		availableInputs: [{ item: "crude-oil", rate: 480 }],
	};

	it("uses the maximize sense", () => {
		expect(buildModel(maxSpec).sense).toBe("maximize");
		expect(toLpString(buildModel(maxSpec))).toMatch(/^Maximize/);
	});

	it("only makes provided inputs importable (not free raw resources)", () => {
		const model = buildModel(maxSpec);
		// crude-oil is provided → import var; other raws (iron-ore) are NOT importable
		expect(model.importVars.has("crude-oil")).toBe(true);
		expect(model.importVars.has("iron-ore")).toBe(false);
	});

	it("puts the target's net coefficients in the objective", () => {
		const model = buildModel(maxSpec);
		// at least one recipe var has a positive plastic coefficient in the objective
		const anyPositive = [...model.objective.values()].some((c) => c > 0);
		expect(anyPositive).toBe(true);
	});

	it("uses rhs 0 on all rows in maximize mode", () => {
		const model = buildModel(maxSpec);
		expect(model.rows.every((r) => r.rhs === 0)).toBe(true);
	});

	it("produce mode still minimizes (regression)", () => {
		const model = buildModel({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		expect(model.sense).toBe("minimize");
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/solver/model.test.ts`
Expected: FAIL — `sense` undefined / `toLpString` emits `Minimize`.

- [ ] **Step 3: Update `buildModel` and `toLpString` in `model.ts`**

Replace the import-var loop and objective construction, and the rows' rhs, to branch on mode. The full updated `buildModel` body (replace from `const demand = ...` through the `return`):

```ts
	const mode = spec.mode ?? "produce";
	const demand = new Map(spec.targets.map((t) => [t.item, t.rate]));
	const targetItems = new Set(spec.targets.map((t) => t.item));

	// Import variables.
	//  - produce mode: every input (raw / unproducible / provided) is importable.
	//  - maximize mode: only the user's provided inputs are importable (you only
	//    have what you declared); raws are NOT free.
	const importVars = new Map<string, string>();
	const providedInputs = new Set<string>();
	const objective = new Map<string, number>();
	const bounds = new Map<string, number>();
	let m = 0;
	for (const item of items) {
		const importable = mode === "produce" ? isInput(item) : provided.has(item);
		if (!importable) continue;
		const name = `m${m++}`;
		importVars.set(item, name);
		if (provided.has(item)) {
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

	// Balance rows: Σ (perMin product − perMin ingredient)·r + import >= rhs.
	//  - produce mode: rhs = demand (target rates), import offsets shortfall.
	//  - maximize mode: rhs = 0 (no fixed demand; the target is maximized).
	const rows: LpModel["rows"] = [];
	for (const item of items) {
		const coefs = new Map<string, number>();
		recipes.forEach((r, i) => {
			let c = 0;
			for (const p of r.products)
				if (p.item === item) c += perMinute(p.amount, r.time);
			for (const g of r.ingredients)
				if (g.item === item) c -= perMinute(g.amount, r.time);
			if (Math.abs(c) > EPSILON) coefs.set(`r${i}`, c);
		});
		const imp = importVars.get(item);
		if (imp) coefs.set(imp, 1);
		if (coefs.size === 0) continue;
		rows.push({ item, coefs, rhs: mode === "produce" ? (demand.get(item) ?? 0) : 0 });
	}

	// Maximize objective: net production of the target item(s).
	if (mode === "maximize") {
		objective.clear();
		recipes.forEach((r, i) => {
			let c = 0;
			for (const p of r.products)
				if (targetItems.has(p.item)) c += perMinute(p.amount, r.time);
			for (const g of r.ingredients)
				if (targetItems.has(g.item)) c -= perMinute(g.amount, r.time);
			if (Math.abs(c) > EPSILON) objective.set(`r${i}`, c);
		});
	}

	return {
		recipes,
		importVars,
		providedInputs,
		objective,
		bounds,
		rows,
		sense: mode === "maximize" ? "maximize" : "minimize",
	};
}
```

(Note: this replaces the existing `const demand = …`, the import-var loop, the rows loop, and the `return` statement. The lines above them — `allowed`/`recipes`/`rawResources`/`producible`/`items`/`provided`/`isInput` — stay unchanged.)

Then update `toLpString`'s first line to honor the sense:

```ts
	const lines = [
		model.sense === "maximize" ? "Maximize" : "Minimize",
		` obj: ${obj || "0"}`,
		"Subject To",
	];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/calculator/solver/model.test.ts`
Expected: all pass (the original produce-mode model tests + 5 maximize tests).

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: maximize objective + sense in the LP model"
```

---

### Task 3: Solve maximize mode + report outputs

**Files:**
- Modify: `src/features/calculator/solver/solve.ts`
- Test: `src/features/calculator/solver/solve.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/features/calculator/solver/solve.test.ts` (inside the existing `describe`, or a new one — file already has the node pragma on line 1):

```ts
	it("maximizes target output from a bounded input", async () => {
		// Only 480 crude-oil available → max plastic is 320/min (standard recipes).
		const sol = await solve({
			mode: "maximize",
			targets: [{ item: "plastic", rate: 1 }],
			allowedAlternates: [],
			availableInputs: [{ item: "crude-oil", rate: 480 }],
		});
		expect(sol.status).toBe("optimal");
		const plastic = sol.outputs.find((o) => o.item === "plastic");
		expect(plastic?.rate).toBeCloseTo(320, 0);
		const oil = sol.providedInputs.find((f) => f.item === "crude-oil");
		expect(oil?.rate).toBeCloseTo(480, 0);
	});

	it("reports outputs at the demanded rate in produce mode", async () => {
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		expect(sol.outputs.find((o) => o.item === "iron-plate")?.rate).toBeCloseTo(
			60,
			1,
		);
	});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/solver/solve.test.ts`
Expected: FAIL — `outputs` undefined.

- [ ] **Step 3: Update `solve.ts`**

In `normalizeSpec`, keep maximize targets even though their rate is ignored. Replace the `targets` construction:

```ts
	const mode = spec.mode ?? "produce";
	const byItem = new Map<string, number>();
	for (const t of spec.targets) {
		// In produce mode a target needs a finite positive rate; in maximize mode
		// the rate is ignored (the target is maximized), so keep any listed item.
		if (mode === "produce" && (!Number.isFinite(t.rate) || t.rate <= 0)) continue;
		byItem.set(t.item, (byItem.get(t.item) ?? 0) + (Number.isFinite(t.rate) ? t.rate : 0));
	}
	const targets = [...byItem].map(([item, rate]) => ({ item, rate }));
```

(Keep the existing `availableInputs` filter and `return { ...spec, targets, availableInputs }`.)

In the main `solve` body, after computing `flows` (the `const flows = ...` line), add outputs derived from the target items' net production:

```ts
	// Outputs: net production of each target item (achieved rate).
	const targetItems = new Set(spec.targets.map((t) => t.item));
	const outputs: Flow[] = [];
	for (const f of flows) {
		if (!targetItems.has(f.item)) continue;
		const net = f.produced - f.consumed;
		if (net > EPSILON) outputs.push({ item: f.item, rate: net });
	}
```

Add `outputs` to BOTH returned solutions: the `infeasible()` helper (add `outputs: [],` after `recipes: [],`) and the final `return { status: "optimal", recipes, outputs, rawInputs, ... }`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/calculator/solver/solve.test.ts`
Expected: all pass (the prior solve tests + 2 new). If the maximize value isn't ~320, check `src/data/generated/recipes.json` for the `plastic`/`recipe-plastic-c` rate and adjust the literal to the real value; report the change.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: solve maximize mode and report target outputs"
```

---

### Task 4: Install graph libraries

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

Run: `npm install @xyflow/react@^12 elkjs@^0.11`
Verify: `node -e "console.log(require('@xyflow/react/package.json').version, require('elkjs/package.json').version)"` prints `12.x 0.11.x`.

- [ ] **Step 2: Confirm the bundled elk + CSS subpaths resolve**

Run: `node -e "const fs=require('fs');const p=require.resolve('elkjs/package.json').replace(/package.json$/,'');console.log('elk bundled:', fs.existsSync(p+'lib/elk.bundled.js')); const x=require.resolve('@xyflow/react/package.json').replace(/package.json$/,'');console.log('xyflow css:', fs.existsSync(x+'dist/style.css'))"`
Expected: both `true`. If a path differs, find the real one (`ls node_modules/elkjs/lib`, `ls node_modules/@xyflow/react/dist`) and use it in Tasks 6/7; report the change.

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "chore: install react-flow and elkjs"
```

---

### Task 5: buildGraph — Solution → nodes/edges (pure)

**Files:**
- Create: `src/features/calculator/graph.ts`
- Test: `src/features/calculator/graph.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/features/calculator/graph.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildGraph } from "./graph";
import type { Solution } from "./solver";

const solution: Solution = {
	status: "optimal",
	recipes: [
		{ recipe: "recipe-ingotiron-c", machines: 3, building: "smelter" },
		{ recipe: "recipe-ironplate-c", machines: 3, building: "constructor" },
	],
	outputs: [{ item: "iron-plate", rate: 60 }],
	rawInputs: [{ item: "iron-ore", rate: 90 }],
	providedInputs: [],
	byproducts: [],
	flows: [],
	power: 24,
	buildCost: [],
};

describe("buildGraph", () => {
	it("creates a node per recipe, input and output", () => {
		const { nodes } = buildGraph(solution);
		const ids = nodes.map((n) => n.id);
		expect(ids).toContain("recipe:recipe-ingotiron-c");
		expect(ids).toContain("recipe:recipe-ironplate-c");
		expect(ids).toContain("input:iron-ore");
		expect(ids).toContain("output:iron-plate");
	});

	it("tags node kinds", () => {
		const { nodes } = buildGraph(solution);
		expect(nodes.find((n) => n.id === "input:iron-ore")?.kind).toBe("input");
		expect(nodes.find((n) => n.id === "output:iron-plate")?.kind).toBe("output");
		expect(nodes.find((n) => n.id === "recipe:recipe-ironplate-c")?.kind).toBe(
			"recipe",
		);
	});

	it("connects ore → smelter → constructor → output with item-labelled edges", () => {
		const { edges } = buildGraph(solution);
		const has = (s: string, t: string, item: string) =>
			edges.some((e) => e.source === s && e.target === t && e.item === item);
		expect(has("input:iron-ore", "recipe:recipe-ingotiron-c", "iron-ore")).toBe(
			true,
		);
		expect(
			has(
				"recipe:recipe-ingotiron-c",
				"recipe:recipe-ironplate-c",
				"iron-ingot",
			),
		).toBe(true);
		expect(
			has("recipe:recipe-ironplate-c", "output:iron-plate", "iron-plate"),
		).toBe(true);
	});

	it("edge rates conserve per item (sum out of a producer = its production)", () => {
		const { edges } = buildGraph(solution);
		const ironIngotOut = edges
			.filter((e) => e.item === "iron-ingot")
			.reduce((s, e) => s + e.rate, 0);
		// 3 smelters × 30/min = 90 iron-ingot/min flows to the plate recipe
		expect(ironIngotOut).toBeCloseTo(90, 1);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/graph.test.ts`
Expected: FAIL — cannot resolve `./graph`.

- [ ] **Step 3: Implement `src/features/calculator/graph.ts`**

```ts
import { getRecipe } from "#/data";
import { perMinute } from "#/lib/format";
import type { Solution } from "./solver";

export type NodeKind =
	| "recipe"
	| "input"
	| "provided"
	| "output"
	| "byproduct";

export interface GraphNode {
	id: string;
	kind: NodeKind;
	/** Slug of the recipe (recipe nodes) or item (other nodes). */
	slug: string;
	rate?: number;
}

export interface GraphEdge {
	id: string;
	source: string;
	target: string;
	item: string;
	rate: number;
}

const EPSILON = 1e-6;

interface Port {
	node: string;
	rate: number;
}

/** Turn a solved plan into a production DAG: recipe/machine nodes plus input,
 *  output and byproduct nodes, with item-labelled, rate-weighted edges. */
export function buildGraph(solution: Solution): {
	nodes: GraphNode[];
	edges: GraphEdge[];
} {
	const nodes: GraphNode[] = [];
	// Per item: who supplies it and who consumes it.
	const sources = new Map<string, Port[]>();
	const sinks = new Map<string, Port[]>();
	const addSource = (item: string, node: string, rate: number) => {
		if (rate <= EPSILON) return;
		sources.set(item, [...(sources.get(item) ?? []), { node, rate }]);
	};
	const addSink = (item: string, node: string, rate: number) => {
		if (rate <= EPSILON) return;
		sinks.set(item, [...(sinks.get(item) ?? []), { node, rate }]);
	};

	// Recipe nodes (and their per-item production/consumption rates).
	for (const u of solution.recipes) {
		const id = `recipe:${u.recipe}`;
		nodes.push({ id, kind: "recipe", slug: u.recipe, rate: u.machines });
		const recipe = getRecipe(u.recipe);
		if (!recipe) continue;
		for (const p of recipe.products)
			addSource(p.item, id, perMinute(p.amount, recipe.time) * u.machines);
		for (const g of recipe.ingredients)
			addSink(g.item, id, perMinute(g.amount, recipe.time) * u.machines);
	}

	// Input nodes supply their item.
	for (const f of solution.rawInputs) {
		const id = `input:${f.item}`;
		nodes.push({ id, kind: "input", slug: f.item, rate: f.rate });
		addSource(f.item, id, f.rate);
	}
	for (const f of solution.providedInputs) {
		const id = `input:${f.item}`;
		nodes.push({ id, kind: "provided", slug: f.item, rate: f.rate });
		addSource(f.item, id, f.rate);
	}
	// Output and byproduct nodes consume (sink) their item.
	for (const f of solution.outputs) {
		const id = `output:${f.item}`;
		nodes.push({ id, kind: "output", slug: f.item, rate: f.rate });
		addSink(f.item, id, f.rate);
	}
	for (const f of solution.byproducts) {
		const id = `byproduct:${f.item}`;
		nodes.push({ id, kind: "byproduct", slug: f.item, rate: f.rate });
		addSink(f.item, id, f.rate);
	}

	// Edges: apportion each item's supply across its sinks proportionally.
	const edges: GraphEdge[] = [];
	for (const [item, srcs] of sources) {
		const dsts = sinks.get(item) ?? [];
		const totalSupply = srcs.reduce((s, p) => s + p.rate, 0);
		if (totalSupply <= EPSILON) continue;
		for (const src of srcs) {
			for (const dst of dsts) {
				const rate = (src.rate / totalSupply) * dst.rate;
				if (rate <= EPSILON) continue;
				edges.push({
					id: `${src.node}->${dst.node}:${item}`,
					source: src.node,
					target: dst.node,
					item,
					rate,
				});
			}
		}
	}

	return { nodes, edges };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/calculator/graph.test.ts`
Expected: 4 passed. If `recipe-ingotiron-c`'s ingot rate isn't 30/min/machine, adjust the conservation literal to the real per-machine rate from the data and report it.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: buildGraph — solution to production DAG"
```

---

### Task 6: ProductionGraph component (elkjs + react-flow)

**Files:**
- Create: `src/features/calculator/ProductionGraph.tsx`

No unit test — it's a DOM/canvas component verified in the Task 11 browser smoke. Keep all pure logic in `graph.ts` (already tested).

- [ ] **Step 1: Create `src/features/calculator/ProductionGraph.tsx`**

```tsx
import {
	Background,
	type Edge,
	type Node,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import { getBuilding, getItem, getRecipe } from "#/data";
import { formatNumber } from "#/lib/format";
import { buildGraph, type GraphNode } from "./graph";
import type { Solution } from "./solver";

const elk = new ELK();
const NODE_W = 190;
const NODE_H = 56;

function label(node: GraphNode): { title: string; sub: string } {
	if (node.kind === "recipe") {
		const recipe = getRecipe(node.slug);
		const building = recipe ? getBuilding(recipe.producedIn[0]) : undefined;
		return {
			title: recipe?.name ?? node.slug,
			sub: `${formatNumber(node.rate ?? 0)}× ${building?.name ?? "machines"}`,
		};
	}
	const item = getItem(node.slug);
	const kindLabel =
		node.kind === "output"
			? "Output"
			: node.kind === "byproduct"
				? "Byproduct"
				: node.kind === "provided"
					? "Provided"
					: "Raw";
	return {
		title: item?.name ?? node.slug,
		sub: `${kindLabel} · ${formatNumber(node.rate ?? 0)}/min`,
	};
}

const KIND_BG: Record<GraphNode["kind"], string> = {
	recipe: "var(--chip-bg)",
	input: "var(--link-bg-hover)",
	provided: "var(--link-bg-hover)",
	output: "var(--link-bg-hover)",
	byproduct: "var(--link-bg-hover)",
};

export default function ProductionGraph({ solution }: { solution: Solution }) {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	useEffect(() => {
		const graph = buildGraph(solution);
		const elkGraph = {
			id: "root",
			layoutOptions: {
				"elk.algorithm": "layered",
				"elk.direction": "RIGHT",
				"elk.layered.spacing.nodeNodeBetweenLayers": "80",
				"elk.spacing.nodeNode": "30",
			},
			children: graph.nodes.map((n) => ({ id: n.id, width: NODE_W, height: NODE_H })),
			edges: graph.edges.map((e) => ({
				id: e.id,
				sources: [e.source],
				targets: [e.target],
			})),
		};
		let cancelled = false;
		elk.layout(elkGraph).then((laid) => {
			if (cancelled) return;
			const pos = new Map(
				(laid.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]),
			);
			setNodes(
				graph.nodes.map((n) => {
					const { title, sub } = label(n);
					return {
						id: n.id,
						position: pos.get(n.id) ?? { x: 0, y: 0 },
						data: { label: `${title} — ${sub}` },
						style: {
							width: NODE_W,
							height: NODE_H,
							fontSize: 12,
							borderRadius: 8,
							border: "1px solid var(--line)",
							background: KIND_BG[n.kind],
							color: "var(--sea-ink)",
							padding: 6,
						},
					};
				}),
			);
			setEdges(
				graph.edges.map((e) => ({
					id: e.id,
					source: e.source,
					target: e.target,
					label: `${formatNumber(e.rate)}/min`,
					labelStyle: { fontSize: 10, fill: "var(--sea-ink-soft)" },
				})),
			);
		});
		return () => {
			cancelled = true;
		};
	}, [solution]);

	return (
		<div style={{ height: 480 }} className="rounded-xl border border-[var(--line)]">
			<ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
				<Background />
			</ReactFlow>
		</div>
	);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: 0 errors. (If `@xyflow/react` types complain about `proOptions`/`Background`, confirm the v12 import names via `node -e "console.log(Object.keys(require('@xyflow/react')))"` and adjust imports; report any change.)

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: ProductionGraph (elkjs layout + react-flow)"
```

---

### Task 7: Graph tab (lazy) in ResultTabs

**Files:**
- Modify: `src/features/calculator/ResultTabs.tsx`

- [ ] **Step 1: Add a lazy import + "Graph" tab**

At the top of `ResultTabs.tsx`, add:

```tsx
import { Suspense, lazy, useState } from "react";

const ProductionGraph = lazy(() => import("./ProductionGraph"));
```

(Merge the `useState`/`lazy`/`Suspense` into the existing React import line; remove any duplicate `useState` import.)

Add `"Graph"` to the `TABS` tuple (make it the first tab so it's the default visual):

```tsx
const TABS = ["Graph", "Table", "Resources", "Power & cost"] as const;
```

Add the Graph tab body (alongside the other `tab === ...` blocks):

```tsx
			{tab === "Graph" && (
				<Suspense
					fallback={
						<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Loading graph…
						</p>
					}
				>
					<ProductionGraph solution={solution} />
				</Suspense>
			)}
```

- [ ] **Step 2: Verify typecheck + build (the lazy chunk must compile)**

Run: `npm run typecheck && npm run build`
Expected: 0 type errors; build emits a separate `ProductionGraph` chunk (react-flow/elkjs are code-split out of the main bundle).

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: graph tab (lazy-loaded production graph)"
```

---

### Task 8: Plan codec (ProblemSpec ↔ URL)

**Files:**
- Create: `src/features/calculator/plan-codec.ts`
- Test: `src/features/calculator/plan-codec.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/features/calculator/plan-codec.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decodePlan, encodePlan } from "./plan-codec";
import type { ProblemSpec } from "./solver";

describe("plan codec", () => {
	const spec: ProblemSpec = {
		mode: "maximize",
		targets: [{ item: "plastic", rate: 1 }],
		allowedAlternates: ["recipe-alternate-coatedironplate-c"],
		availableInputs: [{ item: "crude-oil", rate: 480 }],
		resourceWeights: { "iron-ore": 0.5 },
	};

	it("round-trips a spec through encode/decode", () => {
		expect(decodePlan(encodePlan(spec))).toEqual(spec);
	});

	it("produces a URL-safe string", () => {
		expect(encodePlan(spec)).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it("returns undefined for garbage", () => {
		expect(decodePlan("@@not-valid@@")).toBeUndefined();
		expect(decodePlan("")).toBeUndefined();
	});

	it("decodes only well-formed specs (must have a targets array)", () => {
		const bad = encodePlan({ foo: 1 } as unknown as ProblemSpec);
		expect(decodePlan(bad)).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/calculator/plan-codec.test.ts`
Expected: FAIL — cannot resolve `./plan-codec`.

- [ ] **Step 3: Implement `src/features/calculator/plan-codec.ts`**

```ts
import type { ProblemSpec } from "./solver";

/** base64url(JSON) of the spec — compact, opaque, URL-safe. */
export function encodePlan(spec: ProblemSpec): string {
	const json = JSON.stringify(spec);
	const b64 = btoa(unescape(encodeURIComponent(json)));
	return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePlan(encoded: string): ProblemSpec | undefined {
	if (!encoded) return undefined;
	try {
		const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
		const json = decodeURIComponent(escape(atob(b64)));
		const parsed = JSON.parse(json);
		// Minimal shape validation — must look like a ProblemSpec.
		if (
			!parsed ||
			!Array.isArray(parsed.targets) ||
			!Array.isArray(parsed.allowedAlternates)
		) {
			return undefined;
		}
		return parsed as ProblemSpec;
	} catch {
		return undefined;
	}
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/calculator/plan-codec.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: plan codec (ProblemSpec <-> URL param)"
```

---

### Task 9: Mode toggle + resource weighting controls

**Files:**
- Create: `src/features/calculator/CalculatorControls.tsx`

- [ ] **Step 1: Create `src/features/calculator/CalculatorControls.tsx`**

```tsx
interface CalculatorControlsProps {
	mode: "produce" | "maximize";
	onModeChange: (mode: "produce" | "maximize") => void;
	weighting: "balanced" | "minimize-ore";
	onWeightingChange: (w: "balanced" | "minimize-ore") => void;
}

const MODES = [
	{ value: "produce", label: "Produce rate" },
	{ value: "maximize", label: "Maximize output" },
] as const;

const WEIGHTINGS = [
	{ value: "balanced", label: "Balanced" },
	{ value: "minimize-ore", label: "Spare the ore" },
] as const;

/** A small preset-based weighting control. "Spare the ore" down-weights the
 *  common ores so the optimizer prefers other raws when there's a choice. */
export const WEIGHTING_PRESETS: Record<
	"balanced" | "minimize-ore",
	Record<string, number> | undefined
> = {
	balanced: undefined,
	"minimize-ore": { "iron-ore": 3, "copper-ore": 3, "caterium-ore": 3 },
};

export default function CalculatorControls({
	mode,
	onModeChange,
	weighting,
	onWeightingChange,
}: CalculatorControlsProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Mode
				</span>
				<div className="flex gap-1">
					{MODES.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => onModeChange(opt.value)}
							className={`rounded-full border px-3 py-1 text-xs font-medium ${
								mode === opt.value
									? "border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)]"
									: "border-[var(--line)] text-[var(--sea-ink-soft)]"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Resource weighting
				</span>
				<div className="flex gap-1">
					{WEIGHTINGS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => onWeightingChange(opt.value)}
							className={`rounded-full border px-3 py-1 text-xs font-medium ${
								weighting === opt.value
									? "border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)]"
									: "border-[var(--line)] text-[var(--sea-ink-soft)]"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: calculator mode + resource-weighting controls"
```

---

### Task 10: Wire mode, weighting, controls and URL sync into CalculatorPage + route

**Files:**
- Modify: `src/features/calculator/CalculatorPage.tsx`
- Modify: `src/routes/calculator.tsx`

- [ ] **Step 1: Replace `src/features/calculator/CalculatorPage.tsx`**

```tsx
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AvailableInputsEditor from "./AvailableInputsEditor";
import CalculatorControls, {
	WEIGHTING_PRESETS,
} from "./CalculatorControls";
import { decodePlan, encodePlan } from "./plan-codec";
import RecipeOptions from "./RecipeOptions";
import ResultTabs from "./ResultTabs";
import type { AvailableInput, ProblemSpec, Target } from "./solver";
import TargetEditor from "./TargetEditor";
import { useSolver } from "./useSolver";

type Weighting = "balanced" | "minimize-ore";

export default function CalculatorPage() {
	const search = useSearch({ strict: false }) as { plan?: string };
	const navigate = useNavigate();

	// Initialize state once from the ?plan= URL param (if present and valid).
	const [initial] = useState(() =>
		typeof search.plan === "string" ? decodePlan(search.plan) : undefined,
	);
	const [targets, setTargets] = useState<Target[]>(initial?.targets ?? []);
	const [availableInputs, setAvailableInputs] = useState<AvailableInput[]>(
		initial?.availableInputs ?? [],
	);
	const [allowedAlternates, setAllowedAlternates] = useState<string[]>(
		initial?.allowedAlternates ?? [],
	);
	const [mode, setMode] = useState<"produce" | "maximize">(
		initial?.mode ?? "produce",
	);
	const [weighting, setWeighting] = useState<Weighting>("balanced");

	const spec: ProblemSpec = {
		mode,
		targets,
		availableInputs,
		allowedAlternates,
		resourceWeights: WEIGHTING_PRESETS[weighting],
	};
	const { solution, solving } = useSolver(spec);

	// Mirror state to the URL (state is the source of truth; replace, don't push).
	const planParam = targets.length > 0 ? encodePlan(spec) : undefined;
	useEffect(() => {
		navigate({
			to: "/calculator",
			search: planParam ? { plan: planParam } : {},
			replace: true,
		});
	}, [planParam, navigate]);

	return (
		<main className="page-wrap px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">
				Production calculator
			</h1>
			<div className="grid gap-8 lg:grid-cols-[320px_1fr]">
				<div className="flex flex-col gap-6">
					<CalculatorControls
						mode={mode}
						onModeChange={setMode}
						weighting={weighting}
						onWeightingChange={setWeighting}
					/>
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
							{mode === "maximize"
								? "Add a target item and an available input to maximize output."
								: "Add a target item to plan a production line."}
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

(Note: in maximize mode the target's rate is ignored by the solver, so the rate inputs in `TargetEditor` are harmless — leave them. The empty-state copy adapts to the mode.)

- [ ] **Step 2: Add `validateSearch` to `src/routes/calculator.tsx`**

Add a `validateSearch` to the route options (keep the existing `head` and `component`):

```tsx
export const Route = createFileRoute("/calculator")({
	validateSearch: (
		search: Record<string, unknown>,
	): { plan?: string } => ({
		plan: typeof search.plan === "string" ? search.plan : undefined,
	}),
	head: () => ({
		// …unchanged…
	}),
	component: CalculatorPage,
});
```

- [ ] **Step 3: Regenerate routes, typecheck**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: mode/weighting controls + shareable plan URLs in the calculator"
```

---

### Task 11: Browser smoke + verification

- [ ] **Step 1: Full gate run**

Run: `npm run check && npm run typecheck && npm test && npm run build`
Expected: all pass. New tests: 5 maximize-model + 2 maximize-solve + 4 graph + 4 codec = +15 → 75 total.

- [ ] **Step 2: Browser smoke (REQUIRED — react-flow + elkjs + URL sync only verify in a real browser)**

Run `npm run build && npm run preview` (read the port; often 4173). At `/calculator`:
- Produce mode, add "Iron Plate" 60/min → the **Graph** tab (now default) renders a left-to-right DAG: Iron Ore → Smelter → Constructor → Iron Plate, edges labelled `…/min`. Table/Resources/Power tabs still work.
- The URL gains a `?plan=…` param. Copy it, open in a new tab → the calculator restores the same targets/result.
- Switch **Mode → Maximize output**, add available input "Crude Oil" 480, target "Plastic" → result shows ~320/min plastic output (Resources/Table), graph renders.
- **Resource weighting → "Spare the ore"** with a plan that has an ore-vs-alternate choice → re-solves (may change recipes).
- 0 console errors (Clerk dev-key warning expected). Confirm no react-flow attribution overlay errors and the elkjs layout positions nodes (not all stacked at 0,0).
Kill node watchers afterward.

- [ ] **Step 3: Mark spec phase done + normalize route tree**

In `docs/superpowers/specs/2026-06-12-satisfactory-webapp-design.md`, the Build order "Calculator" line (item 3) — append ` — done (3a+3b)`. If `routeTree.gen.ts` churned, commit the build-accurate version.

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: phase 3b verification; calculator complete" || echo "nothing to commit"
```

---

## Out of scope (later phases)

- **Save as factory** — depends on the Phase 4 factories feature; the share URL already serializes a plan, which save-as-factory will reuse.
- **Overclocking / somersloop** machine-count adjustments (still fractional machines at 100%).
- **Per-resource weight sliders** — 3b ships two presets (Balanced / Spare the ore); fine-grained per-resource weights can come later (the solver already accepts arbitrary `resourceWeights`).
- **Moving the solver to a web worker** (still async on the main thread; fast enough).
- **Graph polish** — custom node components with icons, draggable pinning, sub-flow grouping (3b uses default react-flow nodes with text labels + elkjs auto-layout).
