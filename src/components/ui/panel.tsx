import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "#/lib/utils";

interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	title?: ReactNode;
	/** Right-side content in the header strip (buttons, counts). */
	headerAction?: ReactNode;
	/** 2px orange rail across the top edge. */
	topRail?: boolean;
	/** Hazard caution stripe across the top edge. */
	hazard?: boolean;
	children?: ReactNode;
}

export function Panel({
	title,
	headerAction,
	topRail,
	hazard,
	className,
	children,
	...props
}: PanelProps) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--bevel-top),var(--shadow-md)]",
				className,
			)}
			{...props}
		>
			{topRail && (
				<span
					data-top-rail
					className="absolute inset-x-0 top-0 h-0.5 bg-[var(--accent)]"
				/>
			)}
			{hazard && (
				<span
					data-hazard
					className="absolute inset-x-0 top-0 h-1.5 opacity-50"
					style={{ backgroundImage: "var(--tex-hazard)" }}
				/>
			)}
			{title && (
				<header className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-black/[0.18] px-5 py-3">
					<h3 className="m-0 font-[var(--font-display)] text-[16px] font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
						{title}
					</h3>
					{headerAction}
				</header>
			)}
			{children}
		</div>
	);
}
