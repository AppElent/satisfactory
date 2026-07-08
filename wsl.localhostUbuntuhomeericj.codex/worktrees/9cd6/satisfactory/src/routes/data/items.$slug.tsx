import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import RecipeRow from "#/components/data/RecipeRow";
import { getItem, getRecipesUsing } from "#/data";
import {
	getAlternateRecipes,
	getStandardRecipes,
	getUnlockingSchematics,
} from "#/data/queries";
import { formatNumber } from "#/lib/format";

export const Route = createFileRoute("/data/items/$slug")({
	loader: ({ params }) => {
		const item = getItem(params.slug);
		if (!item) throw notFound();
		return { item };
	},
	component: ItemDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--text-muted)]">
			Unknown item.{" "}
			<Link
				to="/data/items"
				className="text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]"
			>
				Browse all items
			</Link>
		</p>
	),
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{ title: `${loaderData.item.name} — Satisfactory Planner` },
					{
						name: "description",
						content:
							loaderData.item.description?.slice(0, 150) ||
							`Recipes, uses and unlocks for ${loaderData.item.name} in Satisfactory.`,
					},
				]
			: [],
	}),
});

function ItemDetail() {
	const { item } = Route.useLoaderData();
	const standard = getStandardRecipes(item.slug);
	const alternate = getAlternateRecipes(item.slug);
	const usedIn = getRecipesUsing(item.slug);
	const unlocks = getUnlockingSchematics(item.slug);

	return (
		<DetailLayout
			icon={item.icon}
			name={item.name}
			kicker={item.form === "fluid" ? "Fluid" : "Item"}
			description={item.description}
		>
			<StatGrid
				stats={[
					{ label: "Stack size", value: formatNumber(item.stackSize) },
					{ label: "Sink points", value: formatNumber(item.sinkPoints) },
					{ label: "Form", value: item.form === "fluid" ? "Fluid" : "Solid" },
					{
						label: "Energy",
						value: item.energyValue
							? `${formatNumber(item.energyValue)} MJ`
							: "—",
					},
				]}
			/>

			<a
				href={`/calculator?target=${item.slug}`}
				className="w-fit text-sm text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]"
			>
				Open in calculator →
			</a>

			{(standard.length > 0 || alternate.length > 0) && (
				<DetailSection title="Produced by">
					<div className="flex flex-col gap-2">
						{[...standard, ...alternate].map((recipe) => (
							<RecipeRow key={recipe.slug} recipe={recipe} />
						))}
					</div>
				</DetailSection>
			)}

			{usedIn.length > 0 && (
				<DetailSection title="Used in">
					<div className="flex flex-col gap-2">
						{usedIn.map((recipe) => (
							<RecipeRow key={recipe.slug} recipe={recipe} />
						))}
					</div>
				</DetailSection>
			)}

			<DetailSection title="Unlocked by">
				{unlocks.length === 0 ? (
					<p className="text-sm text-[var(--text-muted)]">
						Available from the start.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{unlocks.map((schematic) => (
							<Link
								key={schematic.slug}
								to="/data/schematics/$slug"
								params={{ slug: schematic.slug }}
								className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs no-underline hover:border-[var(--border-default)]"
							>
								{schematic.name}
							</Link>
						))}
					</div>
				)}
			</DetailSection>
		</DetailLayout>
	);
}
