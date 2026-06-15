const SOON = ["Geysers", "Slugs", "Save-file"];

export default function LayerPanel({
	showFactories,
	showNodes,
	onToggleFactories,
	onToggleNodes,
}: {
	showFactories: boolean;
	showNodes: boolean;
	onToggleFactories: (next: boolean) => void;
	onToggleNodes: (next: boolean) => void;
}) {
	return (
		<div className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Layers
			</h2>
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					aria-label="Factory pins"
					checked={showFactories}
					onChange={(e) => onToggleFactories(e.target.checked)}
				/>
				Factory pins
			</label>
			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					aria-label="Resource nodes"
					checked={showNodes}
					onChange={(e) => onToggleNodes(e.target.checked)}
				/>
				Resource nodes
			</label>
			{SOON.map((name) => (
				<label
					key={name}
					className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]"
				>
					<input type="checkbox" aria-label={name} disabled />
					{name} <span className="text-xs">(soon)</span>
				</label>
			))}
		</div>
	);
}
