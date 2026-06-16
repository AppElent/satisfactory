# Phase 8 — Factory/Game editing + Calculator round-trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make factory and game detail views fully editable, give manual factories a solved production graph, and let any factory be opened in the calculator and saved back in place.

**Architecture:** A pure `factoryToSpec` helper turns a factory's production into a calculator `ProblemSpec`; it powers both the manual-factory graph (solve live) and "open in calculator". The calculator carries `fromFactory`/`fromGame` search params so its save button can update the source factory. Factory detail gains status/description/manual-production editors; game settings gain rename/description/delete.

**Tech Stack:** React 19, TanStack Router (typed search params), Convex, the existing LP solver (`useSolver`) + `ResultTabs`, Vitest, Biome.

**Spec:** [docs/superpowers/specs/2026-06-16-phase8-factory-editing-calculator-roundtrip-design.md](../specs/2026-06-16-phase8-factory-editing-calculator-roundtrip-design.md)

**Conventions:** Biome TABS + double quotes (`npx biome check --write <files>` before commits). Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Pure logic TDD. Group gate: `npx biome check . && npm run typecheck && npm test && npm run build`.

---

## Group A — `factoryToSpec` helper

### Task 1: `factoryToSpec` (TDD)

**Files:**
- Modify: `src/features/factories/factory-view.ts`
- Test: `src/features/factories/factory-view.test.ts` (extend)

- [ ] **Step 1: Add failing tests**

Append to `src/features/factories/factory-view.test.ts` (extend the existing import from `./factory-view` to include `factoryToSpec`):

```ts
describe("factoryToSpec", () => {
	it("maps a manual production to targets + available inputs", () => {
		expect(
			factoryToSpec({
				source: "manual",
				inputs: [{ item: "iron-ore", rate: 30 }],
				outputs: [{ item: "iron-plate", rate: 60 }],
				machines: [],
			}),
		).toEqual({
			targets: [{ item: "iron-plate", rate: 60 }],
			availableInputs: [{ item: "iron-ore", rate: 30 }],
			allowedAlternates: [],
		});
	});

	it("returns the stored spec for a plan production", () => {
		const spec = {
			targets: [{ item: "screw", rate: 100 }],
			allowedAlternates: ["recipe-x"],
		};
		const plan = JSON.stringify({
			spec,
			solution: {
				status: "optimal",
				recipes: [],
				outputs: [],
				rawInputs: [],
				providedInputs: [],
				byproducts: [],
				flows: [],
				power: 0,
				buildCost: [],
			},
		});
		expect(factoryToSpec({ source: "plan", plan })).toEqual(spec);
	});

	it("falls back to an empty spec for an unparseable plan", () => {
		expect(factoryToSpec({ source: "plan", plan: "broken" })).toEqual({
			targets: [],
			allowedAlternates: [],
		});
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/factories/factory-view.test.ts`
Expected: FAIL ("factoryToSpec is not a function").

- [ ] **Step 3: Implement**

Append to `src/features/factories/factory-view.ts` (add the import at top: `import type { ProblemSpec } from "#/features/calculator/solver";`):

```ts
/** A calculator ProblemSpec that reproduces this factory's production. */
export function factoryToSpec(production: Production): ProblemSpec {
	if (production.source === "manual") {
		return {
			targets: production.outputs,
			availableInputs: production.inputs,
			allowedAlternates: [],
		};
	}
	const snapshot = decodeSnapshot(production.plan);
	return snapshot?.spec ?? { targets: [], allowedAlternates: [] };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/factories/factory-view.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/factories/factory-view.ts src/features/factories/factory-view.test.ts
git commit -m "feat: factoryToSpec helper (factory production -> calculator spec)"
```

---

## Group B — Calculator round-trip

### Task 2: Calculator accepts + preserves `fromFactory`/`fromGame`

**Files:**
- Modify: `src/routes/calculator.tsx`
- Modify: `src/features/calculator/CalculatorPage.tsx`

- [ ] **Step 1: Widen the route search schema**

Full new `validateSearch` in `src/routes/calculator.tsx`:

