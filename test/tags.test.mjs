import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContent } from '../scripts/content.mjs';
import { templates } from '../src/templates.mjs';
import config from '../site.config.mjs';

const parse = fields => parseContent(`---\ndate: "2026-10-16"\n${fields}\n---\n\nBody.`, 'entry.md', true);

test('tags are optional, normalized, and deduplicated while preserving order', () => {
  assert.deepEqual(parse('').tags, []);
  assert.deepEqual(parse('tags: []').tags, []);
  assert.deepEqual(parse('tags: [" Photography ", "photography", "Field   Notes", "CAFÉ"]').tags, ['photography', 'field notes', 'café']);
  for (const field of ['tags: photography', 'tags: null', 'tags: [42]', 'tags: [""]', 'tags: ["  "]']) {
    assert.throws(() => parse(field), /tags must be a list/);
  }
});

test('badges appear on Home, Archive and above the entry title with escaped links', () => {
  const view = templates({ ...config, basePath: '/audio-video-disco' });
  const entry = { id: '2026-10-16-01', date: '2026-10-16', title: 'Title', preview: 'Summary', tags: ['art & sound', 'café', '<img>'] };
  for (const html of [view.home([entry]), view.archive([entry]), view.entry(entry, '<p>Body.</p>')]) {
    assert.ok(html.includes('/audio-video-disco/archive/?tag=art%20%26%20sound'));
    assert.ok(html.includes('>art &amp; sound</a>'));
    assert.ok(html.includes('&lt;img&gt;</a>'));
  }
  const html = view.entry(entry, '<p>Body.</p>');
  assert.ok(html.indexOf('</time>') < html.indexOf('tags:</span>'));
  assert.ok(html.indexOf('tags:</span>') < html.indexOf('<h1>'));
  assert.ok(!view.entry({ ...entry, tags: [] }, '<p>Body.</p>').includes('class="tags"'));
  assert.ok(!view.home([entry]).includes('<script'));
  const archive = view.archive([entry]);
  assert.ok(archive.includes('src="/audio-video-disco/assets/archive.js" defer'));
  assert.ok(archive.includes('id="archive-filter" class="archive-filter" hidden'));
});
