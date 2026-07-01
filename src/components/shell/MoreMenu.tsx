import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { Icon } from "#/components/ui/icon";
import GameSwitcher from "#/features/games/GameSwitcher";
import { cn } from "#/lib/utils";
import { phoneOverflowNavItems, resolveHref } from "./nav-model";

export default function MoreMenu({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent position="bottom" aria-describedby={undefined}>
				<DialogTitle className="sr-only">More</DialogTitle>
				<div className="flex flex-col gap-0.5 p-3">
					{phoneOverflowNavItems().map((item) => {
						const href = resolveHref(item, activeGameId);
						const inner = (
							<>
								<Icon
									name={item.icon}
									size={19}
									className="text-[var(--text-muted)]"
								/>
								<span>{item.label}</span>
								{item.badge && (
									<span className="ml-auto text-[10px] uppercase tracking-[0.1em] text-[var(--text-disabled)]">
										{item.badge === "beta" ? "Beta" : "Soon"}
									</span>
								)}
							</>
						);
						const base =
							"flex h-[46px] w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-[14px] font-semibold";
						if (item.disabled) {
							return (
								<span
									key={item.id}
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
								onClick={() => onOpenChange(false)}
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
				<div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-4 py-3">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[var(--green-500)] shadow-[var(--glow-success)] [animation:ficsit-pulse_2.4s_var(--ease-standard)_infinite]" />
						<span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
							Synced
						</span>
					</div>
					<GameSwitcher />
				</div>
			</DialogContent>
		</Dialog>
	);
}
