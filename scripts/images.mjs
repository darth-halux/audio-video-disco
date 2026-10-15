import sharp from 'sharp';
import { readFile, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { escape } from '../src/templates.mjs';

export function imageProcessor(config, output) {
  const cache = new Map();
  async function processImage(src, directory) {
    if (!src.startsWith('images/') || /[?#]/.test(src)) throw new Error(`Image '${src}': use a local images/filename.jpg path.`);
    const imageRoot = await realpath(path.join(directory, 'images'));
    const input = await realpath(path.resolve(directory, decodeURIComponent(src)));
    if (!input.startsWith(imageRoot + path.sep)) throw new Error(`Image escapes its images folder: ${src}`);
    if (cache.has(input)) return cache.get(input);
    const bytes = await readFile(input);
    const metadata = await sharp(bytes).metadata();
    if (!['jpeg', 'png', 'webp', 'avif'].includes(metadata.format) || (metadata.pages || 1) > 1) {
      throw new Error(`${src}: use a still JPEG, PNG, WebP, or AVIF image.`);
    }
    const sourceWidth = [5, 6, 7, 8].includes(metadata.orientation) ? metadata.height : metadata.width;
    const widths = [...new Set(config.images.widths.map(width => Math.min(width, sourceWidth)))].sort((a, b) => a - b);
    const id = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
    const folder = path.join(output, 'images');
    await mkdir(folder, { recursive: true });
    const fallback = metadata.format === 'png' || metadata.hasAlpha ? 'png' : 'jpeg';
    const files = { webp: [], fallback: [] };
    for (const width of widths) {
      for (const format of ['webp', fallback]) {
        const name = `${id}-${width}.${format === 'jpeg' ? 'jpg' : format}`;
        let pipeline = sharp(bytes).rotate().resize({ width, withoutEnlargement: true }).withIccProfile('srgb');
        pipeline = format === 'webp' ? pipeline.webp({ quality: config.images.webpQuality })
          : format === 'jpeg' ? pipeline.jpeg({ quality: config.images.jpegQuality, mozjpeg: true })
          : pipeline.png({ compressionLevel: 9 });
        const info = await pipeline.toFile(path.join(folder, name));
        files[format === 'webp' ? 'webp' : 'fallback'].push({ url: `${config.basePath}/images/${name}`, width: info.width, height: info.height });
      }
    }
    cache.set(input, files);
    return files;
  }
  return {
    processImage,
    markup(files, alt, title, first) {
      const largest = files.fallback.at(-1);
      const srcset = list => list.map(file => `${file.url} ${file.width}w`).join(', ');
      const sizes = '(max-width: 480px) calc(100vw - 40px), (max-width: 704px) calc(100vw - 64px), 640px';
      return `<picture><source type="image/webp" srcset="${escape(srcset(files.webp))}" sizes="${sizes}"><img src="${escape(largest.url)}" srcset="${escape(srcset(files.fallback))}" sizes="${sizes}" width="${largest.width}" height="${largest.height}" alt="${escape(alt)}"${title ? ` title="${escape(title)}"` : ''} loading="${first ? 'eager' : 'lazy'}" decoding="async"></picture>`;
    }
  };
}
