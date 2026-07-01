import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/components/ui/icon";
import { cn } from "#/lib/utils";
import MoreMenu from "./MoreMenu";
import { isItemActive } from "./Sidebar";
import { phoneOverflowNavItems, phonePrimaryNavItems, resolveHref } from "./nav-model";

export default function BottomNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [moreOpen, setMoreOpen] = useState(false);
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;

	const overflowActive = phoneOverflowNavItems().some((item) =>
		isItemActive(item.id, pathname),
	);

	return (
		<>
			<nav
				className="fixed inset-x-0 bottom-0 z-[var(--z-raised)] flex h-[60px] items-stretch border-t border-[var(--border-default)] bg-[var(--graphite-900)] md:hidden"
				aria-label="Primary"
			>
				{phonePrimaryNavItems().map((item) => {
					const active = isItemActive(item.id, pathname);
					return (
						<Link
							key={item.id}
							to={resolveHref(item, activeGameId) as string}
							className={cn(
								"flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.06em]",
								active
									? "text-[var(--orange-400)]"
									: "text-[var(--text-muted)]",
							)}
						>
							<Icon name={item.icon} size={20} />
							{item.label}
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => setMoreOpen(true)}
					className={cn(
						"flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.06em]",
						overflowActive
							? "text-[var(--orange-400)]"
							: "text-[var(--text-muted)]",
					)}
				>
					<span className="text-lg leading-none">⋯</span>
					More
				</button>
			</nav>
			<MoreMenu open={moreOpen} onOpenChange={setMoreOpen} />
		</>
	);
}
