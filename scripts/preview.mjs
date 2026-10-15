import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import config from '../site.config.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const base = process.env.SITE_BASE_PATH ?? config.basePath;
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };
try { await stat(path.join(root, 'index.html')); }
catch { console.error('Run npm run build first.'); process.exit(1); }
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base && pathname === base) { res.writeHead(302, { Location: base + '/' }); return res.end(); }
    if (base && !pathname.startsWith(base + '/')) { res.writeHead(404); return res.end('Not found'); }
    let filename = path.resolve(root, '.' + pathname.slice(base.length));
    if (filename !== root.slice(0, -1) && !filename.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
    const info = await stat(filename);
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(302, { Location: pathname + '/' }); return res.end(); }
      filename = path.join(filename, 'index.html');
    }
    const data = await readFile(filename);
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(path.join(root, '404.html'), 'utf8').catch(() => 'Not found'));
  }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://localhost:${port}${base}/ (Ctrl+C to stop)`));
