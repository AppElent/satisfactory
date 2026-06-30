import { lazy, Suspense, useState } from "react";
import EntityIcon from "#/components/EntityIcon";
import { Tabs } from "#/components/ui/tabs";
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
			<p className="text-sm text-[var(--text-muted)]">
				No {title.toLowerCase()}.
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs uppercase text-[var(--text-muted)]">{title}</p>
			{flows.map((f) => (
				<div
					key={f.item}
					className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
				>
					<EntityIcon icon={icon(f.item)} name={name(f.item)} size={24} />
					<span className="flex-1 text-[var(--text-primary)]">
						{name(f.item)}
					</span>
					<span className="font-[var(--font-mono)] text-[var(--orange-400)]">
						{formatNumber(f.rate)}/min
					</span>
				</div>
			))}
		</div>
	);
}

export default function ResultTabs({ solution }: { solution: Solution }) {
	const [tab, setTab] = useState<Tab>("Graph");

	if (solution.status === "infeasible") {
		return (
			<div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-6 text-sm">
				<p className="font-semibold text-[var(--red-400)]">No feasible plan</p>
				<p className="mt-1 text-[var(--text-muted)]">
					{solution.diagnosis?.message}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<Tabs
				items={TABS.map((t) => ({ id: t, label: t }))}
				value={tab}
				onChange={(id) => setTab(id as Tab)}
			/>

			{tab === "Graph" && (
				<Suspense
					fallback={
						<p className="p-8 text-center text-sm text-[var(--text-muted)]">
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
								className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
							>
								<EntityIcon
									icon={building?.icon}
									name={building?.name ?? u.building}
									size={24}
								/>
								<span className="flex-1 text-[var(--text-primary)]">
									{name(u.recipe)}
								</span>
								<span className="font-[var(--font-mono)] text-[var(--orange-400)]">
									{formatNumber(u.machines)}×
								</span>
								<span className="text-xs text-[var(--text-muted)]">
									{building?.name}
								</span>
							</div>
						);
					})}
					{solution.byproducts.length > 0 && (
						<p className="mt-1 text-xs text-[var(--text-muted)]">
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
					<div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-4 py-3">
						<p className="text-xs uppercase text-[var(--text-muted)]">Power</p>
						<p className="font-[var(--font-mono)] text-lg text-[var(--orange-400)]">
							{formatPower(solution.power)}
						</p>
					</div>
					<div>
						<p className="mb-2 text-xs uppercase text-[var(--text-muted)]">
							Build cost
						</p>
						<div className="flex flex-col gap-2">
							{solution.buildCost.map((c) => (
								<div
									key={c.item}
									className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
								>
									<EntityIcon
										icon={icon(c.item)}
										name={name(c.item)}
										size={24}
									/>
									<span className="flex-1 text-[var(--text-primary)]">
										{name(c.item)}
									</span>
									<span className="font-[var(--font-mono)] text-[var(--orange-400)]">
										{formatNumber(c.rate)}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
