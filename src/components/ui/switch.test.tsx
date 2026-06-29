import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
	it("renders a switch role reflecting checked state", () => {
		const { getByRole } = render(<Switch checked onCheckedChange={() => {}} />);
		expect(getByRole("switch").getAttribute("aria-checked")).toBe("true");
	});
});
