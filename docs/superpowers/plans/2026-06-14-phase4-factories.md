# Phase 4 — Factories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist user factories (from a frozen calculator plan or manual entry) behind Clerk-authenticated Convex functions, derive build cost / power / efficiency from static game data, and surface them in a `/factories` grid + detail UI.

**Architecture:** Wire Clerk into Convex (`ConvexProviderWithClerk` + `auth.config.ts`) so every Convex function gets the caller's identity. A single `factories` table stores manual production with typed validators and calculator plans as a frozen JSON string (Zod-parsed on read). Pure, unit-tested derive functions compute cost/power/efficiency. UI gates on auth state and reuses existing calculator editor/result components.

**Tech Stack:** Convex (auth + DB), Clerk (`@clerk/clerk-react`), TanStack Start/Router, React 19, Zod 4, shadcn/Tailwind 4, Vitest 4 + testing-library, Biome.

**Spec:** [docs/superpowers/specs/2026-06-14-phase4-factories-design.md](../specs/2026-06-14-phase4-factories-design.md)

**Conventions for every task:**
- Biome: tabs, double quotes. Run `npx biome check --write <files>` before committing.
- Commit messages: `feat:` / `test:` / `chore:` etc., end with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.
- Pure-logic tasks are TDD (test first, watch it fail, implement, watch it pass). Convex-function and UI tasks are verified against the running deployment + typecheck/build, since their auth context can't be unit-tested without adding `convex-test` (intentionally out of scope).
- Final gate per task group: `npx biome check . && npm run typecheck && npm test && npm run build`.

---

## Group A — Auth + schema foundation

### Task 1: Validate Convex + Clerk env vars

**Files:**
- Modify: `src/env.ts`
- Modify: `src/integrations/convex/provider.tsx`
- Modify: `src/integrations/clerk/provider.tsx`

- [ ] **Step 1: Add the two client vars to the validated schema**

In `src/env.ts`, replace the `client` block with:

```ts
	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_CONVEX_URL: z.string().url(),
		VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
	},
```

- [ ] **Step 2: Read Convex URL from validated env**

In `src/integrations/convex/provider.tsx`, replace the raw `import.meta` read:

```ts
import { ConvexQueryClient } from "@convex-dev/react-query";
import { env } from "#/env";

const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL);
```

(Leave the rest of the file for Task 2 — this step only removes the `(import.meta as any)` cast and the manual `console.error` guard, which the Zod schema now enforces.)

- [ ] **Step 3: Read Clerk key from validated env**

In `src/integrations/clerk/provider.tsx`, replace the raw read + manual throw:

```ts
import { ClerkProvider } from "@clerk/clerk-react";
import { env } from "#/env";
// ...
		<ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0 (the `noExplicitAny` on the old `import.meta as any` cast is gone).

- [ ] **Step 5: Commit**

```bash
git add src/env.ts src/integrations/convex/provider.tsx src/integrations/clerk/provider.tsx
git commit -m "feat: validate Convex + Clerk env vars via t3env"
```

### Task 2: Wire Clerk identity into Convex

**Files:**
- Modify: `src/integrations/convex/provider.tsx`

- [ ] **Step 1: Swap ConvexProvider for ConvexProviderWithClerk**

Full new contents of `src/integrations/convex/provider.tsx`:

```tsx
import { ConvexQueryClient } from "@convex-dev/react-query";
import { useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { env } from "#/env";

const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL);

export default function AppConvexProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ConvexProviderWithClerk
			client={convexQueryClient.convexClient}
			useAuth={useAuth}
		>
			{children}
		</ConvexProviderWithClerk>
	);
}
```

`__root.tsx` already nests `<ClerkProvider><ConvexProvider>…` so the Clerk `useAuth` hook resolves correctly — no change needed there.

- [ ] **Step 2: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/integrations/convex/provider.tsx
git commit -m "feat: authenticate Convex with Clerk identity"
```

### Task 3: Register Clerk as the Convex auth provider

**Files:**
- Create: `convex/auth.config.ts`

- [ ] **Step 1: Create the auth config**

`convex/auth.config.ts`:

```ts
export default {
	providers: [
		{
			domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
			applicationID: "convex",
		},
	],
};
```

`CLERK_JWT_ISSUER_DOMAIN` is set in the Convex dashboard (Settings → Environment Variables) to the Issuer URL of the Clerk JWT template named `convex`. `applicationID: "convex"` must match that template name.

- [ ] **Step 2: Push to the running deployment**

Run: `npx convex dev --once`
Expected: deploys without error and prints the configured auth provider. If it reports a missing `CLERK_JWT_ISSUER_DOMAIN`, set it in the dashboard and re-run.

- [ ] **Step 3: Commit**

