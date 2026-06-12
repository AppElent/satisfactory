import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "#/components/ComingSoon";

export const Route = createFileRoute("/data/items")({
	component: () => <ComingSoon featureId="data" heading="Items" />,
});
