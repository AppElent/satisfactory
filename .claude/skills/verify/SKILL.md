---
name: verify
description: Verify that a code change actually does what it's supposed to by exercising it end-to-end and observing behavior. Use before committing nontrivial changes to this app.
---

# Verify (satisfactory)

Local-first: drive the change through the Claude Preview browser tools against the dev server (`pnpm run dev:watch`, port 3000, see `.claude/launch.json`). On web (no browser preview available), fall back to the static suite: `pnpm run typecheck`, `pnpm run check`, `pnpm test`.

## Auth

The sign-in screen's "▶ Dev: log in as test user" button comes from `@appelent/auth`'s `TestLoginButton` and appears only when `VITE_CLERK_PUBLISHABLE_KEY` is a `pk_test_...` key **and** `VITE_TEST_USER_EMAIL`/`VITE_TEST_USER_PASSWORD` are set in `.env.local`. If it's missing, check those vars before concluding the app can't be tested logged-in.

## Route → module map

TODO — fill in as routes are touched. Suggested shape:

| Route | Module(s) |
| --- | --- |
| `/` | `src/routes/index.tsx` |
| `/data/items` | `src/routes/data/items.index.tsx`, `src/features/data/configs/items.tsx` |
| `/data/items/$slug` | `src/routes/data/items.$slug.tsx` |
| `/calculator` | `src/features/calculator/**` |
| `/g/$gameId/factories/$factoryId` | `src/routes/g.$gameId.factories.$factoryId.tsx`, `src/features/factories/**` |
