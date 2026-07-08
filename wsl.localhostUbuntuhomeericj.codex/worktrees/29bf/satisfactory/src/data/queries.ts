import { getRecipesProducing, listSchematics } from "./index";
import type { Recipe, Schematic } from "./schema";

/** The recipe that constructs a building/buildable (its build cost), if any. */
export function getBuildCost(slug: string): Recipe | undefined {
	return getRecipesProducing(slug).find((r) => r.forBuilding);
}

/** Standard (non-alternate) recipes producing an item. */
export function getStandardRecipes(itemSlug: string): Recipe[] {
	return getRecipesProducing(itemSlug).filter((r) => !r.alternate);
}

/** Alternate recipes producing an item. */
export function getAlternateRecipes(itemSlug: string): Recipe[] {
	return getRecipesProducing(itemSlug).filter((r) => r.alternate);
}

/** Schematics whose unlocked recipes include any recipe producing this item. */
export function getUnlockingSchematics(itemSlug: string): Schematic[] {
	const recipeSlugs = new Set(getRecipesProducing(itemSlug).map((r) => r.slug));
	if (recipeSlugs.size === 0) return [];
	return listSchematics().filter((s) =>
		s.unlockRecipes.some((rs) => recipeSlugs.has(rs)),
	);
}
