# Phase 7 — Games & Collaboration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a `game` the tenant that owns factories/transports, with owner/editor/viewer membership and invite-link sharing, scoped in the URL under `/g/$gameId/…`, so multiple users collaborate in real time on a shared game.

**Architecture:** Add `games`/`gameMembers`/`gameInvites` Convex tables and a `requireMember(gameId, minRole)` access helper that replaces per-user ownership. Land the Convex layer additively (factories/transports keep working), migrate existing data into a default game, then cut factories/transports over to `gameId` and move their routes under a membership-guarded `/g/$gameId` layout. Convex live queries give real-time collaboration for free.

**Tech Stack:** Convex (multi-tenant data + auth), Clerk, TanStack Start/Router (file routes + layout route), React 19, Vitest, Biome.

**Spec:** [docs/superpowers/specs/2026-06-16-phase7-games-collaboration-design.md](../specs/2026-06-16-phase7-games-collaboration-design.md)

**Conventions:** Biome TABS + double quotes (`npx biome check --write <files>` before commits). Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Pure logic is TDD; Convex/UI verified via typecheck + build + manual notes. Group gate: `npx biome check . && npm run typecheck && npm test && npm run build`. `npx convex dev --once` deploys (works in this environment).

**Sequencing note (read first):** Groups A–B are designed so the app stays working at every group boundary. Group A is purely additive (new tables + games functions + migration); factories/transports are untouched and the old `/factories` UI keeps working. Group B is the atomic cutover (rewrite factories/transports to `gameId`, move their routes under `/g/$gameId`, thread `gameId` through components, tighten the schema) — it must land as a unit. Group C adds game-management UX.

---

## Group A — Convex foundation (additive, non-breaking)

### Task 1: Role-rank logic (TDD)

**Files:**
- Create: `src/features/games/roles.ts`
- Test: `src/features/games/roles.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/games/roles.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { type Role, hasRole } from "./roles";

describe("hasRole", () => {
	it("grants when the actual role outranks or equals the minimum", () => {
		expect(hasRole("owner", "viewer")).toBe(true);
		expect(hasRole("editor", "editor")).toBe(true);
		expect(hasRole("viewer", "viewer")).toBe(true);
	});

	it("denies when the actual role is below the minimum", () => {
		expect(hasRole("viewer", "editor")).toBe(false);
		expect(hasRole("editor", "owner")).toBe(false);
	});

	it("ranks owner > editor > viewer", () => {
		const order: Role[] = ["viewer", "editor", "owner"];
		expect(order.every((r, i) => i === 0 || hasRole(r, order[i - 1]))).toBe(true);
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/games/roles.test.ts`
Expected: FAIL ("Cannot find module './roles'").

- [ ] **Step 3: Implement**

`src/features/games/roles.ts`:

```ts
export type Role = "owner" | "editor" | "viewer";

const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };

/** True when `actual` is at least as privileged as `min`. */
export function hasRole(actual: Role, min: Role): boolean {
	return RANK[actual] >= RANK[min];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/games/roles.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/games/roles.ts src/features/games/roles.test.ts
git commit -m "feat: game role-rank helper"
```

### Task 2: Schema — add game tables (additive)

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add the new tables and make factories/transports tenancy fields optional**

Full new `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const itemRate = v.object({ item: v.string(), rate: v.number() });

const production = v.union(
	v.object({ source: v.literal("plan"), plan: v.string() }),
	v.object({
		source: v.literal("manual"),
		inputs: v.array(itemRate),
		outputs: v.array(itemRate),
		machines: v.array(
			v.object({
				building: v.string(),
				count: v.number(),
				clock: v.optional(v.number()),
			}),
		),
	}),
);

const role = v.union(
	v.literal("owner"),
	v.literal("editor"),
	v.literal("viewer"),
);

export default defineSchema({
	games: defineTable({
		ownerId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}),

	gameMembers: defineTable({
		gameId: v.id("games"),
		userId: v.string(),
		role,
		createdAt: v.number(),
	})
		.index("by_game", ["gameId"])
		.index("by_user", ["userId"])
		.index("by_game_user", ["gameId", "userId"]),

	gameInvites: defineTable({
		gameId: v.id("games"),
		token: v.string(),
		role: v.union(v.literal("editor"), v.literal("viewer")),
		createdBy: v.string(),
		createdAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_game", ["gameId"]),

	factories: defineTable({
		// userId is being migrated to gameId; both optional during the transition.
		userId: v.optional(v.string()),
		gameId: v.optional(v.id("games")),
		createdBy: v.optional(v.string()),
		name: v.string(),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.union(
			v.literal("planned"),
			v.literal("building"),
			v.literal("operational"),
			v.literal("paused"),
		),
		location: v.optional(v.object({ x: v.number(), y: v.number() })),
		production,
		actuals: v.optional(v.array(itemRate)),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_game", ["gameId"]),

	transports: defineTable({
		userId: v.optional(v.string()),
		gameId: v.optional(v.id("games")),
		createdBy: v.optional(v.string()),
		fromFactoryId: v.id("factories"),
		toFactoryId: v.id("factories"),
		item: v.string(),
		rate: v.number(),
		mode: v.union(
			v.literal("belt"),
			v.literal("pipe"),
			v.literal("truck"),
			v.literal("train"),
			v.literal("drone"),
		),
		note: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_game", ["gameId"]),
});
```

- [ ] **Step 2: Deploy**

