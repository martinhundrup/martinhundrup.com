# martinhundrup.com

Martin’s personal landing page: games, tools, websites, and a little about the person behind them. Static HTML, CSS, and JavaScript with no package installation required.

## Work locally

With Node.js 22 or newer, run `npm run dev`. On this Windows workspace, run `.\start.cmd`; it finds the existing portable Node runtime used for Bonsai without changing the machine’s PowerShell policy. Open **http://localhost:3001**. Refresh after editing files.

`npm run build` copies public files to `dist/`; `npm run preview` serves that build. The live site is **https://martinhundrup.com/**, deployed as Cloudflare’s `martin-hundrup` assets-only Worker.

`npm test` runs the physics regression checks (collisions, momentum, rotation, bounds, and fast throws).

## Edit the site

- `index.html`: intro, about, background links, contact, and metadata.
- `projects.js`: project collection. Add an object with a title, description, category (`games`, `tools`, or `websites`), image, and URL. Counts and filters update automatically.
- `styles.css`: responsive design and reduced-motion support.
- `app.js`: project filtering and carousel/playground initialization.
- `carousel.js`: native scrolling, arrow/key navigation, cycling controls, and motion preferences.
- `playground.js`: pointer/touch dragging and throwing, keyboard input, pause/reset, responsive sizing, and animation lifecycle.
- `physics.js`: fixed-step zero-gravity motion with rotating-body collisions and wall bounces. No physics library is required.
- `gif-player.js`: GIF frame compositing driven by the same clock as the chamber. The small bundled `gifuct-js` decoder and its parser are in `assets/vendor/`, with their MIT licenses.
- `assets/`: local images, real homepage previews of Sporelite Games and WSU Game Dev, video thumbnails, article photos, a figure from the Medimon paper, and a Bonsai SVG illustration. The Bonsai image is an editorial illustration rather than a screenshot.
- `CONTENT-SOURCES.md`: public sources and details awaiting confirmation.

Use full `https://` URLs for itch.io and other sites, or `/project-name/` for a project on this domain. External project links open a new tab; projects on this domain open in the same tab.

The project carousel includes every matching project immediately, with no expand step. The appearances carousel includes both videos and all four articles/research links. Both show three cards on desktop, two on tablets, and one on phones, with swipe/trackpad scrolling and previous/next buttons. Arrow keys and Home/End work when focused in a track.

Projects cycle every five seconds; appearances every six. Cycling pauses during hover, focus, and dragging, while offscreen, or in a hidden browser tab. Each carousel has its own pause/resume control. Reduced-motion preferences start automatic cycling paused and use instant navigation.

## Shroomie’s playground

Grab Shroomie, a label, the idea note, or a star and throw it around the panel. Objects drift, spin, bounce off the sides, and knock into one another. With an object focused, arrow keys move it and Space or Enter gives it a nudge. Pause freezes motion while still allowing manual dragging; Reset restores the starting arrangement.

Pause also freezes Shroomie’s animation and uploaded GIFs. Play continues their frame clocks from where they stopped; GIFs added while paused start frozen. Large or unusual GIFs that exceed the decoder’s resource budget use a static preview while paused and native animation while playing. GIFs also sleep with the chamber when offscreen or in a hidden tab.

Click **0 G / 1 G** to switch gravity off/on. The upload icon adds images from your device as draggable objects (up to eight, 12 MB each); image files stay in your browser and are not uploaded to a server. Double-click an added image or focus it and press Delete to remove it. Reset clears added images and releases their object URLs.

The fullscreen icon expands the playground using the browser’s fullscreen mode, with an expanded overlay when fullscreen is unavailable. Use the icon again or press Escape to exit. The same physics, gravity, uploads, and controls work in either view.

Reduced-motion preferences start the scene paused and replace the animated sprite with a still image. Play can explicitly resume the physics. The simulation sleeps while offscreen or while the browser tab is hidden, and resizes to fit the panel.

## Cloudflare deployment and Bonsai

Bonsai lives in the adjacent `../Bonsai` repository and is independently hosted at **https://martinhundrup.com/bonsai/**. This page links to `/bonsai/`; the local preview redirects that path to the live app.

`cloudflare.config.ts` defines the landing page’s `martin-hundrup` Worker and `martinhundrup.com/*` route. Bonsai’s existing `martinhundrup.com/bonsai` and `martinhundrup.com/bonsai/*` routes are more specific, so they continue to go to `bonsai-json`. Additional projects can use their own more specific routes. The existing DNS record was preserved.

Use Node.js 22.18 or newer and a Cloudflare login with Workers deployment and route permissions:

```sh
npx cf@1.0.0-beta.18 auth login
npm run cf:check
npm run deploy
```

The pinned Cloudflare CLI uses `deploy --prebuilt`. `scripts/prepare-cloudflare.mjs` packages the static build in `.cloudflare/output/v0/`, including account settings, route configuration, and assets. This avoids framework scaffolding or a new runtime server. `cf:check` performs a dry run without publishing; `deploy` publishes the same prepared output. Generated output is ignored by Git. No credentials belong in this repository.

First production deployment: October 16, 2026, version `cbfd8651-4f1d-4693-a921-b81e2373bba6`. All 31 public files were checked against the live deployment. Desktop/mobile rendering, carousels, GIF pause, image uploads, gravity, article previews, and Bonsai were verified live. Bonsai’s HTML and routes were unchanged.
