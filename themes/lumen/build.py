"""Build Lumen's native publishing packages and fictional local preview."""
import json
import shutil
from html import escape
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parent
WP = ROOT / "wordpress/lumen"
PREVIEW = ROOT / "preview"
SHARED = ROOT / "shared"
CSS = (SHARED / "lumen.css").read_text()
JS = (SHARED / "lumen.js").read_text()
CREDIT = 'Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a>'
APPEARANCE = """<label class="lm-appearance" hidden="hidden">
  <span class="lm-sr-only">Appearance</span>
  <select aria-label="Appearance" data-lumen-appearance="">
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</label>"""
ART = '<div class="lm-art" aria-hidden="true"></div>'
STORIES = [
    ("attention", "On keeping a place for attention", "Essays", "June 12",
     "A notebook is a small promise to notice. What happens when we make a little room for the things that take time?"),
    ("margins", "The library in the margins", "Reading notes", "June 8",
     "What we keep from a book is often a handful of sentences, a question, and an argument we want to have again."),
    ("walking", "A walk without a conclusion", "Field notes", "May 29",
     "An unhurried circuit of the neighbourhood and three details I had passed a hundred times."),
    ("unfinished", "A note on unfinished work", "Essays", "May 21",
     "How a drawer of drafts can become a way to see what your thinking is still circling.")
]


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def block(name, attrs=None, content=None):
    options = " " + json.dumps(attrs, separators=(",", ":"), ensure_ascii=False) if attrs else ""
    if content is None:
        return f"<!-- wp:{name}{options} /-->\n"
    return f"<!-- wp:{name}{options} -->\n{content}\n<!-- /wp:{name} -->\n"


def group(content, cls="", tag="div"):
    attrs = {"layout": {"type": "default"}}
    if cls:
        attrs["className"] = cls
    if tag != "div":
        attrs["tagName"] = tag
    classes = f"wp-block-group {cls}".rstrip()
    return block("group", attrs, f'<{tag} class="{classes}">{content}</{tag}>')


def raw(content):
    return block("html", content=content)


def heading(value, level):
    attrs = {"level": level} if level != 2 else None
    return block("heading", attrs, f'<h{level} class="wp-block-heading">{escape(value)}</h{level}>')


def listing():
    features = (block("post-featured-image") + raw(ART))
    meta = block("post-date", {"className": "lm-meta", "format": "F j, Y"})
    title = block("post-title", {"level": 2, "isLink": True})
    body = group(raw('<span class="lm-kicker lm-feature-label">Featured essay</span>')
                 + block("post-terms", {"term": "category"}) + title + block("post-excerpt", {"excerptLength": 28})
                 + meta, "lm-card-body")
    cards = block("post-template", content=group(body + features, "lm-card"))
    pagination = block("query-pagination", {"className": "lm-paging", "layout": {"type": "flex"}},
                       block("query-pagination-previous") + block("query-pagination-numbers") + block("query-pagination-next"))
    empty = block("query-no-results", content=block("paragraph", content="<p>No entries found.</p>"))
    return block("query", {"queryId": 0, "query": {"inherit": True}},
                 '<div class="wp-block-query">' + cards + pagination + empty + '</div>')


def template(name, body):
    head = block("template-part", {"slug": "header", "area": "header"})
    foot = block("template-part", {"slug": "footer", "area": "footer"})
    write(WP / "templates" / f"{name}.html", head + group(body, tag="main") + foot)


