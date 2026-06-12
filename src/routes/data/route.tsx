import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/data")({
	component: DataLayout,
});

const SECTIONS = [
	{ to: "/data/items", label: "Items" },
	{ to: "/data/recipes", label: "Recipes" },
	{ to: "/data/buildings", label: "Buildings" },
	{ to: "/data/buildables", label: "Buildables" },
	{ to: "/data/schematics", label: "Schematics" },
] as const;

function DataLayout() {
	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-6 sm:flex-row">
			<aside className="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-44 sm:flex-col">
				{SECTIONS.map((section) => (
					<Link
						key={section.to}
						to={section.to}
						className="nav-link whitespace-nowrap rounded-lg px-3 py-2"
						activeProps={{
							className:
								"nav-link is-active whitespace-nowrap rounded-lg px-3 py-2",
						}}
					>
						{section.label}
					</Link>
				))}
			</aside>
			<div className="min-w-0 flex-1">
				<Outlet />
			</div>
		</main>
	);
}
