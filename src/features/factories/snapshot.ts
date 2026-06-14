import type { PlanSnapshot } from "./types";

export function encodeSnapshot(snapshot: PlanSnapshot): string {
	return JSON.stringify(snapshot);
}

export function decodeSnapshot(plan: string): PlanSnapshot | undefined {
	try {
		const parsed = JSON.parse(plan);
		if (
			!parsed ||
			typeof parsed !== "object" ||
			!parsed.spec ||
			!Array.isArray(parsed.spec.targets) ||
			!parsed.solution ||
			!Array.isArray(parsed.solution.recipes)
		) {
			return undefined;
		}
		return parsed as PlanSnapshot;
	} catch {
		return undefined;
	}
}
