import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import { getBuildable, getBuilding, getItem, getRecipe } from "#/data";
import type { Recipe } from "#/data/schema";
import { formatNumber, formatPower, perMinute } from "#/lib/format";

export const Route = createFileRoute("/data/recipes/$slug")({
	loader: ({ params }) => {
		const recipe = getRecipe(params.slug);
		if (!recipe) throw notFound();
		return { recipe };
	},
	component: RecipeDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--text-muted)]">
			Unknown recipe.{" "}
			<Link to="/data/recipes" className="text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]">
				Browse all recipes
			</Link>
		</p>
	),
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: `${loaderData.recipe.name} — Satisfactory Planner` },
					{
						name: "description",
						content: `Ingredients, products and machine for ${loaderData.recipe.name}.`,
					},
				]
			: [],
	}),
});

function ref(slug: string): { name: string; icon?: string; to?: string } {
	const item = getItem(slug);
	if (item) return { name: item.name, icon: item.icon, to: "item" };
	const buildable = getBuildable(slug);
	if (buildable)
		return { name: buildable.name, icon: buildable.icon, to: "buildable" };
	const building = getBuilding(slug);
	if (building)
		return { name: building.name, icon: building.icon, to: "building" };
	return { name: slug };
}

function PartList({
	parts,
	time,
	title,
}: {
	parts: Recipe["ingredients"];
	time: number;
	title: string;
}) {
	return (
		<DetailSection title={title}>
			<div className="flex flex-col gap-2">
				{parts.map((part) => {
					const r = ref(part.item);
					const row = (
						<span className="flex items-center gap-2">
							<EntityIcon icon={r.icon} name={r.name} size={24} />
							<span className="font-medium text-[var(--text-primary)]">
								{r.name}
							</span>
							<span className="ml-auto text-xs text-[var(--text-muted)]">
								{formatNumber(part.amount)} ·{" "}
								{formatNumber(perMinute(part.amount, time))}/min
							</span>
						</span>
					);
					return (
						<div
							key={part.item}
							className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
						>
							{r.to === "item" ? (
								<Link
									to="/data/items/$slug"
									params={{ slug: part.item }}
									className="no-underline"
								>
									{row}
								</Link>
							) : (
								row
							)}
						</div>
					);
				})}
			</div>
		</DetailSection>
	);
}

function RecipeDetail() {
	const { recipe } = Route.useLoaderData();
	const machine = recipe.producedIn[0]
		? getBuilding(recipe.producedIn[0])
		: undefined;
	return (
		<DetailLayout
			name={recipe.name}
			kicker={recipe.alternate ? "Alternate recipe" : "Recipe"}
		>
			<StatGrid
				stats={[
					{ label: "Craft time", value: `${formatNumber(recipe.time)}s` },
					{ label: "Machine", value: machine?.name ?? "—" },
					{
						label: "Power",
						value: machine ? formatPower(machine.powerConsumption) : "—",
					},
					{ label: "Type", value: recipe.alternate ? "Alternate" : "Standard" },
				]}
			/>
			<PartList
				parts={recipe.ingredients}
				time={recipe.time}
				title="Ingredients"
			/>
			<PartList parts={recipe.products} time={recipe.time} title="Products" />
		</DetailLayout>
	);
}
