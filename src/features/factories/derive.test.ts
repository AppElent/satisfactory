import { describe, expect, it } from "vitest";
import { efficiency } from "./derive";

describe("efficiency", () => {
	it("is the actual/planned ratio per output", () => {
		const result = efficiency(
			[{ item: "iron-plate", rate: 60 }],
			[{ item: "iron-plate", rate: 45 }],
		);
		expect(result.perItem).toEqual([
			{ item: "iron-plate", planned: 60, actual: 45, ratio: 0.75 },
		]);
		expect(result.aggregate).toBeCloseTo(0.75, 5);
	});

	it("treats a missing actual as zero output", () => {
		const result = efficiency([{ item: "iron-plate", rate: 60 }], []);
		expect(result.perItem[0].ratio).toBe(0);
		expect(result.aggregate).toBe(0);
	});

	it("averages ratios across multiple outputs", () => {
		const result = efficiency(
			[
				{ item: "iron-plate", rate: 60 },
				{ item: "screw", rate: 100 },
			],
			[
				{ item: "iron-plate", rate: 30 },
				{ item: "screw", rate: 100 },
			],
		);
		expect(result.aggregate).toBeCloseTo(0.75, 5);
	});

	it("ignores planned outputs with zero rate", () => {
		const result = efficiency(
			[{ item: "iron-plate", rate: 0 }],
			[{ item: "iron-plate", rate: 10 }],
		);
		expect(result.perItem).toEqual([]);
		expect(result.aggregate).toBe(0);
	});
});
