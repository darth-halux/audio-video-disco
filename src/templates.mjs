export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function templates(config) {
  const url = path => `${config.basePath}${path}`;
  const entryUrl = entry => url(`/entries/${entry.id}/`);
  const label = entry => entry.title || entry.preview || entry.date;
  const time = entry => `<time datetime="${entry.date}">${entry.date}</time>`;
  const badges = (entry, withLabel = false) => entry.tags?.length
    ? `<div class="tags" aria-label="Tags">${withLabel ? '<span class="tags-label">tags:</span>' : ''}${entry.tags.map(tag => `<a class="tag" href="${url('/archive/')}?tag=${escape(encodeURIComponent(tag))}">${escape(tag)}</a>`).join('')}</div>` : '';
  function page({ title, route, active = '', content, description = config.description, archiveScript = false }) {
    const canonical = config.origin ? `<link rel="canonical" href="${escape(config.origin + url(route))}">` : '';
    return `<!doctype html>
<html lang="${escape(config.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escape(title ? `${title} · ${config.name}` : config.name)}</title>
  <meta name="description" content="${escape(description)}">
  ${canonical}
  <link rel="icon" href="${url('/favicon.svg')}" type="image/svg+xml">
  <link rel="stylesheet" href="${url('/assets/site.css')}">
  ${archiveScript ? `<script src="${url('/assets/archive.js')}" defer></script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="sheet">
    <header class="site-header">
      <a class="site-name" href="${url('/')}" aria-label="${escape(config.name)}, home">${escape(config.name)}</a>
      <nav aria-label="Main navigation">${[['home', '/'], ['archive', '/archive/'], ['about', '/about/']].map(([name, path]) => `<a href="${url(path)}"${active === name ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav>
    </header>
    <main id="main">${content}</main>
  </div>
</body>
</html>
`;
  }
  return {
    page,
    home(entries) {
      const recent = entries.slice(0, config.homeLimit);
      return page({ route: '/', active: 'home', content: `<h1 class="visually-hidden">Recent entries</h1>
${recent.length ? `<ol class="entries">${recent.map(entry => `<li><article><a class="entry-link" href="${entryUrl(entry)}">${time(entry)}<span class="entry-title">${escape(label(entry))}</span>${entry.title && entry.preview ? `<span class="preview">${escape(entry.preview)}</span>` : ''}</a>${badges(entry)}</article></li>`).join('\n')}</ol>` : '<p>No entries yet.</p>'}
${entries.length > recent.length ? `<a class="back" href="${url('/archive/')}">All entries</a>` : ''}` });
    },
    archive(entries) {
      const tags = [...new Set(entries.flatMap(entry => entry.tags || []))].sort();
      return page({ title: 'Archive', route: '/archive/', active: 'archive', archiveScript: true, content: `<h1>Archive</h1>
<div id="archive-filter" class="archive-filter" hidden><label for="tag-filter">Show:</label><select id="tag-filter"><option value="">All entries</option><option value="untagged">Untagged</option>${tags.map(tag => `<option value="${escape('tag:' + tag)}">${escape(tag)}</option>`).join('')}</select></div>
<p id="archive-status" class="archive-status" role="status" hidden></p>
<noscript><p class="archive-status">Tag filtering needs JavaScript. All entries are shown below.</p></noscript>
<ol class="archive">${entries.map(entry => `<li data-tags="${escape(JSON.stringify(entry.tags || []))}"><a class="archive-entry-link" href="${entryUrl(entry)}">${time(entry)}<span>${escape(label(entry))}</span>${entry.title && entry.preview ? `<span class="archive-preview">${escape(entry.preview)}</span>` : ''}</a>${badges(entry)}</li>`).join('\n')}</ol>${entries.length ? '' : '<p id="archive-empty">No entries yet.</p>'}` });
    },
    entry(entry, html) {
      return page({ title: entry.title || entry.date, route: `/entries/${entry.id}/`, description: entry.preview || config.description, content: `<article class="reading" aria-label="${escape(entry.title || `Entry from ${entry.date}`)}">${time(entry)}${badges(entry, true)}${entry.title ? `<h1>${escape(entry.title)}</h1>` : ''}${html}</article><a class="back" href="${url('/')}">Back to entries</a>` });
    },
    about(data, html) {
      return page({ title: data.title || 'About', route: '/about/', active: 'about', content: `<article class="reading"><h1>${escape(data.title || 'About')}</h1>${html}</article>` });
    },
    notFound() {
      return page({ title: 'Page not found', route: '/404.html', content: `<h1>Page not found</h1><p>This address does not lead to an entry.</p><a href="${url('/')}">Back to entries</a>` });
    }
  };
}
