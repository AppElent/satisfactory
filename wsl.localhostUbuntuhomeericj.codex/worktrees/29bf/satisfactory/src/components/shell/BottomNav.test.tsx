import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BottomNav from "./BottomNav";

function renderBottomNav(initialUrl: string) {
	const rootRoute = createRootRoute({ component: BottomNav });
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: [initialUrl] }),
	});
	// biome-ignore lint/suspicious/noExplicitAny: test-only router typing
	return render(<RouterProvider router={router as any} />);
}

describe("BottomNav", () => {
	it("shows exactly the 4 primary items plus More", async () => {
		const { findByText } = renderBottomNav("/calculator");
		expect(await findByText("Overview")).toBeDefined();
		expect(await findByText("Calculator")).toBeDefined();
		expect(await findByText("Game Data")).toBeDefined();
		expect(await findByText("World Map")).toBeDefined();
		expect(await findByText("More")).toBeDefined();
	});

	it("does not show Factories directly (it lives behind More)", async () => {
		const { findByText, queryByText } = renderBottomNav("/calculator");
		// wait for render to settle before asserting absence
		await findByText("Overview");
		expect(queryByText("Factories")).toBeNull();
	});
});
