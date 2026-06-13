import { createFileRoute } from "@tanstack/react-router";
import { buildablesListConfig } from "#/features/data/configs/buildables";
import EntityListPage from "#/features/data/EntityListPage";

interface BuildablesSearch {
	q?: string;
	category?: string;
}

export const Route = createFileRoute("/data/buildables/")({
	validateSearch: (search: Record<string, unknown>): BuildablesSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		category: typeof search.category === "string" ? search.category : undefined,
	}),
	component: () => <EntityListPage config={buildablesListConfig} />,
});
