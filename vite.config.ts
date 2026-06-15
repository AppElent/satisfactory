import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	// Dev-only proxy for the Satisfactory-Calculator map tiles: they block
	// hotlinking by Referer, so we fetch them server-side (with a clean Referer)
	// and serve them same-origin to dodge the browser's hotlink/ORB blocking.
	server: {
		proxy: {
			"/sc-tiles": {
				target: "https://static.satisfactory-calculator.com",
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/sc-tiles/, "/imgMap/gameLayer/Stable"),
				headers: { Referer: "https://satisfactory-calculator.com/" },
			},
		},
	},
	plugins: [
		devtools(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
