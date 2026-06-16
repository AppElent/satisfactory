import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useToast } from "#/components/Toast";
import { getItem } from "#/data";
import ResultTabs from "#/features/calculator/ResultTabs";
import { useGameId } from "#/features/games/useGameId";
import { formatNumber, formatPower } from "#/lib/format";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { efficiency, manualBuildCost, manualPower } from "./derive";
import { plannedOutputs } from "./factory-view";
import { decodeSnapshot } from "./snapshot";
import type { ItemRate } from "./types";

const TABS = ["Overview", "Plan", "Build cost", "Notes"] as const;
type Tab = (typeof TABS)[number];

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

	const patch = (args: Parameters<typeof update>[0]) =>
		update(args).catch(() => toast("Couldn't save changes."));

	if (factory === undefined) {
		return <main className="page-wrap px-4 py-8 text-sm">Loading…</main>;
	}
	if (factory === null) {
		return (
			<main className="page-wrap px-4 py-8">
				<p className="text-sm text-[var(--sea-ink-soft)]">
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

	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<div className="flex items-center justify-between">
				<input
					value={factory.name}
					onChange={(e) => patch({ id: factory._id, name: e.target.value })}
					aria-label="Factory name"
					className="bg-transparent text-2xl font-bold text-[var(--sea-ink)] outline-none"
				/>
				<button
					type="button"
					onClick={async () => {
						try {
							await remove({ id: factory._id });
							navigate({
								to: "/g/$gameId/factories",
								params: { gameId },
							});
						} catch {
							toast("Couldn't delete this factory.");
						}
					}}
					className="text-sm text-[var(--sea-ink-soft)] hover:text-red-500"
				>
					Delete
				</button>
			</div>

			<div className="flex gap-1 border-b border-[var(--line)]">
				{TABS.map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						className={`px-3 py-2 text-sm font-medium ${
							tab === t
								? "border-b-2 border-[var(--sea-ink)] text-[var(--sea-ink)]"
								: "text-[var(--sea-ink-soft)]"
						}`}
					>
						{t}
					</button>
				))}
			</div>

			{tab === "Overview" && (
				<div className="flex flex-col gap-3">
					{eff && (
						<p className="text-sm font-semibold text-[var(--sea-ink)]">
							Overall efficiency {Math.round(eff.aggregate * 100)}%
						</p>
					)}
					{outputs.map((o) => {
						const item = getItem(o.item);
						const actual =
							factory.actuals?.find((a) => a.item === o.item)?.rate ?? "";
						return (
							<div key={o.item} className="flex items-center gap-3 text-sm">
								<span className="flex-1 text-[var(--sea-ink)]">
									{item?.name ?? o.item}
								</span>
								<span className="text-[var(--sea-ink-soft)]">
									planned {formatNumber(o.rate)}/min
								</span>
								<input
									type="number"
									min={0}
									value={actual}
									placeholder="actual"
									aria-label={`${item?.name ?? o.item} actual per minute`}
									onChange={(e) => setActual(o.item, Number(e.target.value))}
									className="w-24 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-right"
								/>
							</div>
						);
					})}
				</div>
			)}

			{tab === "Plan" &&
				(snapshot ? (
					<ResultTabs solution={snapshot.solution} />
				) : (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						This factory was entered manually — no calculator plan attached.
					</p>
				))}

			{tab === "Build cost" && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-semibold">
						Power {formatPower(manualPower(machines))}
					</p>
					{manualBuildCost(machines).map((c) => {
						const item = getItem(c.item);
						return (
							<div key={c.item} className="flex items-center gap-3 text-sm">
								<span className="flex-1">{item?.name ?? c.item}</span>
								<span className="font-semibold">{formatNumber(c.rate)}</span>
							</div>
						);
					})}
				</div>
			)}

			{tab === "Notes" && (
				<textarea
					value={factory.notes ?? ""}
					onChange={(e) => patch({ id: factory._id, notes: e.target.value })}
					placeholder="Notes…"
					aria-label="Notes"
					className="min-h-32 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] p-3 text-sm"
				/>
			)}
		</main>
	);
}
