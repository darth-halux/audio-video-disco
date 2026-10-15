import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, symlink, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

test('complete build supports subpaths, images and captions, excludes drafts, and fails on missing images', async () => {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const root = await mkdtemp(path.join(os.tmpdir(), 'avd-build-'));
  try {
    for (const name of [
      'scripts',
      'src',
      'public',
      'package.json',
      'site.config.mjs'
    ]) {
      await cp(
        path.join(source, name),
        path.join(root, name),
        { recursive: true }
      );
    }

    // Use isolated test content instead of copying real entries.
    await mkdir(path.join(root, 'content/entries'), { recursive: true });
    await mkdir(path.join(root, 'content/pages'), { recursive: true });

    await writeFile(
      path.join(root, 'content/pages/about.md'),
      '---\ntitle: "About"\n---\n\nA test page.\n'
    );
    await symlink(path.join(source, 'node_modules'), path.join(root, 'node_modules'), 'dir');
    const entry = path.join(root, 'content/entries/2026-10-07-01');
    await mkdir(path.join(entry, 'images'), { recursive: true });
    await sharp({ create: { width: 100, height: 80, channels: 4, background: '#88998888' } }).png().toFile(path.join(entry, 'images/test.png'));
    const content = '---\ndate: "2026-10-07"\n---\n\n<figure>\n\n![An image](images/test.png)\n\n<figcaption>A caption</figcaption>\n</figure>\n\n[About](/about/)\n';
    await writeFile(path.join(entry, 'index.md'), content);
    const draft = path.join(root, 'content/entries/2026-10-08-01');
    await mkdir(draft);
    await writeFile(path.join(draft, 'index.md'), '---\ndate: "2026-10-08"\ndraft: true\n---\n\nDRAFT_SENTINEL\n\n![Not published](images/nonexistent.jpg)');
    const options = { cwd: root, env: { ...process.env, SITE_BASE_PATH: '/notebook', SITE_ORIGIN: 'https://example.org' }, encoding: 'utf8', stdio: 'pipe' };
    execFileSync(process.execPath, ['scripts/build.mjs'], options);
    const html = await readFile(path.join(root, 'dist/entries/2026-10-07-01/index.html'), 'utf8');
    assert.ok(html.includes('<picture>'));
    assert.ok(html.includes('<figcaption>A caption</figcaption>'));
    assert.ok(html.includes('href="/notebook/about/"'));
    assert.ok(html.includes('https://example.org/notebook/entries/2026-10-07-01/'));
    assert.ok(!html.includes('<script'));
    assert.ok(!(await readdir(path.join(root, 'dist/entries'))).includes('2026-10-08-01'));
    assert.ok(!(await readdir(path.join(root, 'dist'))).includes('content'));
    const derivatives = await readdir(path.join(root, 'dist/images'));
    assert.equal(derivatives.length, 2);
    assert.ok(derivatives.some(name => name.endsWith('.png')));
    await writeFile(path.join(entry, 'index.md'), content.replace('images/test.png', 'images/missing.png'));
    assert.throws(() => execFileSync(process.execPath, ['scripts/build.mjs'], options), error => error.stderr.includes('Build failed:'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
