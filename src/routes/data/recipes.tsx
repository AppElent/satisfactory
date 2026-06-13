import { createFileRoute } from "@tanstack/react-router";
import { recipesListConfig } from "#/features/data/configs/recipes";
import EntityListPage from "#/features/data/EntityListPage";

interface RecipesSearch {
	q?: string;
	kind?: string;
}

export const Route = createFileRoute("/data/recipes")({
	validateSearch: (search: Record<string, unknown>): RecipesSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		kind: typeof search.kind === "string" ? search.kind : undefined,
	}),
	component: () => <EntityListPage config={recipesListConfig} />,
});
