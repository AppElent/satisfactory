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
