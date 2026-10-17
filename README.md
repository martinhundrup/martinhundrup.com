# martinhundrup.com

Martin’s personal landing page: games, tools, websites, and a little about the person behind them. Static HTML, CSS, and JavaScript with no package dependencies.

## Work locally

With Node.js 22 or newer, run `npm run dev`. On this Windows workspace, run `.\start.cmd`; it finds the existing portable Node runtime used for Bonsai without changing the machine’s PowerShell policy. Open **http://localhost:3001**. Refresh after editing files.

`npm run build` copies public files to `dist/`; `npm run preview` serves that build. This repository has no deployment configured yet; this work is local only.

## Edit the site

- `index.html`: intro, about, background links, contact, and metadata.
- `projects.js`: project collection. Add an object with a title, description, category (`games`, `tools`, or `websites`), image, and URL. Counts and filters update automatically.
- `styles.css`: responsive design and reduced-motion support.
- `app.js`: filtering, expanding the collection, and Shroomie’s hop.
- `assets/`: local images, real homepage previews of Sporelite Games and WSU Game Dev, video thumbnails, and a Bonsai SVG illustration. The Bonsai image is an editorial illustration rather than a screenshot.
- `CONTENT-SOURCES.md`: public sources and details awaiting confirmation.

Use full `https://` URLs for itch.io and other sites, or `/project-name/` for a project on this domain. External project links open a new tab; projects on this domain open in the same tab.

## Bonsai and future deployment

Bonsai lives in the adjacent `../Bonsai` repository and is independently hosted at **https://martinhundrup.com/bonsai/**. This page links to `/bonsai/`; the local preview redirects that path to the live app.

When deploying this site to the root, preserve Bonsai’s Cloudflare Worker routes (`martinhundrup.com/bonsai` and `martinhundrup.com/bonsai/*`). Other project paths can be added independently. No DNS, hosting, or production routes have been changed.
