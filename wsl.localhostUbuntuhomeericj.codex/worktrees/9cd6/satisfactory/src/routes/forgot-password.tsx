import { AuthCard, ForgotPasswordForm, useAuthConfig } from "@appelent/auth";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
	head: () => ({ meta: [{ title: "Reset password — Satisfactory Planner" }] }),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const router = useRouter();
	const config = useAuthConfig();
	return (
		<AuthCard title="Reset password" classNames={{ root: "min-h-[70vh]" }}>
			<ForgotPasswordForm
				onSuccess={() => router.navigate({ to: config.paths.signIn })}
			/>
		</AuthCard>
	);
}
