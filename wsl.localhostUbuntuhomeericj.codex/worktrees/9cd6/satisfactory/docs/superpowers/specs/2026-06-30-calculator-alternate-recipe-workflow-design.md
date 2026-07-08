# Calculator Alternate Recipe Workflow - Design

**Date:** 2026-06-30
**Status:** Approved design, pending implementation plan
**Goal:** Replace the production calculator's long alternate-recipe list with a polished workflow for presets, iterative post-solve review, and explicit preset saving.

## Context

The calculator currently stores the solver recipe policy as `ProblemSpec.allowedAlternates: string[]`. Standard recipes are always enabled; alternate recipes are enabled only when their slugs appear in that list. The current `RecipeOptions` UI is a searchable, scrollable list of every automatable alternate recipe, which becomes unwieldy for real planning.

The existing data model already has enough metadata to improve this without changing solver fundamentals:

- `recipes` expose `alternate`, `inMachine`, `products`, `ingredients`, and `producedIn`.
- `schematics` expose `tier`, `mam`, `alternate`, and `unlockRecipes`.
- `solution.recipes` identifies which recipe slugs the solver actually used.

The first implementation should keep shareable calculator URLs deterministic by continuing to encode the concrete `allowedAlternates` list.

## Decisions

1. Use a **hybrid workflow**:
   - compact left-rail summary for day-to-day calculator use,
   - a larger dialog for preset and long-list management,
   - a post-solve "Used alternates" review block for iterative tuning.
2. Keep solver input compatible with the current contract: the solver still receives `allowedAlternates`.
3. Track plan-local preset differences in UI state so users can start from a preset, exclude one alternate, solve again, and keep excluding newly used alternates.
4. "Save as preset" is always visible. It can create a new preset or overwrite an existing preset.
5. v1 custom presets are browser-local, but their shape should be compatible with later game-level Convex persistence.
6. Later game-level shared presets should be editable by game owners and editors; viewers can apply but not save.
7. URLs should encode the concrete alternate recipe set, not the preset name or local differences. Shared links must solve the same way even if another user lacks the named preset.

## User Experience

### Left rail summary

The `Alternate Recipes` panel becomes compact:

- active preset label, such as `Tier 1-8 + MAM`, `Custom current selection`, or a saved preset name,
- enabled alternate count,
- excluded count when a preset has plan-local removals,
- `Manage` button,
- always-visible `Save as preset` action.

Example summary:

`Tier 1-8 + MAM - 94 enabled - 2 excluded`

This panel should avoid rendering the full recipe list inline.

### Manage alternates dialog

The dialog is the replacement for the long-list picker. It should be wide enough for scanning and use FICSIT primitives (`Dialog`, `Tabs`, `Button`, `Input`, `Checkbox` or `Switch`).

It has three views:

- **Presets**
  Built-ins include `None`, `All alternates`, tier presets, `MAM alternates`, and combined tier + MAM presets. Custom browser presets appear below the built-ins. Selecting a preset applies it to the current plan only.

- **Recipes**
  Searchable grouped list of automatable alternate recipes. Grouping order is tier buckets, MAM, then `Other alternates` for unmapped metadata. Rows show recipe name, primary product, machine, and an enabled checkbox.

- **Changes**
  Shows plan-local differences from the selected base preset:
  excluded recipes, manually included recipes, and a reset-to-preset action.

The dialog edits the current plan-local alternate policy immediately, so closing it does not need a separate apply step. The current calculator state remains the source of truth.

### Save as preset

`Save as preset` is always reachable from the compact panel and may also appear in the dialog header/footer.

The action saves the current concrete `allowedAlternates` list, not the abstract base preset plus exceptions. The user can:

- create a new preset with a name,
- overwrite an existing saved preset.

In v1 this persists to browser storage. Later, when opened inside a game context, the same action can save to shared game presets.

### Used alternates review

When the solver returns an optimal solution, results show a small `Used alternates` block listing only alternate recipes present in `solution.recipes`.

Each used alternate is checked if currently allowed. Unchecking it:

- removes that slug from `allowedAlternates`,
- records it as excluded when it belonged to the active base preset,
- triggers the existing solver loop through state change.

If the next solve uses another alternate, it appears in the same block. Previously excluded alternates stay excluded across recalculations. This lets the user iteratively tune a plan:

1. start from a broad preset,
2. solve,
3. disable an undesirable used alternate,
4. re-solve,
5. repeat until the plan uses acceptable recipes,
6. save the final selection as a preset if desired.

## State Model

The UI should manage an active alternate policy around the existing concrete solver input:

