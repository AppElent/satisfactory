import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import DetailLayout, {
	DetailSection,
	StatGrid,
} from "#/components/data/DetailLayout";
import EntityIcon from "#/components/EntityIcon";
import { getBuildable, getItem } from "#/data";
import { getBuildCost } from "#/data/queries";
import { formatNumber } from "#/lib/format";

export const Route = createFileRoute("/data/buildables/$slug")({
	loader: ({ params }) => {
		const buildable = getBuildable(params.slug);
		if (!buildable) throw notFound();
		return { buildable };
	},
	component: BuildableDetail,
	notFoundComponent: () => (
		<p className="py-12 text-center text-[var(--sea-ink-soft)]">
			Unknown buildable.{" "}
			<Link to="/data/buildables" className="nav-link">
				Browse all buildables
			</Link>
		</p>
	),
});

function BuildableDetail() {
	const { buildable } = Route.useLoaderData();
	const buildCost = getBuildCost(buildable.slug);
	return (
		<DetailLayout
			icon={buildable.icon}
			name={buildable.name}
			kicker={buildable.categories[0] ?? "Buildable"}
			description={buildable.description}
		>
			<StatGrid
				stats={[
					{
						label: "Footprint",
						value: buildable.size.width
							? `${formatNumber(buildable.size.width)}×${formatNumber(buildable.size.length)}`
							: "—",
					},
					{
						label: "Categories",
						value: buildable.categories.length
							? formatNumber(buildable.categories.length)
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
		</DetailLayout>
	);
}
