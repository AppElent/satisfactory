# Phase 7 — Games & Collaboration foundation — Design

**Date:** 2026-06-16
**Status:** Approved design, pending implementation plan
**Backlog item:** [future-improvements.md](../../future-improvements.md) #8 (real-time collaborative bases)
**Goal:** Introduce a `game` as the tenant that owns a user's planning data (factories, transports, future game-scoped data). Users own multiple games and join others' games via role-based membership, enabling real-time collaboration — Convex live queries make a shared game's edits appear instantly for every member.

## Scope

**In (v1 — the foundation, which already delivers working collaboration):**

- `games`, `gameMembers`, `gameInvites` Convex tables + authenticated functions.
- Role-based access control (owner / editor / viewer) replacing the current per-user ownership.
- Re-scope `factories` and `transports` from `userId` to `gameId` (+ `createdBy` attribution).
- URL-path game scoping: factories / map / logistics / settings under `/g/$gameId/…`.
- Invite-link sharing (role baked into the link, revocable).
- A header game switcher + a `/games` list + an `/invite/$token` accept flow.
- A one-shot migration of existing data into a default game per user.

**Out (deferred to a later "presence" phase):** live cursors, "who's online" presence indicators, comments/annotations, activity feed, email invites.

## 1. Data model (Convex)

```ts
games: defineTable({
  ownerId: v.string(),            // Clerk subject of the creator/owner
  name: v.string(),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

gameMembers: defineTable({
  gameId: v.id("games"),
  userId: v.string(),             // Clerk subject
  role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
  createdAt: v.number(),
}).index("by_game", ["gameId"])
  .index("by_user", ["userId"])
  .index("by_game_user", ["gameId", "userId"])

gameInvites: defineTable({
  gameId: v.id("games"),
  token: v.string(),              // random url-safe token
  role: v.union(v.literal("editor"), v.literal("viewer")),
  createdBy: v.string(),
  createdAt: v.number(),
}).index("by_token", ["token"]).index("by_game", ["gameId"])
```

**Re-scope** `factories` and `transports`: drop `userId`, add `gameId: v.id("games")` (indexed `by_game`) and `createdBy: v.string()` (attribution — who made the row; access control is by game membership, not this field).

## 2. Access control

A shared helper in Convex:

```ts
const RANK = { viewer: 0, editor: 1, owner: 2 };
// resolves the caller, finds their gameMembers row for gameId via by_game_user,
// throws if absent or role rank < minRole's rank; returns { userId, role }.
async function requireMember(ctx, gameId, minRole): Promise<{ userId, role }>
```

- **Queries** (`factories.list`, `transports.list`, `games.get`, `members`, …) require `viewer`.
- **Factory / transport mutations** (create / update / remove) require `editor` and stamp `createdBy`.
- **Game / member / invite management** (rename, remove, setRole, removeMember, createInvite, revokeInvite) require `owner`.

Every factory/transport function takes `gameId` and filters by the `by_game` index. The pure `role >= minRole` comparison is unit-tested.

## 3. Routing — `/g/$gameId/…`

- **Stays global (not tenant-owned):** `/` (home) and `/data/*` (game *reference* data). **`/calculator` stays global** so anonymous planning and shareable `?plan=` links keep working unchanged.
- **Game-scoped** under a `g.$gameId` layout route that validates membership (and renders a clear "no access" state otherwise) and exposes `gameId` to children:
  - `/g/$gameId/factories`, `/g/$gameId/factories/$factoryId`
  - `/g/$gameId/map`
  - `/g/$gameId/logistics`
  - `/g/$gameId/settings` (members + invite links)
- **`/games`** — list your games + create. **`/invite/$token`** — accept an invite (signed-in → joins at the link's role → redirect into the game).
- **Redirects:** old flat paths (`/factories`, `/map`, `/logistics`) redirect to the active game's equivalent (or `/games` if none).
- **"Save as factory"** in the global calculator gains a **game picker** (defaults to the active game; can create a game inline).

The existing factory/map/logistics components are updated to read `gameId` from route params and pass it to their Convex calls.

## 4. Game management & invites

`convex/games.ts`:

- `listMine` (query) — games where caller is a member (`gameMembers` `by_user` → load games).
- `get` (query) — a game if the caller is a member.
- `create` (mutation) — insert game (`ownerId` = caller) + the owner `gameMembers` row.
- `rename` / `updateDescription`, `remove` (owner; cascades factories, transports, members, invites).
- `members` (query) — members of a game (any member may view).
- `setRole`, `removeMember` (owner).
- `createInvite` (owner) — random token + role; `revokeInvite` (owner); `acceptInvite` (mutation) — given a token, add the caller as a `gameMembers` row at the invite's role if not already a member.

**Header game switcher** (signed-in): current game + list + "New game" + "Manage". The **active game** is persisted per user (a `lastActiveGame` field on a small `userSettings` doc, or — simpler — the URL is the source of truth and the switcher remembers the last visited game in `localStorage`). v1: URL is source of truth; switcher remembers last in `localStorage`.

## 5. Migration

A one-shot `migrateToGames` internal mutation: for each distinct `userId` among existing `factories`, create a default game named "My Factories" (owner = that user), add the owner `gameMembers` row, and stamp `gameId` + `createdBy` on that user's factories and transports. Schema lands `gameId`/`createdBy` as **optional** first → run the migration → tighten to required. Run once during the deploy that ships this phase.

## 6. Error handling

- Non-members hit a clear "you don't have access to this game" state, never a crash.
- A revoked or invalid invite token shows a friendly "invite no longer valid" message.
- Deleting a game cascades to its factories, transports, members and invites.
- Stale references (a factory whose game was deleted) never render — queries are game-scoped.

## 7. Testing

- **Pure:** the role-rank comparison (`requireMember`'s `role >= minRole` logic, extracted as a pure function) — viewer/editor/owner matrix.
- **Convex access/ownership:** verified manually against the running deployment (membership gates, invite accept, cascade delete) — consistent with the factories/transports testing approach.
- **Component (testing-library):** the game switcher (lists games, switches) and the invite-accept screen.

## Verification gates

`biome check` · `tsc --noEmit` · `vitest run` · `vite build` all green, plus a manual pass: create a game; create a factory in it; open the invite link in a second account → join as editor → both see live edits; viewer cannot edit; old `/factories` redirects into the active game; existing data migrated into "My Factories".
