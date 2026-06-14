import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import ItemPicker from "#/features/calculator/ItemPicker";
import type { ItemRate } from "./types";

export default function ItemRateEditor({
	label,
	rows,
	onChange,
}: {
	label: string;
	rows: ItemRate[];
	onChange: (rows: ItemRate[]) => void;
}) {
	const add = (item: string) => onChange([...rows, { item, rate: 60 }]);
	const setRate = (item: string, rate: number) =>
		onChange(rows.map((r) => (r.item === item ? { ...r, rate } : r)));
	const remove = (item: string) =>
		onChange(rows.filter((r) => r.item !== item));

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				{label}
			</h3>
			{rows.map((r) => {
				const item = getItem(r.item);
				return (
					<div key={r.item} className="flex items-center gap-2">
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? r.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--sea-ink)]">
							{item?.name ?? r.item}
						</span>
						<input
							type="number"
							min={0}
							value={r.rate}
							onChange={(e) => setRate(r.item, Number(e.target.value))}
							aria-label={`${item?.name ?? r.item} per minute`}
							className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
						/>
						<button
							type="button"
							onClick={() => remove(r.item)}
							aria-label={`Remove ${item?.name ?? r.item}`}
							className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							×
						</button>
					</div>
				);
			})}
			<ItemPicker
				placeholder={`Add to ${label.toLowerCase()}…`}
				exclude={rows.map((r) => r.item)}
				onPick={add}
			/>
		</div>
	);
}
