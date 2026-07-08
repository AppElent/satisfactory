# Phase 6 — Logistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect saved factories into a logistics network — compute surplus/needs, visualise it as a react-flow graph, create transport links with belt/pipe throughput math, and show cross-factory totals.

**Architecture:** Pure modules (`throughput.ts`, `logistics.ts`) compute belt/pipe sizing and per-factory surplus/needs from plain factory/transport records. A `transports` Convex table with ownership-checked CRUD stores links. A lazy client-only react-flow graph plus a link form and a summary card make up the auth-gated `/logistics` page; the summary card also embeds on `/factories`.

**Tech Stack:** Convex, `@xyflow/react` + elkjs (already installed), TanStack Start/Router, React 19, Zod 4, Vitest 4 + testing-library, Biome.

**Spec:** [docs/superpowers/specs/2026-06-15-phase6-logistics-design.md](../specs/2026-06-15-phase6-logistics-design.md)

**Conventions for every task:**
- Biome: TABS, double quotes. Run `npx biome check --write <files>` before committing.
- Commit messages end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Pure-logic tasks are TDD. Convex/UI tasks verify via typecheck + build + manual notes.
- Group gate: `npx biome check . && npm run typecheck && npm test && npm run build`.

---

## Group A — Pure logic + Convex

### Task 1: `plannedInputs` helper

**Files:**
- Modify: `src/features/factories/factory-view.ts`
- Test: `src/features/factories/factory-view.test.ts` (extend existing)

- [ ] **Step 1: Add failing tests for `plannedInputs`**

Append to `src/features/factories/factory-view.test.ts` (inside the file, new `describe`):

```ts
import { plannedInputs } from "./factory-view";

describe("plannedInputs", () => {
	it("reads inputs from a manual production", () => {
		expect(
			plannedInputs({
				source: "manual",
				inputs: [{ item: "iron-ore", rate: 30 }],
				outputs: [],
				machines: [],
			}),
		).toEqual([{ item: "iron-ore", rate: 30 }]);
	});

	it("reads raw + provided inputs from a plan snapshot", () => {
		const plan = JSON.stringify({
			spec: { targets: [{ item: "iron-plate", rate: 60 }], allowedAlternates: [] },
			solution: {
				status: "optimal",
				recipes: [],
				outputs: [{ item: "iron-plate", rate: 60 }],
				rawInputs: [{ item: "iron-ore", rate: 90 }],
				providedInputs: [{ item: "screw", rate: 40 }],
				byproducts: [],
				flows: [],
				power: 0,
				buildCost: [],
			},
		});
		expect(plannedInputs({ source: "plan", plan })).toEqual([
			{ item: "iron-ore", rate: 90 },
			{ item: "screw", rate: 40 },
		]);
	});

	it("returns [] for an unparseable plan", () => {
		expect(plannedInputs({ source: "plan", plan: "broken" })).toEqual([]);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/factories/factory-view.test.ts`
Expected: FAIL ("plannedInputs is not a function" / import error).

- [ ] **Step 3: Implement `plannedInputs`**

Append to `src/features/factories/factory-view.ts`:

```ts
/** The factory's planned inputs (consumed from outside), regardless of source. */
export function plannedInputs(production: Production): ItemRate[] {
	if (production.source === "manual") return production.inputs;
	const snapshot = decodeSnapshot(production.plan);
	if (!snapshot) return [];
	return [...snapshot.solution.rawInputs, ...snapshot.solution.providedInputs];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/factories/factory-view.test.ts`
