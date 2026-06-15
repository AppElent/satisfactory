import { SignInButton } from "@clerk/clerk-react";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { lazy, Suspense, useState } from "react";
import { getItem } from "#/data";
import { api } from "#convex/_generated/api";
import LinkForm, { type LinkDraft } from "./LinkForm";
import { computeNetwork, suggestSources } from "./logistics";
import SummaryCard from "./SummaryCard";

const NetworkGraph = lazy(() => import("./NetworkGraph"));

function Network() {
	const factories = useQuery(api.factories.list);
	const transports = useQuery(api.transports.list);
	const create = useMutation(api.transports.create);
	const remove = useMutation(api.transports.remove);
	const [prefill, setPrefill] = useState<
		{ fromFactoryId: string; item: string } | undefined
	>(undefined);

	if (factories === undefined || transports === undefined) {
		return <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>;
	}
	if (factories.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
				Create factories first, then link them here.
			</p>
		);
	}

	const onCreate = (draft: LinkDraft) =>
		create({
			fromFactoryId: draft.fromFactoryId as (typeof factories)[number]["_id"],
			toFactoryId: draft.toFactoryId as (typeof factories)[number]["_id"],
			item: draft.item,
			rate: draft.rate,
			mode: draft.mode,
			note: draft.note,
		});

	const net = computeNetwork(factories, transports);
	const suggestions = [...net.byFactory]
		.flatMap(([factoryId, bal]) =>
			bal.needs.map((need) => ({ factoryId, need })),
		)
		.map(({ factoryId, need }) => ({
			factoryId,
			need,
			sources: suggestSources(need.item, factories, transports),
		}))
		.filter((s) => s.sources.length > 0);

	return (
		<div className="grid gap-6 lg:grid-cols-[300px_1fr]">
			<div className="flex flex-col gap-4">
				<LinkForm factories={factories} prefill={prefill} onCreate={onCreate} />
				{suggestions.length > 0 && (
					<div className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
						<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
							Suggested links
						</h2>
						{suggestions.map((s) =>
							s.sources.map((src) => (
								<button
									key={`${s.factoryId}:${s.need.item}:${src.factoryId}`}
									type="button"
									onClick={() =>
										setPrefill({
											fromFactoryId: src.factoryId,
											item: s.need.item,
										})
									}
									className="rounded-lg border border-[var(--line)] px-3 py-2 text-left text-xs text-[var(--sea-ink)] hover:border-[var(--sea-ink)]"
								>
									{getItem(s.need.item)?.name ?? s.need.item}: source from a
									factory with surplus
								</button>
							)),
						)}
					</div>
				)}
				<SummaryCard factories={factories} transports={transports} />
				<div className="flex flex-col gap-2">
					{transports.map((t) => (
						<div
							key={t._id}
							className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
						>
							<span className="flex-1">
								{t.item} · {t.rate}/min · {t.mode}
							</span>
							<button
								type="button"
								onClick={() => remove({ id: t._id })}
								aria-label={`Remove ${t.item} link`}
								className="text-[var(--sea-ink-soft)] hover:text-red-500"
							>
								×
							</button>
						</div>
					))}
				</div>
			</div>
			<Suspense
				fallback={
					<p className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">
						Loading graph…
					</p>
				}
			>
				<NetworkGraph factories={factories} transports={transports} />
			</Suspense>
		</div>
	);
}

export default function LogisticsPage() {
	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Logistics</h1>
			<Unauthenticated>
				<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-8 text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Sign in to connect your factories into a logistics network.
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
				<Network />
			</Authenticated>
		</main>
	);
}
