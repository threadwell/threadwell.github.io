// The playground's screens, as pure functions of one state object. Shared by the playground (its own session) and by the
// guided demonstrations (a separate sample session), so both draw exactly the same app.
import { themeSpec } from './demos/themes.js';
import { settingsHome, statusbar, appbar, appearancePage } from './phone-ui.js';
import { inbox } from './inbox.js';
import { widgetsHost, widgetOverlays, widgetsSummary, widgetsSettingsView, widgetPageView } from './widgets-model.js';
import { tlist, tchat, chatAt, fullChat, playBoard, messagingPage, sharedOverlays } from './play-ui.js';
import { spamQuarantined, spamPage, spamFolderView } from './play-org.js';

export const withList = fn => s => { s.tlist = tlist(s); return fn(s); };
export const views = {
  home: withList(s => (s.layoutMode === 'board'
    ? playBoard(s)
    : inbox(s, { pulse: s.pulse, threads: s.tlist, openRows: true, widgets: widgetsHost(s, 'trad'), spamLive: true, spamCount: spamQuarantined(s) ? 1 : 0 }) + widgetOverlays(s, 'trad') + sharedOverlays(s))),
  tchat: withList(s => tchat(s)),
  chat: withList(s => chatAt(s)),
  fullchat: withList(s => fullChat(s)),
  settings: s => settingsHome({ appliedTheme: s.appliedTheme, reduceMotion: s.reduceMotion, smart: s.smart, autoReport: s.autoReport, widgetsSummary: widgetsSummary(s) }, { pulse: s.pulse }),
  spam: s => spamPage(s),
  spamlist: withList(s => statusbar() + appbar('Spam', { back: true }) + `<div class="set-body" tabindex="0">${spamFolderView(s)}</div>`),
  messaging: s => messagingPage(s),
  appearance: s => appearancePage({ ...flat(s), pg: true }, { pulse: s.pulse }),
  gallery: s => themeSpec.views.gallery(s),
  preview: s => themeSpec.views.preview(s),
  customize: s => themeSpec.views.customize(s),
  picker: s => themeSpec.views.picker(s),
  wset: s => widgetsSettingsView(s),
  wpage: s => widgetPageView(s),
};
function flat(s) { return { appliedTheme: s.appliedTheme, colorMode: s.colorMode, reduceMotion: s.reduceMotion, textScale: s.textScale, photoStyle: s.photoStyle, stackSpread: s.stackSpread }; }

