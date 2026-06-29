import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Input = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
	<input
		ref={ref}
		type={type}
		className={cn(
			"h-[var(--control-h-md)] w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 text-[13px] text-[var(--text-primary)] shadow-[var(--bevel-inset)] outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[var(--border-accent)] focus-visible:shadow-[var(--glow-accent)]",
			className,
		)}
		{...props}
	/>
));
Input.displayName = "Input";
