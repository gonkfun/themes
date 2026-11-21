# Epoch — Theme 01 by Gonk Themes

An original, free editorial theme for Solana communities. Charcoal and blue, generous spacing, native publishing, no wallet connection or market-data dependencies.

## Open the design

Open `preview/index.html` directly, or run:

```bash
python3 -m http.server 9430 --bind 127.0.0.1 --directory preview
```

Then visit http://127.0.0.1:9430/. Local preview content and authors are fictional and labelled. This preview is a design demonstration, not a live publication.

## Install

- **Blogger:** `releases/epoch-blogger-1.0.0.zip` contains a self-contained XML theme. See [Blogger installation](docs/BLOGGER.md).
- **WordPress:** upload `releases/epoch-wordpress-1.0.0.zip` through Appearance → Themes. See [WordPress installation](docs/WORDPRESS.md).

### Included

- Editorial homepage with topic links and a two-column article grid.
- Responsive reading sidebar, archive and search layouts.
- Long-form typography, tables, code, blockquotes and author metadata.
- WordPress native comments, pagination, page and 404 templates.
- Blogger native comment integration, labels, archive and editable sidebar widgets.
- Local original SVG artwork and system fonts; no external font requests.
- Dark and paper reader modes, keyboard focus, reduced-motion support and print styles.
- Removable **Powered by gonk.fun** credit with `rel="nofollow"`.
- Source, build scripts, screenshot previews and installation/customisation guides.

## Scope

Blogger and WordPress are separate native implementations of one design, not a conversion of a copied theme. This is a publication theme, not a crypto wallet, price feed, trading terminal or investment product. It makes no external API calls. WordPress core or owner-added plugins/widgets may make their own requests.

## Verification

Read [TESTING.md](docs/TESTING.md) for checks and remaining limitations. The owner-installed Blogger homepage passes live desktop/mobile checks. Post and comment behaviour still need a populated test blog; see the verification report for the precise scope.

## Build

Requires Python 3. No runtime frontend dependencies.

```bash
python3 build.py
python3 build-wordpress.py
python3 build-blogger.py
python3 tests/validate.py
python3 package-release.py
```

The WordPress runtime demonstration uses the official WordPress Playground CLI and a disposable fixture. Never run `tests/seed.php` on an existing website: it deletes test-site posts to create a clean demonstration.

## Publishing

GitHub-ready source is included. This theme belongs to the gonkfun/themes collection. Installable ZIPs are distributed through tagged GitHub releases, with a static design preview on GitHub Pages. Publication and live-preview URLs are verified separately from local tests.

## Licence

GPL-2.0-or-later. See [LICENSE](LICENSE). All included code and abstract artwork are original to this project. The credit can be removed; no anti-removal script, hidden link or remote tracking is included. The gonk.fun name is attribution, not permission to impersonate its operator.
