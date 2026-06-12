import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "#/components/ComingSoon";

export const Route = createFileRoute("/data/schematics")({
	component: () => <ComingSoon featureId="data" heading="Schematics" />,
});
