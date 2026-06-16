import { createFileRoute } from "@tanstack/react-router";
import GameSettings from "#/features/games/GameSettings";

export const Route = createFileRoute("/g/$gameId/settings")({
	component: GameSettings,
});
