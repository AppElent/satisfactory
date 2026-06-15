import { describe, expect, it } from "vitest";
import { plannedInputs, plannedOutputs } from "./factory-view";

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

describe("plannedInputs", () => {
	it("reads inputs from a manual production", () => {
		expect(
			plannedInputs({
				source: "manual",
				inputs: [{ item: "iron-ore", rate: 30 }],
				outputs: [],
				machines: [],
			}),
		).toEqual([{ item: "iron-ore", rate: 30 }]);
	});

	it("reads raw + provided inputs from a plan snapshot", () => {
		const plan = JSON.stringify({
			spec: {
				targets: [{ item: "iron-plate", rate: 60 }],
				allowedAlternates: [],
			},
			solution: {
				status: "optimal",
				recipes: [],
				outputs: [{ item: "iron-plate", rate: 60 }],
				rawInputs: [{ item: "iron-ore", rate: 90 }],
				providedInputs: [{ item: "screw", rate: 40 }],
				byproducts: [],
				flows: [],
				power: 0,
				buildCost: [],
			},
		});
		expect(plannedInputs({ source: "plan", plan })).toEqual([
			{ item: "iron-ore", rate: 90 },
			{ item: "screw", rate: 40 },
		]);
	});

	it("returns [] for an unparseable plan", () => {
		expect(plannedInputs({ source: "plan", plan: "broken" })).toEqual([]);
	});
});
