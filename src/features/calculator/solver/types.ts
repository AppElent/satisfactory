/** A production target: produce `rate` of `item` per minute. */
export interface Target {
	item: string;
	rate: number;
}

/** An item the user already produces elsewhere, available to this plan as a
 *  free input. `rate` caps how much per minute (omit = unlimited). */
export interface AvailableInput {
	item: string;
	rate?: number;
}

/** Inputs to the solver. */
export interface ProblemSpec {
	targets: Target[];
	/** Slugs of alternate recipes the user has enabled. Standard recipes are
	 *  always enabled; alternates only when listed here. */
	allowedAlternates: string[];
	/** Items the user already produces — consumed before building from scratch,
	 *  at zero raw-resource cost, up to their optional `rate` cap. */
	availableInputs?: AvailableInput[];
	/** Per-resource objective weight (higher = more costly to consume). Missing
	 *  resources default to 1; non-resource imports always weigh 1. */
	resourceWeights?: Record<string, number>;
}

/** One recipe running in the solution. */
export interface RecipeUsage {
	recipe: string;
	/** Machines at 100% clock (fractional). */
	machines: number;
	building: string;
}

/** An item amount per minute. */
export interface Flow {
	item: string;
	rate: number;
}

/** Net production/consumption of an item across the whole plan. */
export interface ItemFlow {
	item: string;
	produced: number;
	consumed: number;
}

export interface Solution {
	status: "optimal" | "infeasible";
	recipes: RecipeUsage[];
	/** Raw/imported inputs consumed (the factory's "shopping list"). */
	rawInputs: Flow[];
	/** Items produced beyond demand (byproducts / overflow). */
	byproducts: Flow[];
	/** Per-item produced vs consumed, for the table view. */
	flows: ItemFlow[];
	/** Total power draw, MW. */
	power: number;
	/** Aggregated construction materials (ceil machines). */
	buildCost: Flow[];
	/** When infeasible: human-readable reason + the unreachable target items. */
	diagnosis?: { message: string; unreachable: string[] };
}

/** Internal LP model — pure data, no solver dependency. */
export interface LpModel {
	/** Enabled recipes, index-aligned with `recipeVar(i)` = `r{i}`. */
	recipes: import("#/data/schema").Recipe[];
	/** Input item slug → import var name `m{i}`. */
	importVars: Map<string, string>;
	/** Item slugs that are user-provided available inputs (subset of importVars keys). */
	providedInputs: Set<string>;
	/** Objective coefficient per variable name. */
	objective: Map<string, number>;
	/** Upper bounds per variable name (e.g. a capped available input). */
	bounds: Map<string, number>;
	/** One row per constrained item: Σ coef·var >= rhs. */
	rows: Array<{ item: string; coefs: Map<string, number>; rhs: number }>;
}
