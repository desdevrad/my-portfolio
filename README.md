# Portfolio site

A static site that builds its own index. You never edit `index.html` to add
work — you add files, push, and the site updates itself.

---

## One-time setup

1. Push this folder to a GitHub repository, on a branch called `main`.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.

That's it. The first deploy starts on your next push. The site address appears
under **Settings → Pages** and in the Actions run summary.

---

## Adding things

Everything below is picked up automatically on the next push.

### A new project

Create a folder inside any category under `projects/`:

```
projects/02-posters/night-index/
├── index.md          ← text and details
├── cover.jpg         ← the thumbnail
├── 01.jpg            ← gallery images, shown in order
├── 02.jpg
└── 10.jpg
```

`index.md` looks like this. Every field is optional except `title`:

```markdown
---
title: Night Index
client: Some Organisation
year: 2026
role: Editorial
cover: cover.jpg
link: https://example.com/the-project
tag: PRINT / EDITORIAL / 2026
label_overview: OVERVIEW
label_contribution: CONTRIBUTION
clients:
- Some Organisation
- A Second Partner
roles:
- Art Direction
- Print
---

## Overview
What the project was. You can use [links](https://example.com), **bold**
and *italic* here.

## Contribution
What you did on it.

## Credit
Anyone else who should be named.
```

Notes:

- **Projects sort themselves.** Inside a category, newest `year` comes first;
  a project with no year sinks to the bottom. Same year (or both undated)
  breaks the tie alphabetically by `title`. Nothing to renumber — add a
  project and it slots in on its own.
- **`cover`** is optional. If you leave it out, the generator looks for a file
  called `cover.*`, then falls back to the first image in the folder.
- **Gallery** is every remaining image in the folder, sorted naturally, so
  `02.jpg` comes before `10.jpg`. Tapping the cover or any gallery image opens
  it full-screen, where arrow keys, the on-screen arrows or a swipe move
  through the rest of the folder.
- **`link`** adds the **WATCH** button over the cover. Leave it out and no
  button appears — only give it to projects that point somewhere.
- **Video** (`.mp4`, `.webm`, `.mov`) is used as the cover when the folder has
  no images, and plays inline on the project page.
- A folder with **no `index.md` at all** still works — the title comes from the
  folder name and the first image becomes the cover.
- Empty sections are skipped, so a sparse project won't render blank headings.

### A new category

Add a numbered folder under `projects/`. The number sets the order in the ring
and is stripped from the label:

```
projects/06-photography/
└── category.md
```

```markdown
---
key: PHOTOGRAPHY
sub: LIGHT & LENS
kind: 2
---
```

`kind` (0–4) picks which procedural artwork is drawn for projects that have no
image yet: `0` logos, `1` posters, `2` 3D, `3` XR, `4` motion.

A category stays hidden until it contains at least one project. To show empty
ones anyway, set `"show_empty_categories": true` in `site.config.json`.

### A new client logo

Drop an image into `clients/`. The filename becomes the label, so
`clients/Some-Company.png` shows as **SOME COMPANY**. Transparent PNG or SVG
works best; logos render monochrome and reveal their real colour on hover.

The **Engagements** list under Clients is built from your projects, so it stays
in step on its own.

### A new CV

Replace `about/cv.pdf`. The About page links it with its size and the date it
last changed, and the link carries a content hash so visitors get the new file
immediately instead of a cached copy.

### Your bio and contact details

- `about/about.md` — headline and biography paragraphs.
- `about/me.jpg` — portrait. Any image named `me`, `portrait` or `profile` works.
- `site.config.json` — name, email, social links, and the details shown on the
  Contact page.

### Your email address

It's stored in three pieces so it never appears as a complete address in any
file the browser downloads:

```json
"email": { "user": "k.farahmandrad", "domain": "gmail", "tld": "com" }
```

`index.html` reassembles it at load time and only builds the `mailto:` link
when someone actually clicks. Scrapers that grep the page source for an
address pattern find nothing. A determined bot running a real browser could
still read it — nothing short of an image or a contact form stops that — but
this defeats the overwhelming majority of harvesters.

Writing `"email": "you@example.com"` as a plain string still works; the
generator will split it for you and print a warning.

---

## How it works

`tools/build-content.mjs` walks the repository and writes `content.json`.
`index.html` fetches that file on load and builds the project ring, the panels
and the About / Clients / Contact pages from it.

`.github/workflows/deploy.yml` runs the generator on every push to `main` and
publishes the result to GitHub Pages. Because the manifest is rebuilt during
deployment, `content.json` is always in step with the files in the repo — no
build step to remember and nothing to commit by hand.

The generator uses only Node's standard library, so there are no dependencies
to install and nothing to keep up to date.

---

## Working locally

```bash
node tools/build-content.mjs   # rescan after changing files
npx serve                      # then open the address it prints
```

Serve the folder over HTTP rather than opening `index.html` directly —
browsers block `fetch` on `file://` URLs, so the site will report that the
index could not be loaded.

Run the generator whenever you add or rename files; it prints what it found:

```
content.json written
  3 categories, 3 projects, 1 client logos
  cv: about/cv.pdf (updated 2026-08-14)
  LOGOS      latentspace
  XR         appear
  MOTION     rushin
```

---

## Troubleshooting

**A project has an unwanted WATCH button.** It has a `link:` line in its front
matter. Remove it.

**A project didn't appear.** Check the generator output above — if the folder
isn't listed, it's probably nested at the wrong depth. Projects go two levels
down: `projects/<category>/<project>/`.

**The deploy succeeded but the page is stale.** Hard-refresh. `content.json` is
fetched with revalidation, but the browser may still be holding the old HTML.

**Actions fails with a permissions error.** The Pages source is still set to
*Deploy from a branch*. Change it to *GitHub Actions* under Settings → Pages.

**The build fails with "No projects found".** That guard stops an empty site
from overwriting a working one — usually it means `projects/` was moved or the
folder depth is wrong.
