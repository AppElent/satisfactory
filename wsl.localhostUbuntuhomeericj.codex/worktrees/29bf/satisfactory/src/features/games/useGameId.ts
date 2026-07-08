import { useParams } from "@tanstack/react-router";
import type { Id } from "#convex/_generated/dataModel";

/** The current game id from the `/g/$gameId` route segment. May be undefined
 *  during the first hydration render before the router populates params. */
export function useGameId(): Id<"games"> {
	const params = useParams({ strict: false }) as { gameId?: string };
	return params.gameId as Id<"games">;
}
