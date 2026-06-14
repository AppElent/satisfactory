import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "#convex/_generated/api";
import ItemRateEditor from "./ItemRateEditor";
import type { FactoryStatus, ItemRate } from "./types";

const STATUSES: FactoryStatus[] = [
	"planned",
	"building",
	"operational",
	"paused",
];

export default function ManualFactoryForm({
	onClose,
}: {
	onClose: () => void;
}) {
	const create = useMutation(api.factories.create);
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [status, setStatus] = useState<FactoryStatus>("planned");
	const [inputs, setInputs] = useState<ItemRate[]>([]);
	const [outputs, setOutputs] = useState<ItemRate[]>([]);
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			const id = await create({
				name: name.trim(),
				status,
				production: { source: "manual", inputs, outputs, machines: [] },
			});
			navigate({ to: "/factories/$factoryId", params: { factoryId: id } });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Factory name"
				aria-label="Factory name"
				className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
			/>
			<select
				value={status}
				onChange={(e) => setStatus(e.target.value as FactoryStatus)}
				aria-label="Status"
				className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm capitalize"
			>
				{STATUSES.map((s) => (
					<option key={s} value={s}>
						{s}
					</option>
				))}
			</select>
			<ItemRateEditor label="Outputs" rows={outputs} onChange={setOutputs} />
			<ItemRateEditor label="Inputs" rows={inputs} onChange={setInputs} />
			<div className="flex gap-2">
				<button
					type="button"
					onClick={submit}
					disabled={saving || !name.trim()}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					Save factory
				</button>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)]"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
