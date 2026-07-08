import { Link } from "@tanstack/react-router";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "#/components/ui/icon";
import { type SearchResult, searchEntities } from "#/data";

const TYPE_ORDER: SearchResult["type"][] = [
	"item",
	"recipe",
	"building",
	"buildable",
	"schematic",
];

const TYPE_LABELS: Record<SearchResult["type"], string> = {
	item: "Items",
	recipe: "Recipes",
	building: "Buildings",
	buildable: "Buildables",
	schematic: "Schematics",
};

const DETAIL_ROUTE = {
	item: "/data/items/$slug",
	recipe: "/data/recipes/$slug",
	building: "/data/buildings/$slug",
	buildable: "/data/buildables/$slug",
	schematic: "/data/schematics/$slug",
} as const;

interface DropdownPos {
	left: number;
	top: number;
	width: number;
}

/** Up to this many results per category in the grouped dropdown. */
const PER_GROUP = 6;

export default function GlobalSearch() {
	const [raw, setRaw] = useState("");
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const wrapRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<DropdownPos | null>(null);

	// Debounce the raw input so rapid typing does not re-run the search (and
	// re-render the dropdown) on every keystroke.
	useEffect(() => {
		const t = setTimeout(() => setQuery(raw), 170);
		return () => clearTimeout(t);
	}, [raw]);

	const groups = useMemo(() => {
		if (query.trim().length === 0) return [];
		const results = searchEntities(query, 100);
		return TYPE_ORDER.map((type) => ({
			type,
			items: results.filter((r) => r.type === type).slice(0, PER_GROUP),
		})).filter((g) => g.items.length > 0);
	}, [query]);

	const open = groups.length > 0;
	const close = useCallback(() => {
		setRaw("");
		setQuery("");
	}, []);

	// Ctrl/Cmd-F focuses the search and suppresses the browser's native find.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
				e.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// Position the portalled dropdown against the search box, kept in sync while
	// open so it escapes any header clipping.
	useLayoutEffect(() => {
		if (!open) return;
		const update = () => {
			const el = wrapRef.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			setPos({ left: r.left, top: r.bottom, width: r.width });
		};
		update();
		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
		};
	}, [open]);

	// Close on outside click / Escape.
	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (wrapRef.current?.contains(target)) return;
			if (target?.closest?.("[data-global-search-results]")) return;
			close();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				close();
				inputRef.current?.blur();
			}
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open, close]);

	return (
		<div ref={wrapRef} className="w-[280px] flex-none">
			<label className="flex h-[38px] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 shadow-[var(--bevel-inset)]">
				<Icon
					name="search"
					size={16}
					className="flex-none text-[var(--text-muted)]"
				/>
				<input
					ref={inputRef}
					value={raw}
					onChange={(e) => setRaw(e.target.value)}
					placeholder="Search items, recipes, buildings…"
					aria-label="Search items, recipes, buildings"
					className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
				/>
			</label>
			{open &&
				pos &&
				createPortal(
					<div
						data-global-search-results
						className="fixed z-50 max-h-[70vh] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--graphite-900)] py-1 shadow-lg"
						style={{ left: pos.left, top: pos.top + 4, width: pos.width }}
					>
						{groups.map((g) => (
							<div key={g.type}>
								<div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
									{TYPE_LABELS[g.type]}
								</div>
								{g.items.map((r) => (
									<Link
										key={`${r.type}-${r.slug}`}
										to={DETAIL_ROUTE[r.type]}
										params={{ slug: r.slug }}
										onClick={close}
										className="block px-3 py-1.5 text-[13px] text-[var(--text-primary)] no-underline hover:bg-[var(--surface-hover)]"
									>
										{r.name}
									</Link>
								))}
							</div>
						))}
					</div>,
					document.body,
				)}
		</div>
	);
}
