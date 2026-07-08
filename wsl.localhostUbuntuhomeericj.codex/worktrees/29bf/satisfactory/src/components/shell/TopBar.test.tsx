import { describe, expect, it } from "vitest";
import { routeMetaFor } from "./TopBar";

describe("routeMetaFor", () => {
	it("returns overview meta for root", () => {
		expect(routeMetaFor("/").title).toBe("Overview");
	});

	it("returns calculator meta", () => {
		expect(routeMetaFor("/calculator").title).toBe("Production Calculator");
	});

	it("matches game-scoped factories to the Factories meta", () => {
		expect(routeMetaFor("/g/abc/factories").title).toBe("Factories");
	});

	it("falls back to a default title for unknown routes", () => {
		expect(routeMetaFor("/totally-unknown").title).toBe("FICSIT Planner");
	});
});
