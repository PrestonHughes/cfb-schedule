# CFB Weekend Watch — Project Notes

A single self-contained HTML page that shows the upcoming college football
weekend, with a big focus on Alabama, plus SEC/Top-25 games, a TV viewing
guide, and Alabama's roster. Built for Preston Hughes.

- **Live site:** https://prestonhughes.github.io/cfb-schedule/
- **Repo:** https://github.com/PrestonHughes/cfb-schedule.git
- **Local file:** `index.html` (everything — HTML/CSS/JS — lives in this one file)
- **Optional local server:** `server.js` (see "Local network hosting" below)

## What the page does

1. **Alabama hero section** (top ~33% of page) — Alabama's next game: team
   logos (clickable, link to the ESPN game page), records, AP rank, kickoff
   countdown timer, location, TV network logo, betting line, and a "scouting
   report" on the opponent (record + rank + passing/rushing/receiving
   leaders). If Alabama's game is live, this section automatically switches
   to show the score and game clock instead of the countdown. If Alabama has
   no game that weekend, it shows a bye-week message instead.
2. **"On Now" section** — appears only when at least one SEC/Top-25 game is
   currently in progress; shows live score, quarter/clock, TV, odds. Hidden
   entirely otherwise.
3. **"Other Games of Interest"** — every SEC team's game plus every
   Top-25-vs-Top-25 matchup for the upcoming weekend, as clickable cards
   (link to the ESPN game page) with logos, records, rank badges, kickoff
   time, location, TV network logo, and betting line. Games that have
   finished (ESPN status `state === 'post'`) render as "final" cards
   instead: green "FINAL" badge, final score in place of the record,
   "Final (Weekday, Mon D)" in place of kickoff time, a muted green
   border, and slightly reduced opacity (see `gameCard()` / `.final-card`).
   The weekend date window (`upcomingWeekendRange()`) already auto-advances
   to the next Thu–Sun window starting Sunday, so finished games naturally
   drop off and get replaced by the next weekend's games — no separate
   cleanup logic needed.
4. **TV Viewing Guide** — a horizontally-scrollable timeline chart: channels
   as rows (sticky logos), time across the top, each game plotted as a chip
   at its kickoff slot. Overlapping games on the same channel stack into
   sub-lanes. Alabama's game is highlighted with an accent border; a red
   "NOW" line shows if the current time falls in the displayed window.
5. **Alabama Roster** — full 128-player roster at the bottom. Collapsed rows
   show jersey # and name; click/tap a row to expand and show position,
   class year (FR/SO/JR/SR), height, and weight. Two sort buttons: by
   jersey number or by name. Four filter buttons (All/Offense/Defense/
   Special Teams) filter by position group, derived from each player's
   `position` via the `POSITION_GROUP` map (matches ESPN's own Offense/
   Defense/Special Teams roster groupings).
6. **Header controls** — Update button (re-fetches schedule data), dark/light
   theme toggle (persisted in `localStorage`).

## Data sources

- **Live schedule/scores/odds/records:** ESPN's public (undocumented) JSON
  API: `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`
  - Queried per-conference via `groups` param: `8` = SEC, `80` = FBS (all).
  - **Important gotcha:** this API's `dates=START-END` range query broke at
    some point (started returning HTTP 400 for *any* range, even a 1-day
    one). The page now queries **each day of the weekend window
    individually** (`dates=YYYYMMDD`, singular) and merges results
    client-side. See `fetchScoreboardDay` / `fetchScoreboard` in the JS.
  - Alabama's ESPN team ID is `333` (hardcoded as `ALABAMA_ID`).
  - "Upcoming weekend" = Thursday through Sunday of the nearest Saturday,
    computed in `upcomingWeekendRange()`.
- **TV network logos:** hardcoded `NETWORK_LOGOS` map — ESPN-family networks
  use ESPN's own CDN logo URLs; non-Disney networks (FOX, CBS, NBC, TNT, USA,
  Peacock, FS1, CBSSN, BTN) use verified Wikimedia Commons/Wikipedia logo
  URLs. Each is wrapped in a small white "chip" so dark logos stay visible
  in dark mode. Unmapped network names fall back to plain bold text.
- **Alabama roster:** captured **once** from
  `https://www.espn.com/college-football/team/roster/_/id/333` and embedded
  as a static JS array (`ALABAMA_ROSTER`) — rosters lock in for the season,
  so this deliberately does NOT re-fetch live. If you ever need to refresh
  it (offseason, transfer portal changes, etc.), that page embeds the data
  as JSON at `window.__espnfitt__.page.content.roster.groups[].athletes[]`.
- **Game page links:** each event's own `links` array from the scoreboard
  API (`gameLink()` helper), falling back to constructing
  `https://www.espn.com/college-football/game/_/gameId/{id}` if absent.

## How data fetching works (no server required)

The page fetches ESPN directly from the browser — CORS is open on
`site.api.espn.com`, confirmed working from arbitrary origins (including
`file://`). No API key needed.

For resilience there's a two-tier fetch in `fetchScoreboardDay()`:
1. Try `/api/scoreboard?group=...&dates=...` (a **local proxy**, only
   present if `server.js` is running — see below).
2. If that fails (404, network error, etc.), fall back to calling
   `site.api.espn.com` directly from the browser.

This means the page works standalone (double-click `index.html`), via the
optional local Node server, or hosted statically on GitHub Pages — no code
changes needed between environments.

## Hosting options

### 1. GitHub Pages (current live deployment)
Static hosting only — no server code runs. The frontend's fallback to
direct-ESPN-fetch handles this automatically. Repo settings: Pages source =
`main` branch, `/ (root)` folder. Just commit and push `index.html`;
`server.js` is irrelevant here (harmless if included, not required).

