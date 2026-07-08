# Design: Add `@appelent/auth` to the Satisfactory app

**Date:** 2026-06-30
**Status:** Approved (pending spec review)

## Goal

Adopt the shared `@appelent/auth` package as the Satisfactory app's full
custom auth UI, replacing Clerk's hosted modal components (`<UserButton>`,
`<SignInButton mode="modal">`) with the package's own forms, account menu, and
account page — skinned to the existing FICSIT design system and kept dark-only.

## Background

`@appelent/auth@0.1.0` is published to GitHub Packages
(`https://npm.pkg.github.com`, repo `AppElent/appelent-packages`, directory
`packages/auth`). It is a React component library that wraps
`@clerk/clerk-react` with **custom Clerk flows** (not the hosted UI):

- Auth forms: `SignInForm`, `SignUpForm`, `ForgotPasswordForm`, `AuthCard`,
  `AuthButton`, `AuthField`, `AuthError`.
- Account: `ProfilePanel` (bundles `AppearanceSettings`), `AppearanceSettings`.
- Header: `HeaderUser` (avatar dropdown → account / sign out).
- Theme utilities: `ThemeSync`, `applyThemeMode`, `getInitialMode`,
  `setThemeMode`, `reconcileTheme`, `THEME_INIT_SCRIPT`, `ThemeMode`.
- Dev helper: `TestLoginButton` (auto-shows only on a `pk_test_` instance with
  test-user env credentials).
- Config: `AuthConfigProvider`, `useAuthConfig`, `DEFAULT_AUTH_CONFIG`,
  `AuthConfig`, `clerkErrorMessage`, `SocialProvider`, `SlotClassNames`.
- `tokens.css` (a generic light/dark ArchStudio token set).

The components navigate via plain `<a href={config.paths.*}>` anchors and read
paths/appName from `AuthConfigProvider`. They consume `--auth-*` CSS variables
for styling.

### Current Satisfactory auth state

- Clerk + Convex JWT wiring already in place (`convex/auth.config.ts`,
  `src/integrations/clerk/provider.tsx`, `src/integrations/convex/provider.tsx`).
- `src/integrations/clerk/header-user.tsx` uses hosted `<UserButton>` /
  `<SignInButton>`.
- `src/features/factories/SignInPrompt.tsx` uses `<SignInButton mode="modal">`.
- App is **dark-only FICSIT**: `<html className="dark">` is hardcoded in
  `src/routes/__root.tsx`; `styles.css` has no light theme and no `--auth-*`
  tokens. FICSIT base tokens live in `src/styles/ficsit/colors.css`.
