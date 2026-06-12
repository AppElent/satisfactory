import { describe, expect, it } from "vitest";
import {
	getBuildable,
	getBuilding,
	getItem,
	getRecipesProducing,
	getRecipesUsing,
	getSchematic,
	listBuildables,
	listBuildings,
	listItems,
	listRecipes,
	listSchematics,
	searchEntities,
} from "./index";

describe("data access layer", () => {
	it("loads all domains", () => {
		expect(listItems()).toHaveLength(175);
		expect(listRecipes()).toHaveLength(797);
		expect(listBuildings()).toHaveLength(20);
		expect(listBuildables()).toHaveLength(480);
		expect(listSchematics()).toHaveLength(437);
	});

	it("looks up entities by slug", () => {
		expect(getItem("iron-plate")?.name).toBe("Iron Plate");
		expect(getBuilding("constructor")?.name).toBe("Constructor");
		expect(getBuildable("lookout-tower")?.name).toBe("Lookout Tower");
		expect(getItem("does-not-exist")).toBeUndefined();
	});

	it("every recipe reference resolves", () => {
		for (const recipe of listRecipes()) {
			for (const { item } of [...recipe.ingredients, ...recipe.products]) {
				expect(
					getItem(item) ?? getBuildable(item) ?? getBuilding(item),
					`${recipe.slug} -> ${item}`,
				).toBeDefined();
			}
			for (const building of recipe.producedIn) {
				expect(
					getBuilding(building),
					`${recipe.slug} -> ${building}`,
				).toBeDefined();
			}
		}
	});

	it("every schematic reference resolves", () => {
		const recipeSlugs = new Set(listRecipes().map((r) => r.slug));
		for (const schematic of listSchematics()) {
			for (const slug of schematic.unlockRecipes) {
				expect(recipeSlugs.has(slug), `${schematic.slug} -> ${slug}`).toBe(
					true,
				);
			}
			for (const slug of schematic.requiredSchematics) {
				expect(
					getSchematic(slug),
					`${schematic.slug} -> ${slug}`,
				).toBeDefined();
			}
		}
	});

	it("finds recipes producing and using an item", () => {
		const producing = getRecipesProducing("iron-plate");
		expect(producing.length).toBeGreaterThanOrEqual(1);
		expect(producing.some((r) => !r.alternate)).toBe(true);
		const using = getRecipesUsing("iron-plate");
		expect(using.length).toBeGreaterThanOrEqual(1);
	});

	it("searches across entity types", () => {
		const results = searchEntities("iron pla");
		expect(
			results.some((r) => r.type === "item" && r.slug === "iron-plate"),
		).toBe(true);
		expect(searchEntities("")).toEqual([]);
	});
});
