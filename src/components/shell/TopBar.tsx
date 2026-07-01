import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/components/ui/icon";
import GameSwitcher from "#/features/games/GameSwitcher";
import ClerkHeader from "#/integrations/clerk/header-user";

interface RouteMeta {
	title: string;
	subtitle: string;
}

const META: Array<{ test: (p: string) => boolean; meta: RouteMeta }> = [
	{
		test: (p) => p === "/",
		meta: { title: "Overview", subtitle: "Live factory network status" },
	},
	{
		test: (p) => p.startsWith("/calculator"),
		meta: {
			title: "Production Calculator",
			subtitle: "LP-optimized production planning",
		},
	},
	{
		test: (p) => p.startsWith("/data"),
		meta: {
			title: "Game Data",
			subtitle: "Items · recipes · buildings · schematics",
		},
	},
	{
		test: (p) => /\/factories/.test(p),
		meta: {
			title: "Factories",
			subtitle: "Manage and inspect production sites",
		},
	},
	{
		test: (p) => /\/map/.test(p),
		meta: {
			title: "World Map",
			subtitle: "Explored regions and resource nodes",
		},
	},
	{
		test: (p) => /\/logistics/.test(p),
		meta: { title: "Logistics", subtitle: "Factory network and transport" },
	},
	{
		test: (p) => p.startsWith("/games") || /^\/g\//.test(p),
		meta: { title: "Games", subtitle: "Your save games and collaborators" },
	},
];

/** Pure: resolve title/subtitle for a pathname. */
export function routeMetaFor(pathname: string): RouteMeta {
	return (
		META.find((m) => m.test(pathname))?.meta ?? {
			title: "FICSIT Planner",
			subtitle: "",
		}
	);
}

export default function TopBar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { title, subtitle } = routeMetaFor(pathname);
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<>
			<header className="relative z-[var(--z-raised)] flex h-[68px] flex-none items-center gap-[18px] border-b border-[var(--border-default)] bg-[var(--graphite-900)] px-4 md:px-[26px]">
				<div className="min-w-0 flex-1 md:flex-none">
					<h1 className="m-0 truncate font-[var(--font-display)] text-[18px] font-bold uppercase leading-none tracking-[0.04em] text-[var(--text-primary)] md:text-[22px]">
						{title}
					</h1>
					{subtitle && (
						<div className="mt-1 hidden truncate text-[12px] tracking-[0.04em] text-[var(--text-muted)] md:block">
							{subtitle}
						</div>
					)}
				</div>

				{/* Desktop search: persistent input, lg+ only */}
				<div className="ml-auto hidden w-[280px] flex-none lg:block">
					<div className="flex h-[38px] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 shadow-[var(--bevel-inset)]">
						<Icon
							name="search"
							size={16}
							className="flex-none text-[var(--text-muted)]"
						/>
						<input
							placeholder="Search items, recipes, buildings…"
							className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						/>
					</div>
				</div>

				{/* Collapsed search below lg: icon button, expands to an overlay input on tap */}
				<div className="flex-none lg:hidden">
					<button
						type="button"
						aria-label="Search"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => setSearchOpen((open) => !open)}
						className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
					>
						<Icon name="search" size={18} />
					</button>
				</div>

				{/* Synced status: hidden on phone, dot-only on tablet, dot+label on desktop */}
				<div className="hidden flex-none items-center gap-2 border-l border-[var(--border-subtle)] pl-3 md:flex">
					<span className="h-2 w-2 rounded-full bg-[var(--green-500)] shadow-[var(--glow-success)] [animation:ficsit-pulse_2.4s_var(--ease-standard)_infinite]" />
					<span className="hidden text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] lg:inline">
						Synced
					</span>
				</div>

				{/* GameSwitcher: hidden on phone (lives in the More sheet instead) */}
				<div className="hidden flex-none md:block">
					<GameSwitcher />
				</div>

				<div className="flex flex-none items-center gap-1.5">
					<ClerkHeader />
				</div>
			</header>

			{searchOpen && (
				<div className="fixed inset-x-0 top-[68px] z-[var(--z-raised)] border-b border-[var(--border-default)] bg-[var(--graphite-900)] p-3 lg:hidden">
					<div className="flex h-[42px] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 shadow-[var(--bevel-inset)]">
						<Icon
							name="search"
							size={16}
							className="flex-none text-[var(--text-muted)]"
						/>
						<input
							// biome-ignore lint/a11y/noAutofocus: opened by an explicit user tap on the search icon, not on page load
							autoFocus
							placeholder="Search items, recipes, buildings…"
							onBlur={() => setSearchOpen(false)}
							className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						/>
					</div>
				</div>
			)}
		</>
	);
}
