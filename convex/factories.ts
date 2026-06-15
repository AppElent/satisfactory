import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

/** Clerk subject for the caller, or throw if unauthenticated. */
async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new Error("Not authenticated");
	return identity.subject;
}

/** Load a factory and assert the caller owns it. */
async function ownFactory(ctx: MutationCtx, id: Id<"factories">) {
	const userId = await requireUser(ctx);
	const factory = await ctx.db.get(id);
	if (!factory || factory.userId !== userId) {
		throw new Error("Factory not found");
	}
	return factory;
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUser(ctx);
		return await ctx.db
			.query("factories")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { id: v.id("factories") },
	handler: async (ctx, { id }) => {
		const userId = await requireUser(ctx);
		const factory = await ctx.db.get(id);
		if (!factory || factory.userId !== userId) return null;
		return factory;
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		notes: v.optional(v.string()),
		status,
		production,
		location: v.optional(location),
	},
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const now = Date.now();
		return await ctx.db.insert("factories", {
			...args,
			userId,
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
		await ownFactory(ctx, id);
		const clean = Object.fromEntries(
			Object.entries(patch).filter(([, v]) => v !== undefined),
		);
		await ctx.db.patch(id, { ...clean, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("factories") },
	handler: async (ctx, { id }) => {
		await ownFactory(ctx, id);
		await ctx.db.delete(id);
	},
});