```bash
git add convex/auth.config.ts
git commit -m "feat: register Clerk JWT provider for Convex auth"
```

### Task 4: Replace demo schema with the factories table

**Files:**
- Modify: `convex/schema.ts`
- Delete: `convex/todos.ts`

- [ ] **Step 1: Define the factories schema**

Full new contents of `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const itemRate = v.object({ item: v.string(), rate: v.number() });

const production = v.union(
	// Frozen calculator result: JSON.stringify({ spec, solution }).
	v.object({ source: v.literal("plan"), plan: v.string() }),
	v.object({
		source: v.literal("manual"),
		inputs: v.array(itemRate),
		outputs: v.array(itemRate),
		machines: v.array(
			v.object({
				building: v.string(),
				count: v.number(),
				clock: v.optional(v.number()),
			}),
		),
	}),
);

export default defineSchema({
	factories: defineTable({
		userId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.union(
			v.literal("planned"),
			v.literal("building"),
			v.literal("operational"),
			v.literal("paused"),
		),
		location: v.optional(v.object({ x: v.number(), y: v.number() })),
		production,
		actuals: v.optional(v.array(itemRate)),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),
});
```

- [ ] **Step 2: Delete the demo todos functions**

Run: `git rm convex/todos.ts`
(The `products`/`todos` tables are removed by Step 1; no app code imports `convex/todos.ts` — verified by grep before deleting.)

- [ ] **Step 3: Push schema to the deployment**

Run: `npx convex dev --once`
Expected: schema deploys; Convex regenerates `convex/_generated/`. Because the dev deployment has no real `products`/`todos` rows that violate the new schema, the push succeeds. (If it complains about leftover demo rows, clear them in the dashboard Data tab, then re-run.)

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated
git rm convex/todos.ts
git commit -m "feat: factories Convex schema; drop scaffold demo tables"
```

---

## Group B — Convex functions

### Task 5: Authenticated factories CRUD

**Files:**
- Create: `convex/factories.ts`

- [ ] **Step 1: Write the CRUD module with an ownership guard**

`convex/factories.ts`:

```ts
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const itemRate = v.object({ item: v.string(), rate: v.number() });
const status = v.union(
	v.literal("planned"),
	v.literal("building"),
	v.literal("operational"),
	v.literal("paused"),
);
const production = v.union(
	v.object({ source: v.literal("plan"), plan: v.string() }),
	v.object({
		source: v.literal("manual"),
		inputs: v.array(itemRate),
		outputs: v.array(itemRate),
		machines: v.array(
			v.object({
				building: v.string(),
				count: v.number(),
				clock: v.optional(v.number()),
			}),
		),
	}),
);

/** Clerk subject for the caller, or throw if unauthenticated. */
async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity.subject;
}

