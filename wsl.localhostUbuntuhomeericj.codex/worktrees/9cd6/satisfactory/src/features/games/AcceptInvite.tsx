import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { api } from "#convex/_generated/api";

function Accept() {
	const { token } = useParams({ from: "/invite/$token" });
	const info = useQuery(api.games.inviteInfo, { token });
	const accept = useMutation(api.games.acceptInvite);
	const navigate = useNavigate();

	if (info === undefined) return <p className="text-sm">Loading…</p>;
	if (info === null)
		return (
			<p className="text-sm text-[var(--text-muted)]">
				This invite is no longer valid.{" "}
				<Link to="/games" className="underline">
					Your games
				</Link>
			</p>
		);

	const join = async () => {
		const gameId = await accept({ token });
		localStorage.setItem("activeGameId", gameId);
		navigate({ to: "/g/$gameId/factories", params: { gameId } });
	};

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<p className="text-sm text-[var(--text-primary)]">
				You've been invited to <strong>{info.gameName}</strong> as {info.role}.
			</p>
			<button
				type="button"
				onClick={join}
				className="rounded-lg bg-[var(--orange-500)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)]"
			>
				Join game
			</button>
		</div>
	);
}

export default function AcceptInvite() {
	return (
		<main className="page-wrap px-4 py-12">
			<Unauthenticated>
				<div className="text-center">
					<p className="text-sm text-[var(--text-muted)]">
						Sign in to accept this invite.
					</p>
					<div className="mt-4">
						<Link
							to="/sign-in"
							className="rounded-lg bg-[var(--orange-500)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)]"
						>
							Sign in
						</Link>
					</div>
				</div>
			</Unauthenticated>
			<Authenticated>
				<Accept />
			</Authenticated>
		</main>
	);
}
