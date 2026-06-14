import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import RecipeRow from "#/components/data/RecipeRow";
import EntityIcon from "#/components/EntityIcon";
import { getBuilding, getItem, listRecipes } from "#/data";
import { getBuildCost } from "#/data/queries";
import { formatNumber, formatPower } from "#/lib/format";

export const Route = createFileRoute("/data/buildings/$slug")({
	loader: ({ params }) => {
		const building = getBuilding(params.slug);
		if (!building) throw notFound();
		return { building };
	},
	component: BuildingDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown building.{" "}
			<Link to="/data/buildings" className="nav-link">
				Browse all buildings
			</Link>
		</p>
	),
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: `${loaderData.building.name} — Satisfactory Planner` },
					{
						name: "description",
						content:
							loaderData.building.description?.slice(0, 150) ||
							`Power use, build cost and recipes for ${loaderData.building.name} in Satisfactory.`,
					},
				]
			: [],
	}),
});

function BuildingDetail() {
	const { building } = Route.useLoaderData();
	const buildCost = getBuildCost(building.slug);
	const recipesHere = listRecipes().filter((r) =>
		r.producedIn.includes(building.slug),
	);

	return (
		<DetailLayout
			icon={building.icon}
			name={building.name}
			kicker="Building"
			description={building.description}
		>
			<StatGrid
				stats={[
					{ label: "Power use", value: formatPower(building.powerConsumption) },
					{
						label: "Speed",
						value: building.manufacturingSpeed
							? `${formatNumber(building.manufacturingSpeed)}×`
							: "—",
					},
					{ label: "Recipes", value: formatNumber(recipesHere.length) },
					{
						label: "Footprint",
						value: building.size.width
							? `${formatNumber(building.size.width)}×${formatNumber(building.size.length)}`
							: "—",
					},
				]}
			/>

			{buildCost && (
				<DetailSection title="Build cost">
					<div className="flex flex-wrap gap-2">
						{buildCost.ingredients.map((part) => {
							const item = getItem(part.item);
							return (
								<span
									key={part.item}
									className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1 text-sm"
								>
									<EntityIcon
										icon={item?.icon}
										name={item?.name ?? part.item}
										size={18}
									/>
									{formatNumber(part.amount)} {item?.name ?? part.item}
								</span>
							);
						})}
					</div>
				</DetailSection>
			)}

			{recipesHere.length > 0 && (
				<DetailSection title="Produces">
					<div className="flex flex-col gap-2">
						{recipesHere.map((recipe) => (
							<RecipeRow key={recipe.slug} recipe={recipe} />
						))}
					</div>
				</DetailSection>
			)}
		</DetailLayout>
	);
}
