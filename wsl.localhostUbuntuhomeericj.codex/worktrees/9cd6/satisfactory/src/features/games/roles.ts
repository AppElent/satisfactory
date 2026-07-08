export type Role = "owner" | "editor" | "viewer";

const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };

/** True when `actual` is at least as privileged as `min`. */
export function hasRole(actual: Role, min: Role): boolean {
	return RANK[actual] >= RANK[min];
}
