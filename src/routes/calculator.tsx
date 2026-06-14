import { createFileRoute } from "@tanstack/react-router";
import CalculatorPage from "#/features/calculator/CalculatorPage";

export const Route = createFileRoute("/calculator")({
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
