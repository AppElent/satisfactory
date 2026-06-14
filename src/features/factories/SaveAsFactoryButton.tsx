import { SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { useState } from "react";
import { getItem } from "#/data";
import type { ProblemSpec, Solution } from "#/features/calculator/solver";
import { api } from "#convex/_generated/api";
import { encodeSnapshot } from "./snapshot";

function SaveButton({
	spec,
	solution,
}: {
	spec: ProblemSpec;
	solution: Solution;
}) {
	const create = useMutation(api.factories.create);
	const navigate = useNavigate();
	const [saving, setSaving] = useState(false);

	const save = async () => {
		setSaving(true);
		try {
			const target = spec.targets[0]?.item;
			const name =
				(target ? getItem(target)?.name : undefined) ?? "New factory";
			const id = await create({
				name,
				status: "planned",
				production: {
					source: "plan",
					plan: encodeSnapshot({ spec, solution }),
				},
			});
			navigate({ to: "/factories/$factoryId", params: { factoryId: id } });
		} finally {
			setSaving(false);
		}
	};

	return (
		<button
			type="button"
			onClick={save}
			disabled={saving}
			className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--sea-ink)] disabled:opacity-50"
		>
			Save as factory
		</button>
	);
}

export default function SaveAsFactoryButton(props: {
	spec: ProblemSpec;
	solution: Solution;
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
