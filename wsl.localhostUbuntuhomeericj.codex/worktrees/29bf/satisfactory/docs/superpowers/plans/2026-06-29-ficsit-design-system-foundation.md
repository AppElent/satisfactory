# FICSIT Design System — Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the coastal light/dark theme with the FICSIT industrial-HUD design system — drop in FICSIT tokens, swap the top-nav header for a left-sidebar shell, and stand up a reusable shadcn-based primitive layer — without changing any feature page's logic.

**Architecture:** Three theming layers — FICSIT raw tokens → shadcn semantic vars → legacy coastal aliases (a temporary shim that restyles the ~51 existing files untouched). New primitives live in `src/components/ui/` (shadcn/Radix where an equivalent exists, hand-rolled for Stat/Panel/Icon/IconButton). A new `src/components/shell/` (`AppShell`/`Sidebar`/`TopBar`) replaces `Header`/`Footer` in `__root.tsx`. Dark-only; `ThemeToggle` is removed.

**Tech Stack:** TanStack Start + React 19, Tailwind v4 (`@theme`), class-variance-authority + `cn` (clsx + tailwind-merge), Radix UI, lucide-react, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-06-29-ficsit-design-system-foundation-design.md`

**Branch:** `ficsit-design-system` (already created; the spec is committed there).

---

## File structure

**Added:**
- `src/styles/ficsit/colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css` — raw FICSIT tokens (verbatim from the design bundle).
- `src/components/ui/icon.tsx` (+ `symbol-defs.tsx`), `icon-button.tsx`, `button.tsx`, `badge.tsx`, `stat.tsx`, `panel.tsx`, `progress.tsx`, `switch.tsx`, `checkbox.tsx`, `tabs.tsx`, `dialog.tsx`, `input.tsx` — primitive layer.
- `src/components/ui/*.test.tsx` for the hand-rolled primitives (icon, button, badge, stat, panel) and a light render test for switch/tabs.
- `src/components/shell/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `nav-model.ts` (+ `Sidebar.test.tsx`).

**Modified:**
- `src/styles.css` — fonts, token imports, shadcn-var mapping, legacy bridge, global base.
- `src/routes/__root.tsx` — `AppShell`, remove theme script + Header/Footer.

**Deleted:**
- `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ThemeToggle.tsx`.

**Untouched (must keep working):** everything under `src/features/**`, `src/routes/**` page bodies, `convex/**`, the solver, `Toast.tsx`, data generation.

---

## Task 1: FICSIT token files (verbatim)

**Files:**
- Create: `src/styles/ficsit/colors.css`
- Create: `src/styles/ficsit/typography.css`
- Create: `src/styles/ficsit/spacing.css`
- Create: `src/styles/ficsit/effects.css`
- Create: `src/styles/ficsit/fonts.css`

- [ ] **Step 1: Create `src/styles/ficsit/colors.css`**

```css
/* FICSIT Design System — Color Tokens. FICSIT orange on cool graphite. */
:root {
  --orange-300: #FDC79E;
  --orange-400: #FBAA6E;
  --orange-500: #FA9549;
  --orange-600: #F57D20;
  --orange-700: #E2670C;
  --orange-800: #B85109;

  --graphite-950: #0E1013;
  --graphite-900: #15181C;
  --graphite-850: #1A1E23;
  --graphite-800: #1F242A;
  --graphite-700: #2A3038;
  --graphite-600: #363D47;
  --graphite-500: #4A525E;
  --graphite-400: #6B7480;
  --graphite-300: #8C94A0;
  --graphite-200: #B6BCC6;
  --graphite-100: #D9DDE3;
  --graphite-050: #EEF0F3;

  --slate-300: #9aa2c4;
  --slate-400: #818AAD;
  --slate-500: #5F668C;
  --slate-600: #4C5273;
  --slate-700: #3A3F59;

  --concrete-400: #9a9a9a;
  --concrete-500: #787878;
  --concrete-600: #5D5D5D;

  --green-400: #8FD65A;
  --green-500: #6FBF3C;
  --green-600: #56A02B;
  --yellow-400: #F6CE63;
  --yellow-500: #F2C14E;
  --yellow-600: #D9A52E;
  --red-400: #F0686C;
  --red-500: #E5484D;
  --red-600: #C7363B;
  --blue-400: #5DB4EC;
  --blue-500: #3FA7D6;
  --blue-600: #2D86B0;

  --bg-base: var(--graphite-950);
  --bg-surface: var(--graphite-900);
  --bg-raised: var(--graphite-850);
  --bg-inset: var(--graphite-800);
  --bg-overlay: rgba(8, 9, 11, 0.72);
  --surface-card: var(--graphite-850);
  --surface-panel: var(--graphite-900);
  --surface-input: var(--graphite-800);
  --surface-hover: rgba(255, 255, 255, 0.04);
  --surface-active: rgba(255, 255, 255, 0.07);

  --text-primary: #F4F6F8;
  --text-secondary: var(--graphite-200);
  --text-muted: var(--graphite-400);
  --text-disabled: var(--graphite-500);
  --text-on-accent: #1A0E03;
  --text-accent: var(--orange-500);
  --text-link: var(--orange-400);

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.11);
  --border-strong: rgba(255, 255, 255, 0.20);
  --border-accent: var(--orange-500);

  --accent: var(--orange-500);
  --accent-hover: var(--orange-400);
  --accent-press: var(--orange-600);
  --accent-soft: rgba(250, 149, 73, 0.14);
  --accent-soft-hover: rgba(250, 149, 73, 0.22);
  --focus-ring: rgba(250, 149, 73, 0.55);

  --success: var(--green-500);
  --success-soft: rgba(111, 191, 60, 0.15);
  --warning: var(--yellow-500);
  --warning-soft: rgba(242, 193, 78, 0.15);
  --danger: var(--red-500);
  --danger-soft: rgba(229, 72, 77, 0.15);
  --info: var(--blue-500);
  --info-soft: rgba(63, 167, 214, 0.15);

  --hazard-a: var(--orange-500);
  --hazard-b: var(--graphite-950);
}
```

- [ ] **Step 2: Create `src/styles/ficsit/typography.css`**

```css
/* FICSIT Design System — Typography Tokens. */
:root {
  --font-display: 'Saira Condensed', 'Arial Narrow', sans-serif;
  --font-sans: 'Saira', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;

  --fw-light: 300;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;
  --fw-black: 800;

  --text-2xs: 11px;
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-md: 17px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 30px;
  --text-3xl: 38px;
  --text-4xl: 48px;
  --text-5xl: 64px;
  --text-6xl: 84px;

  --leading-tight: 1.05;
  --leading-snug: 1.2;
  --leading-normal: 1.45;
  --leading-relaxed: 1.6;

  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.04em;
  --tracking-wider: 0.08em;
  --tracking-widest: 0.16em;

  --type-display-font: var(--font-display);
  --type-display-weight: var(--fw-black);
  --type-display-spacing: var(--tracking-wide);
  --type-heading-font: var(--font-display);
  --type-heading-weight: var(--fw-bold);
  --type-body-font: var(--font-sans);
  --type-body-weight: var(--fw-regular);
  --type-label-font: var(--font-sans);
  --type-label-weight: var(--fw-semibold);
  --type-label-spacing: var(--tracking-wider);
  --type-data-font: var(--font-mono);
  --type-data-weight: var(--fw-medium);
}
```

- [ ] **Step 3: Create `src/styles/ficsit/spacing.css`**

```css
/* FICSIT Design System — Spacing & Layout Tokens. 4px base grid. */
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  --container-sm: 640px;
  --container-md: 880px;
  --container-lg: 1120px;
  --container-xl: 1360px;

  --control-h-sm: 30px;
  --control-h-md: 38px;
  --control-h-lg: 46px;

  --z-base: 0;
  --z-raised: 10;
  --z-sticky: 100;
  --z-overlay: 1000;
  --z-modal: 1100;
  --z-toast: 1200;
  --z-tooltip: 1300;
}
```

- [ ] **Step 4: Create `src/styles/ficsit/effects.css`**

```css
/* FICSIT Design System — Effects Tokens. Sharp & mechanical. */
:root {
  --radius-none: 0;
  --radius-xs: 2px;
  --radius-sm: 3px;
  --radius-md: 5px;
  --radius-lg: 8px;
  --radius-pill: 999px;

  --border-hairline: 1px;
  --border-thick: 2px;
  --border-heavy: 3px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.55);
  --shadow-xl: 0 24px 60px rgba(0, 0, 0, 0.65);

  --bevel-top: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  --bevel-inset: inset 0 1px 3px rgba(0, 0, 0, 0.5);

  --glow-accent: 0 0 0 3px var(--focus-ring);
  --glow-accent-strong: 0 0 16px rgba(250, 149, 73, 0.45);
  --glow-success: 0 0 14px rgba(111, 191, 60, 0.4);
  --glow-danger: 0 0 14px rgba(229, 72, 77, 0.4);

  --ease-standard: cubic-bezier(0.2, 0, 0.1, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.5, 0, 0.9, 0.4);
  --dur-fast: 90ms;
  --dur-base: 150ms;
  --dur-slow: 260ms;

  --tex-hazard: repeating-linear-gradient(-45deg, var(--hazard-a) 0 14px, var(--hazard-b) 14px 28px);
  --tex-grid: linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  --tex-grid-size: 28px 28px;
  --tex-brushed: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.015) 0 2px, rgba(0, 0, 0, 0.015) 2px 4px);
}
```

- [ ] **Step 5: Create `src/styles/ficsit/fonts.css`**

```css
/* FICSIT Design System — Webfonts (Google Fonts stand-ins). */
@import url('https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Saira+Condensed:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
```

- [ ] **Step 6: Commit**

```bash
git add src/styles/ficsit
git commit -m "feat: add FICSIT design tokens (colors, type, spacing, effects, fonts)"
```

---

## Task 2: Wire tokens, shadcn-var mapping, legacy bridge & global base into `styles.css`

**Files:**
- Modify: `src/styles.css`

This task rewrites the top imports, the `:root` block, `@theme`, and the body/global base. The coastal `.dark` block, body gradients, and `body::before`/`body::after` are removed. **Keep** the unrelated rules (`a`, `code`, `pre`, `.page-wrap`, `.display-title`, `.nav-link`, `.rise-in`, `.site-footer`, transitions) but their referenced vars now resolve to FICSIT tokens via the bridge.

- [ ] **Step 1: Replace the font import + add token imports (top of file)**

Replace line 1 (the Fraunces/Manrope `@import url(...)`) so the file begins:

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';
@import 'tw-animate-css';

@import './styles/ficsit/fonts.css';
@import './styles/ficsit/colors.css';
@import './styles/ficsit/typography.css';
@import './styles/ficsit/spacing.css';
@import './styles/ficsit/effects.css';
```

> Note: Tailwind requires `@import` rules before other statements; the design `@import`s remain at the very top alongside `'tailwindcss'`.

- [ ] **Step 2: Replace the `:root` block with the legacy bridge + shadcn-var mapping**

Replace the entire `:root { ... }` block (old lines ~9-63) with:

```css
/* Legacy coastal var bridge — TEMPORARY. Repoints the names the ~51 existing
   files still use onto FICSIT tokens. Removed file-by-file in Spec 2. */
:root {
  --sea-ink: var(--text-primary);
  --sea-ink-soft: var(--text-secondary);
  --lagoon: var(--accent);
  --lagoon-deep: var(--accent-hover);
  --palm: var(--accent);
  --sand: var(--graphite-900);
  --foam: var(--graphite-950);
  --surface: var(--surface-card);
  --surface-strong: var(--surface-card);
  --line: var(--border-default);
  --inset-glint: var(--border-subtle);
  --kicker: var(--text-muted);
  --header-bg: var(--graphite-900);
  --chip-bg: var(--bg-inset);
  --chip-line: var(--border-default);
  --link-bg-hover: var(--surface-hover);
  --hero-a: transparent;
  --hero-b: transparent;

  /* shadcn semantic vars → FICSIT tokens (proper dark theme for ui/ primitives) */
  --background: var(--graphite-950);
  --foreground: var(--text-primary);
  --card: var(--surface-card);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-panel);
  --popover-foreground: var(--text-primary);
  --primary: var(--orange-500);
  --primary-foreground: var(--text-on-accent);
  --secondary: var(--bg-inset);
  --secondary-foreground: var(--text-primary);
  --muted: var(--bg-inset);
  --muted-foreground: var(--text-muted);
  /* shadcn's --accent is a neutral hover surface, NOT the FICSIT orange.
     FICSIT orange stays available as --orange-500 / --primary. */
  --accent: var(--surface-hover);
  --accent-foreground: var(--text-primary);
  --destructive: var(--red-500);
  --destructive-foreground: var(--text-primary);
  --border: var(--border-default);
  --input: var(--border-default);
  --ring: var(--focus-ring);
  --radius: 5px;

  --sidebar: var(--graphite-900);
  --sidebar-foreground: var(--text-secondary);
  --sidebar-primary: var(--orange-500);
  --sidebar-primary-foreground: var(--text-on-accent);
  --sidebar-accent: var(--accent-soft);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border-subtle);
  --sidebar-ring: var(--focus-ring);
}
```

- [ ] **Step 3: Delete the `.dark { ... }` block**

Remove the entire `.dark { ... }` block (old lines ~65-118). Dark is now the only theme.

- [ ] **Step 4: Update `@theme inline` font vars**

In the `@theme inline { ... }` block, replace the `--font-sans` line and add mono/display so they read:

```css
  --font-sans: 'Saira', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-display: 'Saira Condensed', 'Arial Narrow', sans-serif;
```

Leave the rest of `@theme inline` (the `--color-*`, `--radius-*`, `--color-sidebar-*` mappings) unchanged — they now resolve through the FICSIT-backed semantic vars.

- [ ] **Step 5: Replace the `body` + `body::before` + `body::after` rules with the FICSIT base**

Replace the `body { ... }`, `body::before { ... }`, and `body::after { ... }` rules (old lines ~166-206) with:

```css
html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-sans);
  background-color: var(--graphite-950);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-thumb {
  background: var(--graphite-600);
  border-radius: 5px;
  border: 2px solid var(--graphite-950);
}
::-webkit-scrollbar-track {
  background: transparent;
}

@keyframes ficsit-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 6: Repoint `.island-shell` / `.feature-card` to the FICSIT panel look**

Replace the `.island-shell`, `.feature-card`, and `.feature-card:hover` rules (old lines ~252-273) with:

```css
.island-shell {
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  box-shadow: var(--bevel-top), var(--shadow-md);
}

.feature-card {
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  box-shadow: var(--bevel-top), var(--shadow-md);
}

.feature-card:hover {
  border-color: var(--border-accent);
}
```

- [ ] **Step 7: Verify it builds and typechecks**

Run: `npm run typecheck`
Expected: PASS (no TS errors; CSS isn't typechecked but this confirms nothing else broke).

Run: `npm run check`
Expected: biome clean (or only pre-existing warnings).

- [ ] **Step 8: Commit**

```bash
git add src/styles.css
git commit -m "feat: dark FICSIT theme via shadcn-var mapping + legacy bridge"
```

---

## Task 3: Icon primitive + symbol defs

**Files:**
- Create: `src/components/ui/symbol-defs.tsx`
- Create: `src/components/ui/icon.tsx`
- Test: `src/components/ui/icon.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./icon";

describe("Icon", () => {
  it("renders an svg referencing the symbol id", () => {
    const { container } = render(<Icon name="factory" />);
    const use = container.querySelector("use");
    expect(use?.getAttribute("href")).toBe("#i-factory");
  });

  it("applies the size to width and height", () => {
    const { container } = render(<Icon name="zap" size={24} />);
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/icon.test.tsx`
Expected: FAIL (cannot find `./icon`).

- [ ] **Step 3: Create `src/components/ui/symbol-defs.tsx`**

```tsx
/**
 * FICSIT HUD icon symbols. Mounted once (in AppShell). Icon references these
 * by `#i-<name>`. Verbatim from the design bundle's <defs>.
 */
export default function SymbolDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <symbol id="i-factory" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V11l4 2.5V11l4 2.5V8l5 3v9M9 21v-3M15 21v-3" /></symbol>
        <symbol id="i-calc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" /></symbol>
        <symbol id="i-data" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 6c0 1.66 3.13 3 7 3s7-1.34 7-3-3.13-3-7-3-7 1.34-7 3ZM5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" /></symbol>
        <symbol id="i-route" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a3 3 0 0 0 3-3V7.5" /></symbol>
        <symbol id="i-map" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2ZM9 5v12M15 7v12" /></symbol>
        <symbol id="i-gauge" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13l3-3M4.5 18a8 8 0 1 1 15 0" /></symbol>
        <symbol id="i-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></symbol>
        <symbol id="i-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></symbol>
        <symbol id="i-alert" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3ZM12 10v4M12 17h.01" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12l2.5 2.5 4.5-5" /></symbol>
        <symbol id="i-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8" /></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></symbol>
        <symbol id="i-cog" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19.1 4.9l-2.1 2.1M7 17l-2.1 2.1M19.1 19.1 17 17M7 7 4.9 4.9" /></symbol>
        <symbol id="i-power" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v9M7.5 6.5a8 8 0 1 0 9 0" /></symbol>
        <symbol id="i-hex" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" /></symbol>
      </defs>
    </svg>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/icon.tsx`**

```tsx
import type { CSSProperties } from "react";

export type IconName =
  | "factory" | "calc" | "data" | "route" | "map" | "gauge" | "zap"
  | "plus" | "search" | "chevron" | "alert" | "check" | "box" | "arrow"
  | "trash" | "cog" | "power" | "hex";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Renders a FICSIT HUD glyph from the mounted <SymbolDefs>. Inherits currentColor. */
export function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#i-${name}`} />
    </svg>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/ui/icon.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/symbol-defs.tsx src/components/ui/icon.tsx src/components/ui/icon.test.tsx
git commit -m "feat: FICSIT Icon primitive + HUD symbol defs"
```

---

## Task 4: Install Radix dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the Radix primitives the shadcn-based components need**

Run:
```bash
npm install @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-progress
```
Expected: packages added to `dependencies`, no peer-dep errors (React 19 is supported by current Radix).

- [ ] **Step 2: Verify the app still typechecks**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Radix UI primitives for FICSIT ui layer"
```

---

## Task 5: Button + IconButton

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/icon-button.tsx`
- Test: `src/components/ui/button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children and is a button by default", () => {
    const { getByRole } = render(<Button>Construct</Button>);
    expect(getByRole("button").textContent).toBe("Construct");
  });

  it("applies the primary variant data attribute", () => {
    const { getByRole } = render(<Button variant="primary">Go</Button>);
    expect(getByRole("button").getAttribute("data-variant")).toBe("primary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/button.test.tsx`
Expected: FAIL (cannot find `./button`).

- [ ] **Step 3: Create `src/components/ui/button.tsx`**

```tsx
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-semibold tracking-[0.06em] uppercase cursor-pointer select-none transition-[filter,background-color,border-color] duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--bevel-top),var(--shadow-sm)] hover:brightness-110 active:bg-[var(--accent-press)]",
        secondary:
          "bg-[var(--bg-inset)] text-[var(--text-secondary)] border border-[var(--border-strong)] shadow-[var(--bevel-inset)] hover:bg-[var(--surface-active)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
      },
      size: {
        sm: "h-[var(--control-h-sm)] px-3 text-[12px]",
        md: "h-[var(--control-h-md)] px-4 text-[13px]",
        lg: "h-[var(--control-h-lg)] px-5 text-[14px]",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-variant={variant ?? "primary"}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
```

- [ ] **Step 4: Create `src/components/ui/icon-button.tsx`**

```tsx
import { type VariantProps, cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] cursor-pointer transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        secondary:
          "bg-[var(--bg-inset)] text-[var(--text-muted)] border border-[var(--border-strong)] hover:text-[var(--text-primary)]",
        ghost: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
      },
      size: { sm: "h-[30px] w-[30px]", md: "h-[38px] w-[38px]" },
    },
    defaultVariants: { variant: "ghost", size: "sm" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/ui/button.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/icon-button.tsx src/components/ui/button.test.tsx
git commit -m "feat: FICSIT Button + IconButton primitives"
```

---

## Task 6: Badge

**Files:**
- Create: `src/components/ui/badge.tsx`
- Test: `src/components/ui/badge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    const { getByText } = render(<Badge tone="success">Operational</Badge>);
    expect(getByText("Operational")).toBeInTheDocument();
  });

  it("renders a status dot when dot is set", () => {
    const { container } = render(
      <Badge tone="danger" dot>Offline</Badge>,
    );
    expect(container.querySelector("[data-badge-dot]")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/badge.test.tsx`
Expected: FAIL (cannot find `./badge`).

- [ ] **Step 3: Create `src/components/ui/badge.tsx`**

```tsx
import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "#/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border font-semibold uppercase tracking-[0.08em] leading-none",
  {
    variants: {
      tone: {
        success: "bg-[var(--success-soft)] border-[var(--success)]/40 text-[var(--green-400)]",
        warning: "bg-[var(--warning-soft)] border-[var(--warning)]/40 text-[var(--yellow-400)]",
        danger: "bg-[var(--danger-soft)] border-[var(--danger)]/40 text-[var(--red-400)]",
        info: "bg-[var(--info-soft)] border-[var(--info)]/40 text-[var(--blue-400)]",
        accent: "bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--orange-400)]",
        neutral: "bg-[var(--bg-inset)] border-[var(--border-default)] text-[var(--text-muted)]",
      },
      size: {
        sm: "h-[18px] px-1.5 text-[9px]",
        md: "h-[22px] px-2 text-[10px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

const DOT_COLOR: Record<string, string> = {
  success: "var(--green-500)",
  warning: "var(--yellow-500)",
  danger: "var(--red-500)",
  info: "var(--blue-500)",
  accent: "var(--accent)",
  neutral: "var(--graphite-400)",
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && (
        <span
          data-badge-dot
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: DOT_COLOR[tone ?? "neutral"] }}
        />
      )}
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/badge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/badge.tsx src/components/ui/badge.test.tsx
git commit -m "feat: FICSIT Badge primitive"
```

---

## Task 7: Stat

**Files:**
- Create: `src/components/ui/stat.tsx`
- Test: `src/components/ui/stat.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stat } from "./stat";

describe("Stat", () => {
  it("renders label, value and unit", () => {
    const { getByText } = render(
      <Stat label="Total Power Draw" value="420.6" unit="MW" />,
    );
    expect(getByText("Total Power Draw")).toBeInTheDocument();
    expect(getByText("420.6")).toBeInTheDocument();
    expect(getByText("MW")).toBeInTheDocument();
  });

  it("renders the delta with its tone data attribute", () => {
    const { getByText } = render(
      <Stat label="Eff" value="89" unit="%" delta="-3% vs plan" deltaTone="danger" />,
    );
    expect(getByText("-3% vs plan").getAttribute("data-tone")).toBe("danger");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/stat.test.tsx`
Expected: FAIL (cannot find `./stat`).

- [ ] **Step 3: Create `src/components/ui/stat.tsx`**

```tsx
import { cn } from "#/lib/utils";

type DeltaTone = "positive" | "negative" | "danger" | "neutral";

interface StatProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: DeltaTone;
  className?: string;
}

const DELTA_COLOR: Record<DeltaTone, string> = {
  positive: "var(--green-400)",
  negative: "var(--red-400)",
  danger: "var(--red-400)",
  neutral: "var(--text-muted)",
};

export function Stat({ label, value, unit, delta, deltaTone = "positive", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-[var(--font-mono)] text-[30px] leading-none text-[var(--text-primary)]">
          {value}
        </span>
        {unit && <span className="text-[13px] text-[var(--text-muted)]">{unit}</span>}
      </span>
      {delta && (
        <span
          data-tone={deltaTone}
          className="text-[11px]"
          style={{ color: DELTA_COLOR[deltaTone] }}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/stat.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/stat.tsx src/components/ui/stat.test.tsx
git commit -m "feat: FICSIT Stat readout primitive"
```

---

## Task 8: Panel

**Files:**
- Create: `src/components/ui/panel.tsx`
- Test: `src/components/ui/panel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./panel";

describe("Panel", () => {
  it("renders a title header strip and children", () => {
    const { getByText } = render(
      <Panel title="Factory Network">rows</Panel>,
    );
    expect(getByText("Factory Network")).toBeInTheDocument();
    expect(getByText("rows")).toBeInTheDocument();
  });

  it("renders the orange top rail when topRail is set", () => {
    const { container } = render(<Panel topRail>body</Panel>);
    expect(container.querySelector("[data-top-rail]")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/panel.test.tsx`
Expected: FAIL (cannot find `./panel`).

- [ ] **Step 3: Create `src/components/ui/panel.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "#/lib/utils";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  /** Right-side content in the header strip (buttons, counts). */
  headerAction?: ReactNode;
  /** 2px orange rail across the top edge. */
  topRail?: boolean;
  /** Hazard caution stripe across the top edge. */
  hazard?: boolean;
  children?: ReactNode;
}

export function Panel({
  title,
  headerAction,
  topRail,
  hazard,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--bevel-top),var(--shadow-md)]",
        className,
      )}
      {...props}
    >
      {topRail && (
        <span data-top-rail className="absolute inset-x-0 top-0 h-0.5 bg-[var(--accent)]" />
      )}
      {hazard && (
        <span
          data-hazard
          className="absolute inset-x-0 top-0 h-1.5 opacity-50"
          style={{ backgroundImage: "var(--tex-hazard)" }}
        />
      )}
      {title && (
        <header className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-black/[0.18] px-5 py-3">
          <h3 className="m-0 font-[var(--font-display)] text-[16px] font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
            {title}
          </h3>
          {headerAction}
        </header>
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/panel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/panel.tsx src/components/ui/panel.test.tsx
git commit -m "feat: FICSIT Panel primitive (header strip / top-rail / hazard)"
```

---

## Task 9: Progress

**Files:**
- Create: `src/components/ui/progress.tsx`
- Test: `src/components/ui/progress.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./progress";

describe("Progress", () => {
  it("sets the indicator width from value", () => {
    const { container } = render(<Progress value={70} />);
    const indicator = container.querySelector("[data-progress-indicator]") as HTMLElement;
    expect(indicator.style.width).toBe("70%");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/progress.test.tsx`
Expected: FAIL (cannot find `./progress`).

- [ ] **Step 3: Create `src/components/ui/progress.tsx`**

```tsx
import { cn } from "#/lib/utils";

type ProgressTone = "accent" | "success" | "warning" | "danger";

interface ProgressProps {
  /** 0-100 */
  value: number;
  tone?: ProgressTone;
  glow?: boolean;
  className?: string;
}

const FILL: Record<ProgressTone, string> = {
  accent: "linear-gradient(180deg,var(--orange-400),var(--orange-500))",
  success: "linear-gradient(180deg,var(--green-400),var(--green-500))",
  warning: "linear-gradient(180deg,var(--yellow-400),var(--yellow-500))",
  danger: "linear-gradient(180deg,var(--red-400),var(--red-500))",
};

const GLOW: Record<ProgressTone, string> = {
  accent: "var(--glow-accent-strong)",
  success: "var(--glow-success)",
  warning: "none",
  danger: "var(--glow-danger)",
};

export function Progress({ value, tone = "accent", glow = false, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-[7px] overflow-hidden rounded-[2px] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)]",
        className,
      )}
    >
      <div
        data-progress-indicator
        className="h-full transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-standard)]"
        style={{ width: `${pct}%`, background: FILL[tone], boxShadow: glow ? GLOW[tone] : undefined }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/progress.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/progress.tsx src/components/ui/progress.test.tsx
git commit -m "feat: FICSIT Progress meter primitive"
```

---

## Task 10: Switch + Checkbox (Radix)

**Files:**
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Test: `src/components/ui/switch.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders a switch role reflecting checked state", () => {
    const { getByRole } = render(<Switch checked onCheckedChange={() => {}} />);
    expect(getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/switch.test.tsx`
Expected: FAIL (cannot find `./switch`).

- [ ] **Step 3: Create `src/components/ui/switch.tsx`**

```tsx
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] data-[state=checked]:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-[16px] w-[16px] translate-x-[3px] rounded-[var(--radius-pill)] bg-[var(--graphite-100)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] data-[state=checked]:translate-x-[23px] data-[state=checked]:bg-[var(--text-on-accent)]" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
```

- [ ] **Step 4: Create `src/components/ui/checkbox.tsx`**

```tsx
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";
import { Icon } from "./icon";

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[var(--radius-xs)] border border-[var(--border-strong)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)] transition-colors duration-[var(--dur-base)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--text-on-accent)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Icon name="check" size={14} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/ui/switch.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/switch.tsx src/components/ui/checkbox.tsx src/components/ui/switch.test.tsx
git commit -m "feat: FICSIT Switch + Checkbox primitives (Radix)"
```

---

## Task 11: Tabs (Radix)

**Files:**
- Create: `src/components/ui/tabs.tsx`
- Test: `src/components/ui/tabs.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./tabs";

describe("Tabs", () => {
  const items = [
    { id: "graph", label: "Graph" },
    { id: "items", label: "Items" },
  ];

  it("renders one tab per item and marks the active one selected", () => {
    const { getByRole } = render(
      <Tabs items={items} value="items" onChange={() => {}} />,
    );
    expect(getByRole("tab", { name: "Items" }).getAttribute("aria-selected")).toBe("true");
    expect(getByRole("tab", { name: "Graph" }).getAttribute("aria-selected")).toBe("false");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/tabs.test.tsx`
Expected: FAIL (cannot find `./tabs`).

- [ ] **Step 3: Create `src/components/ui/tabs.tsx`**

```tsx
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "#/lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Controlled tab bar (list only). Pages render their own panels via `value`. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onChange} className={className}>
      <TabsPrimitive.List className="flex gap-1 border-b border-[var(--border-subtle)]">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.id}
            value={item.id}
            className={cn(
              "relative h-[42px] cursor-pointer border-b-2 border-transparent bg-transparent px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] transition-colors duration-[var(--dur-base)] ease-[var(--ease-standard)] hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--glow-accent)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text-primary)]",
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/tabs.tsx src/components/ui/tabs.test.tsx
git commit -m "feat: FICSIT Tabs primitive (Radix)"
```

---

## Task 12: Dialog + Input (Radix Dialog; plain Input)

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/input.tsx`

> Dialog/Input are exercised in Spec 2; here we just establish them. No new unit test (Radix Dialog needs a portal/userEvent harness not warranted yet); they're covered by typecheck + the smoke pass.

- [ ] **Step 1: Create `src/components/ui/dialog.tsx`**

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[var(--z-modal)] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--bevel-top),var(--shadow-xl)] focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
```

- [ ] **Step 2: Create `src/components/ui/input.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-[var(--control-h-md)] w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 text-[13px] text-[var(--text-primary)] shadow-[var(--bevel-inset)] outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[var(--border-accent)] focus-visible:shadow-[var(--glow-accent)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/input.tsx
git commit -m "feat: FICSIT Dialog + Input primitives"
```

---

## Task 13: Sidebar nav model

**Files:**
- Create: `src/components/shell/nav-model.ts`

This centralizes the nav structure so `Sidebar` stays presentational. Game-scoping mirrors today's `Header` behavior (`GAME_SCOPED` + `activeGameId` from `localStorage`).

- [ ] **Step 1: Create `src/components/shell/nav-model.ts`**

```ts
import type { IconName } from "#/components/ui/icon";

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  /** Global destination (used when not game-scoped). */
  to: string;
  /** When true, resolve to /g/$gameId/<gameScopedPath> if a game is active, else /games. */
  gameScopedPath?: string;
  badge?: "beta" | "soon";
  disabled?: boolean;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Operations",
    items: [
      { id: "overview", label: "Overview", icon: "gauge", to: "/" },
      { id: "calculator", label: "Calculator", icon: "calc", to: "/calculator", badge: "beta" },
      { id: "factories", label: "Factories", icon: "factory", to: "/factories", gameScopedPath: "factories" },
      { id: "data", label: "Game Data", icon: "data", to: "/data" },
    ],
  },
  {
    heading: "World",
    items: [
      { id: "map", label: "World Map", icon: "map", to: "/map", gameScopedPath: "map" },
      { id: "logistics", label: "Logistics", icon: "route", to: "/logistics", gameScopedPath: "logistics", badge: "soon", disabled: true },
    ],
  },
];

/** Resolve an item's href given the active game id (or null). */
export function resolveHref(item: NavItem, activeGameId: string | null): string {
  if (!item.gameScopedPath) return item.to;
  return activeGameId ? `/g/${activeGameId}/${item.gameScopedPath}` : "/games";
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/nav-model.ts
git commit -m "feat: sidebar nav model with game-scoping resolver"
```

---

## Task 14: Sidebar

**Files:**
- Create: `src/components/shell/Sidebar.tsx`
- Test: `src/components/shell/Sidebar.test.tsx`

The active-state logic is the testable core; render is otherwise presentational. The test renders the pure helper `isItemActive` (exported) to avoid needing a full router.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { isItemActive } from "./Sidebar";

describe("isItemActive", () => {
  it("marks factories active on the list route", () => {
    expect(isItemActive("factories", "/factories")).toBe(true);
  });

  it("marks factories active on a game-scoped factory detail route", () => {
    expect(isItemActive("factories", "/g/abc/factories/steel")).toBe(true);
  });

  it("marks overview active only on root", () => {
    expect(isItemActive("overview", "/")).toBe(true);
    expect(isItemActive("overview", "/calculator")).toBe(false);
  });

  it("does not mark data active on factories", () => {
    expect(isItemActive("data", "/factories")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/shell/Sidebar.test.tsx`
Expected: FAIL (cannot find `./Sidebar` / `isItemActive`).

- [ ] **Step 3: Create `src/components/shell/Sidebar.tsx`**

```tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { Icon } from "#/components/ui/icon";
import { Progress } from "#/components/ui/progress";
import { cn } from "#/lib/utils";
import { NAV_GROUPS, type NavItem, resolveHref } from "./nav-model";

/** Pure: is this nav item active for the given pathname? */
export function isItemActive(itemId: string, pathname: string): boolean {
  if (itemId === "overview") return pathname === "/";
  if (itemId === "factories")
    return pathname.startsWith("/factories") || /^\/g\/[^/]+\/factories/.test(pathname);
  if (itemId === "map")
    return pathname.startsWith("/map") || /^\/g\/[^/]+\/map/.test(pathname);
  if (itemId === "logistics")
    return pathname.startsWith("/logistics") || /^\/g\/[^/]+\/logistics/.test(pathname);
  return pathname.startsWith(`/${itemId === "data" ? "data" : itemId}`);
}

function BadgePill({ kind }: { kind: NonNullable<NavItem["badge"]> }) {
  const isBeta = kind === "beta";
  return (
    <span
      className={cn(
        "ml-auto rounded-[2px] border px-1.5 py-px text-[9px] uppercase tracking-[0.1em]",
        isBeta
          ? "border-[var(--accent-soft)] text-[var(--orange-400)]"
          : "border-[var(--border-subtle)] text-[var(--text-disabled)]",
      )}
    >
      {isBeta ? "Beta" : "Soon"}
    </span>
  );
}

export default function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeGameId =
    typeof localStorage !== "undefined" ? localStorage.getItem("activeGameId") : null;

  return (
    <aside className="flex w-[244px] flex-none flex-col border-r border-[var(--border-default)] bg-[var(--graphite-900)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-[18px] pb-4 pt-[18px]">
        <div className="relative flex h-[34px] w-[34px] flex-none items-center justify-center">
          <Icon name="hex" size={34} className="text-[var(--accent)]" />
          <span className="absolute h-2 w-2 rounded-[1px] bg-[var(--accent)] shadow-[var(--glow-accent-strong)]" />
        </div>
        <div className="min-w-0">
          <div className="font-[var(--font-display)] text-[15px] font-extrabold uppercase leading-none tracking-[0.1em] text-[var(--text-primary)]">
            FICSIT
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Factory Planner
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="contents">
            <div className="px-2.5 pb-2 pt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--text-disabled)] first:pt-1.5">
              {group.heading}
            </div>
            {group.items.map((item) => {
              const active = isItemActive(item.id, pathname);
              const href = resolveHref(item, activeGameId);
              const inner = (
                <>
                  {active && (
                    <span className="absolute inset-0 rounded-[var(--radius-sm)] border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)]" />
                  )}
                  <Icon
                    name={item.icon}
                    size={19}
                    className={cn(
                      "relative",
                      active ? "text-[var(--orange-400)]" : "text-[var(--text-muted)]",
                    )}
                  />
                  <span className="relative">{item.label}</span>
                  {item.badge && <BadgePill kind={item.badge} />}
                </>
              );
              const base =
                "relative flex h-[42px] w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-[14px] font-semibold";
              if (item.disabled) {
                return (
                  <span key={item.id} className={cn(base, "cursor-default text-[var(--text-disabled)]")}>
                    {inner}
                  </span>
                );
              }
              return (
                <Link
                  key={item.id}
                  to={href}
                  className={cn(
                    base,
                    "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                  )}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--graphite-850)] p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Grid Load</span>
          <span className="font-[var(--font-mono)] text-[12px] text-[var(--green-400)]">70%</span>
        </div>
        <Progress value={70} tone="success" glow />
        <div className="mt-2 flex justify-between font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">
          <span>420.6 MW</span>
          <span>/ 600 MW</span>
        </div>
      </div>
    </aside>
  );
}
```

> Note: `<Link to={href}>` with a computed string is accepted by TanStack Router at runtime. If strict typed-route checking rejects the dynamic string during `typecheck`, cast as `to={href as string}` (the hrefs are all real routes). Confirm in Step 4.

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- src/components/shell/Sidebar.test.tsx`
Expected: PASS (4 assertions).

Run: `npm run typecheck`
Expected: PASS (apply the `as string` cast from the note if needed).

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/Sidebar.tsx src/components/shell/Sidebar.test.tsx
git commit -m "feat: FICSIT sidebar with active-state + grid-load widget"
```

---

## Task 15: TopBar

**Files:**
- Create: `src/components/shell/TopBar.tsx`
- Test: `src/components/shell/TopBar.test.tsx`

- [ ] **Step 1: Write the failing test (pure route-meta resolver)**

```tsx
import { describe, expect, it } from "vitest";
import { routeMetaFor } from "./TopBar";

describe("routeMetaFor", () => {
  it("returns overview meta for root", () => {
    expect(routeMetaFor("/").title).toBe("Overview");
  });

  it("returns calculator meta", () => {
    expect(routeMetaFor("/calculator").title).toBe("Production Calculator");
  });

  it("matches game-scoped factories to the Factories meta", () => {
    expect(routeMetaFor("/g/abc/factories").title).toBe("Factories");
  });

  it("falls back to a default title for unknown routes", () => {
    expect(routeMetaFor("/totally-unknown").title).toBe("FICSIT Planner");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/shell/TopBar.test.tsx`
Expected: FAIL (cannot find `./TopBar` / `routeMetaFor`).

- [ ] **Step 3: Create `src/components/shell/TopBar.tsx`**

```tsx
import { useRouterState } from "@tanstack/react-router";
import GameSwitcher from "#/features/games/GameSwitcher";
import ClerkHeader from "#/integrations/clerk/header-user";
import { Icon } from "#/components/ui/icon";

interface RouteMeta {
  title: string;
  subtitle: string;
}

const META: Array<{ test: (p: string) => boolean; meta: RouteMeta }> = [
  { test: (p) => p === "/", meta: { title: "Overview", subtitle: "Live factory network status" } },
  { test: (p) => p.startsWith("/calculator"), meta: { title: "Production Calculator", subtitle: "LP-optimized production planning" } },
  { test: (p) => p.startsWith("/data"), meta: { title: "Game Data", subtitle: "Items · recipes · buildings · schematics" } },
  { test: (p) => /\/factories/.test(p), meta: { title: "Factories", subtitle: "Manage and inspect production sites" } },
  { test: (p) => /\/map/.test(p), meta: { title: "World Map", subtitle: "Explored regions and resource nodes" } },
  { test: (p) => /\/logistics/.test(p), meta: { title: "Logistics", subtitle: "Factory network and transport" } },
  { test: (p) => p.startsWith("/games") || /^\/g\//.test(p), meta: { title: "Games", subtitle: "Your save games and collaborators" } },
];

/** Pure: resolve title/subtitle for a pathname. */
export function routeMetaFor(pathname: string): RouteMeta {
  return META.find((m) => m.test(pathname))?.meta ?? { title: "FICSIT Planner", subtitle: "" };
}

export default function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { title, subtitle } = routeMetaFor(pathname);

  return (
    <header className="relative z-[var(--z-raised)] flex h-[68px] flex-none items-center gap-[18px] border-b border-[var(--border-default)] bg-[var(--graphite-900)] px-[26px]">
      <div className="min-w-0">
        <h1 className="m-0 whitespace-nowrap font-[var(--font-display)] text-[22px] font-bold uppercase leading-none tracking-[0.04em] text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 whitespace-nowrap text-[12px] tracking-[0.04em] text-[var(--text-muted)]">
            {subtitle}
          </div>
        )}
      </div>

      <div className="ml-auto w-[280px] flex-none">
        <div className="flex h-[38px] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 shadow-[var(--bevel-inset)]">
          <Icon name="search" size={16} className="flex-none text-[var(--text-muted)]" />
          <input
            placeholder="Search items, recipes, buildings…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="flex flex-none items-center gap-2 border-l border-[var(--border-subtle)] pl-3">
        <span className="h-2 w-2 rounded-full bg-[var(--green-500)] shadow-[var(--glow-success)] [animation:ficsit-pulse_2.4s_var(--ease-standard)_infinite]" />
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Synced</span>
      </div>

      <div className="flex flex-none items-center gap-1.5">
        <GameSwitcher />
        <ClerkHeader />
      </div>
    </header>
  );
}
```

> Note: confirm the import paths/default-vs-named exports for `GameSwitcher` (`src/features/games/GameSwitcher.tsx`) and `ClerkHeader` (`src/integrations/clerk/header-user.tsx`) match how `Header.tsx` imported them today (default imports). Adjust if they are named exports.

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- src/components/shell/TopBar.test.tsx`
Expected: PASS (4 assertions).

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/TopBar.tsx src/components/shell/TopBar.test.tsx
git commit -m "feat: FICSIT top bar with route meta, search, game switcher + user"
```

---

## Task 16: AppShell + wire into `__root.tsx`; delete Header/Footer/ThemeToggle

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Modify: `src/routes/__root.tsx`
- Delete: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Create `src/components/shell/AppShell.tsx`**

```tsx
import type { ReactNode } from "react";
import SymbolDefs from "#/components/ui/symbol-defs";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--graphite-950)] text-[var(--text-primary)]">
      <SymbolDefs />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto bg-[var(--graphite-950)]"
          style={{ backgroundImage: "var(--tex-grid)", backgroundSize: "var(--tex-grid-size)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/routes/__root.tsx`**

Replace the imports of `Header`/`Footer` with `AppShell`, remove the `ThemeToggle`-related theme-flash script, and swap the body content. The new file:

```tsx
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import AppShell from "../components/shell/AppShell";
import ToastProvider from "../components/Toast";
import ClerkProvider from "../integrations/clerk/provider";
import ConvexProvider from "../integrations/convex/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Satisfactory Planner" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[var(--accent-soft)]">
				<ClerkProvider>
					<ConvexProvider>
						<ToastProvider>
							<AppShell>{children}</AppShell>
						</ToastProvider>
						<TanStackDevtools
							config={{ position: "bottom-right" }}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					</ConvexProvider>
				</ClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}
```

> `className="dark"` on `<html>` is harmless (the `.dark` block is gone; dark is the base) and keeps any `dark:` Tailwind variants that downstream code may use resolving to the dark branch.

- [ ] **Step 3: Delete the obsolete shell files**

Run:
```bash
git rm src/components/Header.tsx src/components/Footer.tsx src/components/ThemeToggle.tsx
```

- [ ] **Step 4: Check for stale imports**

Run: `npx tsc --noEmit` (i.e. `npm run typecheck`)
Expected: PASS. If anything still imports `Header`/`Footer`/`ThemeToggle`, it will surface here — fix those imports (none expected outside `__root.tsx`; verify with `git grep -n "ThemeToggle\|components/Header\|components/Footer" src`).

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all suites PASS (feature logic unchanged; new primitives + shell helpers green).

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/AppShell.tsx src/routes/__root.tsx
git commit -m "feat: mount FICSIT AppShell in root; remove Header/Footer/ThemeToggle"
```

---

## Task 17: Verification pass

**Files:** none (verification only).

- [ ] **Step 1: Static checks**

Run: `npm run check`
Expected: biome clean (fix any new lint/format issues in created files; run `npm run format` if needed then re-commit).

Run: `npm run typecheck`
Expected: PASS.

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Manual smoke pass**

Run: `npm run dev` (note: dev usually lands on port 3002 if 3000 is taken; check console). In the browser, confirm for each route that it renders inside the FICSIT shell with the dark theme, the sidebar highlights the right item, and there are no console errors:

- `/` (Overview nav active; existing index content, dark-themed via bridge)
- `/calculator` (Beta pill; calculator works — solve a target)
- `/data`, `/data/items`, `/data/items/<slug>` (a detail page)
- `/factories` and, with an active game, `/g/<id>/factories` + a factory detail
- `/map`, `/logistics`, `/games`, `/g/<id>/settings`
- `/invite/<token>` (renders in shell)

Verify specifically: no light-theme flash on load; `GameSwitcher` + Clerk user control work from the top bar; `Logistics` shows "Soon" and is non-interactive; reduced-motion (OS setting) stops the Synced-dot pulse.

- [ ] **Step 3: Final commit (if smoke-pass tweaks were needed)**

```bash
git add -A
git commit -m "fix: FICSIT shell smoke-pass adjustments"
```

> Leave the branch `ficsit-design-system` ready for review. Spec 2 (page re-skins) starts from here.

---

## Self-review notes

- **Spec §1 (tokens)** → Tasks 1–2. **§1 shadcn mapping + legacy bridge** → Task 2 Steps 2–6 (the `--accent` name clash is resolved explicitly: shadcn `--accent` → `--surface-hover`, FICSIT orange stays `--orange-500`/`--primary`). **§2 (shell)** → Tasks 13–16. **§3 (primitives)** → Tasks 3–12 (Toast intentionally untouched). **§4 (global base)** → Task 2 Step 5. **§6 (verification)** → Tasks 16–17.
- **Out-of-scope held:** no page-body edits; the ~51 legacy files restyle only via the bridge; Overview page content deferred to Spec 2; existing `Toast` kept.
- **Type consistency:** `Icon name` uses `IconName`; `nav-model` items reference `IconName`; `Tabs` uses `TabItem`; `isItemActive`/`routeMetaFor`/`resolveHref` are the exported pure helpers tested in Tasks 14/15/13.
- **Known follow-up flags (handle during execution, not blockers):** dynamic `<Link to={href}>` typing (Task 14 note) and default-vs-named exports for `GameSwitcher`/`ClerkHeader` (Task 15 note).
```
