import { describe, expect, it } from "vitest";
import { buildGraph } from "./graph";
import type { Solution } from "./solver";

const solution: Solution = {
	status: "optimal",
	recipes: [
		{ recipe: "recipe-ingotiron-c", machines: 3, building: "smelter" },
		{ recipe: "recipe-ironplate-c", machines: 3, building: "constructor" },
	],
	outputs: [{ item: "iron-plate", rate: 60 }],
	rawInputs: [{ item: "iron-ore", rate: 90 }],
	providedInputs: [],
	byproducts: [],
	flows: [],
	power: 24,
	buildCost: [],
};

describe("buildGraph", () => {
	it("creates a node per recipe, input and output", () => {
		const { nodes } = buildGraph(solution);
		const ids = nodes.map((n) => n.id);
		expect(ids).toContain("recipe:recipe-ingotiron-c");
		expect(ids).toContain("recipe:recipe-ironplate-c");
		expect(ids).toContain("input:iron-ore");
		expect(ids).toContain("output:iron-plate");
	});

	it("tags node kinds", () => {
		const { nodes } = buildGraph(solution);
		expect(nodes.find((n) => n.id === "input:iron-ore")?.kind).toBe("input");
		expect(nodes.find((n) => n.id === "output:iron-plate")?.kind).toBe(
			"output",
		);
		expect(nodes.find((n) => n.id === "recipe:recipe-ironplate-c")?.kind).toBe(
			"recipe",
		);
	});

	it("connects ore → smelter → constructor → output with item-labelled edges", () => {
		const { edges } = buildGraph(solution);
		const has = (s: string, t: string, item: string) =>
			edges.some((e) => e.source === s && e.target === t && e.item === item);
		expect(has("input:iron-ore", "recipe:recipe-ingotiron-c", "iron-ore")).toBe(
			true,
		);
		expect(
			has(
				"recipe:recipe-ingotiron-c",
				"recipe:recipe-ironplate-c",
				"iron-ingot",
			),
		).toBe(true);
		expect(
			has("recipe:recipe-ironplate-c", "output:iron-plate", "iron-plate"),
		).toBe(true);
	});

	it("edge rates conserve per item (sum out of a producer = its production)", () => {
		const { edges } = buildGraph(solution);
		const ironIngotOut = edges
			.filter((e) => e.item === "iron-ingot")
			.reduce((s, e) => s + e.rate, 0);
		// 3 smelters × 30/min = 90 iron-ingot/min flows to the plate recipe
		expect(ironIngotOut).toBeCloseTo(90, 1);
	});

	it("nets recirculated items so a recipe never self-loops", () => {
		// recipe-uraniumcell-c (blender) consumes 8 and produces 2 sulfuric-acid
		// per craft — a recirculating item. The recipe should be a net SINK of
		// sulfuric-acid with no source→self edge.
		const recirc: Solution = {
			status: "optimal",
			recipes: [
				{ recipe: "recipe-uraniumcell-c", machines: 2, building: "blender" },
				{ recipe: "recipe-sulfuricacid-c", machines: 4, building: "refinery" },
			],
			outputs: [{ item: "uranium-fuel-rod-stub", rate: 0 }],
			rawInputs: [],
			providedInputs: [],
			byproducts: [],
			flows: [],
			power: 0,
			buildCost: [],
		};
		const { edges } = buildGraph(recirc);
		expect(edges.some((e) => e.source === e.target)).toBe(false);
		// sulfuric-acid flows from the acid recipe INTO uranium-cell (net consumer)
		expect(
			edges.some(
				(e) =>
					e.item === "sulfuric-acid" &&
					e.source === "recipe:recipe-sulfuricacid-c" &&
					e.target === "recipe:recipe-uraniumcell-c",
			),
		).toBe(true);
	});
});
