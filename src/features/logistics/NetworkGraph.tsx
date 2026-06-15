import { Background, type Edge, type Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate } from "@tanstack/react-router";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import { getItem } from "#/data";
import { formatNumber } from "#/lib/format";
import type { Doc } from "#convex/_generated/dataModel";
import { computeNetwork } from "./logistics";

const elk = new ELK();
const NODE_W = 200;
const NODE_H = 60;

export default function NetworkGraph({
	factories,
	transports,
}: {
	factories: Doc<"factories">[];
	transports: Doc<"transports">[];
}) {
	const navigate = useNavigate();
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	useEffect(() => {
		const net = computeNetwork(factories, transports);
		const elkGraph = {
			id: "root",
			layoutOptions: {
				"elk.algorithm": "layered",
				"elk.direction": "RIGHT",
				"elk.layered.spacing.nodeNodeBetweenLayers": "90",
				"elk.spacing.nodeNode": "40",
			},
			children: factories.map((f) => ({
				id: f._id,
				width: NODE_W,
				height: NODE_H,
			})),
			edges: transports.map((t) => ({
				id: t._id,
				sources: [t.fromFactoryId],
				targets: [t.toFactoryId],
			})),
		};
		let cancelled = false;
		elk.layout(elkGraph).then((laid) => {
			if (cancelled) return;
			const pos = new Map(
				(laid.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]),
			);
			setNodes(
				factories.map((f) => {
					const bal = net.byFactory.get(f._id);
					const hasNeed = (bal?.needs.length ?? 0) > 0;
					const hasSurplus = (bal?.surplus.length ?? 0) > 0;
					const border = hasNeed
						? "#d9534f"
						: hasSurplus
							? "#4fb8b2"
							: "var(--line)";
					return {
						id: f._id,
						position: pos.get(f._id) ?? { x: 0, y: 0 },
						data: { label: f.name },
						style: {
							width: NODE_W,
							height: NODE_H,
							fontSize: 13,
							borderRadius: 8,
							border: `2px solid ${border}`,
							background: "var(--chip-bg)",
							color: "var(--sea-ink)",
							padding: 8,
						},
					};
				}),
			);
			setEdges(
				transports.map((t) => ({
					id: t._id,
					source: t.fromFactoryId,
					target: t.toFactoryId,
					label: `${getItem(t.item)?.name ?? t.item} · ${formatNumber(t.rate)}/min · ${t.mode}`,
					labelStyle: { fontSize: 10, fill: "var(--sea-ink-soft)" },
				})),
			);
		});
		return () => {
			cancelled = true;
		};
	}, [factories, transports]);

	return (
		<div
			style={{ height: 480 }}
			className="rounded-xl border border-[var(--line)]"
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				proOptions={{ hideAttribution: true }}
				onNodeClick={(_, node) =>
					navigate({
						to: "/factories/$factoryId",
						params: { factoryId: node.id },
					})
				}
			>
				<Background />
			</ReactFlow>
		</div>
	);
}
