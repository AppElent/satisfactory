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
