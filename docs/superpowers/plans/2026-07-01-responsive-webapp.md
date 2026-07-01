# Responsive Webapp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FICSIT Planner usable at phone (~375px) and tablet (~768px) widths — bottom nav on phone, collapsed icon-rail sidebar on tablet, Tabs-based dual-pane pages (Calculator/Map/Logistics), and a reflowing Overview — without regressing the existing desktop layout.

**Architecture:** CSS-only responsive display switching for the app shell's nav (all three nav variants render in the DOM; Tailwind breakpoint classes decide which is visible — no client JS needed, no SSR flash). A small `useMediaQuery` hook is used only where a component must *know* its layout mode in JS: the Calculator/Map/Logistics dual-pane switch (because Leaflet and the Logistics graph must be told when their container's layout mode changes, not just styled differently).

**Deviation from the design doc, noted for transparency:** the design doc listed the AppShell nav-variant switch as one of the JS-driven cases. During planning this turned out to have a real downside — using `useMediaQuery` there would render the phone layout during SSR and on every first paint (including desktop), then flip after hydration, causing a layout flash on every single page load. Since nothing in the shell (unlike Leaflet) needs JS awareness of its own size, this plan implements the nav switch with pure CSS visibility instead (Task 7), which has no such flash and is simpler. The dual-pane switch (Calculator/Map/Logistics) keeps the `useMediaQuery` approach from the design doc, because the Leaflet-remeasurement problem it exists to solve is real.

**Tech Stack:** React 19, TanStack Router/Start, Tailwind v4, Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`), Vitest + Testing Library, existing FICSIT design-system primitives (`Panel`, `Tabs`, `Dialog`, `Icon`).

---

## Before you start

- Package manager is **npm** (there's a `package-lock.json`, no `pnpm-lock.yaml` — ignore the `pnpm` field in `package.json`, it's unused).
- Run tests with `npx vitest run <path>` for a single file, or `npm test` for the whole suite.
- Path aliases: `#/*` → `./src/*`, `#convex/*` → `./convex/*` (see `package.json` `imports`).
- Two known test-infra constraints in this codebase, both followed by this plan:
  1. Components that use `useRouterState`/`Link` need a router context in tests. The established pattern (see `src/features/data/EntityListPage.test.tsx`) is `createRootRoute` + `createRouter` + `createMemoryHistory` + `RouterProvider`.
  2. Components that transitively render `GameSwitcher` or `ClerkHeader` (both need Convex/Clerk provider context this test setup doesn't have) are **not** rendered in tests anywhere in this codebase today — e.g. `TopBar.test.tsx` only tests the pure `routeMetaFor` function, never `<TopBar/>`. This plan follows the same rule: `TopBar` and `MoreMenu` (both embed `GameSwitcher`) get no render tests, only manual verification in Task 14.

---

### Task 1: `useMediaQuery` hook

**Files:**
- Create: `src/lib/use-media-query.ts`
- Test: `src/lib/use-media-query.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/use-media-query.test.ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

class FakeMediaQueryList extends EventTarget {
	matches: boolean;
	media: string;

	constructor(query: string, matches: boolean) {
		super();
		this.media = query;
		this.matches = matches;
	}

	setMatches(next: boolean) {
		this.matches = next;
		this.dispatchEvent(new Event("change"));
	}
}

function stubMatchMedia(initialMatches: boolean) {
	const mql = new FakeMediaQueryList("(min-width: 1024px)", initialMatches);
	vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
	return mql;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useMediaQuery", () => {
	it("reflects a matching query after mount", () => {
		stubMatchMedia(true);
		const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
		expect(result.current).toBe(true);
	});

	it("reflects a non-matching query after mount", () => {
		stubMatchMedia(false);
		const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
		expect(result.current).toBe(false);
	});

	it("updates when the media query's change event fires", () => {
		const mql = stubMatchMedia(false);
		const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
		expect(result.current).toBe(false);
		act(() => {
			mql.setMatches(true);
		});
		expect(result.current).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/use-media-query.test.ts`
Expected: FAIL — `Cannot find module './use-media-query'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/use-media-query.ts
import { useEffect, useState } from "react";

/**
 * SSR-safe media query hook: returns `false` until mounted (matching what the
 * server rendered, so there's no hydration mismatch), then tracks the query
 * live via `matchMedia`.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(query);
		setMatches(mql.matches);
		const onChange = () => setMatches(mql.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/use-media-query.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/use-media-query.ts src/lib/use-media-query.test.ts
git commit -m "feat: add SSR-safe useMediaQuery hook"
```

---

### Task 2: Phone nav helpers in `nav-model.ts`

**Files:**
- Modify: `src/components/shell/nav-model.ts`
- Test: Create `src/components/shell/nav-model.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/components/shell/nav-model.test.ts
import { describe, expect, it } from "vitest";
import {
	phoneOverflowNavItems,
	phonePrimaryNavItems,
} from "./nav-model";

describe("phonePrimaryNavItems", () => {
	it("returns exactly Overview, Calculator, Game Data, World Map, in that order", () => {
		const ids = phonePrimaryNavItems().map((item) => item.id);
		expect(ids).toEqual(["overview", "calculator", "data", "map"]);
	});
});

describe("phoneOverflowNavItems", () => {
	it("returns Factories and Logistics", () => {
		const ids = phoneOverflowNavItems().map((item) => item.id);
		expect(ids).toEqual(["factories", "logistics"]);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shell/nav-model.test.ts`
Expected: FAIL — `phoneOverflowNavItems`/`phonePrimaryNavItems` are not exported.

- [ ] **Step 3: Add the helpers**

In `src/components/shell/nav-model.ts`, append after the existing `resolveHref` function (keep everything above unchanged):

```ts
/**
 * IDs shown directly in the phone bottom nav (see the
 * 2026-07-01 responsive webapp design). Everything else in `NAV_GROUPS`
 * surfaces in the "More" sheet instead.
 */
export const PHONE_PRIMARY_NAV_IDS: readonly string[] = [
	"overview",
	"calculator",
	"data",
	"map",
];

/** All nav items across every group, in `NAV_GROUPS` order. */
export function flattenNavItems(): NavItem[] {
	return NAV_GROUPS.flatMap((group) => group.items);
}

/** The phone bottom nav's 4 items, in `PHONE_PRIMARY_NAV_IDS` order. */
export function phonePrimaryNavItems(): NavItem[] {
	const all = flattenNavItems();
	return PHONE_PRIMARY_NAV_IDS.map((id) => {
		const item = all.find((candidate) => candidate.id === id);
		if (!item) throw new Error(`Unknown phone nav id: ${id}`);
		return item;
	});
}

/** Items not in the phone bottom nav — shown in the "More" sheet instead. */
export function phoneOverflowNavItems(): NavItem[] {
	return flattenNavItems().filter(
		(item) => !PHONE_PRIMARY_NAV_IDS.includes(item.id),
	);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shell/nav-model.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/nav-model.ts src/components/shell/nav-model.test.ts
git commit -m "feat: add phone nav item helpers to nav-model"
```

---

### Task 3: Bottom-anchored `Dialog` variant

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Test: Create `src/components/ui/dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/dialog.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

describe("DialogContent", () => {
	it("renders centered by default", () => {
		render(
			<Dialog open>
				<DialogContent>
					<DialogTitle>Test</DialogTitle>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByRole("dialog").className).toContain("top-1/2");
	});

	it("renders bottom-anchored when position='bottom'", () => {
		render(
			<Dialog open>
				<DialogContent position="bottom">
					<DialogTitle>Test</DialogTitle>
				</DialogContent>
			</Dialog>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("bottom-0");
		expect(dialog.className).not.toContain("top-1/2");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/dialog.test.tsx`
Expected: FAIL — `position` prop doesn't exist / bottom test fails because only the centered classes are ever applied.

- [ ] **Step 3: Add the `position` variant**

Replace the full contents of `src/components/ui/dialog.tsx`:

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ComponentRef } from "react";
import { forwardRef } from "react";
import { cn } from "#/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

