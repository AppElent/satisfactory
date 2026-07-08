# Calculator Alternate Recipe Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the calculator's long alternate recipe list with a compact preset panel, full management dialog, browser-local custom presets, and an iterative used-alternates review loop.

**Architecture:** Keep the solver contract unchanged: `ProblemSpec.allowedAlternates` remains the concrete recipe slug list sent to `useSolver` and encoded in plan URLs. Add a pure alternate-policy module for deriving built-in presets from recipes/schematics and tracking included/excluded differences, a browser-local preset hook, and focused UI components under `src/features/calculator/`. `CalculatorPage` owns the active policy and passes state/update callbacks to the panel, dialog, and used-alternates review.

**Tech Stack:** React 19, TanStack Router, Radix UI primitives already wrapped in `src/components/ui`, TypeScript, Vitest, Testing Library, localStorage.

---

## File Structure

- Create `src/features/calculator/alternate-presets.ts`
  Pure helper module. No React. Derives built-in presets, groups alternates by tier/MAM/other, computes policy differences, applies presets, toggles alternates, and sanitizes saved presets.

- Create `src/features/calculator/alternate-presets.test.ts`
  Unit tests for pure alternate-policy behavior.

- Create `src/features/calculator/useAlternatePresets.ts`
  Browser-local custom preset persistence behind a small hook.

- Create `src/features/calculator/useAlternatePresets.test.tsx`
  Hook/component tests for localStorage loading, malformed data, create, and overwrite.

- Replace `src/features/calculator/RecipeOptions.tsx`
  Convert from inline long list to compact panel plus dialog. Export remains default `RecipeOptions` so `CalculatorPage` can keep the import name.

- Create `src/features/calculator/RecipeOptions.test.tsx`
  Component tests for summary counts, dialog opening, preset application, search, grouping, and save-as-preset.

- Create `src/features/calculator/UsedAlternatesReview.tsx`
  Post-solve review block for alternates actually used by the current solution.

- Create `src/features/calculator/UsedAlternatesReview.test.tsx`
  Component tests for rendering used alternates and calling the plan-local toggle.

- Modify `src/features/calculator/CalculatorPage.tsx`
  Own `AlternatePolicyState`, derive the solver `allowedAlternates`, wire `RecipeOptions` and `UsedAlternatesReview`, and keep URL encoding concrete.

---

### Task 1: Pure Alternate Preset Helpers

**Files:**
- Create: `src/features/calculator/alternate-presets.ts`
- Test: `src/features/calculator/alternate-presets.test.ts`

- [ ] **Step 1: Write the failing pure helper tests**

Create `src/features/calculator/alternate-presets.test.ts`:

``	s
import { describe, expect, it } from "vitest";
import {
	applyPreset,
	deriveBuiltInPresets,
	groupAlternateRecipes,
	sanitizeSavedPreset,
	toggleAlternate,
	type AlternatePolicyState,
	type AlternatePreset,
} from "./alternate-presets";
import type { Recipe, Schematic } from "#/data/schema";

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
		expect(groups[1].recipes.map((r) => r.recipe.slug)).toEqual(["recipe-mam"]);
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
```

- [ ] **Step 2: Run the pure helper tests to verify they fail**

Run:

```bash
npx vitest run src/features/calculator/alternate-presets.test.ts
```

Expected: FAIL because `./alternate-presets` does not exist.

- [ ] **Step 3: Implement `alternate-presets.ts`**

Create `src/features/calculator/alternate-presets.ts`:

``	s
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
		.filter((r) => r.alternate && r.inMachine && r.producedIn.length > 0)
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
			bucketId: 	ier-${unlock.tier}`,
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
				.filter((g) => g.id.startsWith("tier-"))
				.flatMap((g) => {
					const tier = Number(g.id.replace("tier-", ""));
					return tier <= maxTier ? g.recipes.map((x) => x.recipe.slug) : [];
				}),
		);
	const mam = uniqueSorted(
		groups.find((g) => g.id === "mam")?.recipes.map((x) => x.recipe.slug) ??
			[],
	);
	const all = uniqueSorted(groups.flatMap((g) => g.recipes.map((x) => x.recipe.slug)));
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
			preset.recipeSlugs.length === allowed.length &&
			uniqueSorted(preset.recipeSlugs).every((slug, index) => slug === allowed[index]),
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
	const base = new Set(findPreset(state.basePresetId, presets)?.recipeSlugs ?? []);
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
	if (typeof record.id !== "string" || record.id.trim() === "") return undefined;
	if (typeof record.name !== "string" || record.name.trim() === "")
		return undefined;
	if (!Array.isArray(record.recipeSlugs)) return undefined;
	const recipeSlugs = uniqueSorted(
		record.recipeSlugs.filter(
			(slug): slug is string =>
				typeof slug === "string" && validRecipeSlugs.has(slug),
		),
	);
	return {
		id: record.id,
		name: record.name.trim(),
		recipeSlugs,
		createdAt:
			typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
				? record.createdAt
				: Date.now(),
		updatedAt:
			typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
				? record.updatedAt
				: Date.now(),
	};
}

