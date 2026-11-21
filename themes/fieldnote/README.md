# Fieldnote — Theme 02 by Gonk Themes

An original, free **nature-journal** theme for naturalists, gardeners, birdwatchers, walkers and science writers: anyone who observes the world and writes it down. Warm paper, ink and moss, a book serif, and hand-drawn line artwork.

Designed and built by Claude (Anthropic's AI model) for Gonk Themes, following the same structure and checks as Epoch.

## Open the design

Open `preview/index.html`, or run:

```bash
python3 -m http.server 9447 --bind 127.0.0.1 --directory preview
```

Preview entries and authors are fictional and labelled.

## Install

- **Blogger:** `releases/fieldnote-blogger-1.0.0.zip` contains a self-contained XML theme. See [Blogger installation](docs/BLOGGER.md).
- **WordPress:** upload `releases/fieldnote-wordpress-1.0.0.zip` through Appearance → Themes. See [WordPress installation](docs/WORDPRESS.md).

## What makes it different from Epoch

| | Epoch (Theme 01) | Fieldnote (Theme 02) |
|---|---|---|
| Subject | Solana editorial journal | Nature / field journal |
| Mood | Charcoal + blue, sans-serif magazine | Paper + ink + moss, book serif notebook |
| Homepage | Editorial hero + topic chips | "Today's observation" plate, season strip, field-guide chips |
| Cards | Image-led story cards | Ruled-paper **specimen cards** with observed date, place and weather |
| Articles | Long-form reading column | Reading column with **margin notes** in the gutter (inline on mobile) |
| Reader mode | Dark ↔ paper | Day ↔ dusk |

### Included

- Journal homepage, specimen-card grid, field-kit sidebar, archive, search, about and 404 layouts.
- Margin notes (WordPress block style + pattern; plain `<aside class="fn-margin">` in Blogger posts).
- Season strip computed from the reader's own clock (no request); southern-hemisphere switch.
- Six original line illustrations (fern, sparrow, oak leaf, mushrooms, mountain trail, weather) and a leaf mark.
- WordPress: 7 templates, 3 template parts, 8 patterns, theme.json v3, native comments and pagination.
- Blogger: native posts, labels, search, archive, pagination, comments and editable sidebar widgets.
- System fonts only, no external requests, no tracking, reduced-motion and print styles, 44px tap targets.
- Removable **Powered by gonk.fun** credit with `rel="nofollow"`.

## Build and test

```bash
npm install                       # playwright, for browser checks only
npm run build                     # previews, WordPress theme, Blogger XML
npm test                          # structural, privacy and distribution checks
CHROME_BIN=/usr/bin/google-chrome npm run test:browser   # 390px + 1440px checks and screenshots
npm run package                   # release ZIPs + SHA256SUMS
```

See [TESTING.md](docs/TESTING.md) for what is verified and what is not yet.

## Licence

GPL-2.0-or-later. Design, code and artwork are original to this repository.
