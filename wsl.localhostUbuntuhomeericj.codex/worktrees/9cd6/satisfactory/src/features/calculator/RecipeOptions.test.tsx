import { fireEvent, render, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeOptions from "./RecipeOptions";

describe("RecipeOptions", () => {
	beforeEach(() => localStorage.clear());

	it("renders a compact summary instead of the full long list", () => {
		const { getByText, queryByLabelText } = render(
			<RecipeOptions allowedAlternates={[]} onChange={() => {}} />,
		);

		expect(getByText("Custom current selection")).toBeTruthy();
		expect(getByText("0 enabled")).toBeTruthy();
		expect(queryByLabelText("Filter alternate recipes")).toBeNull();
	});

	it("opens the manager and applies a built-in preset", () => {
		const onChange = vi.fn();
		const { getByRole, getByText } = render(
			<RecipeOptions allowedAlternates={[]} onChange={onChange} />,
		);

		fireEvent.click(getByRole("button", { name: "Manage alternates" }));
		fireEvent.click(getByText("All alternates"));

		expect(onChange).toHaveBeenCalledWith(
			expect.arrayContaining([expect.stringMatching(/^recipe-/)]),
		);
	});

	it("filters recipes in the manager", () => {
		const { getAllByText, getByRole, getByLabelText, getByText } = render(
			<RecipeOptions allowedAlternates={[]} onChange={() => {}} />,
		);

		fireEvent.click(getByRole("button", { name: "Manage alternates" }));
		fireEvent.click(getByText("Recipes"));
		fireEvent.change(getByLabelText("Filter alternate recipes"), {
			target: { value: "coated" },
		});

		expect(getAllByText(/Coated/i).length).toBeGreaterThan(0);
	});

	it("saves the current selection as a local preset", () => {
		const { getByRole, getByLabelText, getByText } = render(
			<RecipeOptions
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onChange={() => {}}
			/>,
		);

		fireEvent.click(getByRole("button", { name: "Save as preset" }));
		fireEvent.change(getByLabelText("Preset name"), {
			target: { value: "My iron preset" },
		});
		fireEvent.click(getByRole("button", { name: "Create preset" }));
		fireEvent.click(getByRole("button", { name: "Manage alternates" }));

		expect(getByText("My iron preset")).toBeTruthy();
	});

	it("can overwrite an existing preset", () => {
		const { getByRole, getByLabelText, getByText, rerender } = render(
			<RecipeOptions
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onChange={() => {}}
			/>,
		);
		fireEvent.click(getByRole("button", { name: "Save as preset" }));
		fireEvent.change(getByLabelText("Preset name"), {
			target: { value: "Overwrite me" },
		});
		fireEvent.click(getByRole("button", { name: "Create preset" }));

		rerender(<RecipeOptions allowedAlternates={[]} onChange={() => {}} />);
		fireEvent.click(getByRole("button", { name: "Save as preset" }));
		fireEvent.click(getByLabelText("Overwrite existing preset"));
		const select = getByLabelText("Preset to overwrite");
		fireEvent.change(select, {
			target: {
				value:
					within(select).getByText("Overwrite me").getAttribute("value") ?? "",
			},
		});
		fireEvent.click(getByRole("button", { name: "Overwrite preset" }));

		expect(getByText("Preset saved")).toBeTruthy();
	});
});
