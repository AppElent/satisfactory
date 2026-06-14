import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface EntityCardGridItem {
	slug: string;
	to: string;
	params: Record<string, string>;
	content: ReactNode;
}

interface EntityCardGridProps {
	items: EntityCardGridItem[];
	emptyMessage?: string;
}

export default function EntityCardGrid({
	items,
	emptyMessage = "Nothing matches your filters.",
}: EntityCardGridProps) {
	if (items.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				{emptyMessage}
			</p>
		);
	}
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
			{items.map((item) => (
				<Link
					key={item.slug}
					to={item.to}
					params={item.params}
					className="flex flex-col items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 text-center no-underline transition hover:border-[var(--chip-line)]"
				>
					{item.content}
				</Link>
			))}
		</div>
	);
}