export function validAlternateRecipeSlugs(recipes = listRecipes()): Set<string> {
	return new Set(automatableAlternates(recipes).map((recipe) => recipe.slug));
}
```

- [ ] **Step 4: Run the pure helper tests to verify they pass**

Run:

```bash
npx vitest run src/features/calculator/alternate-presets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculator/alternate-presets.ts src/features/calculator/alternate-presets.test.ts
git commit -m "feat: add alternate recipe preset helpers"
```

---

### Task 2: Browser-Local Custom Preset Storage

**Files:**
- Create: `src/features/calculator/useAlternatePresets.ts`
- Test: `src/features/calculator/useAlternatePresets.test.tsx`

- [ ] **Step 1: Write the failing hook tests**

Create `src/features/calculator/useAlternatePresets.test.tsx`:

``	sx
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAlternatePresets } from "./useAlternatePresets";

describe("useAlternatePresets", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("loads no custom presets when storage is empty", () => {
		const { result } = renderHook(() => useAlternatePresets(new Set(["recipe-a"])));
		expect(result.current.customPresets).toEqual([]);
	});

	it("ignores malformed storage JSON", () => {
		localStorage.setItem("satisfactory.alternatePresets.v1", "{bad json");
		const { result } = renderHook(() => useAlternatePresets(new Set(["recipe-a"])));
		expect(result.current.customPresets).toEqual([]);
	});

	it("creates a named preset from the current recipe list", () => {
		const { result } = renderHook(() => useAlternatePresets(new Set(["recipe-a"])));
		act(() => {
			result.current.savePreset({
				mode: "create",
				name: "Iron build",
				recipeSlugs: ["recipe-a", "missing"],
			});
		});
		expect(result.current.customPresets).toHaveLength(1);
		expect(result.current.customPresets[0]).toMatchObject({
			name: "Iron build",
			recipeSlugs: ["recipe-a"],
		});
		expect(localStorage.getItem("satisfactory.alternatePresets.v1")).toContain(
			"Iron build",
		);
	});

	it("overwrites an existing preset", () => {
		const { result } = renderHook(() =>
			useAlternatePresets(new Set(["recipe-a", "recipe-b"])),
		);
		let id = "";
		act(() => {
			const saved = result.current.savePreset({
				mode: "create",
				name: "First",
				recipeSlugs: ["recipe-a"],
			});
			id = saved.id;
		});
		act(() => {
			result.current.savePreset({
				mode: "overwrite",
				id,
				name: "Updated",
				recipeSlugs: ["recipe-b"],
			});
		});
		expect(result.current.customPresets).toEqual([
			expect.objectContaining({
				id,
				name: "Updated",
				recipeSlugs: ["recipe-b"],
			}),
		]);
	});
});
```

- [ ] **Step 2: Run the hook tests to verify they fail**

Run:

```bash
npx vitest run src/features/calculator/useAlternatePresets.test.tsx
```

Expected: FAIL because `./useAlternatePresets` does not exist.

- [ ] **Step 3: Implement `useAlternatePresets.ts`**

Create `src/features/calculator/useAlternatePresets.ts`:

``	s
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	sanitizeSavedPreset,
	type AlternatePreset,
} from "./alternate-presets";

const STORAGE_KEY = "satisfactory.alternatePresets.v1";

type SavePresetArgs =
	| { mode: "create"; name: string; recipeSlugs: string[] }
	| { mode: "overwrite"; id: string; name: string; recipeSlugs: string[] };

function makeId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readPresets(validRecipeSlugs: Set<string>): AlternatePreset[] {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((value) => sanitizeSavedPreset(value, validRecipeSlugs))
			.filter((x): x is AlternatePreset => x !== undefined)
			.sort((a, b) => a.name.localeCompare(b.name));
	} catch {
		return [];
	}
}