def wordpress():
    write(WP / "style.css", """/*
Theme Name: Lumen
Theme URI: https://gonkfun.github.io/themes/lumen/
Author: Gonk Themes
Author URI: https://gonk.fun/
Description: A warm literary journal with a featured essay, a narrow reading column and a system-aware appearance control.
Version: 1.0.0
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: lumen
Tags: blog, block-patterns, full-site-editing, featured-images, threaded-comments
*/
""")
    write(WP / "functions.php", """<?php
/**
 * Styles, appearance preference, and editorial patterns.
 *
 * @package lumen
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function lumen_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/lumen.css' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'lumen_setup' );

function lumen_assets() {
    $version = wp_get_theme()->get( 'Version' );
    wp_enqueue_style( 'lumen-reading', get_theme_file_uri( 'assets/lumen.css' ), array(), $version );
    wp_enqueue_script( 'lumen-appearance', get_theme_file_uri( 'assets/lumen.js' ), array(), $version, false );
}
add_action( 'wp_enqueue_scripts', 'lumen_assets' );

function lumen_body_class( $classes ) {
    $classes[] = 'lumen-journal';
    return $classes;
}
add_filter( 'body_class', 'lumen_body_class' );

function lumen_pattern_category() {
    register_block_pattern_category( 'lumen', array( 'label' => __( 'Lumen journal', 'lumen' ) ) );
}
add_action( 'init', 'lumen_pattern_category' );
""")
    settings = {
        "version": 3,
        "settings": {"appearanceTools": True, "layout": {"contentSize": "700px", "wideSize": "1040px"},
                     "typography": {"fluid": True},
                     "color": {"palette": [
                         {"slug": "ivory", "name": "Ivory", "color": "#faf6ef"},
                         {"slug": "terracotta", "name": "Terracotta", "color": "#8e402c"},
                         {"slug": "ink", "name": "Ink", "color": "#2e211d"}]}},
        "styles": {"spacing": {"blockGap": "0"}, "elements": {"link": {"color": {"text": "inherit"}}}},
        "templateParts": [{"name": name, "title": name.title(), "area": name} for name in ("header", "footer")]
    }
    write(WP / "theme.json", json.dumps(settings, indent=2) + "\n")
    nav = block("navigation", {"overlayMenu": "mobile"}, block("home-link", {"label": "Journal"}) + block("page-list"))
    head = group(block("site-title", {"level": 0}) + nav + raw(APPEARANCE), "lm-wrap")
    write(WP / "parts/header.html", group(head, "lm-header", "header"))
    write(WP / "parts/footer.html", group(group(block("site-title", {"level": 0}) + raw(f'<span>{CREDIT}</span>'), "lm-wrap"), "lm-footer", "footer"))
    intro = group(block("site-title", {"level": 1, "isLink": False}) + block("site-tagline"), "lm-wrap lm-masthead")
    template("home", intro + group(listing(), "lm-wrap lm-home"))
    topic_list = group(block("categories", {"showPostCounts": True}), "lm-topics")
    search = block("search", {"label": "Search the journal", "buttonText": "Search", "className": "lm-search"})
    template("index", group(group(heading("Journal", 1) + search + topic_list, "lm-archive-head") + listing(), "lm-read lm-library"))
    template("archive", group(group(block("query-title", {"type": "archive", "level": 1, "showPrefix": False}) + block("term-description") + topic_list, "lm-archive-head") + listing(), "lm-read lm-library"))
    template("search", group(group(block("query-title", {"type": "search", "level": 1}) + search, "lm-archive-head") + listing(), "lm-read lm-library"))
    template("404", group(heading("This page wandered off.", 1) + search, "lm-read lm-article"))
    title = block("post-title", {"level": 1})
    image = block("post-featured-image")
    prose = block("post-content", {"className": "lm-prose", "layout": {"type": "default"}})
    template("page", group(title + image + prose, "lm-read lm-article", "article"))
    comments = block("comments", {"className": "lm-comments"},
                     '<div class="wp-block-comments lm-comments">' + block("comments-title")
                     + block("comment-template", content=block("comment-author-name") + block("comment-content")
                             + block("comment-date") + block("comment-reply-link")) + block("post-comments-form") + '</div>')
    article = (block("post-terms", {"term": "category", "className": "lm-kicker"}) + title
               + block("post-date", {"className": "lm-meta", "format": "F j, Y"}) + image + prose
               + block("post-terms", {"term": "post_tag", "className": "lm-tags"}) + comments)
    template("single", group(article, "lm-read lm-article", "article"))
    write(WP / "patterns/reading-note.php", """<?php
/**
 * Title: Reading note
 * Slug: lumen/reading-note
 * Categories: lumen
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<!-- wp:quote -->
<blockquote class="wp-block-quote">
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Add a passage, question, or note for the reader.', 'lumen' ); ?></p>
<!-- /wp:paragraph -->
</blockquote>
<!-- /wp:quote -->
""")
    write(WP / "readme.txt", """=== Lumen ===
Contributors: amoghacloud
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A literary journal with a featured essay, narrow reading column and a light, dark or system appearance.

== Installation ==
Upload the theme ZIP in Appearance > Themes and activate it. Set the site title and tagline in Settings.
With latest posts on the homepage, the first post in the feed is featured. Use a sticky post to pin an essay and a featured image if desired.
Use Appearance > Editor to edit menus, templates and the removable Gonk footer credit.

== Privacy ==
The theme stores only the selected appearance in localStorage on your site. It includes no analytics, external fonts or remote artwork.

== Resources ==
Code, decorative CSS artwork and screenshot: Copyright 2026 Gonk Themes, GPL-2.0-or-later.
Source: https://github.com/gonkfun/themes/tree/main/themes/lumen
""")
    write(WP / "assets/lumen.css", CSS)
    write(WP / "assets/lumen.js", JS)
    shutil.copyfile(ROOT.parents[1] / "LICENSE", WP / "LICENSE")


