import type { ProblemSpec, Solution } from "#/features/calculator/solver";

export type FactoryStatus = "planned" | "building" | "operational" | "paused";

export interface ItemRate {
	item: string;
	rate: number;
}

export interface MachineCount {
	building: string;
	count: number;
	clock?: number;
}

/** Frozen calculator result attached to a factory. */
export interface PlanSnapshot {
	spec: ProblemSpec;
	solution: Solution;
}

export type Production =
	| { source: "plan"; plan: string }
	| {
			source: "manual";
			inputs: ItemRate[];
			outputs: ItemRate[];
			machines: MachineCount[];
	  };
