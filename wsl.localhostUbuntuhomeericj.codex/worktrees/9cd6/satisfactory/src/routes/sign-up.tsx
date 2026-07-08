import { AuthCard, SignUpForm, useAuthConfig } from "@appelent/auth";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
	head: () => ({ meta: [{ title: "Create account — Satisfactory Planner" }] }),
	component: SignUpPage,
});

function SignUpPage() {
	const router = useRouter();
	const config = useAuthConfig();
	return (
		<AuthCard title="Create account" classNames={{ root: "min-h-[70vh]" }}>
			<SignUpForm
				onSuccess={() => router.navigate({ to: config.paths.afterAuth })}
			/>
		</AuthCard>
	);
}
