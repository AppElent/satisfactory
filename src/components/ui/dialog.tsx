import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ComponentRef } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

type DialogContentProps = ComponentPropsWithoutRef<
	typeof DialogPrimitive.Content
> & {
	/** "center" (default, existing modal look) or "bottom" (slide-up sheet, used by the phone nav's More menu). */
	position?: "center" | "bottom";
};

export const DialogContent = forwardRef<
	ComponentRef<typeof DialogPrimitive.Content>,
	DialogContentProps
>(({ className, children, position = "center", ...props }, ref) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				"fixed z-[var(--z-modal)] overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--bevel-top),var(--shadow-xl)] focus:outline-none",
				position === "center"
					? "left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
					: "inset-x-0 bottom-0 w-full rounded-t-[var(--radius-lg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
				className,
			)}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
