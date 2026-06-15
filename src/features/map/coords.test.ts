import { describe, expect, it } from "vitest";
import { pixelToWorld, worldToPixel } from "./coords";

describe("coordinate transform", () => {
	it("maps the world centre to the canvas centre", () => {
		expect(worldToPixel({ x: 0, y: 0 })).toEqual({ px: 500, py: 500 });
	});

	it("maps the min corner to pixel origin and max to canvas size", () => {
		expect(worldToPixel({ x: -375_000, y: -375_000 })).toEqual({
			px: 0,
			py: 0,
		});
		expect(worldToPixel({ x: 375_000, y: 375_000 })).toEqual({
			px: 1000,
			py: 1000,
		});
	});

	it("round-trips world → pixel → world", () => {
		const world = { x: 123_456, y: -98_765 };
		const back = pixelToWorld(worldToPixel(world));
		expect(back.x).toBeCloseTo(world.x, 3);
		expect(back.y).toBeCloseTo(world.y, 3);
	});
});
