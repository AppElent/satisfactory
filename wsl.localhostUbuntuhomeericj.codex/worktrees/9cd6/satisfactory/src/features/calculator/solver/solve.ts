import { perMinute } from "#/lib/format";
import { buildCost, totalPower } from "./derive";
import { loadHighs } from "./highs";
import { buildModel, toLpString } from "./model";
import type {
	Flow,
	ItemFlow,
	LpModel,
	ProblemSpec,
	RecipeUsage,
	Solution,
} from "./types";

const EPSILON = 1e-6;

/** Sanitize user input so `solve` always returns a Solution rather than feeding
 *  NaN/negative values into the LP: drop targets that aren't finite and positive,
 *  sum duplicate targets for the same item, and drop available inputs with an
 *  invalid (non-finite or negative) rate cap. */
function normalizeSpec(spec: ProblemSpec): ProblemSpec {
	const mode = spec.mode ?? "produce";
	const byItem = new Map<string, number>();
	for (const t of spec.targets) {
		// In produce mode a target needs a finite positive rate; in maximize mode
		// the rate is ignored (the target is maximized), so keep any listed item.
		if (mode === "produce" && (!Number.isFinite(t.rate) || t.rate <= 0))
			continue;
		byItem.set(
			t.item,
			(byItem.get(t.item) ?? 0) + (Number.isFinite(t.rate) ? t.rate : 0),
		);
	}
	const targets = [...byItem].map(([item, rate]) => ({ item, rate }));
	const availableInputs = (spec.availableInputs ?? []).filter(
		(a) => a.rate === undefined || (Number.isFinite(a.rate) && a.rate >= 0),
	);
	return { ...spec, targets, availableInputs };
}

/** Targets whose item has no enabled producing recipe → unreachable. */
function unreachableTargets(spec: ProblemSpec, model: LpModel): string[] {
	const producible = new Set<string>();
	for (const r of model.recipes)
		for (const p of r.products) producible.add(p.item);
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
		outputs: [],
		rawInputs: [],
		providedInputs: [],
		byproducts: [],
		flows: [],
		power: 0,
		buildCost: [],
		diagnosis: { message, unreachable },
	};
}

export async function solve(rawSpec: ProblemSpec): Promise<Solution> {
	const spec = normalizeSpec(rawSpec);
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

	// Imports: split raw resources (to mine/import) from user-provided inputs.
	const rawInputs: Flow[] = [];
	const providedInputs: Flow[] = [];
	for (const [item, varName] of model.importVars) {
		const rate = primal(varName);
		if (rate <= EPSILON) continue;
		(model.providedInputs.has(item) ? providedInputs : rawInputs).push({
			item,
			rate,
		});
	}
	rawInputs.sort((a, b) => b.rate - a.rate);
	providedInputs.sort((a, b) => b.rate - a.rate);

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
		for (const p of r.products)
			bump(p.item, perMinute(p.amount, r.time) * machines, 0);
		for (const g of r.ingredients)
			bump(g.item, 0, perMinute(g.amount, r.time) * machines);
	});
	const flows = [...flowMap.values()].sort((a, b) => b.produced - a.produced);

	// Outputs: net production of each target item (achieved rate).
	const targetItems = new Set(spec.targets.map((t) => t.item));
	const outputs: Flow[] = [];
	for (const f of flows) {
		if (!targetItems.has(f.item)) continue;
		const net = f.produced - f.consumed;
		if (net > EPSILON) outputs.push({ item: f.item, rate: net });
	}

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
		outputs,
		rawInputs,
		providedInputs,
		byproducts,
		flows,
		power: totalPower(recipes),
		buildCost: buildCost(recipes),
	};
}
