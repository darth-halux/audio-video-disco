import { readFile, readdir, mkdir, rm, writeFile, cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import sourceConfig from '../site.config.mjs';
import { parseContent, validDate } from './content.mjs';
import { templates } from '../src/templates.mjs';
import { imageProcessor } from './images.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const config = { ...sourceConfig, basePath: process.env.SITE_BASE_PATH ?? sourceConfig.basePath, origin: process.env.SITE_ORIGIN ?? sourceConfig.origin };
if (config.basePath && !/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+$/.test(config.basePath)) throw new Error('basePath must be empty or a path like /audio-video-disco, without a trailing slash.');
if (config.origin && (!/^https?:\/\/[^/]+$/.test(config.origin) || new URL(config.origin).origin !== config.origin)) throw new Error('origin must be an http(s) origin, with no trailing slash.');
if (!Number.isInteger(config.homeLimit) || config.homeLimit < 1) throw new Error('homeLimit must be a positive integer.');
if (!config.images.widths.length || config.images.widths.some(w => !Number.isInteger(w) || w < 1)) throw new Error('Image widths must be positive integers.');
const view = templates(config);
const md = new MarkdownIt({ html: true });
const images = imageProcessor(config, output);
const pages = new Map();

function walk(tokens, visit) {
  for (const token of tokens) { visit(token); if (token.children) walk(token.children, visit); }
}

async function render(body, directory) {
  const tokens = md.parse(body, {});
  const imageTokens = [];
  walk(tokens, token => {
    if (token.type === 'image') imageTokens.push(token);
    if ((token.type === 'html_block' || token.type === 'html_inline') && /<(?:img|picture|source)\b/i.test(token.content)) throw new Error('Use Markdown image syntax so images are processed. HTML figure and figcaption wrappers are supported.');
    if (token.type === 'link_open') {
      const href = token.attrGet('href');
      if (href?.startsWith('/') && !href.startsWith('//')) token.attrSet('href', config.basePath + href);
    }
  });
  for (let index = 0; index < imageTokens.length; index++) {
    const token = imageTokens[index];
    const files = await images.processImage(token.attrGet('src'), directory);
    const alt = md.renderer.renderInlineAsText(token.children || [], md.options, {});
    token.meta = { html: images.markup(files, alt, token.attrGet('title'), index === 0) };
  }
  md.renderer.rules.image = (items, index) => items[index].meta.html;
  return md.renderer.render(tokens, md.options, {});
}

function addPage(file, html) {
  if (pages.has(file)) throw new Error(`Duplicate output: ${file}`);
  pages.set(file, html);
}

async function build() {
  const entriesPath = path.join(root, 'content/entries');
  const folders = await readdir(entriesPath, { withFileTypes: true });
  const entries = [];
  for (const folder of folders) {
    if (folder.name.startsWith('.')) continue;
    if (!folder.isDirectory() || !/^\d{4}-\d{2}-\d{2}-\d{2,}$/.test(folder.name) || !validDate(folder.name.slice(0, 10)) || Number(folder.name.slice(11)) < 1) throw new Error(`Invalid entry folder: ${folder.name}. Use YYYY-MM-DD-01.`);
    const directory = path.join(entriesPath, folder.name);
    const file = path.join(directory, 'index.md');
    const entry = parseContent(await readFile(file, 'utf8'), file, true);
    if (entry.date !== folder.name.slice(0, 10)) throw new Error(`${file}: date must match the folder date.`);
    if (!entry.draft) entries.push({ ...entry, id: folder.name, directory });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || Number(b.id.slice(11)) - Number(a.id.slice(11)));
  const aboutPath = path.join(root, 'content/pages');
  const about = parseContent(await readFile(path.join(aboutPath, 'about.md'), 'utf8'), 'about.md');
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'assets'), { recursive: true });
  await cp(path.join(root, 'public'), output, { recursive: true });
  await cp(path.join(root, 'src/css/site.css'), path.join(output, 'assets/site.css'));
  for (const entry of entries) addPage(`entries/${entry.id}/index.html`, view.entry(entry, await render(entry.body, entry.directory)));
  addPage('index.html', view.home(entries));
  addPage('archive/index.html', view.archive(entries));
  addPage('about/index.html', view.about(about, await render(about.body, aboutPath)));
  addPage('404.html', view.notFound());
  // Check local links and assets, including authored HTML, before writing pages.
  for (const [file, html] of pages) {
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const href = match[1].replaceAll('&amp;', '&');
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) continue;
      const resolved = new URL(href, `https://local.invalid${config.basePath}/${file}`);
      let target = decodeURIComponent(resolved.pathname);
      if (config.basePath && !target.startsWith(config.basePath + '/')) throw new Error(`${file}: local link outside basePath: ${href}`);
      target = target.slice(config.basePath.length).replace(/^\//, '');
      if (!target || target.endsWith('/')) target += 'index.html';
      if (!pages.has(target)) {
        try { if (!(await stat(path.join(output, target))).isFile()) throw new Error(); }
        catch { throw new Error(`${file}: missing local target ${href}`); }
      }
    }
  }
  for (const [file, html] of pages) {
    await mkdir(path.dirname(path.join(output, file)), { recursive: true });
    await writeFile(path.join(output, file), html);
  }
  console.log(`Built ${entries.length} entries and ${pages.size} pages in dist/. No browser JavaScript.`);
}

build().catch(error => { console.error(`Build failed: ${error.message}`); process.exitCode = 1; });
