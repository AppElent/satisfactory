import { useEffect, useState } from "react";

export interface LinkDraft {
	fromFactoryId: string;
	toFactoryId: string;
	item: string;
	rate: number;
	mode: "belt" | "pipe" | "truck" | "train" | "drone";
	note?: string;
}

const MODES: LinkDraft["mode"][] = ["belt", "pipe", "truck", "train", "drone"];

export default function LinkForm({
	factories,
	prefill,
	onCreate,
}: {
	factories: { _id: string; name: string }[];
	prefill?: { fromFactoryId: string; item: string };
	onCreate: (draft: LinkDraft) => void;
}) {
	const [fromFactoryId, setFrom] = useState(factories[0]?._id ?? "");
	const [toFactoryId, setTo] = useState(factories[1]?._id ?? factories[0]?._id ?? "");
	const [item, setItem] = useState("");
	const [rate, setRate] = useState(60);
	const [mode, setMode] = useState<LinkDraft["mode"]>("belt");

	useEffect(() => {
		if (prefill) {
			setFrom(prefill.fromFactoryId);
			setItem(prefill.item);
		}
	}, [prefill]);

	const submit = () => {
		if (!item.trim() || !fromFactoryId || !toFactoryId) return;
		onCreate({ fromFactoryId, toFactoryId, item: item.trim(), rate, mode });
		setItem("");
	};

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
				New link
			</h2>
			<label className="flex flex-col gap-1 text-sm">
				From
				<select
					aria-label="From factory"
					value={fromFactoryId}
					onChange={(e) => setFrom(e.target.value)}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				>
					{factories.map((f) => (
						<option key={f._id} value={f._id}>
							{f.name}
						</option>
					))}
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				To
				<select
					aria-label="To factory"
					value={toFactoryId}
					onChange={(e) => setTo(e.target.value)}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				>
					{factories.map((f) => (
						<option key={f._id} value={f._id}>
							{f.name}
						</option>
					))}
				</select>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Item
				<input
					aria-label="Item"
					value={item}
					onChange={(e) => setItem(e.target.value)}
					placeholder="item slug"
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Rate /min
				<input
					type="number"
					aria-label="Rate per minute"
					min={0}
					value={rate}
					onChange={(e) => setRate(Number(e.target.value))}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1"
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Mode
				<select
					aria-label="Mode"
					value={mode}
					onChange={(e) => setMode(e.target.value as LinkDraft["mode"])}
					className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 capitalize"
				>
					{MODES.map((m) => (
						<option key={m} value={m}>
							{m}
						</option>
					))}
				</select>
			</label>
			<button
				type="button"
				onClick={submit}
				className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)]"
			>
				Add link
			</button>
		</div>
	);
}
