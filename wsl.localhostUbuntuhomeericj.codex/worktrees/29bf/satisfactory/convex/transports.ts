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
