import type { RecipeUsage } from "#/features/calculator/solver";
import {
	buildCost as recipeBuildCost,
	totalPower as recipeTotalPower,
} from "#/features/calculator/solver/derive";
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
