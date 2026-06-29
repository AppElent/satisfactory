# FICSIT Page Re-skins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the FICSIT visual language to all 6 page types using the Spec 1 primitives, build the new Overview dashboard at `/`, and remove the legacy coastal-var bridge — with no feature-logic changes.

**Architecture:** Each page keeps its existing data flow, state, and handlers; only presentation changes — ad-hoc cards/markup become `Panel`/`Stat`/`Tabs`/`Badge`/`Switch`/`Progress`/`Button`/`Input`/`Icon` from `src/components/ui/`, and coastal CSS vars become FICSIT tokens. A new `OverviewPage` replaces the marketing landing. After all pages migrate, the bridge block is deleted from `styles.css`.

**Tech Stack:** TanStack Start + React 19, Tailwind v4, FICSIT tokens + `src/components/ui/*` primitives, Convex, `@xyflow`/elk (calculator graph), Leaflet (map), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-29-ficsit-page-reskins-design.md`
**Branch:** `ficsit-page-reskins` (spec already committed there).

---

## Conventions for EVERY task

1. **Preserve behavior.** Before editing a component, read it. Keep every prop, state hook, handler, query/mutation, and conditional branch. Change only JSX structure/classes (and small presentational helpers). If a change would alter behavior, STOP and report.
2. **Primitives over markup.** Import from `#/components/ui/...`: `Panel`, `Stat`, `Tabs` (+ `TabItem`), `Badge`, `Switch`, `Checkbox`, `Progress`, `Button`, `IconButton`, `Input`, `Icon`. Don't re-implement these inline.
3. **Tokens over coastal vars.** Replace `var(--sea-ink)`→`var(--text-primary)`, `var(--sea-ink-soft)`→`var(--text-muted)`, `var(--line)`→`var(--border-default)`, `var(--chip-bg)`/`var(--surface)`→`var(--surface-card)` or `var(--bg-inset)`, accent→`var(--accent)`. Numeric readouts: `font-[var(--font-mono)]`. Section/display headers: `font-[var(--font-display)] uppercase tracking-[0.04em]`.
4. **Design reference:** the source mock is `FICSIT Planner.dc.html`; line ranges are cited per task. Match its layout/spacing/colors; adapt where the real feature has more controls than the mock.
5. **After each task:** `npm run check` (new/changed files clean — the pre-existing `src/features/factories/MachineEditor.tsx` biome error is the only acceptable leftover until Task 5 touches it), `npm run typecheck` (PASS), and run the affected tests. Commit with the given message. If biome reformats, fold it into the commit.
6. **Tests:** these are re-skins, so most tasks add no new tests. Where an existing test asserts on old markup/classes, UPDATE the assertion to the new structure — keep the behavioral coverage, don't delete tests. Each task lists the tests to run.

---

## Task 1: Shared status/efficiency helper

**Files:**
- Create: `src/features/factories/status-style.ts`
- Test: `src/features/factories/status-style.test.ts`

The design colors efficiency and status consistently (design script lines 603–613). Extract this once for reuse by Overview, Factories, and Factory detail.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { effProgressTone, statusBadgeTone } from "./status-style";

describe("status-style", () => {
  it("maps efficiency to progress tones", () => {
    expect(effProgressTone(96)).toBe("success");
    expect(effProgressTone(85)).toBe("warning");
    expect(effProgressTone(50)).toBe("danger");
  });

  it("maps factory status to badge tones", () => {
    expect(statusBadgeTone("operational")).toBe("success");
    expect(statusBadgeTone("building")).toBe("warning");
    expect(statusBadgeTone("paused")).toBe("neutral");
    expect(statusBadgeTone("planned")).toBe("info");
  });
});
```

- [ ] **Step 2: Run it, confirm FAIL**

Run: `npm test -- src/features/factories/status-style.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `src/features/factories/status-style.ts`**

```ts
import type { Doc } from "#convex/_generated/dataModel";

type Status = Doc<"factories">["status"];
type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";
type ProgressTone = "success" | "warning" | "danger";

/** Efficiency % → Progress/text tone (design: >=95 green, >=80 yellow, else red). */
export function effProgressTone(pct: number): ProgressTone {
  if (pct >= 95) return "success";
  if (pct >= 80) return "warning";
  return "danger";
}

/** Efficiency % → readout color token. */
export function effColor(pct: number): string {
  if (pct >= 95) return "var(--green-400)";
  if (pct >= 80) return "var(--yellow-400)";
  return "var(--red-400)";
}

const STATUS_TONE: Record<Status, BadgeTone> = {
  operational: "success",
  building: "warning",
  paused: "neutral",
  planned: "info",
};

export function statusBadgeTone(status: Status): BadgeTone {
  return STATUS_TONE[status];
}

export const STATUS_LABEL: Record<Status, string> = {
  operational: "Operational",
  building: "Building",
  paused: "Paused",
  planned: "Planned",
};
```

