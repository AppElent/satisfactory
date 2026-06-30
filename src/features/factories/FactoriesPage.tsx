import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { useGameId } from "#/features/games/useGameId";
import SummaryCard from "#/features/logistics/SummaryCard";
import { api } from "#convex/_generated/api";
import FactoryCard from "./FactoryCard";
import ManualFactoryForm from "./ManualFactoryForm";
import SignInPrompt from "./SignInPrompt";

function FactoriesList() {
	const gameId = useGameId();
	const factories = useQuery(api.factories.list, gameId ? { gameId } : "skip");
	const transports = useQuery(
		api.transports.list,
		gameId ? { gameId } : "skip",
	);
	const [creating, setCreating] = useState(false);

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon name="factory" size={15} className="text-[var(--orange-400)]" />
					<span className="text-[12px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
						{factories !== undefined ? `${factories.length} site${factories.length !== 1 ? "s" : ""}` : "…"}
					</span>
				</div>
				<Button onClick={() => setCreating(true)}>New Factory</Button>
			</div>
			{factories && factories.length > 0 && transports && (
				<SummaryCard factories={factories} transports={transports} />
			)}
			{creating && (
				<ManualFactoryForm gameId={gameId} onClose={() => setCreating(false)} />
			)}
			{factories === undefined ? (
				<p className="text-sm text-[var(--text-muted)]">Loading…</p>
			) : factories.length === 0 ? (
				<p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] p-8 text-center text-sm text-[var(--text-muted)]">
					No factories yet. Create one here or from a calculator plan.
				</p>
			) : (
				<div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
					{factories.map((f) => (
						<FactoryCard key={f._id} factory={f} gameId={gameId} />
					))}
				</div>
			)}
		</div>
	);
}

export default function FactoriesPage() {
	return (
		<main className="mx-auto max-w-[1280px] px-7 pb-[60px] pt-6 flex flex-col gap-5">
			<AuthLoading>
				<p className="text-sm text-[var(--text-muted)]">Loading…</p>
			</AuthLoading>
			<Unauthenticated>
				<SignInPrompt />
			</Unauthenticated>
			<Authenticated>
				<FactoriesList />
			</Authenticated>
		</main>
	);
}