function writePresets(presets: AlternatePreset[]): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function useAlternatePresets(validRecipeSlugs: Set<string>) {
	const [customPresets, setCustomPresets] = useState<AlternatePreset[]>(() =>
		readPresets(validRecipeSlugs),
	);

	useEffect(() => {
		setCustomPresets(readPresets(validRecipeSlugs));
	}, [validRecipeSlugs]);

	const savePreset = useCallback(
		(args: SavePresetArgs): AlternatePreset => {
			const now = Date.now();
			const base: AlternatePreset = {
				id: args.mode === "overwrite" ? args.id : makeId(),
				name: args.name.trim() || "Untitled preset",
				recipeSlugs: args.recipeSlugs.filter((slug) => validRecipeSlugs.has(slug)),
				createdAt: now,
				updatedAt: now,
			};
			const sanitized =
				sanitizeSavedPreset(base, validRecipeSlugs) ?? {
					...base,
					recipeSlugs: [],
				};
			setCustomPresets((current) => {
				const existing = current.find((preset) => preset.id === sanitized.id);
				const next =
					args.mode === "overwrite" && existing
						? current.map((preset) =>
								preset.id === sanitized.id
									? { ...sanitized, createdAt: existing.createdAt }
									: preset,
							)
						: [...current, sanitized];
				const sorted = next.sort((a, b) => a.name.localeCompare(b.name));
				writePresets(sorted);
				return sorted;
			});
			return sanitized;
		},
		[validRecipeSlugs],
	);

	return useMemo(
		() => ({ customPresets, savePreset }),
		[customPresets, savePreset],
	);
}
```

- [ ] **Step 4: Run the hook tests to verify they pass**

Run:

```bash
npx vitest run src/features/calculator/useAlternatePresets.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/calculator/useAlternatePresets.ts src/features/calculator/useAlternatePresets.test.tsx
git commit -m "feat: store custom alternate recipe presets locally"
```

---

### Task 3: Compact Panel and Management Dialog

**Files:**
- Modify: `src/features/calculator/RecipeOptions.tsx`
- Test: `src/features/calculator/RecipeOptions.test.tsx`

- [ ] **Step 1: Write the failing RecipeOptions component tests**

Create `src/features/calculator/RecipeOptions.test.tsx`:

``	sx
import { fireEvent, render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeOptions from "./RecipeOptions";

describe("RecipeOptions", () => {
	beforeEach(() => localStorage.clear());

	it("renders a compact summary instead of the full long list", () => {
		const { getByText, queryByLabelText } = render(
			<RecipeOptions allowedAlternates={[]} onChange={() => {}} />,
		);
		expect(getByText("Custom current selection")).toBeTruthy();
		expect(getByText("0 enabled")).toBeTruthy();
		expect(queryByLabelText("Filter alternate recipes")).toBeNull();
	});

	it("opens the manager and applies a built-in preset", () => {
		const onChange = vi.fn();
		const { getByRole, getByText } = render(
			<RecipeOptions allowedAlternates={[]} onChange={onChange} />,
		);
		fireEvent.click(getByRole("button", { name: "Manage alternates" }));
		fireEvent.click(getByText("All alternates"));
		expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
			expect.stringMatching(/^recipe-/),
		]));
	});

	it("filters recipes in the manager", () => {
		const { getByRole, getByLabelText, getByText } = render(
			<RecipeOptions allowedAlternates={[]} onChange={() => {}} />,
		);
		fireEvent.click(getByRole("button", { name: "Manage alternates" }));
		fireEvent.click(getByText("Recipes"));
		fireEvent.change(getByLabelText("Filter alternate recipes"), {
			target: { value: "coated" },
		});
		expect(getByText(/Coated/i)).toBeTruthy();
	});

	it("saves the current selection as a local preset", () => {
		const { getByRole, getByLabelText, getByText } = render(
			<RecipeOptions
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onChange={() => {}}
			/>,
		);
		fireEvent.click(getByRole("button", { name: "Save as preset" }));
		fireEvent.change(getByLabelText("Preset name"), {
			target: { value: "My iron preset" },
		});
		fireEvent.click(getByRole("button", { name: "Create preset" }));
		fireEvent.click(getByRole("button", { name: "Manage alternates" }));
		expect(getByText("My iron preset")).toBeTruthy();
	});

	it("can overwrite an existing preset", () => {
		const { getByRole, getByLabelText, getByText, rerender } = render(
			<RecipeOptions
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onChange={() => {}}
			/>,
		);
		fireEvent.click(getByRole("button", { name: "Save as preset" }));
		fireEvent.change(getByLabelText("Preset name"), {
			target: { value: "Overwrite me" },
		});
		fireEvent.click(getByRole("button", { name: "Create preset" }));

		rerender(
			<RecipeOptions allowedAlternates={[]} onChange={() => {}} />,
		);
		fireEvent.click(getByRole("button", { name: "Save as preset" }));
		fireEvent.click(getByLabelText("Overwrite existing preset"));
		const select = getByLabelText("Preset to overwrite");
		fireEvent.change(select, {
			target: {
				value: within(select).getByText("Overwrite me").getAttribute("value") ?? "",
			},
		});
		fireEvent.click(getByRole("button", { name: "Overwrite preset" }));
		expect(getByText("Preset saved")).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run the RecipeOptions tests to verify they fail**

Run:

```bash
npx vitest run src/features/calculator/RecipeOptions.test.tsx
```

Expected: FAIL because the current component renders the inline long list and has no manager dialog.

- [ ] **Step 3: Replace `RecipeOptions.tsx` with the compact panel and dialog**

Replace `src/features/calculator/RecipeOptions.tsx` with:

``	sx
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Tabs } from "#/components/ui/tabs";
import { getBuilding, getItem, listRecipes, listSchematics } from "#/data";
import {
	alternateSummary,
	applyPreset,
	deriveBuiltInPresets,
	groupAlternateRecipes,
	policyFromAllowed,
	toggleAlternate,
	type AlternatePolicyState,
	type AlternatePreset,
} from "./alternate-presets";

interface RecipeOptionsProps {
	allowedAlternates: string[];
	onChange: (allowed: string[]) => void;
	policy?: AlternatePolicyState;
	onPolicyChange?: (policy: AlternatePolicyState) => void;
	customPresets: AlternatePreset[];
	onSavePreset: (args:
		| { mode: "create"; name: string; recipeSlugs: string[] }
		| { mode: "overwrite"; id: string; name: string; recipeSlugs: string[] },
	) => AlternatePreset;
}

type ManagerTab = "presets" | "recipes" | "changes";
type SaveMode = "create" | "overwrite";

function recipeName(slug: string): string {
	return listRecipes().find((recipe) => recipe.slug === slug)?.name ?? slug;
}

function SavedPresetForm({
	customPresets,
	allowedAlternates,
	onSave,
}: {
	customPresets: AlternatePreset[];
	allowedAlternates: string[];
	onSave: (args:
		| { mode: "create"; name: string; recipeSlugs: string[] }
		| { mode: "overwrite"; id: string; name: string; recipeSlugs: string[] },
	) => void;
}) {
	const [mode, setMode] = useState<SaveMode>("create");
	const [name, setName] = useState("");
	const [selectedId, setSelectedId] = useState(customPresets[0]?.id ?? "");
	const selected = customPresets.find((preset) => preset.id === selectedId);
	const canOverwrite = mode === "overwrite" && selected;

	return (
		<div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3">
			<p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
				Save as preset
			</p>
			<label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
				<input
					type="radio"
					checked={mode === "create"}
					onChange={() => setMode("create")}
				/>
				Create new preset
			</label>
			<label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
				<input
					type="radio"
					aria-label="Overwrite existing preset"
					checked={mode === "overwrite"}
					onChange={() => setMode("overwrite")}
					disabled={customPresets.length === 0}
				/>
				Overwrite existing preset
			</label>
			{mode === "overwrite" ? (
				<select
					aria-label="Preset to overwrite"
					value={selectedId}
					onChange={(event) => {
						setSelectedId(event.target.value);
						const preset = customPresets.find(
							(candidate) => candidate.id === event.target.value,
						);
						setName(preset?.name ?? "");
					}}
					className="h-[var(--control-h-md)] rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm"
				>
					{customPresets.map((preset) => (
						<option key={preset.id} value={preset.id}>
							{preset.name}
						</option>
					))}
				</select>
			) : null}
			<Input
				aria-label="Preset name"
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder={selected?.name ?? "Preset name"}
			/>
			<Button
				type="button"
				size="sm"
				onClick={() => {
					if (canOverwrite) {
						onSave({
							mode: "overwrite",
							id: selected.id,
							name: name || selected.name,
							recipeSlugs: allowedAlternates,
						});
						return;
					}
					onSave({
						mode: "create",
						name,
						recipeSlugs: allowedAlternates,
					});
				}}
			>
				{canOverwrite ? "Overwrite preset" : "Create preset"}
			</Button>
		</div>
	);
}

export default function RecipeOptions({
	allowedAlternates,
	onChange,
	policy,
	onPolicyChange,
	customPresets,
	onSavePreset,
}: RecipeOptionsProps) {
	const [open, setOpen] = useState(false);
	const [saveOpen, setSaveOpen] = useState(false);
	const [tab, setTab] = useState<ManagerTab>("presets");
	const [query, setQuery] = useState("");
	const [savedMessage, setSavedMessage] = useState(false);
	const recipes = listRecipes();
	const schematics = listSchematics();
	const builtIns = useMemo(
		() => deriveBuiltInPresets(recipes, schematics),
		[recipes, schematics],
	);
	const presets = useMemo(
		() => [...builtIns, ...customPresets],
		[builtIns, customPresets],
	);
	const currentPolicy =
		policy ?? policyFromAllowed(allowedAlternates, presets);
	const summary = alternateSummary(currentPolicy, presets);
	const allowed = new Set(currentPolicy.allowedAlternates);
	const groups = groupAlternateRecipes(recipes, schematics)
		.map((group) => ({
			...group,
			recipes: group.recipes.filter((info) =>
				info.recipe.name.toLowerCase().includes(query.toLowerCase()),
			),
		}))
		.filter((group) => group.recipes.length > 0);

	const commitPolicy = (next: AlternatePolicyState) => {
		onPolicyChange?.(next);
		onChange(next.allowedAlternates);
	};

	const saveCurrent = (args:
		| { mode: "create"; name: string; recipeSlugs: string[] }
		| { mode: "overwrite"; id: string; name: string; recipeSlugs: string[] },
	) => {
		onSavePreset(args);
		setSavedMessage(true);
		setSaveOpen(false);
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3">
				<p className="font-semibold text-[var(--text-primary)]">{summary.label}</p>
				<p className="mt-1 text-sm text-[var(--text-muted)]">
					{summary.enabled} enabled
					{summary.excluded > 0 ? ` - ${summary.excluded} excluded` : ""}
				</p>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => setOpen(true)}
					aria-label="Manage alternates"
				>
					Manage
				</Button>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => setSaveOpen(true)}
					aria-label="Save as preset"
				>
					Save as preset
				</Button>
			</div>
			{savedMessage ? (
				<p className="text-xs text-[var(--green-400)]">Preset saved</p>
			) : null}

			<Dialog open={saveOpen} onOpenChange={setSaveOpen}>
				<DialogContent className="max-w-lg p-5">
					<DialogTitle className="font-[var(--font-display)] text-lg uppercase text-[var(--text-primary)]">
						Save alternate preset
					</DialogTitle>
					<DialogDescription className="mt-1 text-sm text-[var(--text-muted)]">
						Save the current concrete recipe selection.
					</DialogDescription>
					<div className="mt-4">
						<SavedPresetForm
							customPresets={customPresets}
							allowedAlternates={currentPolicy.allowedAlternates}
							onSave={saveCurrent}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[86vh] max-w-5xl overflow-y-auto p-0">
					<div className="border-b border-[var(--border-default)] p-5">
						<DialogTitle className="font-[var(--font-display)] text-xl uppercase text-[var(--text-primary)]">
							Manage alternates
						</DialogTitle>
						<DialogDescription className="mt-1 text-sm text-[var(--text-muted)]">
							Choose presets, search recipes, or review plan-local changes.
						</DialogDescription>
					</div>
					<div className="p-5">
						<Tabs
							items={[
								{ id: "presets", label: "Presets" },
								{ id: "recipes", label: "Recipes" },
								{ id: "changes", label: "Changes" },
							]}
							value={tab}
							onChange={(id) => setTab(id as ManagerTab)}
						/>
						{tab === "presets" ? (
							<div className="mt-4 grid gap-2 md:grid-cols-2">
								{presets.map((preset) => (
									<button
										key={preset.id}
										type="button"
										onClick={() => commitPolicy(applyPreset(preset.id, presets))}
										className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3 text-left hover:border-[var(--accent)]"
									>
										<span className="block font-semibold text-[var(--text-primary)]">
											{preset.name}
										</span>
										<span className="text-sm text-[var(--text-muted)]">
											{preset.recipeSlugs.length} alternates
										</span>
									</button>
								))}
							</div>
						) : null}
						{tab === "recipes" ? (
							<div className="mt-4 flex flex-col gap-4">
								<Input
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Filter alternates..."
									aria-label="Filter alternate recipes"
								/>
								{groups.map((group) => (
									<section key={group.id} className="flex flex-col gap-2">
										<h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
											{group.label}
										</h3>
										{group.recipes.map((info) => {
											const product = getItem(info.primaryProduct);
											const machine = info.machine
												? getBuilding(info.machine)
												: undefined;
											return (
												<div
													key={info.recipe.slug}
													className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3"
												>
													<Checkbox
														checked={allowed.has(info.recipe.slug)}
														onCheckedChange={() =>
															commitPolicy(
																toggleAlternate(
																	currentPolicy,
																	info.recipe.slug,
																	presets,
																),
															)
														}
														aria-label={info.recipe.name}
													/>
													<div>
														<p className="font-semibold text-[var(--text-primary)]">
															{info.recipe.name}
														</p>
														<p className="text-sm text-[var(--text-muted)]">
															{product?.name ?? info.primaryProduct}
															{machine ? ` - ${machine.name}` : ""}
														</p>
													</div>
													<span className="font-mono text-xs text-[var(--orange-400)]">
														{allowed.has(info.recipe.slug) ? "ON" : "OFF"}
													</span>
												</div>
											);
										})}
									</section>
								))}
							</div>
						) : null}
						{tab === "changes" ? (
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<section>
									<h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
										Excluded from preset
									</h3>
									{currentPolicy.excludedAlternates.length === 0 ? (
										<p className="mt-2 text-sm text-[var(--text-muted)]">
											No exclusions.
										</p>
									) : (
										currentPolicy.excludedAlternates.map((slug) => (
											<p key={slug} className="mt-2 text-sm text-[var(--text-primary)]">
												{recipeName(slug)}
											</p>
										))
									)}
								</section>
								<section>
									<h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
										Manually included
									</h3>
									{currentPolicy.includedAlternates.length === 0 ? (
										<p className="mt-2 text-sm text-[var(--text-muted)]">
											No manual inclusions.
										</p>
									) : (
										currentPolicy.includedAlternates.map((slug) => (
											<p key={slug} className="mt-2 text-sm text-[var(--text-primary)]">
												{recipeName(slug)}
											</p>
										))
									)}
								</section>
							</div>
						) : null}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
```

