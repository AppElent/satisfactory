import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EntityCardGrid, { type EntityCardGridItem } from "./EntityCardGrid";

function renderInRouter(ui: React.ReactNode) {
	const rootRoute = createRootRoute({ component: () => ui });
	const detailRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/data/items/$slug",
		component: () => null,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([detailRoute]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	// biome-ignore lint/suspicious/noExplicitAny: test-only router typing
	return render(<RouterProvider router={router as any} />);
}

describe("EntityCardGrid", () => {
	it("renders the empty message when there are no items", async () => {
		const { findByText } = renderInRouter(
			<EntityCardGrid items={[]} emptyMessage="No matches." />,
		);
		expect(await findByText("No matches.")).toBeDefined();
	});

	it("renders a link per item pointing at its detail route", async () => {
		const items: EntityCardGridItem[] = [
			{
				slug: "iron-plate",
				to: "/data/items/$slug",
				params: { slug: "iron-plate" },
				content: <span>Iron Plate</span>,
			},
		];
		const { findByRole } = renderInRouter(<EntityCardGrid items={items} />);
		const link = (await findByRole("link")) as HTMLAnchorElement;
		expect(link.getAttribute("href")).toBe("/data/items/iron-plate");
		expect(link.textContent).toContain("Iron Plate");
	});
});
