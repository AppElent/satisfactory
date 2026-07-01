import { listRecipes, listSchematics } from "#/data";
import type { Recipe, Schematic } from "#/data/schema";

export type BuiltInAlternatePresetId =
	| "none"
	| "all"
	| "tier-4"
	| "tier-6"
	| "tier-8"
	| "mam"
	| "tier-8-mam";

export interface AlternatePreset {
	id: string;
	name: string;
	recipeSlugs: string[];
	createdAt: number;
	updatedAt: number;
}

export interface AlternatePolicyState {
	basePresetId?: string;
	allowedAlternates: string[];
	excludedAlternates: string[];
	includedAlternates: string[];
}

export interface AlternateRecipeInfo {
	recipe: Recipe;
	primaryProduct: string;
	machine?: string;
	bucketId: string;
	bucketLabel: string;
	sort: number;
}

export interface AlternateRecipeGroup {
	id: string;
	label: string;
	recipes: AlternateRecipeInfo[];
}

const BUILT_IN_TIME = 0;

function uniqueSorted(values: Iterable<string>): string[] {
	return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function automatableAlternates(recipes = listRecipes()): Recipe[] {
	return recipes
		.filter((recipe) => recipe.alternate && recipe.inMachine)
		.filter((recipe) => recipe.producedIn.length > 0)
		.sort((a, b) => a.name.localeCompare(b.name));
}

function schematicByRecipe(schematics: Schematic[]): Map<string, Schematic> {
	const map = new Map<string, Schematic>();
	for (const schematic of schematics) {
		for (const recipe of schematic.unlockRecipes) map.set(recipe, schematic);
	}
	return map;
}

function infoForRecipe(
	recipe: Recipe,
	lookup: Map<string, Schematic>,
): AlternateRecipeInfo {
	const unlock = lookup.get(recipe.slug);
	const primaryProduct = recipe.products[0]?.item ?? "";

	if (unlock?.mam) {
		return {
			recipe,
			primaryProduct,
			machine: recipe.producedIn[0],
			bucketId: "mam",
			bucketLabel: "MAM",
			sort: 90,
		};
	}

	if (unlock) {
		return {
			recipe,
			primaryProduct,
			machine: recipe.producedIn[0],
			bucketId: `tier-${unlock.tier}`,
			bucketLabel: `Tier ${unlock.tier}`,
			sort: unlock.tier,
		};
	}

	return {
		recipe,
		primaryProduct,
		machine: recipe.producedIn[0],
		bucketId: "other",
		bucketLabel: "Other alternates",
		sort: 99,
	};
}

export function groupAlternateRecipes(
	recipes = listRecipes(),
	schematics = listSchematics(),
): AlternateRecipeGroup[] {
	const lookup = schematicByRecipe(schematics);
	const groups = new Map<string, AlternateRecipeGroup>();

	for (const recipe of automatableAlternates(recipes)) {
		const info = infoForRecipe(recipe, lookup);
		const group = groups.get(info.bucketId) ?? {
			id: info.bucketId,
			label: info.bucketLabel,
			recipes: [],
		};
		group.recipes.push(info);
		groups.set(info.bucketId, group);
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			recipes: group.recipes.sort((a, b) =>
				a.recipe.name.localeCompare(b.recipe.name),
			),
		}))
		.sort((a, b) => {
			const aSort = a.recipes[0]?.sort ?? 99;
			const bSort = b.recipes[0]?.sort ?? 99;
			return aSort - bSort || a.label.localeCompare(b.label);
		});
}

export function deriveBuiltInPresets(
	recipes = listRecipes(),
	schematics = listSchematics(),
): AlternatePreset[] {
	const groups = groupAlternateRecipes(recipes, schematics);
	const byTier = (maxTier: number) =>
		uniqueSorted(
			groups
				.filter((group) => group.id.startsWith("tier-"))
				.flatMap((group) => {
					const tier = Number(group.id.replace("tier-", ""));
					return tier <= maxTier
						? group.recipes.map((info) => info.recipe.slug)
						: [];
				}),
		);
	const mam = uniqueSorted(
		groups
			.find((group) => group.id === "mam")
			?.recipes.map((info) => info.recipe.slug) ?? [],
	);
	const all = uniqueSorted(
		groups.flatMap((group) => group.recipes.map((info) => info.recipe.slug)),
	);
	const presets: Array<[BuiltInAlternatePresetId, string, string[]]> = [
		["none", "None", []],
		["all", "All alternates", all],
		["tier-4", "Tier 1-4", byTier(4)],
		["tier-6", "Tier 1-6", byTier(6)],
		["tier-8", "Tier 1-8", byTier(8)],
		["mam", "MAM alternates", mam],
		["tier-8-mam", "Tier 1-8 + MAM", uniqueSorted([...byTier(8), ...mam])],
	];

	return presets.map(([id, name, recipeSlugs]) => ({
		id,
		name,
		recipeSlugs,
		createdAt: BUILT_IN_TIME,
		updatedAt: BUILT_IN_TIME,
	}));
}

