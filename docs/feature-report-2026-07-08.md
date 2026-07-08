# Feature Report — Satisfactory Companion Webapp

**Date:** 2026-07-08  
**Scope:** Current feature surface, competitor comparison, recommended prioritization for work-tool maturity

---

## Where the app stands today

Everything from the original six-phase design plus follow-ups has shipped: game-data browsing (items/recipes/buildings/buildables/schematics), the LP-based production calculator with shareable URLs and graph/table views, factory management with efficiency and build costs, the interactive map with resource nodes and factory pins, the logistics network with transport math, games & collaboration (multi-user games with invites, phases 7–8), the FICSIT design system reskin, the alternate-recipe preset workflow, responsive layout, and global search. That's a genuinely complete "planner" core. The question is what makes it a daily *work tool* rather than a one-shot calculator.

---

## 1. What you've already talked about (your own backlog)

These live in [`future-improvements.md`](./future-improvements.md), with your own value/effort ratings:

| # | Feature | Your rating | My take |
|---|---------|-------------|---------|
| 3 | **Save-file import (`.sav`)** | ★★★★★ value / ★★★★ effort | The single biggest upgrade — see §3 |
| 5 | **Alternate-recipe advisor** ("which hard drives should I unlock?") | ★★★★ / ★★★ | Best value-to-effort on the list; the preset workflow you just shipped is the natural foundation |
| 1 | Whole-base global optimizer ("mega-plan") | ★★★★★ / ★★★★★ | Crown jewel, but do it *after* save import so it optimizes your real base |
| 2 | Power-grid simulator | ★★★★ / ★★★ | Factories already track draw; adding the generation half is a contained project |
| 4 | Somersloop + overclocking optimizer | ★★★★ / ★★★ | Endgame min/max; pairs with the advisor |
| 6 | On-map auto-router | ★★★★ / ★★★★★ | Spectacular but expensive; defer |
| 7 | Tech-tree build-order planner | ★★★ / ★★★ | Schematics data is currently browse-only; this makes it *useful* |
| 8 | Real-time collaborative bases | ★★★★ / ★★★★ | Convex makes this cheaper for you than for any competitor |
| 9 | AWESOME Sink optimizer | ★★★ / ★★ | Cheap win |
| 10 | Natural-language planner ("AI architect") | ★★★★ / ★★★★ | Differentiator no competitor has; needs the other tools mature first |

Smaller ideas you noted: dependency/impact analysis, node-utilisation heatmap, 3D visualisation, ramp-up simulator, **PWA/offline + mobile companion**, goal/progress dashboard. Plus two tech-debt items: self-hosted map tiles (drop the satisfactory-calculator.com proxy) and map initial-view tuning.

---

## 2. What competing apps have that you don't

**Satisfactory Tools (greeny)** — your data source's own frontend:
- Production planner with **machine-group visualization** (how many buildings, at what clock, grouped)
- **Codex-style "what can I build at my tier"** filtering across the whole app — you have per-list filters but no global tier context

**Satisfactory Calculator (SCIM)** — the map-centric giant:
- **Save-file upload → full interactive map** of your actual base (this is *the* reason people use it; your backlog item #3)
- **Save editor** (teleport players, delete crashed vehicles, undo mistakes) — huge traffic driver, but big scope and off-mission for a planner
- **Blueprint sharing gallery** with in-browser 3D preview
- Megaprint/blueprint download into your save

**Satisfactory Logistics (satisfactory-logistics.xyz)** — closest to your factories+logistics model:
- Factories-as-nodes with imports/exports between them (you have this)
- **Game-progress awareness**: recipes locked behind unresearched tiers are excluded from solving by default
- Team sharing (you have this via games)

**Ficsit.app / community tools:**
- **To-do / milestone checklists** ("what do I still need for Tier 8?")
- **Interactive power-circuit calculators** with fuel-chain math (your backlog #2)

**Where you're already ahead of everyone:** real-time multi-user games on Convex (SCIM and greeny are both single-user), the logistics transport-math layer, LP-solver quality with infeasibility diagnosis, and a coherent design system. No competitor combines planner + map + logistics + collaboration in one app.

---

## 3. What you need to be a work tool — prioritized

Since you use this for actual playthroughs, the gap that matters most is **the app doesn't know the state of your game**. Every session starts with you re-entering reality by hand. Everything below attacks that.

### Tier 1 — do these next

1. **Save-file import** (backlog #3)  
   Parse `.sav` client-side (`@etothepii/satisfactory-file-parser` in a worker, never uploaded). Even a v1 that only extracts *unlocked schematics, factory buildings, and actual production rates* transforms the app: factories auto-populate, efficiency compares plan vs. *actual* automatically, and the map shows your real base. This unlocks half the rest of the backlog.

2. **Game-progress model** (lightweight version of #7, and what satisfactory-logistics does well)  
   Let a game record its tier/unlocked schematics — manually at first, auto-filled by save import later. Then: calculator defaults to only-unlocked recipes, data pages badge locked content, and a "to unlock X you need milestone Y" panel appears on schematic pages. Cheap, and it makes every existing feature feel personal.

3. **Alternate-recipe advisor** (#5)  
   "You have 12 hard drives banked — scanning your current plans, unlocking *Pure Iron Ingot* saves 34% iron ore across three factories." Ranked list, one click to re-solve with it. Best effort-to-wow ratio on your list.

### Tier 2 — strong follow-ups

4. **Power-grid simulator** (#2)  
   Generation vs. draw per grid, fuel-chain planning, brownout warnings on the factories overview.

5. **To-do / build checklist**  
   Turn any calculator result or factory build-cost into a checkable shopping list ("240 reinforced plates, 18 assemblers…"), persisted per game. Trivial to build on what you have, and it's the feature you'd touch *every session* while actually building.

6. **PWA / offline mode**  
   Game data is static and bundled; the calculator can work fully offline on a tablet next to your gaming PC. Low effort, high daily-use value.

7. **AWESOME Sink optimizer** (#9)  
   Cheap, and the "route every factory's surplus to sink" auto-balancer plugs straight into logistics.

### Tier 3 — the differentiators, once the base knows your game

8. **Mega-plan optimizer** (#1)  
   Now solving against your *real* nodes and factories.

9. **Real-time collaboration polish** (#8)  
   Presence, comments; Convex gives you this cheaply and no competitor has it.

10. **AI architect** (#10)  
    With save import + progress model + advisor as tools, this becomes "plan my next milestone for me."

### What to deliberately skip

- A save *editor* (SCIM owns it, huge liability surface)
- 3D visualization (cost ≫ planning value)
- Blueprint hosting (moderation/storage burden — link out to SCIM instead)

---

## Hinge: Save-file import

The through-line: **save-file import is the hinge**. Before it, this is an excellent generic planner; after it, it's *your base's* companion, and features 2, 3, 4, and 8 all get dramatically better for free. It unlocks the whole Tier 1 tier and makes everything that follows more concrete.

Once you know:
- Which schematics the player has unlocked
- Where their factories actually are
- What they're actually producing vs. planning
- Their current resources and progression

...every other feature becomes tied to *their game state*, not an abstract solver. The calculator stops being "what *could* I build" and starts being "what should I build *next*". The map stops being empty pins and becomes a real base. Logistics routes become concrete. Power calculations become about *their* grid. That's when it stops being a tool and becomes a *companion*.
