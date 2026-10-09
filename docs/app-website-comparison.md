# Threadwell: app-to-website comparison (audit, step 1)

> **Current status (supersedes the older notes below).** This file began as a read-only audit and then became a running log of the work that followed, so older sections describe the state *at the time they were written*. For what is true now, read [feature-status.md](feature-status.md) (one row per feature: implemented / unit-tested / emulator-tested / phone-tested / released) and `HANDOFF.md`. The save-confirmation, rotation, Back, theme, motion, carousel and Ring items below are **built**; several were **phone-tested on the Fold7** (see "Verified on a device" at the end). Nothing is released.

Original audit status: **source-verified, not yet verified in a running app.** Everything marked *Confirmed (source)* comes from reading the Android code. Items marked *Needs device* needed a phone or emulator. No app code was changed for the audit itself.

App source: the Android app repo, `app/src/main/java/com/example/mooglemessages/`
Website: this repo (playground in `js/playground.js`, `js/play-ui.js`, `js/play-org.js`)

## Comparison

| Workflow | Actual app behavior | Website behavior | Gap | Proposed change |
|---|---|---|---|---|
| **Save a message to a Space** | Threadwell view only: long-press message → More → "Add to a Space" → `ChannelPickerDialog` (Important box, Space checkboxes, "＋ New Space", Save/Cancel). Save calls `setItemChannels` and `dismiss`. **No confirmation of any kind at the time of the audit** (`CustomChannels.kt` ~890-905); since fixed, see "Batch 1" below. Not available in Traditional view. | Same dialog and labels. The website adds a "Playground note" naming the destination. | **Resolved.** The app now shows "Saved to <Space>" with Open Space (`SaveNotice.kt`), and the website mirrors it (playground and tutorials). | None. Tutorial wording updated to match. |
| **Find a saved message** | Rail "Browse Spaces" → My Spaces → a Space (all chats). Or in a conversation, the Space tab/bar (This chat / All chats). Search finds notes, Spaces and messages (not threadmark copies as such). | Same routes. Search has the app's kinds and 2-character minimum. | Matches. Discoverability of the rail icon for a new user is *Needs device*. | Evaluate a labelled "Spaces" entry or first-run hint in the app. |
| **Return to original conversation** | Saved message card → "Show in chat" opens the full conversation at that message (`onOpenMessage` → `threadJumpKey`). | "Show in chat" opens a conversation view with the message outlined. | Matches in outcome. | None. Check Back lands on the Space (*Needs device*). |
| **Remove from Space vs delete message** | "Remove from Space" (in ⋮ menu and TagActions) removes the threadmark only. **Verified (source):** removing a single item runs `CustomChannels.removeTag` at once, with **no confirmation and no undo** (`BoardChannels.kt` `remove`). Only multi-select Remove asks: "Remove N items?" / "Threadmarked links, photos and messages are only removed from this Space; the texts stay in their threads. Private notes are deleted." | **Fixed:** the playground now removes a single item at once, as the app does (it used to ask a confirmation the app does not have). It has no multi-select. | Resolved on the website. **Open product question for the app:** should a single removal get an Undo (like the attachment flow)? Not changed. |
| **Create and edit checklists** | Add to Threadwell (rail bolt → kind menu → dialog), or Space composer "☑ Checklist". NoteCard: tick items, "Add an item", ⋮ → Edit (raw `[ ]`/`[x]` lines), Pin, reminder, Complete, Move, Copy, Delete. No checklist title. Progress shown as "N of M done" in the card header. Completion = checkbox + strike-through (not colour alone). | Same flow and labels. | Matches. App gap below: dialog and composer text are lost on rotation. | See "Rotation" row. |
| **Discover and configure widgets** | Settings → Widgets & dashboard: Presets, Enabled widgets (▲▼), Add widgets, Dashboard layout. Each widget has its own page. In-app only; no Android home-screen widgets. | Same. | Matches. First-use guidance in the app: *Needs device* (a `WIDGETS` tip exists in `BoardSettings.kt`). | Evaluate whether the tip appears at the right moment. |
| **Switch conversation layouts** | Settings → Messaging & notifications → Layout (Traditional / Threadwell view). Default is Traditional. Board selection comes from `BoardSnapshot.selectedId` (process-lifetime) or the last thread. | Same path. Website starts in Threadwell view (deliberate; Spaces exist only there). The playground keeps the current thread. | **Verified (source):** the app does **not** keep the open conversation. Switching to Threadwell view selects the last conversation chosen *in Threadwell view* (`board_last_thread`, else the first on the rail); Traditional shows the list. The playground used to carry the thread across. | **Fixed on the website** (it now follows the app, `s.boardThread`). Not yet seen on a device. |
| **Collapse and reopen panels** | Tools: saved setting; ⋯ only peeks. Space list: saved. Widget strip: 5 modes, ~24dp scroll or 5 s, held open by a sheet or setup need; fresh each visit unless "Remember my last widget state". | Implemented with a real listener and timer. | Matches rules read from `CollapsibleWidgetHost.kt`. Visual timing/animation not compared. | None until device check. |
| **Preview and apply themes** | Appearance → Browse themes → preview → Apply theme; Customize adds bubble colours and scene sliders. Premium flag displayed but not enforced. | Same flow with simplified stand-ins for scenes. Sunrise/Dusk overlay colours were adjusted for legibility. | Website palettes are approximations (documented). | Keep; label as simplified. |
| **Review spam and restore** | Spam folder (rail shield): rows with **Not spam**; open a thread for the banner "⚠ This conversation is flagged as spam" + category + Always allow / Restore once / Block / Report. Settings → Spam protection. | Sample conversation, same banner, same actions. The "why flagged" text is website-only and labelled. | Matches. The app shows only the category, not a reason. | Consider an in-app one-line reason (proposal, needs design). |
| **Rotate or unfold the device** | Manifest has **no `configChanges`**, so the activity is recreated. Board selection/mode survive via `BoardSnapshot` (process-lifetime) and prefs. But these use plain `remember` and are **lost**: Add to Threadwell dialog text and chosen Space, the Space note composer text, the checklist "Add an item" field, the Save-to-Space selections, open dialogs and the Spaces-manage dialog (`MessageBoardScreen.kt`, `BoardChannels.kt`, `CustomChannels.kt`; `rememberSaveable` appears only in `BoardCapture.kt` (5) and `BoardSearch.kt`). Message drafts are persisted per thread (prefs). | Previews change layout without recreating, so nothing is lost. | **Website is more forgiving than the app.** A user rotating or unfolding mid-edit loses work (*Needs device to confirm*). | **App fix (priority):** use `rememberSaveable` for those fields and dialog state. Website: add a note only if the app still loses state. |

