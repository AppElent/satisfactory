import type { ReactNode } from "react";
import { useState } from "react";
import { useMediaQuery } from "#/lib/use-media-query";
import { cn } from "#/lib/utils";
import { Tabs } from "./tabs";

/** True at `lg` (1024px) and above — matches this app's existing `lg:` grid breakpoints. */
export function useIsDesktopDualPane(): boolean {
	return useMediaQuery("(min-width: 1024px)");
}

interface DualPaneLayoutProps {
	leftLabel: string;
	left: ReactNode;
	rightLabel: string;
	right: ReactNode;
	/** Tailwind grid classes applied once side-by-side desktop layout kicks in, e.g. "grid-cols-[332px_1fr] gap-6 items-start". */
	gridClassName: string;
	/** Which pane is active by default below the desktop breakpoint. Defaults to "left". */
	defaultTab?: "left" | "right";
	className?: string;
}

/**
 * Two-pane page layout: side-by-side grid at `lg` and above, a Tabs-driven
 * single active pane below it. Used by Calculator, Map, and Logistics.
 */
export function DualPaneLayout({
	leftLabel,
	left,
	rightLabel,
	right,
	gridClassName,
	defaultTab = "left",
	className,
}: DualPaneLayoutProps) {
	const isDesktop = useIsDesktopDualPane();

	if (isDesktop) {
		return (
			<div className={cn("grid", gridClassName, className)}>
				{left}
				{right}
			</div>
		);
	}

	return (
		<TabbedPane
			leftLabel={leftLabel}
			left={left}
			rightLabel={rightLabel}
			right={right}
			defaultTab={defaultTab}
			className={className}
		/>
	);
}

function TabbedPane({
	leftLabel,
	left,
	rightLabel,
	right,
	defaultTab,
	className,
}: Omit<DualPaneLayoutProps, "gridClassName"> & {
	defaultTab: "left" | "right";
}) {
	const [tab, setTab] = useState<"left" | "right">(defaultTab);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<Tabs
				items={[
					{ id: "left", label: leftLabel },
					{ id: "right", label: rightLabel },
				]}
				value={tab}
				onChange={(id) => setTab(id as "left" | "right")}
			/>
			{tab === "left" ? left : right}
		</div>
	);
}
