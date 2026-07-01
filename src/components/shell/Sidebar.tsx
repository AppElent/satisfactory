import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "#/components/ui/icon";
import { Progress } from "#/components/ui/progress";
import { cn } from "#/lib/utils";
import { NAV_GROUPS, type NavItem, resolveHref } from "./nav-model";

/** Pure: is this nav item active for the given pathname? */
export function isItemActive(itemId: string, pathname: string): boolean {
	if (itemId === "overview") return pathname === "/";
	if (itemId === "factories")
		return (
			pathname.startsWith("/factories") ||
			/^\/g\/[^/]+\/factories/.test(pathname)
		);
	if (itemId === "map")
		return pathname.startsWith("/map") || /^\/g\/[^/]+\/map/.test(pathname);
	if (itemId === "logistics")
		return (
			pathname.startsWith("/logistics") ||
			/^\/g\/[^/]+\/logistics/.test(pathname)
		);
	return pathname.startsWith(`/${itemId === "data" ? "data" : itemId}`);
}

function BadgePill({ kind }: { kind: NonNullable<NavItem["badge"]> }) {
	const isBeta = kind === "beta";
	return (
		<span
			className={cn(
				"ml-auto rounded-[2px] border px-1.5 py-px text-[9px] uppercase tracking-[0.1em]",
				isBeta
					? "border-[var(--accent-soft)] text-[var(--orange-400)]"
					: "border-[var(--border-subtle)] text-[var(--text-disabled)]",
			)}
		>
			{isBeta ? "Beta" : "Soon"}
		</span>
	);
}

export default function Sidebar({
	variant = "full",
	className,
}: {
	variant?: "full" | "rail";
	className?: string;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;
	const rail = variant === "rail";

	return (
		<aside
			className={cn(
				"flex flex-col border-r border-[var(--border-default)] bg-[var(--graphite-900)] shadow-[var(--shadow-lg)]",
				rail ? "w-[72px] items-center" : "w-[244px]",
				className,
			)}
		>
			<div
				className={cn(
					"flex items-center gap-3 border-b border-[var(--border-subtle)]",
					rail
						? "justify-center px-0 py-[18px]"
						: "px-[18px] pb-4 pt-[18px]",
				)}
			>
				<div className="relative flex h-[34px] w-[34px] flex-none items-center justify-center">
					<Icon name="hex" size={34} className="text-[var(--accent)]" />
					<span className="absolute h-2 w-2 rounded-[1px] bg-[var(--accent)] shadow-[var(--glow-accent-strong)]" />
				</div>
				{!rail && (
					<div className="min-w-0">
						<div className="font-[var(--font-display)] text-[15px] font-extrabold uppercase leading-none tracking-[0.1em] text-[var(--text-primary)]">
							FICSIT
						</div>
						<div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
							Factory Planner
						</div>
					</div>
				)}
			</div>

			<nav
				className={cn(
					"flex flex-1 flex-col gap-0.5 py-3.5",
					rail ? "items-center px-2" : "px-3",
				)}
			>
				{NAV_GROUPS.map((group) => (
					<div key={group.heading} className="contents">
						{!rail && (
							<div className="px-2.5 pb-2 pt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--text-disabled)] first:pt-1.5">
								{group.heading}
							</div>
						)}
						{group.items.map((item) => {
							const active = isItemActive(item.id, pathname);
							const href = resolveHref(item, activeGameId);
							const inner = (
								<>
									{active && (
										<span className="absolute inset-0 rounded-[var(--radius-sm)] border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)]" />
									)}
									<Icon
										name={item.icon}
										size={19}
										className={cn(
											"relative",
											active
												? "text-[var(--orange-400)]"
												: "text-[var(--text-muted)]",
										)}
									/>
									{!rail && <span className="relative">{item.label}</span>}
									{!rail && item.badge && <BadgePill kind={item.badge} />}
								</>
							);
							const base = cn(
								"relative flex h-[42px] items-center text-left text-[14px] font-semibold",
								rail
									? "w-[42px] justify-center rounded-[var(--radius-sm)]"
									: "w-full gap-3 rounded-[var(--radius-sm)] px-3",
							);
							if (item.disabled) {
								return (
									<span
										key={item.id}
										title={rail ? item.label : undefined}
										className={cn(
											base,
											"cursor-default text-[var(--text-disabled)]",
										)}
									>
										{inner}
									</span>
								);
							}
							return (
								<Link
									key={item.id}
									to={href as string}
									title={rail ? item.label : undefined}
									className={cn(
										base,
										"text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
									)}
								>
									{inner}
								</Link>
							);
						})}
					</div>
				))}
			</nav>

			{!rail && (
				<div className="m-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--graphite-850)] p-3.5">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
							Grid Load
						</span>
						<span className="font-[var(--font-mono)] text-[12px] text-[var(--green-400)]">
							70%
						</span>
					</div>
					<Progress value={70} tone="success" glow />
					<div className="mt-2 flex justify-between font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">
						<span>420.6 MW</span>
						<span>/ 600 MW</span>
					</div>
				</div>
			)}
		</aside>
	);
}
