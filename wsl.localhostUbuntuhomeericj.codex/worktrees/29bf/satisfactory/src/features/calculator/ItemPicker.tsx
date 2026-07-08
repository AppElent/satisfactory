import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EntityIcon from "#/components/EntityIcon";
import { Input } from "#/components/ui/input";
import { listItems } from "#/data";

interface ItemPickerProps {
	placeholder: string;
	/** Slugs already chosen — excluded from results. */
	exclude: string[];
	onPick: (slug: string) => void;
}

interface DropdownPos {
	left: number;
	top: number;
	width: number;
}

export default function ItemPicker({
	placeholder,
	exclude,
	onPick,
}: ItemPickerProps) {
	const [query, setQuery] = useState("");
	const wrapRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<DropdownPos | null>(null);
	const excluded = new Set(exclude);
	const matches =
		query.trim().length > 0
			? listItems()
					.filter(
						(i) =>
							!excluded.has(i.slug) &&
							i.name.toLowerCase().includes(query.toLowerCase()),
					)
					.slice(0, 6)
			: [];
	const open = matches.length > 0;

	// Position the portalled dropdown against the input box, and keep it in
	// sync while open (the panel that wraps this picker has overflow-hidden,
	// so the results render in a body-level portal to escape clipping).
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
			const wrap = wrapRef.current;
			const target = e.target as Node;
			if (wrap?.contains(target)) return;
			if ((target as HTMLElement)?.closest?.("[data-item-picker-results]"))
				return;
			setQuery("");
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setQuery("");
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={wrapRef} className="relative">
			<Input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
			/>
			{open &&
				pos &&
				createPortal(
					<div
						data-item-picker-results
						className="fixed z-50 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--graphite-900)] shadow-lg"
						style={{
							left: pos.left,
							top: pos.top + 4,
							width: pos.width,
						}}
					>
						{matches.map((i) => (
							<button
								key={i.slug}
								type="button"
								onClick={() => {
									onPick(i.slug);
									setQuery("");
								}}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)]"
							>
								<EntityIcon icon={i.icon} name={i.name} size={20} />
								{i.name}
							</button>
						))}
					</div>,
					document.body,
				)}
		</div>
	);
}
