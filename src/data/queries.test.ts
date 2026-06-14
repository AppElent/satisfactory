import { describe, expect, it } from "vitest";
import {
	getAlternateRecipes,
	getBuildCost,
	getStandardRecipes,
	getUnlockingSchematics,
} from "./queries";

describe("derived queries", () => {
	it("returns the build cost recipe for a building", () => {
		const cost = getBuildCost("constructor");
		expect(cost).toBeDefined();
		expect(cost?.ingredients.length).toBeGreaterThan(0);
	});

	it("returns the build cost recipe for a buildable", () => {
		expect(getBuildCost("lookout-tower")).toBeDefined();
	});

	it("returns undefined build cost for a non-building slug", () => {
		expect(getBuildCost("iron-plate")).toBeUndefined();
	});

	it("splits recipes into standard and alternate for an item", () => {
		const standard = getStandardRecipes("iron-plate");
		const alternate = getAlternateRecipes("iron-plate");
		expect(standard.every((r) => !r.alternate)).toBe(true);
		expect(alternate.every((r) => r.alternate)).toBe(true);
		expect(standard.length).toBeGreaterThanOrEqual(1);
	});

	it("finds schematics that unlock an item's recipes", () => {
		const unlockers = getUnlockingSchematics("iron-plate");
		expect(Array.isArray(unlockers)).toBe(true);
		// iron-plate has alternates unlocked by schematics
		expect(unlockers.length).toBeGreaterThanOrEqual(1);
	});

	it("returns no unlockers for a base resource available from the start", () => {
		// raw ore is never a recipe product, so no unlocking schematic
		expect(getUnlockingSchematics("iron-ore")).toEqual([]);
	});
});
