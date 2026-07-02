import EntityIcon from "#/components/EntityIcon";
import { Input } from "#/components/ui/input";
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
			{targets.map((t) => {
				const item = getItem(t.item);
				return (
					<div
						key={t.item}
						className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2"
					>
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? t.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--text-primary)]">
							{item?.name ?? t.item}
						</span>
						<Input
							type="number"
							min={0}
							value={t.rate}
							onChange={(e) => setRate(t.item, Number(e.target.value))}
							aria-label={`${item?.name ?? t.item} per minute`}
							className="w-20 text-right font-mono text-[var(--orange-400)]"
						/>
						<span className="text-xs text-[var(--text-muted)]">/min</span>
						<button
							type="button"
							onClick={() => remove(t.item)}
							aria-label={`Remove ${item?.name ?? t.item}`}
							className="rounded-[var(--radius-sm)] px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
