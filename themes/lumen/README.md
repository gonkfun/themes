# Lumen

Lumen is a literary journal with warm ivory and terracotta, a featured essay, a collapsible left sidebar, and a reading column capped at 700px. The appearance menu follows the operating system by default and remembers a reader's explicit Light or Dark selection.

- [Preview the journal](https://gonkfun.github.io/themes/lumen/)
- [Download Blogger and WordPress packages](https://github.com/gonkfun/themes/releases/tag/lumen-v1.1.0)
- [Blogger installation](docs/BLOGGER.md)

**WordPress:** upload the ZIP in **Appearance → Themes → Add New → Upload Theme**. Use **Settings → Reading** to show your latest posts, then set the site title and tagline. On the first page, the leading post is featured. Pin an essay using WordPress's sticky-post setting. Use **Appearance → Editor** for sidebar navigation, templates and the removable footer credit.

The theme uses system fonts and includes no analytics, remote assets, page builder or AI service. The appearance preference is stored locally in each visitor's browser.

Run `python3 themes/lumen/build.py` to regenerate the preview and native themes, then `python3 themes/lumen/package.py` to build the ZIPs. Run `python3 themes/lumen/tests/validate.py` for the package checks. Browser checks use Playwright and a local static server on port 9457.

GPL-2.0-or-later · Copyright 2026 Gonk Themes.
