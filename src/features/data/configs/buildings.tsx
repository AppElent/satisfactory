import EntityIcon from "#/components/EntityIcon";
import { listBuildings } from "#/data";
import type { Building } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

export const buildingsListConfig: EntityListConfig<Building> = {
	detailTo: "/data/buildings/$slug",
	getAll: listBuildings,
	searchText: (building) => building.name,
	filters: [
		{
			key: "power",
			label: "Power",
			options: [
				{ value: "consumer", label: "Consumes" },
				{ value: "none", label: "No power" },
			],
			matches: (building, value) =>
				value === "consumer"
					? building.powerConsumption > 0
					: building.powerConsumption === 0,
		},
	],
	renderCard: (building) => (
		<>
			<EntityIcon icon={building.icon} name={building.name} size={48} />
			<span className="text-xs font-medium text-[var(--sea-ink)]">
				{building.name}
			</span>
		</>
	),
};