/** Load a factory and assert the caller owns it. */
async function ownFactory(ctx: MutationCtx, id: Id<"factories">) {
	const userId = await requireUser(ctx);
	const factory = await ctx.db.get(id);
	if (!factory || factory.userId !== userId) {
		throw new Error("Factory not found");
	}
	return factory;
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUser(ctx);
		return await ctx.db
			.query("factories")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { id: v.id("factories") },
	handler: async (ctx, { id }) => {
		const userId = await requireUser(ctx);
		const factory = await ctx.db.get(id);
		if (!factory || factory.userId !== userId) return null;
		return factory;
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status,
		production,
	},
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const now = Date.now();
		return await ctx.db.insert("factories", {
			...args,
			userId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("factories"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.optional(status),
		production: v.optional(production),
		actuals: v.optional(v.array(itemRate)),
	},
	handler: async (ctx, { id, ...patch }) => {
		await ownFactory(ctx, id);
		const clean = Object.fromEntries(
			Object.entries(patch).filter(([, v]) => v !== undefined),
		);
		await ctx.db.patch(id, { ...clean, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("factories") },
	handler: async (ctx, { id }) => {
		await ownFactory(ctx, id);
		await ctx.db.delete(id);
	},
});
```

- [ ] **Step 2: Push functions to the deployment**

Run: `npx convex dev --once`
Expected: deploys; `convex/_generated/api.d.ts` now exposes `api.factories.{list,get,create,update,remove}`.

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add convex/factories.ts convex/_generated
git commit -m "feat: authenticated factories CRUD with ownership guard"
```

---

## Group C — Shared types + derive (pure, TDD)

### Task 6: Factory domain types + plan-snapshot codec

**Files:**
- Create: `src/features/factories/types.ts`
- Create: `src/features/factories/snapshot.ts`
- Test: `src/features/factories/snapshot.test.ts`

- [ ] **Step 1: Define domain types**

`src/features/factories/types.ts`:

```ts
import type { ProblemSpec, Solution } from "#/features/calculator/solver";

export type FactoryStatus =
	| "planned"
	| "building"
	| "operational"
	| "paused";

export interface ItemRate {
	item: string;
	rate: number;
}

export interface MachineCount {
	building: string;
	count: number;
	clock?: number;
}

/** Frozen calculator result attached to a factory. */
export interface PlanSnapshot {
	spec: ProblemSpec;
	solution: Solution;
}

export type Production =
	| { source: "plan"; plan: string } // JSON.stringify(PlanSnapshot)
	| {
			source: "manual";
			inputs: ItemRate[];
			outputs: ItemRate[];
			machines: MachineCount[];
	  };
```

- [ ] **Step 2: Write the failing snapshot round-trip test**

`src/features/factories/snapshot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decodeSnapshot, encodeSnapshot } from "./snapshot";
import type { PlanSnapshot } from "./types";

const snap: PlanSnapshot = {
	spec: { targets: [{ item: "iron-plate", rate: 60 }], allowedAlternates: [] },
	solution: {
		status: "optimal",
		recipes: [{ recipe: "recipe-ironplate-c", machines: 3, building: "constructor" }],
		outputs: [{ item: "iron-plate", rate: 60 }],
		rawInputs: [{ item: "iron-ore", rate: 90 }],
		providedInputs: [],
		byproducts: [],
		flows: [],
		power: 24,
		buildCost: [],
	},
};

describe("plan snapshot codec", () => {
	it("round-trips a snapshot through a JSON string", () => {
		const decoded = decodeSnapshot(encodeSnapshot(snap));
		expect(decoded).toEqual(snap);
	});

	it("returns undefined for malformed JSON", () => {
		expect(decodeSnapshot("not json")).toBeUndefined();
	});

	it("returns undefined when the shape is wrong", () => {
		expect(decodeSnapshot(JSON.stringify({ spec: 1 }))).toBeUndefined();
	});
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/features/factories/snapshot.test.ts`
Expected: FAIL ("Cannot find module './snapshot'").

- [ ] **Step 4: Implement the codec**

`src/features/factories/snapshot.ts`:

```ts
import type { PlanSnapshot } from "./types";

export function encodeSnapshot(snapshot: PlanSnapshot): string {
	return JSON.stringify(snapshot);
}

export function decodeSnapshot(plan: string): PlanSnapshot | undefined {
	try {
		const parsed = JSON.parse(plan);
		if (
			!parsed ||
			typeof parsed !== "object" ||
			!parsed.spec ||
			!Array.isArray(parsed.spec.targets) ||
			!parsed.solution ||
			!Array.isArray(parsed.solution.recipes)
		) {
			return undefined;
		}
		return parsed as PlanSnapshot;
	} catch {
		return undefined;
	}
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/features/factories/snapshot.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/factories/types.ts src/features/factories/snapshot.ts src/features/factories/snapshot.test.ts
git commit -m "feat: factory domain types + plan-snapshot codec"
```

### Task 7: Derive efficiency, cost and power

**Files:**
- Create: `src/features/factories/derive.ts`
- Test: `src/features/factories/derive.test.ts`

- [ ] **Step 1: Write the failing efficiency test**

`src/features/factories/derive.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { efficiency } from "./derive";

describe("efficiency", () => {
	it("is the actual/planned ratio per output", () => {
		const result = efficiency(
			[{ item: "iron-plate", rate: 60 }],
			[{ item: "iron-plate", rate: 45 }],
		);
		expect(result.perItem).toEqual([
			{ item: "iron-plate", planned: 60, actual: 45, ratio: 0.75 },
		]);
		expect(result.aggregate).toBeCloseTo(0.75, 5);
	});

	it("treats a missing actual as zero output", () => {
		const result = efficiency([{ item: "iron-plate", rate: 60 }], []);
		expect(result.perItem[0].ratio).toBe(0);
		expect(result.aggregate).toBe(0);
	});

	it("averages ratios across multiple outputs", () => {
		const result = efficiency(
			[
				{ item: "iron-plate", rate: 60 },
				{ item: "screw", rate: 100 },
			],
			[
				{ item: "iron-plate", rate: 30 },
				{ item: "screw", rate: 100 },
			],
		);
		// (0.5 + 1.0) / 2
		expect(result.aggregate).toBeCloseTo(0.75, 5);
	});

	it("ignores planned outputs with zero rate", () => {
		const result = efficiency(
			[{ item: "iron-plate", rate: 0 }],
			[{ item: "iron-plate", rate: 10 }],
		);
		expect(result.perItem).toEqual([]);
		expect(result.aggregate).toBe(0);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/factories/derive.test.ts`
Expected: FAIL ("Cannot find module './derive'").

- [ ] **Step 3: Implement derive (efficiency + cost/power re-exports)**

`src/features/factories/derive.ts`:

```ts
import {
	buildCost as recipeBuildCost,
	totalPower as recipeTotalPower,
} from "#/features/calculator/solver/derive";
import type { RecipeUsage } from "#/features/calculator/solver";
import type { ItemRate, MachineCount } from "./types";

export interface OutputEfficiency {
	item: string;
	planned: number;
	actual: number;
	ratio: number;
}

export interface Efficiency {
	perItem: OutputEfficiency[];
	/** Mean of per-item ratios; 0 when there are no positive planned outputs. */
	aggregate: number;
}

export function efficiency(
	planned: ItemRate[],
	actuals: ItemRate[],
): Efficiency {
	const actualByItem = new Map(actuals.map((a) => [a.item, a.rate]));
	const perItem: OutputEfficiency[] = [];
	for (const p of planned) {
		if (p.rate <= 0) continue;
		const actual = actualByItem.get(p.item) ?? 0;
		perItem.push({
			item: p.item,
			planned: p.rate,
			actual,
			ratio: actual / p.rate,
		});
	}
	const aggregate =
		perItem.length === 0
			? 0
			: perItem.reduce((s, e) => s + e.ratio, 0) / perItem.length;
	return { perItem, aggregate };
}

/** Convert manual machine counts into RecipeUsage[] so we can reuse the
 *  calculator's cost/power math. `recipe` is unused by those functions. */
function asUsage(machines: MachineCount[]): RecipeUsage[] {
	return machines.map((m) => ({
		recipe: "",
		machines: m.count,
		building: m.building,
	}));
}

export function manualPower(machines: MachineCount[]): number {
	return recipeTotalPower(asUsage(machines));
}

export function manualBuildCost(machines: MachineCount[]) {
	return recipeBuildCost(asUsage(machines));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/factories/derive.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/factories/derive.ts src/features/factories/derive.test.ts
git commit -m "feat: factory efficiency + manual cost/power derivation"
```

---

## Group D — Factories list, manual entry

### Task 8: Factories list route with auth gating

**Files:**
- Delete: `src/routes/factories.tsx`
- Create: `src/routes/factories.index.tsx`
- Create: `src/features/factories/FactoriesPage.tsx`
- Create: `src/features/factories/SignInPrompt.tsx`

- [ ] **Step 1: Replace the placeholder route**

Run: `git rm src/routes/factories.tsx`

Create `src/routes/factories.index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import FactoriesPage from "#/features/factories/FactoriesPage";

export const Route = createFileRoute("/factories/")({
	component: FactoriesPage,
});
```

Note the `.index.tsx` naming + trailing-slash route id (`"/factories/"`) so the `$factoryId` detail route (Task 11) renders under the virtual `/factories` parent — same convention as the `/data` entity routes.

- [ ] **Step 2: Sign-in prompt for anonymous visitors**

`src/features/factories/SignInPrompt.tsx`:

```tsx
import { SignInButton } from "@clerk/clerk-react";
import { getFeature } from "#/config/features";

export default function SignInPrompt() {
	const feature = getFeature("factories");
	return (
		<div className="mx-auto max-w-md rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-8 text-center">
			<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
				Sign in to save factories
			</h2>
			<p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
				{feature.description}
			</p>
			<ul className="mt-4 space-y-1 text-left text-sm text-[var(--sea-ink-soft)]">
				{feature.planned.map((p) => (
					<li key={p}>• {p}</li>
				))}
			</ul>
			<div className="mt-6">
				<SignInButton mode="modal">
					<button
						type="button"
						className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]"
					>
						Sign in
					</button>
				</SignInButton>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Page shell with auth gating + list query**

`src/features/factories/FactoriesPage.tsx`:

```tsx
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";
import FactoryCard from "./FactoryCard";
import ManualFactoryForm from "./ManualFactoryForm";
import SignInPrompt from "./SignInPrompt";

function FactoriesList() {
	const factories = useQuery(api.factories.list);
	const [creating, setCreating] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Factories</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)]"
				>
					New factory
				</button>
			</div>
			{creating && <ManualFactoryForm onClose={() => setCreating(false)} />}
			{factories === undefined ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
			) : factories.length === 0 ? (
				<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
					No factories yet. Create one here or from a calculator plan.
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{factories.map((f) => (
						<FactoryCard key={f._id} factory={f} />
					))}
				</div>
			)}
		</div>
	);
}

