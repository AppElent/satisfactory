import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { getItem, listResourceNodes } from "#/data";
import type { ResourceNode } from "#/data/schema";
import { gameToLatLng } from "./coords";

const PURITY_COLOR: Record<ResourceNode["purity"], string> = {
	impure: "#b07d4b",
	normal: "#c9a227",
	pure: "#4fb8b2",
};

function nodeIcon(purity: ResourceNode["purity"]) {
	return L.divIcon({
		className: "",
		html: `<div style="width:10px;height:10px;border-radius:50%;background:${PURITY_COLOR[purity]};border:1px solid var(--surface-card)"></div>`,
		iconSize: [10, 10],
		iconAnchor: [5, 5],
	});
}

export default function ResourceNodesLayer({
	purities,
}: {
	purities: Set<ResourceNode["purity"]>;
}) {
	const nodes = listResourceNodes().filter((n) => purities.has(n.purity));
	return (
		<>
			{nodes.map((node) => {
				const item = getItem(node.type);
				return (
					<Marker
						key={node.id}
						position={gameToLatLng(node)}
						icon={nodeIcon(node.purity)}
					>
						<Popup>
							<span className="text-xs capitalize">
								{item?.name ?? node.type} — {node.purity}
							</span>
						</Popup>
					</Marker>
				);
			})}
		</>
	);
}
