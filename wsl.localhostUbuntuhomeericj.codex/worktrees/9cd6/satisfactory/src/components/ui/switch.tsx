import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentPropsWithoutRef, ComponentRef } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Switch = forwardRef<
	ComponentRef<typeof SwitchPrimitive.Root>,
	ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SwitchPrimitive.Root
		ref={ref}
		className={cn(
			"peer inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] data-[state=checked]:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		{...props}
	>
		<SwitchPrimitive.Thumb className="pointer-events-none block h-[16px] w-[16px] translate-x-[3px] rounded-[var(--radius-pill)] bg-[var(--graphite-100)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] data-[state=checked]:translate-x-[23px] data-[state=checked]:bg-[var(--text-on-accent)]" />
	</SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
