# Build Progress — 7-a-side Match Tracker (Web)

Four milestones. Update the checkbox **and** the Status line under each milestone as work proceeds. The "Resume from" line is the single source of truth for where to pick up if work is interrupted.

**Resume from:** M3 — not started

## Stack

- **Vanilla HTML/CSS/JS**, no build step, no framework. Single `index.html` + ES modules.
- **Persistence:** `localStorage` (JSON-serialised). One key per collection (`players`, `matches`, `stints`) plus a `schemaVersion` key for forward-compat.
- **Routing:** hash-based (`#/home`, `#/squad`, `#/new-match`, `#/live-match/{matchId}`) — no server, no history API gymnastics.
- **Target browsers:** evergreen Chromium/Firefox/Safari. Mobile-first layout (this runs pitchside on a phone).

Rationale: zero toolchain means the file you edit is the file that runs. If we outgrow it (e.g. need bundling for code-splitting, or a reactive framework for the live-match screen), revisit at M4.

---

## M1 — Project skeleton

**Definition of done:** `index.html` opens in a browser, shows a placeholder Home screen, hash routing works (manually changing `#/squad` swaps the view), and `localStorage` read/write round-trips through the storage module.

- [x] `index.html` — single root `<div id="app">`, links `styles.css`, loads `src/main.js` as `type="module"`
- [x] `styles.css` — minimal reset + mobile-first layout primitives (no design system yet)
- [x] `src/main.js` — bootstraps router, mounts initial view
- [x] `src/router.js` — hash-based router (parse `location.hash`, map to view fn, re-render on `hashchange`)
- [x] `src/storage.js` — typed wrappers: `loadPlayers()`, `savePlayers()`, etc., with JSON parse/stringify and a `schemaVersion` check
- [x] Placeholder views render for each route
- [x] `.gitignore` (ignore `.DS_Store`, editor junk; nothing to build so no `dist/`)

**Status:** complete
**Notes:**

---

## M2 — Data layer + domain logic

**Definition of done:** Storage module round-trips all entities; `subSuggester` is unit-tested and green.

- [x] Entity shapes documented in `src/types.js` (JSDoc): `Player`, `Match`, `Stint` (+ enums `MatchStatus`, `StintRole`)
- [x] Storage CRUD: `players`, `matches`, `stints` collections (each is a JSON array under one key)
- [x] `MatchRepository` (or plain functions) wrapping storage — keeps view code free of `localStorage` calls
- [x] `subSuggester(stints, currentClockSec)` — pure; least-minutes bench player; goalie excluded; `null` on tie
- [x] Test runner: Node's built-in `node:test` against pure modules
- [x] `subSuggester.test.js` — least-minutes bench player chosen; goalie excluded from "most"; `null` on tie

**Status:** complete
**Notes:**

---

## M3 — Squad & Home screens + routing

**Definition of done:** App opens to Home (empty list); can navigate to Squad; can add/rename/delete players which persist across page reload.

- [ ] `src/views/home.js` — FINISHED matches list, "Squad" link, "New match" button
- [ ] `src/views/squad.js` — list, add, rename (inline edit), delete (with confirm)
- [ ] Render helpers / DOM utilities (no framework — small `h(tag, props, children)` helper or template literals + `innerHTML`, pick one and stick with it)
- [ ] Manual check: add 9 players, reload page, players still there
- [ ] Manual check: hard refresh after delete — deletion persisted

**Status:** not started
**Notes:**

---

## M4 — Match flow (NewMatch + LiveMatch + POTD)

**Definition of done:** Can start a match, score goals, sub, change goalie, run a half, end match, pick POTD, and see it on Home with the right score.

- [ ] `src/views/new-match.js` — opponent, half length, lineup picker (6 outfielders + 1 goalie + 2 bench); "Kick off" creates `Match` + opens 9 initial stints, navigates to live match
- [ ] `src/match-clock.js` — `setInterval`-driven clock with pause/resume; emits via callback or simple event-emitter
- [ ] `src/views/live-match.js` — score row, on-field list (with goalie indicator + per-player minutes), bench list, action buttons; re-renders on clock tick
- [ ] Goal +Us / +Them increments score
- [ ] Tap bench player → modal/sheet picks on-field outfielder → swap closes/opens stints
- [ ] "Suggest sub" → confirm dialog → applies via same swap path
- [ ] "Change goalie" → pick new goalie (from field or bench)
- [ ] "Half time" pauses clock; button flips to "Start 2nd half"
- [ ] "End match" → POTD dialog → save POTD, close all open stints, mark FINISHED, return to Home

**Status:** not started
**Notes:**

---

## M5 — Verification & polish

**Definition of done:** Manual smoke runs end-to-end in a real browser with no defects; no console errors or warnings.

- [ ] No console errors/warnings during full flow
- [ ] `node --test` clean
- [ ] Manual smoke: add 9 players → start match → score both ways → suggest sub → make sub → change goalie → half time → 2nd half → end → POTD → confirm Home shows score + POTD
- [ ] Mobile viewport check (Chrome devtools, iPhone-ish width) — no horizontal scroll, tap targets reasonable
- [ ] Fix anything that surfaces; record notes below

**Status:** not started
**Notes:**

---

## Cross-cutting log

Free-form notes during the build — surprises, decisions changed, things deferred. Kept here so the next session has context.

- _(none yet)_
