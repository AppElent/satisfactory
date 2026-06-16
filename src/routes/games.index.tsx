import { createFileRoute } from "@tanstack/react-router";
import GamesPage from "#/features/games/GamesPage";

export const Route = createFileRoute("/games/")({
	component: GamesPage,
});
