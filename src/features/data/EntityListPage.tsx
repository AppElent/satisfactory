import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import EntityCardGrid from "#/components/data/EntityCardGrid";
import SearchFilterBar from "#/components/data/SearchFilterBar";
import type { EntityListConfig } from "./list-config";

interface EntityListPageProps<T extends { slug: string }> {
	config: EntityListConfig<T>;
	/** The route id whose search params back this page (for useSearch/navigate). */
	routeId: string;
}

export default function EntityListPage<T extends { slug: string }>({
	config,
	routeId: _routeId,
}: EntityListPageProps<T>) {
	// Search params are typed per-route; index by key generically here.
	const search = useSearch({ strict: false }) as Record<string, string>;
	const navigate = useNavigate();
	const query = search.q ?? "";

	const setParam = (key: string, value: string) => {
		navigate({
			to: ".",
			search: (prev: Record<string, unknown>) => ({
				...prev,
				[key]: value === "" ? undefined : value,
			}),
			replace: true,
		});
	};

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();
		return config.getAll().filter((entity) => {
			if (q && !config.searchText(entity).toLowerCase().includes(q)) {
				return false;
			}
			for (const filter of config.filters) {
				const selected = search[filter.key] ?? "";
				if (selected && !filter.matches(entity, selected)) return false;
			}
			return true;
		});
	}, [config, query, search]);

	return (
		<div className="flex flex-col gap-5">
			<SearchFilterBar
				search={query}
				onSearchChange={(v) => setParam("q", v)}
				filters={config.filters.map((filter) => ({
					key: filter.key,
					label: filter.label,
					options: filter.options,
					selected: search[filter.key] ?? "",
					onChange: (v) => setParam(filter.key, v),
				}))}
			/>
			<p className="text-xs text-[var(--sea-ink-soft)]">
				{results.length} result{results.length === 1 ? "" : "s"}
			</p>
			<EntityCardGrid
				items={results.map((entity) => ({
					slug: entity.slug,
					to: config.detailTo,
					params: { slug: entity.slug },
					content: config.renderCard(entity),
				}))}
			/>
		</div>
	);
}
