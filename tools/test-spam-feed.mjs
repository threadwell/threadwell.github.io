// Run with: node tools/test-spam-feed.mjs
// Mirrors SpamFeedRules.parse in the app: the app rejects the WHOLE feed on any bad line, so a typo here silently switches
// every rule off for every user. This checks spam-feed.txt against the same limits. Keep in step with SpamFeedRules.kt.
// Approximations (no Guava / RE2 here): a domain needs a registrable name (a small list of bare suffixes is refused) and
// RE2 is approximated by refusing lookaround, backreferences, atomic groups and possessive quantifiers.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const LIMITS = { MAX_BYTES: 64 * 1024, MAX_LINE: 1024, MAX_RULES: 512, MAX_REGEX: 32, REGEX_LEN: 256, KW_MIN: 4, KW_MAX: 256 };
const BARE_SUFFIXES = new Set(['com', 'net', 'org', 'edu', 'gov', 'io', 'co', 'us', 'uk', 'co.uk', 'org.uk', 'com.au', 'gq', 'tk', 'ml', 'cf', 'ga']);
const BAD_RE2 = [/\(\?[=!<>]/, /\\[1-9]/, /\\k</,/[*+?}]\+/];

/** Returns the parsed rules, or throws Error(reason) exactly where the app would refuse the feed. */
export function parseFeed(text) {
  if (Buffer.byteLength(text, 'utf8') > LIMITS.MAX_BYTES) throw new Error('Feed exceeds 64 KiB');
  if (text.includes('�') || text.includes('\u0000')) throw new Error('Invalid text encoding');
  const out = { domain: [], sender: [], keyword: [], regex: [] };
  let count = 0;
  text.split(/\r?\n/).forEach((raw, i) => {
    const at = i + 1;
    if (raw.length > LIMITS.MAX_LINE) throw new Error(`Line ${at} too long`);
    const line = raw.split('#')[0].trim();
    if (!line) return;
    if (++count > LIMITS.MAX_RULES) throw new Error('Too many rules');
    const c = line.indexOf(':');
    const value = (c < 0 ? '' : line.slice(c + 1)).trim();
    if (!value) throw new Error(`Missing value at ${at}`);
    switch (line.slice(0, c).toLowerCase()) {
      case 'domain': {
        const d = value.replace(/\.$/, '').toLowerCase();
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) || BARE_SUFFIXES.has(d)) throw new Error(`Invalid/public-suffix domain at ${at}`);
        out.domain.push(d); break;
      }
      case 'sender':
        if (value.length > 128 || !(/^\+?\d{3,15}\*?$/.test(value) || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))) throw new Error(`Invalid sender at ${at}`);
        out.sender.push(value); break;
      case 'keyword':
        if (value.length < LIMITS.KW_MIN || value.length > LIMITS.KW_MAX) throw new Error(`Keyword too short/long at ${at}`);
        out.keyword.push(value.toLowerCase()); break;
      case 'regex': {
        if (out.regex.length >= LIMITS.MAX_REGEX || value.length > LIMITS.REGEX_LEN) throw new Error(`Regex limit exceeded at ${at}`);
        if (BAD_RE2.some(b => b.test(value))) throw new Error(`Not RE2 syntax at ${at}`);
        let re;
        try { re = new RegExp(value.replace(/^\(\?i\)/, ''), value.startsWith('(?i)') ? 'i' : ''); } catch { throw new Error(`Bad regex at ${at}`); }
        if (re.test('')) throw new Error(`Regex matches empty text at ${at}`);
        out.regex.push(re); break;
      }
      default: throw new Error(`Unknown rule type at ${at}`);
    }
  });
  if (!text.trim()) throw new Error('Empty feed');
  return out;
}

let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok  ' + name); };
const rejects = (text, re) => assert.throws(() => parseFeed(text), re);

test('the published spam-feed.txt parses', () => {
  const r = parseFeed(readFileSync(new URL('../spam-feed.txt', import.meta.url), 'utf8'));
  const total = r.domain.length + r.sender.length + r.keyword.length + r.regex.length;
  assert.ok(total > 0, 'a feed with no rules does nothing');
});
test('the sample package-redelivery rule matches its wording and not ordinary text', () => {
  const r = parseFeed(readFileSync(new URL('../spam-feed.txt', import.meta.url), 'utf8'));
  const hit = s => r.regex.some(x => x.test(s));
  assert.ok(hit('USPS: your address is incomplete, please update'));
  assert.ok(!hit('Dinner at 7?'));
});
test('comment-only is valid, empty is not', () => {
  parseFeed('# nothing active\n');
  rejects('', /Empty feed/); rejects('   \n', /Empty feed/);
});
test('inline comments and blank lines are ignored', () => parseFeed('keyword:free prize  # note\n\n  \n'));
test('unknown rule types, missing values and bad domains reject the whole feed', () => {
  rejects('phrase:hello there', /Unknown rule type/);
  rejects('keyword:', /Missing value/); rejects('keyword', /Missing value/);
  rejects('domain:com', /public-suffix/); rejects('domain:co.uk', /public-suffix/); rejects('domain:localhost', /domain/);
  parseFeed('domain:r.dcmg.com');
});
test('senders: digits with optional + and trailing *, or an email', () => {
  parseFeed('sender:60107\nsender:+18005551234\nsender:5551*\nsender:alerts@example.com');
  rejects('sender:12', /Invalid sender/); rejects('sender:abc', /Invalid sender/); rejects('sender:1234567890123456', /Invalid sender/);
});
test('keywords 4 to 256 characters', () => {
  rejects('keyword:win', /too short/); rejects('keyword:' + 'x'.repeat(257), /too short\/long|too long/);
  parseFeed('keyword:wins');
});
test('regex: RE2 only, not empty-matching, at most 32, at most 256 characters', () => {
  parseFeed(String.raw`regex:(?i)\bfree\b.{0,10}gift`);
  rejects('regex:foo(?=bar)', /RE2/); rejects(String.raw`regex:(a)\1`, /RE2/); rejects('regex:a*+b', /RE2/);
  rejects('regex:a*', /empty text/); rejects('regex:(unclosed', /Bad regex/);
  rejects('regex:' + 'a'.repeat(257), /Regex limit/);
  rejects(Array.from({ length: 33 }, (_, i) => `regex:word${i}`).join('\n'), /Regex limit/);
});
test('a "#" inside a regex ends the rule early, as in the app', () => {
  // The app strips everything after '#', so regex:a#b becomes regex:a. Fine to publish, but easy to get wrong.
  const r = parseFeed('regex:abc#def');
  assert.equal(r.regex[0].source, 'abc');
});
test('size limits: 512 rules, 1024 characters per line, 64 KiB', () => {
  parseFeed(Array.from({ length: 512 }, (_, i) => `keyword:phrase number ${i}`).join('\n'));
  rejects(Array.from({ length: 513 }, (_, i) => `keyword:phrase number ${i}`).join('\n'), /Too many rules/);
  rejects('# ' + 'x'.repeat(1030), /too long/);
  rejects(('# ' + 'x'.repeat(1000) + '\n').repeat(70), /64 KiB/);
});
console.log(`\n${n} passed`);
