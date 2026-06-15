import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";

// Custom Cloudflare Worker entry: serve the Satisfactory-Calculator map tiles
// from our own origin (SC blocks hotlinking by Referer, and browsers block the
// cross-origin images), then delegate everything else to the TanStack handler.
const startFetch = createStartHandler(defaultStreamHandler) as (
	request: Request,
	...rest: unknown[]
) => Promise<Response>;

const TILE_PREFIX = "/sc-tiles/";
const SC_TILE_BASE =
	"https://static.satisfactory-calculator.com/imgMap/gameLayer/Stable/";

export default {
	async fetch(request: Request, ...rest: unknown[]): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname.startsWith(TILE_PREFIX)) {
			const upstream = SC_TILE_BASE + pathname.slice(TILE_PREFIX.length);
			const res = await fetch(upstream, {
				headers: { Referer: "https://satisfactory-calculator.com/" },
			});
			if (!res.ok) return new Response(null, { status: res.status });
			return new Response(res.body, {
				status: 200,
				headers: {
					"Content-Type": "image/png",
					"Cache-Control": "public, max-age=86400",
				},
			});
		}
		return startFetch(request, ...rest);
	},
};
