import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const mode = v.union(
	v.literal("belt"),
	v.literal("pipe"),
	v.literal("truck"),
	v.literal("train"),
	v.literal("drone"),
);

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity.subject;
}

async function ownTransport(ctx: MutationCtx, id: Id<"transports">) {
	const userId = await requireUser(ctx);
	const transport = await ctx.db.get(id);
	if (!transport || transport.userId !== userId) {
		throw new Error("Transport not found");
	}
	return transport;
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUser(ctx);
		return await ctx.db
			.query("transports")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const create = mutation({
	args: {
		fromFactoryId: v.id("factories"),
		toFactoryId: v.id("factories"),
		item: v.string(),
		rate: v.number(),
		mode,
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const from = await ctx.db.get(args.fromFactoryId);
		const to = await ctx.db.get(args.toFactoryId);
		if (!from || from.userId !== userId || !to || to.userId !== userId) {
			throw new Error("Factory not found");
		}
		const now = Date.now();
		return await ctx.db.insert("transports", {
			...args,
			userId,
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
		await ownTransport(ctx, id);
		const clean = Object.fromEntries(
			Object.entries(patch).filter(([, value]) => value !== undefined),
		);
		await ctx.db.patch(id, { ...clean, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("transports") },
	handler: async (ctx, { id }) => {
		await ownTransport(ctx, id);
		await ctx.db.delete(id);
	},
});
