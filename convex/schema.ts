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

export default defineSchema({
	factories: defineTable({
		userId: v.string(),
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
	}).index("by_user", ["userId"]),
});
