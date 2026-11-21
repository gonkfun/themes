"""Build four original WordPress block themes and their static previews."""
import json
import re
from html import escape
from pathlib import Path
from shutil import copyfile

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
THEMES = json.loads((SCRIPTS / "wordpress-collection.json").read_text())
BASE_CSS = (SCRIPTS / "wordpress-collection.css").read_text()
LAYOUTS = dict(re.findall(r"/\* (\w+) \*/\n(.*?)(?=/\* \w+ \*/|\Z)",
                          (SCRIPTS / "wordpress-collection-layouts.css").read_text(), re.S))
CREDIT = 'Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a>'
VERSION = "1.0.0"


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def block(name, attrs=None, content=None):
    options = " " + json.dumps(attrs, ensure_ascii=False, separators=(",", ":")) if attrs else ""
    if content is None:
        return f"<!-- wp:{name}{options} /-->\n"
    return f"<!-- wp:{name}{options} -->\n{content}\n<!-- /wp:{name} -->\n"


def group(content, classes="", tag="div", anchor=None):
    attrs = {"layout": {"type": "default"}}
    if classes:
        attrs["className"] = classes
    if tag != "div":
        attrs["tagName"] = tag
    if anchor:
        attrs["anchor"] = anchor
    identifier = f' id="{anchor}"' if anchor else ""
    suffix = " " + classes if classes else ""
    return block("group", attrs, f'<{tag}{identifier} class="wp-block-group{suffix}">{content}</{tag}>')


def heading(text, level, css=""):
    attrs = {"level": level} if level != 2 else {}
    if css:
        attrs["className"] = css
    classes = f"wp-block-heading {css}".rstrip()
    return block("heading", attrs, f'<h{level} class="{classes}">{escape(text)}</h{level}>')


def para(text, css=""):
    attrs = {"className": css} if css else None
    classes = f' class="{css}"' if css else ""
    return block("paragraph", attrs, f'<p{classes}>{escape(text)}</p>')


def art():
    return block("html", content='<div class="gc-art" aria-hidden="true"></div>')


def hero(theme):
    label = para(theme["label"], "gc-label")
    title = heading(theme["headline"], 1)
    intro = para(theme["intro"], "gc-intro")
    cta = block("button", {"className": "gc-action"},
                f'<div class="wp-block-button gc-action"><a class="wp-block-button__link wp-element-button" href="#overview">{escape(theme["action"])}</a></div>')
    return group(group(label + title + intro + block("buttons", content='<div class="wp-block-buttons">' + cta + '</div>'), "gc-copy") + art(), "gc-hero gc-wrap")


def section(theme):
    cards = [group(art() + para(label, "gc-label") + heading(title, 3) + para(body), "gc-card")
             for label, title, body in theme["entries"]]
    return group(heading(theme["section"], 2, "gc-section-title") + group("".join(cards), "gc-deck"),
                 "gc-wrap gc-content", "section", "overview")


def pattern(slug, key, title, content):
    return (f"<?php\n/**\n * Title: {title}\n * Slug: {slug}/{key}\n * Categories: {slug}\n */\n"
            f"if ( ! defined( 'ABSPATH' ) ) {{ exit; }}\n?>\n" + content)


def query():
    item = (block("post-featured-image", {"isLink": True}) + block("post-title", {"level": 3, "isLink": True})
            + block("post-date") + block("post-excerpt", {"excerptLength": 24}))
    pages = block("query-pagination", {"className": "gc-paging"},
                  block("query-pagination-previous") + block("query-pagination-numbers") + block("query-pagination-next"))
    empty = block("query-no-results", content=para("There are no matching entries."))
    return block("query", {"queryId": 0, "query": {"inherit": True}},
                 '<div class="wp-block-query">' + block("post-template", content=item) + pages + empty + "</div>")


