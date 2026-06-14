import { SignInButton } from "@clerk/clerk-react";
import { getFeature } from "#/config/features";

export default function SignInPrompt() {
	const feature = getFeature("factories");
	return (
		<div className="mx-auto max-w-md rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-8 text-center">
			<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
				Sign in to save factories
			</h2>
			<p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
				{feature.description}
			</p>
			<ul className="mt-4 space-y-1 text-left text-sm text-[var(--sea-ink-soft)]">
				{feature.planned.map((p) => (
					<li key={p}>• {p}</li>
				))}
			</ul>
			<div className="mt-6">
				<SignInButton mode="modal">
					<button
						type="button"
						className="rounded-lg bg-[var(--sea-ink)] px-4 py-2 text-sm font-medium text-[var(--surface)]"
					>
						Sign in
					</button>
				</SignInButton>
			</div>
		</div>
	);
}
