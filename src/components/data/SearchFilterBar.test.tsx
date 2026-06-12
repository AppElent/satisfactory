import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchFilterBar from "./SearchFilterBar";

describe("SearchFilterBar", () => {
	it("calls onSearchChange when typing", () => {
		const onSearchChange = vi.fn();
		const { getByRole } = render(
			<SearchFilterBar
				search=""
				onSearchChange={onSearchChange}
				filters={[]}
			/>,
		);
		fireEvent.change(getByRole("searchbox"), { target: { value: "iron" } });
		expect(onSearchChange).toHaveBeenCalledWith("iron");
	});

	it("renders filter chips and toggles them", () => {
		const onFilterChange = vi.fn();
		const { getByText } = render(
			<SearchFilterBar
				search=""
				onSearchChange={() => {}}
				filters={[
					{
						key: "form",
						label: "Form",
						options: [
							{ value: "solid", label: "Solid" },
							{ value: "fluid", label: "Fluid" },
						],
						selected: "solid",
						onChange: onFilterChange,
					},
				]}
			/>,
		);
		fireEvent.click(getByText("Fluid"));
		expect(onFilterChange).toHaveBeenCalledWith("fluid");
	});
});
