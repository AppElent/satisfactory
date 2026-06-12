import buildablesJson from "./generated/buildables.json";
import buildingsJson from "./generated/buildings.json";
import generatorsJson from "./generated/generators.json";
import itemsJson from "./generated/items.json";
import minersJson from "./generated/miners.json";
import recipesJson from "./generated/recipes.json";
import resourcesJson from "./generated/resources.json";
import schematicsJson from "./generated/schematics.json";
import type {
	Buildable,
	Building,
	Generator,
	Item,
	Miner,
	Recipe,
	Resource,
	Schematic,
} from "./schema";

const items = itemsJson as Item[];
const recipes = recipesJson as Recipe[];
const buildings = buildingsJson as Building[];
const buildables = buildablesJson as Buildable[];
const schematics = schematicsJson as Schematic[];
const resources = resourcesJson as Resource[];
const generators = generatorsJson as Generator[];
const miners = minersJson as Miner[];

const itemsBySlug = new Map(items.map((x) => [x.slug, x]));
const recipesBySlug = new Map(recipes.map((x) => [x.slug, x]));
const buildingsBySlug = new Map(buildings.map((x) => [x.slug, x]));
const buildablesBySlug = new Map(buildables.map((x) => [x.slug, x]));
const schematicsBySlug = new Map(schematics.map((x) => [x.slug, x]));

const producingIndex = new Map<string, Recipe[]>();
const usingIndex = new Map<string, Recipe[]>();
for (const recipe of recipes) {
	for (const { item } of recipe.products) {
		producingIndex.set(item, [...(producingIndex.get(item) ?? []), recipe]);
	}
	for (const { item } of recipe.ingredients) {
		usingIndex.set(item, [...(usingIndex.get(item) ?? []), recipe]);
	}
}

export const listItems = (): Item[] => items;
export const listRecipes = (): Recipe[] => recipes;
export const listBuildings = (): Building[] => buildings;
export const listBuildables = (): Buildable[] => buildables;
export const listSchematics = (): Schematic[] => schematics;
export const listResources = (): Resource[] => resources;
export const listGenerators = (): Generator[] => generators;
export const listMiners = (): Miner[] => miners;

export const getItem = (slug: string): Item | undefined =>
	itemsBySlug.get(slug);
export const getRecipe = (slug: string): Recipe | undefined =>
	recipesBySlug.get(slug);
export const getBuilding = (slug: string): Building | undefined =>
	buildingsBySlug.get(slug);
export const getBuildable = (slug: string): Buildable | undefined =>
	buildablesBySlug.get(slug);
export const getSchematic = (slug: string): Schematic | undefined =>
	schematicsBySlug.get(slug);

export const getRecipesProducing = (itemSlug: string): Recipe[] =>
	producingIndex.get(itemSlug) ?? [];
export const getRecipesUsing = (itemSlug: string): Recipe[] =>
	usingIndex.get(itemSlug) ?? [];

export interface SearchResult {
	type: "item" | "recipe" | "building" | "buildable" | "schematic";
	slug: string;
	name: string;
}

const searchCorpus: SearchResult[] = [
	...items.map((x) => ({ type: "item" as const, slug: x.slug, name: x.name })),
	...recipes.map((x) => ({
		type: "recipe" as const,
		slug: x.slug,
		name: x.name,
	})),
	...buildings.map((x) => ({
		type: "building" as const,
		slug: x.slug,
		name: x.name,
	})),
	...buildables.map((x) => ({
		type: "buildable" as const,
		slug: x.slug,
		name: x.name,
	})),
	...schematics.map((x) => ({
		type: "schematic" as const,
		slug: x.slug,
		name: x.name,
	})),
];

export function searchEntities(query: string, limit = 20): SearchResult[] {
	const q = query.trim().toLowerCase();
	if (q.length === 0) return [];
	return searchCorpus
		.filter((x) => x.name.toLowerCase().includes(q))
		.slice(0, limit);
}
