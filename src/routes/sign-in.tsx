import { AuthCard, SignInForm, useAuthConfig } from "@appelent/auth";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
	head: () => ({ meta: [{ title: "Sign in — Satisfactory Planner" }] }),
	component: SignInPage,
});

function SignInPage() {
	const router = useRouter();
	const config = useAuthConfig();
	return (
		<AuthCard title="Sign in" classNames={{ root: "min-h-[70vh]" }}>
			<SignInForm
				onSuccess={() => router.navigate({ to: config.paths.afterAuth })}
			/>
		</AuthCard>
	);
}
