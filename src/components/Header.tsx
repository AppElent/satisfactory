import { Link } from "@tanstack/react-router";
import { FEATURES } from "#/config/features";
import GameSwitcher from "#/features/games/GameSwitcher";
import ClerkHeader from "../integrations/clerk/header-user.tsx";
import ThemeToggle from "./ThemeToggle";

const GAME_SCOPED: Record<string, string> = {
	factories: "/g/$gameId/factories",
	map: "/g/$gameId/map",
	logistics: "/g/$gameId/logistics",
};

export default function Header() {
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;

	return (
		<header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
			<nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
				<h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
					<Link
						to="/"
						className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
					>
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#f59e0b,#fb923c)]" />
						Satisfactory Planner
					</Link>
				</h2>

				<div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
					{FEATURES.map((feature) => {
						const scopedPath = GAME_SCOPED[feature.id];
						if (scopedPath && activeGameId) {
							return (
								<Link
									key={feature.id}
									to={
										scopedPath as
											| "/g/$gameId/factories"
											| "/g/$gameId/map"
											| "/g/$gameId/logistics"
									}
									params={{ gameId: activeGameId }}
									className="nav-link"
									activeProps={{ className: "nav-link is-active" }}
								>
									{feature.title}
									{feature.status === "planned" && (
										<span className="ml-1 rounded-full border border-[var(--chip-line)] px-1.5 text-[10px] font-medium text-[var(--sea-ink-soft)]">
											soon
										</span>
									)}
								</Link>
							);
						}
						if (scopedPath && !activeGameId) {
							return (
								<Link
									key={feature.id}
									to="/games"
									className="nav-link"
									activeProps={{ className: "nav-link is-active" }}
								>
									{feature.title}
									{feature.status === "planned" && (
										<span className="ml-1 rounded-full border border-[var(--chip-line)] px-1.5 text-[10px] font-medium text-[var(--sea-ink-soft)]">
											soon
										</span>
									)}
								</Link>
							);
						}
						return (
							<Link
								key={feature.id}
								to={feature.path}
								className="nav-link"
								activeProps={{ className: "nav-link is-active" }}
							>
								{feature.title}
								{feature.status === "planned" && (
									<span className="ml-1 rounded-full border border-[var(--chip-line)] px-1.5 text-[10px] font-medium text-[var(--sea-ink-soft)]">
										soon
									</span>
								)}
							</Link>
						);
					})}
				</div>

				<div className="ml-auto flex items-center gap-1.5 sm:gap-2">
					<GameSwitcher />
					<ClerkHeader />
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}
