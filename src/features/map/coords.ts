import { CANVAS_SIZE, WORLD_BOUNDS } from "./config";

export interface World {
	x: number;
	y: number;
}
export interface Pixel {
	px: number;
	py: number;
}

const spanX = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
const spanY = WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY;

export function worldToPixel({ x, y }: World): Pixel {
	return {
		px: ((x - WORLD_BOUNDS.minX) / spanX) * CANVAS_SIZE,
		py: ((y - WORLD_BOUNDS.minY) / spanY) * CANVAS_SIZE,
	};
}

export function pixelToWorld({ px, py }: Pixel): World {
	return {
		x: (px / CANVAS_SIZE) * spanX + WORLD_BOUNDS.minX,
		y: (py / CANVAS_SIZE) * spanY + WORLD_BOUNDS.minY,
	};
}
