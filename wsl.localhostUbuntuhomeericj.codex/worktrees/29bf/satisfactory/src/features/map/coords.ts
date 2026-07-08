import { BACKGROUND_SIZE, BOUNDS, ZOOM_RATIO } from "./config";

export interface World {
	x: number;
	y: number;
}

const xMax = Math.abs(BOUNDS.west) + Math.abs(BOUNDS.east);
const yMax = Math.abs(BOUNDS.north) + Math.abs(BOUNDS.south);
const scale = 2 ** ZOOM_RATIO; // CRS.Simple pixels per unit at the reference zoom

/** Game centimetres → Leaflet CRS.Simple `[lat, lng]`, aligned to the SC tiles. */
export function gameToLatLng({ x, y }: World): [number, number] {
	const rx = (xMax - BOUNDS.east + x) * (BACKGROUND_SIZE / xMax);
	const ry =
		(yMax - BOUNDS.north + y) * (BACKGROUND_SIZE / yMax) - BACKGROUND_SIZE;
	return [-ry / scale, rx / scale];
}

/** Leaflet `[lat, lng]` → game centimetres (inverse of {@link gameToLatLng}). */
export function latLngToGame(lat: number, lng: number): World {
	const rx = lng * scale;
	const ry = -lat * scale;
	return {
		x: rx * (xMax / BACKGROUND_SIZE) - (xMax - BOUNDS.east),
		y: ry * (yMax / BACKGROUND_SIZE) - (yMax - BOUNDS.north) + yMax,
	};
}
