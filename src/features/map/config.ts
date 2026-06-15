import { env } from "#/env";

/** Satisfactory world extent in centimetres (origin at centre). Symmetric
 *  default; only matters precisely once a real tile set is aligned to it. */
export const WORLD_BOUNDS = {
	minX: -375_000,
	maxX: 375_000,
	minY: -375_000,
	maxY: 375_000,
};

/** Leaflet CRS.Simple pixel canvas the world maps onto (square). */
export const CANVAS_SIZE = 1000;

/** Optional tile-layer URL template ({z}/{x}/{y}); undefined → neutral background. */
export const TILE_URL: string | undefined = env.VITE_MAP_TILE_URL;
