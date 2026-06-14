import EntityIcon from "#/components/EntityIcon";
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
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Available inputs{" "}
				<span className="font-normal normal-case">(already produced)</span>
			</h2>
			{inputs.map((input) => {
				const item = getItem(input.item);
				return (
					<div key={input.item} className="flex items-center gap-2">
						<EntityIcon
							icon={item?.icon}
							name={item?.name ?? input.item}
							size={24}
						/>
						<span className="flex-1 text-sm text-[var(--sea-ink)]">
							{item?.name ?? input.item}
						</span>
						<input
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
							className="w-20 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right text-sm"
						/>
						<span className="text-xs text-[var(--sea-ink-soft)]">/min</span>
						<button
							type="button"
							onClick={() => remove(input.item)}
							aria-label={`Remove ${item?.name ?? input.item}`}
							className="rounded-md px-2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
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
