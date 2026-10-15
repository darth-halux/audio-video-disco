import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { imageProcessor } from '../scripts/images.mjs';
import config from '../site.config.mjs';

test('image processing rotates, strips EXIF, avoids enlargement and preserves sources', async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'avd-images-'));
  try {
    await mkdir(path.join(folder, 'images'));
    const source = path.join(folder, 'images/oriented.jpg');
    await sharp({ create: { width: 80, height: 120, channels: 3, background: '#889988' } }).jpeg().withMetadata({ orientation: 6 }).toFile(source);
    const before = await readFile(source);
    const output = path.join(folder, 'output');
    const processor = imageProcessor({ ...config, basePath: '/notebook' }, output);
    const result = await processor.processImage('images/oriented.jpg', folder);
    assert.equal(result.webp.length, 1);
    assert.equal(result.webp[0].width, 120);
    assert.equal(result.webp[0].height, 80);
    const derivative = await sharp(path.join(output, result.fallback[0].url.replace('/notebook/', ''))).metadata();
    assert.equal(derivative.exif, undefined);
    assert.deepEqual(await readFile(source), before);
    await assert.rejects(processor.processImage('https://example.org/photo.jpg', folder));
  } finally { await rm(folder, { recursive: true, force: true }); }
});
