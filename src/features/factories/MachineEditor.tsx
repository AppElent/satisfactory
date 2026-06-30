import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { IconButton } from "#/components/ui/icon-button";
import { Input } from "#/components/ui/input";
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
			<h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
				Machines
			</h3>
			{rows.map((r, rowIdx) => {
				const i = rowIdx;
				return (
					<div
						key={`${r.building}-${i}`}
						className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2"
					>
						<select
							aria-label="Building"
							value={r.building}
							onChange={(e) => set(i, { ...r, building: e.target.value })}
							className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-2 py-1 text-[13px] text-[var(--text-primary)]"
						>
							{buildings.map((b) => (
								<option key={b.slug} value={b.slug}>
									{b.name}
								</option>
							))}
						</select>
						<Input
							type="number"
							min={0}
							value={r.count}
							aria-label="Machine count"
							onChange={(e) =>
								set(i, { ...r, count: Number(e.target.value) || 0 })
							}
							className="w-16 text-right"
						/>
						<Input
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
							className="w-20 text-right"
						/>
						<IconButton
							aria-label="Remove machine"
							onClick={() => remove(i)}
							className="hover:text-[var(--red-400)]"
						>
							<Icon name="trash" size={13} />
						</IconButton>
					</div>
				);
			})}
			<Button
				variant="secondary"
				size="sm"
				onClick={add}
				className="self-start"
			>
				<Icon name="plus" size={13} />
				Add machine
			</Button>
		</div>
	);
}
