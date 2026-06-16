import { useParams } from "@tanstack/react-router";
import type { Id } from "#convex/_generated/dataModel";

/** The current game id from the `/g/$gameId` route segment. */
export function useGameId(): Id<"games"> {
	const { gameId } = useParams({ from: "/g/$gameId" });
	return gameId as Id<"games">;
}
