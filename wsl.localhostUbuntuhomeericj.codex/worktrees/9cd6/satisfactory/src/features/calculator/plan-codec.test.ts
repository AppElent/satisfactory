import { describe, expect, it } from "vitest";
import { decodePlan, encodePlan } from "./plan-codec";
import type { ProblemSpec } from "./solver";

describe("plan codec", () => {
	const spec: ProblemSpec = {
		mode: "maximize",
		targets: [{ item: "plastic", rate: 1 }],
		allowedAlternates: ["recipe-alternate-coatedironplate-c"],
		availableInputs: [{ item: "crude-oil", rate: 480 }],
		resourceWeights: { "iron-ore": 0.5 },
	};

	it("round-trips a spec through encode/decode", () => {
		expect(decodePlan(encodePlan(spec))).toEqual(spec);
	});

	it("produces a URL-safe string", () => {
		expect(encodePlan(spec)).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it("returns undefined for garbage", () => {
		expect(decodePlan("@@not-valid@@")).toBeUndefined();
		expect(decodePlan("")).toBeUndefined();
	});

	it("decodes only well-formed specs (must have a targets array)", () => {
		const bad = encodePlan({ foo: 1 } as unknown as ProblemSpec);
		expect(decodePlan(bad)).toBeUndefined();
	});
});
