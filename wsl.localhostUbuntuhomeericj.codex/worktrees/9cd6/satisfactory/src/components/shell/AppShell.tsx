import type { ReactNode } from "react";
import SymbolDefs from "#/components/ui/symbol-defs";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-[var(--graphite-950)] text-[var(--text-primary)]">
			<SymbolDefs />
			<Sidebar variant="full" className="hidden lg:flex" />
			<Sidebar variant="rail" className="hidden md:flex lg:hidden" />
			<div className="flex min-w-0 flex-1 flex-col">
				<TopBar />
				<main
					className="flex-1 overflow-y-auto bg-[var(--graphite-950)] pb-[60px] md:pb-0"
					style={{
						backgroundImage: "var(--tex-grid)",
						backgroundSize: "var(--tex-grid-size)",
					}}
				>
					{children}
				</main>
				<BottomNav />
			</div>
		</div>
	);
}
