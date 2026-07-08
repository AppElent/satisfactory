import { Checkbox } from "#/components/ui/checkbox";
import { getBuilding, getItem, getRecipe } from "#/data";
import type { Recipe } from "#/data/schema";
import type { Solution } from "./solver";

interface UsedAlternatesReviewProps {
	solution: Solution;
	allowedAlternates: string[];
	onToggle: (recipeSlug: string) => void;
}

export default function UsedAlternatesReview({
	solution,
	allowedAlternates,
	onToggle,
}: UsedAlternatesReviewProps) {
	if (solution.status !== "optimal") return null;

	const allowed = new Set(allowedAlternates);
	const usedAlternates = solution.recipes
		.map((usage) => getRecipe(usage.recipe))
		.filter((recipe): recipe is Recipe => recipe?.alternate === true);

	if (usedAlternates.length === 0) return null;

	return (
		<section className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-4">
			<div className="mb-3">
				<h3 className="font-[var(--font-display)] text-sm uppercase tracking-[0.06em] text-[var(--text-primary)]">
					Used alternates
				</h3>
				<p className="mt-1 text-sm text-[var(--text-muted)]">
					Uncheck a recipe to exclude it and re-solve this plan.
				</p>
			</div>
			<div className="flex flex-col gap-2">
				{usedAlternates.map((recipe) => {
					const productSlug = recipe.products[0]?.item;
					const product = productSlug ? getItem(productSlug) : undefined;
					const machineSlug = recipe.producedIn[0];
					const machine = machineSlug ? getBuilding(machineSlug) : undefined;

					return (
						<div
							key={recipe.slug}
							className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2"
						>
							<Checkbox
								checked={allowed.has(recipe.slug)}
								onCheckedChange={() => onToggle(recipe.slug)}
								aria-label={recipe.name}
							/>
							<div>
								<p className="text-sm font-semibold text-[var(--text-primary)]">
									{recipe.name}
								</p>
								<p className="text-xs text-[var(--text-muted)]">
									{product?.name ?? productSlug ?? "Unknown product"}
									{machine ? ` - ${machine.name}` : ""}
								</p>
							</div>
							<span className="font-mono text-xs text-[var(--orange-400)]">
								ACTIVE
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}