Expected: PASS (existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/features/factories/factory-view.ts src/features/factories/factory-view.test.ts
git commit -m "feat: plannedInputs helper for factory production"
```

### Task 2: Belt/pipe throughput math (TDD)

**Files:**
- Create: `src/features/logistics/throughput.ts`
- Test: `src/features/logistics/throughput.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/logistics/throughput.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { beltFor, pipeFor } from "./throughput";

describe("beltFor", () => {
	it("picks the smallest single tier that carries the rate", () => {
		expect(beltFor(60)).toEqual({ tier: 1, count: 1 });
		expect(beltFor(61)).toEqual({ tier: 2, count: 1 });
		expect(beltFor(1200)).toEqual({ tier: 6, count: 1 });
	});

	it("uses multiple Mk6 belts above max single-belt capacity", () => {
		expect(beltFor(1300)).toEqual({ tier: 6, count: 2 });
		expect(beltFor(2400)).toEqual({ tier: 6, count: 2 });
	});

	it("returns zero belts for a non-positive rate", () => {
		expect(beltFor(0)).toEqual({ tier: 1, count: 0 });
	});
});

describe("pipeFor", () => {
	it("picks the smallest pipe tier", () => {
		expect(pipeFor(300)).toEqual({ tier: 1, count: 1 });
		expect(pipeFor(301)).toEqual({ tier: 2, count: 1 });
	});

	it("uses multiple Mk2 pipes above 600", () => {
		expect(pipeFor(601)).toEqual({ tier: 2, count: 2 });
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/logistics/throughput.test.ts`
Expected: FAIL ("Cannot find module './throughput'").

- [ ] **Step 3: Implement**

`src/features/logistics/throughput.ts`:

```ts
export interface Throughput {
	/** 1-based tier index (belts Mk1-6, pipes Mk1-2). */
	tier: number;
	count: number;
}

const BELT_TIERS = [60, 120, 270, 480, 780, 1200];
const PIPE_TIERS = [300, 600];

function pick(tiers: number[], rate: number): Throughput {
	if (rate <= 0) return { tier: 1, count: 0 };
	const max = tiers[tiers.length - 1];
	if (rate <= max) {
		const idx = tiers.findIndex((t) => t >= rate);
		return { tier: idx + 1, count: 1 };
	}
	return { tier: tiers.length, count: Math.ceil(rate / max) };
}

/** Belt sizing for a solid-item rate (items/min). */
export function beltFor(rate: number): Throughput {
	return pick(BELT_TIERS, rate);
}

/** Pipe sizing for a fluid rate (m³/min). */
export function pipeFor(rate: number): Throughput {
	return pick(PIPE_TIERS, rate);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/logistics/throughput.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/logistics/throughput.ts src/features/logistics/throughput.test.ts
git commit -m "feat: belt/pipe throughput sizing"
```

### Task 3: Network surplus/need computation (TDD)

**Files:**
- Create: `src/features/logistics/logistics.ts`
- Test: `src/features/logistics/logistics.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/logistics/logistics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeNetwork, suggestSources } from "./logistics";
import type { FactoryLike, TransportLike } from "./logistics";

const a: FactoryLike = {
	_id: "a",
	production: {
		source: "manual",
		inputs: [],
		outputs: [{ item: "iron-plate", rate: 60 }],
		machines: [],
	},
};
const b: FactoryLike = {
	_id: "b",
	production: {
		source: "manual",
		inputs: [{ item: "iron-plate", rate: 40 }],
		outputs: [],
		machines: [],
	},
};

describe("computeNetwork", () => {
	it("reports raw surplus and need with no transports", () => {
		const net = computeNetwork([a, b], []);
		expect(net.byFactory.get("a")?.surplus).toEqual([
			{ item: "iron-plate", rate: 60 },
		]);
		expect(net.byFactory.get("b")?.needs).toEqual([
			{ item: "iron-plate", rate: 40 },
		]);
	});

	it("subtracts a transport from both surplus and need", () => {
		const t: TransportLike = {
			fromFactoryId: "a",
			toFactoryId: "b",
			item: "iron-plate",
			rate: 40,
		};
		const net = computeNetwork([a, b], [t]);
		expect(net.byFactory.get("a")?.surplus).toEqual([
			{ item: "iron-plate", rate: 20 },
		]);
		expect(net.byFactory.get("b")?.needs).toEqual([]);
	});

	it("gives net per-item totals across the network", () => {
		const net = computeNetwork([a, b], []);
		expect(net.totals).toEqual([{ item: "iron-plate", rate: 20 }]);
	});
});

describe("suggestSources", () => {
	it("lists factories with surplus of the item, highest first", () => {
		const c: FactoryLike = {
			_id: "c",
			production: {
				source: "manual",
				inputs: [],
				outputs: [{ item: "iron-plate", rate: 100 }],
				machines: [],
			},
		};
		const out = suggestSources("iron-plate", [a, c], []);
		expect(out).toEqual([
			{ factoryId: "c", rate: 100 },
			{ factoryId: "a", rate: 60 },
		]);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/logistics/logistics.test.ts`
Expected: FAIL ("Cannot find module './logistics'").

- [ ] **Step 3: Implement**

`src/features/logistics/logistics.ts`:

```ts
import {
	plannedInputs,
	plannedOutputs,
} from "#/features/factories/factory-view";
import type { ItemRate, Production } from "#/features/factories/types";

/** Minimal factory shape this module needs (Convex Doc<"factories"> satisfies it). */
export interface FactoryLike {
	_id: string;
	production: Production;
}

/** Minimal transport shape (Convex Doc<"transports"> satisfies it). */
export interface TransportLike {
	fromFactoryId: string;
	toFactoryId: string;
	item: string;
	rate: number;
}

export interface FactoryBalance {
	surplus: ItemRate[];
	needs: ItemRate[];
}

export interface Network {
	byFactory: Map<string, FactoryBalance>;
	/** Net production − consumption per item across all factories. */
	totals: ItemRate[];
}

function toMap(rates: ItemRate[]): Map<string, number> {
	const m = new Map<string, number>();
	for (const r of rates) m.set(r.item, (m.get(r.item) ?? 0) + r.rate);
	return m;
}

function positive(m: Map<string, number>): ItemRate[] {
	return [...m]
		.filter(([, rate]) => rate > 1e-9)
		.map(([item, rate]) => ({ item, rate }));
}

export function computeNetwork(
	factories: FactoryLike[],
	transports: TransportLike[],
): Network {
	const byFactory = new Map<string, FactoryBalance>();
	const totals = new Map<string, number>();

	for (const f of factories) {
		const outputs = toMap(plannedOutputs(f.production));
		const inputs = toMap(plannedInputs(f.production));
		for (const [item, rate] of outputs)
			totals.set(item, (totals.get(item) ?? 0) + rate);
		for (const [item, rate] of inputs)
			totals.set(item, (totals.get(item) ?? 0) - rate);

		for (const t of transports) {
			if (t.fromFactoryId === f._id)
				outputs.set(t.item, (outputs.get(t.item) ?? 0) - t.rate);
			if (t.toFactoryId === f._id)
				inputs.set(t.item, (inputs.get(t.item) ?? 0) - t.rate);
		}
		byFactory.set(f._id, { surplus: positive(outputs), needs: positive(inputs) });
	}

	return {
		byFactory,
		totals: [...totals]
			.filter(([, rate]) => Math.abs(rate) > 1e-9)
			.map(([item, rate]) => ({ item, rate })),
	};
}

export function suggestSources(
	item: string,
	factories: FactoryLike[],
	transports: TransportLike[],
): { factoryId: string; rate: number }[] {
	const net = computeNetwork(factories, transports);
	const out: { factoryId: string; rate: number }[] = [];
	for (const [factoryId, balance] of net.byFactory) {
		const s = balance.surplus.find((r) => r.item === item);
		if (s) out.push({ factoryId, rate: s.rate });
	}
	return out.sort((p, q) => q.rate - p.rate);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/logistics/logistics.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/logistics/logistics.ts src/features/logistics/logistics.test.ts
git commit -m "feat: network surplus/need computation + source suggestions"
```

### Task 4: `transports` schema + Convex CRUD

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/transports.ts`

- [ ] **Step 1: Add the table to the schema**

In `convex/schema.ts`, inside `defineSchema({ ... })` (after the `factories` table), add:

```ts
	transports: defineTable({
		userId: v.string(),
		fromFactoryId: v.id("factories"),
		toFactoryId: v.id("factories"),
		item: v.string(),
		rate: v.number(),
		mode: v.union(
			v.literal("belt"),
			v.literal("pipe"),
			v.literal("truck"),
			v.literal("train"),
			v.literal("drone"),
		),
		note: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),
```

- [ ] **Step 2: Create the CRUD module**

`convex/transports.ts`:

```ts
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const mode = v.union(
	v.literal("belt"),
	v.literal("pipe"),
	v.literal("truck"),
	v.literal("train"),
	v.literal("drone"),
);

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity.subject;
}

async function ownTransport(ctx: MutationCtx, id: Id<"transports">) {
	const userId = await requireUser(ctx);
	const transport = await ctx.db.get(id);
	if (!transport || transport.userId !== userId) {
		throw new Error("Transport not found");
	}
	return transport;
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUser(ctx);
		return await ctx.db
			.query("transports")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const create = mutation({
	args: {
		fromFactoryId: v.id("factories"),
		toFactoryId: v.id("factories"),
		item: v.string(),
		rate: v.number(),
		mode,
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const from = await ctx.db.get(args.fromFactoryId);
		const to = await ctx.db.get(args.toFactoryId);
		if (!from || from.userId !== userId || !to || to.userId !== userId) {
			throw new Error("Factory not found");
		}
		const now = Date.now();
		return await ctx.db.insert("transports", {
			...args,
			userId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("transports"),
		item: v.optional(v.string()),
		rate: v.optional(v.number()),
		mode: v.optional(mode),
		note: v.optional(v.string()),
	},
	handler: async (ctx, { id, ...patch }) => {
		await ownTransport(ctx, id);
		const clean = Object.fromEntries(
			Object.entries(patch).filter(([, value]) => value !== undefined),
		);
		await ctx.db.patch(id, { ...clean, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("transports") },
	handler: async (ctx, { id }) => {
		await ownTransport(ctx, id);
		await ctx.db.delete(id);
	},
});
```

- [ ] **Step 3: Deploy + typecheck**

Run: `npx convex dev --once`
Expected: deploys; `convex/_generated` exposes `api.transports.{list,create,update,remove}`.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/transports.ts convex/_generated
git commit -m "feat: transports table + authenticated CRUD"
```

---

## Group B — UI

### Task 5: Network graph (lazy, client-only)

**Files:**
- Create: `src/features/logistics/NetworkGraph.tsx`

- [ ] **Step 1: Create the graph**

`src/features/logistics/NetworkGraph.tsx` (mirrors `src/features/calculator/ProductionGraph.tsx`):

```tsx
import { Background, type Edge, type Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate } from "@tanstack/react-router";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import { getItem } from "#/data";
import { formatNumber } from "#/lib/format";
import type { Doc } from "#convex/_generated/dataModel";
import { computeNetwork } from "./logistics";

const elk = new ELK();
const NODE_W = 200;
const NODE_H = 60;

export default function NetworkGraph({
	factories,
	transports,
}: {
	factories: Doc<"factories">[];
	transports: Doc<"transports">[];
}) {
	const navigate = useNavigate();
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	useEffect(() => {
		const net = computeNetwork(factories, transports);
		const elkGraph = {
			id: "root",
			layoutOptions: {
				"elk.algorithm": "layered",
				"elk.direction": "RIGHT",
				"elk.layered.spacing.nodeNodeBetweenLayers": "90",
				"elk.spacing.nodeNode": "40",
			},
			children: factories.map((f) => ({ id: f._id, width: NODE_W, height: NODE_H })),
			edges: transports.map((t) => ({
				id: t._id,
				sources: [t.fromFactoryId],
				targets: [t.toFactoryId],
			})),
		};
		let cancelled = false;
		elk.layout(elkGraph).then((laid) => {
			if (cancelled) return;
			const pos = new Map(
				(laid.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]),
			);
			setNodes(
				factories.map((f) => {
					const bal = net.byFactory.get(f._id);
					const hasNeed = (bal?.needs.length ?? 0) > 0;
					const hasSurplus = (bal?.surplus.length ?? 0) > 0;
					const border = hasNeed
						? "#d9534f"
						: hasSurplus
							? "#4fb8b2"
							: "var(--line)";
					return {
						id: f._id,
						position: pos.get(f._id) ?? { x: 0, y: 0 },
						data: { label: f.name },
						style: {
							width: NODE_W,
							height: NODE_H,
							fontSize: 13,
							borderRadius: 8,
							border: `2px solid ${border}`,
							background: "var(--chip-bg)",
							color: "var(--sea-ink)",
							padding: 8,
						},
					};
				}),
			);
			setEdges(
				transports.map((t) => ({
					id: t._id,
					source: t.fromFactoryId,
					target: t.toFactoryId,
					label: `${getItem(t.item)?.name ?? t.item} · ${formatNumber(t.rate)}/min · ${t.mode}`,
					labelStyle: { fontSize: 10, fill: "var(--sea-ink-soft)" },
				})),
			);
		});
		return () => {
			cancelled = true;
		};
	}, [factories, transports]);

	return (
		<div style={{ height: 480 }} className="rounded-xl border border-[var(--line)]">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				proOptions={{ hideAttribution: true }}
				onNodeClick={(_, node) =>
					navigate({
						to: "/factories/$factoryId",
						params: { factoryId: node.id },
					})
				}
			>
				<Background />
			</ReactFlow>
		</div>
	);
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success (the graph is imported lazily by the page in Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/features/logistics/NetworkGraph.tsx
git commit -m "feat: logistics network graph (react-flow + elk)"
```

### Task 6: Link form (+ test) and summary card

**Files:**
- Create: `src/features/logistics/LinkForm.tsx`
- Create: `src/features/logistics/SummaryCard.tsx`
- Test: `src/features/logistics/LinkForm.test.tsx`

- [ ] **Step 1: Write the failing LinkForm test**

`src/features/logistics/LinkForm.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LinkForm from "./LinkForm";

const factories = [
	{ _id: "a", name: "Smelter" },
	{ _id: "b", name: "Assembler" },
] as never[];

describe("LinkForm", () => {
	it("calls onCreate with the selected link", () => {
		const onCreate = vi.fn();
		render(<LinkForm factories={factories} onCreate={onCreate} />);
		fireEvent.change(screen.getByLabelText("Item"), {
			target: { value: "iron-plate" },
		});
		fireEvent.change(screen.getByLabelText("Rate per minute"), {
			target: { value: "60" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Add link" }));
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({ item: "iron-plate", rate: 60, mode: "belt" }),
		);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/logistics/LinkForm.test.tsx`
Expected: FAIL ("Cannot find module './LinkForm'").

- [ ] **Step 3: Implement LinkForm**

`src/features/logistics/LinkForm.tsx`:

```tsx
import { useEffect, useState } from "react";

export interface LinkDraft {
	fromFactoryId: string;
	toFactoryId: string;
	item: string;
	rate: number;
	mode: "belt" | "pipe" | "truck" | "train" | "drone";
	note?: string;
}

const MODES: LinkDraft["mode"][] = ["belt", "pipe", "truck", "train", "drone"];

export default function LinkForm({
	factories,
	prefill,
	onCreate,
}: {
	factories: { _id: string; name: string }[];
	/** When set (e.g. from a clicked source suggestion), seeds from-factory + item. */
	prefill?: { fromFactoryId: string; item: string };
	onCreate: (draft: LinkDraft) => void;
}) {
	const [fromFactoryId, setFrom] = useState(factories[0]?._id ?? "");
	const [toFactoryId, setTo] = useState(factories[1]?._id ?? factories[0]?._id ?? "");
	const [item, setItem] = useState("");
	const [rate, setRate] = useState(60);
	const [mode, setMode] = useState<LinkDraft["mode"]>("belt");

	useEffect(() => {
		if (prefill) {
			setFrom(prefill.fromFactoryId);
			setItem(prefill.item);
		}
	}, [prefill]);

	const submit = () => {
		if (!item.trim() || !fromFactoryId || !toFactoryId) return;
		onCreate({ fromFactoryId, toFactoryId, item: item.trim(), rate, mode });
		setItem("");
	};

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				New link
			</h2>
			<label className="flex flex-col gap-1 text-sm">
				From
				<select
					aria-label="From factory"
					value={fromFactoryId}
					onChange={(e) => setFrom(e.target.value)}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				>
					{factories.map((f) => (
						<option key={f._id} value={f._id}>
							{f.name}
						</option>
					))}
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				To
				<select
					aria-label="To factory"
					value={toFactoryId}
					onChange={(e) => setTo(e.target.value)}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				>
					{factories.map((f) => (
						<option key={f._id} value={f._id}>
							{f.name}
						</option>
					))}
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Item
				<input
					aria-label="Item"
					value={item}
					onChange={(e) => setItem(e.target.value)}
					placeholder="item slug"
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Rate /min
				<input
					type="number"
					aria-label="Rate per minute"
					min={0}
					value={rate}
					onChange={(e) => setRate(Number(e.target.value))}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Mode
				<select
					aria-label="Mode"
					value={mode}
					onChange={(e) => setMode(e.target.value as LinkDraft["mode"])}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 capitalize"
				>
					{MODES.map((m) => (
						<option key={m} value={m}>
							{m}
						</option>
					))}
				</select>
			</label>
			<button
				type="button"
				onClick={submit}
				className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)]"
			>
				Add link
			</button>
		</div>
	);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/logistics/LinkForm.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Implement SummaryCard**

`src/features/logistics/SummaryCard.tsx`:

```tsx
import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import { manualPower } from "#/features/factories/derive";
import { decodeSnapshot } from "#/features/factories/snapshot";
import { formatNumber, formatPower } from "#/lib/format";
import type { Doc } from "#convex/_generated/dataModel";
import { computeNetwork } from "./logistics";

function factoryPower(factory: Doc<"factories">): number {
	if (factory.production.source === "manual")
		return manualPower(factory.production.machines);
	return decodeSnapshot(factory.production.plan)?.solution.power ?? 0;
}

export default function SummaryCard({
	factories,
	transports,
}: {
	factories: Doc<"factories">[];
	transports: Doc<"transports">[];
}) {
	const net = computeNetwork(factories, transports);
	const power = factories.reduce((s, f) => s + factoryPower(f), 0);

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Network totals
				</h2>
				<span className="text-sm font-semibold">{formatPower(power)}</span>
			</div>
			{net.totals.length === 0 ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">Balanced.</p>
			) : (
				<div className="flex flex-col gap-1">
					{net.totals.map((t) => {
						const item = getItem(t.item);
						return (
							<div key={t.item} className="flex items-center gap-2 text-sm">
								<EntityIcon icon={item?.icon} name={item?.name ?? t.item} size={20} />
								<span className="flex-1">{item?.name ?? t.item}</span>
								<span
									className={
										t.rate >= 0 ? "text-[var(--sea-ink)]" : "text-red-500"
									}
								>
									{t.rate >= 0 ? "+" : ""}
									{formatNumber(t.rate)}/min
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 6: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0 / success.

- [ ] **Step 7: Commit**

```bash
git add src/features/logistics/LinkForm.tsx src/features/logistics/LinkForm.test.tsx src/features/logistics/SummaryCard.tsx
git commit -m "feat: logistics link form + network summary card"
```

### Task 7: Logistics page, route, factories embed, registry flip

**Files:**
- Create: `src/features/logistics/LogisticsPage.tsx`
- Modify: `src/routes/logistics.tsx`
- Modify: `src/features/factories/FactoriesPage.tsx`
- Modify: `src/config/features.ts`

- [ ] **Step 1: Compose the page**

`src/features/logistics/LogisticsPage.tsx`:

```tsx
import { SignInButton } from "@clerk/clerk-react";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { lazy, Suspense, useState } from "react";
import { getItem } from "#/data";
import { api } from "#convex/_generated/api";
import LinkForm, { type LinkDraft } from "./LinkForm";
import { computeNetwork, suggestSources } from "./logistics";
import SummaryCard from "./SummaryCard";

const NetworkGraph = lazy(() => import("./NetworkGraph"));

function Network() {
	const factories = useQuery(api.factories.list);
	const transports = useQuery(api.transports.list);
	const create = useMutation(api.transports.create);
	const remove = useMutation(api.transports.remove);
	const [prefill, setPrefill] = useState<
		{ fromFactoryId: string; item: string } | undefined
	>(undefined);

	if (factories === undefined || transports === undefined) {
		return <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>;
	}
	if (factories.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
				Create factories first, then link them here.
			</p>
		);
	}

	const onCreate = (draft: LinkDraft) =>
		create({
			fromFactoryId: draft.fromFactoryId as (typeof factories)[number]["_id"],
			toFactoryId: draft.toFactoryId as (typeof factories)[number]["_id"],
			item: draft.item,
			rate: draft.rate,
			mode: draft.mode,
			note: draft.note,
		});

	// Unmet needs across the network, each with factories that could source it.
	const net = computeNetwork(factories, transports);
	const suggestions = [...net.byFactory]
		.flatMap(([factoryId, bal]) =>
			bal.needs.map((need) => ({ factoryId, need })),
		)
		.map(({ factoryId, need }) => ({
			factoryId,
			need,
			sources: suggestSources(need.item, factories, transports),
		}))
		.filter((s) => s.sources.length > 0);

	return (
		<div className="grid gap-6 lg:grid-cols-[300px_1fr]">
			<div className="flex flex-col gap-4">
				<LinkForm factories={factories} prefill={prefill} onCreate={onCreate} />
				{suggestions.length > 0 && (
					<div className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
						<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
							Suggested links
						</h2>
						{suggestions.map((s) =>
							s.sources.map((src) => (
								<button
									key={`${s.factoryId}:${s.need.item}:${src.factoryId}`}
									type="button"
									onClick={() =>
										setPrefill({ fromFactoryId: src.factoryId, item: s.need.item })
									}
									className="rounded-lg border border-[var(--line)] px-3 py-2 text-left text-xs text-[var(--sea-ink)] hover:border-[var(--sea-ink)]"
								>
									{getItem(s.need.item)?.name ?? s.need.item}: source from a factory
									with surplus
								</button>
							)),
						)}
					</div>
				)}
				<SummaryCard factories={factories} transports={transports} />
				<div className="flex flex-col gap-2">
					{transports.map((t) => (
						<div
							key={t._id}
							className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
						>
							<span className="flex-1">
								{t.item} · {t.rate}/min · {t.mode}
							</span>
							<button
								type="button"
								onClick={() => remove({ id: t._id })}
								aria-label={`Remove ${t.item} link`}
								className="text-[var(--sea-ink-soft)] hover:text-red-500"
							>
								×
							</button>
						</div>
					))}
				</div>
			</div>
			<Suspense
				fallback={
					<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
						Loading graph…
					</p>
				}
			>
				<NetworkGraph factories={factories} transports={transports} />
			</Suspense>
		</div>
	);
}

export default function LogisticsPage() {
	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Logistics</h1>
			<Unauthenticated>
				<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-8 text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Sign in to connect your factories into a logistics network.
					</p>
					<div className="mt-4">
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
			</Unauthenticated>
			<Authenticated>
				<Network />
			</Authenticated>
		</main>
	);
}
```

- [ ] **Step 2: Wire the route**

Full new `src/routes/logistics.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import LogisticsPage from "#/features/logistics/LogisticsPage";

export const Route = createFileRoute("/logistics")({
	component: LogisticsPage,
});
```

- [ ] **Step 3: Embed the summary card on /factories**

In `src/features/factories/FactoriesPage.tsx`, the `FactoriesList` component renders factories. Add the transports query and summary card above the grid. Add these imports at the top:

```tsx
import SummaryCard from "#/features/logistics/SummaryCard";
```

In `FactoriesList`, after `const factories = useQuery(api.factories.list);` add:

```tsx
	const transports = useQuery(api.transports.list);
```

Then immediately inside the returned `<div className="flex flex-col gap-6">`, after the header `<div>…</div>` block (the one with the title + "New factory" button) and before `{creating && …}`, insert:

```tsx
			{factories && factories.length > 0 && transports && (
				<SummaryCard factories={factories} transports={transports} />
			)}
```

(Read `FactoriesPage.tsx` first to match the exact JSX; only add the query line and the SummaryCard block — change nothing else.)

- [ ] **Step 4: Flip the registry entry**

In `src/config/features.ts`, change the `logistics` feature's `status: "planned"` to `status: "beta"`.

- [ ] **Step 5: Run the full gate**

Run: `npx biome check . && npm run typecheck && npm test && npm run build`
Expected: all green; new tests (throughput, logistics, plannedInputs, LinkForm) pass. `routeTree.gen.ts` may regenerate on build — stage it if so.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. Signed in with ≥2 factories: add a transport link → the graph shows both nodes with a labelled edge; the source's surplus drops; the summary card totals update; the same card appears on `/factories`. Signed out → sign-in prompt.

- [ ] **Step 7: Commit**

```bash
git add src/features/logistics/LogisticsPage.tsx src/routes/logistics.tsx src/features/factories/FactoriesPage.tsx src/config/features.ts src/routeTree.gen.ts
git commit -m "feat: logistics page, route, factories summary embed, beta flip"
```

---

## Self-review notes (coverage vs spec)

- §1 transports table → Task 4. §2 Convex CRUD (ownership, both-endpoints check) → Task 4. §3 surplus/need + `plannedInputs` → Tasks 1, 3. §4 belt/pipe throughput → Task 2. §5 network graph → Task 5. §6 link form + suggestions → Task 6 (`suggestSources` from Task 3 is available for the form's source hints; the form + create flow ship in Tasks 6–7). §7 summary card on both pages → Tasks 6, 7. §8 pages/registry → Task 7. §9 error handling (slug fallback `getItem(...)?.name ?? item`; lazy client-only graph) → Tasks 5, 6. §10 testing → Tasks 1, 2, 3 (pure) + 6 (LinkForm).
- Type consistency: `FactoryLike`/`TransportLike`/`Network`/`FactoryBalance` (Task 3) consumed by Tasks 5, 6; `Throughput`/`beltFor`/`pipeFor` (Task 2) available to the UI; `LinkDraft` (Task 6) used by Task 7; `plannedInputs` (Task 1) used by Task 3. Convex `Doc<"factories">`/`Doc<"transports">` structurally satisfy `FactoryLike`/`TransportLike`.
- Spec §6 suggestion-prefill: `suggestSources` (Task 3, tested) feeds a "Suggested links" panel in Task 7's `Network`; clicking a suggestion sets `prefill`, which `LinkForm` applies via a `useEffect` to seed from-factory + item. Full spec §6 coverage (list + click-to-prefill).
