import { useState } from "react";
import { listRecipes } from "#/data";

interface RecipeOptionsProps {
	allowedAlternates: string[];
	onChange: (allowed: string[]) => void;
}

/** All alternate, automatable recipes, sorted by name. */
function alternateRecipes() {
	return listRecipes()
		.filter((r) => r.alternate && r.inMachine && r.producedIn.length > 0)
		.sort((a, b) => a.name.localeCompare(b.name));
}

export default function RecipeOptions({
	allowedAlternates,
	onChange,
}: RecipeOptionsProps) {
	const [query, setQuery] = useState("");
	const allowed = new Set(allowedAlternates);
	const alts = alternateRecipes().filter((r) =>
		r.name.toLowerCase().includes(query.toLowerCase()),
	);

	const toggle = (slug: string) => {
		const next = new Set(allowed);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		onChange([...next]);
	};

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Alternate recipes{" "}
				<span className="font-normal normal-case">
					({allowed.size} enabled)
				</span>
			</h2>
			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Filter alternates…"
				aria-label="Filter alternate recipes"
				className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2 text-sm"
			/>
			<div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
				{alts.map((r) => (
					<label
						key={r.slug}
						className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[var(--link-bg-hover)]"
					>
						<input
							type="checkbox"
							checked={allowed.has(r.slug)}
							onChange={() => toggle(r.slug)}
						/>
						{r.name}
					</label>
				))}
			</div>
		</div>
	);
}
