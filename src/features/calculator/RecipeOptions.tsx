import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { getBuilding, getItem, listRecipes, listSchematics } from "#/data";
import {
	type AlternatePolicyState,
	type AlternatePreset,
	alternateSummary,
	applyPreset,
	deriveBuiltInPresets,
	groupAlternateRecipes,
	policyFromAllowed,
	toggleAlternate,
	validAlternateRecipeSlugs,
} from "./alternate-presets";
import { useAlternatePresets } from "./useAlternatePresets";

type SavePresetArgs =
	| { mode: "create"; name: string; recipeSlugs: string[] }
	| { mode: "overwrite"; id: string; name: string; recipeSlugs: string[] };

interface RecipeOptionsProps {
	allowedAlternates: string[];
	onChange: (allowed: string[]) => void;
	policy?: AlternatePolicyState;
	onPolicyChange?: (policy: AlternatePolicyState) => void;
	customPresets?: AlternatePreset[];
	onSavePreset?: (args: SavePresetArgs) => AlternatePreset;
}

type ManagerTab = "presets" | "recipes" | "changes";
type SaveMode = "create" | "overwrite";

function recipeName(slug: string): string {
	return listRecipes().find((recipe) => recipe.slug === slug)?.name ?? slug;
}

function SavedPresetForm({
	customPresets,
	allowedAlternates,
	onSave,
}: {
	customPresets: AlternatePreset[];
	allowedAlternates: string[];
	onSave: (args: SavePresetArgs) => void;
}) {
	const [mode, setMode] = useState<SaveMode>("create");
	const [name, setName] = useState("");
	const [selectedId, setSelectedId] = useState(customPresets[0]?.id ?? "");
	const selected = customPresets.find((preset) => preset.id === selectedId);
	const canOverwrite = mode === "overwrite" && selected !== undefined;

	return (
		<div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3">
			<p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
				Save as preset
			</p>
			<label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
				<input
					type="radio"
					checked={mode === "create"}
					onChange={() => setMode("create")}
				/>
				Create new preset
			</label>
			<label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
				<input
					type="radio"
					aria-label="Overwrite existing preset"
					checked={mode === "overwrite"}
					onChange={() => setMode("overwrite")}
					disabled={customPresets.length === 0}
				/>
				Overwrite existing preset
			</label>
			{mode === "overwrite" ? (
				<select
					aria-label="Preset to overwrite"
					value={selectedId}
					onChange={(event) => {
						setSelectedId(event.target.value);
						const preset = customPresets.find(
							(candidate) => candidate.id === event.target.value,
						);
						setName(preset?.name ?? "");
					}}
					className="h-[var(--control-h-md)] rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)]"
				>
					{customPresets.map((preset) => (
						<option key={preset.id} value={preset.id}>
							{preset.name}
						</option>
					))}
				</select>
			) : null}
			<Input
				aria-label="Preset name"
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder={selected?.name ?? "Preset name"}
			/>
			<Button
				type="button"
				size="sm"
				onClick={() => {
					if (canOverwrite) {
						onSave({
							mode: "overwrite",
							id: selected.id,
							name: name || selected.name,
							recipeSlugs: allowedAlternates,
						});
						return;
					}
					onSave({
						mode: "create",
						name,
						recipeSlugs: allowedAlternates,
					});
				}}
			>
				{canOverwrite ? "Overwrite preset" : "Create preset"}
			</Button>
		</div>
	);
}