export default function FactoriesPage() {
	return (
		<main className="page-wrap px-4 py-8">
			<AuthLoading>
				<p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
			</AuthLoading>
			<Unauthenticated>
				<SignInPrompt />
			</Unauthenticated>
			<Authenticated>
				<FactoriesList />
			</Authenticated>
		</main>
	);
}
```

`#convex/*` resolves to `./convex/*` — if that import alias is not yet configured, add `"#convex/*": "./convex/*"` to the `imports` map in `package.json` and the matching `paths` entry in `tsconfig.json` as part of this step, then re-run typecheck.

- [ ] **Step 4: Verify the route renders (anon)**

Run: `npm run dev`, open `/factories` while signed out.
Expected: the SignInPrompt card renders (no crash). `FactoryCard`/`ManualFactoryForm` imports will fail typecheck until Tasks 9–10 — implement them next, then typecheck the group together.

- [ ] **Step 5: Commit**

```bash
git add src/routes/factories.index.tsx src/features/factories/FactoriesPage.tsx src/features/factories/SignInPrompt.tsx package.json tsconfig.json
git rm src/routes/factories.tsx
git commit -m "feat: factories list route with auth gating + sign-in prompt"
```

### Task 9: Factory card

**Files:**
- Create: `src/features/factories/FactoryCard.tsx`
- Create: `src/features/factories/factory-view.ts`
- Test: `src/features/factories/factory-view.test.ts`