- [ ] **Step 4: Run the RecipeOptions tests**

Run:

```bash
npx vitest run src/features/calculator/RecipeOptions.test.tsx
```

Expected: PASS. If the overwrite-select test is brittle because jsdom does not expose `option[value]` as expected, simplify the test to assert that the overwrite radio and button render after creating a preset, then add a pure storage overwrite assertion in Task 2's hook test.

- [ ] **Step 5: Run formatter/check for the changed component**

Run:

```bash
npx biome check src/features/calculator/RecipeOptions.tsx src/features/calculator/RecipeOptions.test.tsx
```

Expected: PASS. If Biome reports formatting-only issues, run:

```bash
npx biome format --write src/features/calculator/RecipeOptions.tsx src/features/calculator/RecipeOptions.test.tsx
```

Then rerun the check command.

- [ ] **Step 6: Commit**

```bash
git add src/features/calculator/RecipeOptions.tsx src/features/calculator/RecipeOptions.test.tsx
git commit -m "feat: add alternate recipe manager dialog"
```

---

### Task 4: Used Alternates Review and Calculator Wiring

**Files:**
- Create: `src/features/calculator/UsedAlternatesReview.tsx`
- Test: `src/features/calculator/UsedAlternatesReview.test.tsx`
- Modify: `src/features/calculator/CalculatorPage.tsx`

