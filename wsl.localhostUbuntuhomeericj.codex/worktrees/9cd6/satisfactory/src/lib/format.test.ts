import { describe, expect, it } from "vitest";
import { formatNumber, formatPower, perMinute } from "./format";

describe("format", () => {
	it("computes per-minute rate from amount and craft time", () => {
		// 2 plates per 6s craft = 20/min
		expect(perMinute(2, 6)).toBe(20);
	});

	it("returns the raw (unrounded) float from perMinute", () => {
		// perMinute itself does not round; formatNumber does.
		expect(perMinute(1, 7)).toBeCloseTo(8.571428571, 9);
	});

	it("rounds composed rate display to 4 decimals via formatNumber", () => {
		// This is what recipe-rate UI actually renders.
		expect(formatNumber(perMinute(1, 7))).toBe("8.5714");
	});

	it("formats numbers without trailing float noise", () => {
		expect(formatNumber(0.1 + 0.2)).toBe("0.3");
		expect(formatNumber(1000)).toBe("1,000");
		expect(formatNumber(7.5)).toBe("7.5");
	});

	it("formats power in MW", () => {
		expect(formatPower(4)).toBe("4 MW");
		expect(formatPower(0)).toBe("0 MW");
	});
});