type DialogContentProps = ComponentPropsWithoutRef<
	typeof DialogPrimitive.Content
> & {
	/** "center" (default, existing modal look) or "bottom" (slide-up sheet, used by the phone nav's More menu). */
	position?: "center" | "bottom";
};

export const DialogContent = forwardRef<
	ComponentRef<typeof DialogPrimitive.Content>,
	DialogContentProps
>(({ className, children, position = "center", ...props }, ref) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				"fixed z-[var(--z-modal)] overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--bevel-top),var(--shadow-xl)] focus:outline-none",
				position === "center"
					? "left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
					: "inset-x-0 bottom-0 w-full rounded-t-[var(--radius-lg)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/dialog.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/dialog.test.tsx
git commit -m "feat: add bottom-anchored position variant to Dialog"
```

---

### Task 4: `Sidebar` rail variant

**Files:**
- Modify: `src/components/shell/Sidebar.tsx`
- Modify: `src/components/shell/Sidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

Replace the full contents of `src/components/shell/Sidebar.test.tsx`:

```tsx
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Sidebar, { isItemActive } from "./Sidebar";

function renderSidebar(variant: "full" | "rail") {
	const rootRoute = createRootRoute({
		component: () => <Sidebar variant={variant} />,
	});
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	// biome-ignore lint/suspicious/noExplicitAny: test-only router typing
	return render(<RouterProvider router={router as any} />);
}

describe("Sidebar", () => {
	it("shows nav labels and the brand subtitle in full mode", () => {
		const { getByText } = renderSidebar("full");
		expect(getByText("Factories")).toBeDefined();
		expect(getByText("Factory Planner")).toBeDefined();
	});

	it("hides nav labels and the brand subtitle in rail mode", () => {
		const { queryByText } = renderSidebar("rail");
		expect(queryByText("Factories")).toBeNull();
		expect(queryByText("Factory Planner")).toBeNull();
	});
});

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

Run: `npx vitest run src/components/shell/Sidebar.test.tsx`
Expected: FAIL — `Sidebar` doesn't accept a `variant` prop yet (rail-mode test finds the labels anyway).

- [ ] **Step 3: Add the `variant` prop**

Replace the full contents of `src/components/shell/Sidebar.tsx`:

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
		return (
			pathname.startsWith("/factories") ||
			/^\/g\/[^/]+\/factories/.test(pathname)
		);
	if (itemId === "map")
		return pathname.startsWith("/map") || /^\/g\/[^/]+\/map/.test(pathname);
	if (itemId === "logistics")
		return (
			pathname.startsWith("/logistics") ||
			/^\/g\/[^/]+\/logistics/.test(pathname)
		);
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

export default function Sidebar({
	variant = "full",
	className,
}: {
	variant?: "full" | "rail";
	className?: string;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;
	const rail = variant === "rail";

	return (
		<aside
			className={cn(
				"flex flex-col border-r border-[var(--border-default)] bg-[var(--graphite-900)] shadow-[var(--shadow-lg)]",
				rail ? "w-[72px] items-center" : "w-[244px]",
				className,
			)}
		>
			<div
				className={cn(
					"flex items-center gap-3 border-b border-[var(--border-subtle)]",
					rail
						? "justify-center px-0 py-[18px]"
						: "px-[18px] pb-4 pt-[18px]",
				)}
			>
				<div className="relative flex h-[34px] w-[34px] flex-none items-center justify-center">
					<Icon name="hex" size={34} className="text-[var(--accent)]" />
					<span className="absolute h-2 w-2 rounded-[1px] bg-[var(--accent)] shadow-[var(--glow-accent-strong)]" />
				</div>
				{!rail && (
					<div className="min-w-0">
						<div className="font-[var(--font-display)] text-[15px] font-extrabold uppercase leading-none tracking-[0.1em] text-[var(--text-primary)]">
							FICSIT
						</div>
						<div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
							Factory Planner
						</div>
					</div>
				)}
			</div>

			<nav
				className={cn(
					"flex flex-1 flex-col gap-0.5 py-3.5",
					rail ? "items-center px-2" : "px-3",
				)}
			>
				{NAV_GROUPS.map((group) => (
					<div key={group.heading} className="contents">
						{!rail && (
							<div className="px-2.5 pb-2 pt-4 text-[10px] uppercase tracking-[0.16em] text-[var(--text-disabled)] first:pt-1.5">
								{group.heading}
							</div>
						)}
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
											active
												? "text-[var(--orange-400)]"
												: "text-[var(--text-muted)]",
										)}
									/>
									{!rail && <span className="relative">{item.label}</span>}
									{!rail && item.badge && <BadgePill kind={item.badge} />}
								</>
							);
							const base = cn(
								"relative flex h-[42px] items-center text-left text-[14px] font-semibold",
								rail
									? "w-[42px] justify-center rounded-[var(--radius-sm)]"
									: "w-full gap-3 rounded-[var(--radius-sm)] px-3",
							);
							if (item.disabled) {
								return (
									<span
										key={item.id}
										title={rail ? item.label : undefined}
										className={cn(
											base,
											"cursor-default text-[var(--text-disabled)]",
										)}
									>
										{inner}
									</span>
								);
							}
							return (
								<Link
									key={item.id}
									to={href as string}
									title={rail ? item.label : undefined}
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

			{!rail && (
				<div className="m-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--graphite-850)] p-3.5">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
							Grid Load
						</span>
						<span className="font-[var(--font-mono)] text-[12px] text-[var(--green-400)]">
							70%
						</span>
					</div>
					<Progress value={70} tone="success" glow />
					<div className="mt-2 flex justify-between font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">
						<span>420.6 MW</span>
						<span>/ 600 MW</span>
					</div>
				</div>
			)}
		</aside>
	);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shell/Sidebar.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/Sidebar.tsx src/components/shell/Sidebar.test.tsx
git commit -m "feat: add collapsed rail variant to Sidebar"
```

---

### Task 5: `MoreMenu` (phone nav overflow sheet)

**Files:**
- Create: `src/components/shell/MoreMenu.tsx`

No automated test — `MoreMenu` renders `GameSwitcher`, which needs Convex/Clerk provider context not set up in this test suite (see "Before you start"). Covered by manual verification in Task 14.

- [ ] **Step 1: Write the component**

```tsx
// src/components/shell/MoreMenu.tsx
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { Icon } from "#/components/ui/icon";
import GameSwitcher from "#/features/games/GameSwitcher";
import { cn } from "#/lib/utils";
import { phoneOverflowNavItems, resolveHref } from "./nav-model";

export default function MoreMenu({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent position="bottom" aria-describedby={undefined}>
				<DialogTitle className="sr-only">More</DialogTitle>
				<div className="flex flex-col gap-0.5 p-3">
					{phoneOverflowNavItems().map((item) => {
						const href = resolveHref(item, activeGameId);
						const inner = (
							<>
								<Icon
									name={item.icon}
									size={19}
									className="text-[var(--text-muted)]"
								/>
								<span>{item.label}</span>
								{item.badge && (
									<span className="ml-auto text-[10px] uppercase tracking-[0.1em] text-[var(--text-disabled)]">
										{item.badge === "beta" ? "Beta" : "Soon"}
									</span>
								)}
							</>
						);
						const base =
							"flex h-[46px] w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-[14px] font-semibold";
						if (item.disabled) {
							return (
								<span
									key={item.id}
									className={cn(base, "cursor-default text-[var(--text-disabled)]")}
								>
									{inner}
								</span>
							);
						}
						return (
							<Link
								key={item.id}
								to={href as string}
								onClick={() => onOpenChange(false)}
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
				<div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-4 py-3">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[var(--green-500)] shadow-[var(--glow-success)] [animation:ficsit-pulse_2.4s_var(--ease-standard)_infinite]" />
						<span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
							Synced
						</span>
					</div>
					<GameSwitcher />
				</div>
			</DialogContent>
		</Dialog>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors from `MoreMenu.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/MoreMenu.tsx
git commit -m "feat: add MoreMenu phone nav overflow sheet"
```

---

### Task 6: `BottomNav` (phone tab bar)

**Files:**
- Create: `src/components/shell/BottomNav.tsx`
- Test: Create `src/components/shell/BottomNav.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/shell/BottomNav.test.tsx
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BottomNav from "./BottomNav";

function renderBottomNav(initialUrl: string) {
	const rootRoute = createRootRoute({ component: BottomNav });
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: [initialUrl] }),
	});
	// biome-ignore lint/suspicious/noExplicitAny: test-only router typing
	return render(<RouterProvider router={router as any} />);
}

