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
