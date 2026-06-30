import { AuthConfigProvider, type AuthConfig } from "@appelent/auth";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import AppShell from "../components/shell/AppShell";
import ToastProvider from "../components/Toast";
import ClerkProvider from "../integrations/clerk/provider";
import ConvexProvider from "../integrations/convex/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const authConfig: AuthConfig = {
	appName: "Satisfactory Planner",
	paths: {
		signIn: "/sign-in",
		signUp: "/sign-up",
		forgotPassword: "/forgot-password",
		afterAuth: "/",
		account: "/account",
	},
	features: { forgotPassword: true },
	socialProviders: [],
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Satisfactory Planner" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[var(--accent-soft)]">
				<ClerkProvider>
					<AuthConfigProvider config={authConfig}>
						<ConvexProvider>
							<ToastProvider>
								<AppShell>{children}</AppShell>
							</ToastProvider>
							<TanStackDevtools
								config={{ position: "bottom-right" }}
								plugins={[
									{
										name: "Tanstack Router",
										render: <TanStackRouterDevtoolsPanel />,
									},
									TanStackQueryDevtools,
								]}
							/>
						</ConvexProvider>
					</AuthConfigProvider>
				</ClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}
