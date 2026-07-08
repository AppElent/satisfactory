import { createFileRoute } from "@tanstack/react-router";
import CalculatorPage from "#/features/calculator/CalculatorPage";

export const Route = createFileRoute("/calculator")({
	validateSearch: (
		search: Record<string, unknown>,
	): { plan?: string; game?: string; factory?: string } => ({
		plan: typeof search.plan === "string" ? search.plan : undefined,
		game: typeof search.game === "string" ? search.game : undefined,
		factory: typeof search.factory === "string" ? search.factory : undefined,
	}),
	head: () => ({
		meta: [
			{ title: "Production calculator — Satisfactory Planner" },
			{
				name: "description",
				content:
					"Plan optimal Satisfactory production lines: set targets, toggle alternate recipes, and see machines, raw resources, power and build cost.",
			},
		],
	}),
	component: CalculatorPage,
});
