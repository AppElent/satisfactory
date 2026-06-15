import { describe, expect, it } from "vitest";
import { beltFor, pipeFor } from "./throughput";

describe("beltFor", () => {
	it("picks the smallest single tier that carries the rate", () => {
		expect(beltFor(60)).toEqual({ tier: 1, count: 1 });
		expect(beltFor(61)).toEqual({ tier: 2, count: 1 });
		expect(beltFor(1200)).toEqual({ tier: 6, count: 1 });
	});

	it("uses multiple Mk6 belts above max single-belt capacity", () => {
		expect(beltFor(1300)).toEqual({ tier: 6, count: 2 });
		expect(beltFor(2400)).toEqual({ tier: 6, count: 2 });
	});

	it("returns zero belts for a non-positive rate", () => {
		expect(beltFor(0)).toEqual({ tier: 1, count: 0 });
	});
});

describe("pipeFor", () => {
	it("picks the smallest pipe tier", () => {
		expect(pipeFor(300)).toEqual({ tier: 1, count: 1 });
		expect(pipeFor(301)).toEqual({ tier: 2, count: 1 });
	});

	it("uses multiple Mk2 pipes above 600", () => {
		expect(pipeFor(601)).toEqual({ tier: 2, count: 2 });
	});
});
