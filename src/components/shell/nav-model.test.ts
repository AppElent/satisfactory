import { describe, expect, it } from "vitest";
import { phoneOverflowNavItems, phonePrimaryNavItems } from "./nav-model";

describe("phonePrimaryNavItems", () => {
	it("returns exactly Overview, Calculator, Game Data, World Map, in that order", () => {
		const ids = phonePrimaryNavItems().map((item) => item.id);
		expect(ids).toEqual(["overview", "calculator", "data", "map"]);
	});
});

describe("phoneOverflowNavItems", () => {
	it("returns Factories and Logistics", () => {
		const ids = phoneOverflowNavItems().map((item) => item.id);
		expect(ids).toEqual(["factories", "logistics"]);
	});
});
