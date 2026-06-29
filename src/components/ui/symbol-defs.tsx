/**
 * FICSIT HUD icon symbols. Mounted once (in AppShell). Icon references these
 * by `#i-<name>`. Verbatim from the design bundle's <defs>.
 */
export default function SymbolDefs() {
	return (
		<svg
			width="0"
			height="0"
			style={{ position: "absolute", pointerEvents: "none" }}
			aria-hidden="true"
		>
			<defs>
				<symbol
					id="i-factory"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M3 21h18M5 21V11l4 2.5V11l4 2.5V8l5 3v9M9 21v-3M15 21v-3" />
				</symbol>
				<symbol
					id="i-calc"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect x="6" y="3" width="12" height="18" rx="1.5" />
					<path d="M9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" />
				</symbol>
				<symbol
					id="i-data"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M5 6c0 1.66 3.13 3 7 3s7-1.34 7-3-3.13-3-7-3-7 1.34-7 3ZM5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" />
				</symbol>
				<symbol
					id="i-route"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="6" cy="19" r="2.5" />
					<circle cx="18" cy="5" r="2.5" />
					<path d="M8.5 19H15a3 3 0 0 0 3-3V7.5" />
				</symbol>
				<symbol
					id="i-map"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2ZM9 5v12M15 7v12" />
				</symbol>
				<symbol
					id="i-gauge"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 13l3-3M4.5 18a8 8 0 1 1 15 0" />
				</symbol>
				<symbol
					id="i-zap"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
				</symbol>
				<symbol
					id="i-plus"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 5v14M5 12h14" />
				</symbol>
				<symbol
					id="i-search"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="11" cy="11" r="7" />
					<path d="M20 20l-3.5-3.5" />
				</symbol>
				<symbol
					id="i-chevron"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M9 6l6 6-6 6" />
				</symbol>
				<symbol
					id="i-alert"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 3 2 20h20L12 3ZM12 10v4M12 17h.01" />
				</symbol>
				<symbol
					id="i-check"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="9" />
					<path d="M8.5 12l2.5 2.5 4.5-5" />
				</symbol>
				<symbol
					id="i-box"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 8l-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8" />
				</symbol>
				<symbol
					id="i-arrow"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M5 12h14M13 6l6 6-6 6" />
				</symbol>
				<symbol
					id="i-trash"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
				</symbol>
				<symbol
					id="i-cog"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="3.5" />
					<path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19.1 4.9l-2.1 2.1M7 17l-2.1 2.1M19.1 19.1 17 17M7 7 4.9 4.9" />
				</symbol>
				<symbol
					id="i-power"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 3v9M7.5 6.5a8 8 0 1 0 9 0" />
				</symbol>
				<symbol
					id="i-hex"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
				</symbol>
			</defs>
		</svg>
	);
}
