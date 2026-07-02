import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

type Tone = "error" | "info";
interface Toast {
	id: number;
	message: string;
	tone: Tone;
}
interface ToastApi {
	toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within a ToastProvider");
	return ctx;
}

let nextId = 0;

export default function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = useCallback((message: string, tone: Tone = "error") => {
		const id = nextId++;
		setToasts((prev) => [...prev, { id, message, tone }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	return (
		<ToastContext.Provider value={{ toast }}>
			{children}
			<div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
				{toasts.map((t) => (
					<output
						key={t.id}
						className={`pointer-events-auto rounded-[var(--radius-md)] border px-4 py-2 text-sm shadow-lg ${
							t.tone === "error"
								? "border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--red-400)]"
								: "border-[var(--border-default)] bg-[var(--bg-inset)] text-[var(--text-primary)]"
						}`}
					>
						{t.message}
					</output>
				))}
			</div>
		</ToastContext.Provider>
	);
}
