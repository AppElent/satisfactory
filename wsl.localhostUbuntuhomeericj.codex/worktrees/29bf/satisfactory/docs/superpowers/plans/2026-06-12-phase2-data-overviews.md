# Phase 2: Data Overviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five `/data/*` placeholders with real, searchable, filterable, cross-linked overviews (list + detail pages) for items, recipes, buildings, buildables, and schematics — with vendored game icons.

**Architecture:** A build-time icon-vendoring script downloads the community icon set into `public/icons/`. The Phase 1 schematic schema gains the `icon` field it dropped. New pure query helpers (`src/data/queries.ts`) derive cross-references (build costs, unlock sources, alternates) on top of the Phase 1 access layer. A small set of shared, config-driven UI components (`EntityIcon`, `SearchFilterBar`, `EntityCardGrid`, a generic `EntityListPage`) render all five list pages from per-entity config objects; detail pages are bespoke per entity. All list state (search + filters) lives in typed URL search params.

**Tech Stack:** TanStack Start/Router (typed search params, file routes), React 19, Zod 4, Vitest 4, Tailwind 4 + shadcn, lucide-react, Biome (tabs/double-quotes), Node (runs `.ts` scripts natively).

**Spec:** `docs/superpowers/specs/2026-06-12-satisfactory-webapp-design.md` (Section 3)

---

## Verified facts (already inspected — do not re-derive)

**Icons.** Source: `https://raw.githubusercontent.com/greeny/SatisfactoryTools/master/www/assets/images/items/{icon}_64.png` (also `_256.png`, not used in Phase 2). The `{icon}` token equals the `icon` field already in our generated data (e.g. `desc-constructormk1-c`). Union of all referenced icons across items + buildings + buildables + schematics = **1112 unique** slugs; a 64px PNG is ~5KB → ~5.5MB total committed under `public/icons/`. Coverage: items/buildings/buildables 100%; schematics 100% **after** adding `icon` to the schematic schema (Phase 1 dropped it). One source item icon edge: every referenced icon resolves — but the vendor script must still tolerate an occasional 404 (skip + warn) so a future data bump can't break the build.

**Schematic icon gap.** Phase 1's `schematicSchema` has no `icon` field, though the source `schematics[].icon` is present and non-empty for all 437. Task 2 adds it.

