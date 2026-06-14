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
