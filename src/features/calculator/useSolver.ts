import { useEffect, useRef, useState } from "react";
import { type ProblemSpec, type Solution, solve } from "./solver";

interface SolverState {
	solution: Solution | undefined;
	solving: boolean;
}

/** Solve whenever `spec` changes. Runs async (HiGHS loads lazily); the latest
 *  spec wins if results arrive out of order. No solve when there are no targets. */
export function useSolver(spec: ProblemSpec): SolverState {
	const [state, setState] = useState<SolverState>({
		solution: undefined,
		solving: false,
	});
	const runId = useRef(0);
	const key = JSON.stringify(spec);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the stable JSON encoding of `spec`; depending on `spec` identity would re-run every render.
	useEffect(() => {
		if (spec.targets.length === 0) {
			setState({ solution: undefined, solving: false });
			return;
		}
		const id = ++runId.current;
		setState((s) => ({ ...s, solving: true }));
		solve(spec).then((solution) => {
			if (runId.current === id) setState({ solution, solving: false });
		});
	}, [key]);

	return state;
}
