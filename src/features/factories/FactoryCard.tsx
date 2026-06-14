import { Link } from "@tanstack/react-router";
import EntityIcon from "#/components/EntityIcon";
import { getItem } from "#/data";
import { formatNumber } from "#/lib/format";
import type { Doc } from "#convex/_generated/dataModel";
import { efficiency } from "./derive";
import { plannedOutputs } from "./factory-view";

const STATUS_LABEL: Record<Doc<"factories">["status"], string> = {
	planned: "Planned",
	building: "Building",
	operational: "Operational",
	paused: "Paused",
};

export default function FactoryCard({
	factory,
}: {
	factory: Doc<"factories">;
}) {
	const outputs = plannedOutputs(factory.production);
	const eff = factory.actuals
		? efficiency(outputs, factory.actuals)
		: undefined;
	return (
		<Link
			to="/factories/$factoryId"
			params={{ factoryId: factory._id }}
			className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 hover:border-[var(--sea-ink)]"
		>
			<div className="flex items-center justify-between">
				<span className="font-semibold text-[var(--sea-ink)]">
					{factory.name}
				</span>
				<span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--sea-ink-soft)]">
					{STATUS_LABEL[factory.status]}
				</span>
			</div>
			<div className="flex flex-col gap-1">
				{outputs.slice(0, 3).map((o) => {
					const item = getItem(o.item);
					return (
						<div key={o.item} className="flex items-center gap-2 text-sm">
							<EntityIcon
								icon={item?.icon}
								name={item?.name ?? o.item}
								size={20}
							/>
							<span className="flex-1 text-[var(--sea-ink)]">
								{item?.name ?? o.item}
							</span>
							<span className="text-[var(--sea-ink-soft)]">
								{formatNumber(o.rate)}/min
							</span>
						</div>
					);
				})}
			</div>
			{eff && (
				<span className="text-xs text-[var(--sea-ink-soft)]">
					Efficiency {Math.round(eff.aggregate * 100)}%
				</span>
			)}
		</Link>
	);
}