- `src/env.ts` validates client vars via `@t3-oss/env-core`
  (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`, …).

## Decisions (from brainstorming)

1. **Scope:** Full custom auth UI — package owns sign-in/up, forgot-password,
   header user menu, and account page end-to-end.
2. **Install source:** GitHub Packages registry (this repo is standalone, not in
   the `appelent-packages` pnpm workspace).
3. **Theme system:** Skip it. Keep the app dark-only. Do **not** adopt
   `ThemeSync` / `AppearanceSettings` / `THEME_INIT_SCRIPT`.
4. **Account page:** Build a local `AccountPanel` from the package's exported
   primitives (no appearance toggle), because the package's `ProfilePanel`
   unconditionally renders `<AppearanceSettings/>` and depends on ArchStudio
   `rm-panel`/`rm-label` classes.
5. **`afterAuth`:** Redirect to `/` (home) after successful auth.

## Architecture

### 1. Package installation (GitHub Packages)

- Add committed `.npmrc` at repo root:

  ```
  @appelent:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
  ```

- `NODE_AUTH_TOKEN` is a GitHub PAT with `read:packages`, supplied via
  environment — the local shell for `npm install`, and a Cloudflare/CI secret
  for deploys. The token is **never committed**; `.npmrc` references the env var
  only. (Aligns with the repo's no-secrets-in-git rule.)
- Add `@appelent/auth: ^0.1.0` to `dependencies`. Peer deps (`react`,
  `react-dom`, `@clerk/clerk-react`) are already satisfied.
- Document the `NODE_AUTH_TOKEN` requirement in `README.md`.

### 2. Token bridge (skin to FICSIT, dark-only)

Do **not** import the package's `tokens.css` (its `:root`/`.light` defaults are
a generic light theme that would fight FICSIT). Instead define the `--auth-*`
tokens in `src/styles.css` under the existing `.dark` scope, mapped to FICSIT
semantic tokens:

| `--auth-*`          | FICSIT token            |
| ------------------- | ----------------------- |
| `--auth-bg`         | app background          |
| `--auth-card-bg`    | `--surface-card`        |
| `--auth-field-bg`   | inset/panel surface     |
| `--auth-border`     | `--border-default`      |
| `--auth-fg`         | `--text-primary`        |
| `--auth-muted`      | `--text-secondary`      |
| `--auth-accent`     | `--accent` (FICSIT orange) |
| `--auth-accent-fg`  | `--text-on-accent`      |
| `--auth-error`      | `--destructive`         |
| `--auth-radius`     | `--radius-md`           |

Exact FICSIT variable names are confirmed during implementation against
`src/styles.css` and `src/styles/ficsit/colors.css`.

### 3. Auth config provider

In `src/routes/__root.tsx`, wrap the app (inside `ClerkProvider`) with
`AuthConfigProvider`:

```ts
const authConfig: AuthConfig = {
  appName: "Satisfactory Planner",
  paths: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    forgotPassword: "/forgot-password",
    afterAuth: "/",
    account: "/account",
  },
  features: { forgotPassword: true },
  socialProviders: [], // email/password only
};
```

### 4. New TanStack routes

- `src/routes/sign-in.tsx` → `<AuthCard title="Sign in"><SignInForm onSuccess=…/></AuthCard>`
- `src/routes/sign-up.tsx` → `<AuthCard title="Create account"><SignUpForm onSuccess=…/></AuthCard>`
- `src/routes/forgot-password.tsx` → `<AuthCard title="Reset password"><ForgotPasswordForm onSuccess=…/></AuthCard>`
- `src/routes/account.tsx` → local `AccountPanel` (see §6).

`onSuccess` for the three auth forms calls
`router.navigate({ to: useAuthConfig().paths.afterAuth })` (i.e. `/`).
`AuthCard` renders a full-screen centered card; these routes should render
outside the normal app shell chrome or accept the shell wrapping — to be
finalized in the plan based on `AppShell` structure.

After adding routes, regenerate the route tree using the project's committed
build generator (not `tsr generate`) per existing repo convention.

### 5. Replace existing auth UI

- `src/integrations/clerk/header-user.tsx` → re-export the package's
  `HeaderUser` (`export { default } from "@appelent/auth"` style, adjusted to
  the named `HeaderUser` export).
- `src/features/factories/SignInPrompt.tsx` → replace
  `<SignInButton mode="modal">` with a `Button`/link navigating to `/sign-in`
  (keeps the existing FICSIT panel styling).
- Audit other `@clerk/clerk-react` `SignInButton`/`UserButton` usages
  (`GamesPage.tsx`, `LogisticsPage.tsx`, `AcceptInvite.tsx`,
  `SaveAsFactoryButton.tsx`, `g.$gameId.tsx`) and redirect any hosted
  sign-in entry points to `/sign-in` for consistency. `SignedIn`/`SignedOut`
  guards stay as-is.

### 6. Local account page (`AccountPanel`)

A small app-local component built from the package's exported primitives
(`AuthField`, `AuthButton`, `AuthError`) plus Clerk `useUser` / `useClerk`,
replicating `ProfilePanel`'s profile + security + sign-out sections **without**
`AppearanceSettings`, and using FICSIT panel styling instead of `rm-*` classes:

- Profile: edit first/last name (`user.update`), show email.
- Security: change password (`user.updatePassword`).
- Session: sign out (`signOut`).

Rendered by `src/routes/account.tsx`.

### 7. Test login (dev only, optional)

`TestLoginButton` is already embedded in `SignInForm` and self-gates: it renders
only when `VITE_CLERK_PUBLISHABLE_KEY` starts with `pk_test_` **and**
`VITE_TEST_USER_EMAIL` + `VITE_TEST_USER_PASSWORD` are present. Add both as
optional client vars in `src/env.ts` so they validate; no UI work needed. No-op
in production (`pk_live_` key).

## Data flow

1. User hits a guarded action → `SignInPrompt` / `HeaderUser` link → `/sign-in`.
2. `SignInForm` calls Clerk `signIn.create({ identifier, password })` →
   `setActive` → `onSuccess` → router navigates to `/`.
3. `ThemeSync` is **not** used; theme stays dark via the hardcoded `.dark` class.
4. Convex continues to receive the Clerk JWT through the existing
   `ConvexProviderWithClerk` wiring — unchanged.

## Prerequisite / external risk

The package uses Clerk **custom flows**:
`signIn.create({ identifier, password })`, email-code sign-up
(`prepareEmailAddressVerification({ strategy: "email_code" })`), and
`reset_password_email_code`. The Clerk instance must have **email + password**
authentication and **email verification code** enabled in the dashboard. The
current app uses Clerk's hosted modal, which may be configured for different
strategies. **Verify Clerk dashboard settings before the forms will work** —
this is configuration outside the codebase and must be checked manually.

## Testing

- **Unit:** `AccountPanel` rendering/handlers (mock Clerk hooks), token-bridge
  presence (auth screens render with FICSIT colors, no `--auth-*` fallback).
- **Type/lint:** `npm run typecheck`, `npm run lint`, `npm run check`.
- **Manual (preview):** sign-in, sign-up (email code), forgot-password, account
  edit, sign-out, header menu, and the `SignInPrompt` redirect — verified
  against a `pk_test_` Clerk instance, optionally via `TestLoginButton`.
- The package itself ships its own tests; we do not re-test its internals.

## Out of scope

- Light/dual theme support and `AppearanceSettings` / `ThemeSync`.
- Social/OAuth providers (`socialProviders: []`).
- Changes to Convex schema or the Clerk↔Convex JWT wiring.
- Modifying the `@appelent/auth` package itself.

## Files touched (summary)

- **Add:** `.npmrc`, `src/routes/sign-in.tsx`, `src/routes/sign-up.tsx`,
  `src/routes/forgot-password.tsx`, `src/routes/account.tsx`, local
  `AccountPanel` component.
- **Edit:** `package.json`, `src/env.ts`, `src/styles.css` (token bridge),
  `src/routes/__root.tsx` (`AuthConfigProvider`),
  `src/integrations/clerk/header-user.tsx`,
  `src/features/factories/SignInPrompt.tsx`, other hosted sign-in entry points,
  `README.md`, regenerated `src/routeTree.gen.ts`.