def blogger():
    xml = Template((SHARED / "blogger.xml").read_text()).substitute(
        styles=CSS, script=JS, appearance=APPEARANCE, credit=CREDIT, artwork=ART)
    write(ROOT / "blogger/lumen-blogger.xml", xml)


def preview_page(title, main):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{escape(title)} · Lumen</title>
<link rel="stylesheet" href="lumen.css">
<script src="lumen.js"></script>
</head>
<body>
<a class="lm-skip" href="#content">Skip to content</a>
<header class="lm-header"><div class="lm-wrap">
<a class="lm-brand" href="./">Lumen</a>
<nav class="lm-nav" aria-label="Main"><a href="./">Journal</a><a href="archive.html">Archive</a></nav>
{APPEARANCE}
</div></header>
<main id="content" tabindex="-1">{main}</main>
<footer class="lm-footer"><div class="lm-wrap"><span>Lumen · Theme preview</span><span>{CREDIT}</span></div></footer>
</body>
</html>
"""


def card(story, lead=False):
    slug, title, category, date, blurb = map(escape, story)
    style = " lm-featured" if lead else ""
    label = '<span class="lm-kicker lm-feature-label">Featured essay</span>' if lead else ""
    return f"""<article class="lm-card{style}">
<div class="lm-card-body">{label}<span class="lm-meta">{category} · {date}</span>
<h2 class="lm-card-title"><a href="{slug}.html">{title}</a></h2>
<p>{blurb}</p></div>{ART if lead else ""}</article>"""


def preview():
    write(PREVIEW / "lumen.css", CSS)
    write(PREVIEW / "lumen.js", JS)
    intro = '<section class="lm-masthead lm-wrap"><h1>An open notebook.</h1><p>Essays, reading notes, and things that take time to notice.</p></section>'
    home = intro + '<div class="lm-wrap lm-home-list">' + "".join(card(story, idx == 0) for idx, story in enumerate(STORIES)) + '</div>'
    write(PREVIEW / "index.html", preview_page("Journal", home))
    for slug, title, category, date, blurb in STORIES:
        body = f'''<article class="lm-read lm-article"><div class="lm-kicker">{escape(category)}</div>
<h1>{escape(title)}</h1><p class="lm-meta">{escape(date)} · Lumen demo journal</p>
<div class="lm-prose"><p>{escape(blurb)}</p>
<p>I opened the notebook before breakfast, while the light still fell across the table at an angle. After a few minutes I had a list of small things I meant to forget. It turned out those were the ones worth keeping.</p>
<h2>Something to return to</h2>
<p>The best notes leave room to come back. They hold enough detail to bring a moment into focus and enough open space for an idea you do not have yet. The next time you notice something familiar, try naming one detail that changed.</p>
<blockquote>A page can hold an observation without demanding an explanation.</blockquote>
<p>The point is to make a record that you will want to read again. One sentence can do that work.</p></div>
<p class="lm-meta">Fictional sample essay for the theme preview.</p>
<a href="archive.html">← Back to the archive</a></article>'''
        write(PREVIEW / f"{slug}.html", preview_page(title, body))
    categories = sorted({story[2] for story in STORIES})
    for topic in [None, *categories]:
        labels = ['<a href="archive.html">All entries</a>']
        for name in categories:
            link = name.lower().replace(' ', '-')
            labels.append(f'<a href="topic-{link}.html">{escape(name)}</a>')
        page_title = topic or "The archive"
        sections = '<article class="lm-read lm-library"><header class="lm-archive-head"><h1>' + escape(page_title) + '</h1>'
        sections += '<nav aria-label="Topics" class="lm-topics">' + "".join(labels) + '</nav></header>'
        sections += "".join(card(s) for s in STORIES if topic is None or s[2] == topic) + '</article>'
        name = f"topic-{topic.lower().replace(' ', '-')}.html" if topic else "archive.html"
        write(PREVIEW / name, preview_page(page_title, sections))


if __name__ == "__main__":
    wordpress()
    blogger()
    preview()
    print("Built Lumen WordPress, Blogger, and static preview")
