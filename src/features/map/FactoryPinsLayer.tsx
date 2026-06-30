import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import L from "leaflet";
import { Marker, Popup, useMapEvents } from "react-leaflet";
import { efficiency } from "#/features/factories/derive";
import { plannedOutputs } from "#/features/factories/factory-view";
import { api } from "#convex/_generated/api";
import type { Doc, Id } from "#convex/_generated/dataModel";
import { gameToLatLng, latLngToGame } from "./coords";

const pinIcon = L.divIcon({
	className: "",
	html: `<div style="width:14px;height:14px;border-radius:50%;background:var(--text-primary);border:2px solid var(--surface-card)"></div>`,
	iconSize: [14, 14],
	iconAnchor: [7, 7],
});

function pinLatLng(factory: Doc<"factories">): [number, number] | undefined {
	if (!factory.location) return undefined;
	return gameToLatLng(factory.location);
}

export default function FactoryPinsLayer({ gameId }: { gameId: Id<"games"> }) {
	const factories = useQuery(api.factories.list, gameId ? { gameId } : "skip");
	const update = useMutation(api.factories.update);
	const create = useMutation(api.factories.create);
	const navigate = useNavigate();

	useMapEvents({
		contextmenu: async (e) => {
			const location = latLngToGame(e.latlng.lat, e.latlng.lng);
			const id = await create({
				gameId,
				name: "New factory",
				status: "planned",
				production: { source: "manual", inputs: [], outputs: [], machines: [] },
				location,
			});
			navigate({
				to: "/g/$gameId/factories/$factoryId",
				params: { gameId, factoryId: id },
			});
		},
	});

	if (!factories) return null;

	return (
		<>
			{factories.map((factory) => {
				const pos = pinLatLng(factory);
				if (!pos) return null;
				const eff = factory.actuals
					? efficiency(plannedOutputs(factory.production), factory.actuals)
					: undefined;
				return (
					<Marker
						key={factory._id}
						position={pos}
						icon={pinIcon}
						draggable
						eventHandlers={{
							dragend: (e) => {
								const ll = e.target.getLatLng();
								update({
									id: factory._id,
									location: latLngToGame(ll.lat, ll.lng),
								});
							},
						}}
					>
						<Popup>
							<div className="flex flex-col gap-1">
								<span className="font-semibold">{factory.name}</span>
								<span className="text-xs capitalize">{factory.status}</span>
								{eff && (
									<span className="text-xs">
										Efficiency {Math.round(eff.aggregate * 100)}%
									</span>
								)}
								<Link
									to="/g/$gameId/factories/$factoryId"
									params={{ gameId, factoryId: factory._id }}
									className="text-xs underline"
								>
									Open factory
								</Link>
							</div>
						</Popup>
					</Marker>
				);
			})}
		</>
	);
}
