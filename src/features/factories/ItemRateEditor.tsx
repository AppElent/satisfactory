import EntityIcon from "#/components/EntityIcon";
import { Icon } from "#/components/ui/icon";
import { IconButton } from "#/components/ui/icon-button";
import { Input } from "#/components/ui/input";
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
			<h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
				{label}
			</h3>
			{rows.map((r) => {
				const item = getItem(r.item);
				return (
					<div
						key={r.item}
						className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2"
					>
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? r.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--text-primary)]">
							{item?.name ?? r.item}
						</span>
						<Input
							type="number"
							min={0}
							value={r.rate}
							onChange={(e) => setRate(r.item, Number(e.target.value))}
							aria-label={`${item?.name ?? r.item} per minute`}
							className="w-20 text-right"
						/>
						<IconButton
							aria-label={`Remove ${item?.name ?? r.item}`}
							onClick={() => remove(r.item)}
							className="hover:text-[var(--red-400)]"
						>
							<Icon name="trash" size={13} />
						</IconButton>
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
