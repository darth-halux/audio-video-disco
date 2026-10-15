import { parseDocument } from 'yaml';

export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function parseContent(source, file, entry = false) {
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${file}: expected YAML frontmatter between --- lines.`);
  const doc = parseDocument(match[1]);
  if (doc.errors.length) throw new Error(`${file}: ${doc.errors[0].message}`);
  const data = doc.toJS();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${file}: frontmatter must be a mapping.`);
  const allowed = new Set(entry ? ['date', 'title', 'preview', 'draft'] : ['title']);
  for (const key of Object.keys(data)) if (!allowed.has(key)) throw new Error(`${file}: unknown field '${key}'.`);
  for (const key of ['title', 'preview']) {
    if (data[key] !== undefined && typeof data[key] !== 'string') throw new Error(`${file}: ${key} must be text.`);
  }
  if (entry && !validDate(data.date)) throw new Error(`${file}: date must be a valid YYYY-MM-DD string.`);
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new Error(`${file}: draft must be true or false.`);
  return { ...data, body: match[2], draft: data.draft ?? false };
}
