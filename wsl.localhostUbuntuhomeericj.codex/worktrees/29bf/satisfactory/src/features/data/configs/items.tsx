import EntityIcon from "#/components/EntityIcon";
import { listItems } from "#/data";
import type { Item } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

export const itemsListConfig: EntityListConfig<Item> = {
	detailTo: "/data/items/$slug",
	getAll: listItems,
	searchText: (item) => item.name,
	filters: [
		{
			key: "form",
			label: "Form",
			options: [
				{ value: "solid", label: "Solid" },
				{ value: "fluid", label: "Fluid" },
			],
			matches: (item, value) => item.form === value,
		},
	],
	renderCard: (item) => (
		<>
			<EntityIcon icon={item.icon} name={item.name} size={48} />
			<span className="text-xs font-medium text-[var(--text-primary)]">
				{item.name}
			</span>
		</>
	),
};