- [ ] **Step 1: Write the failing UsedAlternatesReview tests**

Create `src/features/calculator/UsedAlternatesReview.test.tsx`:

``	sx
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UsedAlternatesReview from "./UsedAlternatesReview";
import type { Solution } from "./solver";

const solution: Solution = {
	status: "optimal",
	recipes: [
		{
			recipe: "recipe-alternate-coatedironplate-c",
			machines: 1,
			building: "constructor",
		},
		{ recipe: "recipe-ironplate-c", machines: 1, building: "constructor" },
	],
	outputs: [],
	rawInputs: [],
	providedInputs: [],
	byproducts: [],
	flows: [],
	power: 4,
	buildCost: [],
};

describe("UsedAlternatesReview", () => {
	it("renders only alternate recipes used by the solution", () => {
		const { getByText, queryByText } = render(
			<UsedAlternatesReview
				solution={solution}
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onToggle={() => {}}
			/>,
		);
		expect(getByText("Used alternates")).toBeTruthy();
		expect(getByText(/Coated/i)).toBeTruthy();
		expect(queryByText("Iron Plate")).toBeNull();
	});

	it("calls onToggle when a used alternate is unchecked", () => {
		const onToggle = vi.fn();
		const { getByLabelText } = render(
			<UsedAlternatesReview
				solution={solution}
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onToggle={onToggle}
			/>,
		);
		fireEvent.click(getByLabelText(/Coated/i));
		expect(onToggle).toHaveBeenCalledWith("recipe-alternate-coatedironplate-c");
	});

	it("renders nothing when no alternates are used", () => {
		const { container } = render(
			<UsedAlternatesReview
				solution={{ ...solution, recipes: [solution.recipes[1]] }}
				allowedAlternates={[]}
				onToggle={() => {}}
			/>,
		);
		expect(container.textContent).toBe("");
	});
});
```

- [ ] **Step 2: Run the UsedAlternatesReview tests to verify they fail**

Run:

```bash
npx vitest run src/features/calculator/UsedAlternatesReview.test.tsx
```

Expected: FAIL because `./UsedAlternatesReview` does not exist.

- [ ] **Step 3: Implement `UsedAlternatesReview.tsx`**

Create `src/features/calculator/UsedAlternatesReview.tsx`:

``	sx
import { Checkbox } from "#/components/ui/checkbox";
import { getBuilding, getItem, getRecipe } from "#/data";
import type { Solution } from "./solver";

interface UsedAlternatesReviewProps {
	solution: Solution;
	allowedAlternates: string[];
	onToggle: (recipeSlug: string) => void;
}

export default function UsedAlternatesReview({
	solution,
	allowedAlternates,
	onToggle,
}: UsedAlternatesReviewProps) {
	if (solution.status !== "optimal") return null;
	const allowed = new Set(allowedAlternates);
	const usedAlternates = solution.recipes
		.map((usage) => getRecipe(usage.recipe))
		.filter((recipe) => recipe?.alternate);

	if (usedAlternates.length === 0) return null;

	return (
		<section className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-4">
			<div className="mb-3">
				<h3 className="font-[var(--font-display)] text-sm uppercase tracking-[0.06em] text-[var(--text-primary)]">
					Used alternates
				</h3>
				<p className="mt-1 text-sm text-[var(--text-muted)]">
					Uncheck a recipe to exclude it and re-solve this plan.
				</p>
			</div>
			<div className="flex flex-col gap-2">
				{usedAlternates.map((recipe) => {
					const productSlug = recipe.products[0]?.item;
					const product = productSlug ? getItem(productSlug) : undefined;
					const machineSlug = recipe.producedIn[0];
					const machine = machineSlug ? getBuilding(machineSlug) : undefined;
					return (
						<div
							key={recipe.slug}
							className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2"
						>
							<Checkbox
								checked={allowed.has(recipe.slug)}
								onCheckedChange={() => onToggle(recipe.slug)}
								aria-label={recipe.name}
							/>
							<div>
								<p className="text-sm font-semibold text-[var(--text-primary)]">
									{recipe.name}
								</p>
								<p className="text-xs text-[var(--text-muted)]">
									{product?.name ?? productSlug ?? "Unknown product"}
									{machine ? ` - ${machine.name}` : ""}
								</p>
							</div>
							<span className="font-mono text-xs text-[var(--orange-400)]">
								ACTIVE
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}
```

