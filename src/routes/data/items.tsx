import { createFileRoute } from "@tanstack/react-router";
import { itemsListConfig } from "#/features/data/configs/items";
import EntityListPage from "#/features/data/EntityListPage";

interface ItemsSearch {
	q?: string;
	form?: string;
}

export const Route = createFileRoute("/data/items")({
	validateSearch: (search: Record<string, unknown>): ItemsSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		form: typeof search.form === "string" ? search.form : undefined,
	}),
	component: () => <EntityListPage config={itemsListConfig} />,
});
