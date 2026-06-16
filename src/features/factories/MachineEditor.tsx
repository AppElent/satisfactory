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
