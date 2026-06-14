import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";
import FactoryCard from "./FactoryCard";
import ManualFactoryForm from "./ManualFactoryForm";
import SignInPrompt from "./SignInPrompt";

function FactoriesList() {
	const factories = useQuery(api.factories.list);
	const [creating, setCreating] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Factories</h1>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)]"
				>
					New factory
				</button>
			</div>
			{creating && <ManualFactoryForm onClose={() => setCreating(false)} />}
			{factories === undefined ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
			) : factories.length === 0 ? (
				<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
					No factories yet. Create one here or from a calculator plan.
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{factories.map((f) => (
						<FactoryCard key={f._id} factory={f} />
					))}
				</div>
			)}
		</div>
	);
}

export default function FactoriesPage() {
	return (
		<main className="page-wrap px-4 py-8">
			<AuthLoading>
				<p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
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