- [ ] **Step 4: Run test, confirm PASS.**
- [ ] **Step 5: Commit**

```bash
git add src/features/factories/status-style.ts src/features/factories/status-style.test.ts
git commit -m "feat: shared FICSIT status/efficiency style helper"
```

---

## Task 2: Overview dashboard (NEW, replaces `/`)

**Files:**
- Create: `src/features/overview/OverviewPage.tsx`
- Modify: `src/routes/index.tsx`

Design reference: lines 131–213. Static placeholder data shaped for a later real-data swap.

- [ ] **Step 1: Create `src/features/overview/OverviewPage.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { Icon } from "#/components/ui/icon";
import { Panel } from "#/components/ui/panel";
import { Progress } from "#/components/ui/progress";
import { Stat } from "#/components/ui/stat";

interface OvFactory {
  name: string;
  outputs: string;
  power: string;
  eff: number | null;
}
interface OvAlert {
  tag: string;
  color: string;
  text: string;
}

// Placeholder data (Spec 2: static; shaped for a later real-data swap).
const FACTORIES: OvFactory[] = [
  { name: "Northern Steel Works", outputs: "Steel Beam · Steel Pipe · Encased Beam", power: "186 MW", eff: 94 },
  { name: "Plastic Refinery Delta", outputs: "Plastic · Rubber", power: "142 MW", eff: 88 },
  { name: "Modular Frame Assembly", outputs: "Modular Frame · Reinforced Plate", power: "— MW", eff: null },
  { name: "Copper Sheet Array", outputs: "Copper Sheet", power: "64 MW", eff: 100 },
  { name: "Rotor Line 07", outputs: "Rotor · Screw", power: "0 MW", eff: null },
  { name: "Computer Manufactory", outputs: "Computer", power: "128 MW", eff: 76 },
];
const ALERTS: OvAlert[] = [
  { tag: "Power Fault", color: "var(--red-400)", text: "Grid 2 tripped at 04:12 — Rotor Line 07 lost power and is now offline." },
  { tag: "Input Starved", color: "var(--yellow-400)", text: "Computer Manufactory running at 76% — Circuit Board supply below demand." },
  { tag: "Milestone", color: "var(--green-400)", text: "Tier 6 complete: Pipeline Engineering Mk.II unlocked at the HUB." },
];

function effFillTone(eff: number) {
  return eff >= 95 ? "success" : eff >= 80 ? "warning" : "danger";
}
function effColor(eff: number) {
  return eff >= 95 ? "var(--green-400)" : eff >= 80 ? "var(--yellow-400)" : "var(--red-400)";
}

export default function OverviewPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-[22px] px-7 pb-[60px] pt-[26px]">
      <div className="grid grid-cols-4 gap-4">
        <Panel topRail className="px-5 py-[18px]">
          <Stat label="Total Power Draw" value="420.6" unit="MW" delta="+18.2 MW vs plan" deltaTone="positive" />
        </Panel>
        <Panel className="px-5 py-[18px]">
          <Stat label="Network Throughput" value="1.34" unit="k/min" delta="+96 items/min" deltaTone="positive" />
        </Panel>
        <Panel className="px-5 py-[18px]">
          <Stat label="Factories Online" value="4/6" unit="sites" delta="2 offline" deltaTone="neutral" />
        </Panel>
        <Panel className="px-5 py-[18px]">
          <Stat label="Avg Efficiency" value="89" unit="%" delta="-3% vs plan" deltaTone="danger" />
        </Panel>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] items-start gap-[22px]">
        <Panel
          title="Factory Network"
          headerAction={
            <Link to="/factories" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--orange-400)] no-underline">
              View all <Icon name="chevron" size={14} />
            </Link>
          }
        >
          <div className="flex flex-col">
            {FACTORIES.map((f) => (
              <div key={f.name} className="grid grid-cols-[minmax(0,1.7fr)_70px_minmax(90px,1fr)_16px] items-center gap-3.5 border-t border-[var(--border-subtle)] px-5 py-3.5 first:border-t-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: f.eff == null ? "var(--graphite-400)" : effColor(f.eff), boxShadow: f.eff == null ? "none" : `0 0 8px ${effColor(f.eff)}` }} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{f.name}</div>
                    <div className="truncate text-[11px] text-[var(--text-muted)]">{f.outputs}</div>
                  </div>
                </div>
                <div className="text-right font-[var(--font-mono)] text-[12px] text-[var(--text-secondary)]">{f.power}</div>
                <div className="flex items-center gap-2.5">
                  {f.eff == null ? (
                    <div className="h-[7px] flex-1 rounded-[2px] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)]" />
                  ) : (
                    <Progress className="flex-1" value={f.eff} tone={effFillTone(f.eff)} />
                  )}
                  <span className="w-[34px] text-right font-[var(--font-mono)] text-[12px]" style={{ color: f.eff == null ? "var(--text-disabled)" : effColor(f.eff) }}>
                    {f.eff == null ? "—" : `${f.eff}%`}
                  </span>
                </div>
                <Icon name="chevron" size={16} className="text-[var(--text-disabled)]" />
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col gap-[22px]">
          <Panel
            title="Alerts"
            headerAction={<span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">{ALERTS.length}</span>}
          >
            <div className="flex flex-col">
              {ALERTS.map((a) => (
                <div key={a.tag} className="flex gap-3 border-t border-[var(--border-subtle)] px-5 py-3.5 first:border-t-0">
                  <span className="mt-[5px] h-[7px] w-[7px] flex-none rounded-full" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                  <div className="min-w-0">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: a.color }}>{a.tag}</div>
                    <div className="text-[13px] leading-[1.4] text-[var(--text-secondary)]">{a.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel hazard className="px-5 py-[18px]">
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Active Milestone</div>
            <div className="mt-[7px] font-[var(--font-display)] text-[19px] font-bold uppercase leading-[1.1] tracking-[0.03em] text-[var(--text-primary)]">
              Tier 7 — Bauxite Refinement
            </div>
            <div className="mb-[7px] mt-[15px] flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">HUB Progress</span>
              <span className="font-[var(--font-mono)] text-[13px] text-[var(--orange-400)]">68%</span>
            </div>
            <Progress value={68} tone="accent" glow className="h-2.5" />
            <div className="mt-2.5 font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">
              Needs: 4× Adaptive Control Unit · 50× Modular Frame
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/routes/index.tsx` to render OverviewPage**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import OverviewPage from "#/features/overview/OverviewPage";

