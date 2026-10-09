// Which photo messages the playground draws as one group. This mirrors the Android rule so both sides agree:
//   MessageThreadScreen.kt `buildThreadItems` (conversation screen) and BoardChannels.kt `buildChatRows(groupPhotos)`
//   (Threadwell view); tests: BoardPhotoGroupTest.kt. Keep the three in step.
//
// A message is "photo only" when it has photos and nothing else: no caption, no other attachment, no reactions, and it
// is not still sending, failed, or an undownloaded placeholder. Consecutive photo-only messages from the same sender
// with no time header between them, and (when both carry a time) within 5 minutes of each other, become one group. A
// single message that carries two or more photos is a group on its own. Anything else stays a single message.

export const PHOTO_GROUP_GAP_MS = 5 * 60_000;

export const photoUris = m => (Array.isArray(m.photos) && m.photos.length ? m.photos : m.photo != null ? [m.photo] : []);

export const photoOnly = m => photoUris(m).length > 0 && !m.text &&
  !(m.media && m.media.length) && !(m.reactions && m.reactions.length) && !m.pending && !m.failed && !m.sending;

/** Same sender: same direction and, in a group chat, the same person (`from`). */
const sameSender = (a, b) => a.sent === b.sent && (a.from || '') === (b.from || '');

/**
 * Splits a conversation (oldest first) into units: `{ kind: 'single', m }` or `{ kind: 'photos', msgs, uris }`.
 * With `group` off every message is a single, as in Threadwell view when "photo groups in Threadwell view" is off.
 */
export function groupRuns(list, { group = true } = {}) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    if (group && photoOnly(m)) {
      let j = i + 1;
      while (j < list.length) {
        const n = list[j], prev = list[j - 1];
        if (!photoOnly(n) || !sameSender(m, n) || n.t) break;
        if (typeof n.at === 'number' && typeof prev.at === 'number' && n.at - prev.at > PHOTO_GROUP_GAP_MS) break;
        j++;
      }
      const msgs = list.slice(i, j);
      if (msgs.length >= 2 || photoUris(m).length >= 2) {
        out.push({ kind: 'photos', msgs, uris: msgs.flatMap(photoUris) });
        i = j - 1;
        continue;
      }
    }
    out.push({ kind: 'single', m });
  }
  return out;
}