```ts
type BuiltInAlternatePresetId =
  | "none"
  | "all"
  | "tier-4"
  | "tier-6"
  | "tier-8"
  | "mam"
  | "tier-8-mam";

interface AlternatePreset {
  id: string;
  name: string;
  recipeSlugs: string[];
  createdAt: number;
  updatedAt: number;
}

interface AlternatePolicyState {
  basePresetId?: string;
  allowedAlternates: string[];
  excludedAlternates: string[];
  includedAlternates: string[];
}
```

`allowedAlternates` remains the only value required by `ProblemSpec`. `excludedAlternates` and `includedAlternates` are UI bookkeeping so the panel and dialog can explain how the current selection differs from the selected preset.

If a plan is loaded from URL and its `allowedAlternates` list does not match a known preset, the UI should show `Custom current selection`.

## Preset Derivation

Built-in presets are derived from existing game data:

- automatable alternates are recipes where `alternate === true`, `inMachine === true`, and `producedIn.length > 0`;
- a recipe's unlock bucket is found by locating a schematic whose `unlockRecipes` contains that recipe slug;
- non-MAM schematics contribute to tier presets by `tier`;
- MAM schematics contribute to MAM presets;
- unmapped alternates remain selectable under `Other alternates` and are included only in `All alternates` unless a custom preset includes them.

Tier presets are cumulative, not exact-tier-only. For example, `tier-6` includes alternates unlocked in tiers 1 through 6.

## Persistence

### v1 browser-local

Custom presets use localStorage through a small storage module or hook, for example:

```ts
interface StoredAlternatePreset {
  id: string;
  name: string;
  recipeSlugs: string[];
  createdAt: number;
  updatedAt: number;
}
```

Malformed stored presets are ignored. If a stored preset references a recipe slug that no longer exists, drop that slug when applying or displaying the preset.

### Future game-shared presets

Future game-shared persistence should add a Convex table similar to:

```ts
gameAlternatePresets: {
  gameId: Id<"games">;
  name: string;
  recipeSlugs: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
```

Access rules:

- viewers can list and apply presets,
- editors and owners can create and overwrite presets,
- presets are scoped to a game so collaborators share the same recipe policy library.

The v1 storage API should be shaped so this later source can be swapped in without changing calculator components heavily.

## Components

Expected component/module boundaries:

- `alternate-presets.ts`
  Pure helpers for deriving built-ins, grouping recipes, applying presets, calculating included/excluded differences, and sanitizing saved presets.

- `useAlternatePresets.ts`
  Browser-local preset loading and saving, hidden behind an API that can later accept a game-scoped backend.

- `AlternateRecipePanel`
  Compact left-rail summary and actions.

- `AlternateRecipeDialog`
  Presets, Recipes, and Changes views.

- `UsedAlternatesReview`
  Post-solve iterative review block.

`CalculatorPage` should own the active `allowedAlternates` state and pass update callbacks down. The solver hook stays unchanged except for receiving the updated `allowedAlternates`.

## Error Handling

- Malformed browser presets are ignored.
- Missing custom presets fall back to `Custom current selection`.
- Missing recipe slugs in saved presets are dropped.
- Missing schematic metadata puts recipes in `Other alternates`.
- Solver infeasibility remains handled by existing result states.
- If browser storage is unavailable, custom preset saving should fail gracefully while built-in presets and plan-local editing continue to work.

## Testing

Use behavior-focused tests:

- Pure tests for deriving built-in presets from recipes/schematics.
- Pure tests for cumulative tier presets and MAM grouping.
- Pure tests for applying a preset, excluding a used alternate, manually including an alternate, and resetting to preset.
- Pure tests for saving current `allowedAlternates` as a preset and overwriting an existing preset.
- Component tests for:
  - compact panel counts and labels,
  - dialog search and grouping,
  - built-in preset selection,
  - save-as-preset create/overwrite flow,
  - `UsedAlternatesReview` unchecking a used alternate and preserving exclusions across recalculation.
- Existing plan codec tests should continue proving that concrete `allowedAlternates` round-trip through URL state.

## Out of Scope

- Convex-backed game-shared preset persistence in the first implementation.
- Ranking or recommending alternates based on efficiency.
- Showing full recipe comparison math in the dialog.
- Changing the solver formulation.
- Encoding preset names or preset deltas in plan URLs.

## Verification

- `npm run check`
- `npm run build`
- focused Vitest coverage for new pure helpers and React components
- manual calculator smoke:
  - apply a tier preset,
  - solve a target,
  - disable a used alternate,
  - confirm re-solve keeps the disabled alternate off,
  - disable a newly used alternate after the next solve,
  - save current selection as a new preset,
  - overwrite a saved preset,
  - reload and confirm browser-local presets survive.
