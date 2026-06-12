export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
			<div className="page-wrap flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">&copy; {year} Satisfactory Planner</p>
				<p className="m-0 text-xs">
					Unofficial fan-made tool. Satisfactory is a trademark of Coffee Stain
					Studios. Game data and assets belong to their respective owners.
				</p>
			</div>
		</footer>
	);
}