- [ ] **Step 1: Write the failing test for the view helper**

`src/features/factories/factory-view.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { plannedOutputs } from "./factory-view";

describe("plannedOutputs", () => {
	it("reads outputs from a manual production", () => {
		const out = plannedOutputs({
			source: "manual",
			inputs: [],
			outputs: [{ item: "iron-plate", rate: 60 }],
			machines: [],
		});
		expect(out).toEqual([{ item: "iron-plate", rate: 60 }]);
	});

	it("reads outputs from a plan snapshot's solution", () => {
		const plan = JSON.stringify({
			spec: { targets: [{ item: "screw", rate: 100 }], allowedAlternates: [] },
			solution: {
				status: "optimal",
				recipes: [],
				outputs: [{ item: "screw", rate: 100 }],
				rawInputs: [],
				providedInputs: [],
				byproducts: [],
				flows: [],
				power: 0,
				buildCost: [],
			},
		});
		expect(plannedOutputs({ source: "plan", plan })).toEqual([
			{ item: "screw", rate: 100 },
		]);
	});

	it("returns [] for an unparseable plan", () => {
		expect(plannedOutputs({ source: "plan", plan: "broken" })).toEqual([]);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/factories/factory-view.test.ts`
Expected: FAIL ("Cannot find module './factory-view'").

- [ ] **Step 3: Implement the view helper**

`src/features/factories/factory-view.ts`:

```ts
import { decodeSnapshot } from "./snapshot";
import type { ItemRate, Production } from "./types";

/** The factory's planned outputs, regardless of production source. */
export function plannedOutputs(production: Production): ItemRate[] {
	if (production.source === "manual") return production.outputs;
	const snapshot = decodeSnapshot(production.plan);
	return snapshot?.solution.outputs ?? [];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/factories/factory-view.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Implement the card component**

`src/features/factories/FactoryCard.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import { formatNumber } from "#/lib/format";
import type { Doc } from "#convex/_generated/dataModel";
import { efficiency } from "./derive";
import { plannedOutputs } from "./factory-view";

const STATUS_LABEL: Record<Doc<"factories">["status"], string> = {
	planned: "Planned",
	building: "Building",
	operational: "Operational",
	paused: "Paused",
};

export default function FactoryCard({ factory }: { factory: Doc<"factories"> }) {
	const outputs = plannedOutputs(factory.production);
	const eff = factory.actuals
		? efficiency(outputs, factory.actuals)
		: undefined;
	return (
		<Link
			to="/factories/$factoryId"
			params={{ factoryId: factory._id }}
			className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 hover:border-[var(--sea-ink)]"
		>
			<div className="flex items-center justify-between">
				<span className="font-semibold text-[var(--sea-ink)]">
					{factory.name}
				</span>
				<span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--sea-ink-soft)]">
					{STATUS_LABEL[factory.status]}
				</span>
			</div>
			<div className="flex flex-col gap-1">
				{outputs.slice(0, 3).map((o) => {
					const item = getItem(o.item);
					return (
						<div key={o.item} className="flex items-center gap-2 text-sm">
							<EntityIcon icon={item?.icon} name={item?.name ?? o.item} size={20} />
							<span className="flex-1 text-[var(--sea-ink)]">
								{item?.name ?? o.item}
							</span>
							<span className="text-[var(--sea-ink-soft)]">
								{formatNumber(o.rate)}/min
							</span>
						</div>
					);
				})}
			</div>
			{eff && (
				<span className="text-xs text-[var(--sea-ink-soft)]">
					Efficiency {Math.round(eff.aggregate * 100)}%
				</span>
			)}
		</Link>
	);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/factories/FactoryCard.tsx src/features/factories/factory-view.ts src/features/factories/factory-view.test.ts
