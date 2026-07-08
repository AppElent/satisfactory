import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-semibold tracking-[0.06em] uppercase cursor-pointer select-none transition-[filter,background-color,border-color] duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--bevel-top),var(--shadow-sm)] hover:brightness-110 active:bg-[var(--accent-press)]",
				secondary:
					"bg-[var(--bg-inset)] text-[var(--text-secondary)] border border-[var(--border-strong)] shadow-[var(--bevel-inset)] hover:bg-[var(--surface-active)]",
				ghost:
					"bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
			},
			size: {
				sm: "h-[var(--control-h-sm)] px-3 text-[12px]",
				md: "h-[var(--control-h-md)] px-4 text-[13px]",
				lg: "h-[var(--control-h-lg)] px-5 text-[14px]",
			},
			fullWidth: { true: "w-full", false: "" },
		},
		defaultVariants: { variant: "primary", size: "md", fullWidth: false },
	},
);

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				ref={ref}
				data-variant={variant ?? "primary"}
				className={cn(buttonVariants({ variant, size, fullWidth }), className)}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { buttonVariants };
