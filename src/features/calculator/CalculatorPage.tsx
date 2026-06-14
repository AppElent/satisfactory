import { useState } from "react";
import AvailableInputsEditor from "./AvailableInputsEditor";
import RecipeOptions from "./RecipeOptions";
import ResultTabs from "./ResultTabs";
import type { AvailableInput, Target } from "./solver";
import TargetEditor from "./TargetEditor";
import { useSolver } from "./useSolver";

export default function CalculatorPage() {
	const [targets, setTargets] = useState<Target[]>([]);
	const [availableInputs, setAvailableInputs] = useState<AvailableInput[]>([]);
	const [allowedAlternates, setAllowedAlternates] = useState<string[]>([]);
	const { solution, solving } = useSolver({
		targets,
		availableInputs,
		allowedAlternates,
	});

	return (
		<main className="page-wrap px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">
				Production calculator
			</h1>
			<div className="grid gap-8 lg:grid-cols-[320px_1fr]">
				<div className="flex flex-col gap-6">
					<TargetEditor targets={targets} onChange={setTargets} />
					<AvailableInputsEditor
						inputs={availableInputs}
						onChange={setAvailableInputs}
					/>
					<RecipeOptions
						allowedAlternates={allowedAlternates}
						onChange={setAllowedAlternates}
					/>
				</div>
				<div>
					{targets.length === 0 ? (
						<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Add a target item to plan a production line.
						</p>
					) : solving && !solution ? (
						<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Solving…
						</p>
					) : solution ? (
						<ResultTabs solution={solution} />
					) : null}
				</div>
			</div>
		</main>
	);
}
