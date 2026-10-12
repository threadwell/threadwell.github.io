# CLAUDE.md

Marketing + help site for **Threadwell**, an Android SMS/MMS client (the app lives in a separate repo, formerly "Moogle Messages"). Goal: a left-hand FAQ ("How do I…?") where picking a question plays a demo of that feature on the right, inside a phone frame. The site should look and feel like the app.

## Product language (user-facing copy)

**Threads** = conversations. **Spaces** = custom channels. **Threadmarks** = saved items/tags. **Threads to Tend** = follow-ups ("Come back to this"). **Add to Threadwell** = quick capture. The board mode is "Threadwell view" (never "message board"); the other mode is "traditional". Keep plain SMS words (Messages, Send, Spam, Conversation) for carrier/error states. Never write "Moogle" on the site.

Local-first is a product promise: no cloud backup, no accounts, API keys stay on device. Don't claim otherwise.

## Content rules

- Original art only. No third-party or scraped imagery, no real brand or IP names.
- Demos show only features the app actually has. Facts come from the app repo's `CLAUDE.md` feature map; if unsure, ask rather than invent.
- Real-sounding sample data (names, times), never Lorem Ipsum.

## Skills (in `.claude/skills/`, MIT-licensed, from third parties)

`landing-page-design` (elayadesign), `emil-design-eng` / `animate` / `review-animations` / `animation-vocabulary` / `prototype` (Emil Kowalski), `better-*` / `state-machine` (Jakub Krehel). Licenses in `.claude/skills/_licenses/`.

**Threadwell's own brand overrides any skill rule that conflicts** (fonts, palette, icon set, gradient/background rules, Tailwind-only). Skills guide structure, motion and polish; they don't set the brand. Keep copy free of AI cliches per the skills either way.

## Working notes

