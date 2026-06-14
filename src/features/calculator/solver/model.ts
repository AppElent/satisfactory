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
			for (const p of r.products)
				if (p.item === item) c += perMinute(p.amount, r.time);
			for (const g of r.ingredients)
				if (g.item === item) c -= perMinute(g.amount, r.time);
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
