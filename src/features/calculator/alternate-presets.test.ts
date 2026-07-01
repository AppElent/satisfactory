import { describe, expect, it } from "vitest";
import type { Recipe, Schematic } from "#/data/schema";
import {
	applyPreset,
	deriveBuiltInPresets,
	groupAlternateRecipes,
	sanitizeSavedPreset,
	toggleAlternate,
	type AlternatePolicyState,
	type AlternatePreset,
} from "./alternate-presets";

function recipe(overrides: Partial<Recipe>): Recipe {
	return {
		slug: "recipe-a",
		className: "Recipe_A_C",
		name: "Alternate: A",
		alternate: true,
		time: 6,
		ingredients: [],
		products: [{ item: "iron-plate", amount: 1 }],
		producedIn: ["constructor"],
		forBuilding: false,
		inMachine: true,
		inHand: false,
		inWorkshop: false,
		isVariablePower: false,
		minPower: 0,
		maxPower: 0,
		...overrides,
	};
}

function schematic(overrides: Partial<Schematic>): Schematic {
	return {
		slug: "schematic-a",
		className: "Schematic_A_C",
		name: "A",
		icon: "",
		type: "Alternate",
		tier: 4,
		cost: [],
		unlockRecipes: ["recipe-a"],
		requiredSchematics: [],
		mam: false,
		alternate: true,
		...overrides,
	};
}

describe("deriveBuiltInPresets", () => {
	it("builds cumulative tier presets, MAM, all, and combined presets", () => {
		const recipes = [
			recipe({ slug: "recipe-tier-4", name: "Alternate: Tier 4" }),
			recipe({ slug: "recipe-tier-6", name: "Alternate: Tier 6" }),
			recipe({ slug: "recipe-mam", name: "Alternate: MAM" }),
			recipe({ slug: "recipe-other", name: "Alternate: Other" }),
			recipe({
				slug: "recipe-standard",
				name: "Standard",
				alternate: false,
			}),
			recipe({
				slug: "recipe-hand",
				name: "Alternate: Hand",
				inMachine: false,
				producedIn: [],
			}),
		];
		const schematics = [
			schematic({ unlockRecipes: ["recipe-tier-4"], tier: 4 }),
			schematic({ unlockRecipes: ["recipe-tier-6"], tier: 6 }),
			schematic({ unlockRecipes: ["recipe-mam"], mam: true, tier: 0 }),
		];

		const presets = deriveBuiltInPresets(recipes, schematics);

		expect(presets.find((p) => p.id === "none")?.recipeSlugs).toEqual([]);
		expect(presets.find((p) => p.id === "tier-4")?.recipeSlugs).toEqual([
			"recipe-tier-4",
		]);
		expect(presets.find((p) => p.id === "tier-6")?.recipeSlugs).toEqual([
			"recipe-tier-4",
			"recipe-tier-6",
		]);
		expect(presets.find((p) => p.id === "mam")?.recipeSlugs).toEqual([
			"recipe-mam",
		]);
		expect(presets.find((p) => p.id === "all")?.recipeSlugs).toEqual([
			"recipe-mam",
			"recipe-other",
			"recipe-tier-4",
			"recipe-tier-6",
		]);
		expect(presets.find((p) => p.id === "tier-8-mam")?.recipeSlugs).toEqual([
			"recipe-mam",
			"recipe-tier-4",
			"recipe-tier-6",
		]);
	});
});

describe("groupAlternateRecipes", () => {
	it("groups alternates by tier, MAM, and Other alternates", () => {
		const recipes = [
			recipe({ slug: "recipe-tier-4", name: "Alternate: Tier 4" }),
			recipe({ slug: "recipe-mam", name: "Alternate: MAM" }),
			recipe({ slug: "recipe-other", name: "Alternate: Other" }),
		];
		const schematics = [
			schematic({ unlockRecipes: ["recipe-tier-4"], tier: 4 }),
			schematic({ unlockRecipes: ["recipe-mam"], mam: true, tier: 0 }),
		];

		const groups = groupAlternateRecipes(recipes, schematics);

		expect(groups.map((g) => g.label)).toEqual([
			"Tier 4",
			"MAM",
			"Other alternates",
		]);
		expect(groups[0].recipes.map((r) => r.recipe.slug)).toEqual([
			"recipe-tier-4",
		]);
		expect(groups[1].recipes.map((r) => r.recipe.slug)).toEqual([
			"recipe-mam",
		]);
		expect(groups[2].recipes.map((r) => r.recipe.slug)).toEqual([
			"recipe-other",
		]);
	});
});

describe("policy helpers", () => {
	const presets: AlternatePreset[] = [
		{
			id: "tier-4",
			name: "Tier 1-4",
			recipeSlugs: ["recipe-a", "recipe-b"],
			createdAt: 1,
			updatedAt: 1,
		},
	];

	it("applies a preset as the concrete allowed alternate list", () => {
		expect(applyPreset("tier-4", presets)).toEqual({
			basePresetId: "tier-4",
			allowedAlternates: ["recipe-a", "recipe-b"],
			excludedAlternates: [],
			includedAlternates: [],
		});
	});

	it("toggles a preset recipe off as an exclusion", () => {
		const state: AlternatePolicyState = applyPreset("tier-4", presets);

		expect(toggleAlternate(state, "recipe-a", presets)).toEqual({
			basePresetId: "tier-4",
			allowedAlternates: ["recipe-b"],
			excludedAlternates: ["recipe-a"],
			includedAlternates: [],
		});
	});

	it("toggles a non-preset recipe on as a manual inclusion", () => {
		const state: AlternatePolicyState = applyPreset("tier-4", presets);

		expect(toggleAlternate(state, "recipe-c", presets)).toEqual({
			basePresetId: "tier-4",
			allowedAlternates: ["recipe-a", "recipe-b", "recipe-c"],
			excludedAlternates: [],
			includedAlternates: ["recipe-c"],
		});
	});

	it("sanitizes saved presets by dropping unknown slugs and bad names", () => {
		const validSlugs = new Set(["recipe-a"]);

		expect(
			sanitizeSavedPreset(
				{
					id: "abc",
					name: "  My preset  ",
					recipeSlugs: ["recipe-a", "missing"],
					createdAt: 5,
					updatedAt: 6,
				},
				validSlugs,
			),
		).toEqual({
			id: "abc",
			name: "My preset",
			recipeSlugs: ["recipe-a"],
			createdAt: 5,
			updatedAt: 6,
		});
		expect(
			sanitizeSavedPreset(
				{ id: "", name: "", recipeSlugs: ["recipe-a"] },
				validSlugs,
			),
		).toBeUndefined();
	});
});
