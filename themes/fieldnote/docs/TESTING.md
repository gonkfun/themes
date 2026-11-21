# Fieldnote verification

## Verified

- `tests/validate.py`: **125 checks**. Blogger XML parses with unique widget/section IDs and a locked Blog widget; sections hold only widgets; credit removable and nofollow; self-contained artwork; single native SEO include. WordPress theme.json v3; all 7 templates and 3 parts exist with balanced block comments; patterns guard direct access; no eval/shell/base64 or secrets. CSS tokens, dusk mode, reduced motion, print styles, 44px targets, no CDN or font requests. JS makes no network calls. SVGs contain no scripts or links. Every preview page has exactly one H1.
- `tests/browser.mjs` (Chrome, 390px and 1440px): all 5 preview pages return 200 and have one H1, no horizontal overflow and no broken images; no JavaScript errors; the dusk toggle persists across reload; the season label renders; the mobile menu opens and closes with Escape; search shows the empty state; topic filtering shows the right card. Screenshots are written to `preview/`.

## Not yet verified

- A live **Blogger** install (homepage, post pages, comments, label pages).
- A live **WordPress** install (Site Editor, pattern insertion, the margin-note block style, comments). The PHP files were not linted locally (no PHP runtime on the build machine); CI runs `php -l`.
- WordPress.org theme-directory review.
