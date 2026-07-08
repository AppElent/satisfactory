import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/logistics")({
	beforeLoad: () => {
		const last =
			typeof localStorage !== "undefined"
				? localStorage.getItem("activeGameId")
				: null;
		throw redirect({
			to: last ? "/g/$gameId/logistics" : "/games",
			params: last ? { gameId: last } : undefined,
		});
	},
});
