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

export default function CalculatorControls({
	mode,
	onModeChange,
	weighting,
	onWeightingChange,
}: CalculatorControlsProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Mode
				</span>
				<div className="flex gap-1">
					{MODES.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => onModeChange(opt.value)}
							className={`rounded-full border px-3 py-1 text-xs font-medium ${
								mode === opt.value
									? "border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)]"
									: "border-[var(--line)] text-[var(--sea-ink-soft)]"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Resource weighting
				</span>
				<div className="flex gap-1">
					{WEIGHTINGS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => onWeightingChange(opt.value)}
							className={`rounded-full border px-3 py-1 text-xs font-medium ${
								weighting === opt.value
									? "border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)]"
									: "border-[var(--line)] text-[var(--sea-ink-soft)]"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
