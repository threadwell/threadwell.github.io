// Shared screens and actions for the widget tutorials: the inbox with its widget strip, Settings,
// Settings -> Widgets & dashboard, and a widget's own page.
import { inbox } from './inbox.js';
import { settingsHome } from './phone-ui.js';
import { widgetsHost, widgetOverlays, widgetsSettingsView, widgetPageView, widgetActs, widgetsSummary } from './widgets-model.js';

export const widgetViews = ({ settingsLive = null } = {}) => ({
  home: s => inbox(s, { pulse: s.pulse, widgets: widgetsHost(s, 'trad') }) + widgetOverlays(s, 'trad'),
  settings: s => settingsHome({ ...s, widgetsSummary: widgetsSummary(s) }, { pulse: s.pulse }),
  wset: s => widgetsSettingsView(s, { live: settingsLive }),
  wpage: s => widgetPageView(s),
});

export const widgetBase = (on = {}) => ({
  gear: api => { api.s.pulse = ''; api.go('settings'); on.event?.(api, 'gear'); },
  settings: api => { api.s.pulse = ''; api.go('settings'); on.event?.(api, 'gear'); },
  cat: (api, id) => { if (id === 'widgets') { api.go('wset'); on.event?.(api, 'wsetopen'); } },
  // Website demo control (not an app feature): what happens if permission is revoked in Android settings.
  demorevoke: api => { api.s.cal = 'ask'; api.render(); on.event?.(api, 'revoked'); },
  ...widgetActs(on),
});
