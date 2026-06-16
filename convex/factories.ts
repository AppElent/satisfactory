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
