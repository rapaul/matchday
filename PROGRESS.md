# Build Progress — 7-a-side Match Tracker (Web)

Four milestones. Update the checkbox **and** the Status line under each milestone as work proceeds. The "Resume from" line is the single source of truth for where to pick up if work is interrupted.

**Resume from:** M6 complete

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

- [x] `src/views/home.js` — FINISHED matches list, "Squad" link, "New match" button
- [x] `src/views/squad.js` — list, add, rename (inline edit), delete (with confirm)
- [x] Render helpers — template literals + innerHTML, consistent throughout
- [x] Manual check: add 9 players, reload page, players still there (Playwright verified)
- [x] Manual check: hard refresh after delete — deletion persisted (Playwright verified)

**Status:** complete
**Notes:**

---

## M4 — Match flow (NewMatch + LiveMatch + POTD)

**Definition of done:** Can start a match, score goals, sub, change goalie, run a half, end match, pick POTD, and see it on Home with the right score.

- [x] `src/views/new-match.js` — opponent, half length, lineup picker (6 outfielders + 1 goalie + 2 bench); "Kick off" creates `Match` + opens 9 initial stints, navigates to live match
- [x] `src/match-clock.js` — `setInterval`-driven clock with pause/resume; emits via callback
- [x] `src/views/live-match.js` — score row, on-field list (with goalie indicator + per-player minutes), bench list, action buttons; re-renders on clock tick
- [x] Goal +Us / +Them increments score
- [x] Tap bench player → prompt picks on-field outfielder → swap closes/opens stints
- [x] "Suggest sub" → confirm dialog → applies via same swap path
- [x] "Change goalie" → pick new goalie from on-field outfielders
- [x] "Half time" pauses clock; button flips to "Start 2nd half"
- [x] "End match" → POTD dialog → save POTD, close all open stints, mark FINISHED, return to Home

**Status:** complete
**Notes:**

---

## M5 — Verification & polish

**Definition of done:** Manual smoke runs end-to-end in a real browser with no defects; no console errors or warnings.

- [x] No console errors/warnings during full flow (Playwright verified)
- [x] `node --test` clean (5/5 pass)
- [x] Smoke: add 9 players → start match → score both ways → suggest sub → make sub → change goalie → half time → 2nd half → end → POTD → home shows score + POTD (Playwright verified)
- [x] Mobile viewport check (390×844 / iPhone 14) — no horizontal scroll, tap targets ≥40px (Playwright verified)
- [x] Fixed: `status` stayed PENDING after kickoff (set to LIVE in new-match.js submit)

**Status:** complete
**Notes:**

---

## M6 — Variable team sizes, new lineup UX, button sub picker

**Definition of done:** Field size is configurable (2–20); halves default to 25 min; all squad players default to Field in lineup; sub picker uses buttons not prompt.

- [x] Minimum squad requirement lowered to 2 players (was 9)
- [x] Half length default changed to 25 min (was 20)
- [x] "Players on field" input added to new-match form (default 7, range 2–20)
- [x] Lineup UX: all players default to Field; Field/GK/Bench buttons per player; GK auto-demotes previous GK
- [x] Validation: 1 GK + (fieldSize−1) outfielders required; bench = remainder
- [x] Sub picker: clicking "Sub in" shows outfielders as buttons instead of prompt; Cancel exits picking mode
- [x] Suggest sub uses same button flow after confirm dialog

**Status:** complete

---

## Cross-cutting log

Free-form notes during the build — surprises, decisions changed, things deferred. Kept here so the next session has context.

- M1–M5 built in single session. node_modules accidentally committed in M3, removed in follow-up commit.
- Match status bug: `createMatch` sets `PENDING`; fixed by calling `updateMatch(id, { status: 'LIVE' })` immediately after kickoff in `new-match.js`.
- `subSuggester` counts bench time in non-goalie minutes (bench players accumulate time); this is intentional — players who sat bench longer should get priority on field.
- Playwright runs against `python3 -m http.server 4321`; no build step required.
