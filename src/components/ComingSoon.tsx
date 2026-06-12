import { Link } from "@tanstack/react-router";
import { type FeatureId, getFeature } from "#/config/features";

interface ComingSoonProps {
	featureId: FeatureId;
	heading?: string;
}

export default function ComingSoon({ featureId, heading }: ComingSoonProps) {
	const feature = getFeature(featureId);
	const Icon = feature.icon;
	return (
		<div className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] p-8">
			<span className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				<Icon aria-hidden className="h-3.5 w-3.5" />
				Coming soon
			</span>
			<h1 className="mt-4 text-2xl font-bold text-[var(--sea-ink)]">
				{heading ?? feature.title}
			</h1>
			<p className="mt-2 text-[var(--sea-ink-soft)]">{feature.description}</p>
			<h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				Planned
			</h2>
			<ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--sea-ink-soft)]">
				{feature.planned.map((line) => (
					<li key={line}>{line}</li>
				))}
			</ul>
			<Link to="/" className="nav-link mt-6 inline-block">
				← Back home
			</Link>
		</div>
	);
}
