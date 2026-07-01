import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { DualPaneLayout, useIsDesktopDualPane } from "#/components/ui/dual-pane-layout";
import { Panel } from "#/components/ui/panel";
import type { ResourceNode } from "#/data/schema";
import { useGameId } from "#/features/games/useGameId";
import FactoryPinsLayer from "./FactoryPinsLayer";
import LayerPanel from "./LayerPanel";
import MapView from "./MapView";
import ResourceNodesLayer from "./ResourceNodesLayer";

const ALL_PURITIES = new Set<ResourceNode["purity"]>([
	"impure",
	"normal",
	"pure",
]);

/** Static legend entries shown in the Resource Nodes panel. */
const NODE_LEGEND = [
	{ label: "Iron Ore", color: "var(--graphite-100)" },
	{ label: "Copper Ore", color: "var(--orange-500)" },
	{ label: "Limestone", color: "var(--concrete-400)" },
	{ label: "Coal", color: "var(--graphite-400)" },
	{ label: "Crude Oil", color: "var(--green-500)" },
	{ label: "Caterium Ore", color: "var(--yellow-400)" },
	{ label: "Sulfur", color: "var(--yellow-500)" },
	{ label: "Bauxite", color: "var(--red-400)" },
	{ label: "Raw Quartz", color: "var(--blue-300)" },
	{ label: "SAM Ore", color: "var(--purple-400)" },
	{ label: "Uranium", color: "var(--lime-400)" },
	{ label: "Nitrogen Gas", color: "var(--blue-400)" },
] as const;

export default function MapPage() {
	const gameId = useGameId();
	const [showFactories, setShowFactories] = useState(true);
	const [showNodes, setShowNodes] = useState(true);
	// Forces MapView to remount (and Leaflet to re-measure) when the layout
	// mode flips between the Tabs view and the side-by-side grid — Leaflet
	// does not detect a pure CSS container-size change on its own.
	const isDesktop = useIsDesktopDualPane();

	return (
		<main className="page-wrap px-4 py-8">
			<DualPaneLayout
				gridClassName="grid-cols-[1fr_300px] gap-5"
				leftLabel="Map"
				left={
					<div
						className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] shadow-[var(--bevel-top),var(--shadow-lg)]"
						style={{ minHeight: 480 }}
					>
						<MapView key={isDesktop ? "desktop" : "mobile"}>
							{showNodes && <ResourceNodesLayer purities={ALL_PURITIES} />}
							{showFactories && (
								<Authenticated>
									<FactoryPinsLayer gameId={gameId} />
								</Authenticated>
							)}
						</MapView>
					</div>
				}
				rightLabel="Layers"
				right={
					<div className="flex flex-col gap-4">
						<LayerPanel
							showFactories={showFactories}
							showNodes={showNodes}
							onToggleFactories={setShowFactories}
							onToggleNodes={setShowNodes}
						/>

						<Unauthenticated>
							<p className="px-1 text-xs text-[var(--text-muted)]">
								Sign in to see your factories on the map.
							</p>
						</Unauthenticated>

						{/* Resource Nodes legend */}
						<Panel title="Resource Nodes">
							<div className="flex flex-col">
								{NODE_LEGEND.map((node) => (
									<div
										key={node.label}
										className="flex items-center gap-[11px] border-t border-[var(--border-subtle)] px-[18px] py-[11px]"
									>
										<span
											className="h-[9px] w-[9px] shrink-0 rounded-full"
											style={{ background: node.color }}
										/>
										<span className="flex-1 text-[13px] text-[var(--text-secondary)]">
											{node.label}
										</span>
									</div>
								))}
							</div>
						</Panel>

						{/* Save File */}
						<Panel topRail>
							<div className="px-[18px] py-[16px]">
								<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
									Save File
								</div>
								<p className="mt-2 text-[13px] leading-[1.5] text-[var(--text-secondary)]">
									Load a Satisfactory save to pin every factory and node
									automatically. Parsed locally in your browser.
								</p>
								<div className="mt-[13px]">
									<Button variant="secondary" size="sm" fullWidth>
										Load Save File
									</Button>
								</div>
							</div>
						</Panel>
					</div>
				}
			/>
		</main>
	);
}
