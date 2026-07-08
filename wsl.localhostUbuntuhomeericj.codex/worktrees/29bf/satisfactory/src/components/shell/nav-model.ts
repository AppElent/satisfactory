import type { IconName } from "#/components/ui/icon";

export interface NavItem {
	id: string;
	label: string;
	icon: IconName;
	/** Global destination (used when not game-scoped). */
	to: string;
	/** When true, resolve to /g/$gameId/<gameScopedPath> if a game is active, else /games. */
	gameScopedPath?: string;
	badge?: "beta" | "soon";
	disabled?: boolean;
}

export interface NavGroup {
	heading: string;
	items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
	{
		heading: "Operations",
		items: [
			{ id: "overview", label: "Overview", icon: "gauge", to: "/" },
			{
				id: "calculator",
				label: "Calculator",
				icon: "calc",
				to: "/calculator",
				badge: "beta",
			},
			{
				id: "factories",
				label: "Factories",
				icon: "factory",
				to: "/factories",
				gameScopedPath: "factories",
			},
			{ id: "data", label: "Game Data", icon: "data", to: "/data" },
		],
	},
	{
		heading: "World",
		items: [
			{
				id: "map",
				label: "World Map",
				icon: "map",
				to: "/map",
				gameScopedPath: "map",
			},
			{
				id: "logistics",
				label: "Logistics",
				icon: "route",
				to: "/logistics",
				gameScopedPath: "logistics",
				badge: "soon",
				disabled: true,
			},
		],
	},
];

/** Resolve an item's href given the active game id (or null). */
export function resolveHref(
	item: NavItem,
	activeGameId: string | null,
): string {
	if (!item.gameScopedPath) return item.to;
	return activeGameId ? `/g/${activeGameId}/${item.gameScopedPath}` : "/games";
}

/**
 * IDs shown directly in the phone bottom nav (see the
 * 2026-07-01 responsive webapp design). Everything else in `NAV_GROUPS`
 * surfaces in the "More" sheet instead.
 */
export const PHONE_PRIMARY_NAV_IDS: readonly string[] = [
	"overview",
	"calculator",
	"data",
	"map",
];

/** All nav items across every group, in `NAV_GROUPS` order. */
export function flattenNavItems(): NavItem[] {
	return NAV_GROUPS.flatMap((group) => group.items);
}

/** The phone bottom nav's 4 items, in `PHONE_PRIMARY_NAV_IDS` order. */
export function phonePrimaryNavItems(): NavItem[] {
	const all = flattenNavItems();
	return PHONE_PRIMARY_NAV_IDS.map((id) => {
		const item = all.find((candidate) => candidate.id === id);
		if (!item) throw new Error(`Unknown phone nav id: ${id}`);
		return item;
	});
}

/** Items not in the phone bottom nav — shown in the "More" sheet instead. */
export function phoneOverflowNavItems(): NavItem[] {
	return flattenNavItems().filter(
		(item) => !PHONE_PRIMARY_NAV_IDS.includes(item.id),
	);
}
