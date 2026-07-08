import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EntityListPage from "./EntityListPage";
import type { EntityListConfig } from "./list-config";

interface Fake {
	slug: string;
	name: string;
	form: "solid" | "fluid";
}

const FAKES: Fake[] = [
	{ slug: "iron-plate", name: "Iron Plate", form: "solid" },
	{ slug: "water", name: "Water", form: "fluid" },
	{ slug: "copper-ore", name: "Copper Ore", form: "solid" },
];

const config: EntityListConfig<Fake> = {
	detailTo: "/data/items/$slug",
	getAll: () => FAKES,
	searchText: (entity) => entity.name,
	filters: [
		{
			key: "form",
			label: "Form",
			options: [
				{ value: "solid", label: "Solid" },
				{ value: "fluid", label: "Fluid" },
			],
			matches: (entity, value) => entity.form === value,
		},
	],
	renderCard: (entity) => <span>{entity.name}</span>,
};

/** Builds a router whose /data/items route renders EntityListPage.
 *  validate=true mirrors the real routes (coerce params to string|undefined);
 *  validate=false lets a raw value (e.g. number) reach the component. */
function renderList(initialUrl: string, validate: boolean) {
	const rootRoute = createRootRoute();
	const listRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/data/items",
		...(validate
			? {
					validateSearch: (search: Record<string, unknown>) => ({
						q: typeof search.q === "string" ? search.q : undefined,
						form: typeof search.form === "string" ? search.form : undefined,
					}),
				}
			: {}),
		component: () => <EntityListPage config={config} />,
	});
	const detailRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/data/items/$slug",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([listRoute, detailRoute]),
		history: createMemoryHistory({ initialEntries: [initialUrl] }),
	});
	// biome-ignore lint/suspicious/noExplicitAny: test-only router typing
	return render(<RouterProvider router={router as any} />);
}

describe("EntityListPage", () => {
	it("renders all entities with a result count", async () => {
		const { findByText } = renderList("/data/items", true);
		expect(await findByText("3 results")).toBeDefined();
		expect(await findByText("Iron Plate")).toBeDefined();
		expect(await findByText("Water")).toBeDefined();
	});

	it("filters by the q search param from the URL", async () => {
		const { findByText, queryByText } = renderList("/data/items?q=iron", true);
		expect(await findByText("1 result")).toBeDefined();
		expect(await findByText("Iron Plate")).toBeDefined();
		expect(queryByText("Water")).toBeNull();
	});

	it("applies a filter param from the URL", async () => {
		const { findByText, queryByText } = renderList(
			"/data/items?form=fluid",
			true,
		);
		expect(await findByText("1 result")).toBeDefined();
		expect(await findByText("Water")).toBeDefined();
		expect(queryByText("Iron Plate")).toBeNull();
	});

	it("does not crash when a search param is coerced to a non-string", async () => {
		// Route without validateSearch → router parses ?q=123 as the number 123.
		// strParam must treat it as empty rather than calling .trim() on a number.
		const { findByText } = renderList("/data/items?q=123", false);
		expect(await findByText("3 results")).toBeDefined();
	});

	it("updates results when a filter chip is clicked", async () => {
		const { findByText, queryByText } = renderList("/data/items", true);
		fireEvent.click(await findByText("Fluid"));
		expect(await findByText("1 result")).toBeDefined();
		expect(await findByText("Water")).toBeDefined();
		expect(queryByText("Iron Plate")).toBeNull();
	});
});
