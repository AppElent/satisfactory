import { Link } from "@tanstack/react-router";
import EntityIcon from "#/components/EntityIcon";
import { Badge } from "#/components/ui/badge";
import { Progress } from "#/components/ui/progress";
import { getItem } from "#/data";
import { formatNumber } from "#/lib/format";
import type { Doc, Id } from "#convex/_generated/dataModel";
import { efficiency } from "./derive";
import { plannedOutputs } from "./factory-view";
import {
	effColor,
	effProgressTone,
	STATUS_LABEL,
	statusBadgeTone,
} from "./status-style";

export default function FactoryCard({
	factory,
	gameId,
}: {
	factory: Doc<"factories">;
	gameId: Id<"games">;
}) {
	const outputs = plannedOutputs(factory.production);
	const eff = factory.actuals
		? efficiency(outputs, factory.actuals)
		: undefined;
	const effPct = eff ? Math.round(eff.aggregate * 100) : null;
	return (
		<Link
			to="/g/$gameId/factories/$factoryId"
			params={{ gameId, factoryId: factory._id }}
			className="flex flex-col gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 no-underline shadow-[var(--bevel-top),var(--shadow-md)] hover:border-[var(--border-accent)]"
		>
			<div className="flex items-start justify-between gap-2.5">
				<div className="min-w-0">
					<div className="font-[var(--font-display)] text-[17px] font-bold uppercase leading-[1.1] tracking-[0.02em] text-[var(--text-primary)]">
						{factory.name}
					</div>
				</div>
				<Badge tone={statusBadgeTone(factory.status)} dot>
					{STATUS_LABEL[factory.status]}
				</Badge>
			</div>
			<div className="flex flex-col gap-[7px] border-t border-[var(--border-subtle)] pt-3">
				{outputs.slice(0, 3).map((o) => {
					const item = getItem(o.item);
					return (
						<div key={o.item} className="flex items-center gap-2.5 text-[13px]">
							<EntityIcon
								icon={item?.icon}
								name={item?.name ?? o.item}
								size={15}
							/>
							<span className="flex-1 truncate text-[var(--text-secondary)]">
								{item?.name ?? o.item}
							</span>
							<span className="font-[var(--font-mono)] text-[var(--orange-400)]">
								{formatNumber(o.rate)}
							</span>
							<span className="text-[10px] text-[var(--text-muted)]">/min</span>
						</div>
					);
				})}
			</div>
			{effPct != null && (
				<div className="flex items-center gap-2.5 pt-1.5">
					<span className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
						Eff
					</span>
					<Progress
						className="flex-1"
						value={effPct}
						tone={effProgressTone(effPct)}
					/>
					<span
						className="font-[var(--font-mono)] text-[13px]"
						style={{ color: effColor(effPct) }}
					>
						{effPct}%
					</span>
				</div>
			)}
		</Link>
	);
}
