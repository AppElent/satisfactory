# Map feature — tiles & data

The map renders with Leaflet `CRS.Simple`. No tiles or resource-node data are
vendored (see the Phase 5 spec for the licensing rationale). Both are pluggable.

## Tile background

Set `VITE_MAP_TILE_URL` to a Leaflet tile URL template, e.g.:

```
VITE_MAP_TILE_URL="https://your-host/tiles/{z}/{x}/{y}.png"
```

- Unset → the map shows a neutral background (`var(--chip-bg)`), never broken tiles.
- Use a tile source you have the rights to. Satisfactory-Calculator's tiles are,
  per their terms, only for use on their own domain — do not hotlink or re-host them.
- The canvas is `CANVAS_SIZE` (`config.ts`) pixels square; the world extent is
  `WORLD_BOUNDS` centimetres. Align a real tile pyramid to those, adjusting the
  two constants in one place.

### Vertical orientation caveat

`CRS.Simple` increases latitude upward, while Satisfactory's world `y` increases
southward. Pins are internally consistent and drag round-trips correctly today,
but once a real tile image is aligned the map will look vertically mirrored versus
the game. Fix at that point by either inverting the y-pixel in `FactoryPinsLayer`
/`ResourceNodesLayer` (`[CANVAS_SIZE - py, px]`) or flipping `WORLD_BOUNDS.minY/maxY`.

## Resource nodes

`scripts/generate-data.ts` emits `src/data/generated/resource-nodes.json`. To
populate it, drop a JSON array at `data/vendor/resource-nodes.json` matching
`resourceNodeSchema` (`src/data/schema.ts`):

```json
[{ "id": "node-1", "x": 123000, "y": -45000, "type": "iron-ore", "purity": "normal" }]
```

`x`/`y` are world centimetres (origin at centre); `purity` is `impure | normal | pure`;
`type` is a resource item slug. Re-run `npm run generate-data`. Use a dataset you
have the rights to.
