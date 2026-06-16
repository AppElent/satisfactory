import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useToast } from "#/components/Toast";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import ItemRateEditor from "./ItemRateEditor";
import MachineEditor from "./MachineEditor";
import type { FactoryStatus, ItemRate, MachineCount } from "./types";

const STATUSES: FactoryStatus[] = [
	"planned",
	"building",
	"operational",
	"paused",
];

interface Initial {
	name: string;
	status: FactoryStatus;
	inputs: ItemRate[];
	outputs: ItemRate[];
	machines: MachineCount[];
}

export default function ManualFactoryForm({
	gameId,
	factoryId,
	initial,
	onClose,
}: {
	gameId: Id<"games">;
	factoryId?: Id<"factories">;
	initial?: Initial;
	onClose: () => void;
}) {
	const create = useMutation(api.factories.create);
	const update = useMutation(api.factories.update);
	const navigate = useNavigate();
	const { toast } = useToast();
	const [name, setName] = useState(initial?.name ?? "");
	const [status, setStatus] = useState<FactoryStatus>(
		initial?.status ?? "planned",
	);
	const [inputs, setInputs] = useState<ItemRate[]>(initial?.inputs ?? []);
	const [outputs, setOutputs] = useState<ItemRate[]>(initial?.outputs ?? []);
	const [machines, setMachines] = useState<MachineCount[]>(
		initial?.machines ?? [],
	);
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			const production = {
				source: "manual" as const,
				inputs,
				outputs,
				machines,
			};
			if (factoryId) {
				await update({ id: factoryId, name: name.trim(), status, production });
				onClose();
			} else {
				const id = await create({
					gameId,
					name: name.trim(),
					status,
					production,
				});
				navigate({
					to: "/g/$gameId/factories/$factoryId",
					params: { gameId, factoryId: id },
				});
			}
		} catch {
			toast(
				factoryId ? "Couldn't save changes." : "Couldn't create the factory.",
			);
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
			<MachineEditor rows={machines} onChange={setMachines} />
			<div className="flex gap-2">
				<button
					type="button"
					onClick={submit}
					disabled={saving || !name.trim()}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					{factoryId ? "Save changes" : "Save factory"}
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