## Prioritised findings

**Confirmed (source) usability problems in the app**
1. *(Fixed.)* No confirmation after saving a message to a Space, and no way to jump to the Space from the save.
2. *(Mostly fixed.)* Unsaved text and dialog state were lost on rotation/fold changes because the activity is recreated and most dialog and composer state used `remember`. Known remaining limits are listed under "Batch 2".

**Website mismatches**
3. *(Fixed.)* The website's save "Playground note" had no app equivalent; the app now has the confirmation and the simulator mirrors it.
4. *(Resolved.)* The website assumed the open conversation is kept when switching layouts. Source shows the app does not; the website now matches.
5. The "Remove from Space" confirm wording is not verified against the app.

**Optional enhancements (evaluate first)**
6. First-run pointer to Spaces / Browse Spaces.
7. One-line spam reason in the banner.
8. Widget first-use guidance placement.

## Needs a device or emulator
- Rotate/unfold during: Add to Threadwell, Space composer, checklist add-item, save dialog (confirm finding 2).
- ~~Switching layout while a conversation is open (finding 4)~~ resolved from source; a device confirmation is still welcome.
- Back from "Show in chat" and from a Space.
- Larger font/display size and keyboard-visible layouts.
- Where the Widgets tip appears.

## Suggested first batch (app, then website)
1. **Save-to-Space confirmation** naming the Space with an "Open Space" action.
2. **Rotation-safe editing** (`rememberSaveable` for dialog/composer fields).
3. Then mirror each in the website simulator **only after** it is built and checked in the app.

Both batches were later built; see the status sections below.

---

## Batch 1 and 2 status (app changes made, **not committed** in the app repo)

Verified: `compileDebugKotlin` (forced rerun, no warnings) and `SaveNoticeTest` (8 cases, pass). **Later phone-tested on the Fold7** (rotation keeps the dialog text; the confirmation and Open Space work; see "Verified on a device"). Not emulator-tested, not shipped.

**Batch 1: save confirmation** (`SaveNotice.kt`, `CustomChannels.kt`, `MainActivity.kt`, `MessageBoardScreen.kt`)
- After Save in the Add-to-a-Space dialog, a snackbar names the destination: "Saved to Trips", "Saved to Trips and Gifts", "Saved to Trips and 2 more", "Removed from Trips", "Marked important", or a combination. Nothing is shown if nothing changed.
- With exactly one Space added, an **Open Space** action returns to the list and opens that Space in My Spaces. It is offered only in Threadwell view, where Spaces exist.
- Duration follows the system accessibility timeout; the exit/enter animation is skipped with reduced motion; the notice is a polite live region. It sits above the bottom bar and the keyboard.
- The multi-select attachment flow already had its own confirmation with Undo and is unchanged.

