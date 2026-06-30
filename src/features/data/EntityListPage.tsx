import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import EntityCardGrid from "#/components/data/EntityCardGrid";
import SearchFilterBar from "#/components/data/SearchFilterBar";
import { Panel } from "#/components/ui/panel";
import type { EntityListConfig } from "./list-config";

interface EntityListPageProps<T extends { slug: string }> {
	config: EntityListConfig<T>;
}

/** Read a search param as a string, tolerating the router coercing e.g. ?q=123
 *  to a number when a route omits validateSearch or the URL is hand-edited. */
function strParam(search: Record<string, unknown>, key: string): string {
	const value = search[key];
	return typeof value === "string" ? value : "";
}

export default function EntityListPage<T extends { slug: string }>({
	config,
}: EntityListPageProps<T>) {
	// Search params are typed per-route; read them generically and defensively.
	const search = useSearch({ strict: false }) as Record<string, unknown>;
	const navigate = useNavigate();
	const query = strParam(search, "q");

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
				const selected = strParam(search, filter.key);
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
					selected: strParam(search, filter.key),
					onChange: (v) => setParam(filter.key, v),
				}))}
			/>
			<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
				{results.length} result{results.length === 1 ? "" : "s"}
			</p>
			<Panel>
				<div className="p-4">
					<EntityCardGrid
						items={results.map((entity) => ({
							slug: entity.slug,
							to: config.detailTo,
							params: { slug: entity.slug },
							content: config.renderCard(entity),
						}))}
					/>
				</div>
			</Panel>
		</div>
	);
}
