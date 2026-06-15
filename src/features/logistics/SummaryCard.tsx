import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import { manualPower } from "#/features/factories/derive";
import { decodeSnapshot } from "#/features/factories/snapshot";
import { formatNumber, formatPower } from "#/lib/format";
import type { Doc } from "#convex/_generated/dataModel";
import { computeNetwork } from "./logistics";

function factoryPower(factory: Doc<"factories">): number {
	if (factory.production.source === "manual")
		return manualPower(factory.production.machines);
	return decodeSnapshot(factory.production.plan)?.solution.power ?? 0;
}

export default function SummaryCard({
	factories,
	transports,
}: {
	factories: Doc<"factories">[];
	transports: Doc<"transports">[];
}) {
	const net = computeNetwork(factories, transports);
	const power = factories.reduce((s, f) => s + factoryPower(f), 0);

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Network totals
				</h2>
				<span className="text-sm font-semibold">{formatPower(power)}</span>
			</div>
			{net.totals.length === 0 ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">Balanced.</p>
			) : (
				<div className="flex flex-col gap-1">
					{net.totals.map((t) => {
						const item = getItem(t.item);
						return (
							<div key={t.item} className="flex items-center gap-2 text-sm">
								<EntityIcon icon={item?.icon} name={item?.name ?? t.item} size={20} />
								<span className="flex-1">{item?.name ?? t.item}</span>
								<span className={t.rate >= 0 ? "text-[var(--sea-ink)]" : "text-red-500"}>
									{t.rate >= 0 ? "+" : ""}
									{formatNumber(t.rate)}/min
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
