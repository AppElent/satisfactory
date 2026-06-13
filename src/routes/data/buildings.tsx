import { createFileRoute } from "@tanstack/react-router";
import { buildingsListConfig } from "#/features/data/configs/buildings";
import EntityListPage from "#/features/data/EntityListPage";

// Explicit interface with OPTIONAL props: typing validateSearch's return as a
// shape with optional keys keeps `<Link to="/data/buildings">` from requiring a
// `search` arg (TanStack treats non-optional search keys as required on links).
interface BuildingsSearch {
	q?: string;
	power?: string;
}

export const Route = createFileRoute("/data/buildings")({
	validateSearch: (search: Record<string, unknown>): BuildingsSearch => ({
		q: typeof search.q === "string" ? search.q : undefined,
		power: typeof search.power === "string" ? search.power : undefined,
	}),
	component: () => <EntityListPage config={buildingsListConfig} />,
});
