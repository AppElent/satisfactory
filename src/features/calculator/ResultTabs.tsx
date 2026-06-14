import { lazy, Suspense, useState } from "react";
import EntityIcon from "#/components/EntityIcon";
import { getBuilding, getItem, getRecipe } from "#/data";
import { formatNumber, formatPower } from "#/lib/format";
import type { Flow, Solution } from "./solver";

const ProductionGraph = lazy(() => import("./ProductionGraph"));

const TABS = ["Graph", "Table", "Resources", "Power & cost"] as const;
type Tab = (typeof TABS)[number];

function name(slug: string): string {
	return (
		getItem(slug)?.name ??
		getBuilding(slug)?.name ??
		getRecipe(slug)?.name ??
		slug
	);
}
function icon(slug: string): string | undefined {
	return getItem(slug)?.icon ?? getBuilding(slug)?.icon;
}

function FlowList({ title, flows }: { title: string; flows: Flow[] }) {
	if (flows.length === 0) {
		return (
			<p className="text-sm text-[var(--sea-ink-soft)]">
				No {title.toLowerCase()}.
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs uppercase text-[var(--sea-ink-soft)]">{title}</p>
			{flows.map((f) => (
				<div
					key={f.item}
					className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
				>
					<EntityIcon icon={icon(f.item)} name={name(f.item)} size={24} />
					<span className="flex-1 text-[var(--sea-ink)]">{name(f.item)}</span>
					<span className="font-semibold">{formatNumber(f.rate)}/min</span>
				</div>
			))}
		</div>
	);
}

export default function ResultTabs({ solution }: { solution: Solution }) {
	const [tab, setTab] = useState<Tab>("Graph");

	if (solution.status === "infeasible") {
		return (
			<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-6 text-sm text-[var(--sea-ink)]">
				<p className="font-semibold">No feasible plan</p>
				<p className="mt-1 text-[var(--sea-ink-soft)]">
					{solution.diagnosis?.message}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
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

			{tab === "Graph" && (
				<Suspense
					fallback={
						<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
							Loading graph…
						</p>
					}
				>
					<ProductionGraph solution={solution} />
				</Suspense>
			)}

			{tab === "Table" && (
				<div className="flex flex-col gap-2">
					{solution.recipes.map((u) => {
						const building = getBuilding(u.building);
						return (
							<div
								key={u.recipe}
								className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
							>
								<EntityIcon
									icon={building?.icon}
									name={building?.name ?? u.building}
									size={24}
								/>
								<span className="flex-1 text-[var(--sea-ink)]">
									{name(u.recipe)}
								</span>
								<span className="font-semibold text-[var(--sea-ink)]">
									{formatNumber(u.machines)}×
								</span>
								<span className="text-xs text-[var(--sea-ink-soft)]">
									{building?.name}
								</span>
							</div>
						);
					})}
					{solution.byproducts.length > 0 && (
						<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
							Byproducts:{" "}
							{solution.byproducts
								.map((b) => `${formatNumber(b.rate)}/min ${name(b.item)}`)
								.join(", ")}
						</p>
					)}
				</div>
			)}

			{tab === "Resources" && (
				<div className="flex flex-col gap-4">
					<FlowList title="Raw resources" flows={solution.rawInputs} />
					{solution.providedInputs.length > 0 && (
						<FlowList
							title="From your existing production"
							flows={solution.providedInputs}
						/>
					)}
				</div>
			)}

			{tab === "Power & cost" && (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3">
						<p className="text-xs uppercase text-[var(--sea-ink-soft)]">
							Power
						</p>
						<p className="text-lg font-semibold">
							{formatPower(solution.power)}
						</p>
					</div>
					<div>
						<p className="mb-2 text-xs uppercase text-[var(--sea-ink-soft)]">
							Build cost
						</p>
						<div className="flex flex-col gap-2">
							{solution.buildCost.map((c) => (
								<div
									key={c.item}
									className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
								>
									<EntityIcon
										icon={icon(c.item)}
										name={name(c.item)}
										size={24}
									/>
									<span className="flex-1">{name(c.item)}</span>
									<span className="font-semibold">{formatNumber(c.rate)}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