describe("BottomNav", () => {
	it("shows exactly the 4 primary items plus More", () => {
		const { getByText } = renderBottomNav("/calculator");
		expect(getByText("Overview")).toBeDefined();
		expect(getByText("Calculator")).toBeDefined();
		expect(getByText("Game Data")).toBeDefined();
		expect(getByText("World Map")).toBeDefined();
		expect(getByText("More")).toBeDefined();
	});

	it("does not show Factories directly (it lives behind More)", () => {
		const { queryByText } = renderBottomNav("/calculator");
		expect(queryByText("Factories")).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shell/BottomNav.test.tsx`
Expected: FAIL — `Cannot find module './BottomNav'`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/shell/BottomNav.tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/components/ui/icon";
import { cn } from "#/lib/utils";
import MoreMenu from "./MoreMenu";
import { isItemActive } from "./Sidebar";
import { phoneOverflowNavItems, phonePrimaryNavItems, resolveHref } from "./nav-model";

export default function BottomNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [moreOpen, setMoreOpen] = useState(false);
	const activeGameId =
		typeof localStorage !== "undefined"
			? localStorage.getItem("activeGameId")
			: null;

	const overflowActive = phoneOverflowNavItems().some((item) =>
		isItemActive(item.id, pathname),
	);

	return (
		<>
			<nav
				className="fixed inset-x-0 bottom-0 z-[var(--z-raised)] flex h-[60px] items-stretch border-t border-[var(--border-default)] bg-[var(--graphite-900)] md:hidden"
				aria-label="Primary"
			>
				{phonePrimaryNavItems().map((item) => {
					const active = isItemActive(item.id, pathname);
					return (
						<Link
							key={item.id}
							to={resolveHref(item, activeGameId) as string}
							className={cn(
								"flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.06em]",
								active
									? "text-[var(--orange-400)]"
									: "text-[var(--text-muted)]",
							)}
						>
							<Icon name={item.icon} size={20} />
							{item.label}
						</Link>
					);
				})}
				<button
					type="button"
					onClick={() => setMoreOpen(true)}
					className={cn(
						"flex flex-1 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.06em]",
						overflowActive
							? "text-[var(--orange-400)]"
							: "text-[var(--text-muted)]",
					)}
				>
					<span className="text-lg leading-none">⋯</span>
					More
				</button>
			</nav>
			<MoreMenu open={moreOpen} onOpenChange={setMoreOpen} />
		</>
	);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shell/BottomNav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/BottomNav.tsx src/components/shell/BottomNav.test.tsx
git commit -m "feat: add BottomNav phone tab bar"
```

---

### Task 7: Wire `AppShell` — CSS-only nav switch

**Files:**
- Modify: `src/components/shell/AppShell.tsx`

No new test (matches existing convention — `AppShell` has no test today, and rendering it needs the same Convex/Clerk/Router context problem noted above).

- [ ] **Step 1: Replace `AppShell.tsx`**

Replace the full contents of `src/components/shell/AppShell.tsx`:

```tsx
import type { ReactNode } from "react";
import SymbolDefs from "#/components/ui/symbol-defs";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-[var(--graphite-950)] text-[var(--text-primary)]">
			<SymbolDefs />
			<Sidebar variant="full" className="hidden lg:flex" />
			<Sidebar variant="rail" className="hidden md:flex lg:hidden" />
			<div className="flex min-w-0 flex-1 flex-col">
				<TopBar />
				<main
					className="flex-1 overflow-y-auto bg-[var(--graphite-950)] pb-[60px] md:pb-0"
					style={{
						backgroundImage: "var(--tex-grid)",
						backgroundSize: "var(--tex-grid-size)",
					}}
				>
					{children}
				</main>
				<BottomNav />
			</div>
		</div>
	);
}
```

Note: `Sidebar`'s own root class list includes an unprefixed `flex` (see Task 4). `cn()` (clsx + tailwind-merge) resolves the conflict between that base `flex` and the `hidden` passed here in favor of the later one (`hidden`), while `lg:flex` (a different, prefixed utility group) is kept — so each `<Sidebar>` above is genuinely `display:none` outside its tier and `display:flex` inside it, entirely via CSS, no JS. `<main>`'s bottom padding (`pb-[60px] md:pb-0`) keeps page content from being hidden behind the fixed `BottomNav` on phone.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/AppShell.tsx
git commit -m "feat: wire responsive nav variants into AppShell"
```

---

### Task 8: `TopBar` responsive collapse

**Files:**
- Modify: `src/components/shell/TopBar.tsx`

No new test — `TopBar` embeds `GameSwitcher`/`ClerkHeader` (see "Before you start"); `routeMetaFor`'s existing tests in `TopBar.test.tsx` are untouched by this change and must still pass.

- [ ] **Step 1: Replace `TopBar.tsx`**

Replace the full contents of `src/components/shell/TopBar.tsx`:

```tsx
import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "#/components/ui/icon";
import GameSwitcher from "#/features/games/GameSwitcher";
import ClerkHeader from "#/integrations/clerk/header-user";

interface RouteMeta {
	title: string;
	subtitle: string;
}

const META: Array<{ test: (p: string) => boolean; meta: RouteMeta }> = [
	{
		test: (p) => p === "/",
		meta: { title: "Overview", subtitle: "Live factory network status" },
	},
	{
		test: (p) => p.startsWith("/calculator"),
		meta: {
			title: "Production Calculator",
			subtitle: "LP-optimized production planning",
		},
	},
	{
		test: (p) => p.startsWith("/data"),
		meta: {
			title: "Game Data",
			subtitle: "Items · recipes · buildings · schematics",
		},
	},
	{
		test: (p) => /\/factories/.test(p),
		meta: {
			title: "Factories",
			subtitle: "Manage and inspect production sites",
		},
	},
	{
		test: (p) => /\/map/.test(p),
		meta: {
			title: "World Map",
			subtitle: "Explored regions and resource nodes",
		},
	},
	{
		test: (p) => /\/logistics/.test(p),
		meta: { title: "Logistics", subtitle: "Factory network and transport" },
	},
	{
		test: (p) => p.startsWith("/games") || /^\/g\//.test(p),
		meta: { title: "Games", subtitle: "Your save games and collaborators" },
	},
];

/** Pure: resolve title/subtitle for a pathname. */
export function routeMetaFor(pathname: string): RouteMeta {
	return (
		META.find((m) => m.test(pathname))?.meta ?? {
			title: "FICSIT Planner",
			subtitle: "",
		}
	);
}

export default function TopBar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { title, subtitle } = routeMetaFor(pathname);
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<>
			<header className="relative z-[var(--z-raised)] flex h-[68px] flex-none items-center gap-[18px] border-b border-[var(--border-default)] bg-[var(--graphite-900)] px-4 md:px-[26px]">
				<div className="min-w-0 flex-1 md:flex-none">
					<h1 className="m-0 truncate font-[var(--font-display)] text-[18px] font-bold uppercase leading-none tracking-[0.04em] text-[var(--text-primary)] md:text-[22px]">
						{title}
					</h1>
					{subtitle && (
						<div className="mt-1 hidden truncate text-[12px] tracking-[0.04em] text-[var(--text-muted)] md:block">
							{subtitle}
						</div>
					)}
				</div>

				{/* Desktop search: persistent input, lg+ only */}
				<div className="ml-auto hidden w-[280px] flex-none lg:block">
					<div className="flex h-[38px] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 shadow-[var(--bevel-inset)]">
						<Icon
							name="search"
							size={16}
							className="flex-none text-[var(--text-muted)]"
						/>
						<input
							placeholder="Search items, recipes, buildings…"
							className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						/>
					</div>
				</div>

				{/* Collapsed search below lg: icon button, expands to an overlay input on tap */}
				<div className="flex-none lg:hidden">
					<button
						type="button"
						aria-label="Search"
						onClick={() => setSearchOpen((open) => !open)}
						className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
					>
						<Icon name="search" size={18} />
					</button>
				</div>

				{/* Synced status: hidden on phone, dot-only on tablet, dot+label on desktop */}
				<div className="hidden flex-none items-center gap-2 border-l border-[var(--border-subtle)] pl-3 md:flex">
					<span className="h-2 w-2 rounded-full bg-[var(--green-500)] shadow-[var(--glow-success)] [animation:ficsit-pulse_2.4s_var(--ease-standard)_infinite]" />
					<span className="hidden text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] lg:inline">
						Synced
					</span>
				</div>

				{/* GameSwitcher: hidden on phone (lives in the More sheet instead) */}
				<div className="hidden flex-none md:block">
					<GameSwitcher />
				</div>

				<div className="flex flex-none items-center gap-1.5">
					<ClerkHeader />
				</div>
			</header>

			{searchOpen && (
				<div className="fixed inset-x-0 top-[68px] z-[var(--z-raised)] border-b border-[var(--border-default)] bg-[var(--graphite-900)] p-3 lg:hidden">
					<div className="flex h-[42px] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] px-3 shadow-[var(--bevel-inset)]">
						<Icon
							name="search"
							size={16}
							className="flex-none text-[var(--text-muted)]"
						/>
						<input
							autoFocus
							placeholder="Search items, recipes, buildings…"
							onBlur={() => setSearchOpen(false)}
							className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						/>
					</div>
				</div>
			)}
		</>
	);
}
```

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run src/components/shell/TopBar.test.tsx`
Expected: PASS (4 tests — `routeMetaFor` is untouched).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/TopBar.tsx
git commit -m "feat: collapse TopBar search/status/GameSwitcher responsively"
```

---

### Task 9: Shared `DualPaneLayout`

**Files:**
- Create: `src/components/ui/dual-pane-layout.tsx`
- Test: Create `src/components/ui/dual-pane-layout.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/dual-pane-layout.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DualPaneLayout } from "./dual-pane-layout";

function stubMatchMedia(matches: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn().mockReturnValue({
			matches,
			media: "",
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}),
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("DualPaneLayout", () => {
	it("renders both panes side by side at desktop width, with no tab bar", () => {
		stubMatchMedia(true);
		render(
			<DualPaneLayout
				leftLabel="Setup"
				left={<p>Setup content</p>}
				rightLabel="Results"
				right={<p>Results content</p>}
				gridClassName="grid-cols-2"
			/>,
		);
		expect(screen.getByText("Setup content")).toBeDefined();
		expect(screen.getByText("Results content")).toBeDefined();
		expect(screen.queryByRole("tablist")).toBeNull();
	});

	it("shows only the default tab's pane below desktop width", () => {
		stubMatchMedia(false);
		render(
			<DualPaneLayout
				leftLabel="Setup"
				left={<p>Setup content</p>}
				rightLabel="Results"
				right={<p>Results content</p>}
				gridClassName="grid-cols-2"
			/>,
		);
		expect(screen.getByText("Setup content")).toBeDefined();
		expect(screen.queryByText("Results content")).toBeNull();
	});

	it("switches panes when the other tab is clicked", () => {
		stubMatchMedia(false);
		render(
			<DualPaneLayout
				leftLabel="Setup"
				left={<p>Setup content</p>}
				rightLabel="Results"
				right={<p>Results content</p>}
				gridClassName="grid-cols-2"
			/>,
		);
		fireEvent.click(screen.getByRole("tab", { name: "Results" }));
		expect(screen.getByText("Results content")).toBeDefined();
		expect(screen.queryByText("Setup content")).toBeNull();
	});

	it("honors defaultTab='right'", () => {
		stubMatchMedia(false);
		render(
			<DualPaneLayout
				leftLabel="Panel"
				left={<p>Panel content</p>}
				rightLabel="Network"
				right={<p>Network content</p>}
				gridClassName="grid-cols-2"
				defaultTab="right"
			/>,
		);
		expect(screen.getByText("Network content")).toBeDefined();
		expect(screen.queryByText("Panel content")).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/dual-pane-layout.test.tsx`
Expected: FAIL — `Cannot find module './dual-pane-layout'`.

- [ ] **Step 3: Write the component**

```tsx
// src/components/ui/dual-pane-layout.tsx
import type { ReactNode } from "react";
import { useState } from "react";
import { useMediaQuery } from "#/lib/use-media-query";
import { cn } from "#/lib/utils";
import { Tabs } from "./tabs";

/** True at `lg` (1024px) and above — matches this app's existing `lg:` grid breakpoints. */
export function useIsDesktopDualPane(): boolean {
	return useMediaQuery("(min-width: 1024px)");
}

interface DualPaneLayoutProps {
	leftLabel: string;
	left: ReactNode;
	rightLabel: string;
	right: ReactNode;
	/** Tailwind grid classes applied once side-by-side desktop layout kicks in, e.g. "grid-cols-[332px_1fr] gap-6 items-start". */
	gridClassName: string;
	/** Which pane is active by default below the desktop breakpoint. Defaults to "left". */
	defaultTab?: "left" | "right";
	className?: string;
}

/**
 * Two-pane page layout: side-by-side grid at `lg` and above, a Tabs-driven
 * single active pane below it. Used by Calculator, Map, and Logistics.
 */
export function DualPaneLayout({
	leftLabel,
	left,
	rightLabel,
	right,
	gridClassName,
	defaultTab = "left",
	className,
}: DualPaneLayoutProps) {
	const isDesktop = useIsDesktopDualPane();

	if (isDesktop) {
		return (
			<div className={cn("grid", gridClassName, className)}>
				{left}
				{right}
			</div>
		);
	}

	return (
		<TabbedPane
			leftLabel={leftLabel}
			left={left}
			rightLabel={rightLabel}
			right={right}
			defaultTab={defaultTab}
			className={className}
		/>
	);
}

function TabbedPane({
	leftLabel,
	left,
	rightLabel,
	right,
	defaultTab,
	className,
}: Omit<DualPaneLayoutProps, "gridClassName"> & {
	defaultTab: "left" | "right";
}) {
	const [tab, setTab] = useState<"left" | "right">(defaultTab);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<Tabs
				items={[
					{ id: "left", label: leftLabel },
					{ id: "right", label: rightLabel },
				]}
				value={tab}
				onChange={(id) => setTab(id as "left" | "right")}
			/>
			{tab === "left" ? left : right}
		</div>
	);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/dual-pane-layout.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dual-pane-layout.tsx src/components/ui/dual-pane-layout.test.tsx
git commit -m "feat: add shared DualPaneLayout (Tabs below lg, grid at lg+)"
```

---

### Task 10: Apply `DualPaneLayout` to Calculator

**Files:**
- Modify: `src/features/calculator/CalculatorPage.tsx`

- [ ] **Step 1: Replace the return statement**

In `src/features/calculator/CalculatorPage.tsx`, add the import (alongside the existing `Panel`/`Stat` imports near the top):

```tsx
import { DualPaneLayout } from "#/components/ui/dual-pane-layout";
```

Then replace the entire `return (...)` block (everything from `return (` to the matching closing `);` at the end of the component) with:

```tsx
	return (
		<div className="mx-auto max-w-[1320px] px-7 pb-[60px] pt-6">
			<DualPaneLayout
				gridClassName="grid-cols-[332px_1fr] items-start gap-6"
				leftLabel="Setup"
				left={
					<div className="flex flex-col gap-[18px]">
						<Panel className="p-[18px]">
							<CalculatorControls
								mode={mode}
								onModeChange={setMode}
								weighting={weighting}
								onWeightingChange={setWeighting}
							/>
						</Panel>
						<Panel title="Targets">
							<div className="p-4">
								<TargetEditor targets={targets} onChange={setTargets} />
							</div>
						</Panel>
						<Panel title="Available Inputs">
							<div className="p-4">
								<AvailableInputsEditor
									inputs={availableInputs}
									onChange={setAvailableInputs}
								/>
							</div>
						</Panel>
						<Panel title="Alternate Recipes">
							<div className="p-4">
								<RecipeOptions
									allowedAlternates={allowedAlternates}
									onChange={setAllowedAlternates}
								/>
							</div>
						</Panel>
					</div>
				}
				rightLabel="Results"
				right={
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
							<Panel className="p-8">
								<p className="text-center text-[13px] text-[var(--text-muted)]">
									Solving…
								</p>
							</Panel>
						) : solution ? (
							<>
								{solution.status !== "infeasible" && (
									<div className="grid grid-cols-4 gap-3.5">
										<Panel topRail className="px-[18px] py-[15px]">
											<Stat
												label="Total Power"
												value={formatPower(solution.power).replace(/\s*MW$/, "")}
												unit="MW"
											/>
										</Panel>
										<Panel className="px-[18px] py-[15px]">
											<Stat
												label="Machines"
												value={String(
													solution.recipes.reduce(
														(s, u) => s + Math.ceil(u.machines),
														0,
													),
												)}
											/>
										</Panel>
										<Panel className="px-[18px] py-[15px]">
											<Stat
												label={
													solution.rawInputs[0]
														? name(solution.rawInputs[0].item)
														: "Raw inputs"
												}
												value={
													solution.rawInputs[0]
														? formatNumber(solution.rawInputs[0].rate)
														: "0"
												}
												unit="/min"
											/>
										</Panel>
										<Panel className="px-[18px] py-[15px]">
											<Stat
												label="Byproducts"
												value={String(solution.byproducts.length)}
											/>
										</Panel>
									</div>
								)}
								<Panel>
									<div className="px-[18px] pt-2.5">
										<ResultTabs solution={solution} />
									</div>
									<div className="flex justify-end px-[18px] pb-3">
										<SaveAsFactoryButton
											spec={spec}
											solution={solution}
											game={roundTrip.game}
											factory={roundTrip.factory}
										/>
									</div>
								</Panel>
							</>
						) : null}
					</div>
				}
			/>
		</div>
	);
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, open `/calculator`. At a wide window it should look unchanged (Setup left, Results right). Narrow the window below 1024px — a "Setup" / "Results" tab bar should appear, each full width.

- [ ] **Step 4: Commit**

```bash
git add src/features/calculator/CalculatorPage.tsx
git commit -m "feat: apply DualPaneLayout to Calculator"
```

---

### Task 11: Apply `DualPaneLayout` to Map (+ Leaflet remeasure)

**Files:**
- Modify: `src/features/map/MapPage.tsx`

- [ ] **Step 1: Replace `MapPage.tsx`**

Replace the full contents of `src/features/map/MapPage.tsx`:

```tsx
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { DualPaneLayout, useIsDesktopDualPane } from "#/components/ui/dual-pane-layout";
import { Panel } from "#/components/ui/panel";
import type { ResourceNode } from "#/data/schema";
import { useGameId } from "#/features/games/useGameId";
import FactoryPinsLayer from "./FactoryPinsLayer";
import LayerPanel from "./LayerPanel";
import MapView from "./MapView";
import ResourceNodesLayer from "./ResourceNodesLayer";

const ALL_PURITIES = new Set<ResourceNode["purity"]>([
	"impure",
	"normal",
	"pure",
]);

/** Static legend entries shown in the Resource Nodes panel. */
const NODE_LEGEND = [
	{ label: "Iron Ore", color: "var(--graphite-100)" },
	{ label: "Copper Ore", color: "var(--orange-500)" },
	{ label: "Limestone", color: "var(--concrete-400)" },
	{ label: "Coal", color: "var(--graphite-400)" },
	{ label: "Crude Oil", color: "var(--green-500)" },
	{ label: "Caterium Ore", color: "var(--yellow-400)" },
	{ label: "Sulfur", color: "var(--yellow-500)" },
	{ label: "Bauxite", color: "var(--red-400)" },
	{ label: "Raw Quartz", color: "var(--blue-300)" },
	{ label: "SAM Ore", color: "var(--purple-400)" },
	{ label: "Uranium", color: "var(--lime-400)" },
	{ label: "Nitrogen Gas", color: "var(--blue-400)" },
] as const;

export default function MapPage() {
	const gameId = useGameId();
	const [showFactories, setShowFactories] = useState(true);
	const [showNodes, setShowNodes] = useState(true);
	// Forces MapView to remount (and Leaflet to re-measure) when the layout
	// mode flips between the Tabs view and the side-by-side grid — Leaflet
	// does not detect a pure CSS container-size change on its own.
	const isDesktop = useIsDesktopDualPane();

	return (
		<main className="page-wrap px-4 py-8">
			<DualPaneLayout
				gridClassName="grid-cols-[1fr_300px] gap-5"
				leftLabel="Map"
				left={
					<div
						className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] shadow-[var(--bevel-top),var(--shadow-lg)]"
						style={{ minHeight: 480 }}
					>
						<MapView key={isDesktop ? "desktop" : "mobile"}>
							{showNodes && <ResourceNodesLayer purities={ALL_PURITIES} />}
							{showFactories && (
								<Authenticated>
									<FactoryPinsLayer gameId={gameId} />
								</Authenticated>
							)}
						</MapView>
					</div>
				}
				rightLabel="Layers"
				right={
					<div className="flex flex-col gap-4">
						<LayerPanel
							showFactories={showFactories}
							showNodes={showNodes}
							onToggleFactories={setShowFactories}
							onToggleNodes={setShowNodes}
						/>

						<Unauthenticated>
							<p className="px-1 text-xs text-[var(--text-muted)]">
								Sign in to see your factories on the map.
							</p>
						</Unauthenticated>

						{/* Resource Nodes legend */}
						<Panel title="Resource Nodes">
							<div className="flex flex-col">
								{NODE_LEGEND.map((node) => (
									<div
										key={node.label}
										className="flex items-center gap-[11px] border-t border-[var(--border-subtle)] px-[18px] py-[11px]"
									>
										<span
											className="h-[9px] w-[9px] shrink-0 rounded-full"
											style={{ background: node.color }}
										/>
										<span className="flex-1 text-[13px] text-[var(--text-secondary)]">
											{node.label}
										</span>
									</div>
								))}
							</div>
						</Panel>

						{/* Save File */}
						<Panel topRail>
							<div className="px-[18px] py-[16px]">
								<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
									Save File
								</div>
								<p className="mt-2 text-[13px] leading-[1.5] text-[var(--text-secondary)]">
									Load a Satisfactory save to pin every factory and node
									automatically. Parsed locally in your browser.
								</p>
								<div className="mt-[13px]">
									<Button variant="secondary" size="sm" fullWidth>
										Load Save File
									</Button>
								</div>
							</div>
						</Panel>
					</div>
				}
			/>
		</main>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, open `/map` (or `/g/$gameId/map`). At a wide window: unchanged (map left, legend right). Narrow below 1024px: "Map" / "Layers" tabs appear; switching to "Map" shows a correctly-sized Leaflet map (not a broken/gray 0×0 tile area — that would indicate the `key` remount isn't taking effect).

- [ ] **Step 4: Commit**

```bash
git add src/features/map/MapPage.tsx
git commit -m "feat: apply DualPaneLayout to Map, remount Leaflet on mode switch"
```

---

### Task 12: Apply `DualPaneLayout` to Logistics (+ graph remeasure)

**Files:**
- Modify: `src/features/logistics/LogisticsPage.tsx`

- [ ] **Step 1: Replace `LogisticsPage.tsx`**

Replace the full contents of `src/features/logistics/LogisticsPage.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { lazy, Suspense, useState } from "react";
import { useToast } from "#/components/Toast";
import { DualPaneLayout, useIsDesktopDualPane } from "#/components/ui/dual-pane-layout";
import { getItem } from "#/data";
import { useGameId } from "#/features/games/useGameId";
import { formatNumber } from "#/lib/format";
import { api } from "#convex/_generated/api";
import LinkForm, { type LinkDraft } from "./LinkForm";
import { computeNetwork, suggestSources } from "./logistics";
import SummaryCard from "./SummaryCard";
import { beltFor, pipeFor } from "./throughput";

const NetworkGraph = lazy(() => import("./NetworkGraph"));

/** Derived belt/pipe sizing, or the free-text note for other modes. */
function linkSettings(
	mode: LinkDraft["mode"],
	rate: number,
	note?: string,
): string {
	if (mode === "belt") {
		const { tier, count } = beltFor(rate);
		return `Mk${tier} ×${count} belt`;
	}
	if (mode === "pipe") {
		const { tier, count } = pipeFor(rate);
		return `Mk${tier} ×${count} pipe`;
	}
	return note ? `${mode} · ${note}` : mode;
}

function Network() {
	const gameId = useGameId();
	const factories = useQuery(api.factories.list, gameId ? { gameId } : "skip");
	const transports = useQuery(
		api.transports.list,
		gameId ? { gameId } : "skip",
	);
	const create = useMutation(api.transports.create);
	const remove = useMutation(api.transports.remove);
	const { toast } = useToast();
	const [prefill, setPrefill] = useState<
		{ fromFactoryId: string; item: string } | undefined
	>(undefined);
	// Forces NetworkGraph to remount when the layout mode flips between the
	// Tabs view and the side-by-side grid, so it re-measures its container.
	const isDesktop = useIsDesktopDualPane();

	if (factories === undefined || transports === undefined) {
		return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;
	}
	if (factories.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-[var(--border-default)] p-8 text-center text-sm text-[var(--text-muted)]">
				Create factories first, then link them here.
			</p>
		);
	}

	const onCreate = (draft: LinkDraft) =>
		create({
			gameId,
			fromFactoryId: draft.fromFactoryId as (typeof factories)[number]["_id"],
			toFactoryId: draft.toFactoryId as (typeof factories)[number]["_id"],
			item: draft.item,
			rate: draft.rate,
			mode: draft.mode,
			note: draft.note,
		}).catch(() => toast("Couldn't create the link."));

	const net = computeNetwork(factories, transports);
	const suggestions = [...net.byFactory]
		.flatMap(([factoryId, bal]) =>
			bal.needs.map((need) => ({ factoryId, need })),
		)
		.map(({ factoryId, need }) => ({
			factoryId,
			need,
			sources: suggestSources(need.item, factories, transports),
		}))
		.filter((s) => s.sources.length > 0);

	return (
		<DualPaneLayout
			gridClassName="grid-cols-[300px_1fr] gap-6"
			leftLabel="Panel"
			left={
				<div className="flex flex-col gap-4">
					<LinkForm factories={factories} prefill={prefill} onCreate={onCreate} />
					{suggestions.length > 0 && (
						<div className="flex flex-col gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-inset)] p-4">
							<h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
								Suggested links
							</h2>
							{suggestions.map((s) =>
								s.sources.map((src) => (
									<button
										key={`${s.factoryId}:${s.need.item}:${src.factoryId}`}
										type="button"
										onClick={() =>
											setPrefill({
												fromFactoryId: src.factoryId,
												item: s.need.item,
											})
										}
										className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:border-[var(--text-primary)]"
									>
										{getItem(s.need.item)?.name ?? s.need.item}: source from a
										factory with surplus
									</button>
								)),
							)}
						</div>
					)}
					<SummaryCard factories={factories} transports={transports} />
					<div className="flex flex-col gap-2">
						{transports.map((t) => (
							<div
								key={t._id}
								className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
							>
								<span className="flex-1">
									{getItem(t.item)?.name ?? t.item} · {formatNumber(t.rate)}/min ·{" "}
									{linkSettings(t.mode, t.rate, t.note)}
								</span>
								<button
									type="button"
									onClick={() =>
										remove({ id: t._id }).catch(() =>
											toast("Couldn't remove the link."),
										)
									}
									aria-label={`Remove ${getItem(t.item)?.name ?? t.item} link`}
									className="text-[var(--text-muted)] hover:text-red-500"
								>
									×
								</button>
							</div>
						))}
					</div>
				</div>
			}
			rightLabel="Network"
			right={
				<Suspense
					fallback={
						<p className="p-8 text-center text-sm text-[var(--text-muted)]">
							Loading graph…
						</p>
					}
				>
					<NetworkGraph
						key={isDesktop ? "desktop" : "mobile"}
						factories={factories}
						transports={transports}
						gameId={gameId}
					/>
				</Suspense>
			}
			defaultTab="right"
		/>
	);
}

export default function LogisticsPage() {
	return (
		<main className="page-wrap flex flex-col gap-6 px-4 py-8">
			<h1 className="text-2xl font-bold text-[var(--text-primary)]">
				Logistics
			</h1>
			<Unauthenticated>
				<div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-inset)] p-8 text-center">
					<p className="text-sm text-[var(--text-muted)]">
						Sign in to connect your factories into a logistics network.
					</p>
					<div className="mt-4">
						<Link
							to="/sign-in"
							className="rounded-lg bg-[var(--orange-500)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)]"
						>
							Sign in
						</Link>
					</div>
				</div>
			</Unauthenticated>
			<Authenticated>
				<Network />
			</Authenticated>
		</main>
	);
}
```

Note: `defaultTab="right"` means the Network graph tab (not the link-entry panel) is what's shown by default on phone/tablet — matching the design spec's listed order ("Network / Panel"). The desktop grid column order is unaffected (`left` = 300px panel column, `right` = 1fr graph column, same as today).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, open `/logistics` (or `/g/$gameId/logistics`) signed in with at least one factory. At a wide window: unchanged. Narrow below 1024px: "Panel" / "Network" tabs appear, defaulting to "Network"; the graph renders at full size (not collapsed to 0 height).

- [ ] **Step 4: Commit**

```bash
git add src/features/logistics/LogisticsPage.tsx
git commit -m "feat: apply DualPaneLayout to Logistics, remount graph on mode switch"
```

---

### Task 13: Overview responsive stat grid + table→cards

**Files:**
- Modify: `src/features/overview/OverviewPage.tsx`

- [ ] **Step 1: Replace `OverviewPage.tsx`**

Replace the full contents of `src/features/overview/OverviewPage.tsx`:

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
	{
		name: "Northern Steel Works",
		outputs: "Steel Beam · Steel Pipe · Encased Beam",
		power: "186 MW",
		eff: 94,
	},
	{
		name: "Plastic Refinery Delta",
		outputs: "Plastic · Rubber",
		power: "142 MW",
		eff: 88,
	},
	{
		name: "Modular Frame Assembly",
		outputs: "Modular Frame · Reinforced Plate",
		power: "— MW",
		eff: null,
	},
	{
		name: "Copper Sheet Array",
		outputs: "Copper Sheet",
		power: "64 MW",
		eff: 100,
	},
	{ name: "Rotor Line 07", outputs: "Rotor · Screw", power: "0 MW", eff: null },
	{
		name: "Computer Manufactory",
		outputs: "Computer",
		power: "128 MW",
		eff: 76,
	},
];
const ALERTS: OvAlert[] = [
	{
		tag: "Power Fault",
		color: "var(--red-400)",
		text: "Grid 2 tripped at 04:12 — Rotor Line 07 lost power and is now offline.",
	},
	{
		tag: "Input Starved",
		color: "var(--yellow-400)",
		text: "Computer Manufactory running at 76% — Circuit Board supply below demand.",
	},
	{
		tag: "Milestone",
		color: "var(--green-400)",
		text: "Tier 6 complete: Pipeline Engineering Mk.II unlocked at the HUB.",
	},
];

function effFillTone(eff: number) {
	return eff >= 95 ? "success" : eff >= 80 ? "warning" : "danger";
}
function effColor(eff: number) {
	return eff >= 95
		? "var(--green-400)"
		: eff >= 80
			? "var(--yellow-400)"
			: "var(--red-400)";
}

function FactoryEfficiencyMeter({ eff }: { eff: number | null }) {
	return (
		<div className="flex flex-1 items-center gap-2.5">
			{eff == null ? (
				<div className="h-[7px] flex-1 rounded-[2px] border border-[var(--border-default)] bg-[var(--bg-inset)] shadow-[var(--bevel-inset)]" />
			) : (
				<Progress className="flex-1" value={eff} tone={effFillTone(eff)} />
			)}
			<span
				className="w-[34px] text-right font-[var(--font-mono)] text-[12px]"
				style={{
					color: eff == null ? "var(--text-disabled)" : effColor(eff),
				}}
			>
				{eff == null ? "—" : `${eff}%`}
			</span>
		</div>
	);
}

function FactoryNameCell({ factory }: { factory: OvFactory }) {
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<span
				className="h-2.5 w-2.5 flex-none rounded-full"
				style={{
					background:
						factory.eff == null ? "var(--graphite-400)" : effColor(factory.eff),
					boxShadow:
						factory.eff == null ? "none" : `0 0 8px ${effColor(factory.eff)}`,
				}}
			/>
			<div className="min-w-0">
				<div className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
					{factory.name}
				</div>
				<div className="truncate text-[11px] text-[var(--text-muted)]">
					{factory.outputs}
				</div>
			</div>
		</div>
	);
}

export default function OverviewPage() {
	return (
		<div className="mx-auto flex max-w-[1280px] flex-col gap-[22px] px-7 pb-[60px] pt-[26px]">
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Panel topRail className="px-5 py-[18px]">
					<Stat
						label="Total Power Draw"
						value="420.6"
						unit="MW"
						delta="+18.2 MW vs plan"
						deltaTone="positive"
					/>
				</Panel>
				<Panel className="px-5 py-[18px]">
					<Stat
						label="Network Throughput"
						value="1.34"
						unit="k/min"
						delta="+96 items/min"
						deltaTone="positive"
					/>
				</Panel>
				<Panel className="px-5 py-[18px]">
					<Stat
						label="Factories Online"
						value="4/6"
						unit="sites"
						delta="2 offline"
						deltaTone="neutral"
					/>
				</Panel>
				<Panel className="px-5 py-[18px]">
					<Stat
						label="Avg Efficiency"
						value="89"
						unit="%"
						delta="-3% vs plan"
						deltaTone="danger"
					/>
				</Panel>
			</div>

			<div className="grid items-start gap-[22px] lg:grid-cols-[1.6fr_1fr]">
				<Panel
					title="Factory Network"
					headerAction={
						<Link
							to="/factories"
							className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--orange-400)] no-underline"
						>
							View all <Icon name="chevron" size={14} />
						</Link>
					}
				>
					<div className="flex flex-col">
						{FACTORIES.map((f) => (
							<div
								key={f.name}
								className="border-t border-[var(--border-subtle)] first:border-t-0"
							>
								{/* Phone/tablet: stacked card */}
								<div className="flex flex-col gap-2.5 px-5 py-3.5 md:hidden">
									<div className="flex items-center justify-between gap-3">
										<FactoryNameCell factory={f} />
										<Icon
											name="chevron"
											size={16}
											className="flex-none text-[var(--text-disabled)]"
										/>
									</div>
									<div className="flex items-center gap-3.5 pl-5">
										<span className="font-[var(--font-mono)] text-[12px] text-[var(--text-secondary)]">
											{f.power}
										</span>
										<FactoryEfficiencyMeter eff={f.eff} />
									</div>
								</div>

								{/* Desktop: original 4-column row */}
								<div className="hidden grid-cols-[minmax(0,1.7fr)_70px_minmax(90px,1fr)_16px] items-center gap-3.5 px-5 py-3.5 md:grid">
									<FactoryNameCell factory={f} />
									<div className="text-right font-[var(--font-mono)] text-[12px] text-[var(--text-secondary)]">
										{f.power}
									</div>
									<FactoryEfficiencyMeter eff={f.eff} />
									<Icon
										name="chevron"
										size={16}
										className="text-[var(--text-disabled)]"
									/>
								</div>
							</div>
						))}
					</div>
				</Panel>

				<div className="flex flex-col gap-[22px]">
					<Panel
						title="Alerts"
						headerAction={
							<span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
								{ALERTS.length}
							</span>
						}
					>
						<div className="flex flex-col">
							{ALERTS.map((a) => (
								<div
									key={a.tag}
									className="flex gap-3 border-t border-[var(--border-subtle)] px-5 py-3.5 first:border-t-0"
								>
									<span
										className="mt-[5px] h-[7px] w-[7px] flex-none rounded-full"
										style={{
											background: a.color,
											boxShadow: `0 0 8px ${a.color}`,
										}}
									/>
									<div className="min-w-0">
										<div
											className="mb-1 text-[10px] uppercase tracking-[0.12em]"
											style={{ color: a.color }}
										>
											{a.tag}
										</div>
										<div className="text-[13px] leading-[1.4] text-[var(--text-secondary)]">
											{a.text}
										</div>
									</div>
								</div>
							))}
						</div>
					</Panel>

					<Panel hazard className="px-5 py-[18px]">
						<div className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
							Active Milestone
						</div>
						<div className="mt-[7px] font-[var(--font-display)] text-[19px] font-bold uppercase leading-[1.1] tracking-[0.03em] text-[var(--text-primary)]">
							Tier 7 — Bauxite Refinement
						</div>
						<div className="mb-[7px] mt-[15px] flex items-baseline justify-between">
							<span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
								HUB Progress
							</span>
							<span className="font-[var(--font-mono)] text-[13px] text-[var(--orange-400)]">
								68%
							</span>
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

Changes from the original: the stat grid is `grid-cols-2 md:grid-cols-4` (was a rigid `grid-cols-4`); the Factory Network / Alerts split is `grid-cols-1 lg:grid-cols-[1.6fr_1fr]` (was a rigid `grid-cols-[1.6fr_1fr]`); each factory row now renders as a stacked card below `md` and the original 4-column row at `md`+, sharing the name-cell and efficiency-meter markup via two small extracted components (`FactoryNameCell`, `FactoryEfficiencyMeter`) instead of duplicating that JSX inline.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`, open `/`. At a wide window: unchanged 4-stat row and two-column Factory Network/Alerts layout. Below 768px: 2-column stat grid, single-column Factory Network/Alerts stack, and each factory entry shown as a 2-row card instead of a cramped 4-column row.

- [ ] **Step 4: Commit**

```bash
git add src/features/overview/OverviewPage.tsx
git commit -m "feat: make Overview stat grid and factory table responsive"
```

---

### Task 14: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full lint/format check**

Run: `npm run check`
Expected: clean (no errors). Fix anything Biome flags (e.g. import order) before continuing.

- [ ] **Step 2: Run the full typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including every test added in Tasks 1–9 and every pre-existing test (in particular `Sidebar.test.tsx`, `TopBar.test.tsx`, `EntityListPage.test.tsx`, `LayerPanel.test.tsx`, `LinkForm.test.tsx` must be unaffected).

- [ ] **Step 4: Manual viewport pass**

Run: `npm run dev`. For each of 375px (phone), 768px (tablet), and a desktop width (≥1280px), check every route: `/`, `/calculator`, `/data` (+ a couple of sub-routes), `/factories`, `/map`, `/logistics`, `/games`, `/g/$gameId/*`, `/account`, `/sign-in`. Confirm for each viewport tier:

- No horizontal scrollbar / overflow on any route.
- **Phone:** `BottomNav` shows Overview/Calculator/Game Data/World Map/More; tapping **More** opens the bottom sheet with Factories, Logistics ("Soon"), the Synced dot, and `GameSwitcher`; `TopBar` shows just the title, a search icon (tap to expand an overlay input), and the user menu; Calculator/Map/Logistics show as Tabs.
- **Tablet:** the icon-rail `Sidebar` shows all nav items with tooltips on hover; `TopBar` shows the collapsed search icon, a Synced dot with no label, `GameSwitcher`, and the user menu; Calculator/Map/Logistics still show as Tabs.
- **Desktop:** identical to the app's current (pre-this-plan) behavior — full sidebar, full top bar, side-by-side Calculator/Map/Logistics panes.
- Crossing the `lg` boundary on Map and Logistics (e.g. resizing the window across 1024px while the tab/pane is visible) does not leave the Leaflet map or the network graph broken/blank — resize back and forth to confirm the remount recovers a correctly-sized canvas.

- [ ] **Step 5: Fix anything found, committing each fix separately**

If the manual pass finds an issue, fix it, re-run the relevant checks from Steps 1–3, and commit with a message describing the specific fix (not a generic "fix bugs" commit).

No commit for this task itself unless fixes were needed — it's verification of the work already committed in Tasks 1–13.
