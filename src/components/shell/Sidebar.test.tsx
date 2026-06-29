import { describe, expect, it } from "vitest";
import { isItemActive } from "./Sidebar";

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
