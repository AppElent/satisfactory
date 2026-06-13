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
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown item.{" "}
			<Link to="/data/items" className="nav-link">
				Browse all items
			</Link>
		</p>
	),
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
				className="nav-link w-fit text-sm"
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
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Available from the start.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{unlocks.map((schematic) => (
							<span
								key={schematic.slug}
								className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
							>
								{schematic.name}
							</span>
						))}
					</div>
				)}
			</DetailSection>
		</DetailLayout>
	);
}
