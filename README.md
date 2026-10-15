# audio video disco

A small, handwritten static website for entries of any length. Markdown is the source; the build writes plain HTML, CSS, and responsive images. Visitors download no JavaScript, fonts, or third-party resources.

**This is an unpublished starter. The three entries and About text are demonstration writing, not the owner's writing. Replace or delete them before publishing.**

## Start locally

Install Node.js 22 or newer (an active LTS release is preferable). Node is needed to build the website, not to read it.

In a terminal, open this folder and run:

```sh
npm ci
npm run build
npm run preview
```

Open `http://localhost:4173`. Stop the preview with Ctrl+C. After editing, run `npm run build` again and refresh the browser. The preview server can stay running. There is deliberately no watcher or bundler.

## Write an entry

Create the next folder for today's date (Europe/London):

```sh
npm run new
```

Or choose a date:

```sh
npm run new -- 2026-10-07
```

This creates `content/entries/2026-10-07-01/index.md` and an `images/` folder. A second entry gets `-02`. Folder names are permanent addresses: avoid renaming a published folder. The date in the file must match the folder date. Within a day the highest number appears first.

Open `index.md` in a text editor:

```markdown
---
date: "2026-10-07"
title: "An optional title"
preview: "An optional sentence for the home page."
draft: true
---

Your writing starts here.

A new paragraph starts after a blank line.
```

The area between `---` lines is YAML frontmatter: small pieces of information about the entry. Only `date` is required. Remove `title` for an untitled entry. `preview` is optional and is never generated automatically. Remove `draft: true`, or set it to `false`, when ready to include the entry in the build.

Drafts are excluded from all generated pages and their images are not copied. They are **not private if committed to a public repository**. Future dates are not scheduling: a non-draft entry is included whenever you build.

Home shows the 12 latest published entries. A titled entry can show a preview underneath. For an untitled entry, the preview is the link text; without either, its date is the link. Archive includes all entries. Every entry has a separate page at `/entries/YYYY-MM-DD-NN/`.

## A little Markdown

```markdown
*Emphasis* and **strong emphasis**.

[A link](https://example.org)

## A section heading

> A quotation.

- A list item
- Another item

![Describe what is visible](images/window.jpg)
```

Use blank lines between paragraphs. For a titled entry, the title comes from frontmatter; start subsections at `##`. Links to other site pages should start at the site root, for example `[Another entry](/entries/2026-10-06-01/)`. The build adds the configured hosting base path. External links stay unchanged.

## Photographs and captions

Put a good-quality source export in the entry's `images/` folder. JPEG, PNG, still WebP, and still AVIF are supported. Use JPEG for photographs or PNG for transparency and graphics. Keep camera RAW files and archival masters elsewhere; Git is not a photographic backup service.

Use Markdown images as shown above. Alt text describes the picture for people who cannot see it. For a caption, an ordinary paragraph underneath is fine. For a semantically associated caption, use this exact pattern with blank lines:

```markdown
<figure>

![Late afternoon light across a white wall](images/window.jpg)

<figcaption>The room, just before sunset.</figcaption>
</figure>
```

Author-written HTML is permitted, but raw `img`, `picture`, and `source` tags are rejected so every image passes through optimisation. Use Markdown for image placement, including inside figure wrappers. This generator trusts the repository's author; it is not a service for rendering untrusted submissions.

The build generates widths up to 640, 1280, and 1920 pixels without enlargement or cropping. It corrects camera orientation, converts to sRGB, and emits WebP plus JPEG/PNG fallbacks with responsive dimensions. PNG fallback is lossless. EXIF/GPS data is omitted from generated images; source files are unchanged and remain visible if the repository is public. Only referenced images in published content are generated. Originals and Markdown are not copied to the website.

The first image on a page loads normally; later images load lazily. Quality starts at WebP 88 / JPEG 90; compare real photographs before adjusting these values in `site.config.mjs`. There are no galleries, thumbnails, or lightboxes in V1.

For an About-page image use `content/pages/images/` and the same syntax. No images are shipped in this starter because no personal photographs have been supplied.

## Where things live

| Path | Purpose |
| --- | --- |
| `content/entries/` | One dated folder per entry, containing Markdown and local images |
| `content/pages/about.md` | About text |
| `src/templates.mjs` | The page markup |
| `src/css/site.css` | Typography, layout, and light/dark terminal colours |
| `scripts/build.mjs` | Reads, validates, and generates pages |
| `scripts/content.mjs` | Frontmatter validation |
| `scripts/images.mjs` | Responsive image generation |
| `scripts/new-entry.mjs` | Creates the next dated entry folder |
| `scripts/preview.mjs` | Local-only HTTP preview |
| `site.config.mjs` | Name, URL, number of recent entries, image settings |
| `public/` | Files copied unchanged to the output |
| `dist/` | Generated website; never edit this directly |
| `test/` | Focused checks for content and image handling |

The terminal appearance follows the reader's light/dark preference. No animations, external fonts, analytics, comments, categories, or newsletter are included.

## Build checks

```sh
npm test
npm run build
```

The build rejects invalid dates, unfamiliar frontmatter fields, invalid folder names, missing images, and missing local link targets. It does not check whether external websites are reachable or whether a link's `#fragment` exists. The build recreates `dist/`; after a failure, fix the source and rebuild before viewing or publishing.

## GitHub and hosting: next phase

No GitHub repository, automation, domain, or deployment has been created. Once ready, commit the source and `package-lock.json`. Keep `node_modules/` and `dist/` out of Git; `.gitignore` already does this.

The intended automated workflow is `npm ci`, `npm test`, `npm run build`, then uploading **only `dist/`** to GitHub Pages. We will add and enable the deployment workflow after choosing the repository and replacing the sample writing.

For a GitHub project URL such as `https://USERNAME.github.io/audio-video-disco/`, set:

```js
origin: 'https://USERNAME.github.io',
basePath: '/audio-video-disco',
```

For a custom domain or a site hosted at a domain root, use its origin and `basePath: ''`. Rebuild after changing these. `SITE_ORIGIN` and `SITE_BASE_PATH` environment variables can override the settings in automation. Keep the same base path for build and preview.

The files in `dist/` can also be served by another static host. No server runtime, database, or vendor SDK is involved.