export default function RecipeOptions({
	allowedAlternates,
	onChange,
	policy,
	onPolicyChange,
	customPresets,
	onSavePreset,
}: RecipeOptionsProps) {
	const [open, setOpen] = useState(false);
	const [saveOpen, setSaveOpen] = useState(false);
	const [tab, setTab] = useState<ManagerTab>("presets");
	const [query, setQuery] = useState("");
	const [savedMessage, setSavedMessage] = useState(false);
	const recipes = useMemo(() => listRecipes(), []);
	const schematics = useMemo(() => listSchematics(), []);
	const validAlternateSlugs = useMemo(
		() => validAlternateRecipeSlugs(recipes),
		[recipes],
	);
	const localPresets = useAlternatePresets(validAlternateSlugs);
	const effectiveCustomPresets = customPresets ?? localPresets.customPresets;
	const savePreset = onSavePreset ?? localPresets.savePreset;
	const builtIns = useMemo(
		() => deriveBuiltInPresets(recipes, schematics),
		[recipes, schematics],
	);
	const presets = useMemo(
		() => [...builtIns, ...effectiveCustomPresets],
		[builtIns, effectiveCustomPresets],
	);
	const currentPolicy =
		policy ?? policyFromAllowed(allowedAlternates, builtIns);
	const summary = alternateSummary(currentPolicy, presets);
	const allowed = new Set(currentPolicy.allowedAlternates);
	const groups = groupAlternateRecipes(recipes, schematics)
		.map((group) => ({
			...group,
			recipes: group.recipes.filter((info) =>
				info.recipe.name.toLowerCase().includes(query.toLowerCase()),
			),
		}))
		.filter((group) => group.recipes.length > 0);

	const commitPolicy = (next: AlternatePolicyState) => {
		if (onPolicyChange) {
			onPolicyChange(next);
			return;
		}
		onChange(next.allowedAlternates);
	};

	const saveCurrent = (args: SavePresetArgs) => {
		savePreset(args);
		setSavedMessage(true);
		setSaveOpen(false);
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3">
				<p className="font-semibold text-[var(--text-primary)]">
					{summary.label}
				</p>
				<p className="mt-1 text-sm text-[var(--text-muted)]">
					{summary.enabled} enabled
					{summary.excluded > 0 ? ` - ${summary.excluded} excluded` : ""}
				</p>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => setOpen(true)}
					aria-label="Manage alternates"
				>
					Manage
				</Button>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={() => setSaveOpen(true)}
					aria-label="Save as preset"
				>
					Save as preset
				</Button>
			</div>
			{savedMessage ? (
				<p className="text-xs text-[var(--green-400)]">Preset saved</p>
			) : null}

			<Dialog open={saveOpen} onOpenChange={setSaveOpen}>
				<DialogContent className="max-w-lg p-5">
					<DialogTitle className="font-[var(--font-display)] text-lg uppercase text-[var(--text-primary)]">
						Save alternate preset
					</DialogTitle>
					<DialogDescription className="mt-1 text-sm text-[var(--text-muted)]">
						Save the current concrete recipe selection.
					</DialogDescription>
					<div className="mt-4">
						<SavedPresetForm
							customPresets={effectiveCustomPresets}
							allowedAlternates={currentPolicy.allowedAlternates}
							onSave={saveCurrent}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[86vh] max-w-5xl overflow-y-auto p-0">
					<div className="border-b border-[var(--border-default)] p-5">
						<DialogTitle className="font-[var(--font-display)] text-xl uppercase text-[var(--text-primary)]">
							Manage alternates
						</DialogTitle>
						<DialogDescription className="mt-1 text-sm text-[var(--text-muted)]">
							Choose presets, search recipes, or review plan-local changes.
						</DialogDescription>
					</div>
					<div className="p-5">
						<div className="flex gap-1 border-b border-[var(--border-subtle)]">
							{(
								[
									["presets", "Presets"],
									["recipes", "Recipes"],
									["changes", "Changes"],
								] as const
							).map(([id, label]) => (
								<button
									key={id}
									type="button"
									onClick={() => setTab(id)}
									className="relative h-[42px] cursor-pointer border-b-2 border-transparent bg-transparent px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text-primary)]"
									data-state={tab === id ? "active" : "inactive"}
								>
									{label}
								</button>
							))}
						</div>
						{tab === "presets" ? (
							<div className="mt-4 grid gap-2 md:grid-cols-2">
								{presets.map((preset) => (
									<button
										key={preset.id}
										type="button"
										onClick={() =>
											commitPolicy(applyPreset(preset.id, presets))
										}
										className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3 text-left hover:border-[var(--accent)]"
									>
										<span className="block font-semibold text-[var(--text-primary)]">
											{preset.name}
										</span>
										<span className="text-sm text-[var(--text-muted)]">
											{preset.recipeSlugs.length} alternates
										</span>
									</button>
								))}
							</div>
						) : null}
						{tab === "recipes" ? (
							<div className="mt-4 flex flex-col gap-4">
								<Input
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Filter alternates..."
									aria-label="Filter alternate recipes"
								/>
								{groups.map((group) => (
									<section key={group.id} className="flex flex-col gap-2">
										<h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
											{group.label}
										</h3>
										{group.recipes.map((info) => {
											const product = getItem(info.primaryProduct);
											const machine = info.machine
												? getBuilding(info.machine)
												: undefined;
											return (
												<div
													key={info.recipe.slug}
													className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3"
												>
													<Checkbox
														checked={allowed.has(info.recipe.slug)}
														onCheckedChange={() =>
															commitPolicy(
																toggleAlternate(
																	currentPolicy,
																	info.recipe.slug,
																	presets,
																),
															)
														}
														aria-label={info.recipe.name}
													/>
													<div>
														<p className="font-semibold text-[var(--text-primary)]">
															{info.recipe.name}
														</p>
														<p className="text-sm text-[var(--text-muted)]">
															{product?.name ?? info.primaryProduct}
															{machine ? ` - ${machine.name}` : ""}
														</p>
													</div>
													<span className="font-mono text-xs text-[var(--orange-400)]">
														{allowed.has(info.recipe.slug) ? "ON" : "OFF"}
													</span>
												</div>
											);
										})}
									</section>
								))}
							</div>
						) : null}
						{tab === "changes" ? (
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<section>
									<h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
										Excluded from preset
									</h3>
									{currentPolicy.excludedAlternates.length === 0 ? (
										<p className="mt-2 text-sm text-[var(--text-muted)]">
											No exclusions.
										</p>
									) : (
										currentPolicy.excludedAlternates.map((slug) => (
											<p
												key={slug}
												className="mt-2 text-sm text-[var(--text-primary)]"
											>
												{recipeName(slug)}
											</p>
										))
									)}
								</section>
								<section>
									<h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
										Manually included
									</h3>
									{currentPolicy.includedAlternates.length === 0 ? (
										<p className="mt-2 text-sm text-[var(--text-muted)]">
											No manual inclusions.
										</p>
									) : (
										currentPolicy.includedAlternates.map((slug) => (
											<p
												key={slug}
												className="mt-2 text-sm text-[var(--text-primary)]"
											>
												{recipeName(slug)}
											</p>
										))
									)}
								</section>
							</div>
						) : null}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
