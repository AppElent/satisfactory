import type { Doc } from "#convex/_generated/dataModel";

type Status = Doc<"factories">["status"];
type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";
type ProgressTone = "success" | "warning" | "danger";

/** Efficiency % → Progress/text tone (design: >=95 green, >=80 yellow, else red). */
export function effProgressTone(pct: number): ProgressTone {
	if (pct >= 95) return "success";
	if (pct >= 80) return "warning";
	return "danger";
}

/** Efficiency % → readout color token. */
export function effColor(pct: number): string {
	if (pct >= 95) return "var(--green-400)";
	if (pct >= 80) return "var(--yellow-400)";
	return "var(--red-400)";
}

const STATUS_TONE: Record<Status, BadgeTone> = {
	operational: "success",
	building: "warning",
	paused: "neutral",
	planned: "info",
};

export function statusBadgeTone(status: Status): BadgeTone {
	return STATUS_TONE[status];
}

export const STATUS_LABEL: Record<Status, string> = {
	operational: "Operational",
	building: "Building",
	paused: "Paused",
	planned: "Planned",
};
