import { Authenticated } from "convex/react";
import { useState } from "react";
import type { ResourceNode } from "#/data/schema";
import FactoryPinsLayer from "./FactoryPinsLayer";
import LayerPanel from "./LayerPanel";
import MapView from "./MapView";
import ResourceNodesLayer from "./ResourceNodesLayer";

const ALL_PURITIES = new Set<ResourceNode["purity"]>([
	"impure",
	"normal",
	"pure",
]);

export default function MapPage() {
	const [showFactories, setShowFactories] = useState(true);
	const [showNodes, setShowNodes] = useState(true);

	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--sea-ink)]">World map</h1>
			<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
				<LayerPanel
					showFactories={showFactories}
					showNodes={showNodes}
					onToggleFactories={setShowFactories}
					onToggleNodes={setShowNodes}
				/>
				<MapView>
					{showNodes && <ResourceNodesLayer purities={ALL_PURITIES} />}
					{showFactories && (
						<Authenticated>
							<FactoryPinsLayer />
						</Authenticated>
					)}
				</MapView>
			</div>
		</main>
	);
}
