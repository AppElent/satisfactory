import {
	AuthCard,
	SignInForm,
	shouldShowTestLogin,
	TestLoginButton,
	useAuthConfig,
} from "@appelent/auth";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { env } from "#/env";

export const Route = createFileRoute("/sign-in")({
	head: () => ({ meta: [{ title: "Sign in — Satisfactory Planner" }] }),
	component: SignInPage,
});

function SignInPage() {
	const router = useRouter();
	const config = useAuthConfig();
	const onSuccess = () => router.navigate({ to: config.paths.afterAuth });
	return (
		<AuthCard title="Sign in" classNames={{ root: "min-h-[70vh]" }}>
			<SignInForm onSuccess={onSuccess} />
			{shouldShowTestLogin(env) && <TestLoginButton onSuccess={onSuccess} />}
		</AuthCard>
	);
}
