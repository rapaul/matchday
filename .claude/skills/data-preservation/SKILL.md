---
name: data-preservation
description: Use whenever changing how data is stored, shaped, or read — schema changes, new fields, renames, removals, key changes in src/storage.js, or any code that touches localStorage. Existing user data must remain readable; no upgrade may drop or corrupt data already on a user's device.
---

# Data preservation

This app's only datastore is the browser's `localStorage`. Users have real data there — match history, players, stints, team name. **Losing that data is unacceptable.** Treat every storage-related change as a migration problem, not a code problem.

## The two rules

1. **Never lose data on a code change or upgrade.** Anything already written to `localStorage` by a previous version must still be reachable after the change.
2. **`load*()` must always succeed.** A user opening the app with old data must see their data, not a blank slate or an error.

## Required checks before changing storage

Before editing `src/storage.js`, any schema, or anything that reads/writes `localStorage`:

- **Identify what's already on disk.** Read `SCHEMA_VERSION` and the current shape of every stored key (`players`, `matches`, `stints`, `teamName`, …). Old user data conforms to the *previous* shape, not the new one.
- **Decide the migration path.** If the shape changes:
  - Bump `SCHEMA_VERSION`.
  - Write an explicit migration that transforms old data → new shape on load.
  - The migration must be idempotent and must not throw on partial / unexpected data.
- **Never delete a key or field without a migration.** Even renames are migrations — read the old key, write the new one, then (optionally) remove the old.
- **Default safely on parse failure** — `load()` already returns `[]` on JSON errors; keep that behavior. Don't replace it with a throw.

## Things that look harmless but aren't

- Renaming a field on a stored object (e.g. `player.name` → `player.fullName`) — old records still have the old field.
- Changing a field's type (string → number, scalar → array).
- Removing a field "we don't use anymore" — old records still carry it; that's fine, leave them, don't strip on save.
- Adding a required field — old records won't have it; either make it optional or backfill in a migration.
- Changing a localStorage *key* — old key still holds the data; migrate it, don't abandon it.
- Reordering or restructuring nested objects (e.g. stints inside matches).

## When in doubt

Stop and ask the user before making the change. A small clarification is cheap; a silent data loss bug shipped to a user's device is not recoverable — there is no server backup.

## Verifying

After any storage-shape change, mentally (or with a test) walk through: *"A user on the previous version has `{old data}` in localStorage. They load the new code. What happens on first `load*()` call?"* The answer must be: **their data appears, intact, in the new shape.**