git commit -m "feat: factory card + planned-outputs view helper"
```

### Task 10: Manual factory form

**Files:**
- Create: `src/features/factories/ManualFactoryForm.tsx`
- Create: `src/features/factories/ItemRateEditor.tsx`

- [ ] **Step 1: Reusable item-rate list editor**

`src/features/factories/ItemRateEditor.tsx`:

```tsx
import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import ItemPicker from "#/features/calculator/ItemPicker";
import type { ItemRate } from "./types";

export default function ItemRateEditor({
	label,
	rows,
	onChange,
}: {
	label: string;
	rows: ItemRate[];
	onChange: (rows: ItemRate[]) => void;
}) {
	const add = (item: string) => onChange([...rows, { item, rate: 60 }]);
	const setRate = (item: string, rate: number) =>
		onChange(rows.map((r) => (r.item === item ? { ...r, rate } : r)));
	const remove = (item: string) =>
		onChange(rows.filter((r) => r.item !== item));

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				{label}
			</h3>
			{rows.map((r) => {
				const item = getItem(r.item);
				return (
					<div key={r.item} className="flex items-center gap-2">
						<EntityIcon icon={item?.icon} name={item?.name ?? r.item} size={24} />
						<span className="flex-1 text-sm text-[var(--sea-ink)]">
							{item?.name ?? r.item}
						</span>
						<input
							type="number"
							min={0}
							value={r.rate}
							onChange={(e) => setRate(r.item, Number(e.target.value))}
							aria-label={`${item?.name ?? r.item} per minute`}
							className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
						/>
						<button
							type="button"
							onClick={() => remove(r.item)}
							aria-label={`Remove ${item?.name ?? r.item}`}
							className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							×
						</button>
					</div>
				);
			})}
			<ItemPicker
				placeholder={`Add to ${label.toLowerCase()}…`}
				exclude={rows.map((r) => r.item)}
				onPick={add}
			/>
		</div>
	);
}
```

- [ ] **Step 2: The form (create mutation)**

`src/features/factories/ManualFactoryForm.tsx`:

```tsx
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "#convex/_generated/api";
import ItemRateEditor from "./ItemRateEditor";
import type { FactoryStatus, ItemRate } from "./types";

const STATUSES: FactoryStatus[] = [
	"planned",
	"building",
	"operational",
	"paused",
];

export default function ManualFactoryForm({
	onClose,
}: {
	onClose: () => void;
}) {
	const create = useMutation(api.factories.create);
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [status, setStatus] = useState<FactoryStatus>("planned");
	const [inputs, setInputs] = useState<ItemRate[]>([]);
	const [outputs, setOutputs] = useState<ItemRate[]>([]);
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			const id = await create({
				name: name.trim(),
				status,
				production: { source: "manual", inputs, outputs, machines: [] },
			});
			navigate({ to: "/factories/$factoryId", params: { factoryId: id } });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Factory name"
				aria-label="Factory name"
				className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
			/>
			<select
				value={status}
				onChange={(e) => setStatus(e.target.value as FactoryStatus)}
				aria-label="Status"
				className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm capitalize"
			>
				{STATUSES.map((s) => (
					<option key={s} value={s}>
						{s}
					</option>
				))}
			</select>
			<ItemRateEditor label="Outputs" rows={outputs} onChange={setOutputs} />
			<ItemRateEditor label="Inputs" rows={inputs} onChange={setInputs} />
			<div className="flex gap-2">
				<button
					type="button"
					onClick={submit}
					disabled={saving || !name.trim()}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					Save factory
				</button>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)]"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Verify group typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0 (Tasks 8–10 now resolve each other's imports).

- [ ] **Step 4: Manual verification on the deployment**

Run: `npm run dev`, sign in, click "New factory", add an output, save.
Expected: a factory is created and you land on its (Task 11) detail route; it appears in the grid on return.

- [ ] **Step 5: Commit**

```bash
git add src/features/factories/ManualFactoryForm.tsx src/features/factories/ItemRateEditor.tsx
git commit -m "feat: manual factory creation form"
```

---

## Group E — Detail, calculator wiring, finalize

### Task 11: Factory detail route with tabs

**Files:**
- Create: `src/routes/factories.$factoryId.tsx`
- Create: `src/features/factories/FactoryDetail.tsx`

- [ ] **Step 1: Detail route**

`src/routes/factories.$factoryId.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import FactoryDetail from "#/features/factories/FactoryDetail";

export const Route = createFileRoute("/factories/$factoryId")({
	component: FactoryDetail,
});
```

- [ ] **Step 2: Detail component with tabs + inline edit**

`src/features/factories/FactoryDetail.tsx`:

