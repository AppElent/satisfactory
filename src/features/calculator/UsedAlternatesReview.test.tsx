import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Solution } from "./solver";
import UsedAlternatesReview from "./UsedAlternatesReview";

const solution: Solution = {
	status: "optimal",
	recipes: [
		{
			recipe: "recipe-alternate-coatedironplate-c",
			machines: 1,
			building: "constructor",
		},
		{ recipe: "recipe-ironplate-c", machines: 1, building: "constructor" },
	],
	outputs: [],
	rawInputs: [],
	providedInputs: [],
	byproducts: [],
	flows: [],
	power: 4,
	buildCost: [],
};

describe("UsedAlternatesReview", () => {
	it("renders only alternate recipes used by the solution", () => {
		const { getByText, queryByText } = render(
			<UsedAlternatesReview
				solution={solution}
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onToggle={() => {}}
			/>,
		);

		expect(getByText("Used alternates")).toBeTruthy();
		expect(getByText(/Coated/i)).toBeTruthy();
		expect(queryByText("Iron Plate")).toBeNull();
	});

	it("calls onToggle when a used alternate is unchecked", () => {
		const onToggle = vi.fn();
		const { getByLabelText } = render(
			<UsedAlternatesReview
				solution={solution}
				allowedAlternates={["recipe-alternate-coatedironplate-c"]}
				onToggle={onToggle}
			/>,
		);

		fireEvent.click(getByLabelText(/Coated/i));

		expect(onToggle).toHaveBeenCalledWith("recipe-alternate-coatedironplate-c");
	});

	it("renders nothing when no alternates are used", () => {
		const { container } = render(
			<UsedAlternatesReview
				solution={{ ...solution, recipes: [solution.recipes[1]] }}
				allowedAlternates={[]}
				onToggle={() => {}}
			/>,
		);

		expect(container.textContent).toBe("");
	});
});