export const Route = createFileRoute("/")({
  component: OverviewPage,
});
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck` → PASS. Run: `npm test` → all green (the old index had no test; nothing should break).

- [ ] **Step 4: Commit**

```bash
git add src/features/overview/OverviewPage.tsx src/routes/index.tsx
git commit -m "feat: FICSIT Overview dashboard at / (placeholder data)"
```

---

## Task 3: Calculator re-skin

**Files (read each, preserve all logic):**
- Modify: `src/features/calculator/CalculatorPage.tsx`, `CalculatorControls.tsx`, `TargetEditor.tsx`, `AvailableInputsEditor.tsx`, `RecipeOptions.tsx`, `ResultTabs.tsx`
- Modify (graph node styling only): `src/features/calculator/ProductionGraph.tsx`
- Tests to run: `npm test -- src/features/calculator/`

Design reference: lines 215–358 (two-column 332px/1fr layout).

- [ ] **Step 1: Re-skin `CalculatorControls.tsx` into segmented toggles**

Keep the props/handlers (`mode`/`onModeChange`/`weighting`/`onWeightingChange`) and `WEIGHTING_PRESETS` export exactly. Replace the JSX with FICSIT segmented controls (inset well + sliding active fill, design lines 219–244). Full new component body (keep the imports/interface/`MODES`/`WEIGHTINGS`/`WEIGHTING_PRESETS` above it unchanged):

```tsx
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className="flex gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-[3px] shadow-[var(--bevel-inset)]">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`relative h-8 flex-1 rounded-[2px] text-[12px] font-semibold uppercase tracking-[0.06em] ${
                active ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--bevel-top),var(--shadow-sm)]" : "bg-transparent text-[var(--text-muted)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CalculatorControls({ mode, onModeChange, weighting, onWeightingChange }: CalculatorControlsProps) {
  return (
    <div className="flex flex-col gap-[18px]">
      <Segmented label="Solve Mode" value={mode} options={MODES} onChange={onModeChange} />
      <Segmented label="Resource Weighting" value={weighting} options={WEIGHTINGS} onChange={onWeightingChange} />
    </div>
  );
}
```