```tsx
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { getItem } from "#/data";
import { formatNumber, formatPower } from "#/lib/format";
import ResultTabs from "#/features/calculator/ResultTabs";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { manualBuildCost, manualPower, efficiency } from "./derive";
import { plannedOutputs } from "./factory-view";
import { decodeSnapshot } from "./snapshot";
import type { ItemRate } from "./types";

const TABS = ["Overview", "Plan", "Build cost", "Notes"] as const;
type Tab = (typeof TABS)[number];

export default function FactoryDetail() {
	const { factoryId } = useParams({ from: "/factories/$factoryId" });
	const factory = useQuery(api.factories.get, {
		id: factoryId as Id<"factories">,
	});
	const update = useMutation(api.factories.update);
	const remove = useMutation(api.factories.remove);
	const [tab, setTab] = useState<Tab>("Overview");

	if (factory === undefined) {
		return <main className="page-wrap px-4 py-8 text-sm">Loading…</main>;
	}
	if (factory === null) {
		return (
			<main className="page-wrap px-4 py-8">
				<p className="text-sm text-[var(--sea-ink-soft)]">
					Factory not found.{" "}
					<Link to="/factories" className="underline">
						Back to factories
					</Link>
				</p>
			</main>
		);
	}

	const outputs = plannedOutputs(factory.production);
	const snapshot =
		factory.production.source === "plan"
			? decodeSnapshot(factory.production.plan)
			: undefined;
	const machines =
		factory.production.source === "manual"
			? factory.production.machines
			: (snapshot?.solution.recipes ?? []).map((r) => ({
					building: r.building,
					count: r.machines,
				}));
	const eff = factory.actuals
		? efficiency(outputs, factory.actuals)
		: undefined;

	const setActual = (item: string, rate: number) => {
		const next: ItemRate[] = [...(factory.actuals ?? [])];
		const i = next.findIndex((a) => a.item === item);
		if (i >= 0) next[i] = { item, rate };
		else next.push({ item, rate });
		update({ id: factory._id, actuals: next });
	};

	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<div className="flex items-center justify-between">
				<input
					value={factory.name}
					onChange={(e) => update({ id: factory._id, name: e.target.value })}
					aria-label="Factory name"
					className="bg-transparent text-2xl font-bold text-[var(--sea-ink)] outline-none"
				/>
				<button
					type="button"
					onClick={async () => {
						await remove({ id: factory._id });
						window.location.href = "/factories";
					}}
					className="text-sm text-[var(--sea-ink-soft)] hover:text-red-500"
				>
					Delete
				</button>
			</div>

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

			{tab === "Overview" && (
				<div className="flex flex-col gap-3">
					{eff && (
						<p className="text-sm font-semibold text-[var(--sea-ink)]">
							Overall efficiency {Math.round(eff.aggregate * 100)}%
						</p>
					)}
					{outputs.map((o) => {
						const item = getItem(o.item);
						const actual =
							factory.actuals?.find((a) => a.item === o.item)?.rate ?? "";
						return (
							<div key={o.item} className="flex items-center gap-3 text-sm">
								<span className="flex-1 text-[var(--sea-ink)]">
									{item?.name ?? o.item}
								</span>
								<span className="text-[var(--sea-ink-soft)]">
									planned {formatNumber(o.rate)}/min
								</span>
								<input
									type="number"
									min={0}
									value={actual}
									placeholder="actual"
									aria-label={`${item?.name ?? o.item} actual per minute`}
									onChange={(e) => setActual(o.item, Number(e.target.value))}
									className="w-24 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right"
								/>
							</div>
						);
					})}
				</div>
			)}

			{tab === "Plan" &&
				(snapshot ? (
					<ResultTabs solution={snapshot.solution} />
				) : (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						This factory was entered manually — no calculator plan attached.
					</p>
				))}

			{tab === "Build cost" && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold">
						Power {formatPower(manualPower(machines))}
					</p>
					{manualBuildCost(machines).map((c) => {
						const item = getItem(c.item);
						return (
							<div key={c.item} className="flex items-center gap-3 text-sm">
								<span className="flex-1">{item?.name ?? c.item}</span>
								<span className="font-semibold">{formatNumber(c.rate)}</span>
							</div>
						);
					})}
				</div>
			)}

			{tab === "Notes" && (
				<textarea
					value={factory.notes ?? ""}
					onChange={(e) => update({ id: factory._id, notes: e.target.value })}
					placeholder="Notes…"
					aria-label="Notes"
					className="min-h-32 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] p-3 text-sm"
				/>
			)}
		</main>
	);
}
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open a factory, switch tabs, type an actual rate.
Expected: efficiency updates live; notes persist on reload; Delete returns to the grid.

- [ ] **Step 5: Commit**

```bash
git add src/routes/factories.$factoryId.tsx src/features/factories/FactoryDetail.tsx
git commit -m "feat: factory detail route with overview/plan/cost/notes tabs"
```

### Task 12: Save as factory from the calculator

**Files:**
- Create: `src/features/factories/SaveAsFactoryButton.tsx`
- Modify: `src/features/calculator/CalculatorPage.tsx`

- [ ] **Step 1: Save button (authed create from snapshot)**

`src/features/factories/SaveAsFactoryButton.tsx`:

```tsx
import { SignInButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ProblemSpec, Solution } from "#/features/calculator/solver";
import { api } from "#convex/_generated/api";
import { encodeSnapshot } from "./snapshot";

