import type { ProblemSpec } from "./solver";

/** base64url(JSON) of the spec — compact, opaque, URL-safe. */
export function encodePlan(spec: ProblemSpec): string {
	const json = JSON.stringify(spec);
	const b64 = btoa(unescape(encodeURIComponent(json)));
	return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePlan(encoded: string): ProblemSpec | undefined {
	if (!encoded) return undefined;
	try {
		const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
		const json = decodeURIComponent(escape(atob(b64)));
		const parsed = JSON.parse(json);
		// Minimal shape validation — must look like a ProblemSpec.
		if (
			!parsed ||
			!Array.isArray(parsed.targets) ||
			!Array.isArray(parsed.allowedAlternates) ||
			(parsed.mode !== undefined &&
				parsed.mode !== "produce" &&
				parsed.mode !== "maximize")
		) {
			return undefined;
		}
		return parsed as ProblemSpec;
	} catch {
		return undefined;
	}
}
