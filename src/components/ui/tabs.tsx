import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "#/lib/utils";

export interface TabItem {
	id: string;
	label: string;
}

interface TabsProps {
	items: TabItem[];
	value: string;
	onChange: (id: string) => void;
	className?: string;
}

/** Controlled tab bar (list only). Pages render their own panels via `value`. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
	return (
		<TabsPrimitive.Root
			value={value}
			onValueChange={onChange}
			className={className}
		>
			<TabsPrimitive.List className="flex gap-1 border-b border-[var(--border-subtle)]">
				{items.map((item) => (
					<TabsPrimitive.Trigger
						key={item.id}
						value={item.id}
						className={cn(
							"relative h-[42px] cursor-pointer border-b-2 border-transparent bg-transparent px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text-primary)]",
						)}
					>
						{item.label}
					</TabsPrimitive.Trigger>
				))}
			</TabsPrimitive.List>
		</TabsPrimitive.Root>
	);
}
