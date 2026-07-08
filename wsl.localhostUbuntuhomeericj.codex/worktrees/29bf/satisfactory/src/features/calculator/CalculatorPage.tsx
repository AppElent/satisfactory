import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DualPaneLayout } from "#/components/ui/dual-pane-layout";
import { Panel } from "#/components/ui/panel";
import { Stat } from "#/components/ui/stat";
import { getItem, listRecipes, listSchematics } from "#/data";
import SaveAsFactoryButton from "#/features/factories/SaveAsFactoryButton";
import { formatNumber, formatPower } from "#/lib/format";
import AvailableInputsEditor from "./AvailableInputsEditor";
import {
	type AlternatePolicyState,
	deriveBuiltInPresets,
	policyFromAllowed,
	toggleAlternate,
	validAlternateRecipeSlugs,
} from "./alternate-presets";
import CalculatorControls, { WEIGHTING_PRESETS } from "./CalculatorControls";
import { decodePlan, encodePlan } from "./plan-codec";
import RecipeOptions from "./RecipeOptions";
import ResultTabs from "./ResultTabs";
import type { AvailableInput, ProblemSpec, Target } from "./solver";
import TargetEditor from "./TargetEditor";
import UsedAlternatesReview from "./UsedAlternatesReview";
import { useAlternatePresets } from "./useAlternatePresets";
import { useSolver } from "./useSolver";

type Weighting = "balanced" | "minimize-ore";

const name = (s: string) => getItem(s)?.name ?? s;

export default function CalculatorPage() {
	const search = useSearch({ strict: false }) as {
		plan?: string;
		game?: string;
		factory?: string;
	};
	const navigate = useNavigate();

	// Initialize state once from the ?plan= URL param (if present and valid).
	const [initial] = useState(() =>
		typeof search.plan === "string" ? decodePlan(search.plan) : undefined,
	);
	const [roundTrip] = useState(() => ({
		game: search.game,
		factory: search.factory,
	}));
	const recipes = useMemo(() => listRecipes(), []);
	const schematics = useMemo(() => listSchematics(), []);
	const builtInPresets = useMemo(
		() => deriveBuiltInPresets(recipes, schematics),
		[recipes, schematics],
	);
	const validAlternateSlugs = useMemo(
		() => validAlternateRecipeSlugs(recipes),
		[recipes],
	);
	const { customPresets, savePreset } =
		useAlternatePresets(validAlternateSlugs);
	const allPresets = useMemo(
		() => [...builtInPresets, ...customPresets],
		[builtInPresets, customPresets],
	);
	const [targets, setTargets] = useState<Target[]>(initial?.targets ?? []);
	const [availableInputs, setAvailableInputs] = useState<AvailableInput[]>(
		initial?.availableInputs ?? [],
	);
	const [alternatePolicy, setAlternatePolicy] = useState<AlternatePolicyState>(
		() => policyFromAllowed(initial?.allowedAlternates ?? [], builtInPresets),
	);
	const [mode, setMode] = useState<"produce" | "maximize">(
		initial?.mode ?? "produce",
	);
	const [weighting, setWeighting] = useState<Weighting>(
		initial?.resourceWeights ? "minimize-ore" : "balanced",
	);

	const allowedAlternates = alternatePolicy.allowedAlternates;
	const setAllowedAlternates = (next: string[]) => {
		setAlternatePolicy(policyFromAllowed(next, allPresets));
	};
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
			search: {
				...(planParam ? { plan: planParam } : {}),
				...(roundTrip.game ? { game: roundTrip.game } : {}),
				...(roundTrip.factory ? { factory: roundTrip.factory } : {}),
			},
			replace: true,
		});
	}, [planParam, navigate, roundTrip]);

	return (
		<div className="mx-auto max-w-[1320px] px-7 pb-[60px] pt-6">
			<DualPaneLayout
				gridClassName="grid-cols-[332px_1fr] items-start gap-6"
				leftLabel="Setup"
				left={
					<div className="flex flex-col gap-[18px]">
						<Panel className="p-[18px]">
							<CalculatorControls
								mode={mode}
								onModeChange={setMode}
								weighting={weighting}
								onWeightingChange={setWeighting}
							/>
						</Panel>
						<Panel title="Targets">
							<div className="p-4">
								<TargetEditor targets={targets} onChange={setTargets} />
							</div>
						</Panel>
						<Panel title="Available Inputs">
							<div className="p-4">
								<AvailableInputsEditor
									inputs={availableInputs}
									onChange={setAvailableInputs}
								/>
							</div>
						</Panel>
						<Panel title="Alternate Recipes">
							<div className="p-4">
								<RecipeOptions
									allowedAlternates={allowedAlternates}
									onChange={setAllowedAlternates}
									policy={alternatePolicy}
									onPolicyChange={setAlternatePolicy}
									customPresets={customPresets}
									onSavePreset={savePreset}
								/>
							</div>
						</Panel>
					</div>
				}
				rightLabel="Results"
				right={
					<div className="flex min-w-0 flex-col gap-[18px]">
						{targets.length === 0 ? (
							<Panel className="p-8">
								<p className="text-center text-[13px] text-[var(--text-muted)]">
									{mode === "maximize"
										? "Add a target item and an available input to maximize output."
										: "Add a target item to plan a production line."}
								</p>
							</Panel>
						) : solving && !solution ? (
							<Panel className="p-8">
								<p className="text-center text-[13px] text-[var(--text-muted)]">
									Solving…
								</p>
							</Panel>
						) : solution ? (
							<>
								{solution.status !== "infeasible" && (
									<div className="grid grid-cols-4 gap-3.5">
										<Panel topRail className="px-[18px] py-[15px]">
											<Stat
												label="Total Power"
												value={formatPower(solution.power).replace(
													/\s*MW$/,
													"",
												)}
												unit="MW"
											/>
										</Panel>
										<Panel className="px-[18px] py-[15px]">
											<Stat
												label="Machines"
												value={String(
													solution.recipes.reduce(
														(s, u) => s + Math.ceil(u.machines),
														0,
													),
												)}
											/>
										</Panel>
										<Panel className="px-[18px] py-[15px]">
											<Stat
												label={
													solution.rawInputs[0]
														? name(solution.rawInputs[0].item)
														: "Raw inputs"
												}
												value={
													solution.rawInputs[0]
														? formatNumber(solution.rawInputs[0].rate)
														: "0"
												}
												unit="/min"
											/>
										</Panel>
										<Panel className="px-[18px] py-[15px]">
											<Stat
												label="Byproducts"
												value={String(solution.byproducts.length)}
											/>
										</Panel>
									</div>
								)}
								<UsedAlternatesReview
									solution={solution}
									allowedAlternates={allowedAlternates}
									onToggle={(recipeSlug) =>
										setAlternatePolicy((current) =>
											toggleAlternate(current, recipeSlug, allPresets),
										)
									}
								/>
								<Panel>
									<div className="px-[18px] pt-2.5">
										<ResultTabs solution={solution} />
									</div>
									<div className="flex justify-end px-[18px] pb-3">
										<SaveAsFactoryButton
											spec={spec}
											solution={solution}
											game={roundTrip.game}
											factory={roundTrip.factory}
										/>
									</div>
								</Panel>
							</>
						) : null}
					</div>
				}
			/>
		</div>
	);
}
