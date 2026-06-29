import { type VariantProps, cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] cursor-pointer transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        secondary:
          "bg-[var(--bg-inset)] text-[var(--text-muted)] border border-[var(--border-strong)] hover:text-[var(--text-primary)]",
        ghost: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
      },
      size: { sm: "h-[30px] w-[30px]", md: "h-[38px] w-[38px]" },
    },
    defaultVariants: { variant: "ghost", size: "sm" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
