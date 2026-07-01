import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DualPaneLayout } from "./dual-pane-layout";

function stubMatchMedia(matches: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn().mockReturnValue({
			matches,
			media: "",
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}),
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("DualPaneLayout", () => {
	it("renders both panes side by side at desktop width, with no tab bar", () => {
		stubMatchMedia(true);
		render(
			<DualPaneLayout
				leftLabel="Setup"
				left={<p>Setup content</p>}
				rightLabel="Results"
				right={<p>Results content</p>}
				gridClassName="grid-cols-2"
			/>,
		);
		expect(screen.getByText("Setup content")).toBeDefined();
		expect(screen.getByText("Results content")).toBeDefined();
		expect(screen.queryByRole("tablist")).toBeNull();
	});

	it("shows only the default tab's pane below desktop width", () => {
		stubMatchMedia(false);
		render(
			<DualPaneLayout
				leftLabel="Setup"
				left={<p>Setup content</p>}
				rightLabel="Results"
				right={<p>Results content</p>}
				gridClassName="grid-cols-2"
			/>,
		);
		expect(screen.getByText("Setup content")).toBeDefined();
		expect(screen.queryByText("Results content")).toBeNull();
	});

	it("switches panes when the other tab is clicked", () => {
		stubMatchMedia(false);
		render(
			<DualPaneLayout
				leftLabel="Setup"
				left={<p>Setup content</p>}
				rightLabel="Results"
				right={<p>Results content</p>}
				gridClassName="grid-cols-2"
			/>,
		);
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Results" }));
		expect(screen.getByText("Results content")).toBeDefined();
		expect(screen.queryByText("Setup content")).toBeNull();
	});

	it("honors defaultTab='right'", () => {
		stubMatchMedia(false);
		render(
			<DualPaneLayout
				leftLabel="Panel"
				left={<p>Panel content</p>}
				rightLabel="Network"
				right={<p>Network content</p>}
				gridClassName="grid-cols-2"
				defaultTab="right"
			/>,
		);
		expect(screen.getByText("Network content")).toBeDefined();
		expect(screen.queryByText("Panel content")).toBeNull();
	});
});
