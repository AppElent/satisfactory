# Map feature — tiles & data

The map uses the Satisfactory-Calculator interactive-map coordinate system so
its tile pyramid, the resource-node dataset and our factory pins all share one
space. Game coordinates are centimetres (origin at centre).

## Tiles

`config.ts` `TILE_URL` defaults to SC's game-map tiles:

```
https://static.satisfactory-calculator.com/imgMap/gameLayer/Stable/{z}/{x}/{y}.png
```

Set `VITE_MAP_TILE_URL` to override (self-hosted tiles, the realistic layer,
etc.). Tiles are served for native zoom 3–8.

**Hotlink protection:** SC returns 403 for tile requests with a foreign
`Referer`, and browsers block the cross-origin images (ORB). So the default
`TILE_URL` points at the same-origin path `/sc-tiles/{z}/{x}/{y}.png`, proxied
to SC server-side. The proxy is configured for **dev** in `vite.config.ts`
(`server.proxy`, with a clean `Referer`). **Production** (Cloudflare Workers)
needs an equivalent `/sc-tiles` route, or set `VITE_MAP_TILE_URL` to a
self-hosted tile pyramid — otherwise the map falls back to the neutral
background in the deployed build.

## Projection

`config.ts` holds the mapping bounds (cm, with SC's border offset), the raster
size (40960 px) and the reference zoom. `coords.ts` ports SC's
`convertToRasterCoordinates` + `unproject` as `gameToLatLng` / `latLngToGame`,
so a game position lands exactly where SC's tiles expect it (verified by the
round-trip + known-node tests in `coords.test.ts`). To re-align after a future
map/tile update, adjust the bound constants in one place.

## Resource nodes

`scripts/vendor-resource-nodes.ts` (`npm run vendor-nodes`) fetches the node
positions + purity from SC's interactive-map JSON and writes a committed
snapshot to `data/vendor/resource-nodes.json` (`{ id, x, y, type, purity }`,
`type` mapped to our item slugs). `npm run generate-data` validates it into
`src/data/generated/resource-nodes.json`. Re-run both to refresh after a game
update.
