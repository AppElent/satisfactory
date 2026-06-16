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
