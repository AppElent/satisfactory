import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "#/components/ComingSoon";

export const Route = createFileRoute("/logistics")({
	component: () => (
		<main className="page-wrap px-4 py-10">
			<ComingSoon featureId="logistics" />
		</main>
	),
});
