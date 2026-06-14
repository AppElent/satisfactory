import { describe, expect, it } from "vitest";
import { buildModel, toLpString } from "./model";
import type { ProblemSpec } from "./types";

const spec = (over: Partial<ProblemSpec> = {}): ProblemSpec => ({
	targets: [{ item: "iron-plate", rate: 60 }],
	allowedAlternates: [],
	...over,
});

describe("buildModel", () => {
	it("includes standard recipes and excludes alternates by default", () => {
		const model = buildModel(spec());
		const slugs = model.recipes.map((r) => r.slug);
		expect(slugs).toContain("recipe-ironplate-c");
		expect(slugs.every((s) => !s.startsWith("recipe-alternate"))).toBe(true);
	});

	it("includes an allowed alternate recipe", () => {
		const model = buildModel(
			spec({ allowedAlternates: ["recipe-alternate-coatedironplate-c"] }),
		);
		expect(model.recipes.map((r) => r.slug)).toContain(
			"recipe-alternate-coatedironplate-c",
		);
	});

	it("treats raw resources and unproducible items as imports", () => {
		const model = buildModel(spec());
		// iron-ore is a raw resource → has an import var
		expect(model.importVars.has("iron-ore")).toBe(true);
		// iron-plate is produced by a recipe → no import var
		expect(model.importVars.has("iron-plate")).toBe(false);
	});

	it("sets the target demand as the row rhs and 0 elsewhere", () => {
		const model = buildModel(spec());
		const plateRow = model.rows.find((r) => r.item === "iron-plate");
		expect(plateRow?.rhs).toBe(60);
		const ingotRow = model.rows.find((r) => r.item === "iron-ingot");
		expect(ingotRow?.rhs).toBe(0);
	});

	it("weights raw imports in the objective (default 1)", () => {
		const model = buildModel(spec());
		const oreVar = model.importVars.get("iron-ore") as string;
		expect(model.objective.get(oreVar)).toBe(1);
	});

	it("applies custom resource weights", () => {
		const model = buildModel(spec({ resourceWeights: { "iron-ore": 0.5 } }));
		const oreVar = model.importVars.get("iron-ore") as string;
		expect(model.objective.get(oreVar)).toBe(0.5);
	});

	it("gives a provided input a zero-weight import var", () => {
		const model = buildModel(
			spec({ availableInputs: [{ item: "iron-ingot" }] }),
		);
		expect(model.providedInputs.has("iron-ingot")).toBe(true);
		const v = model.importVars.get("iron-ingot") as string;
		expect(model.objective.get(v)).toBe(0);
		// unbounded → no entry in bounds
		expect(model.bounds.has(v)).toBe(false);
	});

	it("caps a provided input with an upper bound", () => {
		const model = buildModel(
			spec({ availableInputs: [{ item: "iron-ingot", rate: 30 }] }),
		);
		const v = model.importVars.get("iron-ingot") as string;
		expect(model.bounds.get(v)).toBe(30);
		expect(toLpString(model)).toContain("Bounds");
	});
});

describe("toLpString", () => {
	it("produces a Minimize/Subject To/End LP with the import var in the target row", () => {
		const lp = toLpString(buildModel(spec()));
		expect(lp).toMatch(/^Minimize/);
		expect(lp).toContain("Subject To");
		expect(lp.trimEnd().endsWith("End")).toBe(true);
		// the iron-ore import var appears in the objective
		expect(lp).toMatch(/obj:.*m\d+/);
	});
});