Run: `npx convex dev --once`
Expected: deploys cleanly (existing rows have `userId`; new optional fields validate). `npm run typecheck` exit 0 (existing factories.ts still uses `userId`, which is still present as optional).

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat: add games/gameMembers/gameInvites tables; tenancy fields optional"
```

### Task 3: Games CRUD, members, invites + access helper

**Files:**
- Create: `convex/games.ts`

- [ ] **Step 1: Create the module**

`convex/games.ts`:

```ts
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const RANK = { viewer: 0, editor: 1, owner: 2 } as const;
type Role = keyof typeof RANK;

const inviteRole = v.union(v.literal("editor"), v.literal("viewer"));

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity.subject;
}

/** Assert the caller is a member of `gameId` with at least `minRole`. */
export async function requireMember(
	ctx: QueryCtx | MutationCtx,
	gameId: Id<"games">,
	minRole: Role,
): Promise<{ userId: string; role: Role }> {
	const userId = await requireUser(ctx);
	const membership = await ctx.db
		.query("gameMembers")
		.withIndex("by_game_user", (q) =>
			q.eq("gameId", gameId).eq("userId", userId),
		)
		.unique();
	if (!membership || RANK[membership.role] < RANK[minRole]) {
		throw new Error("No access to this game");
	}
	return { userId, role: membership.role };
}

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUser(ctx);
		const memberships = await ctx.db
			.query("gameMembers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const games = await Promise.all(
			memberships.map(async (m) => {
				const game = await ctx.db.get(m.gameId);
				return game ? { ...game, role: m.role } : null;
			}),
		);
		return games.filter((g): g is NonNullable<typeof g> => g !== null);
	},
});

export const get = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, { gameId }) => {
		const { role } = await requireMember(ctx, gameId, "viewer");
		const game = await ctx.db.get(gameId);
		return game ? { ...game, role } : null;
	},
});

export const create = mutation({
	args: { name: v.string(), description: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const now = Date.now();
		const gameId = await ctx.db.insert("games", {
			ownerId: userId,
			name: args.name,
			description: args.description,
			createdAt: now,
			updatedAt: now,
		});
		await ctx.db.insert("gameMembers", {
			gameId,
			userId,
			role: "owner",
			createdAt: now,
		});
		return gameId;
	},
});

export const rename = mutation({
	args: {
		gameId: v.id("games"),
		name: v.string(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, { gameId, name, description }) => {
		await requireMember(ctx, gameId, "owner");
		await ctx.db.patch(gameId, { name, description, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { gameId: v.id("games") },
	handler: async (ctx, { gameId }) => {
		await requireMember(ctx, gameId, "owner");
		for (const table of ["factories", "transports"] as const) {
			const rows = await ctx.db
				.query(table)
				.withIndex("by_game", (q) => q.eq("gameId", gameId))
				.collect();
			for (const row of rows) await ctx.db.delete(row._id);
		}
		for (const m of await ctx.db
			.query("gameMembers")
			.withIndex("by_game", (q) => q.eq("gameId", gameId))
			.collect())
			await ctx.db.delete(m._id);
		for (const inv of await ctx.db
			.query("gameInvites")
			.withIndex("by_game", (q) => q.eq("gameId", gameId))
			.collect())
			await ctx.db.delete(inv._id);
		await ctx.db.delete(gameId);
	},
});

export const members = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, { gameId }) => {
		await requireMember(ctx, gameId, "viewer");
		return await ctx.db
			.query("gameMembers")
			.withIndex("by_game", (q) => q.eq("gameId", gameId))
			.collect();
	},
});

export const setRole = mutation({
	args: {
		gameId: v.id("games"),
		userId: v.string(),
		role: v.union(v.literal("editor"), v.literal("viewer")),
	},
	handler: async (ctx, { gameId, userId, role }) => {
		await requireMember(ctx, gameId, "owner");
		const m = await ctx.db
			.query("gameMembers")
			.withIndex("by_game_user", (q) =>
				q.eq("gameId", gameId).eq("userId", userId),
			)
			.unique();
		if (!m || m.role === "owner") throw new Error("Cannot change this member");
		await ctx.db.patch(m._id, { role });
	},
});

export const removeMember = mutation({
	args: { gameId: v.id("games"), userId: v.string() },
	handler: async (ctx, { gameId, userId }) => {
		await requireMember(ctx, gameId, "owner");
		const m = await ctx.db
			.query("gameMembers")
			.withIndex("by_game_user", (q) =>
				q.eq("gameId", gameId).eq("userId", userId),
			)
			.unique();
		if (!m || m.role === "owner") throw new Error("Cannot remove this member");
		await ctx.db.delete(m._id);
	},
});

function makeToken(): string {
	return Array.from(crypto.getRandomValues(new Uint8Array(18)))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export const createInvite = mutation({
	args: { gameId: v.id("games"), role: inviteRole },
	handler: async (ctx, { gameId, role }) => {
		const { userId } = await requireMember(ctx, gameId, "owner");
		const token = makeToken();
		await ctx.db.insert("gameInvites", {
			gameId,
			token,
			role,
			createdBy: userId,
			createdAt: Date.now(),
		});
		return token;
	},
});

export const listInvites = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, { gameId }) => {
		await requireMember(ctx, gameId, "owner");
		return await ctx.db
			.query("gameInvites")
			.withIndex("by_game", (q) => q.eq("gameId", gameId))
			.collect();
	},
});

export const revokeInvite = mutation({
	args: { inviteId: v.id("gameInvites") },
	handler: async (ctx, { inviteId }) => {
		const invite = await ctx.db.get(inviteId);
		if (!invite) return;
		await requireMember(ctx, invite.gameId, "owner");
		await ctx.db.delete(inviteId);
	},
});

