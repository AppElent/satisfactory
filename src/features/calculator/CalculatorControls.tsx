interface CalculatorControlsProps {
	mode: "produce" | "maximize";
	onModeChange: (mode: "produce" | "maximize") => void;
	weighting: "balanced" | "minimize-ore";
	onWeightingChange: (w: "balanced" | "minimize-ore") => void;
}

const MODES = [
	{ value: "produce", label: "Produce rate" },
	{ value: "maximize", label: "Maximize output" },
] as const;

const WEIGHTINGS = [
	{ value: "balanced", label: "Balanced" },
	{ value: "minimize-ore", label: "Spare the ore" },
] as const;

/** A small preset-based weighting control. "Spare the ore" down-weights the
 *  common ores so the optimizer prefers other raws when there's a choice. */
export const WEIGHTING_PRESETS: Record<
	"balanced" | "minimize-ore",
	Record<string, number> | undefined
> = {
	balanced: undefined,
	"minimize-ore": { "iron-ore": 3, "copper-ore": 3, "caterium-ore": 3 },
};

function Segmented<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: readonly { value: T; label: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div>
			<div className="mb-2.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
				{label}
			</div>
			<div className="flex gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-[3px] shadow-[var(--bevel-inset)]">
				{options.map((opt) => {
					const active = value === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => onChange(opt.value)}
							className={`relative h-8 flex-1 rounded-[2px] text-[12px] font-semibold uppercase tracking-[0.06em] ${active ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--bevel-top),var(--shadow-sm)]" : "bg-transparent text-[var(--text-muted)]"}`}
						>
							{opt.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export default function CalculatorControls({
	mode,
	onModeChange,
	weighting,
	onWeightingChange,
}: CalculatorControlsProps) {
	return (
		<div className="flex flex-col gap-[18px]">
			<Segmented
				label="Solve Mode"
				value={mode}
				options={MODES}
				onChange={onModeChange}
			/>
			<Segmented
				label="Resource Weighting"
				value={weighting}
				options={WEIGHTINGS}
				onChange={onWeightingChange}
			/>
		</div>
	);
}
