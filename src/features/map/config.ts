import { env } from "#/env";

// These replicate the Satisfactory-Calculator interactive map's coordinate
// system so its tile pyramid, the resource-node dataset and our factory pins
// all share one space. Game coordinates are centimetres (origin at centre).
// Ported from AnthorNet/SC-InteractiveMap `src/GameMap.js`.

const RAW_WEST = -324698.832031;
const RAW_EAST = 425301.832031;
const RAW_NORTH = -375000;
const RAW_SOUTH = 375000;
const BASE_BACKGROUND = 32768;
const EXTRA_BORDER = 4096; // SC's grey border around the playable area

const weRatio = (Math.abs(RAW_WEST) + Math.abs(RAW_EAST)) / BASE_BACKGROUND;
const nsRatio = (Math.abs(RAW_NORTH) + Math.abs(RAW_SOUTH)) / BASE_BACKGROUND;

/** Mapping bounds in centimetres, including SC's border offset. */
export const BOUNDS = {
	west: RAW_WEST - weRatio * EXTRA_BORDER,
	east: RAW_EAST + weRatio * EXTRA_BORDER,
	north: RAW_NORTH - nsRatio * EXTRA_BORDER,
	south: RAW_SOUTH + nsRatio * EXTRA_BORDER,
};

/** Full-resolution raster size in pixels (square). */
export const BACKGROUND_SIZE = BASE_BACKGROUND + EXTRA_BORDER * 2; // 40960
export const TILE_SIZE = 256;
/** Leaflet zoom at which the raster maps 1:1 (SC's `zoomRatio`). */
export const ZOOM_RATIO = Math.ceil(Math.log2(BACKGROUND_SIZE / TILE_SIZE)); // 8
export const MIN_ZOOM = 3;
export const MAX_NATIVE_ZOOM = ZOOM_RATIO; // 8 — tiles exist up to here
export const MAX_ZOOM = ZOOM_RATIO + 2; // allow a little overzoom

/** Tile-layer URL template. Defaults to SC's game-map tiles; env can override. */
export const TILE_URL: string =
	env.VITE_MAP_TILE_URL ??
	"https://static.satisfactory-calculator.com/imgMap/gameLayer/Stable/{z}/{x}/{y}.png";
