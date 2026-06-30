import { Panel } from "#/components/ui/panel";
import { Switch } from "#/components/ui/switch";

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
		<Panel title="Layers">
			<div className="flex flex-col gap-0">
				<LayerRow
					label="Factory pins"
					checked={showFactories}
					onCheckedChange={onToggleFactories}
				/>
				<LayerRow
					label="Resource nodes"
					checked={showNodes}
					onCheckedChange={onToggleNodes}
				/>
				{SOON.map((name) => (
					<LayerRow key={name} label={name} checked={false} disabled soon />
				))}
			</div>
		</Panel>
	);
}

function LayerRow({
	label,
	checked,
	onCheckedChange,
	disabled,
	soon,
}: {
	label: string;
	checked: boolean;
	onCheckedChange?: (next: boolean) => void;
	disabled?: boolean;
	soon?: boolean;
}) {
	return (
		<div className="flex items-center gap-3 border-t border-[var(--border-subtle)] px-4 py-[10px]">
			<Switch
				aria-label={label}
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
			/>
			<span
				className={`text-[13px] ${disabled ? "text-[var(--text-disabled)]" : "text-[var(--text-secondary)]"}`}
			>
				{label}
				{soon && (
					<span className="ml-1.5 text-[11px] text-[var(--text-disabled)]">
						(soon)
					</span>
				)}
			</span>
		</div>
	);
}