**Detail-page derivations (all confirmed against generated data):**
- Build cost: every building (20/20) and buildable (480/480) is the product of exactly the recipe that constructs it; `getRecipesProducing(slug)` returns it (e.g. `constructor` ← `recipe-constructormk1-c` = 2 `reinforced-iron-plate` + 8 `cable`). The build recipe has `forBuilding: true`.
- Item produced-by / used-in: `getRecipesProducing(itemSlug)` / `getRecipesUsing(itemSlug)` (Phase 1).
- Unlock source: a schematic unlocks an item when any slug in `schematic.unlockRecipes` is a recipe that produces the item. Base recipes (tier-0) have no unlocking schematic → "Available from the start". (Verified: `iron-plate`'s standard recipe has no unlocker; its two alternates are unlocked by `alternate-coated-iron-plate`, `alternate-steel-cast-plate`.)
- Recipe per-minute rate: `amount * 60 / time` per ingredient/product.
- Schematics carry `type` (`EST_Milestone`, `EST_MAM`, `EST_Alternate`, `EST_ResourceSink`, `EST_Tutorial`, …), `tier`, `mam`, `alternate`, `cost[]`, `unlockRecipes[]`, `requiredSchematics[]`.

**Entity fields available (Phase 1 `src/data/schema.ts`):**
- Item: slug, className, name, description, icon, form (`solid`|`fluid`), stackSize, sinkPoints, energyValue, radioactiveDecay
- Recipe: slug, className, name, alternate, time, ingredients[{item,amount}], products[{item,amount}], producedIn[buildingSlug], forBuilding, inMachine, inHand, inWorkshop, isVariablePower, minPower, maxPower
- Building: slug, className, name, description, icon, powerConsumption, powerConsumptionExponent, manufacturingSpeed, size
- Buildable: slug, className, name, description, icon, categories[], size
- Schematic: slug, className, name, type, tier, cost[{item,amount}], unlockRecipes[], requiredSchematics[], mam, alternate (+ `icon` after Task 2)

**Environment facts:**
- All CI gates must pass at the end of every group: `npm run check` (Biome, 0 errors), `npm run typecheck` (tsc, 0 errors), `npm test` (vitest), `npm run build`. Run `npx biome check --write .` before each commit.
- `src/data/generated/**` is excluded from Biome (machine-owned). After editing `scripts/lib/transform.ts` or the schema, regenerate with `npm run generate-data` and commit the result.
- `public/**` is NOT in Biome scope — vendored icons won't be linted.
- Dev server: `npm run dev` may bind 3001/3002 if 3000 is taken; read the actual port from output. After running dev/build, `git checkout -- src/routeTree.gen.ts` if it churned, or commit the build-accurate version (it includes a `@tanstack/react-start` Register augmentation the `tsr generate` CLI omits).
- TanStack file routes for detail pages use the `data/$entity.$slug.tsx` flat-file convention or nested folders. This plan uses flat files: `src/routes/data/items.$slug.tsx` → path `/data/items/$slug`. Run `npm run generate-routes` (or let dev/build regenerate) after adding routes.
- `searchEntities` and the list/detail pages may run during SSR — keep all data access synchronous and pure (it already is).

---

## File structure

```
scripts/vendor-icons.ts                  # download referenced icons → public/icons/
public/icons/<slug>.png                  # 1112 committed 64px icons (Task 1)
src/data/schema.ts                       # + icon on schematicSchema (Task 2)
scripts/lib/transform.ts                 # map schematic icon (Task 2)
src/data/generated/schematics.json       # regenerated (Task 2)
src/data/queries.ts                      # derived cross-reference helpers (Task 3)
src/data/queries.test.ts
src/lib/format.ts                        # rate/number/power formatting (Task 4)
src/lib/format.test.ts
src/components/EntityIcon.tsx            # icon with fallback (Task 5)
src/components/data/SearchFilterBar.tsx # search + filter chips, URL-synced (Task 6)
src/components/data/EntityCardGrid.tsx  # responsive card grid (Task 6)
src/features/data/list-config.ts        # EntityListConfig<T> + FilterDef types (Task 7)
src/features/data/EntityListPage.tsx    # generic list page (Task 7)
src/features/data/configs/items.tsx      # per-entity list config (Tasks 8,10,12,14,16)
src/features/data/configs/recipes.tsx
src/features/data/configs/buildings.tsx
src/features/data/configs/buildables.tsx
src/features/data/configs/schematics.tsx
src/components/data/DetailLayout.tsx    # shared detail header/section scaffold (Task 9)
src/routes/data/items.tsx               # list route (rewrite, Task 8)
src/routes/data/items.$slug.tsx         # detail route (Task 9)
  …recipes / buildings / buildables / schematics equivalents (Tasks 10-17)
```

---

### Task 1: Vendor the icon set

**Files:**
- Create: `scripts/vendor-icons.ts`
- Modify: `package.json` (script)
- Generated: `public/icons/*.png` (committed)

- [ ] **Step 1: Create `scripts/vendor-icons.ts`**

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE =
	"https://raw.githubusercontent.com/greeny/SatisfactoryTools/master/www/assets/images/items";
const OUT = "public/icons";
const GEN = "src/data/generated";

function iconsFrom(file: string): string[] {
	const arr = JSON.parse(readFileSync(`${GEN}/${file}`, "utf8")) as Array<{
		icon?: string;
	}>;
	return arr.map((e) => e.icon).filter((i): i is string => Boolean(i));
}

const slugs = new Set<string>([
	...iconsFrom("items.json"),
	...iconsFrom("buildings.json"),
	...iconsFrom("buildables.json"),
	...iconsFrom("schematics.json"),
]);

mkdirSync(OUT, { recursive: true });
let downloaded = 0;
let skipped = 0;
const failed: string[] = [];

for (const slug of slugs) {
	const dest = `${OUT}/${slug}.png`;
	if (existsSync(dest)) {
		skipped++;
		continue;
	}
	const res = await fetch(`${BASE}/${slug}_64.png`);
	if (!res.ok) {
		failed.push(slug);
		continue;
	}
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(dest, buf);
	downloaded++;
}

console.log(`downloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed.length}`);
for (const f of failed) console.warn(`  no image for ${f}`);
if (failed.length > 20) {
	console.error("Too many missing icons — aborting (data/source mismatch?)");
	process.exit(1);
}
```

(Note: this script runs AFTER Task 2 regenerates `schematics.json` with icons. If run before, schematic icons are simply absent from the set and get vendored in a later run — re-running is idempotent via the `existsSync` skip.)

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, after `"generate-data"`, add:

```json
"vendor-icons": "node scripts/vendor-icons.ts"
```

- [ ] **Step 3: Defer running until after Task 2**

Do NOT run `vendor-icons` yet — run it in Task 2 Step 6 once schematic icons exist, so all 1112 icons are fetched in one pass. Commit the script + package.json now:

```bash
npx biome check --write . && git add scripts/vendor-icons.ts package.json && git commit -m "feat: icon vendoring script"
```

---

### Task 2: Add `icon` to schematics + vendor all icons

**Files:**
- Modify: `src/data/schema.ts`
- Modify: `scripts/lib/transform.ts`
- Modify: `scripts/lib/transform.test.ts`
- Generated: `src/data/generated/schematics.json`, `public/icons/*.png`

- [ ] **Step 1: Add `icon` to `schematicSchema` in `src/data/schema.ts`**

In `schematicSchema`, add `icon: z.string(),` immediately after the `name` field:

```ts
export const schematicSchema = z.object({
	slug: z.string(),
	className: z.string(),
	name: z.string(),
	icon: z.string(),
	type: z.string(),
	// …rest unchanged
```

- [ ] **Step 2: Map it in `scripts/lib/transform.ts`**

In the schematics `.map((s) => { … return { … } })`, add `icon: s.icon,` after `name: s.name,`:

```ts
			return {
				slug: schematicSlugs.get(s.className) as string,
				className: s.className,
				name: s.name,
				icon: s.icon,
				type: s.type,
				// …rest unchanged
```

- [ ] **Step 3: Extend the schematic fixture in `scripts/lib/transform.test.ts`**

The `schematic()` helper builds source objects (which already include `icon: slug`), so the source side is fine. Add one assertion to the existing "transform on the real vendored data" → "produces the expected entity counts" test, OR add a focused test. Add this test inside the first `describe("transform", …)` block, after the cost test:

```ts
	it("carries the schematic icon through", () => {
		const { data } = transform(fixture());
		expect(data.schematics[0]?.icon).toBe("tier-1");
	});
```

- [ ] **Step 4: Run transform tests to verify they pass**

Run: `npx vitest run scripts/lib/transform.test.ts`
Expected: all pass (the new test asserts the fixture schematic's `icon` slug `tier-1` survives).

- [ ] **Step 5: Regenerate data**

Run: `npm run generate-data`
Expected: same counts as before (`schematics: 437`, `warnings: 99`), now with `icon` on every schematic. Spot-check: `node -e "console.log(require('./src/data/generated/schematics.json')[0].icon)"` prints a non-empty slug.

- [ ] **Step 6: Vendor all icons**

Run: `npm run vendor-icons`
Expected: `downloaded: 1112, skipped: 0, failed: 0` (on a clean checkout). If re-run, `skipped` rises and `downloaded` falls — idempotent. `failed` must be 0 (or the script exits non-zero if >20).

- [ ] **Step 7: Verify and commit**

Run: `node -e "const fs=require('fs');console.log('icons on disk:',fs.readdirSync('public/icons').length)"`
Expected: 1112.

```bash
npx biome check --write . && git add -A && git commit -m "feat: schematic icons + vendored icon assets"
```

(`public/icons/**` is outside Biome; the schema/transform/test/generated changes are covered.)

---

### Task 3: Derived query helpers

**Files:**
- Create: `src/data/queries.ts`
- Test: `src/data/queries.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/data/queries.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/data/queries.test.ts`
Expected: FAIL — cannot resolve `./queries`.

- [ ] **Step 3: Implement `src/data/queries.ts`**

```ts
import {
	getRecipesProducing,
	listSchematics,
} from "./index";
import type { Recipe, Schematic } from "./schema";

/** The recipe that constructs a building/buildable (its build cost), if any. */
export function getBuildCost(slug: string): Recipe | undefined {
	return getRecipesProducing(slug).find((r) => r.forBuilding) ??
		getRecipesProducing(slug)[0];
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
	const recipeSlugs = new Set(
		getRecipesProducing(itemSlug).map((r) => r.slug),
	);
	if (recipeSlugs.size === 0) return [];
	return listSchematics().filter((s) =>
		s.unlockRecipes.some((rs) => recipeSlugs.has(rs)),
	);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/data/queries.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: derived cross-reference query helpers"
```

---

### Task 4: Formatting utilities

**Files:**
- Create: `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { perMinute, formatNumber, formatPower } from "./format";

describe("format", () => {
	it("computes per-minute rate from amount and craft time", () => {
		// 2 plates per 6s craft = 20/min
		expect(perMinute(2, 6)).toBe(20);
	});

	it("rounds per-minute to at most 4 significant decimals", () => {
		expect(perMinute(1, 3)).toBeCloseTo(20, 5);
	});

	it("formats numbers without trailing float noise", () => {
		expect(formatNumber(0.1 + 0.2)).toBe("0.3");
		expect(formatNumber(1000)).toBe("1,000");
		expect(formatNumber(7.5)).toBe("7.5");
	});

	it("formats power in MW", () => {
		expect(formatPower(4)).toBe("4 MW");
		expect(formatPower(0)).toBe("0 MW");
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — cannot resolve `./format`.

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
/** Items produced/consumed per minute for a recipe craft. */
export function perMinute(amount: number, craftTimeSeconds: number): number {
	if (craftTimeSeconds === 0) return 0;
	return (amount * 60) / craftTimeSeconds;
}

const numberFormat = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 4,
});

/** Human number: thousands separators, no float noise, ≤4 decimals. */
export function formatNumber(value: number): string {
	return numberFormat.format(value);
}

/** Power in megawatts. */
export function formatPower(megawatts: number): string {
	return `${formatNumber(megawatts)} MW`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/format.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: number/rate/power formatting helpers"
```

---

### Task 5: EntityIcon component

**Files:**
- Create: `src/components/EntityIcon.tsx`
- Test: `src/components/EntityIcon.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/EntityIcon.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EntityIcon from "./EntityIcon";

describe("EntityIcon", () => {
	it("renders an img pointing at the vendored icon path", () => {
		const { getByRole } = render(<EntityIcon icon="desc-ironplate-c" name="Iron Plate" />);
		const img = getByRole("img") as HTMLImageElement;
		expect(img.getAttribute("src")).toBe("/icons/desc-ironplate-c.png");
		expect(img.getAttribute("alt")).toBe("Iron Plate");
	});

	it("renders a placeholder when icon is missing", () => {
		const { container } = render(<EntityIcon name="Mystery" />);
		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toContain("M");
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/EntityIcon.test.tsx`
Expected: FAIL — cannot resolve `./EntityIcon`.

- [ ] **Step 3: Implement `src/components/EntityIcon.tsx`**

```tsx
interface EntityIconProps {
	icon?: string;
	name: string;
	size?: number;
	className?: string;
}

export default function EntityIcon({
	icon,
	name,
	size = 40,
	className,
}: EntityIconProps) {
	if (!icon) {
		return (
			<span
				aria-hidden
				className={`inline-flex items-center justify-center rounded-md bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] ${className ?? ""}`}
				style={{ width: size, height: size, fontSize: size * 0.45 }}
			>
				{name.charAt(0).toUpperCase()}
			</span>
		);
	}
	return (
		<img
			src={`/icons/${icon}.png`}
			alt={name}
			width={size}
			height={size}
			loading="lazy"
			className={className}
		/>
	);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/EntityIcon.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: EntityIcon with fallback"
```

---

### Task 6: SearchFilterBar + EntityCardGrid

**Files:**
- Create: `src/components/data/SearchFilterBar.tsx`
- Create: `src/components/data/EntityCardGrid.tsx`
- Test: `src/components/data/SearchFilterBar.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/data/SearchFilterBar.test.tsx`:

```tsx
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchFilterBar from "./SearchFilterBar";

describe("SearchFilterBar", () => {
	it("calls onSearchChange when typing", () => {
		const onSearchChange = vi.fn();
		const { getByRole } = render(
			<SearchFilterBar
				search=""
				onSearchChange={onSearchChange}
				filters={[]}
			/>,
		);
		fireEvent.change(getByRole("searchbox"), { target: { value: "iron" } });
		expect(onSearchChange).toHaveBeenCalledWith("iron");
	});

	it("renders filter chips and toggles them", () => {
		const onFilterChange = vi.fn();
		const { getByText } = render(
			<SearchFilterBar
				search=""
				onSearchChange={() => {}}
				filters={[
					{
						key: "form",
						label: "Form",
						options: [
							{ value: "solid", label: "Solid" },
							{ value: "fluid", label: "Fluid" },
						],
						selected: "solid",
						onChange: onFilterChange,
					},
				]}
			/>,
		);
		fireEvent.click(getByText("Fluid"));
		expect(onFilterChange).toHaveBeenCalledWith("fluid");
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/data/SearchFilterBar.test.tsx`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement `src/components/data/SearchFilterBar.tsx`**

```tsx
export interface FilterOption {
	value: string;
	label: string;
}

export interface FilterControl {
	key: string;
	label: string;
	options: FilterOption[];
	/** Currently selected value, or "" for "all". */
	selected: string;
	onChange: (value: string) => void;
}

interface SearchFilterBarProps {
	search: string;
	onSearchChange: (value: string) => void;
	filters: FilterControl[];
}

export default function SearchFilterBar({
	search,
	onSearchChange,
	filters,
}: SearchFilterBarProps) {
	return (
		<div className="flex flex-col gap-3">
			<input
				type="search"
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
				placeholder="Search…"
				className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]"
			/>
			{filters.map((filter) => (
				<div key={filter.key} className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
						{filter.label}
					</span>
					<Chip
						label="All"
						active={filter.selected === ""}
						onClick={() => filter.onChange("")}
					/>
					{filter.options.map((option) => (
						<Chip
							key={option.value}
							label={option.label}
							active={filter.selected === option.value}
							onClick={() => filter.onChange(option.value)}
						/>
					))}
				</div>
			))}
		</div>
	);
}

function Chip({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
				active
					? "border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)]"
					: "border-[var(--line)] text-[var(--sea-ink-soft)] hover:border-[var(--chip-line)]"
			}`}
		>
			{label}
		</button>
	);
}
```

- [ ] **Step 4: Implement `src/components/data/EntityCardGrid.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface EntityCardGridItem {
	slug: string;
	to: string;
	params: Record<string, string>;
	content: ReactNode;
}

interface EntityCardGridProps {
	items: EntityCardGridItem[];
	emptyMessage?: string;
}

export default function EntityCardGrid({
	items,
	emptyMessage = "Nothing matches your filters.",
}: EntityCardGridProps) {
	if (items.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				{emptyMessage}
			</p>
		);
	}
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
			{items.map((item) => (
				<Link
					key={item.slug}
					to={item.to}
					params={item.params}
					className="flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 text-center no-underline transition hover:border-[var(--chip-line)]"
				>
					{item.content}
				</Link>
			))}
		</div>
	);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/data/SearchFilterBar.test.tsx`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: SearchFilterBar and EntityCardGrid"
```

---

### Task 7: Generic EntityListPage + config types

**Files:**
- Create: `src/features/data/list-config.ts`
- Create: `src/features/data/EntityListPage.tsx`

- [ ] **Step 1: Create `src/features/data/list-config.ts`**

```ts
import type { ReactNode } from "react";

export interface FilterDef<T> {
	/** URL search-param key. */
	key: string;
	label: string;
	options: { value: string; label: string }[];
	/** Returns true when the entity matches the selected value. */
	matches: (entity: T, value: string) => boolean;
}

export interface EntityListConfig<T extends { slug: string }> {
	/** Detail route, e.g. "/data/items/$slug". */
	detailTo: string;
	/** All entities of this type. */
	getAll: () => T[];
	/** Lowercased text searched against the query. */
	searchText: (entity: T) => string;
	filters: FilterDef<T>[];
	/** Card body for the grid. */
	renderCard: (entity: T) => ReactNode;
}
```

- [ ] **Step 2: Create `src/features/data/EntityListPage.tsx`**

```tsx
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import EntityCardGrid from "#/components/data/EntityCardGrid";
import SearchFilterBar from "#/components/data/SearchFilterBar";
import type { EntityListConfig } from "./list-config";

interface EntityListPageProps<T extends { slug: string }> {
	config: EntityListConfig<T>;
	/** The route id whose search params back this page (for useSearch/navigate). */
	routeId: string;
}

export default function EntityListPage<T extends { slug: string }>({
	config,
	routeId,
}: EntityListPageProps<T>) {
	// Search params are typed per-route; index by key generically here.
	const search = useSearch({ strict: false }) as Record<string, string>;
	const navigate = useNavigate();
	const query = search.q ?? "";

	const setParam = (key: string, value: string) => {
		navigate({
			to: ".",
			search: (prev: Record<string, unknown>) => ({
				...prev,
				[key]: value === "" ? undefined : value,
			}),
			replace: true,
		});
	};

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();
		return config.getAll().filter((entity) => {
			if (q && !config.searchText(entity).toLowerCase().includes(q)) {
				return false;
			}
			for (const filter of config.filters) {
				const selected = search[filter.key] ?? "";
				if (selected && !filter.matches(entity, selected)) return false;
			}
			return true;
		});
	}, [config, query, search]);

	return (
		<div className="flex flex-col gap-5">
			<SearchFilterBar
				search={query}
				onSearchChange={(v) => setParam("q", v)}
				filters={config.filters.map((filter) => ({
					key: filter.key,
					label: filter.label,
					options: filter.options,
					selected: search[filter.key] ?? "",
					onChange: (v) => setParam(filter.key, v),
				}))}
			/>
			<p className="text-xs text-[var(--sea-ink-soft)]">
				{results.length} result{results.length === 1 ? "" : "s"}
			</p>
			<EntityCardGrid
				items={results.map((entity) => ({
					slug: entity.slug,
					to: config.detailTo,
					params: { slug: entity.slug },
					content: config.renderCard(entity),
				}))}
			/>
		</div>
	);
}
```

(`routeId` is accepted for clarity/forward use; `useSearch({ strict: false })` reads the active route's params without coupling the generic component to one route's types.)

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: 0 errors. (No test yet — exercised by the entity list pages next; if `useSearch({ strict: false })` typing complains, cast as shown.)

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: generic EntityListPage and list config types"
```

---

### Task 8: Items list page

**Files:**
- Create: `src/features/data/configs/items.tsx`
- Modify: `src/routes/data/items.tsx` (replace ComingSoon)

- [ ] **Step 1: Create `src/features/data/configs/items.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { listItems } from "#/data";
import type { Item } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

export const itemsListConfig: EntityListConfig<Item> = {
	detailTo: "/data/items/$slug",
	getAll: listItems,
	searchText: (item) => item.name,
	filters: [
		{
			key: "form",
			label: "Form",
			options: [
				{ value: "solid", label: "Solid" },
				{ value: "fluid", label: "Fluid" },
			],
			matches: (item, value) => item.form === value,
		},
	],
	renderCard: (item) => (
		<>
			<EntityIcon icon={item.icon} name={item.name} size={48} />
			<span className="text-xs font-medium text-[var(--sea-ink)]">
				{item.name}
			</span>
		</>
	),
};
```

(Note: `#/data` resolves to `src/data/index.ts`. Confirm the alias import works; if the route generator prefers the explicit file, use `#/data/index`.)

- [ ] **Step 2: Replace `src/routes/data/items.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import EntityListPage from "#/features/data/EntityListPage";
import { itemsListConfig } from "#/features/data/configs/items";

export const Route = createFileRoute("/data/items")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : undefined,
		form: typeof search.form === "string" ? search.form : undefined,
	}),
	component: () => (
		<EntityListPage config={itemsListConfig} />
	),
});
```

- [ ] **Step 3: Regenerate routes, typecheck, and smoke the page**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 type errors.
Run: `npm run dev`, open the printed URL at `/data/items`. Verify: a grid of item cards with icons, a search box that filters live, and Form chips (All/Solid/Fluid) that filter and update the URL (`?form=fluid`). Reload with `?form=fluid` in the URL — the fluid filter is still applied. 0 console errors.

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: items overview list page"
```

---

### Task 9: Shared DetailLayout + items detail page

**Files:**
- Create: `src/components/data/DetailLayout.tsx`
- Create: `src/components/data/RecipeRow.tsx`
- Create: `src/routes/data/items.$slug.tsx`

- [ ] **Step 1: Create `src/components/data/DetailLayout.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import EntityIcon from "#/components/EntityIcon";

interface DetailLayoutProps {
	icon?: string;
	name: string;
	kicker: string;
	description?: string;
	children: ReactNode;
}

export default function DetailLayout({
	icon,
	name,
	kicker,
	description,
	children,
}: DetailLayoutProps) {
	return (
		<article className="flex flex-col gap-6">
			<Link to="/data" className="nav-link w-fit text-sm">
				← All data
			</Link>
			<header className="flex items-center gap-4">
				<EntityIcon icon={icon} name={name} size={56} />
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
						{kicker}
					</p>
					<h1 className="text-2xl font-bold text-[var(--sea-ink)]">{name}</h1>
				</div>
			</header>
			{description && (
				<p className="max-w-2xl text-[var(--sea-ink-soft)]">{description}</p>
			)}
			{children}
		</article>
	);
}

export function DetailSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				{title}
			</h2>
			{children}
		</section>
	);
}

export function StatGrid({
	stats,
}: {
	stats: { label: string; value: string }[];
}) {
	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2"
				>
					<p className="text-[10px] uppercase text-[var(--sea-ink-soft)]">
						{stat.label}
					</p>
					<p className="text-sm font-semibold text-[var(--sea-ink)]">
						{stat.value}
					</p>
				</div>
			))}
		</div>
	);
}
```

- [ ] **Step 2: Create `src/components/data/RecipeRow.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import EntityIcon from "#/components/EntityIcon";
import { getBuildable, getBuilding, getItem } from "#/data";
import type { Recipe } from "#/data/schema";
import { perMinute, formatNumber } from "#/lib/format";

/** Resolve an amount-ref slug to a display name + icon. A recipe product can be
 *  an item, a building, or a buildable (~460 build recipes produce buildables). */
function resolveRef(slug: string): { name: string; icon?: string } {
	const item = getItem(slug);
	if (item) return { name: item.name, icon: item.icon };
	const buildable = getBuildable(slug);
	if (buildable) return { name: buildable.name, icon: buildable.icon };
	const building = getBuilding(slug);
	if (building) return { name: building.name, icon: building.icon };
	return { name: slug };
}

export default function RecipeRow({ recipe }: { recipe: Recipe }) {
	const machine = recipe.producedIn[0]
		? getBuilding(recipe.producedIn[0])
		: undefined;
	return (
		<Link
			to="/data/recipes/$slug"
			params={{ slug: recipe.slug }}
			className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm no-underline transition hover:border-[var(--chip-line)]"
		>
			{recipe.alternate && (
				<span className="rounded-full bg-[var(--link-bg-hover)] px-2 py-0.5 text-[10px] uppercase text-[var(--sea-ink-soft)]">
					alt
				</span>
			)}
			<span className="font-medium text-[var(--sea-ink)]">{recipe.name}</span>
			<span className="ml-auto flex items-center gap-2 text-xs text-[var(--sea-ink-soft)]">
				{recipe.products.map((p) => {
					const ref = resolveRef(p.item);
					return (
						<span key={p.item} className="flex items-center gap-1">
							<EntityIcon icon={ref.icon} name={ref.name} size={18} />
							{formatNumber(perMinute(p.amount, recipe.time))}/min
						</span>
					);
				})}
				{machine ? `· ${machine.name}` : ""}
			</span>
		</Link>
	);
}
```

- [ ] **Step 3: Create `src/routes/data/items.$slug.tsx`**

```tsx
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import RecipeRow from "#/components/data/RecipeRow";
import { getItem, getRecipesUsing } from "#/data";
import {
	getStandardRecipes,
	getAlternateRecipes,
	getUnlockingSchematics,
} from "#/data/queries";
import { formatNumber } from "#/lib/format";

export const Route = createFileRoute("/data/items/$slug")({
	loader: ({ params }) => {
		const item = getItem(params.slug);
		if (!item) throw notFound();
		return { item };
	},
	component: ItemDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown item.{" "}
			<Link to="/data/items" className="nav-link">
				Browse all items
			</Link>
		</p>
	),
});

function ItemDetail() {
	const { item } = Route.useLoaderData();
	const standard = getStandardRecipes(item.slug);
	const alternate = getAlternateRecipes(item.slug);
	const usedIn = getRecipesUsing(item.slug);
	const unlocks = getUnlockingSchematics(item.slug);

	return (
		<DetailLayout
			icon={item.icon}
			name={item.name}
			kicker={item.form === "fluid" ? "Fluid" : "Item"}
			description={item.description}
		>
			<StatGrid
				stats={[
					{ label: "Stack size", value: formatNumber(item.stackSize) },
					{ label: "Sink points", value: formatNumber(item.sinkPoints) },
					{ label: "Form", value: item.form === "fluid" ? "Fluid" : "Solid" },
					{
						label: "Energy",
						value: item.energyValue ? `${formatNumber(item.energyValue)} MJ` : "—",
					},
				]}
			/>

			<a href={`/calculator?target=${item.slug}`} className="nav-link w-fit text-sm">
				Open in calculator →
			</a>

			{(standard.length > 0 || alternate.length > 0) && (
				<DetailSection title="Produced by">
					<div className="flex flex-col gap-2">
						{[...standard, ...alternate].map((recipe) => (
							<RecipeRow key={recipe.slug} recipe={recipe} />
						))}
					</div>
				</DetailSection>
			)}

			{usedIn.length > 0 && (
				<DetailSection title="Used in">
					<div className="flex flex-col gap-2">
						{usedIn.map((recipe) => (
							<RecipeRow key={recipe.slug} recipe={recipe} />
						))}
					</div>
				</DetailSection>
			)}

			<DetailSection title="Unlocked by">
				{unlocks.length === 0 ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Available from the start.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{unlocks.map((schematic) => (
							<Link
								key={schematic.slug}
								to="/data/schematics/$slug"
								params={{ slug: schematic.slug }}
								className="rounded-full border border-[var(--line)] px-3 py-1 text-xs no-underline hover:border-[var(--chip-line)]"
							>
								{schematic.name}
							</Link>
						))}
					</div>
				)}
			</DetailSection>
		</DetailLayout>
	);
}
```

- [ ] **Step 4: Regenerate routes, typecheck, smoke**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.
Smoke at `/data/items/iron-plate`: header with icon, stat grid, "Produced by" (standard + alt recipes with per-min rates), "Used in", "Unlocked by". Click a recipe row → navigates to `/data/recipes/<slug>` (will 404 until Task 10 — acceptable now; verify the link href is correct). Visit `/data/items/not-a-real-item` → "Unknown item" not-found UI.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: item detail page + shared detail layout"
```

---

### Task 10: Recipes list + detail

**Files:**
- Create: `src/features/data/configs/recipes.tsx`
- Modify: `src/routes/data/recipes.tsx`
- Create: `src/routes/data/recipes.$slug.tsx`

- [ ] **Step 1: Create `src/features/data/configs/recipes.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { getBuilding, getItem, listRecipes } from "#/data";
import type { Recipe } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

function primaryProductIcon(recipe: Recipe): { name: string; icon?: string } {
	const first = recipe.products[0];
	if (!first) return { name: recipe.name };
	const item = getItem(first.item);
	if (item) return { name: item.name, icon: item.icon };
	const building = getBuilding(first.item);
	return building ? { name: building.name, icon: building.icon } : { name: recipe.name };
}

export const recipesListConfig: EntityListConfig<Recipe> = {
	detailTo: "/data/recipes/$slug",
	getAll: listRecipes,
	searchText: (recipe) => recipe.name,
	filters: [
		{
			key: "kind",
			label: "Kind",
			options: [
				{ value: "standard", label: "Standard" },
				{ value: "alternate", label: "Alternate" },
			],
			matches: (recipe, value) =>
				value === "alternate" ? recipe.alternate : !recipe.alternate,
		},
	],
	renderCard: (recipe) => {
		const product = primaryProductIcon(recipe);
		return (
			<>
				<EntityIcon icon={product.icon} name={product.name} size={48} />
				<span className="text-xs font-medium text-[var(--sea-ink)]">
					{recipe.name}
				</span>
			</>
		);
	},
};
```

- [ ] **Step 2: Replace `src/routes/data/recipes.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import EntityListPage from "#/features/data/EntityListPage";
import { recipesListConfig } from "#/features/data/configs/recipes";

export const Route = createFileRoute("/data/recipes")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : undefined,
		kind: typeof search.kind === "string" ? search.kind : undefined,
	}),
	component: () => (
		<EntityListPage config={recipesListConfig} />
	),
});
```

- [ ] **Step 3: Create `src/routes/data/recipes.$slug.tsx`**

```tsx
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import { getBuildable, getBuilding, getItem, getRecipe } from "#/data";
import type { Recipe } from "#/data/schema";
import { formatNumber, formatPower, perMinute } from "#/lib/format";

export const Route = createFileRoute("/data/recipes/$slug")({
	loader: ({ params }) => {
		const recipe = getRecipe(params.slug);
		if (!recipe) throw notFound();
		return { recipe };
	},
	component: RecipeDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown recipe.{" "}
			<Link to="/data/recipes" className="nav-link">
				Browse all recipes
			</Link>
		</p>
	),
});

function ref(slug: string): { name: string; icon?: string; to?: string } {
	const item = getItem(slug);
	if (item) return { name: item.name, icon: item.icon, to: "item" };
	const buildable = getBuildable(slug);
	if (buildable)
		return { name: buildable.name, icon: buildable.icon, to: "buildable" };
	const building = getBuilding(slug);
	if (building) return { name: building.name, icon: building.icon, to: "building" };
	return { name: slug };
}

function PartList({
	parts,
	time,
	title,
}: {
	parts: Recipe["ingredients"];
	time: number;
	title: string;
}) {
	return (
		<DetailSection title={title}>
			<div className="flex flex-col gap-2">
				{parts.map((part) => {
					const r = ref(part.item);
					const row = (
						<span className="flex items-center gap-2">
							<EntityIcon icon={r.icon} name={r.name} size={24} />
							<span className="font-medium text-[var(--sea-ink)]">{r.name}</span>
							<span className="ml-auto text-xs text-[var(--sea-ink-soft)]">
								{formatNumber(part.amount)} · {formatNumber(perMinute(part.amount, time))}/min
							</span>
						</span>
					);
					return (
						<div
							key={part.item}
							className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
						>
							{r.to === "item" ? (
								<Link
									to="/data/items/$slug"
									params={{ slug: part.item }}
									className="no-underline"
								>
									{row}
								</Link>
							) : (
								row
							)}
						</div>
					);
				})}
			</div>
		</DetailSection>
	);
}

function RecipeDetail() {
	const { recipe } = Route.useLoaderData();
	const machine = recipe.producedIn[0]
		? getBuilding(recipe.producedIn[0])
		: undefined;
	return (
		<DetailLayout
			name={recipe.name}
			kicker={recipe.alternate ? "Alternate recipe" : "Recipe"}
		>
			<StatGrid
				stats={[
					{ label: "Craft time", value: `${formatNumber(recipe.time)}s` },
					{ label: "Machine", value: machine?.name ?? "—" },
					{
						label: "Power",
						value: machine ? formatPower(machine.powerConsumption) : "—",
					},
					{ label: "Type", value: recipe.alternate ? "Alternate" : "Standard" },
				]}
			/>
			<PartList parts={recipe.ingredients} time={recipe.time} title="Ingredients" />
			<PartList parts={recipe.products} time={recipe.time} title="Products" />
		</DetailLayout>
	);
}
```

- [ ] **Step 4: Regenerate routes, typecheck, smoke**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.
Smoke `/data/recipes` (grid + Standard/Alternate filter) and `/data/recipes/recipe-ingotiron-c` (ingredients/products with rates, machine, power). From an item detail page's "Produced by", click a recipe → it now resolves. 0 console errors.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: recipes overview list + detail"
```

---

### Task 11: Verification checkpoint (items + recipes)

- [ ] **Step 1: Full gates**

Run: `npm run check && npm run typecheck && npm test && npm run build`
Expected: all pass. Note new tests: queries (6), format (4), EntityIcon (2), SearchFilterBar (2) added to the Phase 1 suite.

- [ ] **Step 2: Normalize routeTree and confirm clean tree**

Run: `git status --porcelain` → if `src/routeTree.gen.ts` is dirty from build, `git add src/routeTree.gen.ts && git commit -m "chore: route tree"` (commit the build-accurate version). Otherwise clean.

---

### Task 12: Buildings list + detail

**Files:**
- Create: `src/features/data/configs/buildings.tsx`
- Modify: `src/routes/data/buildings.tsx`
- Create: `src/routes/data/buildings.$slug.tsx`

- [ ] **Step 1: Create `src/features/data/configs/buildings.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { listBuildings } from "#/data";
import type { Building } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

export const buildingsListConfig: EntityListConfig<Building> = {
	detailTo: "/data/buildings/$slug",
	getAll: listBuildings,
	searchText: (building) => building.name,
	filters: [
		{
			key: "power",
			label: "Power",
			options: [
				{ value: "consumer", label: "Consumes" },
				{ value: "none", label: "No power" },
			],
			matches: (building, value) =>
				value === "consumer"
					? building.powerConsumption > 0
					: building.powerConsumption === 0,
		},
	],
	renderCard: (building) => (
		<>
			<EntityIcon icon={building.icon} name={building.name} size={48} />
			<span className="text-xs font-medium text-[var(--sea-ink)]">
				{building.name}
			</span>
		</>
	),
};
```

- [ ] **Step 2: Replace `src/routes/data/buildings.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import EntityListPage from "#/features/data/EntityListPage";
import { buildingsListConfig } from "#/features/data/configs/buildings";

// Explicit interface with OPTIONAL props: typing validateSearch's return as a
// shape with optional keys keeps `<Link to="/data/buildings">` from requiring a
// `search` arg (TanStack treats non-optional search keys as required on links).
interface BuildingsSearch {
	q?: string;
	power?: string;
}

export const Route = createFileRoute("/data/buildings")({
	validateSearch: (search: Record<string, unknown>): BuildingsSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		power: typeof search.power === "string" ? search.power : undefined,
	}),
	component: () => <EntityListPage config={buildingsListConfig} />,
});
```

- [ ] **Step 3: Create `src/routes/data/buildings.$slug.tsx`**

```tsx
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import RecipeRow from "#/components/data/RecipeRow";
import { getBuilding, getItem, listRecipes } from "#/data";
import { getBuildCost } from "#/data/queries";
import { formatNumber, formatPower } from "#/lib/format";

export const Route = createFileRoute("/data/buildings/$slug")({
	loader: ({ params }) => {
		const building = getBuilding(params.slug);
		if (!building) throw notFound();
		return { building };
	},
	component: BuildingDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown building.{" "}
			<Link to="/data/buildings" className="nav-link">
				Browse all buildings
			</Link>
		</p>
	),
});

function BuildingDetail() {
	const { building } = Route.useLoaderData();
	const buildCost = getBuildCost(building.slug);
	const recipesHere = listRecipes().filter((r) =>
		r.producedIn.includes(building.slug),
	);

	return (
		<DetailLayout
			icon={building.icon}
			name={building.name}
			kicker="Building"
			description={building.description}
		>
			<StatGrid
				stats={[
					{ label: "Power use", value: formatPower(building.powerConsumption) },
					{
						label: "Speed",
						value: building.manufacturingSpeed
							? `${formatNumber(building.manufacturingSpeed)}×`
							: "—",
					},
					{ label: "Recipes", value: formatNumber(recipesHere.length) },
					{
						label: "Footprint",
						value: building.size.width
							? `${formatNumber(building.size.width)}×${formatNumber(building.size.length)}`
							: "—",
					},
				]}
			/>

			{buildCost && (
				<DetailSection title="Build cost">
					<div className="flex flex-wrap gap-2">
						{buildCost.ingredients.map((part) => {
							const item = getItem(part.item);
							return (
								<span
									key={part.item}
									className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-sm"
								>
									<EntityIcon icon={item?.icon} name={item?.name ?? part.item} size={18} />
									{formatNumber(part.amount)} {item?.name ?? part.item}
								</span>
							);
						})}
					</div>
				</DetailSection>
			)}

			{recipesHere.length > 0 && (
				<DetailSection title="Produces">
					<div className="flex flex-col gap-2">
						{recipesHere.map((recipe) => (
							<RecipeRow key={recipe.slug} recipe={recipe} />
						))}
					</div>
				</DetailSection>
			)}
		</DetailLayout>
	);
}
```

- [ ] **Step 4: Regenerate routes, typecheck, smoke**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.
Smoke `/data/buildings` and `/data/buildings/constructor`: stat grid, build cost (2 reinforced-iron-plate + 8 cable), "Produces" list of recipes. 0 console errors.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: buildings overview list + detail"
```

---

### Task 13: Buildables list + detail

**Files:**
- Create: `src/features/data/configs/buildables.tsx`
- Modify: `src/routes/data/buildables.tsx`
- Create: `src/routes/data/buildables.$slug.tsx`

- [ ] **Step 1: Create `src/features/data/configs/buildables.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { listBuildables } from "#/data";
import type { Buildable } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

const categoryOptions = (() => {
	const set = new Set<string>();
	for (const b of listBuildables()) for (const c of b.categories) set.add(c);
	return [...set].sort().map((c) => ({ value: c, label: c }));
})();

export const buildablesListConfig: EntityListConfig<Buildable> = {
	detailTo: "/data/buildables/$slug",
	getAll: listBuildables,
	searchText: (buildable) => buildable.name,
	filters:
		categoryOptions.length > 0
			? [
					{
						key: "category",
						label: "Category",
						options: categoryOptions,
						matches: (buildable, value) => buildable.categories.includes(value),
					},
				]
			: [],
	renderCard: (buildable) => (
		<>
			<EntityIcon icon={buildable.icon} name={buildable.name} size={48} />
			<span className="text-xs font-medium text-[var(--sea-ink)]">
				{buildable.name}
			</span>
		</>
	),
};
```

(Note: if `categoryOptions` is empty because the source leaves `categories` empty for most buildables, the filter list is omitted and the page is search-only — verify at smoke time and keep as-is; do not invent categories.)

- [ ] **Step 2: Replace `src/routes/data/buildables.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import EntityListPage from "#/features/data/EntityListPage";
import { buildablesListConfig } from "#/features/data/configs/buildables";

interface BuildablesSearch {
	q?: string;
	category?: string;
}

export const Route = createFileRoute("/data/buildables")({
	validateSearch: (search: Record<string, unknown>): BuildablesSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		category: typeof search.category === "string" ? search.category : undefined,
	}),
	component: () => <EntityListPage config={buildablesListConfig} />,
});
```

- [ ] **Step 3: Create `src/routes/data/buildables.$slug.tsx`**

```tsx
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import { getBuildable, getItem } from "#/data";
import { getBuildCost } from "#/data/queries";
import { formatNumber } from "#/lib/format";

export const Route = createFileRoute("/data/buildables/$slug")({
	loader: ({ params }) => {
		const buildable = getBuildable(params.slug);
		if (!buildable) throw notFound();
		return { buildable };
	},
	component: BuildableDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown buildable.{" "}
			<Link to="/data/buildables" className="nav-link">
				Browse all buildables
			</Link>
		</p>
	),
});

function BuildableDetail() {
	const { buildable } = Route.useLoaderData();
	const buildCost = getBuildCost(buildable.slug);
	return (
		<DetailLayout
			icon={buildable.icon}
			name={buildable.name}
			kicker={buildable.categories[0] ?? "Buildable"}
			description={buildable.description}
		>
			<StatGrid
				stats={[
					{
						label: "Footprint",
						value: buildable.size.width
							? `${formatNumber(buildable.size.width)}×${formatNumber(buildable.size.length)}`
							: "—",
					},
					{
						label: "Categories",
						value: buildable.categories.length
							? formatNumber(buildable.categories.length)
							: "—",
					},
				]}
			/>
			{buildCost && (
				<DetailSection title="Build cost">
					<div className="flex flex-wrap gap-2">
						{buildCost.ingredients.map((part) => {
							const item = getItem(part.item);
							return (
								<span
									key={part.item}
									className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-sm"
								>
									<EntityIcon icon={item?.icon} name={item?.name ?? part.item} size={18} />
									{formatNumber(part.amount)} {item?.name ?? part.item}
								</span>
							);
						})}
					</div>
				</DetailSection>
			)}
		</DetailLayout>
	);
}
```

- [ ] **Step 4: Regenerate routes, typecheck, smoke**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.
Smoke `/data/buildables` (grid, search; category chips only if present) and `/data/buildables/<slug>` for a real slug (use one from `node -e "console.log(require('./src/data/generated/buildables.json')[0].slug)"`). Verify build cost renders. 0 console errors.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: buildables overview list + detail"
```

---

### Task 14: Schematics list + detail

**Files:**
- Create: `src/features/data/configs/schematics.tsx`
- Modify: `src/routes/data/schematics.tsx`
- Create: `src/routes/data/schematics.$slug.tsx`

- [ ] **Step 1: Create `src/features/data/configs/schematics.tsx`**

```tsx
import EntityIcon from "#/components/EntityIcon";
import { listSchematics } from "#/data";
import type { Schematic } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

const tierOptions = (() => {
	const set = new Set<number>();
	for (const s of listSchematics()) set.add(s.tier);
	return [...set]
		.sort((a, b) => a - b)
		.map((t) => ({ value: String(t), label: `Tier ${t}` }));
})();

export const schematicsListConfig: EntityListConfig<Schematic> = {
	detailTo: "/data/schematics/$slug",
	getAll: listSchematics,
	searchText: (schematic) => schematic.name,
	filters: [
		{
			key: "tier",
			label: "Tier",
			options: tierOptions,
			matches: (schematic, value) => String(schematic.tier) === value,
		},
		{
			key: "kind",
			label: "Kind",
			options: [
				{ value: "alternate", label: "Alternate" },
				{ value: "mam", label: "MAM" },
			],
			matches: (schematic, value) =>
				value === "alternate" ? schematic.alternate : schematic.mam,
		},
	],
	renderCard: (schematic) => (
		<>
			<EntityIcon icon={schematic.icon} name={schematic.name} size={48} />
			<span className="text-xs font-medium text-[var(--sea-ink)]">
				{schematic.name}
			</span>
		</>
	),
};
```

- [ ] **Step 2: Replace `src/routes/data/schematics.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import EntityListPage from "#/features/data/EntityListPage";
import { schematicsListConfig } from "#/features/data/configs/schematics";

interface SchematicsSearch {
	q?: string;
	tier?: string;
	kind?: string;
}

export const Route = createFileRoute("/data/schematics")({
	validateSearch: (search: Record<string, unknown>): SchematicsSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		tier: typeof search.tier === "string" ? search.tier : undefined,
		kind: typeof search.kind === "string" ? search.kind : undefined,
	}),
	component: () => <EntityListPage config={schematicsListConfig} />,
});
```

- [ ] **Step 3: Create `src/routes/data/schematics.$slug.tsx`**

```tsx
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import { getItem, getRecipe, getSchematic } from "#/data";
import { formatNumber } from "#/lib/format";

