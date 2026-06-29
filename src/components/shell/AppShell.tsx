import type { ReactNode } from "react";
import SymbolDefs from "#/components/ui/symbol-defs";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-[var(--graphite-950)] text-[var(--text-primary)]">
			<SymbolDefs />
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<TopBar />
				<main
					className="flex-1 overflow-y-auto bg-[var(--graphite-950)]"
					style={{
						backgroundImage: "var(--tex-grid)",
						backgroundSize: "var(--tex-grid-size)",
					}}
				>
					{children}
				</main>
			</div>
		</div>
	);
}