**Batch 2: rotation-safe editing** (`BoardCapture.kt`, `BoardChannels.kt`, `MessageBoardScreen.kt`)
- Now `rememberSaveable`: the Add to Threadwell dialog (open state, kind, chosen Space, text, reminder time), the Space note composer (text, Checklist toggle, This chat/All chats, chosen photo), the checklist "Add an item" field, and the My Spaces quick-capture fields.
- **Still lost on rotation (known limits):** the Add-to-a-Space dialog (its parent holds the message in plain `remember`), the note menu/Edit-note dialog, and the Spaces manage dialog. Message drafts were already safe.

**Website:** mirrored after the phone check (in-phone confirmation with the app's wording and the Open Space action). The old simulator-only note was removed from the playground; the tutorials now describe the real confirmation.

**To verify on a phone:** (1) long-press a message, Add to a Space, Save, and read/tap the confirmation; (2) start Add to Threadwell with typed text, rotate or fold, and check the text and dialog survive; (3) type in a Space composer and rotate.

---

## Themes and motion batch (app changes made, **not committed** in the app repo)

**Existing-theme check.** The app already has ~50 themes. None is cream-and-forest ("Misty Pine Forest" is a dark animated scene). Lavender on charcoal equals the Default theme's *fallback* palette, but Default follows the wallpaper on Android 12+, so a fixed-palette theme is a distinct, reproducible choice. Both new themes are free, opaque (no backdrop), and have light and dark variants.

**Added (Android):** `CreamForest` ("Cream & Forest") and `LavenderCharcoal` ("Lavender & Charcoal") in `AppTheme.kt`, registered after Dusk; catalog entries in `ThemeCatalog.kt`. Theme choice persists through the existing `themeId` preference, so nothing new is needed.

**Readability.** `NewThemeContrastTest` checks 14 text/surface pairings (body, secondary text, cards, buttons, chips, containers, errors, accents) in light and dark for both themes: all meet WCAG AA 4.5:1. `ThemeCatalogTest` (15) still passes. **Real app finding fixed:** the note card header used the Space colour as text, which is unreadable on light cards (amber on cream is about 1.6:1). It now keeps the Space colour only when it has enough contrast, otherwise black or white (`ContrastResolver.resolveForeground`). This affected every light theme, not just the new ones.

**Added (website):** both themes in the simulator with the same colours; light/dark follow Appearance → Color mode. Simulator readability fixes found by auditing every screen: fields and segmented controls now take the theme colour (they were stuck on the website's midnight), the rail overlay is lighter on light themes, and note headers use the same contrast rule as the app. Audit result after fixes: appearance page, conversation, and Spaces with amber and pink colours pass in all four theme/mode combinations.

**Shared motion.** One spec in `docs/motion.md`; Android constants in `ui/theme/Motion.kt`. Implemented in the app: save confirmation (explicit enter/exit timing), checklist item colour ease, tools column open/close with explicit timing. Mirrored in the simulator: the same save confirmation (inside the phone, with the app's wording and the Open Space action), checklist ease, tools opening, widget strip fade, and a 450 ms colour transition on theme change. Everything is removed under reduced motion (OS setting and the playground's own).

**Simulator fidelity change.** Add to a Space now preselects the Spaces already holding the message (as the app does), so unticking removes it, and the old website-only "Saved to…" note is gone in favour of the in-phone confirmation.

**Honest limits.** Motion is *implemented* in the app and the save confirmation, rotation and Back were checked on the Fold7, but animation timing has not been compared against recordings. Simulator parity gaps: the tools column and widget strip only animate *opening/fading in*, and theme changes ease colours only (gradients and scenes change at once). The test pane used here cannot render motion, so website timing was verified from the applied CSS and element state, not by eye.


---

## Photo carousel (app change made, **not committed** in the app repo)

**What grouping does today (verified in `MessageThreadScreen.kt` `buildThreadItems`).** In a conversation, consecutive *photo-only* messages from the same sender, with no time header between them and within 5 minutes, become one group; a single MMS with 2+ photos is also a group. A message with a caption, reactions, other attachments, or a pending/failed state is never merged. In Threadwell view each photo message draws its own group. The style (Stack, Cascade, List) is **one global setting** in Appearance. The Attachments grid has no layout options.

**Added: Carousel as a fourth global style** (`PhotoCollage.kt`, `AppSettings.kt`, `AppearanceScreen.kt`). It inherits the existing grouping rule, so it cannot combine unrelated messages or captioned photos. One photo at a time, snapping, with the neighbours peeking and a "2 of 6" position. Movement is always the reader's (no auto-advance). Tap opens the viewer at that photo; long-press opens the same photo actions. Screen-reader users get Previous/Next photo actions and a polite position announcement. Reduce motion turns off the centre scale effect and animated page changes. The choice is remembered like the other styles (global, existing preference).

**Not done (deliberately):** a Carousel layout inside the Attachments section (it is a separate grid feature, not a photo-group style) and landscape/unfold tuning beyond the responsive page width. Compiles warning-free. **Later phone-checked:** the carousel and Ring render and tilt correctly in Threadwell view; the endless loop and larger Ring were installed afterwards and are not yet phone-tested.

**Later changes (see `HANDOFF.md`):** the carousel is now staggered (neighbours tucked behind, dots) rather than the single-photo carousel described above; a fifth style, **Ring** (a 3D circle), was added; both loop endlessly; and Threadwell view now groups consecutive photo messages the same way the conversation screen does.

**Website mirror:** Appearance → Photo groups → Carousel. The playground's Sam thread now has a real three-photo group so the style is visible, the Photos tutorial supports it, arrow keys work, and the page survives re-renders. Parity gap: the playground cannot open the full-screen viewer, so a tap explains that instead.

---

## Verified on a device (Galaxy Z Fold7, Android 16, dev build `app.threadwell.mobile.dev`)

Tested with the user's phone connected. Nothing was sent; test threadmarks were removed afterwards; the theme, colour mode and auto-rotate were restored.

| Check | Result |
|---|---|
| Add to Threadwell dialog survives a rotation with typed text (batch 2) | **Pass.** Dialog stayed open and kept the text after rotating to landscape. |
| Save-to-Space confirmation (batch 1) | **Pass.** "Saved to Home projects" with **Open Space**. |
| Open Space | **Pass.** Lands inside that Space under All conversations. The confirmation is dismissed by the tap. |
| Removing from Spaces | **Pass.** "Removed from condo and Home projects". |
| Confirmation timing | It disappears within the accessibility timeout (about 6 s). A test that waited longer missed it, which is expected. |
| **Back from a Space (found on device)** | **Pre-existing bug, now fixed in the working tree.** The board keeps My Spaces, Spam, Search and Today as modes, not history, so Back left the app from any of them. Added a `BackHandler` in `MessageBoardScreen.kt`: Space → My Spaces → conversation → out. Verified on the phone. |
| Cream & Forest and Lavender & Charcoal | Both appear in Browse themes and render correctly. Lavender & Charcoal matches the reference screenshot. Cream & Forest in **dark** mode is deep forest green; in **Light** mode it is cream paper with forest green (verified after applying it). |
| Colour mode with a dark-only theme (Halloween) | Light and Dark are greyed out; System stays selected. This is existing behaviour (dark-only themes ignore the colour mode). |

Later device checks (same phone): the open-conversation button now opens at the reader's position (pass); carousel and Ring tilt/size look right (user-confirmed). **Still not tested on any device or emulator:** endless looping, the larger Ring, large-text and keyboard-visible layouts, and unfolded two-pane behaviour.


---

## Overnight batch, 8 October 2026 (no phone used)

Done with source reading, unit tests and a desktop browser only. Nothing in this section was run on a phone or an emulator. See [feature-status.md](feature-status.md) for the per-feature table.

**Parity (website matched to the app, verified in a browser)**
- Threadwell-view photo grouping uses one rule (`js/photo-runs.js`), tested with 15 cases that mirror `BoardPhotoGroupTest` (different senders, captions, time headers, the 5-minute gap, other attachments, pending/failed/sending, one message with several photos).
- **Open chat** (header button) opens the conversation at the message at the bottom edge of the board chat, or at the newest. Checked for a photo group, a plain message, and the newest message.
- A grouped photo can be long-pressed, and its actions use the group's **first** message (as in the app). Add to a Space on it saves "[photo]"; "Show in chat" outlines the group.
- "Saved to / Removed from" wording logic is identical to `SaveNotices.describe`.
- **Corrected a website invention:** the playground asked "Remove from Space?" for a single item; the app removes it at once with no confirmation or undo. The playground now does the same. (Open product question: should the app add an Undo?)
- **Corrected a website assumption:** switching layouts no longer carries the open conversation across (see the layout row above).

**Carousel and Ring hardening**
- The placement maths is pure and shared: `RingLayout`/`CarouselLoop` (app) and `js/ring-layout.js` (web) pass the same golden table; every photo is drawn exactly once for group sizes 2 to 40 and every front photo; large groups (over 12) draw only the nearest 12, which also bounds decoding and memory; empty groups no longer crash either side.
- **Bug fixed (web):** rapid arrow-key presses lost steps because each press read the scroll position mid-glide; presses now track the pending target. Verified: 53 mixed presses land on the right photo in instant mode. Smooth mode could only be checked as far as the counter, because the browser pane does not animate scrolling.
- Checked in a browser: hidden copies cannot take focus and are `aria-hidden`; reduced motion removes every transform; focus stays on the track after re-centring; the selected photo, the "N of M" counter, the dots and the tap target agree.

**State preservation**
- New: the Add-to-a-Space picker keeps its open state, ticked Spaces and Important box across a rotation (all five call sites). Unit-tested saver; **not seen on a device**.
- Everything else is documented in the app repo's `docs/STATE_PRESERVATION.md` with the three cases (rotation, process recreation, relaunch) kept separate.

**Older issues (confirmed first, then fixed without changing any threshold)**
- Text-size slider offered 60–180% but the stored clamp is 85–180%: the slider now uses the real limits (same as the website).
- Keyword caption said "always treated as spam". A single keyword scores 50, which is the *warning* tier (38–65); three hits reach the spam tier (66); saved contacts are capped at 44. Caption (app and website demo) and the app's `CLAUDE.md` tier description corrected. The warning tier is **not** hidden: it stays in the inbox with a "might be spam" banner.
- `docs/PRIVACY.md` was missing the Zippopotam.us ZIP lookup, ESPN, Yahoo Finance, link previews and the calendar note; synced to the audit and the website page.

**Themes and accessibility**
- 11 more contrast pairings added for both new themes in light and dark (snackbar, spam banner, error text, borders, selected chips); all pass. No palette changes were needed.
- New default: **Reduce motion follows Android's "Remove animations"** until the user chooses (`AppSettings.systemAnimationsOff`). Previously the app ignored the system setting.

**Emulator**
- Machine is ready (emulator 37.1.11, WHPX usable, 63 GB RAM, ~1 TB free). **Blocked** on two downloads that need the owner's approval: the SDK command-line tools and the Android 16 system image (~1.5 GB). Scripts (`tools/emulator/`) and a debug-only synthetic-data seeder are written and tested as far as possible; every command refuses a physical phone.


---

## Fixes from the owner's own testing, 8 October 2026 (checked on the emulator, synthetic data)

1. **"Show in chat" opened at the newest message for an older saved message** (two causes; the second showed up on the owner's phone with real data, where the first fix alone did not help: the conversation screen set "at oldest" whenever a page came back shorter than 150, but folded reactions and skipped empty MMS rows make a full page of stored rows short, so paging stopped early; it now asks the query whether it hit its row cap, `SmsRepository.PageInfo`; reproduced on the emulator with a seeded 600-message thread with tapbacks). The first cause: Reproduced with a 240-message thread and a message far outside the first 150. After the older page loaded, the jump compared against a list that had not been rebuilt yet, concluded the message was missing, and gave up. It now looks in the loaded messages themselves, waits for the list to hold them, then scrolls and outlines the message. Plain recent messages and photo groups already worked. Test: `ThreadJumpTest`.
2. **A pinned item was not visible in a Space.** Saving worked; the item was there. But Spaces list newest-at-the-bottom and open scrolled to the bottom, and "Pinned first" puts pinned items at the far (top) end, so a pinned item was out of view whenever the list was longer than a screen. The Space now opens at its pinned items and jumps to one you have just pinned.
3. **The confirmation's action was drawn over its message** on the emulator ("Open Space" on top of "Saved to ringtest"). The stock Snackbar was replaced by our own row (message left, action right). The owner's phone had not shown this, so check it there.
4. **Undo on "Remove from Space"** (the owner said yes): single removal stays immediate and the notice offers Undo, which restores the same item (id, pin, reminder).
5. **Cream & Forest is now light only** (the owner said yes): it ignores the system's dark mode and the Color mode setting, which is greyed out for it with a one-line explanation. The simulator does the same.
6. **Ring redesign** after the owner's note that the circle needed more angle and that photos from behind should show: side photos turn up to 64°, the far half rises 20% of the width above the front photo and turns back to face you at the very back, and all sizes are shares of the carousel width so a phone, a cover screen and an unfolded screen look alike. Verified on the emulator with 3, 12 and 13 photos.
