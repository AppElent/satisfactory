import { createFileRoute } from "@tanstack/react-router";
import AcceptInvite from "#/features/games/AcceptInvite";

export const Route = createFileRoute("/invite/$token")({
	component: AcceptInvite,
});
