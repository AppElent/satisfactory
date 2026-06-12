import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "#/components/ComingSoon";

export const Route = createFileRoute("/data/recipes")({
	component: () => <ComingSoon featureId="data" heading="Recipes" />,
});
