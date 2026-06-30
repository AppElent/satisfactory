import { Link, useParams } from "@tanstack/react-router";
import { Authenticated, useQuery } from "convex/react";
import { api } from "#convex/_generated/api";

function Switcher() {
	const games = useQuery(api.games.listMine);
	const params = useParams({ strict: false }) as { gameId?: string };
	const activeId =
		params.gameId ??
		(typeof localStorage !== "undefined"
			? (localStorage.getItem("activeGameId") ?? undefined)
			: undefined);
	if (!games || games.length === 0) {
		return (
			<Link
				to="/games"
				className="text-sm text-[var(--text-muted)] no-underline hover:text-[var(--text-primary)]"
			>
				Games
			</Link>
		);
	}
	const active = games.find((g) => g._id === activeId) ?? games[0];
	return (
		<select
			aria-label="Active game"
			value={active._id}
			onChange={(e) => {
				localStorage.setItem("activeGameId", e.target.value);
				window.location.href = `/g/${e.target.value}/factories`;
			}}
			className="rounded-md border border-[var(--border-default)] bg-[var(--bg-inset)] px-2 py-1 text-sm"
		>
			{games.map((g) => (
				<option key={g._id} value={g._id}>
					{g.name}
				</option>
			))}
		</select>
	);
}

export default function GameSwitcher() {
	return (
		<Authenticated>
			<Switcher />
		</Authenticated>
	);
}
