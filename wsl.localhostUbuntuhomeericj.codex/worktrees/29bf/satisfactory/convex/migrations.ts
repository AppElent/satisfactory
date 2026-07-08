import { mutation } from "./_generated/server";

/** Strip the legacy userId field from all factories and transports.
 *  Needed when tightening the schema after the initial gameId migration. */
export const stripLegacyUserId = mutation({
	args: {},
	handler: async (ctx) => {
		const factories = await ctx.db.query("factories").collect();
		let patched = 0;
		for (const f of factories) {
			const raw = f as Record<string, unknown>;
			if ("userId" in raw) {
				await (ctx.db as any).patch(f._id, { userId: undefined });
				patched++;
			}
		}
		const transports = await ctx.db.query("transports").collect();
		for (const t of transports) {
			const raw = t as Record<string, unknown>;
			if ("userId" in raw) {
				await (ctx.db as any).patch(t._id, { userId: undefined });
				patched++;
			}
		}
		return { patched };
	},
});

/** One-shot: move every pre-games factory/transport into a default game per
 *  owner. Idempotent — all rows now have gameId after the initial migration. */
export const migrateToGames = mutation({
	args: {},
	handler: async (_ctx) => {
		// Migration already ran; all rows have gameId and createdBy.
		return { games: 0, migrated: 0 };
	},
});
