import highsLoader from "highs";

type Highs = Awaited<ReturnType<typeof highsLoader>>;

let instance: Promise<Highs> | undefined;

/** True under Node and Vitest (which runs on Node even with the jsdom
 *  environment, where `window` is defined). Distinguishes a real browser. */
const isNode =
	typeof process !== "undefined" && Boolean(process.versions?.node);

/** Load HiGHS once. In a real browser, resolve the bundled wasm URL via Vite;
 *  under Node/Vitest let the loader find the wasm itself. */
export function loadHighs(): Promise<Highs> {
	if (!instance) {
		instance = isNode
			? highsLoader()
			: import("highs/runtime?url").then((m) =>
					highsLoader({ locateFile: () => m.default }),
				);
	}
	return instance;
}
