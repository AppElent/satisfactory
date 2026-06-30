import EntityIcon from "#/components/EntityIcon";
import { Input } from "#/components/ui/input";
import { getItem } from "#/data";
import ItemPicker from "./ItemPicker";
import type { AvailableInput } from "./solver";

interface AvailableInputsEditorProps {
	inputs: AvailableInput[];
	onChange: (inputs: AvailableInput[]) => void;
}

/** Items the user already produces. A blank rate means "unlimited". */
export default function AvailableInputsEditor({
	inputs,
	onChange,
}: AvailableInputsEditorProps) {
	const add = (item: string) => onChange([...inputs, { item }]);
	const setRate = (item: string, rate: number | undefined) =>
		onChange(inputs.map((i) => (i.item === item ? { ...i, rate } : i)));
	const remove = (item: string) =>
		onChange(inputs.filter((i) => i.item !== item));

	return (
		<div className="flex flex-col gap-3">
			{inputs.map((input) => {
				const item = getItem(input.item);
				return (
					<div
						key={input.item}
						className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2"
					>
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? input.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--text-primary)]">
							{item?.name ?? input.item}
						</span>
						<Input
							type="number"
							min={0}
							value={input.rate ?? ""}
							placeholder="∞"
							onChange={(e) =>
								setRate(
									input.item,
									e.target.value === "" ? undefined : Number(e.target.value),
								)
							}
							aria-label={`${item?.name ?? input.item} available per minute`}
							className="w-20 text-right font-[var(--font-mono)] text-[var(--orange-400)]"
						/>
						<span className="text-xs text-[var(--text-muted)]">/min</span>
						<button
							type="button"
							onClick={() => remove(input.item)}
							aria-label={`Remove ${item?.name ?? input.item}`}
							className="rounded-[var(--radius-sm)] px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
						>
							×
						</button>
					</div>
				);
			})}
			<ItemPicker
				placeholder="Add an input you already make…"
				exclude={inputs.map((i) => i.item)}
				onPick={add}
			/>
		</div>
	);
}
