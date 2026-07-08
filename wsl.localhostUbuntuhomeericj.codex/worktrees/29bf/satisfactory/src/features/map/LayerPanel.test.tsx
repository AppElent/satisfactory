import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LayerPanel from "./LayerPanel";

describe("LayerPanel", () => {
	it("toggles the factory-pins layer", () => {
		const onToggle = vi.fn();
		render(
			<LayerPanel
				showFactories={true}
				showNodes={true}
				onToggleFactories={onToggle}
				onToggleNodes={() => {}}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Factory pins"));
		expect(onToggle).toHaveBeenCalledWith(false);
	});

	it("shows disabled 'soon' layers", () => {
		render(
			<LayerPanel
				showFactories={true}
				showNodes={true}
				onToggleFactories={() => {}}
				onToggleNodes={() => {}}
			/>,
		);
		expect(screen.getByLabelText("Geysers")).toBeDisabled();
	});
});
