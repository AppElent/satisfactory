import viteReact from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [viteReact()],
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		exclude: [
			...configDefaults.exclude,
			"**/.claude/**",
			"**/node_modules_OLD/**",
			"**/node_modules.*/**",
		],
	},
});
