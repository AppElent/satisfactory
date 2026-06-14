import { describe, expect, it } from "vitest";
import { decodeSnapshot, encodeSnapshot } from "./snapshot";
import type { PlanSnapshot } from "./types";

const snap: PlanSnapshot = {
	spec: { targets: [{ item: "iron-plate", rate: 60 }], allowedAlternates: [] },
	solution: {
		status: "optimal",
		recipes: [
			{ recipe: "recipe-ironplate-c", machines: 3, building: "constructor" },
		],
		outputs: [{ item: "iron-plate", rate: 60 }],
		rawInputs: [{ item: "iron-ore", rate: 90 }],
		providedInputs: [],
		byproducts: [],
		flows: [],
		power: 24,
		buildCost: [],
	},
};

describe("plan snapshot codec", () => {
	it("round-trips a snapshot through a JSON string", () => {
		const decoded = decodeSnapshot(encodeSnapshot(snap));
		expect(decoded).toEqual(snap);
	});

	it("returns undefined for malformed JSON", () => {
		expect(decodeSnapshot("not json")).toBeUndefined();
	});

	it("returns undefined when the shape is wrong", () => {
		expect(decodeSnapshot(JSON.stringify({ spec: 1 }))).toBeUndefined();
	});
});
