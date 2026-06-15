import { createFileRoute } from "@tanstack/react-router";
import LogisticsPage from "#/features/logistics/LogisticsPage";

export const Route = createFileRoute("/logistics")({
	component: LogisticsPage,
});
