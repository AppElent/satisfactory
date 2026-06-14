import type { ReactNode } from "react";

export interface FilterDef<T> {
	/** URL search-param key. */
	key: string;
	label: string;
	options: { value: string; label: string }[];
	/** Returns true when the entity matches the selected value. */
	matches: (entity: T, value: string) => boolean;
}

export interface EntityListConfig<T extends { slug: string }> {
	/** Detail route, e.g. "/data/items/$slug". */
	detailTo: string;
	/** All entities of this type. */
	getAll: () => T[];
	/** Lowercased text searched against the query. */
	searchText: (entity: T) => string;
	filters: FilterDef<T>[];
	/** Card body for the grid. */
	renderCard: (entity: T) => ReactNode;
}