```ts
	validateSearch: (
		search: Record<string, unknown>,
	): { plan?: string; fromFactory?: string; fromGame?: string } => ({
		plan: typeof search.plan === "string" ? search.plan : undefined,
		fromFactory:
			typeof search.fromFactory === "string" ? search.fromFactory : undefined,
		fromGame: typeof search.fromGame === "string" ? search.fromGame : undefined,
	}),
```

- [ ] **Step 2: Read + preserve the params in CalculatorPage**

In `src/features/calculator/CalculatorPage.tsx`:

Change the search read:

```tsx
	const search = useSearch({ strict: false }) as {
		plan?: string;
		fromFactory?: string;
		fromGame?: string;
	};
```

Capture the round-trip params once (they don't change during a session):

```tsx
	const [roundTrip] = useState(() => ({
		fromFactory: search.fromFactory,
		fromGame: search.fromGame,
	}));
```

Update the URL-mirror effect to keep them in the search object:

```tsx
	useEffect(() => {
		navigate({
			to: "/calculator",
			search: {
				...(planParam ? { plan: planParam } : {}),
				...(roundTrip.fromFactory
					? { fromFactory: roundTrip.fromFactory }
					: {}),
				...(roundTrip.fromGame ? { fromGame: roundTrip.fromGame } : {}),
			},
			replace: true,
		});
	}, [planParam, navigate, roundTrip]);
```

- [ ] **Step 3: Pass the params to the save button**

In CalculatorPage's results area, change `<SaveAsFactoryButton spec={spec} solution={solution} />` to:

```tsx
							<SaveAsFactoryButton
								spec={spec}
								solution={solution}
								fromFactory={roundTrip.fromFactory}
								fromGame={roundTrip.fromGame}
							/>
```

- [ ] **Step 4: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: typecheck fails only on `SaveAsFactoryButton`'s new props until Task 3; build regenerates routes. Proceed to Task 3, then re-check.

- [ ] **Step 5: Commit (staged with Task 3)** — combined with Task 3's commit.

### Task 3: Save-back-in-place in `SaveAsFactoryButton`

**Files:**
- Modify: `src/features/factories/SaveAsFactoryButton.tsx`

- [ ] **Step 1: Add the update path**

In `SaveAsFactoryButton.tsx`, thread the new optional props and add an "update this factory" button.

Change the inner `SaveButton` signature + add the update mutation:

```tsx
function SaveButton({
	spec,
	solution,
	fromFactory,
	fromGame,
}: {
	spec: ProblemSpec;
	solution: Solution;
	fromFactory?: string;
	fromGame?: string;
}) {
	const create = useMutation(api.factories.create);
	const update = useMutation(api.factories.update);
	const navigate = useNavigate();
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);
	const games = useQuery(api.games.listMine);
	const [selectedGameId, setSelectedGameId] = useState<Id<"games"> | "">("");
```

After the existing `save` function, add a `saveToFactory`:

```tsx
	const saveToFactory = async () => {
		if (!fromFactory || !fromGame) return;
		setSaving(true);
		try {
			await update({
				id: fromFactory as Id<"factories">,
				production: { source: "plan", plan: encodeSnapshot({ spec, solution }) },
			});
			navigate({
				to: "/g/$gameId/factories/$factoryId",
				params: { gameId: fromGame, factoryId: fromFactory },
			});
		} catch {
			toast("Couldn't save changes to this factory.");
		} finally {
			setSaving(false);
		}
	};
```

Render the update button before the existing markup's `return`, when `fromFactory` is set. Replace the final `return (...)` so it shows the "Save changes to this factory" button (primary) plus the existing game-picker + "Save as new factory" controls:

```tsx
	return (
		<div className="flex items-center gap-2">
			{fromFactory && fromGame && (
				<button
					type="button"
					onClick={saveToFactory}
					disabled={saving}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					Save changes to this factory
				</button>
			)}
			{games && games.length > 1 && (
				<select
					aria-label="Save to game"
					value={gameId}
					onChange={(e) => setSelectedGameId(e.target.value as Id<"games">)}
					className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-sm"
				>
					{games.map((g) => (
						<option key={g._id} value={g._id}>
							{g.name}
						</option>
					))}
				</select>
			)}
			<button
				type="button"
				onClick={save}
				disabled={saving || !gameId}
				className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink)] disabled:opacity-50"
			>
				{fromFactory ? "Save as new factory" : "Save as factory"}
			</button>
		</div>
	);
```

(Keep the existing `activeGameId`/`gameId` derivation and the no-games early-return as-is.)

Update the default export to forward the props:

```tsx
export default function SaveAsFactoryButton(props: {
	spec: ProblemSpec;
	solution: Solution;
	fromFactory?: string;
	fromGame?: string;
}) {
	return (
		<>
			<Authenticated>
				<SaveButton {...props} />
			</Authenticated>
			<Unauthenticated>
				<SignInButton mode="modal">
					<button
						type="button"
						className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)]"
					>
						Sign in to save as factory
					</button>
				</SignInButton>
			</Unauthenticated>
		</>
	);
}
```

- [ ] **Step 2: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both green.

- [ ] **Step 3: Commit**

```bash
git add src/routes/calculator.tsx src/features/calculator/CalculatorPage.tsx src/features/factories/SaveAsFactoryButton.tsx src/routeTree.gen.ts
git commit -m "feat: calculator round-trip — open a factory and save changes back"
```

---

## Group C — Factory detail editing + manual graph

### Task 4: Manual-factory graph + status/description + open-in-calculator

**Files:**
- Modify: `src/features/factories/FactoryDetail.tsx`

- [ ] **Step 1: Solve manual production for the Plan tab**

In `FactoryDetail.tsx`, add imports:

```tsx
import { encodePlan } from "#/features/calculator/plan-codec";
import { useSolver } from "#/features/calculator/useSolver";
import { factoryToSpec } from "./factory-view";
import type { FactoryStatus } from "./types";
```

After `const factory = useQuery(...)` and the `update`/`remove`/`navigate`/`toast`/`patch` setup (but BEFORE the `if (factory === undefined)` early return, so hooks always run), add:

```tsx
	const manualSpec =
		factory && factory.production.source === "manual"
			? factoryToSpec(factory.production)
			: { targets: [], allowedAlternates: [] };
	const { solution: manualSolution, solving } = useSolver(manualSpec);
```

- [ ] **Step 2: Status + description editors + Open-in-calculator button**

In the header row (the `<div className="flex items-center justify-between">` with the name input + Delete button), add — between the name input and Delete — a status `<select>`, and add an "Open in calculator" button. Replace that header block with:

```tsx
			<div className="flex items-center gap-3">
				<input
					value={factory.name}
					onChange={(e) => patch({ id: factory._id, name: e.target.value })}
					aria-label="Factory name"
					className="flex-1 bg-transparent text-2xl font-bold text-[var(--sea-ink)] outline-none"
				/>
				<select
					aria-label="Status"
					value={factory.status}
					onChange={(e) =>
						patch({ id: factory._id, status: e.target.value as FactoryStatus })
					}
					className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-sm capitalize"
				>
					{(["planned", "building", "operational", "paused"] as const).map(
						(s) => (
							<option key={s} value={s}>
								{s}
							</option>
						),
					)}
				</select>
				<Link
					to="/calculator"
					search={{
						plan: encodePlan(factoryToSpec(factory.production)),
						fromFactory: factory._id,
						fromGame: gameId,
					}}
					className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink)]"
				>
					Open in calculator
				</Link>
				<button
					type="button"
					onClick={async () => {
						try {
							await remove({ id: factory._id });
							navigate({ to: "/g/$gameId/factories", params: { gameId } });
						} catch {
							toast("Couldn't delete this factory.");
						}
					}}
					className="text-sm text-[var(--sea-ink-soft)] hover:text-red-500"
				>
					Delete
				</button>
			</div>
```

Add a description input directly under the tab bar's container, at the top of the returned `<main>` content after the header (before the tabs `<div className="flex gap-1 border-b …">`):

```tsx
			<input
				value={factory.description ?? ""}
				onChange={(e) =>
					patch({ id: factory._id, description: e.target.value })
				}
				placeholder="Short description…"
				aria-label="Description"
				className="bg-transparent text-sm text-[var(--sea-ink-soft)] outline-none"
			/>
```

- [ ] **Step 3: Render the solved graph for manual factories in the Plan tab**

Replace the `{tab === "Plan" && …}` block with:

```tsx
			{tab === "Plan" &&
				(factory.production.source === "plan" ? (
					snapshot ? (
						<ResultTabs solution={snapshot.solution} />
					) : (
						<p className="text-sm text-[var(--sea-ink-soft)]">
							This plan could not be read.
						</p>
					)
				) : manualSolution ? (
					<ResultTabs solution={manualSolution} />
				) : solving ? (
					<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
						Solving…
					</p>
				) : (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Add outputs to this factory to see a production graph.
					</p>
				))}
```

- [ ] **Step 4: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both green. `encodePlan` is exported from `src/features/calculator/plan-codec.ts`; `useSolver` from `src/features/calculator/useSolver.ts`.

- [ ] **Step 5: Manual verification**

Run `npm run dev`, open a manual factory → Plan tab shows a solved graph; change status/description; "Open in calculator" loads the plan.

- [ ] **Step 6: Commit**

```bash
git add src/features/factories/FactoryDetail.tsx
git commit -m "feat: manual factory graph + status/description edit + open in calculator"
```

### Task 5: Edit manual production (form edit mode + MachineEditor)

**Files:**
- Create: `src/features/factories/MachineEditor.tsx`
- Modify: `src/features/factories/ManualFactoryForm.tsx`
- Modify: `src/features/factories/FactoryDetail.tsx`

- [ ] **Step 1: Machine editor (building + count + clock)**

`src/features/factories/MachineEditor.tsx`:

```tsx
import { getBuilding, listRecipes } from "#/data";
import type { MachineCount } from "./types";

/** Distinct production buildings (those a recipe runs in), sorted by name. */
function productionBuildings(): { slug: string; name: string }[] {
	const slugs = new Set<string>();
	for (const r of listRecipes()) for (const b of r.producedIn) slugs.add(b);
	return [...slugs]
		.map((slug) => ({ slug, name: getBuilding(slug)?.name ?? slug }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export default function MachineEditor({
	rows,
	onChange,
}: {
	rows: MachineCount[];
	onChange: (rows: MachineCount[]) => void;
}) {
	const buildings = productionBuildings();
	const add = () =>
		onChange([...rows, { building: buildings[0]?.slug ?? "", count: 1 }]);
	const set = (i: number, next: MachineCount) =>
		onChange(rows.map((r, j) => (j === i ? next : r)));
	const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Machines
			</h3>
			{rows.map((r, i) => (
				<div key={`${r.building}-${i}`} className="flex items-center gap-2">
					<select
						aria-label="Building"
						value={r.building}
						onChange={(e) => set(i, { ...r, building: e.target.value })}
						className="flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm"
					>
						{buildings.map((b) => (
							<option key={b.slug} value={b.slug}>
								{b.name}
							</option>
						))}
					</select>
					<input
						type="number"
						min={0}
						value={r.count}
						aria-label="Machine count"
						onChange={(e) => set(i, { ...r, count: Number(e.target.value) })}
						className="w-16 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
					/>
					<input
						type="number"
						min={0}
						max={250}
						value={r.clock ?? ""}
						placeholder="clock%"
						aria-label="Clock percent"
						onChange={(e) =>
							set(i, {
								...r,
								clock: e.target.value ? Number(e.target.value) : undefined,
							})
						}
						className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
					/>
					<button
						type="button"
						onClick={() => remove(i)}
						aria-label="Remove machine"
						className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
					>
						×
					</button>
				</div>
			))}
			<button
				type="button"
				onClick={add}
				className="self-start rounded-md border border-[var(--line)] px-3 py-1 text-sm text-[var(--sea-ink)]"
			>
				Add machine
			</button>
		</div>
	);
}
```

- [ ] **Step 2: ManualFactoryForm supports create + edit**

Rewrite `src/features/factories/ManualFactoryForm.tsx` to take optional `factoryId`/`initial` and call `update` when editing, plus render the `MachineEditor`:

```tsx
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useToast } from "#/components/Toast";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import ItemRateEditor from "./ItemRateEditor";
import MachineEditor from "./MachineEditor";
import type { FactoryStatus, ItemRate, MachineCount } from "./types";

const STATUSES: FactoryStatus[] = [
	"planned",
	"building",
	"operational",
	"paused",
];

interface Initial {
	name: string;
	status: FactoryStatus;
	inputs: ItemRate[];
	outputs: ItemRate[];
	machines: MachineCount[];
}

export default function ManualFactoryForm({
	gameId,
	factoryId,
	initial,
	onClose,
}: {
	gameId: Id<"games">;
	factoryId?: Id<"factories">;
	initial?: Initial;
	onClose: () => void;
}) {
	const create = useMutation(api.factories.create);
	const update = useMutation(api.factories.update);
	const navigate = useNavigate();
	const { toast } = useToast();
	const [name, setName] = useState(initial?.name ?? "");
	const [status, setStatus] = useState<FactoryStatus>(
		initial?.status ?? "planned",
	);
	const [inputs, setInputs] = useState<ItemRate[]>(initial?.inputs ?? []);
	const [outputs, setOutputs] = useState<ItemRate[]>(initial?.outputs ?? []);
	const [machines, setMachines] = useState<MachineCount[]>(
		initial?.machines ?? [],
	);
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			const production = {
				source: "manual" as const,
				inputs,
				outputs,
				machines,
			};
			if (factoryId) {
				await update({ id: factoryId, name: name.trim(), status, production });
				onClose();
			} else {
				const id = await create({
					gameId,
					name: name.trim(),
					status,
					production,
				});
				navigate({
					to: "/g/$gameId/factories/$factoryId",
					params: { gameId, factoryId: id },
				});
			}
		} catch {
			toast(factoryId ? "Couldn't save changes." : "Couldn't create the factory.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Factory name"
				aria-label="Factory name"
				className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
			/>
			<select
				value={status}
				onChange={(e) => setStatus(e.target.value as FactoryStatus)}
				aria-label="Status"
				className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm capitalize"
			>
				{STATUSES.map((s) => (
					<option key={s} value={s}>
						{s}
					</option>
				))}
			</select>
			<ItemRateEditor label="Outputs" rows={outputs} onChange={setOutputs} />
			<ItemRateEditor label="Inputs" rows={inputs} onChange={setInputs} />
			<MachineEditor rows={machines} onChange={setMachines} />
			<div className="flex gap-2">
				<button
					type="button"
					onClick={submit}
					disabled={saving || !name.trim()}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					{factoryId ? "Save changes" : "Save factory"}
				</button>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)]"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: "Edit production" toggle on FactoryDetail (manual only)**

In `FactoryDetail.tsx`: import `ManualFactoryForm` and add an `editing` state (`const [editing, setEditing] = useState(false);`). For manual factories, render an "Edit production" button (e.g. next to the tabs) and, when `editing`, render the form pre-filled instead of/above the tabs:

```tsx
			{factory.production.source === "manual" && (
				<div>
					{editing ? (
						<ManualFactoryForm
							gameId={gameId}
							factoryId={factory._id}
							initial={{
								name: factory.name,
								status: factory.status,
								inputs: factory.production.inputs,
								outputs: factory.production.outputs,
								machines: factory.production.machines,
							}}
							onClose={() => setEditing(false)}
						/>
					) : (
						<button
							type="button"
							onClick={() => setEditing(true)}
							className="self-start rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink)]"
						>
							Edit production
						</button>
					)}
				</div>
			)}
```

Place this block between the description input and the tab bar.

- [ ] **Step 4: Verify typecheck + build + test**

Run: `npm run typecheck && npm run build && npm test`
Expected: all green.

- [ ] **Step 5: Manual verification**

Open a manual factory → "Edit production" → change inputs/outputs/machines → "Save changes" → values persist; the Build cost tab reflects the new machines; the Plan tab graph reflects the new outputs.

- [ ] **Step 6: Commit**

```bash
git add src/features/factories/MachineEditor.tsx src/features/factories/ManualFactoryForm.tsx src/features/factories/FactoryDetail.tsx
git commit -m "feat: edit manual factory production (inputs/outputs/machines)"
```

---

## Group D — Game editing + finalize

### Task 6: Game rename / description / delete (owner-only)

**Files:**
- Modify: `src/features/games/GameSettings.tsx`

- [ ] **Step 1: Add an owner-only edit section**

In `GameSettings.tsx`, add imports (`useNavigate` from `@tanstack/react-router`) and the mutations:

```tsx
	const rename = useMutation(api.games.rename);
	const removeGame = useMutation(api.games.remove);
	const navigate = useNavigate();
	const [name, setName] = useState(game.name);
	const [description, setDescription] = useState(game.description ?? "");
```

(Place the `useState` calls with the other hooks — note `game` is loaded by then; initialise from it. If lint flags initialising state from a prop/query, seed with `""` and add a `useEffect` to sync when `game` first loads. Simplest: keep the `if (!game) return …` guard ABOVE these hooks is NOT allowed — instead initialise `name`/`description` to `""` and sync via `useEffect(() => { if (game) { setName(game.name); setDescription(game.description ?? ""); } }, [game])`.)

Add an owner-only section (after the invite section), inside the `{isOwner && (…)}` area or its own block:

```tsx
			{isOwner && (
				<section className="flex flex-col gap-2">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
						Game
					</h2>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						aria-label="Game name"
						className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
					/>
					<input
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Description…"
						aria-label="Game description"
						className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
					/>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() =>
								rename({ gameId, name: name.trim(), description }).catch(() => {})
							}
							disabled={!name.trim()}
							className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
						>
							Save game
						</button>
						<button
							type="button"
							onClick={async () => {
								if (!confirm(`Delete "${game.name}" and all its factories?`))
									return;
								await removeGame({ gameId });
								localStorage.removeItem("activeGameId");
								navigate({ to: "/games" });
							}}
							className="rounded-lg px-3 py-2 text-sm text-red-500"
						>
							Delete game
						</button>
					</div>
				</section>
			)}
