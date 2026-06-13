import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import EntityIcon from "#/components/EntityIcon";

interface DetailLayoutProps {
	icon?: string;
	name: string;
	kicker: string;
	description?: string;
	children: ReactNode;
}

export default function DetailLayout({
	icon,
	name,
	kicker,
	description,
	children,
}: DetailLayoutProps) {
	return (
		<article className="flex flex-col gap-6">
			<Link to="/data" className="nav-link w-fit text-sm">
				← All data
			</Link>
			<header className="flex items-center gap-4">
				<EntityIcon icon={icon} name={name} size={56} />
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
						{kicker}
					</p>
					<h1 className="text-2xl font-bold text-[var(--sea-ink)]">{name}</h1>
				</div>
			</header>
			{description && (
				<p className="max-w-2xl text-[var(--sea-ink-soft)]">{description}</p>
			)}
			{children}
		</article>
	);
}

export function DetailSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				{title}
			</h2>
			{children}
		</section>
	);
}

export function StatGrid({
	stats,
}: {
	stats: { label: string; value: string }[];
}) {
	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2"
				>
					<p className="text-[10px] uppercase text-[var(--sea-ink-soft)]">
						{stat.label}
					</p>
					<p className="text-sm font-semibold text-[var(--sea-ink)]">
						{stat.value}
					</p>
				</div>
			))}
		</div>
	);
}
