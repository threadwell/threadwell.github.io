# Feature status: implemented, tested, released

One row per feature, tracked in five separate stages so "built" is never mistaken for "verified". Updated 8 October 2026.

**Stages**
- **Implemented**: the code exists in the working tree.
- **Unit-tested**: automated tests cover the logic (Android: `./gradlew testDebugUnitTest`, 289 tests; website: `node tools/test-photo-runs.mjs`, `node tools/test-ring-layout.mjs`).
- **Emulator-tested**: exercised on the Android 16 emulator (`tools/emulator/` in the app repo), on **synthetic data only**. Set up 8 October 2026.
- **Phone-tested**: exercised by hand on the owner's Galaxy Z Fold7 (dev build). Pass = it worked; "seen" = looked right but was not measured.
- **Released**: shipped to users. **Nothing is.** All app changes are uncommitted; the website has local commits and nothing is pushed.

Legend: ✔ done · ✘ not done · — not applicable · *(web)* = the website's playground/simulator.

| Feature | Implemented | Unit-tested | Emulator | Phone | Released | Notes |
|---|---|---|---|---|---|---|
| Save-to-Space confirmation ("Saved to X", Open Space) | ✔ app, ✔ web | ✔ wording (`SaveNoticeTest`) | ✔ shown, Open Space works | ✔ pass | ✘ | **Layout fixed 8 Oct:** the stock Snackbar drew the action over the message on the emulator; now our own row (message left, action right). Re-check on the phone. |
| **Undo on "Remove from Space"** | ✔ app, ✔ web | ✔ notice (`SaveNoticeTest`) | ✔ remove then Undo restores the item | ✘ | ✘ | Owner approved 8 Oct. Single removal is still immediate (no confirm); the notice offers Undo. |
| Rotation-safe capture, composer, add-item fields | ✔ | ✘ | ✘ | ✔ pass (Add to Threadwell dialog) | ✘ | |
| Add-to-a-Space picker survives rotation | ✔ | ✔ saver (`TagTargetSaverTest`) | ✘ | ✘ | ✘ | All five call sites. Needs a rotation test. |
| Back steps Space → My Spaces → conversation | ✔ | ✘ | ✘ | ✔ pass | ✘ | |
| Cream & Forest (**now light only**) and Lavender & Charcoal | ✔ app, ✔ web | ✔ contrast, 25 pairings per scheme (`NewThemeContrastTest`, `NewThemeSurfacesContrastTest`); light-only rule tested | ✘ | ✔ renders | ✘ | Cream & Forest ignores dark mode and the Color mode setting (greyed out) by the owner's decision. |
| Shared motion spec (`Motion.kt`, `docs/motion.md`) | ✔ app, ✔ web | ✘ | ✘ | seen | ✘ | Differences listed in `docs/motion.md`. |
| Reduce motion follows Android's "Remove animations" until chosen | ✔ | ✘ (needs Context) | ✘ | ✘ | ✘ | `AppSettings.systemAnimationsOff`. |
| Carousel layout (staggered, dots) | ✔ app, ✔ web | ✔ indexing and loop (`CarouselLoopTest`) | ✔ renders, groups of 2 and 3 | ✔ seen | ✘ | |
| **Ring layout, redesigned 8 Oct** (cylinder with a visible back row) | ✔ app, ✔ web | ✔ placement + golden values shared with the web (`RingLayoutTest`, `tools/test-ring-layout.mjs`) | ✔ looks right for groups of 3, 12 and 13 | ✔ pass (owner, 8 Oct: "looks fantastic", 26 photos) | ✘ | Owner asked for more angle and a visible back; sizes are now shares of the carousel width. Phone-confirmed. |
| Endless looping (carousel and ring) | ✔ app, ✔ web | ✔ | ✔ 13 swipes through a 12-photo ring wrapped to photo 3 | ✘ | ✘ | Web re-centring and keys tested in a browser pane that cannot animate scrolling. |
| Photo grouping in Threadwell view | ✔ app, ✔ web (`js/photo-runs.js`) | ✔ app (`BoardPhotoGroupTest`), ✔ web (15 cases) | ✔ run of 3, one MMS with 2, captioned photo kept apart, runs of 9, 12, 13 | ✔ seen | ✘ | Same rule in both. |
| Open conversation at the reading position | ✔ app, ✔ web (`openfull`) | ✘ | ✘ | ✔ pass | ✘ | Shares the jump code fixed below. |
| **"Show in chat" for an old message** (bug found by the owner 8 Oct) | ✔ fixed | ✔ lookup (`ThreadJumpTest`) | ✔ reproduced, fixed: Message 5 of 240 opens in place and is outlined | ✔ pass (owner, 8 Oct, real saved items) | ✘ | Two causes, both fixed: the jump looked in a stale list right after older history loaded, and the conversation screen decided "no more history" from a short page (folded reactions and skipped empty MMS rows make a full page of stored rows short), so it stopped paging early. The second was found on the owner's phone with real data and reproduced on the emulator with a 600-message thread that has tapbacks. |
| **Pinned items visible when a Space opens** (bug found by the owner 8 Oct) | ✔ fixed | ✘ | ✔ the pinned item is at the top on open | ✘ | ✘ | The list is bottom-anchored, so pinned items sat out of view at its far end. Also jumps to a newly pinned item. |
| Layout switch keeps Threadwell view's own last conversation | ✔ web | ✘ | ✘ | ✘ | ✘ | App behaviour source-verified; web matches. |
| Text-size slider range = real limits (85–180%) | ✔ app | ✘ | ✘ | ✘ | ✘ | |
| Spam keyword caption is accurate | ✔ app, ✔ web | — | — | — | ✘ | Wording only. Thresholds untouched. |
| Privacy text in step (`docs/PRIVACY.md`) | ✔ | — | — | — | ✘ | |
| Emulator test environment | ✔ | ✔ seeder plan (`FixturePlanTest`) | ✔ working | — | — | Android 16 image, `threadwell-phone` and `threadwell-fold` AVDs, synthetic seeder. Every script refuses a physical phone. |
| Carousel/grid choice in Attachments | ✘ | ✘ | ✘ | ✘ | ✘ | Stretch goal, deliberately not started. |

## Known gaps (nothing here is hidden)
- **Not tested on the phone yet:** endless looping, the notice layout fix, Undo, the pinned-items change. (Ring and "Show in chat" for old messages were confirmed on the phone 8 Oct.) The rest were checked on the emulator only.
- **Not tested anywhere:** large text, keyboard-visible layouts, the unfolded two-pane layout (the `threadwell-fold` AVD exists but has not been used), process recreation, rotation of the picker.
- **Website cannot test animation**: the browser pane used here does not run animation frames.
- **App/simulator differences** are listed in `docs/motion.md`.
