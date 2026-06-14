import { createFileRoute } from "@tanstack/react-router";
import FactoriesPage from "#/features/factories/FactoriesPage";

export const Route = createFileRoute("/factories/")({
	component: FactoriesPage,
});