def build_wp(theme, target, css):
    slug = theme["id"]
    name = theme["name"]
    write(target / "style.css", f"""/*
Theme Name: {name}
Theme URI: https://gonkfun.github.io/themes/{slug}/
Author: Gonk Themes
Author URI: https://gonk.fun/
Description: {theme["description"]}
Version: {VERSION}
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: {slug}
Tags: block-patterns, full-site-editing, featured-images, threaded-comments, blog
*/
""")
    write(target / "assets" / "theme.css", css)
    write(target / "functions.php", f"""<?php
/**
 * Front-end styles and editor patterns.
 *
 * @package {slug}
 */
if ( ! defined( 'ABSPATH' ) ) {{
    exit;
}}

function {slug}_setup() {{
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/theme.css' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}}
add_action( 'after_setup_theme', '{slug}_setup' );

function {slug}_assets() {{
    wp_enqueue_style( '{slug}-layout', get_theme_file_uri( 'assets/theme.css' ), array(), wp_get_theme()->get( 'Version' ) );
}}
add_action( 'wp_enqueue_scripts', '{slug}_assets' );

function {slug}_pattern_category() {{
    register_block_pattern_category( '{slug}', array( 'label' => __( '{name}', '{slug}' ) ) );
}}
add_action( 'init', '{slug}_pattern_category' );
""")
    settings = {
        "version": 3,
        "settings": {"appearanceTools": True, "layout": {"contentSize": "760px", "wideSize": "1152px"},
                     "color": {"palette": [{"slug": key, "name": key.title(), "color": color}
                                            for key, color in zip(("paper", "panel", "ink", "muted", "accent", "line", "on-accent"), theme["colors"])]}},
        "styles": {"color": {"background": "var:preset|color|paper", "text": "var:preset|color|ink"},
                   "spacing": {"blockGap": "0"},
                   "elements": {"link": {"color": {"text": "inherit"}},
                                "button": {"color": {"background": "var:preset|color|accent", "text": "var:preset|color|on-accent"}}}},
        "templateParts": [{"name": k, "title": k.title(), "area": k} for k in ("header", "footer")]
    }
    write(target / "theme.json", json.dumps(settings, indent=2) + "\n")
    nav = block("navigation", {"overlayMenu": "mobile"}, block("home-link") + block("page-list"))
    write(target / "parts/header.html", group(group(block("site-title", {"level": 0}) + nav, "gc-wrap"), "gc-header", "header"))
    write(target / "parts/footer.html", group(group(block("site-title", {"level": 0}) + block("html", content=f"<span>{CREDIT}</span>"), "gc-wrap"), "gc-footer", "footer"))
    write(target / "patterns/home-intro.php", pattern(slug, "home-intro", "Homepage introduction", hero(theme)))
    write(target / "patterns/overview.php", pattern(slug, "overview", theme["section"], section(theme)))
    overview = block("pattern", {"slug": f"{slug}/overview"})
    intro = block("pattern", {"slug": f"{slug}/home-intro"})
    search = block("search", {"label": "Search", "buttonText": "Search", "className": "gc-search"})
    updates = group(heading(theme["updates"], 2, "gc-section-title") + query(), "gc-wrap gc-updates", "section")
    comments = block("comments", content='<div class="wp-block-comments">' + block("comments-title") +
                     block("comment-template", content=block("comment-author-name") + block("comment-content") +
                           block("comment-date") + block("comment-reply-link")) + block("post-comments-form") + "</div>")
    post = block("post-title", {"level": 1}) + block("post-featured-image") + block("post-content")
    pages = {
        "home": intro + overview + updates,
        "index": group(heading(theme["updates"], 1, "gc-section-title") + query(), "gc-wrap gc-updates"),
        "single": group(block("post-date") + post + block("post-terms", {"term": "category"}) + comments, "gc-article", "article"),
        "page": group(post, "gc-article", "article"),
        "archive": group(block("query-title", {"type": "archive", "level": 1}) + block("term-description") + query(), "gc-wrap gc-updates"),
        "search": group(block("query-title", {"type": "search", "level": 1}) + search + query(), "gc-wrap gc-updates"),
        "404": group(heading("Page not found", 1) + para("Search the site to find what you were looking for.") + search, "gc-article")
    }
    for page, content in pages.items():
        write(target / "templates" / f"{page}.html", block("template-part", {"slug": "header", "area": "header"})
              + group(content, tag="main", anchor="content")
              + block("template-part", {"slug": "footer", "area": "footer"}))
    write(target / "readme.txt", f"""=== {name} ===
Contributors: amoghacloud
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: {VERSION}
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

{name} is an original block theme by Gonk Themes.

== Description ==
{theme["description"]}

== Installation ==
Upload the WordPress ZIP in Appearance > Themes > Add New > Upload Theme, then activate it.
In Appearance > Editor, edit the Home template patterns and header navigation. Publish posts to populate the journal.
The footer credit can be edited or removed in the Site Editor.

== Resources ==
Theme code and CSS artwork: Copyright 2026 Gonk Themes, GPL-2.0-or-later.
screenshot.png: generated from the original theme preview, Copyright 2026 Gonk Themes, GPL-2.0-or-later.
Sources: https://github.com/gonkfun/themes/tree/main/themes/{slug}
System fonts use the visitor's installed fonts. No fonts are bundled.

== Changelog ==
= 1.0.0 =
Initial release.
""")
    copyfile(ROOT / "LICENSE", target / "LICENSE")