/** Preview an invite (no auth) so the accept screen can show the game name. */
export const inviteInfo = query({
	args: { token: v.string() },
	handler: async (ctx, { token }) => {
		const invite = await ctx.db
			.query("gameInvites")
			.withIndex("by_token", (q) => q.eq("token", token))
			.unique();
		if (!invite) return null;
		const game = await ctx.db.get(invite.gameId);
		return game ? { gameId: invite.gameId, gameName: game.name, role: invite.role } : null;
	},
});

export const acceptInvite = mutation({
	args: { token: v.string() },
	handler: async (ctx, { token }) => {
		const userId = await requireUser(ctx);
		const invite = await ctx.db
			.query("gameInvites")
			.withIndex("by_token", (q) => q.eq("token", token))
			.unique();
		if (!invite) throw new Error("Invite no longer valid");
		const existing = await ctx.db
			.query("gameMembers")
			.withIndex("by_game_user", (q) =>
				q.eq("gameId", invite.gameId).eq("userId", userId),
			)
			.unique();
		if (!existing) {
			await ctx.db.insert("gameMembers", {
				gameId: invite.gameId,
				userId,
				role: invite.role,
				createdAt: Date.now(),
			});
		}
		return invite.gameId;
	},
});
```

- [ ] **Step 2: Deploy + typecheck**

Run: `npx convex dev --once && npm run typecheck`
Expected: deploys; `api.games.*` available; typecheck exit 0.

- [ ] **Step 3: Commit**

```bash
git add convex/games.ts convex/_generated
git commit -m "feat: games CRUD, members, invites + requireMember access helper"
```

### Task 4: One-shot migration of existing data

**Files:**
- Create: `convex/migrations.ts`

- [ ] **Step 1: Create the migration mutation**

`convex/migrations.ts`:

```ts
import { mutation } from "./_generated/server";

/** One-shot: move every pre-games factory/transport into a default game per
 *  owner. Idempotent — rows that already have a gameId are skipped. */
export const migrateToGames = mutation({
	args: {},
	handler: async (ctx) => {
		const factories = await ctx.db.query("factories").collect();
		const transports = await ctx.db.query("transports").collect();

		// One default game per distinct legacy userId.
		const gameByUser = new Map<string, string>();
		const now = Date.now();
		const ensureGame = async (userId: string) => {
			const cached = gameByUser.get(userId);
			if (cached) return cached;
			const gameId = await ctx.db.insert("games", {
				ownerId: userId,
				name: "My Factories",
				createdAt: now,
				updatedAt: now,
			});
			await ctx.db.insert("gameMembers", {
				gameId,
				userId,
				role: "owner",
				createdAt: now,
			});
			gameByUser.set(userId, gameId);
			return gameId;
		};

		let migrated = 0;
		for (const f of factories) {
			if (f.gameId || !f.userId) continue;
			const gameId = await ensureGame(f.userId);
			await ctx.db.patch(f._id, { gameId, createdBy: f.userId });
			migrated++;
		}
		for (const t of transports) {
			if (t.gameId || !t.userId) continue;
			const gameId = await ensureGame(t.userId);
			await ctx.db.patch(t._id, { gameId, createdBy: t.userId });
			migrated++;
		}
		return { games: gameByUser.size, migrated };
	},
});
```

- [ ] **Step 2: Deploy and run the migration**

Run: `npx convex dev --once`
Then run the migration once: `npx convex run migrations:migrateToGames`
Expected: prints `{ games: N, migrated: M }`. Re-running returns `{ games: 0, migrated: 0 }` (idempotent — every row now has a gameId).

- [ ] **Step 3: Commit**

```bash
git add convex/migrations.ts convex/_generated
git commit -m "feat: one-shot migration of factories/transports into default games"
```

---

## Group B — Data cutover + routing (atomic)

> This group rewrites factories/transports to `gameId`, moves their routes under `/g/$gameId`, threads `gameId` through every component, and tightens the schema. It must land as a unit — the gate is only expected green at the end of Task 11.

### Task 5: Rewrite `factories.ts` to game membership

**Files:**
- Modify: `convex/factories.ts`

- [ ] **Step 1: Replace the auth model**

Full new `convex/factories.ts`:

```ts
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireMember } from "./games";

const itemRate = v.object({ item: v.string(), rate: v.number() });
const location = v.object({ x: v.number(), y: v.number() });
const status = v.union(
	v.literal("planned"),
	v.literal("building"),
	v.literal("operational"),
	v.literal("paused"),
);
const production = v.union(
	v.object({ source: v.literal("plan"), plan: v.string() }),
	v.object({
		source: v.literal("manual"),
		inputs: v.array(itemRate),
		outputs: v.array(itemRate),
		machines: v.array(
			v.object({
				building: v.string(),
				count: v.number(),
				clock: v.optional(v.number()),
			}),
		),
	}),
);

/** Load a factory and assert the caller is an editor of its game. */
async function editFactory(ctx: MutationCtx, id: Id<"factories">) {
	const factory = await ctx.db.get(id);
	if (!factory?.gameId) throw new Error("Factory not found");
	await requireMember(ctx, factory.gameId, "editor");
	return factory;
}

