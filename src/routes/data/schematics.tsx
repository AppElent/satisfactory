import { createFileRoute } from "@tanstack/react-router";
import { schematicsListConfig } from "#/features/data/configs/schematics";
import EntityListPage from "#/features/data/EntityListPage";

interface SchematicsSearch {
	q?: string;
	tier?: string;
	kind?: string;
}

export const Route = createFileRoute("/data/schematics")({
	validateSearch: (search: Record<string, unknown>): SchematicsSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		tier: typeof search.tier === "string" ? search.tier : undefined,
		kind: typeof search.kind === "string" ? search.kind : undefined,
	}),
	component: () => <EntityListPage config={schematicsListConfig} />,
});
