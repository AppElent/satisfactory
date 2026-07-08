// @vitest-environment node
import { describe, expect, it } from "vitest";
import { solve } from "./solve";

describe("solve (real data, standard recipes)", () => {
	it("makes 60 iron plate/min from 3 constructors + 3 smelters, 90 ore", async () => {
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		expect(sol.status).toBe("optimal");
		const machines = new Map(
			sol.recipes.map((r) => [r.recipe, Math.round(r.machines * 100) / 100]),
		);
		expect(machines.get("recipe-ironplate-c")).toBeCloseTo(3, 2);
		expect(machines.get("recipe-ingotiron-c")).toBeCloseTo(3, 2);
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(90, 2);
	});

	it("reports power and build cost for the plan", async () => {
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		// 3 constructors (4 MW) + 3 smelters (4 MW) = 24 MW
		expect(sol.power).toBeCloseTo(24, 1);
		expect(sol.buildCost.length).toBeGreaterThan(0);
	});

	it("traces a multi-step chain (reinforced iron plate)", async () => {
		const sol = await solve({
			targets: [{ item: "reinforced-iron-plate", rate: 30 }],
			allowedAlternates: [],
		});
		expect(sol.status).toBe("optimal");
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(360, 0);
		// uses screws and rods on the way
		const slugs = sol.recipes.map((r) => r.recipe);
		expect(slugs).toContain("recipe-screw-c");
		expect(slugs).toContain("recipe-ironrod-c");
	});

	it("consumes a provided input instead of building it from scratch", async () => {
		// iron-plate (60/min) needs 90 iron-ingot/min. If ingot is available, the
		// solver should skip smelting: 3 constructors, 90 ingot imported, 0 ore.
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
			availableInputs: [{ item: "iron-ingot" }],
		});
		expect(sol.status).toBe("optimal");
		const slugs = sol.recipes.map((r) => r.recipe);
		expect(slugs).toContain("recipe-ironplate-c");
		expect(slugs).not.toContain("recipe-ingotiron-c");
		expect(sol.rawInputs.find((f) => f.item === "iron-ore")).toBeUndefined();
		// the consumed ingot is a provided input, not a raw resource
		expect(sol.rawInputs.find((f) => f.item === "iron-ingot")).toBeUndefined();
		const ingot = sol.providedInputs.find((f) => f.item === "iron-ingot");
		expect(ingot?.rate).toBeCloseTo(90, 1);
	});

	it("caps a provided input and builds machines for the shortfall", async () => {
		// Only 30 ingot/min available (need 90) → solver smelts the other 60.
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
			availableInputs: [{ item: "iron-ingot", rate: 30 }],
		});
		expect(sol.status).toBe("optimal");
		const ingot = sol.providedInputs.find((f) => f.item === "iron-ingot");
		expect(ingot?.rate).toBeCloseTo(30, 1);
		// remaining 60 ingot smelted from 60 ore (a raw resource)
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(60, 1);
	});

	it("returns infeasible with a diagnosis for an unmakeable target", async () => {
		// plastic needs crude-oil refining; with only standard recipes it's fine,
		// so instead target an item whose only recipes are alternates we didn't enable.
		const sol = await solve({
			targets: [{ item: "wood", rate: 10 }],
			allowedAlternates: [],
		});
		// wood is an input (no recipe produces it) → asking to *produce* it via
		// machines is infeasible; diagnosis names it.
		expect(sol.status).toBe("infeasible");
		expect(sol.diagnosis?.unreachable).toContain("wood");
	});

	it("sums duplicate targets for the same item", async () => {
		// 30 + 30 iron-plate should solve the same as a single 60 target.
		const sol = await solve({
			targets: [
				{ item: "iron-plate", rate: 30 },
				{ item: "iron-plate", rate: 30 },
			],
			allowedAlternates: [],
		});
		expect(sol.status).toBe("optimal");
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(90, 1);
	});

	it("ignores non-finite / non-positive target rates instead of crashing", async () => {
		// A half-typed numeric field can yield NaN; a stray negative is invalid.
		// Neither should throw or emit a malformed LP — they're dropped.
		const sol = await solve({
			targets: [
				{ item: "iron-plate", rate: Number.NaN },
				{ item: "iron-rod", rate: -5 },
				{ item: "iron-plate", rate: 60 },
			],
			allowedAlternates: [],
		});
		expect(sol.status).toBe("optimal");
		// only the valid 60 iron-plate target survives → 90 ore
		const ore = sol.rawInputs.find((f) => f.item === "iron-ore");
		expect(ore?.rate).toBeCloseTo(90, 1);
		expect(sol.recipes.some((r) => r.recipe === "recipe-ironrod-c")).toBe(
			false,
		);
	});

	it("maximizes target output from a bounded input", async () => {
		// Only 480 crude-oil available → max plastic is 320/min (standard recipes).
		const sol = await solve({
			mode: "maximize",
			targets: [{ item: "plastic", rate: 1 }],
			allowedAlternates: [],
			availableInputs: [{ item: "crude-oil", rate: 480 }],
		});
		expect(sol.status).toBe("optimal");
		const plastic = sol.outputs.find((o) => o.item === "plastic");
		expect(plastic?.rate).toBeCloseTo(320, 0);
		const oil = sol.providedInputs.find((f) => f.item === "crude-oil");
		expect(oil?.rate).toBeCloseTo(480, 0);
	});

	it("reports outputs at the demanded rate in produce mode", async () => {
		const sol = await solve({
			targets: [{ item: "iron-plate", rate: 60 }],
			allowedAlternates: [],
		});
		expect(sol.outputs.find((o) => o.item === "iron-plate")?.rate).toBeCloseTo(
			60,
			1,
		);
	});
});
