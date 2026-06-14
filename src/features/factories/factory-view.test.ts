import { describe, expect, it } from "vitest";
import { plannedOutputs } from "./factory-view";

describe("plannedOutputs", () => {
	it("reads outputs from a manual production", () => {
		const out = plannedOutputs({
			source: "manual",
			inputs: [],
			outputs: [{ item: "iron-plate", rate: 60 }],
			machines: [],
		});
		expect(out).toEqual([{ item: "iron-plate", rate: 60 }]);
	});

	it("reads outputs from a plan snapshot's solution", () => {
		const plan = JSON.stringify({
			spec: { targets: [{ item: "screw", rate: 100 }], allowedAlternates: [] },
			solution: {
				status: "optimal",
				recipes: [],
				outputs: [{ item: "screw", rate: 100 }],
				rawInputs: [],
				providedInputs: [],
				byproducts: [],
				flows: [],
				power: 0,
				buildCost: [],
			},
		});
		expect(plannedOutputs({ source: "plan", plan })).toEqual([
			{ item: "screw", rate: 100 },
		]);
	});

	it("returns [] for an unparseable plan", () => {
		expect(plannedOutputs({ source: "plan", plan: "broken" })).toEqual([]);
	});
});
