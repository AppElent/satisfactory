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
		<main className="page-wrap flex flex-col gap-6 px-4 py-6">
			{/* Entity-type tab row */}
			<nav className="flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)]">
				{SECTIONS.map((section) => (
					<Link
						key={section.to}
						to={section.to}
						className="relative h-[42px] cursor-pointer border-b-2 border-transparent bg-transparent px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text-secondary)] whitespace-nowrap"
						activeProps={{
							className:
								"relative h-[42px] cursor-pointer border-b-2 border-[var(--accent)] bg-transparent px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-primary)] no-underline whitespace-nowrap",
						}}
					>
						{section.label}
					</Link>
				))}
			</nav>
			<div className="min-w-0">
				<Outlet />
			</div>
		</main>
	);
}
