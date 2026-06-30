import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import { getItem, getRecipe, getSchematic } from "#/data";
import { formatNumber } from "#/lib/format";

export const Route = createFileRoute("/data/schematics/$slug")({
	loader: ({ params }) => {
		const schematic = getSchematic(params.slug);
		if (!schematic) throw notFound();
		return { schematic };
	},
	component: SchematicDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--text-muted)]">
			Unknown schematic.{" "}
			<Link to="/data/schematics" className="text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]">
				Browse all schematics
			</Link>
		</p>
	),
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: `${loaderData.schematic.name} — Satisfactory Planner` },
					{
						name: "description",
						content: `Cost, unlocked recipes and tier for ${loaderData.schematic.name}.`,
					},
				]
			: [],
	}),
});

function SchematicDetail() {
	const { schematic } = Route.useLoaderData();
	return (
		<DetailLayout
			icon={schematic.icon}
			name={schematic.name}
			kicker={schematic.type}
		>
			<StatGrid
				stats={[
					{ label: "Tier", value: formatNumber(schematic.tier) },
					{ label: "Type", value: schematic.type },
					{ label: "MAM", value: schematic.mam ? "Yes" : "No" },
					{ label: "Alternate", value: schematic.alternate ? "Yes" : "No" },
				]}
			/>

			{schematic.cost.length > 0 && (
				<DetailSection title="Cost">
					<div className="flex flex-wrap gap-2">
						{schematic.cost.map((part) => {
							const item = getItem(part.item);
							return (
								<span
									key={part.item}
									className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-1 text-sm"
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

			{schematic.unlockRecipes.length > 0 && (
				<DetailSection title="Unlocks recipes">
					<div className="flex flex-wrap gap-2">
						{schematic.unlockRecipes.map((recipeSlug) => {
							const recipe = getRecipe(recipeSlug);
							if (!recipe) return null;
							return (
								<Link
									key={recipeSlug}
									to="/data/recipes/$slug"
									params={{ slug: recipeSlug }}
									className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs no-underline hover:border-[var(--border-default)]"
								>
									{recipe.name}
								</Link>
							);
						})}
					</div>
				</DetailSection>
			)}

			{schematic.requiredSchematics.length > 0 && (
				<DetailSection title="Requires">
					<div className="flex flex-wrap gap-2">
						{schematic.requiredSchematics.map((reqSlug) => {
							const req = getSchematic(reqSlug);
							if (!req) return null;
							return (
								<Link
									key={reqSlug}
									to="/data/schematics/$slug"
									params={{ slug: reqSlug }}
									className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs no-underline hover:border-[var(--border-default)]"
								>
									{req.name}
								</Link>
							);
						})}
					</div>
				</DetailSection>
			)}
		</DetailLayout>
	);
}
