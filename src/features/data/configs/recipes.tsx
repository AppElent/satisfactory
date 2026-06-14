import EntityIcon from "#/components/EntityIcon";
import { getBuilding, getItem, listRecipes } from "#/data";
import type { Recipe } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

function primaryProductIcon(recipe: Recipe): { name: string; icon?: string } {
	const first = recipe.products[0];
	if (!first) return { name: recipe.name };
	const item = getItem(first.item);
	if (item) return { name: item.name, icon: item.icon };
	const building = getBuilding(first.item);
	return building
		? { name: building.name, icon: building.icon }
		: { name: recipe.name };
}

export const recipesListConfig: EntityListConfig<Recipe> = {
	detailTo: "/data/recipes/$slug",
	getAll: listRecipes,
	searchText: (recipe) => recipe.name,
	filters: [
		{
			key: "kind",
			label: "Kind",
			options: [
				{ value: "standard", label: "Standard" },
				{ value: "alternate", label: "Alternate" },
			],
			matches: (recipe, value) =>
				value === "alternate" ? recipe.alternate : !recipe.alternate,
		},
	],
	renderCard: (recipe) => {
		const product = primaryProductIcon(recipe);
		return (
			<>
				<EntityIcon icon={product.icon} name={product.name} size={48} />
				<span className="text-xs font-medium text-[var(--sea-ink)]">
					{recipe.name}
				</span>
			</>
		);
	},
};
