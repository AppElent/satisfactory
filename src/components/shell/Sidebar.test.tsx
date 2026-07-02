import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar, { isItemActive } from "./Sidebar";

vi.mock("#/features/games/GameSwitcher", () => ({
	default: () => <div>Active Game Switcher</div>,
}));

function renderSidebar(variant: "full" | "rail") {
	const rootRoute = createRootRoute({
		component: () => <Sidebar variant={variant} />,
	});
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	// biome-ignore lint/suspicious/noExplicitAny: test-only router typing
	return render(<RouterProvider router={router as any} />);
}

describe("Sidebar", () => {
	it("shows nav labels and the brand subtitle in full mode", async () => {
		const { findByText } = renderSidebar("full");
		expect(await findByText("Factories")).toBeDefined();
		expect(await findByText("Factory Planner")).toBeDefined();
	});

	it("hides nav labels and the brand subtitle in rail mode", () => {
		const { queryByText } = renderSidebar("rail");
		expect(queryByText("Factories")).toBeNull();
		expect(queryByText("Factory Planner")).toBeNull();
	});
});

describe("isItemActive", () => {
	it("marks factories active on the list route", () => {
		expect(isItemActive("factories", "/factories")).toBe(true);
	});

	it("marks factories active on a game-scoped factory detail route", () => {
		expect(isItemActive("factories", "/g/abc/factories/steel")).toBe(true);
	});

	it("marks overview active only on root", () => {
		expect(isItemActive("overview", "/")).toBe(true);
		expect(isItemActive("overview", "/calculator")).toBe(false);
	});

	it("does not mark data active on factories", () => {
		expect(isItemActive("data", "/factories")).toBe(false);
	});
});
