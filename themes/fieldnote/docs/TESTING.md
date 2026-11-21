# Fieldnote verification

## Verified

- `tests/validate.py`: **125 checks**. Blogger XML parses with unique widget/section IDs and a locked Blog widget; sections hold only widgets; credit removable and nofollow; self-contained artwork; single native SEO include. WordPress theme.json v3; all 7 templates and 3 parts exist with balanced block comments; patterns guard direct access; no eval/shell/base64 or secrets. CSS tokens, dusk mode, reduced motion, print styles, 44px targets, no CDN or font requests. JS makes no network calls. SVGs contain no scripts or links. Every preview page has exactly one H1.
- `tests/browser.mjs` (Chrome, 390px and 1440px): all 5 preview pages return 200 and have one H1, no horizontal overflow and no broken images; no JavaScript errors; the dusk toggle persists across reload; the season label renders; the mobile menu opens and closes with Escape; search shows the empty state; topic filtering shows the right card. Screenshots are written to `preview/`.

- Native **WordPress 6.8 / PHP 8.3 Playground**, 390px and 1440px: activated Fieldnote; six categories and six posts with featured images; homepage cards, single post, search, category archive, comments display/form and 404 passed. Pagination honors Reading settings. Both registered Margin note pattern and Group style render, as does Observation details line. Dusk persists and changes body colours. Mobile navigation opens and closes. Reproducible fixture: `tests/blueprint.json`; assertions: `tests/wordpress.mjs`; results: `tests/wordpress-results.json`.
- Review fixes: restored native WordPress navigation on mobile; kept gutter notes inline until 1360px to avoid intermediate-width overflow. Epoch files and its catalogue entry remain unchanged.

## Not yet verified

- A live **Blogger** import and labelled-image posts, homepage, post page, comments, label pages, search, sidebar gadgets and HTML margin note. Browser account access is unavailable in this session; XML structural checks do not prove import compatibility.
- WordPress browser upload wizard and visual Site Editor insertion/editing. Playground activated the unpacked theme; pattern registration/rendering was tested programmatically. Actual comment submission/email delivery was not tested. CI runs `php -l`; native PHP executed the theme in Playground.
- WordPress.org theme-directory review.
