import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "#/features/account/AccountPanel";

export const Route = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "Account — Satisfactory Planner" }] }),
	component: AccountPanel,
});
