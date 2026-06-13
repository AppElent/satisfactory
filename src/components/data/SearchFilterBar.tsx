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
			<input
				type="search"
				aria-label="Search"
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
				placeholder="Search…"
				className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]"
			/>
			{filters.map((filter) => (
				<div key={filter.key} className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
						{filter.label}
					</span>
					<Chip
						label="All"
						active={filter.selected === ""}
						onClick={() => filter.onChange("")}
					/>
					{filter.options.map((option) => (
						<Chip
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

function Chip({
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
			className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
				active
					? "border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)]"
					: "border-[var(--line)] text-[var(--sea-ink-soft)] hover:border-[var(--chip-line)]"
			}`}
		>
			{label}
		</button>
	);
}
