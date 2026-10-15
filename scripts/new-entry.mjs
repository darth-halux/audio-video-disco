import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validDate } from './content.mjs';

const date = process.argv[2] || new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
if (!validDate(date)) { console.error('Use npm run new -- YYYY-MM-DD'); process.exit(1); }
const root = fileURLToPath(new URL('../content/entries/', import.meta.url));
await mkdir(root, { recursive: true });
let directory;
for (let number = 1; ; number++) {
  directory = path.join(root, `${date}-${String(number).padStart(2, '0')}`);
  try { await mkdir(directory); break; }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
}
await mkdir(path.join(directory, 'images'));
await writeFile(path.join(directory, 'index.md'), `---\ndate: "${date}"\ntitle: insert title\npreview: insert preview\ndraft: false\n---\n\nWrite here.\n`);
console.log(`Created ${path.relative(process.cwd(), directory)}/index.md\nRemove draft: true when ready to publish.`);
