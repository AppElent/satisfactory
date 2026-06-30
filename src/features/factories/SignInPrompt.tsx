import { SignInButton } from "@clerk/clerk-react";
import { Button } from "#/components/ui/button";
import { getFeature } from "#/config/features";

export default function SignInPrompt() {
	const feature = getFeature("factories");
	return (
		<div className="mx-auto max-w-md rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] p-8 text-center shadow-[var(--bevel-top),var(--shadow-md)]">
			<h2 className="font-[var(--font-display)] text-[18px] font-bold uppercase tracking-[0.02em] text-[var(--text-primary)]">
				Sign in to save factories
			</h2>
			<p className="mt-2 text-sm text-[var(--text-secondary)]">
				{feature.description}
			</p>
			<ul className="mt-4 space-y-1 text-left text-sm text-[var(--text-muted)]">
				{feature.planned.map((p) => (
					<li key={p}>• {p}</li>
				))}
			</ul>
			<div className="mt-6">
				<SignInButton mode="modal">
					<Button type="button">Sign in</Button>
				</SignInButton>
			</div>
		</div>
	);
}
