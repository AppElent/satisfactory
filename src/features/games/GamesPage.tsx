import { SignInButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";

function GamesList() {
	const games = useQuery(api.games.listMine);
	const create = useMutation(api.games.create);
	const navigate = useNavigate();
	const [name, setName] = useState("");

	const newGame = async () => {
		if (!name.trim()) return;
		const gameId = await create({ name: name.trim() });
		localStorage.setItem("activeGameId", gameId);
		navigate({ to: "/g/$gameId/factories", params: { gameId } });
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Your games</h1>
			</div>
			<div className="flex gap-2">
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="New game name"
					aria-label="New game name"
					className="flex-1 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
				/>
				<button
					type="button"
					onClick={newGame}
					disabled={!name.trim()}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					Create game
				</button>
			</div>
			{games === undefined ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
			) : games.length === 0 ? (
				<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
					No games yet. Create one to start planning.
				</p>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{games.map((g) => (
						<Link
							key={g._id}
							to="/g/$gameId/factories"
							params={{ gameId: g._id }}
							onClick={() => localStorage.setItem("activeGameId", g._id)}
							className="flex flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 hover:border-[var(--sea-ink)]"
						>
							<span className="font-semibold text-[var(--sea-ink)]">{g.name}</span>
							<span className="text-xs capitalize text-[var(--sea-ink-soft)]">
								{g.role}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default function GamesPage() {
	return (
		<main className="page-wrap px-4 py-8">
			<Unauthenticated>
				<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-8 text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Sign in to create and manage games.
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
				</div>
			</Unauthenticated>
			<Authenticated>
				<GamesList />
			</Authenticated>
		</main>
	);
}