def build_preview(theme, target, css):
    name = escape(theme["name"])
    write(target / "theme.css", css)
    menu = '<a href="./">Home</a><a href="./#overview">Overview</a><a href="./#updates">Updates</a>'
    header = f'<header class="gc-header"><div class="gc-wrap"><a class="gc-brand" href="./">{name}</a><nav aria-label="Main">{menu}</nav></div></header>'
    footer = f'<footer class="gc-footer"><div class="gc-wrap"><span>{name} · Theme preview</span><span>{CREDIT}</span></div></footer>'
    art_html = '<div class="gc-art" aria-hidden="true"></div>'
    cards, notes = [], []
    for idx, (label, title, detail) in enumerate(theme["entries"], 1):
        cards.append(f'<article class="gc-card">{art_html}<p class="gc-label">{escape(label)}</p><h3>{escape(title)}</h3><p>{escape(detail)}</p></article>')
        notes.append(f'<article class="gc-item"><h3><a href="entry-{idx}.html">{escape(title)}</a></h3><p>{escape(detail)}</p></article>')
        page = f'<article class="gc-article"><a href="./#updates">← {escape(theme["updates"])}</a><h1>{escape(title)}</h1><p>{escape(detail)}</p><p>This is example content for the {name} theme preview.</p></article>'
        render_preview(target / f"entry-{idx}.html", f"{escape(title)} · {name}", header, page, footer)
    lead = (f'<section class="gc-hero gc-wrap"><div class="gc-copy"><p class="gc-label">{escape(theme["label"])}</p>'
            f'<h1>{escape(theme["headline"])}</h1><p class="gc-intro">{escape(theme["intro"])}</p>'
            f'<a class="gc-action" href="#overview">{escape(theme["action"])} ↘</a></div>{art_html}</section>')
    overview = f'<section id="overview" class="gc-content gc-wrap"><h2 class="gc-section-title">{escape(theme["section"])}</h2><div class="gc-deck">{"".join(cards)}</div></section>'
    updates = f'<section id="updates" class="gc-wrap gc-updates"><h2 class="gc-section-title">{escape(theme["updates"])}</h2><div class="gc-update-grid">{"".join(notes)}</div></section>'
    render_preview(target / "index.html", name, header, lead + overview + updates, footer)


def render_preview(path, title, header, content, footer):
    write(path, f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>{title}</title>
<link rel="stylesheet" href="theme.css">
</head>
<body>
<a class="gc-skip" href="#content">Skip to content</a>
{header}
<main id="content" tabindex="-1">{content}</main>
{footer}
</body>
</html>
''')


for theme in THEMES:
    slug = theme["id"]
    directory = ROOT / "themes" / slug
    tokens = "; ".join(f"--{token}: {value}" for token, value in zip(
        ("paper", "panel", "ink", "muted", "accent", "line", "on"), theme["colors"]))
    css = f":root {{ {tokens}; }}\n" + BASE_CSS + LAYOUTS[slug]
    build_wp(theme, directory / "wordpress" / slug, css)
    build_preview(theme, directory / "preview", css)
    write(directory / "README.md", f"""# {theme["name"]}

{theme["description"]}

[Live preview](https://gonkfun.github.io/themes/{slug}/) ·
[WordPress ZIP](https://github.com/gonkfun/themes/releases/tag/{slug}-v{VERSION})

Upload the WordPress ZIP under **Appearance → Themes → Add New → Upload Theme**.
Use **Appearance → Editor** to edit the site title, navigation, Home template patterns and footer.
Publish posts to populate the latest entries. For a separate posts page, set one under **Settings → Reading**.

GPL-2.0-or-later. CSS artwork and theme code are original. The theme works without plugins or remote assets.
""")
    print(f"Built {theme['name']}")