- [ ] **Step 4: Run the UsedAlternatesReview tests to verify they pass**

Run:

```bash
npx vitest run src/features/calculator/UsedAlternatesReview.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Modify `CalculatorPage.tsx` to own policy state and render the review**

Apply these changes to `src/features/calculator/CalculatorPage.tsx`:

``	sx
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "#/components/ui/panel";
import { Stat } from "#/components/ui/stat";
import { getItem, listRecipes, listSchematics } from "#/data";
import SaveAsFactoryButton from "#/features/factories/SaveAsFactoryButton";
import { formatNumber, formatPower } from "#/lib/format";
import {
	deriveBuiltInPresets,
	policyFromAllowed,
	validAlternateRecipeSlugs,
	toggleAlternate,
	type AlternatePolicyState,
} from "./alternate-presets";
import AvailableInputsEditor from "./AvailableInputsEditor";
import CalculatorControls, { WEIGHTING_PRESETS } from "./CalculatorControls";
import { decodePlan, encodePlan } from "./plan-codec";
import RecipeOptions from "./RecipeOptions";
import { useAlternatePresets } from "./useAlternatePresets";
import ResultTabs from "./ResultTabs";
import type { AvailableInput, ProblemSpec, Target } from "./solver";
import TargetEditor from "./TargetEditor";
import UsedAlternatesReview from "./UsedAlternatesReview";
import { useSolver } from "./useSolver";

type Weighting = "balanced" | "minimize-ore";

const name = (s: string) => getItem(s)?.name ?? s;

export default function CalculatorPage() {
	const search = useSearch({ strict: false }) as {
		plan?: string;
		game?: string;
		factory?: string;
	};
	const navigate = useNavigate();

	const [initial] = useState(() =>
		typeof search.plan === "string" ? decodePlan(search.plan) : undefined,
	);
	const [roundTrip] = useState(() => ({
		game: search.game,
		factory: search.factory,
	}));
	const recipes = useMemo(() => listRecipes(), []);
	const schematics = useMemo(() => listSchematics(), []);
	const builtInPresets = useMemo(
		() => deriveBuiltInPresets(recipes, schematics),
		[recipes, schematics],
	);
	const validAlternateSlugs = useMemo(
		() => validAlternateRecipeSlugs(recipes),
		[recipes],
	);
	const { customPresets, savePreset } = useAlternatePresets(validAlternateSlugs);
	const allPresets = useMemo(
		() => [...builtInPresets, ...customPresets],
		[builtInPresets, customPresets],
	);
	const [targets, setTargets] = useState<Target[]>(initial?.targets ?? []);
	const [availableInputs, setAvailableInputs] = useState<AvailableInput[]>(
		initial?.availableInputs ?? [],
	);
	const [alternatePolicy, setAlternatePolicy] = useState<AlternatePolicyState>(
		() => policyFromAllowed(initial?.allowedAlternates ?? [], builtInPresets),
	);
	const [mode, setMode] = useState<"produce" | "maximize">(
		initial?.mode ?? "produce",
	);
	const [weighting, setWeighting] = useState<Weighting>(
		initial?.resourceWeights ? "minimize-ore" : "balanced",
	);

	const allowedAlternates = alternatePolicy.allowedAlternates;
	const setAllowedAlternates = (next: string[]) => {
		setAlternatePolicy(policyFromAllowed(next, allPresets));
	};
	const spec: ProblemSpec = {
		mode,
		targets,
		availableInputs,
		allowedAlternates,
		resourceWeights: WEIGHTING_PRESETS[weighting],
	};
	const { solution, solving } = useSolver(spec);

	const planParam = targets.length > 0 ? encodePlan(spec) : undefined;
	useEffect(() => {
		navigate({
			to: "/calculator",
			search: {
				...(planParam ? { plan: planParam } : {}),
				...(roundTrip.game ? { game: roundTrip.game } : {}),
				...(roundTrip.factory ? { factory: roundTrip.factory } : {}),
			},
			replace: true,
		});
	}, [planParam, navigate, roundTrip]);

	return (
		<div className="mx-auto grid max-w-[1320px] grid-cols-[332px_1fr] items-start gap-6 px-7 pb-[60px] pt-6">
			<div className="flex flex-col gap-[18px]">
				<Panel className="p-[18px]">
					<CalculatorControls
						mode={mode}
						onModeChange={setMode}
						weighting={weighting}
						onWeightingChange={setWeighting}
					/>
				</Panel>
				<Panel title="Targets">
					<div className="p-4">
						<TargetEditor targets={targets} onChange={setTargets} />
					</div>
				</Panel>
				<Panel title="Available Inputs">
					<div className="p-4">
						<AvailableInputsEditor
							inputs={availableInputs}
							onChange={setAvailableInputs}
						/>
					</div>
				</Panel>
				<Panel title="Alternate Recipes">
					<div className="p-4">
						<RecipeOptions
							allowedAlternates={allowedAlternates}
							onChange={setAllowedAlternates}
							policy={alternatePolicy}
							onPolicyChange={setAlternatePolicy}
							customPresets={customPresets}
							onSavePreset={savePreset}
						/>
					</div>
				</Panel>
			</div>
			<div className="flex min-w-0 flex-col gap-[18px]">
				{targets.length === 0 ? (
					<Panel className="p-8">
						<p className="text-center text-[13px] text-[var(--text-muted)]">
							{mode === "maximize"
								? "Add a target item and an available input to maximize output."
								: "Add a target item to plan a production line."}
						</p>
					</Panel>
				) : solving && !solution ? (
					<Panel className="p-8">
						<p className="text-center text-[13px] text-[var(--text-muted)]">
							Solving...
						</p>
					</Panel>
				) : solution ? (
					<>
						{solution.status !== "infeasible" && (
							<div className="grid grid-cols-4 gap-3.5">
								<Panel topRail className="px-[18px] py-[15px]">
									<Stat
										label="Total Power"
										value={formatPower(solution.power).replace(/\s*MW$/, "")}
										unit="MW"
									/>
								</Panel>
								<Panel className="px-[18px] py-[15px]">
									<Stat
										label="Machines"
										value={String(
											solution.recipes.reduce(
												(s, u) => s + Math.ceil(u.machines),
												0,
											),
										)}
									/>
								</Panel>
								<Panel className="px-[18px] py-[15px]">
									<Stat
										label={
											solution.rawInputs[0]
												? name(solution.rawInputs[0].item)
												: "Raw inputs"
										}
										value={
											solution.rawInputs[0]
												? formatNumber(solution.rawInputs[0].rate)
												: "0"
										}
										unit="/min"
									/>
								</Panel>
								<Panel className="px-[18px] py-[15px]">
									<Stat
										label="Byproducts"
										value={String(solution.byproducts.length)}
									/>
								</Panel>
							</div>
						)}
						<UsedAlternatesReview
							solution={solution}
							allowedAlternates={allowedAlternates}
							onToggle={(recipeSlug) =>
								setAlternatePolicy((current) =>
									toggleAlternate(current, recipeSlug, allPresets),
								)
							}
						/>
						<Panel>
							<div className="px-[18px] pt-2.5">
								<ResultTabs solution={solution} />
							</div>
							<div className="flex justify-end px-[18px] pb-3">
								<SaveAsFactoryButton
									spec={spec}
									solution={solution}
									game={roundTrip.game}
									factory={roundTrip.factory}
								/>
							</div>
						</Panel>
					</>
				) : null}
			</div>
		</div>
	);
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npx vitest run src/features/calculator/UsedAlternatesReview.test.tsx src/features/calculator/RecipeOptions.test.tsx src/features/calculator/plan-codec.test.ts
```

