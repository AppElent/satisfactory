import { Link } from "@tanstack/react-router";
import { Icon } from "#/components/ui/icon";
import { Panel } from "#/components/ui/panel";
import { Progress } from "#/components/ui/progress";
import { Stat } from "#/components/ui/stat";

interface OvFactory {
	name: string;
	outputs: string;
	power: string;
	eff: number | null;
}
interface OvAlert {
	tag: string;
	color: string;
	text: string;
}

// Placeholder data (Spec 2: static; shaped for a later real-data swap).
const FACTORIES: OvFactory[] = [
	{
		name: "Northern Steel Works",
		outputs: "Steel Beam · Steel Pipe · Encased Beam",
		power: "186 MW",
		eff: 94,
	},
	{
		name: "Plastic Refinery Delta",
		outputs: "Plastic · Rubber",
		power: "142 MW",
		eff: 88,
	},
	{
		name: "Modular Frame Assembly",
		outputs: "Modular Frame · Reinforced Plate",
		power: "— MW",
		eff: null,
	},
	{
		name: "Copper Sheet Array",
		outputs: "Copper Sheet",
		power: "64 MW",
		eff: 100,
	},
	{ name: "Rotor Line 07", outputs: "Rotor · Screw", power: "0 MW", eff: null },
	{
		name: "Computer Manufactory",
		outputs: "Computer",
		power: "128 MW",
		eff: 76,
	},
];
const ALERTS: OvAlert[] = [
	{
		tag: "Power Fault",
		color: "var(--red-400)",
		text: "Grid 2 tripped at 04:12 — Rotor Line 07 lost power and is now offline.",
	},
	{
		tag: "Input Starved",
		color: "var(--yellow-400)",
		text: "Computer Manufactory running at 76% — Circuit Board supply below demand.",
	},
	{
		tag: "Milestone",
		color: "var(--green-400)",
		text: "Tier 6 complete: Pipeline Engineering Mk.II unlocked at the HUB.",
	},
];

function effFillTone(eff: number) {
	return eff >= 95 ? "success" : eff >= 80 ? "warning" : "danger";
}
function effColor(eff: number) {
	return eff >= 95
		? "var(--green-400)"
		: eff >= 80
			? "var(--yellow-400)"
			: "var(--red-400)";
}

function FactoryEfficiencyMeter({ eff }: { eff: number | null }) {
	return (
		<div className="flex flex-1 items-center gap-2.5">
			{eff == null ? (
				<div className="h-[7px] flex-1 rounded-[2px] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)]" />
			) : (
				<Progress className="flex-1" value={eff} tone={effFillTone(eff)} />
			)}
			<span
				className="w-[34px] text-right font-[var(--font-mono)] text-[12px]"
				style={{
					color: eff == null ? "var(--text-disabled)" : effColor(eff),
				}}
			>
				{eff == null ? "—" : `${eff}%`}
			</span>
		</div>
	);
}

function FactoryNameCell({ factory }: { factory: OvFactory }) {
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<span
				className="h-2.5 w-2.5 flex-none rounded-full"
				style={{
					background:
						factory.eff == null ? "var(--graphite-400)" : effColor(factory.eff),
					boxShadow:
						factory.eff == null ? "none" : `0 0 8px ${effColor(factory.eff)}`,
				}}
			/>
			<div className="min-w-0">
				<div className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
					{factory.name}
				</div>
				<div className="truncate text-[11px] text-[var(--text-muted)]">
					{factory.outputs}
				</div>
			</div>
		</div>
	);
}

