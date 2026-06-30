import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import {
	BACKGROUND_SIZE,
	MAX_NATIVE_ZOOM,
	MAX_ZOOM,
	MIN_ZOOM,
	TILE_SIZE,
	TILE_URL,
	ZOOM_RATIO,
} from "./config";

// World extent in CRS.Simple latLng units (raster pixels ÷ reference scale).
const EDGE = BACKGROUND_SIZE / 2 ** ZOOM_RATIO; // 160
const WORLD_BOUNDS = L.latLngBounds([-EDGE, 0], [0, EDGE]);

export default function MapView({ children }: { children?: ReactNode }) {
	return (
		<MapContainer
			crs={L.CRS.Simple}
			bounds={WORLD_BOUNDS}
			maxBounds={WORLD_BOUNDS}
			minZoom={MIN_ZOOM}
			maxZoom={MAX_ZOOM}
			style={{
				height: "70vh",
				width: "100%",
				background: "var(--bg-inset)",
				borderRadius: "0.75rem",
			}}
		>
			<TileLayer
				url={TILE_URL}
				tileSize={TILE_SIZE}
				minNativeZoom={MIN_ZOOM}
				maxNativeZoom={MAX_NATIVE_ZOOM}
				bounds={WORLD_BOUNDS}
				noWrap
			/>
			{children}
		</MapContainer>
	);
}
