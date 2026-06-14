import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SaveAsFactoryButton from "#/features/factories/SaveAsFactoryButton";
import AvailableInputsEditor from "./AvailableInputsEditor";
import CalculatorControls, { WEIGHTING_PRESETS } from "./CalculatorControls";
import { decodePlan, encodePlan } from "./plan-codec";
import RecipeOptions from "./RecipeOptions";
import ResultTabs from "./ResultTabs";
import type { AvailableInput, ProblemSpec, Target } from "./solver";
import TargetEditor from "./TargetEditor";
import { useSolver } from "./useSolver";

type Weighting = "balanced" | "minimize-ore";

export default function CalculatorPage() {
	const search = useSearch({ strict: false }) as { plan?: string };
	const navigate = useNavigate();

	// Initialize state once from the ?plan= URL param (if present and valid).
	const [initial] = useState(() =>
		typeof search.plan === "string" ? decodePlan(search.plan) : undefined,
	);
	const [targets, setTargets] = useState<Target[]>(initial?.targets ?? []);
	const [availableInputs, setAvailableInputs] = useState<AvailableInput[]>(
		initial?.availableInputs ?? [],
	);
	const [allowedAlternates, setAllowedAlternates] = useState<string[]>(
		initial?.allowedAlternates ?? [],
	);
	const [mode, setMode] = useState<"produce" | "maximize">(
		initial?.mode ?? "produce",
	);
	const [weighting, setWeighting] = useState<Weighting>(
		initial?.resourceWeights ? "minimize-ore" : "balanced",
	);

	const spec: ProblemSpec = {
		mode,
		targets,
		availableInputs,
		allowedAlternates,
		resourceWeights: WEIGHTING_PRESETS[weighting],
	};
	const { solution, solving } = useSolver(spec);

	// Mirror state to the URL (state is the source of truth; replace, don't push).
	const planParam = targets.length > 0 ? encodePlan(spec) : undefined;
	useEffect(() => {
		navigate({
			to: "/calculator",
			search: planParam ? { plan: planParam } : {},
			replace: true,
		});
	}, [planParam, navigate]);

	return (
		<main className="page-wrap px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">
				Production calculator
			</h1>
			<div className="grid gap-8 lg:grid-cols-[320px_1fr]">
				<div className="flex flex-col gap-6">
					<CalculatorControls
						mode={mode}
						onModeChange={setMode}
						weighting={weighting}
						onWeightingChange={setWeighting}
					/>
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
							{mode === "maximize"
								? "Add a target item and an available input to maximize output."
								: "Add a target item to plan a production line."}
						</p>
					) : solving && !solution ? (
						<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Solving…
						</p>
					) : solution ? (
						<div className="flex flex-col gap-4">
							<div className="flex justify-end">
								<SaveAsFactoryButton spec={spec} solution={solution} />
							</div>
							<ResultTabs solution={solution} />
						</div>
					) : null}
				</div>
			</div>
		</main>
	);
}
