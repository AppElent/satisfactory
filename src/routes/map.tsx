import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MapPage = lazy(() => import("#/features/map/MapPage"));

export const Route = createFileRoute("/map")({
	ssr: false,
	component: () => (
		<Suspense
			fallback={
				<main className="page-wrap px-4 py-10 text-sm text-[var(--sea-ink-soft)]">
					Loading map…
				</main>
			}
		>
			<MapPage />
		</Suspense>
	),
});
