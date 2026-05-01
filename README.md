# Matchday

A pitchside web app for tracking 7-a-side football matches on a phone. Set up your squad, kick off a match with a chosen lineup, and run the clock through both halves. During play you can score goals for either side, swap bench players in for outfielders, change the goalie, and accept a "suggest sub" recommendation that picks whoever has played the fewest minutes. Field size is configurable from 2 to 20 players, so it works for small-sided games beyond strict 7-a-side.

After full time, pick a Player of the Day (or set one mid-match) and the result lands in the match history with the date, score, and the keepers from each half. A Stats screen shows per-player POTD counts and halves played in goal. Matches can be archived to keep the list tidy. Everything is persisted to `localStorage` — no server, no build step, no framework. Just open `index.html` in a browser.
