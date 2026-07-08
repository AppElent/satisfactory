import { createFileRoute } from "@tanstack/react-router";
import FactoriesPage from "#/features/factories/FactoriesPage";

export const Route = createFileRoute("/g/$gameId/factories/")({
	component: FactoriesPage,
});
