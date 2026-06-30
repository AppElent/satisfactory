import {
	Background,
	type Edge,
	type Node,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { useEffect, useState } from "react";
import { getBuilding, getItem, getRecipe } from "#/data";
import { formatNumber } from "#/lib/format";
import { buildGraph, type GraphNode } from "./graph";
import type { Solution } from "./solver";

const elk = new ELK();
const NODE_W = 190;
const NODE_H = 56;

function label(node: GraphNode): { title: string; sub: string } {
	if (node.kind === "recipe") {
		const recipe = getRecipe(node.slug);
		const building = recipe ? getBuilding(recipe.producedIn[0]) : undefined;
		return {
			title: recipe?.name ?? node.slug,
			sub: `${formatNumber(node.rate ?? 0)}× ${building?.name ?? "machines"}`,
		};
	}
	const item = getItem(node.slug);
	const kindLabel =
		node.kind === "output"
			? "Output"
			: node.kind === "byproduct"
				? "Byproduct"
				: node.kind === "provided"
					? "Provided"
					: "Raw";
	return {
		title: item?.name ?? node.slug,
		sub: `${kindLabel} · ${formatNumber(node.rate ?? 0)}/min`,
	};
}

const KIND_STYLE: Record<
	GraphNode["kind"],
	{ background: string; border: string; boxShadow?: string }
> = {
	recipe: {
		background: "var(--bg-inset)",
		border: "1px solid var(--border-default)",
	},
	input: {
		background: "var(--bg-inset)",
		border: "1px solid var(--border-default)",
	},
	provided: {
		background: "var(--bg-inset)",
		border: "1px solid var(--border-default)",
	},
	output: {
		background: "var(--accent-soft)",
		border: "1px solid var(--accent)",
		boxShadow: "var(--glow-accent-strong)",
	},
	byproduct: {
		background: "var(--bg-inset)",
		border: "1px solid var(--border-default)",
	},
};

export default function ProductionGraph({ solution }: { solution: Solution }) {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	useEffect(() => {
		const graph = buildGraph(solution);
		const elkGraph = {
			id: "root",
			layoutOptions: {
				"elk.algorithm": "layered",
				"elk.direction": "RIGHT",
				"elk.layered.spacing.nodeNodeBetweenLayers": "80",
				"elk.spacing.nodeNode": "30",
			},
			children: graph.nodes.map((n) => ({
				id: n.id,
				width: NODE_W,
				height: NODE_H,
			})),
			edges: graph.edges.map((e) => ({
				id: e.id,
				sources: [e.source],
				targets: [e.target],
			})),
		};
		let cancelled = false;
		elk.layout(elkGraph).then((laid) => {
			if (cancelled) return;
			const pos = new Map(
				(laid.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]),
			);
			setNodes(
				graph.nodes.map((n) => {
					const { title, sub } = label(n);
					const kindStyle = KIND_STYLE[n.kind];
					return {
						id: n.id,
						position: pos.get(n.id) ?? { x: 0, y: 0 },
						data: { label: `${title} — ${sub}` },
						sourcePosition: Position.Right,
						targetPosition: Position.Left,
						style: {
							width: NODE_W,
							height: NODE_H,
							fontSize: 12,
							borderRadius: "var(--radius-sm)",
							border: kindStyle.border,
							background: kindStyle.background,
							boxShadow: kindStyle.boxShadow,
							color: "var(--text-primary)",
							padding: 6,
						},
					};
				}),
			);
			setEdges(
				graph.edges.map((e) => ({
					id: e.id,
					source: e.source,
					target: e.target,
					label: `${formatNumber(e.rate)}/min`,
					labelStyle: { fontSize: 10, fill: "var(--orange-400)" },
				})),
			);
		});
		return () => {
			cancelled = true;
		};
	}, [solution]);

	return (
		<div
			style={{ height: 480 }}
			className="rounded-[var(--radius-sm)] border border-[var(--border-default)]"
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				proOptions={{ hideAttribution: true }}
			>
				<Background />
			</ReactFlow>
		</div>
	);
}
