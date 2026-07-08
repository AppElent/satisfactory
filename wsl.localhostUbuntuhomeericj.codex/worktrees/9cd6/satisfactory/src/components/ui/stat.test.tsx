import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stat } from "./stat";

describe("Stat", () => {
	it("renders label, value and unit", () => {
		const { getByText } = render(
			<Stat label="Total Power Draw" value="420.6" unit="MW" />,
		);
		expect(getByText("Total Power Draw")).toBeInTheDocument();
		expect(getByText("420.6")).toBeInTheDocument();
		expect(getByText("MW")).toBeInTheDocument();
	});

	it("renders the delta with its tone data attribute", () => {
		const { getByText } = render(
			<Stat
				label="Eff"
				value="89"
				unit="%"
				delta="-3% vs plan"
				deltaTone="danger"
			/>,
		);
		expect(getByText("-3% vs plan").getAttribute("data-tone")).toBe("danger");
	});
});