function SaveButton({
	spec,
	solution,
}: {
	spec: ProblemSpec;
	solution: Solution;
}) {
	const create = useMutation(api.factories.create);
	const navigate = useNavigate();
	const [saving, setSaving] = useState(false);

	const save = async () => {
		setSaving(true);
		try {
			const name = spec.targets[0]?.item ?? "New factory";
			const id = await create({
				name,
				status: "planned",
				production: { source: "plan", plan: encodeSnapshot({ spec, solution }) },
			});
			navigate({ to: "/factories/$factoryId", params: { factoryId: id } });
		} finally {
			setSaving(false);
		}
	};

	return (
		<button
			type="button"
			onClick={save}
			disabled={saving}
			className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink)] disabled:opacity-50"
		>
			Save as factory
		</button>
	);
}

export default function SaveAsFactoryButton(props: {
	spec: ProblemSpec;
	solution: Solution;
}) {
	return (
		<>
			<Authenticated>
				<SaveButton {...props} />
			</Authenticated>
			<Unauthenticated>
				<SignInButton mode="modal">
					<button
						type="button"
						className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)]"
					>
						Sign in to save as factory
					</button>
				</SignInButton>
			</Unauthenticated>
		</>
	);
}
```

- [ ] **Step 2: Render the button when a solution exists**

In `src/features/calculator/CalculatorPage.tsx`, import the button:

```tsx
import SaveAsFactoryButton from "#/features/factories/SaveAsFactoryButton";
```

Then in the results area, replace the `solution ? (<ResultTabs solution={solution} />) : null` branch with:

```tsx
				) : solution ? (
					<div className="flex flex-col gap-4">
						<div className="flex justify-end">
							<SaveAsFactoryButton spec={spec} solution={solution} />
						</div>
						<ResultTabs solution={solution} />
					</div>
				) : null}
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, solve a plan, click "Save as factory" (signed in).
Expected: a plan-source factory is created; its detail Plan tab shows the embedded `ResultTabs`.

- [ ] **Step 5: Commit**

```bash
git add src/features/factories/SaveAsFactoryButton.tsx src/features/calculator/CalculatorPage.tsx
git commit -m "feat: save a calculator plan as a factory"
```

### Task 13: Flip registry to beta + final verification

**Files:**
- Modify: `src/config/features.ts`

- [ ] **Step 1: Mark factories beta**

In `src/config/features.ts`, change the `factories` feature `status: "planned"` to `status: "beta"`.

- [ ] **Step 2: Run the full gate**

Run: `npx biome check . && npm run typecheck && npm test && npm run build`
Expected: all green; the new pure tests (snapshot, derive, factory-view) pass.

- [ ] **Step 3: End-to-end manual pass on the deployment**

Signed in: solve a plan → "Save as factory" → see it in the grid → open detail → enter an actual rate → efficiency shows → edit notes → reload (persists) → Delete (returns to grid). Create a manual factory the same way. Sign out → `/factories` shows the prompt.

- [ ] **Step 4: Commit**

```bash
git add src/config/features.ts
git commit -m "chore: mark factories feature beta"
```

---

## Self-review notes (coverage vs spec)

- §1 Auth integration → Tasks 1–3. §2 schema + functions → Tasks 4–5. §3 derive → Task 7 (+ snapshot codec Task 6). §4 pages/routing → Tasks 8, 9, 11. §5 save as factory → Task 12. §6 manual entry → Task 10. §7 error handling (unknown slugs fall back to raw slug via `getItem(...)?.name ?? slug`; not-found detail state; optimistic Convex mutations) → Tasks 9/11; registry flip → Task 13. §8 testing → pure Vitest in Tasks 6, 7, 9; manual deployment verification noted per UI/function task.
- Type consistency: `Production`, `ItemRate`, `MachineCount`, `PlanSnapshot` defined in Task 6 and used unchanged in Tasks 7, 9, 11, 12. `efficiency`/`manualPower`/`manualBuildCost` signatures from Task 7 match their call sites. `plannedOutputs` from Task 9 used in Tasks 9 and 11.
- The `#convex/*` import alias is introduced in Task 8 Step 3 (package.json `imports` + tsconfig `paths`) and used by every Convex-touching component thereafter.