export const Route = createFileRoute("/data/schematics/$slug")({
	loader: ({ params }) => {
		const schematic = getSchematic(params.slug);
		if (!schematic) throw notFound();
		return { schematic };
	},
	component: SchematicDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown schematic.{" "}
			<Link to="/data/schematics" className="nav-link">
				Browse all schematics
			</Link>
		</p>
	),
});

function SchematicDetail() {
	const { schematic } = Route.useLoaderData();
	return (
		<DetailLayout icon={schematic.icon} name={schematic.name} kicker={schematic.type}>
			<StatGrid
				stats={[
					{ label: "Tier", value: formatNumber(schematic.tier) },
					{ label: "Type", value: schematic.type },
					{ label: "MAM", value: schematic.mam ? "Yes" : "No" },
					{ label: "Alternate", value: schematic.alternate ? "Yes" : "No" },
				]}
			/>

			{schematic.cost.length > 0 && (
				<DetailSection title="Cost">
					<div className="flex flex-wrap gap-2">
						{schematic.cost.map((part) => {
							const item = getItem(part.item);
							return (
								<span
									key={part.item}
									className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-sm"
								>
									<EntityIcon icon={item?.icon} name={item?.name ?? part.item} size={18} />
									{formatNumber(part.amount)} {item?.name ?? part.item}
								</span>
							);
						})}
					</div>
				</DetailSection>
			)}

			{schematic.unlockRecipes.length > 0 && (
				<DetailSection title="Unlocks recipes">
					<div className="flex flex-wrap gap-2">
						{schematic.unlockRecipes.map((recipeSlug) => {
							const recipe = getRecipe(recipeSlug);
							if (!recipe) return null;
							return (
								<Link
									key={recipeSlug}
									to="/data/recipes/$slug"
									params={{ slug: recipeSlug }}
									className="rounded-full border border-[var(--line)] px-3 py-1 text-xs no-underline hover:border-[var(--chip-line)]"
								>
									{recipe.name}
								</Link>
							);
						})}
					</div>
				</DetailSection>
			)}

			{schematic.requiredSchematics.length > 0 && (
				<DetailSection title="Requires">
					<div className="flex flex-wrap gap-2">
						{schematic.requiredSchematics.map((reqSlug) => {
							const req = getSchematic(reqSlug);
							if (!req) return null;
							return (
								<Link
									key={reqSlug}
									to="/data/schematics/$slug"
									params={{ slug: reqSlug }}
									className="rounded-full border border-[var(--line)] px-3 py-1 text-xs no-underline hover:border-[var(--chip-line)]"
								>
									{req.name}
								</Link>
							);
						})}
					</div>
				</DetailSection>
			)}
		</DetailLayout>
	);
}
```

- [ ] **Step 3b: Restore the item → schematic cross-links**

`src/routes/data/items.$slug.tsx` currently renders its "Unlocked by" schematics as plain `<span>` badges (the `/data/schematics/$slug` route didn't exist when items were built in Task 9). Now that it exists, convert each badge back to a link. Replace the `<span … >{schematic.name}</span>` in the "Unlocked by" section with:

```tsx
<Link
	key={schematic.slug}
	to="/data/schematics/$slug"
	params={{ slug: schematic.slug }}
	className="rounded-full border border-[var(--line)] px-3 py-1 text-xs no-underline hover:border-[var(--chip-line)]"
