import { Icon } from "#/components/ui/icon";
import { Input } from "#/components/ui/input";

export interface FilterOption {
	value: string;
	label: string;
}

export interface FilterControl {
	key: string;
	label: string;
	options: FilterOption[];
	/** Currently selected value, or "" for "all". */
	selected: string;
	onChange: (value: string) => void;
}

interface SearchFilterBarProps {
	search: string;
	onSearchChange: (value: string) => void;
	filters: FilterControl[];
}

export default function SearchFilterBar({
	search,
	onSearchChange,
	filters,
}: SearchFilterBarProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="relative flex items-center">
				<Icon
					name="search"
					size={16}
					className="pointer-events-none absolute left-3 text-[var(--text-muted)]"
				/>
				<Input
					type="search"
					aria-label="Search"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Filter by name…"
					className="pl-9"
				/>
			</div>
			{filters.map((filter) => (
				<div key={filter.key} className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
						{filter.label}
					</span>
					<FilterChip
						label="All"
						active={filter.selected === ""}
						onClick={() => filter.onChange("")}
					/>
					{filter.options.map((option) => (
						<FilterChip
							key={option.value}
							label={option.label}
							active={filter.selected === option.value}
							onClick={() => filter.onChange(option.value)}
						/>
					))}
				</div>
			))}
		</div>
	);
}

function FilterChip({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={`inline-flex h-[30px] cursor-pointer items-center rounded-[var(--radius-sm)] border px-3 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${
				active
					? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--orange-400)]"
					: "border-[var(--border-default)] bg-[var(--bg-inset)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
			}`}
		>
			{label}
		</button>
	);
}
