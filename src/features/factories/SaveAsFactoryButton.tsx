import { SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { useState } from "react";
import { useToast } from "#/components/Toast";
import { getItem } from "#/data";
import type { ProblemSpec, Solution } from "#/features/calculator/solver";
import { api } from "#convex/_generated/api";
import type { Id } from "#convex/_generated/dataModel";
import { encodeSnapshot } from "./snapshot";

function SaveButton({
	spec,
	solution,
	game,
	factory,
}: {
	spec: ProblemSpec;
	solution: Solution;
	game?: string;
	factory?: string;
}) {
	const create = useMutation(api.factories.create);
	const update = useMutation(api.factories.update);
	const navigate = useNavigate();
	const { toast } = useToast();
	const [saving, setSaving] = useState(false);
	const games = useQuery(api.games.listMine);
	const [selectedGameId, setSelectedGameId] = useState<Id<"games"> | "">("");

	const activeGameId =
		selectedGameId ||
		(typeof localStorage !== "undefined"
			? ((localStorage.getItem("activeGameId") as Id<"games"> | null) ?? "")
			: "");

	const gameId = (
		games?.some((g) => g._id === activeGameId)
			? activeGameId
			: (games?.[0]?._id ?? "")
	) as Id<"games"> | "";

	const save = async () => {
		if (!gameId) {
			toast("Select a game to save this plan into.");
			return;
		}
		setSaving(true);
		try {
			const target = spec.targets[0]?.item;
			const name =
				(target ? getItem(target)?.name : undefined) ?? "New factory";
			const id = await create({
				gameId,
				name,
				status: "planned",
				production: {
					source: "plan",
					plan: encodeSnapshot({ spec, solution }),
				},
			});
			navigate({
				to: "/g/$gameId/factories/$factoryId",
				params: { gameId, factoryId: id },
			});
		} catch {
			toast("Couldn't save this plan as a factory.");
		} finally {
			setSaving(false);
		}
	};

	const saveToFactory = async () => {
		if (!game || !factory) return;
		setSaving(true);
		try {
			await update({
				id: factory as Id<"factories">,
				production: {
					source: "plan",
					plan: encodeSnapshot({ spec, solution }),
				},
			});
			navigate({
				to: "/g/$gameId/factories/$factoryId",
				params: { gameId: game, factoryId: factory },
			});
		} catch {
			toast("Couldn't save changes to this factory.");
		} finally {
			setSaving(false);
		}
	};

	if (games !== undefined && games.length === 0) {
		return (
			<span className="text-sm text-[var(--sea-ink-soft)]">
				<a href="/games" className="underline">
					Create a game
				</a>{" "}
				to save factories.
			</span>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{game && factory && (
				<button
					type="button"
					onClick={saveToFactory}
					disabled={saving}
					className="rounded-lg bg-[var(--sea-ink)] px-3 py-2 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
				>
					Save changes to this factory
				</button>
			)}
			{games && games.length > 1 && (
				<select
					aria-label="Save to game"
					value={gameId}
					onChange={(e) => setSelectedGameId(e.target.value as Id<"games">)}
					className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-sm"
				>
					{games.map((g) => (
						<option key={g._id} value={g._id}>
							{g.name}
						</option>
					))}
				</select>
			)}
			<button
				type="button"
				onClick={save}
				disabled={saving || !gameId}
				className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink)] disabled:opacity-50"
			>
				{factory ? "Save as new factory" : "Save as factory"}
			</button>
		</div>
	);
}

export default function SaveAsFactoryButton(props: {
	spec: ProblemSpec;
	solution: Solution;
	game?: string;
	factory?: string;
}) {
	return (
		<>
			<Authenticated>
				<SaveButton {...props} />
			</Authenticated>
			<Unauthenticated>
				<SignInButton mode="modal">
					<button
						type="button"
						className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)]"
					>
						Sign in to save as factory
					</button>
				</SignInButton>
			</Unauthenticated>
		</>
	);
}
