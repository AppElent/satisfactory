import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { CANVAS_SIZE, TILE_URL } from "./config";

const BOUNDS = L.latLngBounds([0, 0], [CANVAS_SIZE, CANVAS_SIZE]);

export default function MapView({ children }: { children?: ReactNode }) {
	return (
		<MapContainer
			crs={L.CRS.Simple}
			bounds={BOUNDS}
			maxBounds={BOUNDS}
			minZoom={-2}
			maxZoom={2}
			style={{
				height: "70vh",
				width: "100%",
				background: "var(--chip-bg)",
				borderRadius: "0.75rem",
			}}
		>
			{TILE_URL && (
				<TileLayer url={TILE_URL} tileSize={256} noWrap bounds={BOUNDS} />
			)}
			{children}
		</MapContainer>
	);
}