- Static site, no build step, no framework. Hosted on GitHub Pages. Preview: `py -m http.server 8765` in this folder (`.claude/launch.json` has it).
- Each FAQ entry has a stable `#id` (the demo's `id`). Old ids are kept working in `ALIASES` in `js/app.js`.
- **Verify before you build.** Every label, path and behaviour in a demo comes from the app code; the comment at the top of each demo file names the source files. Never invent a setting or capability. If the app can't do it, don't add the question.
- Respect `prefers-reduced-motion`; controls that a demo doesn't handle render `aria-disabled` with `tabindex="-1"`, never as focusable dead buttons.

## Layout of the code

- `js/core.js`: the demo engine (`mountDemo`): views, steps, Show me, Reset, focus handling, `inert` on outgoing views.
- `js/phone-ui.js`, `js/inbox.js`, `js/board.js`, `js/appearance.js`: shared phone pieces (Settings, Appearance, Threadwell view board, photo picker, photo groups).
- `js/demos/*.js`: one spec per question (`id`, `title`, `answer`, `steps`, `note`, `state`, `views`, `acts`, `play`). Add a demo, then list it in `GROUPS` in `js/app.js`.
- `tools/make-images.ps1` regenerates `assets/og-image.png` and `assets/apple-touch-icon.png` from `tools/og.html` and `tools/icon.html` (local Edge, nothing fetched).

## Preview sizes (landscape and foldable)

- Tutorials with `devices: true` get a "Preview size" selector (Phone portrait/landscape, Foldable cover/unfolded). The choice is a website setting kept across Reset and across tutorials; tutorials without it always show the portrait phone. Changing size re-renders the current screen only, so the conversation, Space, saved item and step progress are kept.
- **The Android app has no fold or posture handling.** It reacts to window width and height only: 600dp and up shows the Space list panel (`ChannelRail`) beside the conversation, below that the channel bar with a More sheet; under 560dp of height the thread rail scrolls as one list; under 440dp the board header shows "Open chat" as an icon. "Unfolded" is just a wide window and "cover screen" a narrow one. Do not claim hinge, tabletop or posture behavior.
- Settings and conversation screens stretch to the window width in the app (no max width), and the previews show them that way.
- Small browsers get "Expand preview": a full-screen overlay where the frame stays readable and only the frame scrolls sideways.

## Widgets and dashboard (verified facts)

- **In-app only.** The app has no Android home-screen widgets (no widget provider in code or manifest). Always say "in this version"; never imply a launcher widget.
- Ten widgets, all off until enabled: Weather, Calendar, Sports, Packages, Watchlist, Countdowns, Checklist progress, Threads to Tend summary, Memory Lane, Commute. Route: Settings → **Widgets & dashboard** (Presets, Enabled widgets with ▲ ▼, Add widgets, Dashboard layout, Privacy & data).
- Each widget has a page: **Show X** switch, Preview, Display style (Chip/Card), Where it appears (Traditional inbox, Threadwell view, Today), Chip inside conversations (only Countdowns and Calendar), Order, Hide until tomorrow / for a week, Data (source, needs, refresh), Hide everywhere. Only Calendar asks for a permission (Calendar, read only). One shared order applies on every screen.
- Inbox and Threadwell view show at most two widgets (one card at most), the rest under "＋ N more". Today shows all, with up to 1/2/3/5 cards. In Threadwell view the strip docks into a **Widgets** button in the thread rail (default: when you scroll or after 5 s).
- **Not supported:** resizing, dragging, or per-widget home-screen placement. Do not suggest them; use Display style and ▲ ▼.
- Real states used in demos: "⏳ Add a countdown", "📅 Connect Calendar" (permission pill), "📅 Allow calendar", "🏆 Choose your teams", "📦 Add a package", "📈 Add a symbol", "🚗 Add a destination", Weather shows plain "Weather" until a location is set, then "🌤️ 64° · Partly cloudy" (+ " · Saved" when stale). Failed refresh: "Last refresh failed: … Showing saved data."
- Controls labelled "Demo:" are website helpers, not app features. The Android permission prompt and date picker are stand-ins.

## Review server

`tools/stage.ps1 -Dest <folder>` copies only publishable files (no `.git`, `.claude`, `tools`, `CLAUDE.md`). Serve that copy, never the repo folder. Re-stage after every change.

## Before publishing

- Confirm the hosting address (planned: https://threadwell.github.io/), then check canonical, `og:image` and `SITE_ROOT` match it.
- Test a bad URL on the real host to confirm the 404 page and its links.
- `privacy.html` covers this website only. `app-privacy.html` is the app's policy and the URL for the Play listing. It is built from the app repo's `docs/PRIVACY_AUDIT.md` host table (the source of truth, checked against the code). Keep `docs/PRIVACY.md`, `PrivacyScreen.kt` and this page in sync whenever the app adds a network call.

## Playground ("Explore Threadwell", `#explore`, `#guided`)

- **One session, three kinds of state** (`js/store.js`). `data` = what the visitor owns (conversations, Spaces, saved messages, notes and checklists, reminders, theme, layout, widget settings). `ui` = where they are (screen, dialogs, strip state). `tut` = guided-help progress. Shared renderers still read one flat `s`; `stateProxy()` routes each key to `data` or `ui` (`DATA_KEYS` is the list). Nothing resets on screen, help, layout or preview-size changes. Only **Reset playground** (confirmed) clears it. Memory only, unless the visitor ticks "Remember this playground on this browser" (`localStorage` key `threadwell.playground.v1`, with Erase). `privacy.html` describes this; keep them in step.
- **Name clashes fixed:** widget display style is `wstyle` (was `mode`), the countdown form is `cdraft` (was `draft`). The board's `mode` is the screen; `draft` is the new-Space form. Do not reuse either name.
- **Tutorials stay separate on purpose.** They run in their own sample session (`spec.state()` builds fresh state), reuse the same renderers and actions (board, widgets, themes), and say so. They never touch the playground. Guided help in the playground only *observes* (`js/challenges.js`): each challenge is judged from `data` and the action log, so any route counts.
- **Start layout is Threadwell view.** The app defaults to Traditional, but Spaces, Add to Threadwell and the widget strip exist only in Threadwell view, so a Traditional start would have no way to create a Space. Layout changes through the real path: Settings → Messaging & notifications → Layout.
- **Verified from the app:** the checklist flow (rail bolt → kind menu → Add to Threadwell dialog with Save to Space chips, one item per line, Come back to this chips; NoteCard checkboxes, "Add an item", ⋮ menu: Edit / Pin / Come back to this / Clear reminder / Change to All chats / Complete and archive / Move / Copy / Delete). **A checklist has no title in the app**; the widget names it by its Space ("📌 Weekend trip · 1/3"). Items are removed by editing the note (delete the line). Captures from Add to Threadwell are personal notes (no chat), so they show under **All chats** and in My Spaces, not under "This chat". "Make checklist" only exists on saved *messages*: lines, or a single line split on `,` / `;`. Completed notes leave the Space, count nowhere, and sit under Completed in Threads to Tend for 30 days.
- **Collapse, verified (MessageBoardScreen.kt, CollapsibleWidgetHost.kt, BoardSettings.kt):** tools collapse is a saved setting (Settings → Messaging → Threadwell view → "Start with utility tools collapsed"); the ⋯ button only *peeks*, and a tool tap or Collapse closes the peek. Space list collapse (wide windows only) is saved too ("Start with the Space list collapsed"). Widget strip modes: scroll→dock (default), scroll→compact shelf, 5 s→dock, always expanded, start docked. Collapse needs ~24dp of finger scroll in the content or 5 s, never while a widget sheet is open or a widget needs setup/permission; a manual expand stops the timer for that visit; each conversation visit starts fresh unless "Remember my last widget state". Implemented with a real scroll listener and a real timer (`playground.js`); only a wheel/touch/key within 700 ms counts as user scroll. The strip is patched in place (`.strip-slot`, `.dock-slot`), so typing, focus and scroll are not disturbed.
- Controls the playground does not simulate are `aria-disabled` and say why when activated (`data-why`, or a generic line) in the "Playground note" outside the phone. Visitor text is always escaped (`esc`), including in callouts.
- **Not verified / not built:** whether the app keeps the open conversation when you switch layouts (the playground keeps it; unconfirmed), Merge checklists, comments, Links/Attachments/Important channels, notification permission prompts, Threadwell view tips/badges/sort/Today-section settings, real light mode for Dusk/Sunrise (only Default has a light look).

## Playground, second pass (organization, spam, saving)

- **Search** (rail magnifier): `runSearch` in `js/play-org.js` mirrors BoardSearch.kt. Minimum 2 characters; kinds Chats / Messages / Links / Notes / Spaces with counts; order chats, Spaces, notes, messages; a message is a Link hit when a URL in it contains the query. It searches visitor-made content (notes, Spaces, sent messages). Results open the chat at the message, the Space (This chat when the note belongs to a chat, otherwise All chats), or the chat. Search resets each time it is opened, as in the app.
- **Links / Attachments / Important** are per conversation, with the app's empty-state wording. Important is starred messages (the ☆ Star action, or the Important box when saving to a Space); its count in the Space list is global. Sample links and photos live in `js/store.js`.
- **Edit Space** (Manage → Edit): name, color, Delete (with the app's confirm text, which removes that Space's threadmarks and notes). Icon, Archive, Merge and Export are shown with an honest explanation, not simulated.
- **Spam is sample data** (thread index 4, `SPAM_THREAD`): quarantined while Smart detection is on; Spam folder shows "Nothing quarantined…" or the row with Not spam; opening it shows the app's banner (category "Prize / reward") with Always allow and Restore once. The *why* text is a labelled playground explanation; the app shows only the category. Block and Report to FTC use the phone, so they explain instead. Settings → Spam protection has Smart detection and Automatic reporting (off by default, nothing is forwarded here).
- **Saving is honest** (`store.js`): saved copies carry a version (`VERSION`) and are validated before use; an old or damaged copy is removed and the visitor is told. `setRemember` only succeeds if the copy was written and read back; a later failure unticks the box and says the session won't survive closing. Bump `VERSION` whenever the saved data shape changes.
- **Open saved …** (confirmation area) is a labelled playground shortcut; the app has no such button. Starter actions (Create a checklist / Try a theme / Explore layouts) sit outside the phone and open screens in the same session. `#checklist` is the homepage entry point.
- **Challenge "Switch layouts and find your checklist"** counts only a checklist visible in the active screen in Threadwell view after a layout change.
- Unavailable controls are focusable (`aria-disabled`) and explain themselves on Enter, Space or click, in the live "Playground note".
- **Homepage preview** is drawn by `playBoard` from `freshState()` with ids and actions stripped (inert, decorative, described by one label).

## Publishing facts

- Planned address: `https://threadwell.github.io/` (GitHub Pages user site: the repo is `threadwell/threadwell.github.io`). **Not yet confirmed or configured.** If the address changes, update `canonical` and `og:image` in `index.html`, `privacy.html`, `app-privacy.html`, and `SITE_ROOT` in `404.html`.
- `tools/og.html` makes the social image (`tools/make-images.ps1`).

## Page transitions

- `go()` in `js/app.js` wraps route changes in `document.startViewTransition` (content area `#entry` fades and rises; sidebar chrome cross-fades). It is skipped on first load, for same-page hash changes (Explore ↔ Guided), when the API is missing, and under `prefers-reduced-motion`. `route()` stays synchronous so it can run inside the transition. CSS is at the end of `styles.css`.

## Website styling boundary

- `site-shell.css` (loaded last) skins the website in cream, forest and sage. The phone keeps the app's own midnight/teal tokens: `.phone` and `.landing-device` restore them, and per-screen theme overrides still win. Keep website styling outside that boundary.
- `404.html` is standalone with its own inline cream/forest tokens (it is served at any URL depth).
- The playground tucks reset, saving and the "what is simulated" notes into one `<details id="pgMore">`; a saving failure or restore message opens it (see `keepMsg`).

## Shared logic with the app, and how to test it
Some rules exist in both the Android app and the playground and **must stay identical**. They are pure modules with tests that use the same golden values on both sides:
- `js/photo-runs.js` (`groupRuns`): which photo messages form a group. Mirrors `buildThreadItems` / `buildChatRows` and `BoardPhotoGroupTest`. Test: `node tools/test-photo-runs.mjs`.
- `js/ring-layout.js` (`ringPlace`, `ringDrawn`, `loopPhoto`): the Ring and the endless carousel indexing. Mirrors `RingLayout` / `CarouselLoop` in `PhotoCollage.kt` and `RingLayoutTest` / `CarouselLoopTest`. Test: `node tools/test-ring-layout.mjs`. Change a constant in both places and re-run both suites. The ring is container-relative (`RING.PAGE_FRAC`, `RADIUS_FRAC`, `LIFT_FRAC`).
- Regression of every tutorial: paste `tools/run-tutorials.js` into the browser console (or run it through the browser pane) and check that all steps tick and there are no errors.

Playground fidelity decisions verified against the app (do not "improve" them):
- **Remove from Space** on a single saved item is immediate (no confirmation); the notice "Removed from X" offers **Undo**, which puts the item back. Only multi-select Remove asks first (the playground has no multi-select).
- **Cream & Forest is light only**: it stays cream whatever the Color mode or the system says, and Color mode is greyed out for it.
- **Switching layouts** does not carry the open conversation: Threadwell view selects the last conversation chosen *in Threadwell view* (`s.boardThread`), Traditional shows the list.
- **Open chat** (header) opens the full conversation at the message at the bottom edge of the board chat (`readingPosition` in `playground.js`), or at the newest.
- A photo group's identity for actions and for "open at my position" is its **first** message.

Status of every feature (implemented / unit-tested / emulator / phone / released): `docs/feature-status.md`.

## Guided help demonstrations ("Show me" on a challenge)

- Mapping: `js/challenge-demos.js` (challenge id -> `playDemo` spec). Each demonstration is a **separate sample session** (`freshState()`), never the visitor's session, drawn with the playground's own screens (`js/play-views.js`) and actions (`js/play-notes.js`, `js/playdemos/kit.js`). A demonstration action must never call `note()`, `persist()` or touch `session`; that is what keeps challenges honest. If you need a playground action in a demonstration, make it take the state (`a.s`) instead of reading the session, then share it, as `play-notes.js` does.
- `js/demo-controller.js` is the only owner of mount / pause / restart / cancel and of suspending the playground (phone moved off-screen and `inert`, starters frozen, strip timer stopped). Keep it DOM-free; tests: `node tools/test-demo-controller.mjs`.
- Each demonstration file's header comment names what it was verified against in the app. A checklist has no title; the wide Space list needs a wide window (the collapse demo borrows the unfolded size with `api.setDevice`, which never changes the visitor's own size).
- Standalone tutorials link to the matching challenge through `js/try-it.js` (`data-try`), keeping the playground as is.
- Preview with `py` and `Cache-Control: no-store` (the browser pane caches module files); wait for the page title after a hash change, because view transitions stall while the pane is hidden.
