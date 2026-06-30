import EntityIcon from "#/components/EntityIcon";
import { listSchematics } from "#/data";
import type { Schematic } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

const tierOptions = (() => {
	const set = new Set<number>();
	for (const s of listSchematics()) set.add(s.tier);
	return [...set]
		.sort((a, b) => a - b)
		.map((t) => ({ value: String(t), label: `Tier ${t}` }));
})();

export const schematicsListConfig: EntityListConfig<Schematic> = {
	detailTo: "/data/schematics/$slug",
	getAll: listSchematics,
	searchText: (schematic) => schematic.name,
	filters: [
		{
			key: "tier",
			label: "Tier",
			options: tierOptions,
			matches: (schematic, value) => String(schematic.tier) === value,
		},
		{
			key: "kind",
			label: "Kind",
			options: [
				{ value: "alternate", label: "Alternate" },
				{ value: "mam", label: "MAM" },
			],
			matches: (schematic, value) =>
				value === "alternate" ? schematic.alternate : schematic.mam,
		},
	],
	renderCard: (schematic) => (
		<>
			<EntityIcon icon={schematic.icon} name={schematic.name} size={48} />
			<span className="text-xs font-medium text-[var(--text-primary)]">
				{schematic.name}
			</span>
		</>
	),
};