>
	{schematic.name}
</Link>
```

Ensure `Link` is imported in `items.$slug.tsx` (it already imports from `@tanstack/react-router`). Run `npm run typecheck` → 0 errors (the route now exists so the typed `to` resolves).

- [ ] **Step 4: Regenerate routes, typecheck, smoke**

Run: `npm run generate-routes && npm run typecheck`
Expected: 0 errors.
Smoke `/data/schematics` (tier + kind filters) and `/data/schematics/<slug>` (cost, unlocked recipes linking to recipe pages, required schematics). From an item's "Unlocked by", click a schematic → resolves. 0 console errors.

- [ ] **Step 5: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: schematics overview list + detail"
```

---

### Task 15: Home search wiring + nav polish

**Files:**
- Modify: `src/routes/index.tsx` (enable the search box)
- Create: `src/components/data/GlobalSearchResults.tsx` (optional inline results)

- [ ] **Step 1: Enable the home search box to deep-link into items**

In `src/routes/index.tsx`, replace the disabled `<input>` with a controlled search that navigates to `/data/items?q=…` on submit:

```tsx
// add at top:
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

// inside Home(), before return:
const navigate = useNavigate();
const [q, setQ] = useState("");

// replace the disabled input with:
<form
	onSubmit={(e) => {
		e.preventDefault();
		navigate({ to: "/data/items", search: { q } });
	}}
	className="mt-6"
>
	<input
		type="search"
		value={q}
		onChange={(e) => setQ(e.target.value)}
		placeholder="Search items, recipes, buildings…"
		className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-5 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]"
	/>
</form>
```

