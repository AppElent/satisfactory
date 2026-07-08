import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "#/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border font-semibold uppercase tracking-[0.08em] leading-none",
	{
		variants: {
			tone: {
				success:
					"bg-[var(--success-soft)] border-[var(--success)]/40 text-[var(--green-400)]",
				warning:
					"bg-[var(--warning-soft)] border-[var(--warning)]/40 text-[var(--yellow-400)]",
				danger:
					"bg-[var(--danger-soft)] border-[var(--danger)]/40 text-[var(--red-400)]",
				info: "bg-[var(--info-soft)] border-[var(--info)]/40 text-[var(--blue-400)]",
				accent:
					"bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--orange-400)]",
				neutral:
					"bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-muted)]",
			},
			size: {
				sm: "h-[18px] px-1.5 text-[9px]",
				md: "h-[22px] px-2 text-[10px]",
			},
		},
		defaultVariants: { tone: "neutral", size: "md" },
	},
);

const DOT_COLOR: Record<string, string> = {
	success: "var(--green-500)",
	warning: "var(--yellow-500)",
	danger: "var(--red-500)",
	info: "var(--blue-500)",
	accent: "var(--accent)",
	neutral: "var(--graphite-400)",
};

export interface BadgeProps
	extends HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {
	dot?: boolean;
}

export function Badge({
	className,
	tone,
	size,
	dot,
	children,
	...props
}: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ tone, size }), className)} {...props}>
			{dot && (
				<span
					data-badge-dot
					className="h-1.5 w-1.5 rounded-full"
					style={{ background: DOT_COLOR[tone ?? "neutral"] }}
				/>
			)}
			{children}
		</span>
	);
}
