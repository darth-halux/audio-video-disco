import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContent } from '../scripts/content.mjs';
import { templates } from '../src/templates.mjs';
import config from '../site.config.mjs';

test('untitled content needs only a valid date; CRLF is accepted', () => {
  const result = parseContent('---\r\ndate: "2024-02-29"\r\n---\r\nA thought.', 'entry.md', true);
  assert.equal(result.title, undefined);
  assert.equal(result.draft, false);
  assert.equal(result.body, 'A thought.');
});

test('bad dates, duplicate keys, misspelled fields and string booleans fail clearly', () => {
  for (const fields of ['date: "2025-02-29"', 'date: "2026-10-06"\ndraft: "false"', 'date: "2026-10-06"\ndate: "2026-10-07"', 'date: "2026-10-06"\nprevew: hi']) {
    assert.throws(() => parseContent(`---\n${fields}\n---\nText`, 'entry.md', true));
  }
});

test('title text is escaped and hosting prefixes apply to entry URLs', () => {
  const html = templates({ ...config, basePath: '/notebook' }).home([{ id: '2026-10-06-01', date: '2026-10-06', title: '<script>oops</script>' }]);
  assert.ok(html.includes('/notebook/entries/2026-10-06-01/'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});
