import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useToast } from "#/components/Toast";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { IconButton } from "#/components/ui/icon-button";
import { Input } from "#/components/ui/input";
import { Panel } from "#/components/ui/panel";
import { Progress } from "#/components/ui/progress";
import { Tabs } from "#/components/ui/tabs";
import { getItem } from "#/data";
import { encodePlan } from "#/features/calculator/plan-codec";
import ResultTabs from "#/features/calculator/ResultTabs";
import { useSolver } from "#/features/calculator/useSolver";
import { useGameId } from "#/features/games/useGameId";
import { formatNumber, formatPower } from "#/lib/format";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { efficiency, manualBuildCost, manualPower } from "./derive";
import { factoryToSpec, plannedOutputs } from "./factory-view";
import ManualFactoryForm from "./ManualFactoryForm";
import { decodeSnapshot } from "./snapshot";
import {
	effColor,
	effProgressTone,
	STATUS_LABEL,
	statusBadgeTone,
} from "./status-style";
import type { FactoryStatus, ItemRate } from "./types";

const TABS = ["Overview", "Plan", "Build cost", "Notes"] as const;
type Tab = (typeof TABS)[number];

const TAB_ITEMS = TABS.map((t) => ({ id: t, label: t }));

export default function FactoryDetail() {
	const gameId = useGameId();
	const { factoryId } = useParams({ from: "/g/$gameId/factories/$factoryId" });
	const factory = useQuery(api.factories.get, {
		id: factoryId as Id<"factories">,
	});
	const update = useMutation(api.factories.update);
	const remove = useMutation(api.factories.remove);
	const navigate = useNavigate();
	const { toast } = useToast();
	const [tab, setTab] = useState<Tab>("Overview");
	const [editing, setEditing] = useState(false);

	const patch = (args: Parameters<typeof update>[0]) =>
		update(args).catch(() => toast("Couldn't save changes."));

	const manualSpec =
		factory && factory.production.source === "manual"
			? factoryToSpec(factory.production)
			: { targets: [], allowedAlternates: [] };
	const { solution: manualSolution, solving } = useSolver(manualSpec);

	if (factory === undefined) {
		return (
			<main className="mx-auto max-w-[1080px] px-7 pb-[60px] pt-6">
				<p className="text-sm text-[var(--text-muted)]">Loading…</p>
			</main>
		);
	}
	if (factory === null) {
		return (
			<main className="mx-auto max-w-[1080px] px-7 pb-[60px] pt-6">
				<p className="text-sm text-[var(--text-secondary)]">
					Factory not found.{" "}
					<Link
						to="/g/$gameId/factories"
						params={{ gameId }}
						className="underline"
					>
						Back to factories
					</Link>
				</p>
			</main>
		);
	}

	const outputs = plannedOutputs(factory.production);
	const snapshot =
		factory.production.source === "plan"
			? decodeSnapshot(factory.production.plan)
			: undefined;
	const machines =
		factory.production.source === "manual"
			? factory.production.machines
			: (snapshot?.solution.recipes ?? []).map((r) => ({
					building: r.building,
					count: r.machines,
				}));
	const eff = factory.actuals
		? efficiency(outputs, factory.actuals)
		: undefined;

	const setActual = (item: string, rate: number) => {
		const next: ItemRate[] = [...(factory.actuals ?? [])];
		const i = next.findIndex((a) => a.item === item);
		if (i >= 0) next[i] = { item, rate };
		else next.push({ item, rate });
		patch({ id: factory._id, actuals: next });
	};

	const effPct = eff ? Math.round(eff.aggregate * 100) : null;

	return (
		<main className="mx-auto max-w-[1080px] px-7 pb-[60px] pt-6 flex flex-col gap-5">
			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5">
				<Link
					to="/g/$gameId/factories"
					params={{ gameId }}
					className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] no-underline"
				>
					Factories
				</Link>
				<Icon
					name="chevron"
					size={13}
					className="text-[var(--text-disabled)]"
				/>
				<span className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
					{factory.name}
				</span>
			</div>

			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3 min-w-0">
					<Input
						value={factory.name}
						onChange={(e) => patch({ id: factory._id, name: e.target.value })}
						aria-label="Factory name"
						className="w-auto flex-1 bg-transparent font-display text-[28px] font-extrabold uppercase tracking-[0.02em] text-[var(--text-primary)] border-transparent focus-visible:border-[var(--border-accent)] h-auto py-1"
					/>
					<Badge tone={statusBadgeTone(factory.status)} dot>
						{STATUS_LABEL[factory.status]}
					</Badge>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Button asChild variant="secondary" size="sm">
						<Link
							to="/calculator"
							search={{
								plan: encodePlan(factoryToSpec(factory.production)),
								game: gameId,
								factory: factory._id,
							}}
						>
							Open in Calculator
						</Link>
					</Button>
					<select
						aria-label="Status"
						value={factory.status}
						onChange={(e) =>
							patch({
								id: factory._id,
								status: e.target.value as FactoryStatus,
							})
						}
						className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.06em] font-semibold"
					>
						{(["planned", "building", "operational", "paused"] as const).map(
							(s) => (
								<option key={s} value={s}>
									{s}
								</option>
							),
						)}
					</select>
					<IconButton
						aria-label="Delete factory"
						className="hover:text-[var(--red-400)] hover:border-[var(--red-500)]"
						variant="secondary"
						onClick={async () => {
							try {
								await remove({ id: factory._id });
								navigate({ to: "/g/$gameId/factories", params: { gameId } });
							} catch {
								toast("Couldn't delete this factory.");
							}
						}}
					>
						<Icon name="trash" size={15} />
					</IconButton>
				</div>
			</div>

			{/* Description */}
			<Input
				value={factory.description ?? ""}
				onChange={(e) =>
					patch({ id: factory._id, description: e.target.value })
				}
				placeholder="Short description…"
				aria-label="Description"
				className="bg-transparent text-sm text-[var(--text-secondary)] border-transparent focus-visible:border-[var(--border-accent)]"
			/>

			{/* Manual production edit */}
			{factory.production.source === "manual" && (
				<div>
					{editing ? (
						<ManualFactoryForm
							gameId={gameId}
							factoryId={factory._id}
							initial={{
								name: factory.name,
								status: factory.status,
								inputs: factory.production.inputs,
								outputs: factory.production.outputs,
								machines: factory.production.machines,
							}}
							onClose={() => setEditing(false)}
						/>
					) : (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setEditing(true)}
						>
							Edit production
						</Button>
					)}
				</div>
			)}

			{/* Tabs */}
			<Tabs
				items={TAB_ITEMS}
				value={tab}
				onChange={(id) => setTab(id as Tab)}
			/>

			{/* Overview tab */}
			{tab === "Overview" && (
				<Panel title="Overview">
					<div className="flex flex-col gap-4 p-5">
						{effPct != null && (
							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
										Overall Efficiency
									</span>
									<span
										className="font-mono text-[22px] font-bold"
										style={{ color: effColor(effPct) }}
									>
										{effPct}%
									</span>
								</div>
								<Progress value={effPct} tone={effProgressTone(effPct)} glow />
							</div>
						)}
						<div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-3">
							{outputs.map((o) => {
								const item = getItem(o.item);
								const actual =
									factory.actuals?.find((a) => a.item === o.item)?.rate ?? "";
								return (
									<div key={o.item} className="flex items-center gap-3 text-sm">
										<span className="flex-1 text-[var(--text-primary)]">
											{item?.name ?? o.item}
										</span>
										<span className="font-mono text-[var(--text-muted)] text-[12px]">
											planned {formatNumber(o.rate)}/min
										</span>
										<Input
											type="number"
											min={0}
											value={actual}
											placeholder="actual"
											aria-label={`${item?.name ?? o.item} actual per minute`}
											onChange={(e) =>
												setActual(o.item, Number(e.target.value))
											}
											className="w-24 text-right"
										/>
									</div>
								);
							})}
						</div>
					</div>
				</Panel>
			)}

			{/* Plan tab */}
			{tab === "Plan" &&
				(factory.production.source === "plan" ? (
					snapshot ? (
						<ResultTabs solution={snapshot.solution} />
					) : (
						<Panel title="Plan">
							<p className="p-5 text-sm text-[var(--text-muted)]">
								This plan could not be read.
							</p>
						</Panel>
					)
				) : manualSolution ? (
					<ResultTabs solution={manualSolution} />
				) : solving ? (
					<Panel title="Plan">
						<p className="p-8 text-center text-sm text-[var(--text-muted)]">
							Solving…
						</p>
					</Panel>
				) : (
					<Panel title="Plan">
						<p className="p-5 text-sm text-[var(--text-muted)]">
							Add outputs to this factory to see a production graph.
						</p>
					</Panel>
				))}

			{/* Build cost tab */}
			{tab === "Build cost" && (
				<Panel title="Build Cost">
					<div className="flex flex-col gap-3 p-5">
						<div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--accent-soft)] px-4 py-2">
							<span className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[var(--text-secondary)]">
								Power
							</span>
							<span className="font-mono text-[var(--orange-400)] font-bold">
								{formatPower(manualPower(machines))}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{manualBuildCost(machines).map((c) => {
								const item = getItem(c.item);
								return (
									<div
										key={c.item}
										className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-[13px]"
									>
										<span className="truncate text-[var(--text-secondary)]">
											{item?.name ?? c.item}
										</span>
										<span className="font-mono font-semibold text-[var(--text-primary)]">
											{formatNumber(c.rate)}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</Panel>
			)}

			{/* Notes tab */}
			{tab === "Notes" && (
				<Panel title="Notes">
					<div className="p-5">
						<textarea
							value={factory.notes ?? ""}
							onChange={(e) =>
								patch({ id: factory._id, notes: e.target.value })
							}
							placeholder="Notes…"
							aria-label="Notes"
							className="min-h-32 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[var(--border-accent)] shadow-[var(--bevel-inset)]"
						/>
					</div>
				</Panel>
			)}
		</main>
	);
}
