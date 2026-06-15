import type { LucideIcon } from "lucide-react";
import {
	Calculator,
	Database,
	Factory,
	Map as MapIcon,
	Route as RouteIcon,
} from "lucide-react";

export type FeatureStatus = "live" | "beta" | "planned";

export type FeatureId =
	| "data"
	| "calculator"
	| "factories"
	| "map"
	| "logistics";

export interface Feature {
	id: FeatureId;
	title: string;
	path: "/data" | "/calculator" | "/factories" | "/map" | "/logistics";
	status: FeatureStatus;
	icon: LucideIcon;
	description: string;
	planned: string[];
}

export const FEATURES: Feature[] = [
	{
		id: "data",
		title: "Game data",
		path: "/data",
		status: "live",
		icon: Database,
		description:
			"Browse every item, recipe, building, buildable and schematic — searchable, filterable and fully cross-linked.",
		planned: [
			"Searchable, filterable overviews per entity type",
			"Detail pages with per-minute rates and alternate recipe comparisons",
			"Deep links into the calculator from any item",
		],
	},
	{
		id: "calculator",
		title: "Calculator",
		path: "/calculator",
		status: "beta",
		icon: Calculator,
		description:
			"Plan optimal production chains with a linear-programming solver — alternate recipes, byproduct loops and resource weighting included.",
		planned: [
			"LP-optimized production chains (like satisfactorytools.com)",
			"Produce-target and maximize-output modes",
			"Graph and table views with power and build costs",
			"Shareable plan links",
		],
	},
	{
		id: "factories",
		title: "Factories",
		path: "/factories",
		status: "beta",
		icon: Factory,
		description:
			"Save your factories with their production plans, track efficiency against reality and see total build costs.",
		planned: [
			"Save calculator plans as factories or enter I/O manually",
			"Efficiency tracking (actual vs planned output)",
			"Build cost and power breakdowns",
		],
	},
	{
		id: "map",
		title: "Map",
		path: "/map",
		status: "beta",
		icon: MapIcon,
		description:
			"The full world map with resource nodes and your factory pins — save-file loading planned.",
		planned: [
			"Interactive world map with resource node overlay",
			"Factory pins linked to your saved factories",
			"Save-file loading (parsed locally in your browser)",
		],
	},
	{
		id: "logistics",
		title: "Logistics",
		path: "/logistics",
		status: "planned",
		icon: RouteIcon,
		description:
			"Connect your factories into a logistics network: spot shortfalls, match surpluses and get transport suggestions.",
		planned: [
			"Factory network graph with shortfall and surplus badges",
			"Transport link suggestions between factories",
			"Belt, pipe, truck, train and drone throughput math",
		],
	},
];

export function getFeature(id: FeatureId): Feature {
	const feature = FEATURES.find((f) => f.id === id);
	if (!feature) throw new Error(`Unknown feature: ${id}`);
	return feature;
}
