import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/map")({
	beforeLoad: () => {
		const last =
			typeof localStorage !== "undefined"
				? localStorage.getItem("activeGameId")
				: null;
		throw redirect({
			to: last ? "/g/$gameId/map" : "/games",
			params: last ? { gameId: last } : undefined,
		});
	},
});
