import { useState } from "react";
import EntityIcon from "#/components/EntityIcon";
import { listItems } from "#/data";

interface ItemPickerProps {
	placeholder: string;
	/** Slugs already chosen — excluded from results. */
	exclude: string[];
	onPick: (slug: string) => void;
}

export default function ItemPicker({
	placeholder,
	exclude,
	onPick,
}: ItemPickerProps) {
	const [query, setQuery] = useState("");
	const excluded = new Set(exclude);
	const matches =
		query.trim().length > 0
			? listItems()
					.filter(
						(i) =>
							!excluded.has(i.slug) &&
							i.name.toLowerCase().includes(query.toLowerCase()),
					)
					.slice(0, 6)
			: [];

	return (
		<div className="relative">
			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="w-full rounded-full border border-[var(--border-default)] bg-[var(--bg-inset)] px-4 py-2 text-sm"
			/>
			{matches.length > 0 && (
				<div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--graphite-900)] shadow-lg">
					{matches.map((i) => (
						<button
							key={i.slug}
							type="button"
							onClick={() => {
								onPick(i.slug);
								setQuery("");
							}}
							className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)]"
						>
							<EntityIcon icon={i.icon} name={i.name} size={20} />
							{i.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
