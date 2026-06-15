import { describe, expect, it } from "vitest";
import { listResourceNodes } from "./index";
import { resourceNodeSchema } from "./schema";

describe("resource nodes", () => {
	it("ships an array (empty until a dataset is vendored)", () => {
		expect(Array.isArray(listResourceNodes())).toBe(true);
	});

	it("schema accepts a valid node", () => {
		expect(() =>
			resourceNodeSchema.parse({
				id: "n1",
				x: 1000,
				y: -2000,
				type: "iron-ore",
				purity: "normal",
			}),
		).not.toThrow();
	});

	it("schema rejects an invalid purity", () => {
		expect(() =>
			resourceNodeSchema.parse({
				id: "n1",
				x: 0,
				y: 0,
				type: "iron-ore",
				purity: "ultra",
			}),
		).toThrow();
	});
});
