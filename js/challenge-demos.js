// Which guided challenge has a "Show me" demonstration, and what the visitor can do after it. A challenge without an entry
// simply has no Show me button; its written steps are always there. `tools` is an explicit shortcut offered at the end.
import { packingDemo } from './playdemos/packing.js';
import { spaceDemo } from './playdemos/space.js';
import { themeDemo } from './playdemos/theme.js';
import { layoutDemo } from './playdemos/layout.js';
import { collapseDemo } from './playdemos/collapse.js';
import { dockDemo } from './playdemos/dock.js';

export const DEMOS = {
  packing: { make: packingDemo, tools: { label: 'Open checklist tools', starter: 'checklist' } },
  space: { make: spaceDemo },
  theme: { make: themeDemo, tools: { label: 'Open Browse themes', starter: 'theme' } },
  layout: { make: layoutDemo, tools: { label: 'Open layout settings', starter: 'layouts' } },
  collapse: { make: collapseDemo },
  dock: { make: dockDemo },
};
