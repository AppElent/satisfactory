import { decodeSnapshot } from "./snapshot";
import type { ItemRate, Production } from "./types";

/** The factory's planned outputs, regardless of production source. */
export function plannedOutputs(production: Production): ItemRate[] {
	if (production.source === "manual") return production.outputs;
	const snapshot = decodeSnapshot(production.plan);
	return snapshot?.solution.outputs ?? [];
}

/** The factory's planned inputs (consumed from outside), regardless of source. */
export function plannedInputs(production: Production): ItemRate[] {
	if (production.source === "manual") return production.inputs;
	const snapshot = decodeSnapshot(production.plan);
	if (!snapshot) return [];
	return [...snapshot.solution.rawInputs, ...snapshot.solution.providedInputs];
}