(Items is the natural default search target; the data section's per-page search refines from there. A true cross-entity command palette is out of scope for Phase 2 — leave it as a `planned` registry note.)

- [ ] **Step 2: Flip the `data` feature status to `live`**

In `src/config/features.ts`, change the `data` feature's `status` from `"planned"` to `"live"`. This removes its "soon" badge in the nav and shows "Live" on the home card.

- [ ] **Step 3: Typecheck + smoke**

Run: `npm run typecheck`
Expected: 0 errors.
Smoke: home search → submitting "iron" lands on `/data/items?q=iron` with the list filtered. Nav no longer shows "soon" on Game data; home card shows "Live". Other four features still show "soon".

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: home search into data; mark data feature live"
```

---

### Task 16: SEO meta tags on data pages

The spec requires overview pages to be SSR-rendered with proper meta tags so they rank in search. TanStack Start SSRs route components already; this task adds per-route `head`.

**Files:** Modify all five list routes (`src/routes/data/{items,recipes,buildings,buildables,schematics}.index.tsx` — note: these are `.index.tsx`, since each entity's list is the index route and the bare `<entity>.tsx` parent was removed so the `$slug` detail child can render under the `/data` layout's `<Outlet/>`) and all five detail routes (`src/routes/data/*.$slug.tsx`).

- [ ] **Step 1: Add `head` to each list route**

In each list route's `createFileRoute(...)({ … })`, add a `head` option (alongside `validateSearch`/`component`). Example for items:

```tsx
	head: () => ({
		meta: [
			{ title: "Items — Satisfactory Planner" },
			{
				name: "description",
				content:
					"Browse every Satisfactory item with recipes, sink points and where each is used.",
			},
		],
	}),
```

Repeat with the entity word swapped: "Recipes", "Buildings", "Buildables", "Schematics" (title + a one-line description naming that entity type).

- [ ] **Step 2: Add dynamic `head` to each detail route**

Detail routes can derive title/description from the loaded entity. Add a `head` that reads the loader data. Example for items (`items.$slug.tsx`):

```tsx
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: `${loaderData.item.name} — Satisfactory Planner` },
					{
						name: "description",
						content:
							loaderData.item.description?.slice(0, 150) ||
							`Recipes, uses and unlocks for ${loaderData.item.name} in Satisfactory.`,
					},
				]
			: [],
	}),
```

For the other four, read the matching loader key (`recipe`, `building`, `buildable`, `schematic`) and use that entity's `name`; for recipes/schematics (no `description` field) use a templated description like `` `Ingredients, products and machine for ${loaderData.recipe.name}.` ``.

- [ ] **Step 3: Typecheck + verify meta renders in SSR HTML**

Run: `npm run typecheck`
Expected: 0 errors. (If `head`'s `loaderData` is typed as possibly-undefined, the `loaderData ? … : []` guard handles it.)
Run `npm run build && npm run preview` (or `npm run dev`), then fetch the raw HTML of `/data/items/iron-plate` and confirm `<title>Iron Plate — Satisfactory Planner</title>` is present in the server-rendered markup (View Source, not devtools DOM).

- [ ] **Step 4: Commit**

```bash
npx biome check --write . && git add -A && git commit -m "feat: SSR meta tags on data list and detail pages"
```

---

### Task 17: Update spec/registry + final verification

- [ ] **Step 1: Mark the spec's build-order phase 2 done**

In `docs/superpowers/specs/2026-06-12-satisfactory-webapp-design.md`, in the "Build order" section, append ` — done` to the "Overviews" line (line begins with `2. **Overviews**`). This keeps the spec an accurate status board.

- [ ] **Step 2: Full gate run**

Run: `npm run check && npm run typecheck && npm test && npm run build`
Expected: all pass. Test count grows by the Phase 2 unit tests (queries 6, format 4, EntityIcon 2, SearchFilterBar 2 = +14 → 31 total).

- [ ] **Step 3: Confirm clean tree**

Run: `git status --porcelain` (ignore `.playwright-mcp/` if present). If `src/routeTree.gen.ts` is dirty, commit the build-accurate version.

- [ ] **Step 4: Browser smoke across all five entities**

Run `npm run dev`; at the printed port, verify each: `/data/items`, `/data/recipes`, `/data/buildings`, `/data/buildables`, `/data/schematics` — grids render with icons, search + filters work and persist in the URL, and a detail page for each opens with working cross-links. 0 console errors (Clerk dev-key warning is expected).

- [ ] **Step 5: Commit any stragglers**

```bash
npx biome check --write . && git add -A && git commit -m "chore: phase 2 final verification" || echo "nothing to commit"
```

---

## Out of scope for this plan (later phases / registry placeholders)

- Cross-entity command palette / global fuzzy search (home search routes to items for now)
- Calculator deep-link target handling (the "Open in calculator →" link carries `?target=`; the calculator consumes it in Phase 3)
- Per-item tier badges (item tier isn't a first-class field; "Unlocked by" schematics cover provenance)
- 256px icons / responsive icon `srcset` (64px is sufficient for current sizes)
- Virtualized lists (≤800 rows render fine without it)