(Adjust `MODES`/`WEIGHTINGS` `label`s if you want the shorter design copy — optional. The `value`s MUST stay `produce`/`maximize`/`balanced`/`minimize-ore`.)

- [ ] **Step 2: Re-skin `CalculatorPage.tsx` layout**

Keep ALL state/effects/`useSolver`/`spec`/URL-mirroring untouched. Change only the returned JSX: wrap in the design's container, put the left controls into `Panel`s, and the right side into `Stat` cards + a results `Panel`. Replace the `return (...)`:

```tsx
return (
  <div className="mx-auto grid max-w-[1320px] grid-cols-[332px_1fr] items-start gap-6 px-7 pb-[60px] pt-6">
    <div className="flex flex-col gap-[18px]">
      <Panel className="p-[18px]">
        <CalculatorControls mode={mode} onModeChange={setMode} weighting={weighting} onWeightingChange={setWeighting} />
      </Panel>
      <Panel title="Targets">
        <div className="p-4">
          <TargetEditor targets={targets} onChange={setTargets} />
        </div>
      </Panel>
      <Panel title="Available Inputs">
        <div className="p-4">
          <AvailableInputsEditor inputs={availableInputs} onChange={setAvailableInputs} />
        </div>
      </Panel>
      <Panel title="Alternate Recipes">
        <div className="p-4">
          <RecipeOptions allowedAlternates={allowedAlternates} onChange={setAllowedAlternates} />
        </div>
      </Panel>
    </div>

    <div className="flex min-w-0 flex-col gap-[18px]">
      {targets.length === 0 ? (
        <Panel className="p-8">
          <p className="text-center text-[13px] text-[var(--text-muted)]">
            {mode === "maximize"
              ? "Add a target item and an available input to maximize output."
              : "Add a target item to plan a production line."}
          </p>
        </Panel>
      ) : solving && !solution ? (
        <Panel className="p-8"><p className="text-center text-[13px] text-[var(--text-muted)]">Solving…</p></Panel>
      ) : solution ? (
        <>
          {solution.status !== "infeasible" && (
            <div className="grid grid-cols-4 gap-3.5">
              <Panel topRail className="px-[18px] py-[15px]"><Stat label="Total Power" value={formatPower(solution.power).replace(/\s*MW$/, "")} unit="MW" /></Panel>
              <Panel className="px-[18px] py-[15px]"><Stat label="Machines" value={String(solution.recipes.reduce((s, u) => s + Math.ceil(u.machines), 0))} /></Panel>
              <Panel className="px-[18px] py-[15px]"><Stat label={solution.rawInputs[0] ? name(solution.rawInputs[0].item) : "Raw inputs"} value={solution.rawInputs[0] ? formatNumber(solution.rawInputs[0].rate) : "0"} unit="/min" /></Panel>
              <Panel className="px-[18px] py-[15px]"><Stat label="Byproducts" value={String(solution.byproducts.length)} /></Panel>
            </div>
          )}
          <Panel>
            <div className="flex items-center justify-between gap-4 px-[18px] pt-2.5">
              {/* ResultTabs renders its own tab bar; the Save button sits beside it */}
              <div className="min-w-0 flex-1"><ResultTabs solution={solution} /></div>
            </div>
            <div className="flex justify-end px-[18px] pb-3">
              <SaveAsFactoryButton spec={spec} solution={solution} game={roundTrip.game} factory={roundTrip.factory} />
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  </div>
);
```

