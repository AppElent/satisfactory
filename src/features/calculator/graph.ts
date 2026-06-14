import { getRecipe } from "#/data";
import { perMinute } from "#/lib/format";
import type { Solution } from "./solver";

export type NodeKind = "recipe" | "input" | "provided" | "output" | "byproduct";

export interface GraphNode {
	id: string;
	kind: NodeKind;
	/** Slug of the recipe (recipe nodes) or item (other nodes). */
	slug: string;
	rate?: number;
}

export interface GraphEdge {
	id: string;
	source: string;
	target: string;
	item: string;
	rate: number;
}

const EPSILON = 1e-6;

interface Port {
	node: string;
	rate: number;
}

/** Turn a solved plan into a production DAG: recipe/machine nodes plus input,
 *  output and byproduct nodes, with item-labelled, rate-weighted edges. */
export function buildGraph(solution: Solution): {
	nodes: GraphNode[];
	edges: GraphEdge[];
} {
	const nodes: GraphNode[] = [];
	// Per item: who supplies it and who consumes it.
	const sources = new Map<string, Port[]>();
	const sinks = new Map<string, Port[]>();
	const addSource = (item: string, node: string, rate: number) => {
		if (rate <= EPSILON) return;
		sources.set(item, [...(sources.get(item) ?? []), { node, rate }]);
	};
	const addSink = (item: string, node: string, rate: number) => {
		if (rate <= EPSILON) return;
		sinks.set(item, [...(sinks.get(item) ?? []), { node, rate }]);
	};

	// Recipe nodes (and their per-item production/consumption rates).
	for (const u of solution.recipes) {
		const id = `recipe:${u.recipe}`;
		nodes.push({ id, kind: "recipe", slug: u.recipe, rate: u.machines });
		const recipe = getRecipe(u.recipe);
		if (!recipe) continue;
		for (const p of recipe.products)
			addSource(p.item, id, perMinute(p.amount, recipe.time) * u.machines);
		for (const g of recipe.ingredients)
			addSink(g.item, id, perMinute(g.amount, recipe.time) * u.machines);
	}

	// Input nodes supply their item.
	for (const f of solution.rawInputs) {
		const id = `input:${f.item}`;
		nodes.push({ id, kind: "input", slug: f.item, rate: f.rate });
		addSource(f.item, id, f.rate);
	}
	for (const f of solution.providedInputs) {
		const id = `input:${f.item}`;
		nodes.push({ id, kind: "provided", slug: f.item, rate: f.rate });
		addSource(f.item, id, f.rate);
	}
	// Output and byproduct nodes consume (sink) their item.
	for (const f of solution.outputs) {
		const id = `output:${f.item}`;
		nodes.push({ id, kind: "output", slug: f.item, rate: f.rate });
		addSink(f.item, id, f.rate);
	}
	for (const f of solution.byproducts) {
		const id = `byproduct:${f.item}`;
		nodes.push({ id, kind: "byproduct", slug: f.item, rate: f.rate });
		addSink(f.item, id, f.rate);
	}

	// Edges: apportion each item's supply across its sinks proportionally.
	const edges: GraphEdge[] = [];
	for (const [item, srcs] of sources) {
		const dsts = sinks.get(item) ?? [];
		const totalSupply = srcs.reduce((s, p) => s + p.rate, 0);
		if (totalSupply <= EPSILON) continue;
		for (const src of srcs) {
			for (const dst of dsts) {
				const rate = (src.rate / totalSupply) * dst.rate;
				if (rate <= EPSILON) continue;
				edges.push({
					id: `${src.node}->${dst.node}:${item}`,
					source: src.node,
					target: dst.node,
					item,
					rate,
				});
			}
		}
	}

	return { nodes, edges };
}
