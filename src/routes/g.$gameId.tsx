import { SignInButton } from "@clerk/clerk-react";
import {
	createFileRoute,
	Link,
	Outlet,
	useParams,
} from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";

export const Route = createFileRoute("/g/$gameId")({
	component: GameLayout,
});

function GameGuard() {
	const { gameId } = useParams({ from: "/g/$gameId" });
	const game = useQuery(
		api.games.get,
		gameId ? { gameId: gameId as Id<"games"> } : "skip",
	);

	if (game === undefined) {
		return <main className="page-wrap px-4 py-10 text-sm">Loading…</main>;
	}
	if (game === null) {
		return (
			<main className="page-wrap px-4 py-10">
				<p className="text-sm text-[var(--sea-ink-soft)]">
					You don't have access to this game.{" "}
					<Link to="/games" className="underline">
						Your games
					</Link>
				</p>
			</main>
		);
	}
	return <Outlet />;
}

function GameLayout() {
	return (
		<>
			<Unauthenticated>
				<main className="page-wrap px-4 py-10 text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Sign in to open this game.
					</p>
					<div className="mt-4">
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]"
							>
								Sign in
							</button>
						</SignInButton>
					</div>
				</main>
			</Unauthenticated>
			<Authenticated>
				<GameGuard />
			</Authenticated>
		</>
	);
}
