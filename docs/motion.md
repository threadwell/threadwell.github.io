# Threadwell motion spec (shared by the Android app and the website simulator)

One set of numbers, two implementations. Change both together.

- Android: `app/src/main/java/com/example/mooglemessages/ui/theme/Motion.kt`
- Website simulator: the "Shared product motion" block at the end of `styles.css`, plus `js/playground.js`

Easing everywhere: **FastOutSlowIn** = `cubic-bezier(0.4, 0, 0.2, 1)`.
Rule: an animation explains one change, never blocks input, and **collapses to nothing under reduced motion**.

| Animation | Why it exists | Duration | Android | Website simulator | Parity |
|---|---|---|---|---|---|
| Save confirmation ("Saved to Trips" + Open Space) | Show where a save went without a dialog | enter 220 ms, exit 150 ms; fade + slide half its height; auto-dismiss 6 s (or the system accessibility timeout) | `SaveNotice.kt` (`AnimatedVisibility`) | `.notice` in the phone, `showNotice()` | Same wording, timing, easing. The simulator uses a fixed 6 s. |
| Checklist item done / not done | Confirm the tap landed, quietly | 160 ms text colour ease | `BoardChannels.kt` (`animateColorAsState`) | `.ck-anim-on` / `.ck-anim-off` | Strike-through is instant in both. |
| Tools column opens / closes | Explain that tools tuck away and where they went | 200 ms size + fade (exit fade 150 ms) | `MessageBoardScreen.kt` | `js/panel-motion.js` | Playground uses size 200 ms and exit fade 150 ms; guided board handlers still need the same integration. |
| Widget strip collapses / expands | Explain the dock | fade in 200 ms after 60 ms, fade out 120 ms, size 200 ms | `CollapsibleWidgetHost.kt` (unchanged) | `js/panel-motion.js` | Playground strip uses size 200 ms, fade-in 200 ms after 60 ms and exit 120 ms; dock timing is a separate follow-up. |
| Photo carousel (a fourth photo-group style, endless) | Browse several photos one at a time without taking over the conversation | User-driven swipe with snapping; staggered: centre photo 100% in front, neighbours tucked behind at 83% / 66% scale and 78% / 56% opacity, two visible each side; no auto-advance | `PhotoCollage.kt` (`CarouselPhotos`, `HorizontalPager`, `CarouselDots`) | `.car-track` + `bindCarousels()` in `phone-ui.js` | Same layout (58% pages, same offsets 0.70 / 1.12 pages), dots (plain "N of M" beyond 8 photos), tap opens the photo. Reduced motion = plain snapping row. The simulator cannot open the full-screen viewer in the playground; it says so. |
| Photo Ring (a fifth photo-group style, endless) | Browse photos as a 3D circle: front photo faces you, the rest turn toward the centre, the far half sits behind | User-driven swipe with snapping; each photo is placed by `RingLayout.place` (scale 1.0 → 0.5, opacity 1.0 → 0.4, tilt up to 60°, lifted up to 36 dp), 6 slots minimum; no auto-advance | `PhotoCollage.kt` (`CarouselPhotos(ring = true)`, `RingLayout`, `RingLayoutTest`) | `.pg.ring` + `bindCarousels()` in `phone-ui.js` | Same maths and constants (`ring-layout.js` ↔ `RingLayout`). A cylinder: side photos turn up to 64°, the far half rises 20% of the width and turns back to face you; photo width 38% and radius 43% of the carousel width. Each photo drawn once per half-circle; copies n slots away are hidden (website: `visibility: hidden`). Reduced motion = plain row. |
| Theme switch | Soften a big visual change | 450 ms | `THEME_TRANSITION_MS` (colour scheme tween + backdrop crossfade) | colours ease 450 ms via `[data-theming]` | **Colours only.** Gradient and scene backdrops change at once in the simulator. |

## Reduced motion
- Android: every animation above checks `AppSettings.reduceMotion` and uses no transition (the app's existing convention).
- Website: `prefers-reduced-motion: reduce` and the playground's own Reduce motion setting (`data-motion="off"`) both remove all of it. Page-to-page View Transitions are separate (website shell, not part of the app).

## Not animated on purpose
Message sending, scrolling, list reordering and spam restore: nothing to explain, and they must stay instant.

## Verification status
- Android: compiles warning-free; wording, contrast and the Ring placement maths are covered by unit tests. **Phone-tested (Galaxy Z Fold7):** the save confirmation appears and Open Space works; carousel and Ring render and tilt correctly. **Not yet phone-tested or emulator-tested:** the endless loop, the enlarged Ring, and animation *timing* of the tools column and checklist ease (these were seen working, not measured).
- Website: checked in a desktop browser; the browser pane used for testing cannot render animation, so timing was confirmed by reading the applied CSS and by checking the elements and classes appear and clear, not by eye. The carousel/Ring loop was verified by reading `scrollLeft` and the active dot after simulated scrolls.

## Remaining differences between the app and the simulator (explicit)
| Area | App | Simulator |
|---|---|---|
| Tools column | Animates open **and** closed | Playground now animates both; guided board handlers still need integration |
| Widget strip | Size 200 ms + fade in/out | Playground strip now matches duration/easing; separate dock motion remains to audit |
| Theme switch | Colour scheme tween **and** backdrop crossfade (450 ms) | Colours ease 450 ms; gradient and scene backdrops change at once |
| Save confirmation | Auto-dismiss follows the system accessibility timeout (6 s default) | Fixed 6 s |
| Photo carousel / Ring | Real pager, native fling and snapping | CSS scroll-snap track; a swipe settles slightly differently. Endless loop is a three-copy track that re-centres after 140 ms |
| Full-screen photo viewer | Opens on tap | Not available in the playground; the tap explains this |
| Threadwell-view photo grouping | Consecutive photo messages become one group (`buildChatRows`) | Same rule (`js/photo-runs.js`, tested by `tools/test-photo-runs.mjs`). The simulator has no clock, so the 5-minute rule only applies to messages that carry a time |
| Open conversation at reading position | Header button opens the conversation at the message at the bottom edge of the board chat (`BoardChatPosition`) | Same, via the live "Open chat" button (`openfull`); the message, or the first message of a photo group, is outlined for about 2 seconds |

### 9 October verification update
The new browser regression harness passed 11 checks, including actual Web Animations API completion, interrupted transitions and reduced-motion fallback (none skipped). This supersedes the earlier blanket statement that the browser cannot animate. Exact visual parity and native gesture physics are not established by these assertions. See HANDOFF.md for current emulator results and outstanding checks.
