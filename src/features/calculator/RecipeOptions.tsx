import { useState } from "react";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
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
			<Input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Filter alternates…"
				aria-label="Filter alternate recipes"
			/>
			<div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
				{alts.map((r) => (
					<div
						key={r.slug}
						className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
					>
						<Switch
							checked={allowed.has(r.slug)}
							onCheckedChange={() => toggle(r.slug)}
							aria-label={r.name}
						/>
						<span className="flex-1 text-[var(--text-primary)]">{r.name}</span>
					</div>
				))}
			</div>
		</div>
	);
}
