import { Link } from "@tanstack/react-router";
import EntityIcon from "#/components/EntityIcon";
import { getBuilding, getItem } from "#/data";
import type { Recipe } from "#/data/schema";
import { formatNumber, perMinute } from "#/lib/format";

/** Resolve an amount-ref slug to a display name + icon (item or building). */
function resolveRef(slug: string): { name: string; icon?: string } {
	const item = getItem(slug);
	if (item) return { name: item.name, icon: item.icon };
	const building = getBuilding(slug);
	if (building) return { name: building.name, icon: building.icon };
	return { name: slug };
}

export default function RecipeRow({ recipe }: { recipe: Recipe }) {
	const machine = recipe.producedIn[0]
		? getBuilding(recipe.producedIn[0])
		: undefined;
	return (
		<Link
			to="/data/recipes/$slug"
			params={{ slug: recipe.slug }}
			className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm no-underline transition hover:border-[var(--chip-line)]"
		>
			{recipe.alternate && (
				<span className="rounded-full bg-[var(--link-bg-hover)] px-2 py-0.5 text-[10px] uppercase text-[var(--sea-ink-soft)]">
					alt
				</span>
			)}
			<span className="font-medium text-[var(--sea-ink)]">{recipe.name}</span>
			<span className="ml-auto flex items-center gap-2 text-xs text-[var(--sea-ink-soft)]">
				{recipe.products.map((p) => {
					const ref = resolveRef(p.item);
					return (
						<span key={p.item} className="flex items-center gap-1">
							<EntityIcon icon={ref.icon} name={ref.name} size={18} />
							{formatNumber(perMinute(p.amount, recipe.time))}/min
						</span>
					);
				})}
				{machine ? `· ${machine.name}` : ""}
			</span>
		</Link>
	);
}
