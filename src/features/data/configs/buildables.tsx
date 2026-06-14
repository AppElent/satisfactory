import EntityIcon from "#/components/EntityIcon";
import { listBuildables } from "#/data";
import type { Buildable } from "#/data/schema";
import type { EntityListConfig } from "../list-config";

const categoryOptions = (() => {
	const set = new Set<string>();
	for (const b of listBuildables()) for (const c of b.categories) set.add(c);
	return [...set].sort().map((c) => ({ value: c, label: c }));
})();

export const buildablesListConfig: EntityListConfig<Buildable> = {
	detailTo: "/data/buildables/$slug",
	getAll: listBuildables,
	searchText: (buildable) => buildable.name,
	filters:
		categoryOptions.length > 0
			? [
					{
						key: "category",
						label: "Category",
						options: categoryOptions,
						matches: (buildable, value) => buildable.categories.includes(value),
					},
				]
			: [],
	renderCard: (buildable) => (
		<>
			<EntityIcon icon={buildable.icon} name={buildable.name} size={48} />
			<span className="text-xs font-medium text-[var(--sea-ink)]">
				{buildable.name}
			</span>
		</>
	),
};