Expected: PASS. The plan codec tests should remain unchanged because URLs still encode only concrete `allowedAlternates`.

- [ ] **Step 7: Commit**

```bash
git add src/features/calculator/CalculatorPage.tsx src/features/calculator/UsedAlternatesReview.tsx src/features/calculator/UsedAlternatesReview.test.tsx
git commit -m "feat: review used alternate recipes after solving"
```

---

### Task 5: Full Verification and Manual Smoke

**Files:**
- No planned source edits. Commit any formatting-only fallout if needed.

- [ ] **Step 1: Run the calculator-focused test suite**

Run:

```bash
npx vitest run src/features/calculator/alternate-presets.test.ts src/features/calculator/useAlternatePresets.test.tsx src/features/calculator/RecipeOptions.test.tsx src/features/calculator/UsedAlternatesReview.test.tsx src/features/calculator/plan-codec.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run project check**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Manual browser smoke on `/calculator`**

Use the running dev app or start it with:

```bash
npm run dev
```

In the browser:

1. Open `/calculator`.
2. Confirm the left rail `Alternate Recipes` panel shows a compact summary, not the long list.
3. Click `Manage`, choose `All alternates`, and confirm the enabled count changes.
4. Switch to `Recipes`, search `coated`, and confirm matching alternate rows are shown.
5. Add target `Iron Plate` or `Reinforced Iron Plate` and solve.
6. If the solution uses alternates, confirm the `Used alternates` block appears above result tabs.
7. Uncheck one used alternate and confirm the URL `plan=` changes and the solve refreshes.
8. If another alternate appears after the refresh, uncheck it and confirm the earlier exclusion remains off.
9. Click `Save as preset`, create a preset, reload the page, open `Manage`, and confirm the preset persists.
10. Save again using overwrite mode and confirm the preset list still has a single updated preset.

- [ ] **Step 5: Commit any final formatting/test adjustments**

If Step 2 or Step 3 required formatting or test-only adjustments, commit them:

```bash
git add src/features/calculator
git commit -m "test: verify alternate recipe workflow"
```

If there are no final adjustments, do not create an empty commit.

