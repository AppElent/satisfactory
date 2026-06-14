import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import ItemPicker from "./ItemPicker";
import type { Target } from "./solver";

interface TargetEditorProps {
	targets: Target[];
	onChange: (targets: Target[]) => void;
}

export default function TargetEditor({ targets, onChange }: TargetEditorProps) {
	const add = (item: string) => onChange([...targets, { item, rate: 60 }]);
	const setRate = (item: string, rate: number) =>
		onChange(targets.map((t) => (t.item === item ? { ...t, rate } : t)));
	const remove = (item: string) =>
		onChange(targets.filter((t) => t.item !== item));

	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Targets
			</h2>
			{targets.map((t) => {
				const item = getItem(t.item);
				return (
					<div key={t.item} className="flex items-center gap-2">
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? t.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--sea-ink)]">
							{item?.name ?? t.item}
						</span>
						<input
							type="number"
							min={0}
							value={t.rate}
							onChange={(e) => setRate(t.item, Number(e.target.value))}
							aria-label={`${item?.name ?? t.item} per minute`}
							className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
						/>
						<span className="text-xs text-[var(--sea-ink-soft)]">/min</span>
						<button
							type="button"
							onClick={() => remove(t.item)}
							aria-label={`Remove ${item?.name ?? t.item}`}
							className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						>
							×
						</button>
					</div>
				);
			})}
			<ItemPicker
				placeholder="Add an item to produce…"
				exclude={targets.map((t) => t.item)}
				onPick={add}
			/>
		</div>
	);
}
