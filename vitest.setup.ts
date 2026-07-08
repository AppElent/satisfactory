import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.cloud");
vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "pk_test_unit_tests");

function createMemoryStorage(): Storage {
	const values = new Map<string, string>();

	return {
		get length() {
			return values.size;
		},
		clear() {
			values.clear();
		},
		getItem(key: string) {
			return values.get(key) ?? null;
		},
		key(index: number) {
			return Array.from(values.keys())[index] ?? null;
		},
		removeItem(key: string) {
			values.delete(key);
		},
		setItem(key: string, value: string) {
			values.set(key, value);
		},
	};
}

const testStorage = createMemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
	configurable: true,
	value: testStorage,
});

if (typeof window !== "undefined") {
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		value: testStorage,
	});
}

// Unmount React trees between tests so accumulated DOM doesn't cause
// "found multiple elements" / stale-match failures (Testing Library only
// auto-registers this when Vitest globals are enabled).
afterEach(() => {
	cleanup();
});
