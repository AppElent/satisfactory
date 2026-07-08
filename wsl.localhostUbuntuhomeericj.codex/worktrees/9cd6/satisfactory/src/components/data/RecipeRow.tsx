import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Icon } from "#/components/ui/icon";
import { getBuildable, getBuilding, getItem } from "#/data";
import type { Recipe } from "#/data/schema";
import { formatNumber, perMinute } from "#/lib/format";

/** Resolve an amount-ref slug to a display name + icon. A recipe product can be
 *  an item, a building, or a buildable (~460 build recipes produce buildables). */
function resolveRef(slug: string): { name: string; icon?: string } {
	const item = getItem(slug);
	if (item) return { name: item.name, icon: item.icon };
	const buildable = getBuildable(slug);
	if (buildable) return { name: buildable.name, icon: buildable.icon };
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
			className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-[18px] py-[14px] no-underline shadow-[var(--bevel-top),var(--shadow-sm)] transition hover:border-[var(--border-strong)]"
		>
			{/* Name + building */}
			<div className="w-[150px] shrink-0">
				<div className="font-display text-[14px] font-bold uppercase tracking-[0.02em] text-[var(--text-primary)]">
					{recipe.name}
				</div>
				{machine && (
					<div className="mt-[3px] text-[11px] text-[var(--text-muted)]">
						{machine.name}
					</div>
				)}
			</div>

			{/* Ingredients → arrow → products */}
			<div className="flex min-w-0 flex-1 items-center gap-[10px]">
				<span className="truncate font-mono text-[12px] text-[var(--text-secondary)]">
					{recipe.ingredients
						.map((ing) => {
							const ref = resolveRef(ing.item);
							return `${formatNumber(perMinute(ing.amount, recipe.time))}× ${ref.name}`;
						})
						.join(", ")}
				</span>
				<Icon
					name="arrow"
					size={18}
					className="shrink-0 text-[var(--orange-500)]"
				/>
				<span className="shrink-0 font-mono text-[12px] text-[var(--orange-300)]">
					{recipe.products
						.map((p) => {
							const ref = resolveRef(p.item);
							return `${formatNumber(perMinute(p.amount, recipe.time))}× ${ref.name}`;
						})
						.join(", ")}
				</span>
			</div>

			{/* Alt badge */}
			{recipe.alternate && (
				<Badge tone="accent" size="sm">
					Alt
				</Badge>
			)}

			{/* Rate */}
			<span className="w-[70px] shrink-0 text-right font-mono text-[12px] text-[var(--text-muted)]">
				{recipe.products[0]
					? `${formatNumber(perMinute(recipe.products[0].amount, recipe.time))}/min`
					: ""}
			</span>
		</Link>
	);
}
