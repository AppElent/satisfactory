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
			<p className="py-12 text-center text-sm text-[var(--text-muted)]">
				{emptyMessage}
			</p>
		);
	}
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-[14px]">
			{items.map((item) => (
				<Link
					key={item.slug}
					to={item.to}
					params={item.params}
					className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 text-center shadow-[var(--bevel-top),var(--shadow-md)] no-underline transition hover:border-[var(--border-strong)]"
				>
					{item.content}
				</Link>
			))}
		</div>
	);
}