Live at: **https://prestonhughes.github.io/cfb-schedule/**

### 2. Local network hosting (optional, `server.js`)
A minimal Node server (no npm packages needed — Node 18+'s built-in
`fetch` is used) that serves the static file AND proxies ESPN's API
server-side (so no third-party CORS proxy is needed, and no browser CORS
quirks apply). Run with:
```bash
node server.js
```
Then visit `http://localhost:3000` on the PC, or `http://<PC's-LAN-IP>:3000`
from a phone on the same Wi-Fi (find the IP with `ipconfig`; allow Node
through the Windows Firewall prompt on first run). The server must stay
running for the phone to reach it.

### 3. Local file (`file://`)
Just double-click `index.html`. Works fully thanks to the direct-ESPN
fallback. This is how the project started before GitHub Pages was set up.

## PWA / "Add to Home Screen"

The page has PWA-lite meta tags baked in (inline data-URI manifest,
`apple-touch-icon`/`apple-mobile-web-app-*` tags, `theme-color`) so it can
be added to a phone's home screen with Alabama's logo as the icon and no
browser chrome. **No service worker** was added (explicitly deferred) — so
there's no offline caching; it still needs a network connection each time.
If full installability (real "Install" prompt, offline support) is ever
wanted, that requires HTTPS + a service worker — doable now that it's on
GitHub Pages, just not implemented yet.

## Known limitations / things to watch for

- **Undocumented API risk:** everything hinges on ESPN's unofficial
  `site.api.espn.com` JSON endpoint. It has already changed behavior once
  (date-range queries breaking). If data stops loading again, check the
  browser console / Network tab for the actual HTTP status ESPN returns —
  that's usually the fastest way to spot another silent API change.
- **No offline support** (see PWA section above).
- **Roster is static** — won't reflect in-season roster moves (which is
  intentional per the original request, since rosters lock in), but also
  won't survive a full year-to-year refresh without manually re-scraping.
- `server.js` is not committed to necessarily be in sync with GitHub Pages
  usage — it's a separate, optional path for LAN hosting only.

## File-by-file

- **`index.html`** — the entire app. Rough map of the `<script>` section,
  top to bottom:
  - Theme toggle logic
  - Date helpers (`upcomingWeekendRange`, `fmtYMD`)
  - Fetch logic (`fetchScoreboardDay`, `fetchScoreboard`)
  - Small data helpers (`recordSummary`, `rankOf`, `isTop25`, `oddsText`,
    `venueText`, `leaderLine`, `gameLink`, `broadcastHtml`/`broadcastNames`)
  - `ALABAMA_ROSTER` (static data) and `NETWORK_LOGOS` (static data)
  - Render functions: `renderBama`, `renderBamaBye`, `gameCard`,
    `liveGameCard`, `buildTvChart`
  - `loadSchedule()` — the main orchestrator (fetches, filters into
    Alabama/live/other buckets, calls the render functions); wired to the
    Update button and run once on page load
  - Roster rendering/sorting (`renderRoster`, sort button wiring) — runs
    independently of `loadSchedule()` since roster data is static
- **`server.js`** — optional local Node server (static file server +
  ESPN API proxy). Not needed for GitHub Pages.

## Recent history (most recent first)

- Added "final" styling to "Other Games of Interest" cards: finished games
  show a green FINAL badge, final score, "Final (Weekday, Mon D)" instead
  of kickoff time, and a dimmed/green-bordered card. Confirmed (did not
  need to change) that the weekend date window already rolls over to the
  next Thu–Sun starting Sunday, so old games get replaced automatically.
- Added Offense/Defense/Special Teams filter buttons to the roster section,
  derived from position via a `POSITION_GROUP` map.
- Added `classYear` (FR/SO/JR/SR) to each roster player's expanded detail
  view. **Not yet committed/pushed** as of this writing.
- Added the sortable/expandable Alabama roster section.
- Made every "Other Games" card and both Alabama-section logos clickable
  links to that game's ESPN page (opens in a new tab).
- Fixed the real root cause of a "not valid JSON" error on the phone: ESPN's
  date-range query started returning 400 for any range; switched to
  per-day queries. Also added `server.js` as a more reliable fetch path
  (this was originally motivated by a flaky third-party CORS proxy, which
  has since been removed entirely).
- Added lightweight PWA meta tags (manifest, apple touch icon, theme-color)
  for "Add to Home Screen" support — deliberately without a service worker.
- Set up GitHub Pages hosting at the live URL above.
- Added the "On Now" (live games) section and the TV Viewing Guide timeline
  chart; fixed a duplicate "VS" in the Alabama section; added betting lines
  to the "Other Games" cards.
- Replaced generic TV icons with real network logos (ESPN-family from
  ESPN's CDN, others from Wikimedia Commons), each on a white chip for
  contrast in dark mode.
- Added mobile responsiveness polish (header wrapping, card/grid reflow,
  countdown/detail-pill stacking at narrow widths).
- Initial build: Alabama hero with countdown, Other Games of Interest grid,
  dark/light mode, Update button — all scraping ESPN's public JSON
  scoreboard API client-side.

## Picking this back up in a new chat

If continuing in a fresh conversation, it helps to mention:
- This file's path (`PROJECT_NOTES.md`) so it can be read for context.
- Whether you're working against the local file, the GitHub Pages site, or
  both.
- Any specific ESPN API behavior change you've noticed (paste the exact
  error/response if data stops loading — see "Known limitations" above).
