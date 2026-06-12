import { createFileRoute, Link } from "@tanstack/react-router";
import { FEATURES } from "#/config/features";

export const Route = createFileRoute("/")({
	component: Home,
});

const STATUS_LABEL = {
	live: "Live",
	beta: "Beta",
	planned: "Coming soon",
} as const;

function Home() {
	return (
		<main className="page-wrap px-4 py-10">
			<section className="mx-auto max-w-2xl text-center">
				<h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
					Plan the perfect factory
				</h1>
				<p className="mt-3 text-[var(--sea-ink-soft)]">
					Game data, an optimizing production calculator, factory management,
					the world map and logistics planning — all in one place.
				</p>
				<input
					type="search"
					disabled
					placeholder="Search items, recipes, buildings… (arrives with the data overviews)"
					className="mt-6 w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-5 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
				/>
			</section>

			<section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
				{FEATURES.map((feature) => {
					const Icon = feature.icon;
					return (
						<Link
							key={feature.id}
							to={feature.path}
							className="rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] p-5 no-underline transition hover:border-[var(--chip-line)]"
						>
							<div className="flex items-center justify-between">
								<Icon
									aria-hidden
									className="h-5 w-5 text-[var(--sea-ink-soft)]"
								/>
								<span className="rounded-full border border-[var(--chip-line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
									{STATUS_LABEL[feature.status]}
								</span>
							</div>
							<h2 className="mt-3 text-lg font-semibold text-[var(--sea-ink)]">
								{feature.title}
							</h2>
							<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
								{feature.description}
							</p>
							<ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-[var(--sea-ink-soft)]">
								{feature.planned.slice(0, 3).map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</Link>
					);
				})}
			</section>
		</main>
	);
}
