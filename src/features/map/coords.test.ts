import { describe, expect, it } from "vitest";
import { gameToLatLng, latLngToGame } from "./coords";

describe("coordinate transform (SC projection)", () => {
	it("round-trips game → latLng → game", () => {
		const world = { x: 123_456, y: -98_765 };
		const [lat, lng] = gameToLatLng(world);
		const back = latLngToGame(lat, lng);
		expect(back.x).toBeCloseTo(world.x, 3);
		expect(back.y).toBeCloseTo(world.y, 3);
	});

	it("places the world centre near the middle of the raster", () => {
		// At game (0,0) the y-pixel is the raster centre, so lat = -160/2 = -80.
		const [lat] = gameToLatLng({ x: 0, y: 0 });
		expect(lat).toBeCloseTo(-80, 6);
	});

	it("maps a known pure iron node into the latLng bounds", () => {
		// BP_ResourceNode517 (pure iron) at game (124933.16, 5226.19).
		const [lat, lng] = gameToLatLng({ x: 124_933.164, y: 5226.189 });
		expect(lat).toBeGreaterThanOrEqual(-160);
		expect(lat).toBeLessThanOrEqual(0);
		expect(lng).toBeGreaterThanOrEqual(0);
		expect(lng).toBeLessThanOrEqual(160);
	});
});