```

- [ ] **Step 2: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both green.

- [ ] **Step 3: Commit**

```bash
git add src/features/games/GameSettings.tsx
git commit -m "feat: rename/describe/delete a game from settings (owner-only)"
```

### Task 7: Final verification

- [ ] **Step 1: Full gate**

Run: `npx biome check . && npm run typecheck && npm test && npm run build`
Expected: all green (new tests: factoryToSpec; existing 110 + 3 = 113).

- [ ] **Step 2: End-to-end manual pass**

Edit a factory's status/description; edit a manual factory's I/O + machines and see Build cost/Plan update; "Open in calculator" from a plan and a manual factory, tweak, "Save changes to this factory", confirm the factory updates and you land back on it; rename and delete a game from settings.

- [ ] **Step 3: Commit any remaining wiring**

```bash
git add -A
git commit -m "chore: phase 8 final wiring + verification"
```

---

## Self-review notes (coverage vs spec)

- §1 `factoryToSpec` → Task 1. §2 manual graph (solve I/O) → Task 4 (Steps 1, 3). §3 open-in-calculator + save-back-in-place → Tasks 2, 3, 4. §4 factory editing (status/description/manual production + MachineEditor) → Tasks 4, 5. §5 game editing (rename/description/delete) → Task 6. §6 error handling (toast wraps, `factoryToSpec` empty fallback, infeasible/empty solve states) → Tasks 1, 3, 4, 6. §7 testing → Task 1 (pure), component/manual per UI task.
- Type consistency: `factoryToSpec(production): ProblemSpec` (Task 1) used in Tasks 4. `fromFactory`/`fromGame` strings threaded through the route search (Task 2) → `SaveAsFactoryButton` props (Task 3) ← factory detail `Link` search (Task 4). `MachineCount` (existing type) used by `MachineEditor` (Task 5) and `ManualFactoryForm`. `FactoryStatus` used by the status select (Task 4) and form (Task 5).
- The calculator URL-mirror effect (Task 2) preserves `fromFactory`/`fromGame` so the round-trip params survive plan edits.