export const list = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, { gameId }) => {
		await requireMember(ctx, gameId, "viewer");
		return await ctx.db
			.query("factories")
			.withIndex("by_game", (q) => q.eq("gameId", gameId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { id: v.id("factories") },
	handler: async (ctx, { id }) => {
		const factory = await ctx.db.get(id);
		if (!factory?.gameId) return null;
		try {
			await requireMember(ctx, factory.gameId, "viewer");
		} catch {
			return null;
		}
		return factory;
	},
});

export const create = mutation({
	args: {
		gameId: v.id("games"),
		name: v.string(),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status,
		production,
		location: v.optional(location),
	},
	handler: async (ctx, args) => {
		const { userId } = await requireMember(ctx, args.gameId, "editor");
		const now = Date.now();
		return await ctx.db.insert("factories", {
			...args,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("factories"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status: v.optional(status),
		production: v.optional(production),
		actuals: v.optional(v.array(itemRate)),
		location: v.optional(location),
	},
	handler: async (ctx, { id, ...patch }) => {
		await editFactory(ctx, id);
		const clean = Object.fromEntries(
			Object.entries(patch).filter(([, value]) => value !== undefined),
		);
		await ctx.db.patch(id, { ...clean, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("factories") },
	handler: async (ctx, { id }) => {
		await editFactory(ctx, id);
		await ctx.db.delete(id);
	},
});
```

- [ ] **Step 2: Deploy**

Run: `npx convex dev --once`
Expected: deploys. (Typecheck will fail in the UI until Task 8 threads `gameId` — that's expected within this atomic group.)

- [ ] **Step 3: Commit**

```bash
git add convex/factories.ts convex/_generated
git commit -m "feat: scope factory functions to game membership"
```

### Task 6: Rewrite `transports.ts` to game membership

**Files:**
- Modify: `convex/transports.ts`

- [ ] **Step 1: Replace the auth model**

Full new `convex/transports.ts`:

```ts
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireMember } from "./games";

const mode = v.union(
	v.literal("belt"),
	v.literal("pipe"),
	v.literal("truck"),
	v.literal("train"),
	v.literal("drone"),
);

async function editTransport(ctx: MutationCtx, id: Id<"transports">) {
	const transport = await ctx.db.get(id);
	if (!transport?.gameId) throw new Error("Transport not found");
	await requireMember(ctx, transport.gameId, "editor");
	return transport;
}

export const list = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, { gameId }) => {
		await requireMember(ctx, gameId, "viewer");
		return await ctx.db
			.query("transports")
			.withIndex("by_game", (q) => q.eq("gameId", gameId))
			.order("desc")
			.collect();
	},
});

export const create = mutation({
	args: {
		gameId: v.id("games"),
		fromFactoryId: v.id("factories"),
		toFactoryId: v.id("factories"),
		item: v.string(),
		rate: v.number(),
		mode,
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { userId } = await requireMember(ctx, args.gameId, "editor");
		const from = await ctx.db.get(args.fromFactoryId);
		const to = await ctx.db.get(args.toFactoryId);
		if (from?.gameId !== args.gameId || to?.gameId !== args.gameId) {
			throw new Error("Factory not in this game");
		}
		const now = Date.now();
		return await ctx.db.insert("transports", {
			...args,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("transports"),
		item: v.optional(v.string()),
		rate: v.optional(v.number()),
		mode: v.optional(mode),
		note: v.optional(v.string()),
	},
	handler: async (ctx, { id, ...patch }) => {
		await editTransport(ctx, id);
		const clean = Object.fromEntries(
			Object.entries(patch).filter(([, value]) => value !== undefined),
		);
		await ctx.db.patch(id, { ...clean, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("transports") },
	handler: async (ctx, { id }) => {
		await editTransport(ctx, id);
		await ctx.db.delete(id);
	},
});
```

- [ ] **Step 2: Deploy**

Run: `npx convex dev --once`
Commit:

```bash
git add convex/transports.ts convex/_generated
git commit -m "feat: scope transport functions to game membership"
```

### Task 7: Game layout route with membership guard

**Files:**
- Create: `src/features/games/useGameId.ts`
- Create: `src/routes/g.$gameId.tsx`

- [ ] **Step 1: A tiny hook to read the active game id from the route**

`src/features/games/useGameId.ts`:

```ts
import { useParams } from "@tanstack/react-router";
import type { Id } from "#convex/_generated/dataModel";

/** The current game id from the `/g/$gameId` route segment. */
export function useGameId(): Id<"games"> {
	const { gameId } = useParams({ from: "/g/$gameId" });
	return gameId as Id<"games">;
}
```

- [ ] **Step 2: The layout route — guards membership and renders children**

`src/routes/g.$gameId.tsx`:

```tsx
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton } from "@clerk/clerk-react";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";

export const Route = createFileRoute("/g/$gameId")({
	component: GameLayout,
});

function GameGuard() {
	const { gameId } = useParams({ from: "/g/$gameId" });
	const game = useQuery(api.games.get, { gameId: gameId as Id<"games"> });

	if (game === undefined) {
		return <main className="page-wrap px-4 py-10 text-sm">Loading…</main>;
	}
	if (game === null) {
		return (
			<main className="page-wrap px-4 py-10">
				<p className="text-sm text-[var(--sea-ink-soft)]">
					You don't have access to this game.{" "}
					<Link to="/games" className="underline">
						Your games
					</Link>
				</p>
			</main>
		);
	}
	return <Outlet />;
}

function GameLayout() {
	return (
		<>
			<Unauthenticated>
				<main className="page-wrap px-4 py-10 text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Sign in to open this game.
					</p>
					<div className="mt-4">
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]"
							>
								Sign in
							</button>
						</SignInButton>
					</div>
				</main>
			</Unauthenticated>
			<Authenticated>
				<GameGuard />
			</Authenticated>
		</>
	);
}
```

- [ ] **Step 3: Commit (after Task 8 makes routes resolve)** — staged with Task 8.

### Task 8: Move factories/map/logistics routes under the game + thread `gameId`

**Files:**
- Delete: `src/routes/factories.index.tsx`, `src/routes/factories.$factoryId.tsx`, `src/routes/map.tsx`, `src/routes/logistics.tsx`
- Create: `src/routes/g.$gameId.factories.index.tsx`, `src/routes/g.$gameId.factories.$factoryId.tsx`, `src/routes/g.$gameId.map.tsx`, `src/routes/g.$gameId.logistics.tsx`
- Modify: `src/features/factories/FactoriesPage.tsx`, `FactoryDetail.tsx`, `ManualFactoryForm.tsx`, `FactoryCard.tsx`, `src/features/map/MapPage.tsx`, `FactoryPinsLayer.tsx`, `src/features/logistics/LogisticsPage.tsx`

- [ ] **Step 1: Recreate the routes under the game segment**

`git rm src/routes/factories.index.tsx src/routes/factories.$factoryId.tsx src/routes/map.tsx src/routes/logistics.tsx`

Create `src/routes/g.$gameId.factories.index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import FactoriesPage from "#/features/factories/FactoriesPage";

export const Route = createFileRoute("/g/$gameId/factories/")({
	component: FactoriesPage,
});
```

Create `src/routes/g.$gameId.factories.$factoryId.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import FactoryDetail from "#/features/factories/FactoryDetail";

export const Route = createFileRoute("/g/$gameId/factories/$factoryId")({
	component: FactoryDetail,
});
```

Create `src/routes/g.$gameId.map.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MapPage = lazy(() => import("#/features/map/MapPage"));

export const Route = createFileRoute("/g/$gameId/map")({
	ssr: false,
	component: () => (
		<Suspense
			fallback={
				<main className="page-wrap px-4 py-10 text-sm text-[var(--sea-ink-soft)]">
					Loading map…
				</main>
			}
		>
			<MapPage />
		</Suspense>
	),
});
```

Create `src/routes/g.$gameId.logistics.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import LogisticsPage from "#/features/logistics/LogisticsPage";

export const Route = createFileRoute("/g/$gameId/logistics")({
	component: LogisticsPage,
});
```

- [ ] **Step 2: Thread `gameId` through factory queries/mutations + links**

In `src/features/factories/FactoriesPage.tsx`: import `useGameId` (`import { useGameId } from "#/features/games/useGameId";`). In `FactoriesList`, add `const gameId = useGameId();` and change the queries/mutations:
- `useQuery(api.factories.list)` → `useQuery(api.factories.list, { gameId })`
- `useQuery(api.transports.list)` → `useQuery(api.transports.list, { gameId })`
Pass `gameId` to `<FactoryCard>` and `<ManualFactoryForm>` (props added below) and `<SummaryCard>` (SummaryCard needs no gameId — it takes the already-fetched arrays).

In `FactoryCard.tsx`: the `Link` `to="/factories/$factoryId"` becomes `to="/g/$gameId/factories/$factoryId"` with `params={{ gameId, factoryId: factory._id }}`. Add a `gameId: Id<"games">` prop (import `Id`) and accept it from the parent.

In `ManualFactoryForm.tsx`: add a `gameId: Id<"games">` prop; pass it to `create({ gameId, … })`; the post-create navigate becomes `navigate({ to: "/g/$gameId/factories/$factoryId", params: { gameId, factoryId: id } })`.

In `FactoryDetail.tsx`: add `const gameId = useGameId();`. `useParams({ from: "/factories/$factoryId" })` → `useParams({ from: "/g/$gameId/factories/$factoryId" })`. The back `Link to="/factories"` → `to="/g/$gameId/factories"` `params={{ gameId }}`; the delete `navigate({ to: "/factories" })` → `navigate({ to: "/g/$gameId/factories", params: { gameId } })`. (The factory `get`/`update`/`remove` mutations are by `id` and need no `gameId`.)

- [ ] **Step 3: Thread `gameId` through the map + logistics**

In `src/features/map/MapPage.tsx`: `import { useGameId }`; `const gameId = useGameId();`; pass `gameId` to `<FactoryPinsLayer gameId={gameId} />`.

In `FactoryPinsLayer.tsx`: add a `gameId: Id<"games">` prop. `useQuery(api.factories.list)` → `useQuery(api.factories.list, { gameId })`. The right-click `create({ … })` adds `gameId`. Both navigate calls and the popup `Link` target `/g/$gameId/factories/$factoryId` with `params={{ gameId, factoryId }}`.

In `src/features/logistics/LogisticsPage.tsx`: `import { useGameId }`; in `Network`, `const gameId = useGameId();`; `useQuery(api.factories.list)` → `{ gameId }`; `useQuery(api.transports.list)` → `{ gameId }`; `create({ … })` (transport) adds `gameId`. The `useMutation(api.transports.create)` call site adds `gameId` to its argument object.

- [ ] **Step 4: Build (regenerates routeTree) + typecheck**

Run: `npm run build` then `npm run typecheck`.
Expected: both succeed once all call sites pass `gameId`. Fix any remaining type errors (they will point at a missing `gameId` arg).

- [ ] **Step 5: Commit**

```bash
git add src/routes/g.$gameId.tsx src/routes/g.$gameId.factories.index.tsx src/routes/g.$gameId.factories.$factoryId.tsx src/routes/g.$gameId.map.tsx src/routes/g.$gameId.logistics.tsx src/features/games/useGameId.ts src/features/factories src/features/map src/features/logistics src/routeTree.gen.ts
git rm src/routes/factories.index.tsx src/routes/factories.$factoryId.tsx src/routes/map.tsx src/routes/logistics.tsx
git commit -m "feat: scope factories/map/logistics routes + queries to the active game"
```

### Task 9: Redirect old flat paths + make nav game-aware

**Files:**
- Create: `src/routes/factories.tsx`, `src/routes/map.tsx`, `src/routes/logistics.tsx` (redirect stubs)
- Modify: `src/components/Header.tsx`
- Modify: `src/config/features.ts`

- [ ] **Step 1: Redirect stubs**

Each old path redirects to the user's last-active game (from `localStorage`) or `/games`. Create `src/routes/factories.tsx`:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/factories")({
	beforeLoad: () => {
		const last =
			typeof localStorage !== "undefined"
				? localStorage.getItem("activeGameId")
				: null;
		throw redirect({
			to: last ? "/g/$gameId/factories" : "/games",
			params: last ? { gameId: last } : undefined,
		});
	},
});
```

Create `src/routes/map.tsx` and `src/routes/logistics.tsx` the same way (path `/map`→`/g/$gameId/map`, `/logistics`→`/g/$gameId/logistics`; `to: "/games"` when no last game).

- [ ] **Step 2: Make the nav links game-aware**

In `src/components/Header.tsx`, the factories/map/logistics nav links must resolve to the active game. Replace the `FEATURES.map(...)` block so that for `feature.id` in `{factories, map, logistics}` it links to `/g/$gameId/<feature>` using the last-active game id from `localStorage` (falling back to `/games`), while `data` and `calculator` keep their static paths. Add a helper:

```tsx
const GAME_SCOPED: Record<string, string> = {
	factories: "/g/$gameId/factories",
	map: "/g/$gameId/map",
	logistics: "/g/$gameId/logistics",
};
```

and in the map callback, when `GAME_SCOPED[feature.id]` exists and a `localStorage.activeGameId` is set, render `<Link to={GAME_SCOPED[feature.id]} params={{ gameId }}>`; otherwise render `<Link to="/games">{feature.title}</Link>`. Keep `data`/`calculator` as `<Link to={feature.path}>`.

- [ ] **Step 3: Build + typecheck + commit**

Run: `npm run build && npm run typecheck`.

```bash
git add src/routes/factories.tsx src/routes/map.tsx src/routes/logistics.tsx src/components/Header.tsx src/config/features.ts src/routeTree.gen.ts
git commit -m "feat: redirect flat data routes into the active game; game-aware nav"
```

### Task 10: Tighten the schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Require `gameId`, drop `userId`**

In `convex/schema.ts`, for both `factories` and `transports`: change `gameId` to required (`v.id("games")`), `createdBy` to required (`v.string()`), remove the `userId` field and the `by_user` index. (All rows have `gameId`/`createdBy` after Task 4's migration, so this validates.)

- [ ] **Step 2: Deploy + full gate**

Run: `npx convex dev --once && npx biome check . && npm run typecheck && npm test && npm run build`
Expected: all green. (If Convex reports rows missing `gameId`, re-run `npx convex run migrations:migrateToGames` first.)

- [ ] **Step 3: Manual verification**

Run `npm run dev`, sign in, open `/factories` → redirects into your migrated "My Factories" game at `/g/<id>/factories`; factories from before the migration appear; create/edit/delete works; `/map` and `/logistics` work under the game.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated
git commit -m "chore: require gameId, drop legacy userId from factories/transports"
```

---

## Group C — Game management UX

### Task 11: Games list + create (`/games`)

**Files:**
- Create: `src/features/games/GamesPage.tsx`, `src/routes/games.index.tsx`

- [ ] **Step 1: The games list page**

`src/features/games/GamesPage.tsx`:

```tsx
import { SignInButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";

function GamesList() {
	const games = useQuery(api.games.listMine);
	const create = useMutation(api.games.create);
	const navigate = useNavigate();
	const [name, setName] = useState("");

	const newGame = async () => {
		if (!name.trim()) return;
		const gameId = await create({ name: name.trim() });
		localStorage.setItem("activeGameId", gameId);
		navigate({ to: "/g/$gameId/factories", params: { gameId } });
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Your games</h1>
			</div>
			<div className="flex gap-2">
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="New game name"
					aria-label="New game name"
					className="flex-1 rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm"
				/>
				<button
					type="button"
					onClick={newGame}
					disabled={!name.trim()}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					Create game
				</button>
			</div>
			{games === undefined ? (
				<p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
			) : games.length === 0 ? (
				<p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
					No games yet. Create one to start planning.
				</p>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{games.map((g) => (
						<Link
							key={g._id}
							to="/g/$gameId/factories"
							params={{ gameId: g._id }}
							onClick={() => localStorage.setItem("activeGameId", g._id)}
							className="flex flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 hover:border-[var(--sea-ink)]"
						>
							<span className="font-semibold text-[var(--sea-ink)]">{g.name}</span>
							<span className="text-xs capitalize text-[var(--sea-ink-soft)]">
								{g.role}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default function GamesPage() {
	return (
		<main className="page-wrap px-4 py-8">
			<Unauthenticated>
				<div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-8 text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Sign in to create and manage games.
					</p>
					<div className="mt-4">
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]"
							>
								Sign in
							</button>
						</SignInButton>
					</div>
				</div>
			</Unauthenticated>
			<Authenticated>
				<GamesList />
			</Authenticated>
		</main>
	);
}
```

`src/routes/games.index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import GamesPage from "#/features/games/GamesPage";

export const Route = createFileRoute("/games/")({
	component: GamesPage,
});
```

- [ ] **Step 2: Build + typecheck + commit**

```bash
git add src/features/games/GamesPage.tsx src/routes/games.index.tsx src/routeTree.gen.ts
git commit -m "feat: games list + create page"
```

### Task 12: Game switcher in the header

**Files:**
- Create: `src/features/games/GameSwitcher.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: The switcher**

`src/features/games/GameSwitcher.tsx`:

```tsx
import { Authenticated, useQuery } from "convex/react";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "#convex/_generated/api";

function Switcher() {
	const games = useQuery(api.games.listMine);
	const params = useParams({ strict: false }) as { gameId?: string };
	const activeId =
		params.gameId ??
		(typeof localStorage !== "undefined"
			? (localStorage.getItem("activeGameId") ?? undefined)
			: undefined);
	if (!games || games.length === 0) {
		return (
			<Link to="/games" className="nav-link text-sm">
				Games
			</Link>
		);
	}
	const active = games.find((g) => g._id === activeId) ?? games[0];
	return (
		<select
			aria-label="Active game"
			value={active._id}
			onChange={(e) => {
				localStorage.setItem("activeGameId", e.target.value);
				window.location.href = `/g/${e.target.value}/factories`;
			}}
			className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-sm"
		>
			{games.map((g) => (
				<option key={g._id} value={g._id}>
					{g.name}
				</option>
			))}
		</select>
	);
}

export default function GameSwitcher() {
	return (
		<Authenticated>
			<Switcher />
		</Authenticated>
	);
}
```

(The `window.location.href` navigation is intentional — it guarantees the new `gameId` route param drives every game-scoped query without threading a router context.)

- [ ] **Step 2: Mount it in the header**

In `src/components/Header.tsx`, add `import GameSwitcher from "#/features/games/GameSwitcher";` and render `<GameSwitcher />` inside the right-hand controls `<div className="ml-auto …">`, before `<ClerkHeader />`.

- [ ] **Step 3: Build + typecheck + commit**

```bash
git add src/features/games/GameSwitcher.tsx src/components/Header.tsx
git commit -m "feat: header game switcher"
```

### Task 13: Game settings — members + invites (`/g/$gameId/settings`)

**Files:**
- Create: `src/features/games/GameSettings.tsx`, `src/routes/g.$gameId.settings.tsx`

- [ ] **Step 1: Settings page (rename, members, invites)**

`src/features/games/GameSettings.tsx`:

```tsx
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { useGameId } from "./useGameId";

export default function GameSettings() {
	const gameId = useGameId();
	const game = useQuery(api.games.get, { gameId });
	const members = useQuery(api.games.members, { gameId });
	const invites = useQuery(api.games.listInvites, { gameId });
	const createInvite = useMutation(api.games.createInvite);
	const revokeInvite = useMutation(api.games.revokeInvite);
	const removeMember = useMutation(api.games.removeMember);
	const [role, setRole] = useState<"editor" | "viewer">("editor");

	if (!game) return <main className="page-wrap px-4 py-8 text-sm">Loading…</main>;
	const isOwner = game.role === "owner";

	const invite = async () => {
		const token = await createInvite({ gameId, role });
		await navigator.clipboard
			.writeText(`${window.location.origin}/invite/${token}`)
			.catch(() => {});
	};

	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--sea-ink)]">{game.name} — settings</h1>

			<section className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Members</h2>
				{members?.map((m) => (
					<div key={m._id} className="flex items-center gap-3 text-sm">
						<span className="flex-1">{m.userId}</span>
						<span className="capitalize text-[var(--sea-ink-soft)]">{m.role}</span>
						{isOwner && m.role !== "owner" && (
							<button
								type="button"
								onClick={() => removeMember({ gameId, userId: m.userId })}
								className="text-[var(--sea-ink-soft)] hover:text-red-500"
							>
								Remove
							</button>
						)}
					</div>
				))}
			</section>

			{isOwner && (
				<section className="flex flex-col gap-2">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Invite link</h2>
					<div className="flex gap-2">
						<select
							aria-label="Invite role"
							value={role}
							onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
							className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-sm capitalize"
						>
							<option value="editor">editor</option>
							<option value="viewer">viewer</option>
						</select>
						<button
							type="button"
							onClick={invite}
							className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)]"
						>
							Create + copy link
						</button>
					</div>
					{invites?.map((inv) => (
						<div key={inv._id} className="flex items-center gap-3 text-xs">
							<span className="flex-1 truncate">
								{window.location.origin}/invite/{inv.token} ({inv.role})
							</span>
							<button
								type="button"
								onClick={() => revokeInvite({ inviteId: inv._id as Id<"gameInvites"> })}
								className="text-[var(--sea-ink-soft)] hover:text-red-500"
							>
								Revoke
							</button>
						</div>
					))}
				</section>
			)}
		</main>
	);
}
```

`src/routes/g.$gameId.settings.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import GameSettings from "#/features/games/GameSettings";

export const Route = createFileRoute("/g/$gameId/settings")({
	component: GameSettings,
});
```

- [ ] **Step 2: Build + typecheck + commit**

```bash
git add src/features/games/GameSettings.tsx src/routes/g.$gameId.settings.tsx src/routeTree.gen.ts
git commit -m "feat: game settings — members + invite links"
```

### Task 14: Invite accept (`/invite/$token`)

**Files:**
- Create: `src/features/games/AcceptInvite.tsx`, `src/routes/invite.$token.tsx`

- [ ] **Step 1: Accept screen**

`src/features/games/AcceptInvite.tsx`:

```tsx
import { SignInButton } from "@clerk/clerk-react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { api } from "#convex/_generated/api";

function Accept() {
	const { token } = useParams({ from: "/invite/$token" });
	const info = useQuery(api.games.inviteInfo, { token });
	const accept = useMutation(api.games.acceptInvite);
	const navigate = useNavigate();

	if (info === undefined) return <p className="text-sm">Loading…</p>;
	if (info === null)
		return (
			<p className="text-sm text-[var(--sea-ink-soft)]">
				This invite is no longer valid.{" "}
				<Link to="/games" className="underline">Your games</Link>
			</p>
		);

	const join = async () => {
		const gameId = await accept({ token });
		localStorage.setItem("activeGameId", gameId);
		navigate({ to: "/g/$gameId/factories", params: { gameId } });
	};

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<p className="text-sm text-[var(--sea-ink)]">
				You've been invited to <strong>{info.gameName}</strong> as {info.role}.
			</p>
			<button
				type="button"
				onClick={join}
				className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]"
			>
				Join game
			</button>
		</div>
	);
}

export default function AcceptInvite() {
	return (
		<main className="page-wrap px-4 py-12">
			<Unauthenticated>
				<div className="text-center">
					<p className="text-sm text-[var(--sea-ink-soft)]">Sign in to accept this invite.</p>
					<div className="mt-4">
						<SignInButton mode="modal">
							<button type="button" className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]">
								Sign in
							</button>
						</SignInButton>
					</div>
				</div>
			</Unauthenticated>
			<Authenticated>
				<Accept />
			</Authenticated>
		</main>
	);
}
```

`src/routes/invite.$token.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import AcceptInvite from "#/features/games/AcceptInvite";

export const Route = createFileRoute("/invite/$token")({
	component: AcceptInvite,
});
```

- [ ] **Step 2: Build + typecheck + commit**

```bash
git add src/features/games/AcceptInvite.tsx src/routes/invite.$token.tsx src/routeTree.gen.ts
git commit -m "feat: invite-link accept flow"
```

### Task 15: Save-as-factory game picker

**Files:**
- Modify: `src/features/factories/SaveAsFactoryButton.tsx`

- [ ] **Step 1: Add a game selector to the save flow**

In `SaveAsFactoryButton.tsx`'s authenticated `SaveButton`, load the user's games and let them pick a target before saving:
- Add `const games = useQuery(api.games.listMine);` and `const [gameId, setGameId] = useState<Id<"games"> | "">("");` (import `Id`, `useQuery`, `useState`).
- Default `gameId` to `localStorage.getItem("activeGameId")` if it's among `games`.
- Render a `<select>` of games (label "Save to game") next to the button; if the user has no games, show a link to `/games` to create one.
- In `save`, require a chosen `gameId` and pass it: `create({ gameId, name, status: "planned", production: { … } })`, then `navigate({ to: "/g/$gameId/factories/$factoryId", params: { gameId, factoryId: id } })`.

- [ ] **Step 2: Build + typecheck + commit**

```bash
git add src/features/factories/SaveAsFactoryButton.tsx
git commit -m "feat: pick a target game when saving a calculator plan"
```

### Task 16: Final verification

- [ ] **Step 1: Full gate**

Run: `npx biome check . && npm run typecheck && npm test && npm run build`
Expected: all green (new tests: roles).

- [ ] **Step 2: End-to-end manual pass**

Signed in: `/games` → create a game → land in it; create a factory; `/g/$id/settings` → create an editor invite link; open it in a second account → join → both browsers see each other's factory edits live; a viewer link cannot edit; old `/factories` redirects into the active game; the header switcher changes games; "Save as factory" from the calculator targets the chosen game.

- [ ] **Step 3: Commit any remaining wiring**

```bash
git add -A
git commit -m "chore: phase 7 final wiring + verification"
```

---

## Self-review notes (coverage vs spec)

- §1 data model → Tasks 2, 5, 6, 10. §2 access control (`requireMember`, role gates) → Tasks 1, 3, 5, 6. §3 routing (`/g/$gameId` layout + scoped routes + redirects + calculator stays global + save-as-factory picker) → Tasks 7, 8, 9, 15. §4 game management & invites + switcher → Tasks 3, 11, 12, 13, 14. §5 migration → Task 4. §6 error handling (no-access state, invalid invite, cascade delete) → Tasks 5/6 (`get` returns null), 3 (`remove` cascade, `acceptInvite`/`inviteInfo`), 7 (guard), 14. §7 testing → Task 1 (pure roles), component/manual per UI task.
- Type consistency: `Role`/`hasRole` (Task 1) mirror the Convex `RANK` (Task 3) — both `viewer<editor<owner`. `requireMember` (Task 3) consumed by Tasks 5, 6, 13. `useGameId` (Task 7) used by Tasks 8, 13. `Id<"games">` threaded consistently through factory/transport args and links. `localStorage` key `activeGameId` used consistently in Tasks 9, 11, 12, 14, 15.
- Sequencing: Group A is additive (app keeps working on old `userId` path). Group B is the atomic cutover; the gate is green only at Task 10's end. The `requireMember` export from `convex/games.ts` (Task 3) is imported by factories/transports (Tasks 5, 6) — Convex bundles cross-file imports within `convex/`.
