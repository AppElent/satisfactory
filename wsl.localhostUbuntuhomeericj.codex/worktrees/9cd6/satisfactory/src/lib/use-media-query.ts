import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook: returns `false` until mounted (matching what the
 * server rendered, so there's no hydration mismatch), then tracks the query
 * live via `matchMedia`.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(query);
		setMatches(mql.matches);
		const onChange = () => setMatches(mql.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
