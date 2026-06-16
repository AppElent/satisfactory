import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { useGameId } from "./useGameId";

export default function GameSettings() {
	const gameId = useGameId();
	const game = useQuery(api.games.get, { gameId });
	const members = useQuery(api.games.members, { gameId });
	const invites = useQuery(api.games.listInvites, { gameId });
	const createInvite = useMutation(api.games.createInvite);
	const revokeInvite = useMutation(api.games.revokeInvite);
	const removeMember = useMutation(api.games.removeMember);
	const [role, setRole] = useState<"editor" | "viewer">("editor");

	if (!game)
		return <main className="page-wrap px-4 py-8 text-sm">Loading…</main>;
	const isOwner = game.role === "owner";

	const invite = async () => {
		const token = await createInvite({ gameId, role });
		await navigator.clipboard
			.writeText(`${window.location.origin}/invite/${token}`)
			.catch(() => {});
	};

	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
				{game.name} — settings
			</h1>

			<section className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
					Members
				</h2>
				{members?.map((m) => (
					<div key={m._id} className="flex items-center gap-3 text-sm">
						<span className="flex-1">{m.userId}</span>
						<span className="capitalize text-[var(--sea-ink-soft)]">
							{m.role}
						</span>
						{isOwner && m.role !== "owner" && (
							<button
								type="button"
								onClick={() => removeMember({ gameId, userId: m.userId })}
								className="text-[var(--sea-ink-soft)] hover:text-red-500"
							>
								Remove
							</button>
						)}
					</div>
				))}
			</section>

			{isOwner && (
				<section className="flex flex-col gap-2">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
						Invite link
					</h2>
					<div className="flex gap-2">
						<select
							aria-label="Invite role"
							value={role}
							onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
							className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-sm capitalize"
						>
							<option value="editor">editor</option>
							<option value="viewer">viewer</option>
						</select>
						<button
							type="button"
							onClick={invite}
							className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)]"
						>
							Create + copy link
						</button>
					</div>
					{invites?.map((inv) => (
						<div key={inv._id} className="flex items-center gap-3 text-xs">
							<span className="flex-1 truncate">
								{window.location.origin}/invite/{inv.token} ({inv.role})
							</span>
							<button
								type="button"
								onClick={() =>
									revokeInvite({ inviteId: inv._id as Id<"gameInvites"> })
								}
								className="text-[var(--sea-ink-soft)] hover:text-red-500"
							>
								Revoke
							</button>
						</div>
					))}
				</section>
			)}
		</main>
	);
}
