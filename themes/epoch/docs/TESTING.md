# Verification and release status

## Completed

- 99 structural/distribution checks: Blogger XML, unique widget/section IDs, native widgets, self-contained artwork, WordPress JSON, seven templates, balanced block delimiters, no private runtime dependencies, colour tokens, explicit navigation spacing and reduced-motion/print rules.
- 17 rendered-page checks passed: five static pages at 390px and 1440px; six WordPress routes at desktop width; WordPress homepage at phone width.
- Static interaction checks passed: reader-mode persistence, mobile menu Escape behaviour, category filtering and empty search results.
- Native WordPress routes exercised: homepage, Security category, article, search, About page and an actual HTTP 404.
- Additional final owner-review checks on WordPress: computed native navigation gap 24px; corrected small tagline; refreshed desktop/mobile screenshots; zero broken images; no phone-width horizontal overflow.
- The WordPress homepage respects Settings → Reading posts-per-page and renders real native post pagination.
- Runtime: official WordPress Playground CLI, WordPress 6.8 branch (resolved 6.8.13), PHP 8.3. All activity is in a disposable local test installation.
- Original CSS, SVG artwork and scripts were visually inspected. Theme assets and fonts do not require third-party hosting.

## Limits

- The owner installed the initial XML on epochblogdemo.blogspot.com. The public homepage was inspected at 1366px and 390px. This exposed a Blogger CDATA script issue and carried-over default gadgets, now corrected and browser-tested against that live rendered HTML. The owner uploaded the corrected XML. Live checks now pass at 1366px and 390px: no JavaScript errors, no overflow, platform gadgets hidden, Gonk credit visible, one canonical, one description, one Twitter card, custom favicon and working reader mode. Post/comment pages remain unverified because the test blog has no published posts.
- No WordPress.org theme directory submission or approval is claimed.
- A full accessibility certification, exhaustive plugin compatibility matrix and translated-language QA have not been performed.
- The static preview is representative HTML; the native WordPress and Blogger outputs use their platform's real posts and widgets.
- No Gonk production code was edited. No financial action, deployment or GitHub publication was performed for this theme.

## Repeat checks

```bash
npm install
npx playwright install chromium
python3 tests/validate.py
python3 -m http.server 9430 --bind 127.0.0.1 --directory preview
```

In a separate terminal, boot a **disposable** WordPress Playground instance on port 9431 with `wordpress/epoch` mounted at `/wordpress/wp-content/themes/epoch`, and apply `tests/blueprint.json`. The fixture deliberately replaces test-site posts; never apply it to production.

Then run:

```bash
npm run test:browser
```

Set `CHROME_BIN` only if using an existing Chromium executable instead of Playwright's installed browser. The browser test expects those two local servers and makes no financial requests. `--wp-only` runs just the WordPress checks.
