import { useCallback, useEffect, useMemo, useState } from "react";
import { type AlternatePreset, sanitizeSavedPreset } from "./alternate-presets";

const STORAGE_KEY = "satisfactory.alternatePresets.v1";

type SavePresetArgs =
	| { mode: "create"; name: string; recipeSlugs: string[] }
	| { mode: "overwrite"; id: string; name: string; recipeSlugs: string[] };

function makeId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readPresets(validRecipeSlugs: Set<string>): AlternatePreset[] {
	if (typeof localStorage === "undefined") return [];

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((value) => sanitizeSavedPreset(value, validRecipeSlugs))
			.filter((value): value is AlternatePreset => value !== undefined)
			.sort((a, b) => a.name.localeCompare(b.name));
	} catch {
		return [];
	}
}

function writePresets(presets: AlternatePreset[]): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function useAlternatePresets(validRecipeSlugs: Set<string>) {
	const validRecipeKey = [...validRecipeSlugs].sort().join("\0");
	const [customPresets, setCustomPresets] = useState<AlternatePreset[]>(() =>
		readPresets(validRecipeSlugs),
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: validRecipeKey captures the Set contents; depending on the Set object can loop when callers construct it inline.
	useEffect(() => {
		setCustomPresets(readPresets(validRecipeSlugs));
	}, [validRecipeKey]);

	const savePreset = useCallback(
		(args: SavePresetArgs): AlternatePreset => {
			const now = Date.now();
			const base: AlternatePreset = {
				id: args.mode === "overwrite" ? args.id : makeId(),
				name: args.name.trim() || "Untitled preset",
				recipeSlugs: args.recipeSlugs.filter((slug) =>
					validRecipeSlugs.has(slug),
				),
				createdAt: now,
				updatedAt: now,
			};
			const sanitized = sanitizeSavedPreset(base, validRecipeSlugs) ?? {
				...base,
				recipeSlugs: [],
			};

			setCustomPresets((current) => {
				const existing = current.find((preset) => preset.id === sanitized.id);
				const next =
					args.mode === "overwrite" && existing
						? current.map((preset) =>
								preset.id === sanitized.id
									? { ...sanitized, createdAt: existing.createdAt }
									: preset,
							)
						: [...current, sanitized];
				const sorted = next.sort((a, b) => a.name.localeCompare(b.name));
				writePresets(sorted);
				return sorted;
			});

			return sanitized;
		},
		[validRecipeSlugs],
	);

	return useMemo(
		() => ({ customPresets, savePreset }),
		[customPresets, savePreset],
	);
}
