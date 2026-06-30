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
			<Link
				to="/data"
				className="w-fit text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] no-underline transition hover:text-[var(--text-secondary)]"
			>
				← All data
			</Link>
			<header className="flex items-center gap-4">
				<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)]">
					<EntityIcon icon={icon} name={name} size={40} />
				</div>
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
						{kicker}
					</p>
					<h1 className="font-[var(--font-display)] text-2xl font-bold uppercase tracking-[0.02em] text-[var(--text-primary)]">
						{name}
					</h1>
				</div>
			</header>
			{description && (
				<p className="max-w-2xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
					{description}
				</p>
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
			<h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
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
					className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--bevel-top),var(--shadow-sm)]"
				>
					<p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
						{stat.label}
					</p>
					<p className="font-[var(--font-mono)] text-[13px] font-semibold text-[var(--text-primary)]">
						{stat.value}
					</p>
				</div>
			))}
		</div>
	);
}
