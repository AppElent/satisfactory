import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Unmount React trees between tests so accumulated DOM doesn't cause
// "found multiple elements" / stale-match failures (Testing Library only
// auto-registers this when Vitest globals are enabled).
afterEach(() => {
	cleanup();
});