export function findPreset(
	id: string | undefined,
	presets: AlternatePreset[],
): AlternatePreset | undefined {
	return presets.find((preset) => preset.id === id);
}

export function applyPreset(
	presetId: string,
	presets: AlternatePreset[],
): AlternatePolicyState {
	const preset = findPreset(presetId, presets);
	return {
		basePresetId: preset?.id,
		allowedAlternates: preset ? uniqueSorted(preset.recipeSlugs) : [],
		excludedAlternates: [],
		includedAlternates: [],
	};
}

export function policyFromAllowed(
	allowedAlternates: string[],
	presets: AlternatePreset[],
): AlternatePolicyState {
	const allowed = uniqueSorted(allowedAlternates);
	const exact = presets.find(
		(preset) =>
			preset.id !== "none" &&
			preset.recipeSlugs.length === allowed.length &&
			uniqueSorted(preset.recipeSlugs).every(
				(slug, index) => slug === allowed[index],
			),
	);

	return {
		basePresetId: exact?.id,
		allowedAlternates: allowed,
		excludedAlternates: [],
		includedAlternates: exact ? [] : allowed,
	};
}

export function toggleAlternate(
	state: AlternatePolicyState,
	slug: string,
	presets: AlternatePreset[],
): AlternatePolicyState {
	const base = new Set(
		findPreset(state.basePresetId, presets)?.recipeSlugs ?? [],
	);
	const allowed = new Set(state.allowedAlternates);
	if (allowed.has(slug)) allowed.delete(slug);
	else allowed.add(slug);
	const nextAllowed = uniqueSorted(allowed);

	return {
		...state,
		allowedAlternates: nextAllowed,
		excludedAlternates: uniqueSorted([...base].filter((x) => !allowed.has(x))),
		includedAlternates: uniqueSorted([...allowed].filter((x) => !base.has(x))),
	};
}

export function resetToPreset(
	state: AlternatePolicyState,
	presets: AlternatePreset[],
): AlternatePolicyState {
	if (!state.basePresetId) return state;
	return applyPreset(state.basePresetId, presets);
}

export function alternateSummary(
	state: AlternatePolicyState,
	presets: AlternatePreset[],
): { label: string; enabled: number; excluded: number } {
	const preset = findPreset(state.basePresetId, presets);
	return {
		label: preset?.name ?? "Custom current selection",
		enabled: state.allowedAlternates.length,
		excluded: state.excludedAlternates.length,
	};
}

export function sanitizeSavedPreset(
	value: unknown,
	validRecipeSlugs: Set<string>,
): AlternatePreset | undefined {
	if (!value || typeof value !== "object") return undefined;
	const record = value as Partial<AlternatePreset>;
	if (typeof record.id !== "string" || record.id.trim() === "")
		return undefined;
	if (typeof record.name !== "string" || record.name.trim() === "")
		return undefined;
	if (!Array.isArray(record.recipeSlugs)) return undefined;

	const recipeSlugs = uniqueSorted(
		record.recipeSlugs.filter(
			(slug): slug is string =>
				typeof slug === "string" && validRecipeSlugs.has(slug),
		),
	);
	const now = Date.now();

	return {
		id: record.id,
		name: record.name.trim(),
		recipeSlugs,
		createdAt:
			typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
				? record.createdAt
				: now,
		updatedAt:
			typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
				? record.updatedAt
				: now,
	};
}

export function validAlternateRecipeSlugs(
	recipes = listRecipes(),
): Set<string> {
	return new Set(automatableAlternates(recipes).map((recipe) => recipe.slug));
}
