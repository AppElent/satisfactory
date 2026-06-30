import { SignInButton } from "@clerk/clerk-react";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { lazy, Suspense, useState } from "react";
import { useToast } from "#/components/Toast";
import { getItem } from "#/data";
import { useGameId } from "#/features/games/useGameId";
import { formatNumber } from "#/lib/format";
import { api } from "#convex/_generated/api";
import LinkForm, { type LinkDraft } from "./LinkForm";
import { computeNetwork, suggestSources } from "./logistics";
import SummaryCard from "./SummaryCard";
import { beltFor, pipeFor } from "./throughput";

const NetworkGraph = lazy(() => import("./NetworkGraph"));

/** Derived belt/pipe sizing, or the free-text note for other modes. */
function linkSettings(
	mode: LinkDraft["mode"],
	rate: number,
	note?: string,
): string {
	if (mode === "belt") {
		const { tier, count } = beltFor(rate);
		return `Mk${tier} ×${count} belt`;
	}
	if (mode === "pipe") {
		const { tier, count } = pipeFor(rate);
		return `Mk${tier} ×${count} pipe`;
	}
	return note ? `${mode} · ${note}` : mode;
}

function Network() {
	const gameId = useGameId();
	const factories = useQuery(api.factories.list, gameId ? { gameId } : "skip");
	const transports = useQuery(
		api.transports.list,
		gameId ? { gameId } : "skip",
	);
	const create = useMutation(api.transports.create);
	const remove = useMutation(api.transports.remove);
	const { toast } = useToast();
	const [prefill, setPrefill] = useState<
		{ fromFactoryId: string; item: string } | undefined
	>(undefined);

	if (factories === undefined || transports === undefined) {
		return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;
	}
	if (factories.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-[var(--border-default)] p-8 text-center text-sm text-[var(--text-muted)]">
				Create factories first, then link them here.
			</p>
		);
	}

	const onCreate = (draft: LinkDraft) =>
		create({
			gameId,
			fromFactoryId: draft.fromFactoryId as (typeof factories)[number]["_id"],
			toFactoryId: draft.toFactoryId as (typeof factories)[number]["_id"],
			item: draft.item,
			rate: draft.rate,
			mode: draft.mode,
			note: draft.note,
		}).catch(() => toast("Couldn't create the link."));

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
					<div className="flex flex-col gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-inset)] p-4">
						<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
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
									className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:border-[var(--text-primary)]"
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
							className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
						>
							<span className="flex-1">
								{getItem(t.item)?.name ?? t.item} · {formatNumber(t.rate)}/min ·{" "}
								{linkSettings(t.mode, t.rate, t.note)}
							</span>
							<button
								type="button"
								onClick={() =>
									remove({ id: t._id }).catch(() =>
										toast("Couldn't remove the link."),
									)
								}
								aria-label={`Remove ${getItem(t.item)?.name ?? t.item} link`}
								className="text-[var(--text-muted)] hover:text-red-500"
							>
								×
							</button>
						</div>
					))}
				</div>
			</div>
			<Suspense
				fallback={
					<p className="p-8 text-center text-sm text-[var(--text-muted)]">
						Loading graph…
					</p>
				}
			>
				<NetworkGraph
					factories={factories}
					transports={transports}
					gameId={gameId}
				/>
			</Suspense>
		</div>
	);
}

export default function LogisticsPage() {
	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--text-primary)]">Logistics</h1>
			<Unauthenticated>
				<div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-inset)] p-8 text-center">
					<p className="text-sm text-[var(--text-muted)]">
						Sign in to connect your factories into a logistics network.
					</p>
					<div className="mt-4">
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-lg bg-[var(--orange-500)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)]"
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
