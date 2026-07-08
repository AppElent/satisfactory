import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

class FakeMediaQueryList extends EventTarget {
	matches: boolean;
	media: string;

	constructor(query: string, matches: boolean) {
		super();
		this.media = query;
		this.matches = matches;
	}

	setMatches(next: boolean) {
		this.matches = next;
		this.dispatchEvent(new Event("change"));
	}
}

function stubMatchMedia(initialMatches: boolean) {
	const mql = new FakeMediaQueryList("(min-width: 1024px)", initialMatches);
	vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
	return mql;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useMediaQuery", () => {
	it("reflects a matching query after mount", () => {
		stubMatchMedia(true);
		const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
		expect(result.current).toBe(true);
	});

	it("reflects a non-matching query after mount", () => {
		stubMatchMedia(false);
		const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
		expect(result.current).toBe(false);
	});

	it("updates when the media query's change event fires", () => {
		const mql = stubMatchMedia(false);
		const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
		expect(result.current).toBe(false);
		act(() => {
			mql.setMatches(true);
		});
		expect(result.current).toBe(true);
	});
});