export default function OverviewPage() {
	return (
		<div className="mx-auto flex max-w-[1280px] flex-col gap-[22px] px-7 pb-[60px] pt-[26px]">
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Panel topRail className="px-5 py-[18px]">
					<Stat
						label="Total Power Draw"
						value="420.6"
						unit="MW"
						delta="+18.2 MW vs plan"
						deltaTone="positive"
					/>
				</Panel>
				<Panel className="px-5 py-[18px]">
					<Stat
						label="Network Throughput"
						value="1.34"
						unit="k/min"
						delta="+96 items/min"
						deltaTone="positive"
					/>
				</Panel>
				<Panel className="px-5 py-[18px]">
					<Stat
						label="Factories Online"
						value="4/6"
						unit="sites"
						delta="2 offline"
						deltaTone="neutral"
					/>
				</Panel>
				<Panel className="px-5 py-[18px]">
					<Stat
						label="Avg Efficiency"
						value="89"
						unit="%"
						delta="-3% vs plan"
						deltaTone="danger"
					/>
				</Panel>
			</div>

			<div className="grid items-start gap-[22px] lg:grid-cols-[1.6fr_1fr]">
				<Panel
					title="Factory Network"
					headerAction={
						<Link
							to="/factories"
							className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--orange-400)] no-underline"
						>
							View all <Icon name="chevron" size={14} />
						</Link>
					}
				>
					<div className="flex flex-col">
						{FACTORIES.map((f) => (
							<div
								key={f.name}
								className="border-t border-[var(--border-subtle)] first:border-t-0"
							>
								{/* Phone/tablet: stacked card */}
								<div className="flex flex-col gap-2.5 px-5 py-3.5 md:hidden">
									<div className="flex items-center justify-between gap-3">
										<FactoryNameCell factory={f} />
										<Icon
											name="chevron"
											size={16}
											className="flex-none text-[var(--text-disabled)]"
										/>
									</div>
									<div className="flex items-center gap-3.5 pl-5">
										<span className="font-[var(--font-mono)] text-[12px] text-[var(--text-secondary)]">
											{f.power}
										</span>
										<FactoryEfficiencyMeter eff={f.eff} />
									</div>
								</div>

								{/* Desktop: original 4-column row */}
								<div className="hidden grid-cols-[minmax(0,1.7fr)_70px_minmax(90px,1fr)_16px] items-center gap-3.5 px-5 py-3.5 md:grid">
									<FactoryNameCell factory={f} />
									<div className="text-right font-[var(--font-mono)] text-[12px] text-[var(--text-secondary)]">
										{f.power}
									</div>
									<FactoryEfficiencyMeter eff={f.eff} />
									<Icon
										name="chevron"
										size={16}
										className="text-[var(--text-disabled)]"
									/>
								</div>
							</div>
						))}
					</div>
				</Panel>

				<div className="flex flex-col gap-[22px]">
					<Panel
						title="Alerts"
						headerAction={
							<span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
								{ALERTS.length}
							</span>
						}
					>
						<div className="flex flex-col">
							{ALERTS.map((a) => (
								<div
									key={a.tag}
									className="flex gap-3 border-t border-[var(--border-subtle)] px-5 py-3.5 first:border-t-0"
								>
									<span
										className="mt-[5px] h-[7px] w-[7px] flex-none rounded-full"
										style={{
											background: a.color,
											boxShadow: `0 0 8px ${a.color}`,
										}}
									/>
									<div className="min-w-0">
										<div
											className="mb-1 text-[10px] uppercase tracking-[0.12em]"
											style={{ color: a.color }}
										>
											{a.tag}
										</div>
										<div className="text-[13px] leading-[1.4] text-[var(--text-secondary)]">
											{a.text}
										</div>
									</div>
								</div>
							))}
						</div>
					</Panel>

					<Panel hazard className="px-5 py-[18px]">
						<div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
							Active Milestone
						</div>
						<div className="mt-[7px] font-[var(--font-display)] text-[19px] font-bold uppercase leading-[1.1] tracking-[0.03em] text-[var(--text-primary)]">
							Tier 7 — Bauxite Refinement
						</div>
						<div className="mb-[7px] mt-[15px] flex items-baseline justify-between">
							<span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
								HUB Progress
							</span>
							<span className="font-[var(--font-mono)] text-[13px] text-[var(--orange-400)]">
								68%
							</span>
						</div>
						<Progress value={68} tone="accent" glow className="h-2.5" />
						<div className="mt-2.5 font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">
							Needs: 4× Adaptive Control Unit · 50× Modular Frame
						</div>
					</Panel>
				</div>
			</div>
		</div>
	);
}
