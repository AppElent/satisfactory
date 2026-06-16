import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/** One-shot: move every pre-games factory/transport into a default game per
 *  owner. Idempotent — rows that already have a gameId are skipped. */
export const migrateToGames = mutation({
	args: {},
	handler: async (ctx) => {
		const factories = await ctx.db.query("factories").collect();
		const transports = await ctx.db.query("transports").collect();

		// One default game per distinct legacy userId.
		const gameByUser = new Map<string, Id<"games">>();
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
