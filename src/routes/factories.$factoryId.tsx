import { createFileRoute } from "@tanstack/react-router";
import FactoryDetail from "#/features/factories/FactoryDetail";

export const Route = createFileRoute("/factories/$factoryId")({
	component: FactoryDetail,
});