Add imports at the top of `CalculatorPage.tsx`: `import { Panel } from "#/components/ui/panel";`, `import { Stat } from "#/components/ui/stat";`, `import { formatNumber, formatPower } from "#/lib/format";`, and a local `name` helper (or import the data getters): add `import { getItem } from "#/data";` and `const name = (s: string) => getItem(s)?.name ?? s;`. (If `ResultTabs` already shows the Save button placement awkwardly, it's fine — the button stays functional.)

> NOTE: If wrapping `ResultTabs` inside the `Panel` double-renders a tab bar oddly, that's acceptable for this task — the goal is the FICSIT container + stats. `ResultTabs` internal restyle is Step 3.

- [ ] **Step 3: Re-skin `ResultTabs.tsx`**

Preserve all logic (the `TABS`, `tab` state, `solution` branches, `ProductionGraph` lazy import, `FlowList`). Convert presentation to FICSIT: use the `Tabs` primitive for the tab bar (map `TABS` → `items`), and restyle the rows/cards (`var(--line)`→`var(--border-default)`, `var(--chip-bg)`→`var(--bg-inset)`, `font-semibold` numbers → `font-[var(--font-mono)]`, accent arrows/values → `var(--orange-400)`). Keep tab labels and their content/logic. The infeasible state becomes a `Panel`-styled block (danger text). Build the `items` as `TABS.map((t) => ({ id: t, label: t }))` and drive `value={tab}` / `onChange={(id) => setTab(id as Tab)}`.

- [ ] **Step 4: Re-skin `TargetEditor.tsx`, `AvailableInputsEditor.tsx`, `RecipeOptions.tsx`**

Read each; preserve props/handlers. Apply FICSIT: target/input rows as inset wells (`bg-[var(--bg-inset)] border border-[var(--border-default)]`), the item-add control as a `Button` (size sm) with `<Icon name="plus" size={12} />`, numeric rate fields as `Input`, mono rates in `--orange-400`. In `RecipeOptions`, render each alternate as a row with a `Switch` (`checked`/`onCheckedChange`) wired to the existing add/remove-from-`allowedAlternates` handler — keep that toggle logic identical, just swap the control to `Switch`.

- [ ] **Step 5: Re-skin `ProductionGraph.tsx` nodes (styling only)**

Keep the xyflow/elk graph logic, layout, and data mapping. Restyle node/edge appearance to FICSIT (node = inset well `bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)]`, title row with item name, mono rate in `--orange-400`, building×count in muted; output/target node uses `accent-soft` bg + accent border + `--glow-accent-strong`; edges in `--graphite-500`/`--orange-600`). Do not change which nodes/edges are produced.

- [ ] **Step 6: Verify + commit**

Run: `npm test -- src/features/calculator/` → green (update any assertion that referenced old classes/markup; keep behavioral checks). Run: `npm run typecheck` → PASS. `npm run check` clean.

```bash
git add src/features/calculator
git commit -m "feat: re-skin Calculator into FICSIT layout (logic unchanged)"
```

---

## Task 4: Factories list re-skin

**Files:**
- Modify: `src/features/factories/FactoriesPage.tsx`, `FactoryCard.tsx`, `SignInPrompt.tsx`
- Tests: `npm test -- src/features/factories/`

Design reference: lines 360–396. Keep all Convex queries, `useGameId`, `creating` state, `ManualFactoryForm`, `SummaryCard` wiring.

- [ ] **Step 1: Re-skin `FactoryCard.tsx`**

Preserve props (`factory`, `gameId`), `outputs`/`eff` derivation, and the `Link`. Use `Badge` + the Task 1 helper. Full new return (keep the imports + add `Badge`, `Progress`, the helper):

```tsx
import { Link } from "@tanstack/react-router";
import EntityIcon from "#/components/EntityIcon";
import { Badge } from "#/components/ui/badge";
import { Progress } from "#/components/ui/progress";
import { getItem } from "#/data";
import { formatNumber } from "#/lib/format";
import type { Doc, Id } from "#convex/_generated/dataModel";
import { efficiency } from "./derive";
import { plannedOutputs } from "./factory-view";
import { STATUS_LABEL, effColor, effProgressTone, statusBadgeTone } from "./status-style";

export default function FactoryCard({ factory, gameId }: { factory: Doc<"factories">; gameId: Id<"games"> }) {
  const outputs = plannedOutputs(factory.production);
  const eff = factory.actuals ? efficiency(outputs, factory.actuals) : undefined;
  const effPct = eff ? Math.round(eff.aggregate * 100) : null;
  return (
    <Link
      to="/g/$gameId/factories/$factoryId"
      params={{ gameId, factoryId: factory._id }}
      className="flex flex-col gap-3.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 no-underline shadow-[var(--bevel-top),var(--shadow-md)] hover:border-[var(--border-accent)]"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="font-[var(--font-display)] text-[17px] font-bold uppercase leading-[1.1] tracking-[0.02em] text-[var(--text-primary)]">{factory.name}</div>
        </div>
        <Badge tone={statusBadgeTone(factory.status)} dot>{STATUS_LABEL[factory.status]}</Badge>
      </div>
      <div className="flex flex-col gap-[7px] border-t border-[var(--border-subtle)] pt-3">
        {outputs.slice(0, 3).map((o) => {
          const item = getItem(o.item);
          return (
            <div key={o.item} className="flex items-center gap-2.5 text-[13px]">
              <EntityIcon icon={item?.icon} name={item?.name ?? o.item} size={15} />
              <span className="flex-1 truncate text-[var(--text-secondary)]">{item?.name ?? o.item}</span>
              <span className="font-[var(--font-mono)] text-[var(--orange-400)]">{formatNumber(o.rate)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">/min</span>
            </div>
          );
        })}
      </div>
      {effPct != null && (
        <div className="flex items-center gap-2.5 pt-1.5">
          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Eff</span>
          <Progress className="flex-1" value={effPct} tone={effProgressTone(effPct)} />
          <span className="font-[var(--font-mono)] text-[13px]" style={{ color: effColor(effPct) }}>{effPct}%</span>
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Re-skin `FactoriesPage.tsx`**

Keep the `FactoriesList`/auth-gate structure and all queries/state. Restyle: container `mx-auto max-w-[1280px] px-7 pb-[60px] pt-6 flex flex-col gap-5`; header with site-count line (`<Icon name="factory" />` + count) and a `Button` "New Factory"; loading/empty states inside a `Panel`/muted text; the grid stays `grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3`. Replace the raw `<button>` with `<Button onClick={() => setCreating(true)}>New Factory</Button>`. Replace coastal text classes with FICSIT tokens. Keep `SummaryCard`/`ManualFactoryForm` mounts.

- [ ] **Step 3: Re-skin `SignInPrompt.tsx`** to FICSIT surfaces/text (read it; preserve any sign-in button/Clerk wiring; swap classes/tokens).

- [ ] **Step 4: Verify + commit**

Run: `npm test -- src/features/factories/` → green (update markup assertions if any). `npm run typecheck` PASS, `npm run check` clean.

```bash
git add src/features/factories/FactoriesPage.tsx src/features/factories/FactoryCard.tsx src/features/factories/SignInPrompt.tsx
git commit -m "feat: re-skin Factories list into FICSIT"
```

---

## Task 5: Factory detail re-skin

**Files:**
- Modify: `src/features/factories/FactoryDetail.tsx` (read fully — 277 lines), and its presentational helpers it renders inline; `MachineEditor.tsx`, `ItemRateEditor.tsx` (restyle controls only)
- Tests: `npm test -- src/features/factories/`

Design reference: lines 398–455.

- [ ] **Step 1: Read `FactoryDetail.tsx` fully and map its sections** (breadcrumb, header, the tab set, and each tab's body) to the design. Preserve ALL state, mutations (rename/status/description/delete), `MachineEditor`, `ItemRateEditor`, `ManualFactoryForm`, and the calculator round-trip link/handlers.

- [ ] **Step 2: Apply FICSIT structure**
  - Breadcrumb: `Factories` (link) `<Icon name="chevron" size={13} />` `name` (design line 400).
  - Header: title in `font-[var(--font-display)] text-[28px] font-extrabold uppercase`, status `Badge` (`statusBadgeTone`/`STATUS_LABEL` from Task 1), "Open in Calculator" `<Button variant="secondary" size="sm">`, delete `<IconButton>` with `<Icon name="trash" />` (hover red).
  - Tabs: use the `Tabs` primitive with items Overview/Plan/Build Cost/Notes, driving the existing tab state.
  - Tab bodies → `Panel`s: Overview = efficiency readout (big mono value colored via `effColor`, full-width `Progress`) + planned/actual rows; Plan = machine table or (manual) the live `ResultTabs` graph (unchanged logic); Build Cost = accent total-power bar + ingredient grid in inset wells; Notes = notes in an inset well / `Input`/textarea.
  - Editable fields use `Input`; toggles use `Switch`. Replace all coastal vars with FICSIT tokens.

- [ ] **Step 3: Restyle `MachineEditor.tsx` and `ItemRateEditor.tsx` controls** (inputs → `Input`, add/remove → `Button`/`IconButton`, rows → inset wells). Preserve their props/handlers exactly. NOTE: `MachineEditor.tsx` has a PRE-EXISTING biome error — fix it as part of touching the file (run `npx biome check --write src/features/factories/MachineEditor.tsx`).

- [ ] **Step 4: Verify + commit**

Run: `npm test -- src/features/factories/` → green. `npm run typecheck` PASS. `npm run check` → now fully clean (MachineEditor fixed).

```bash
git add src/features/factories
git commit -m "feat: re-skin Factory detail into FICSIT; fix MachineEditor lint"
```

---

## Task 6: Game Data re-skin

**Files:**
- Modify: `src/features/data/EntityListPage.tsx`, `src/components/data/SearchFilterBar.tsx`, `RecipeRow.tsx`, `EntityCardGrid.tsx`, `DetailLayout.tsx`, `src/components/EntityIcon.tsx`; `src/routes/data/index.tsx` and `src/routes/data/route.tsx` (entity-nav chrome)
- Tests: `npm test -- src/components/data/ src/features/data/`

Design reference: lines 457–525. Keep the config-driven architecture and all 5 entity types; restyle only.

- [ ] **Step 1: Read each file**; preserve props, config typing (`list-config.ts`), search/filter state, and routing.

- [ ] **Step 2: `EntityListPage.tsx`** → design's table/grid: `Panel` container, header row in a darkened strip (`bg-black/[0.22]`) with uppercase `--text-disabled` column labels, body rows `border-t border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`, mono numeric cells, name cells with `EntityIcon` tile. Card-type entities render via `EntityCardGrid`.

- [ ] **Step 3: `SearchFilterBar.tsx`** → search `Input` with leading `<Icon name="search" />`; filter options as **chips** (active = `bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--orange-400)]`; inactive = `bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-muted)]`). Preserve the query/filter state + callbacks.

- [ ] **Step 4: `RecipeRow.tsx`** → recipe card (name `font-[var(--font-display)] uppercase`, building sub-label muted, mono ingredients → `<Icon name="arrow" className="text-[var(--orange-500)]" />` → mono products in `--orange-300`, optional `<Badge tone="accent" size="sm">Alt</Badge>`, mono rate). **`EntityCardGrid.tsx`** → FICSIT cards (icon tile, name, category, footer stat row). **`DetailLayout.tsx`** and **`EntityIcon.tsx`** → FICSIT surfaces/borders (EntityIcon placeholder: `bg-[var(--bg-inset)] text-[var(--text-muted)]`).

- [ ] **Step 5: Entity navigation** in `routes/data/index.tsx` / `route.tsx` → restyle the entity-type switcher as a `Tabs`/chip row (Items/Recipes/Buildings/Buildables/Schematics), preserving the existing links/active logic.

- [ ] **Step 6: Verify + commit**

Run: `npm test -- src/components/data/ src/features/data/` → green (update markup assertions in `EntityListPage.test.tsx`, `SearchFilterBar.test.tsx`, `EntityCardGrid.test.tsx`, `EntityIcon.test.tsx` to the new structure; keep behavioral coverage). `npm run typecheck` PASS, `npm run check` clean.

```bash
git add src/features/data src/components/data src/components/EntityIcon.tsx src/routes/data
git commit -m "feat: re-skin Game Data (lists, filters, recipes, cards) into FICSIT"
```

---

## Task 7: Map re-skin

**Files:**
- Modify: `src/features/map/MapPage.tsx`, `LayerPanel.tsx`
- Tests: `npm test -- src/features/map/`

Design reference: lines 527–577. Preserve the Leaflet `MapView`, layers, pins, coordinate system, and tile proxy.

- [ ] **Step 1: Read `MapPage.tsx` + `LayerPanel.tsx`.** Keep all map wiring/state.

- [ ] **Step 2: `MapPage.tsx`** → two-column `grid-cols-[1fr_300px]`: the `MapView` inside a bordered container (`rounded-[var(--radius-md)] border border-[var(--border-default)] shadow-[var(--bevel-top),var(--shadow-lg)] overflow-hidden`), right rail with a **Resource Nodes** `Panel` (legend rows: colored dot + name + mono purity) and a **Save File** `Panel` (`topRail`, description, `<Button variant="secondary" fullWidth>Load Save File</Button>` — keep any existing handler or leave the button inert if none exists today; do not invent save-loading). Replace coastal tokens.

- [ ] **Step 3: `LayerPanel.tsx`** → restyle toggles to `Switch` and the panel to FICSIT surfaces, preserving the layer-visibility state/callbacks.

- [ ] **Step 4: Verify + commit**

Run: `npm test -- src/features/map/` → green. `npm run typecheck` PASS, `npm run check` clean.

```bash
git add src/features/map
git commit -m "feat: re-skin Map chrome into FICSIT (Leaflet untouched)"
```

---

## Task 8: Peripheral pages + bridge teardown

**Files:**
- Modify (light token migration): `src/features/logistics/*` (`LogisticsPage.tsx`, `LinkForm.tsx`, `SummaryCard.tsx`, `NetworkGraph.tsx`), `src/features/games/GamesPage.tsx`, `GameSettings.tsx`, `GameSwitcher.tsx`, `AcceptInvite.tsx`, `src/integrations/clerk/header-user.tsx`, `src/components/Toast.tsx`, and any remaining file flagged by the grep below.
- Modify (delete bridge): `src/styles.css`
- Tests: full `npm test`

- [ ] **Step 1: Find every remaining coastal-var / bridge-class usage**

Run:
```bash
git grep -nE "var\(--(sea-ink|sea-ink-soft|lagoon|lagoon-deep|palm|sand|foam|surface|surface-strong|line|inset-glint|kicker|header-bg|chip-bg|chip-line|link-bg-hover|hero-a|hero-b)\)|island-shell|feature-card|display-title|nav-link|island-kicker|site-footer|rise-in" -- src
```
This lists every file still on the bridge. Work through each, replacing tokens (`--sea-ink`→`--text-primary`, `--sea-ink-soft`→`--text-muted`, `--line`→`--border-default`, `--chip-bg`/`--surface`→`--bg-inset`/`--surface-card`, accent→`--accent`) and swapping `.island-shell`/`.feature-card` markup for `Panel` or FICSIT classes. Preserve all logic. For logistics/games/settings/invite there's no bespoke mock — apply consistent FICSIT surfaces/text (panels, mono numbers, display headers), not a bespoke redesign.

- [ ] **Step 2: Re-run the grep until it returns NOTHING** (zero matches across `src`).

- [ ] **Step 3: Delete the bridge from `src/styles.css`**

Remove the legacy bridge aliases from `:root` (the `--sea-ink`…`--hero-b` block — keep the shadcn-semantic mappings and `--sidebar-*`) and delete the now-unused rules: `.island-shell`, `.feature-card`, `.feature-card:hover`, `.display-title`, `.nav-link` (+ `::after`, hover, `.is-active`), `.island-kicker`, `.site-footer`, `.rise-in` (+ `@keyframes rise-in`), and the `button, .island-shell, a { transition… }` rule (re-add a plain `a`/`button` transition if you want, or drop). KEEP: `.page-wrap`, `a`/`a:hover` (repoint color to `var(--text-link)`/`var(--accent-hover)`), `code`, `pre`, `.prose pre`, the FICSIT base (body/scrollbar/`ficsit-pulse`/reduced-motion), and `@layer base`.

- [ ] **Step 4: Full verification**

Run: `npm run typecheck` → PASS. `npm test` → ALL green. `npm run check` → clean. `npm run build` → succeeds. Re-run the Step 1 grep → zero matches.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate peripheral pages to FICSIT and remove legacy var bridge"
```

---

## Task 9: Final verification pass

**Files:** none.

- [ ] **Step 1: Static + build**

Run, expecting all PASS/clean: `npm run check`, `npm run typecheck`, `npm test`, `npm run build`.

- [ ] **Step 2: Manual smoke pass** (`npm run dev`; dev usually lands on 3000/3002). Confirm, dark + no coastal colors + no console errors:
- `/` Overview dashboard (stats, factory list, alerts, milestone)
- `/calculator` — add a target, solve, click through Graph/Table/Resources/Power; Save-as-factory present
- `/factories` + a factory detail (all tabs; edit a field + save; open-in-calculator round-trip)
- `/data` each entity list (items/recipes/buildings/buildables/schematics) + a detail page; search + filter chips
- `/map` — tiles + nodes + factory pins render; layer toggles work
- `/logistics`, `/games`, `/g/<id>/settings`, `/invite/<token>` render consistently in FICSIT

- [ ] **Step 3:** If smoke-pass tweaks were needed, commit them. Branch `ficsit-page-reskins` is ready for review/merge.

---

## Self-review notes

- **Spec coverage:** Overview §1→T2; Calculator §2→T3; Factories §3→T4; Factory detail §4→T5; Data §5→T6; Map §6→T7; bridge teardown §7→T8; shared helper supports T2/T4/T5. Verification §→T9.
- **Preserve-logic guard** is restated per task; graph (xyflow) and Leaflet explicitly styling-only; solver/Convex/round-trip untouched.
- **Test churn** is called out where existing render tests assert old markup (calculator, factories, data) — update assertions, keep behavior.
- **Bridge teardown** is gated by a concrete grep that must return zero before `styles.css` deletions; `MachineEditor.tsx` pre-existing lint error is fixed in T5 when that file is touched.
- **Type consistency:** Task 1 exports `effProgressTone`/`effColor`/`statusBadgeTone`/`STATUS_LABEL`, consumed by T2/T4/T5; `Tabs` items use `{id,label}`; primitives imported from `#/components/ui/*` as built in Spec 1.
```
