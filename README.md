# audio video disco

## Write an entry

Create the next folder for today's date:

```sh
npm run new
```

Or choose a date:

```sh
npm run new -- 2026-10-07
```
Open `index.md` in a text editor:

```markdown
---
date: "2026-10-07"
title: "An optional title"
preview: "An optional sentence for the home page."
draft: true
---

## A little Markdown

A new paragraph starts after a blank line.
```

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

Put a good-quality source export in the entry's `images/` folder. JPEG, PNG, still WebP, and still AVIF are supported.

Use Markdown images as shown above. Alt text describes the picture for people who cannot see it. For a caption, an ordinary paragraph underneath is fine. For a semantically associated caption, use this exact pattern with blank lines:

```markdown
<figure>

![Late afternoon light across a white wall](images/window.jpg)

<figcaption>The room, just before sunset.</figcaption>
</figure>
```

For an About-page image use `content/pages/images/` and the same syntax. 

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

## Build checks

```sh
npm test
npm run build
npm run preview