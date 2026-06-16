import { createFileRoute } from "@tanstack/react-router";
import FactoryDetail from "#/features/factories/FactoryDetail";

export const Route = createFileRoute("/g/$gameId/factories/$factoryId")({
	component: FactoryDetail,
});
