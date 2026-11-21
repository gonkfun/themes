"""Build the native publishing themes and the static Panelwork preview."""
import json
from html import escape
from pathlib import Path
from shutil import copyfile
from string import Template

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "shared"
WP = ROOT / "wordpress/panelwork"
CSS = (SHARED / "panelwork.css").read_text()
DATA = (SHARED / "dashboard-data.js").read_text()
SCRIPT = "(() => {\n'use strict';\n" + DATA.replace("export function ", "function ") + (SHARED / "panelwork.js").read_text() + "\n})();\n"
METRICS = (SHARED / "metrics.html").read_text()
FILTER = (SHARED / "filter.html").read_text()
ACTIVITY = (SHARED / "activity.html").read_text()
POSTS = json.loads((SHARED / "posts.json").read_text())
COPY = "Publishing activity and topics from the posts on this page."
CREDIT = 'Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a>'
MENU = '<button type="button" class="pw-menu" aria-controls="panelwork-sidebar" aria-expanded="false" data-pw-menu="" hidden="hidden">Menu</button>'
MODE = '''<label class="pw-mode" hidden="hidden">Appearance
    <select aria-label="Appearance" data-pw-mode-select=""><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
</label>'''
SEARCH = '''<form class="pw-site-search" role="search" method="get" expr:action='data:blog.homepageUrl + "search"'>
    <label class="pw-sr" for="pw-site-search">Search all posts</label>
    <input id="pw-site-search" type="search" name="q" placeholder="Search all posts"/>
    <button type="submit">Search</button>
</form>'''


def write(file, text):
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(text, encoding="utf-8")


def block(name, options=None, content=None):
    attrs = " " + json.dumps(options, separators=(",", ":"), ensure_ascii=False) if options else ""
    if content is None:
        return f"<!-- wp:{name}{attrs} /-->\n"
    return f"<!-- wp:{name}{attrs} -->\n{content}\n<!-- /wp:{name} -->\n"


def group(content, style="", tag="div", anchor=None, metadata=None):
    attrs = {"layout": {"type": "default"}}
    if style:
        attrs["className"] = style
    if tag != "div":
        attrs["tagName"] = tag
    if anchor:
        attrs["anchor"] = anchor
    if metadata:
        attrs["metadata"] = metadata
    classes = f"wp-block-group {style}".rstrip()
    identifier = f' id="{anchor}"' if anchor else ""
    return block("group", attrs, f'<{tag}{identifier} class="{classes}">{content}</{tag}>')


def raw(text):
    return block("html", content=text)


def title(text):
    return block("heading", {"level": 1}, f'<h1 class="wp-block-heading">{escape(text)}</h1>')


def native_listing():
    post = group(
        block("post-title", {"level": 3, "isLink": True}) +
        block("post-terms", {"term": "category", "className": "pw-post-topics", "separator": " "}) +
        block("post-date", {"className": "pw-post-date", "format": "M j, Y"}),
        "pw-post-row")
    paging = block("query-pagination", {"className": "pw-paging", "layout": {"type": "flex"}},
                   block("query-pagination-previous") + block("query-pagination-numbers") + block("query-pagination-next"))
    return block("query", {"queryId": 0, "query": {"inherit": True}},
                 '<div class="wp-block-query">' + block("post-template", content=post) + paging +
                 block("query-no-results", content=block("paragraph", content="<p>No posts found.</p>")) + "</div>")


def template(name, body):
    header = block("template-part", {"slug": "header", "tagName": "div"})
    footer = block("template-part", {"slug": "footer", "tagName": "div"})
    write(WP / "templates" / f"{name}.html", group(header + group(group(body, "pw-wrap pw-content"), tag="main") + footer, "pw-shell"))


def wordpress():
    write(WP / "style.css", """/*
Theme Name: Panelwork
Theme URI: https://gonkfun.github.io/themes/panelwork/
Author: Gonk Themes
Author URI: https://gonk.fun/
Description: A publishing dashboard with a sidebar, activity charts, reader filters and a calm reading view.
Version: 1.1.0
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: panelwork
Tags: blog, full-site-editing, featured-images, threaded-comments
*/
""")
    write(WP / "functions.php", """<?php
/**
 * Load Panelwork's styles and local presentation controls.
 *
 * @package panelwork
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function panelwork_setup() {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/panelwork.css' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
}
add_action( 'after_setup_theme', 'panelwork_setup' );

function panelwork_assets() {
    $version = wp_get_theme()->get( 'Version' );
    wp_enqueue_style( 'panelwork-layout', get_theme_file_uri( 'assets/panelwork.css' ), array(), $version );
    wp_enqueue_script( 'panelwork-dashboard', get_theme_file_uri( 'assets/panelwork.js' ), array(), $version, false );
}
add_action( 'wp_enqueue_scripts', 'panelwork_assets' );

function panelwork_body_class( $classes ) {
    $classes[] = 'panelwork-theme';
    return $classes;
}
add_filter( 'body_class', 'panelwork_body_class' );
""")
    settings = {
        "version": 3,
        "settings": {"appearanceTools": True, "layout": {"contentSize": "760px", "wideSize": "1360px"},
                     "color": {"palette": [
                         {"slug": "midnight", "name": "Midnight", "color": "#18223a"},
                         {"slug": "iris", "name": "Iris", "color": "#4658b8"},
                         {"slug": "mint", "name": "Mint", "color": "#dcf2e9"}]}},
        "styles": {"spacing": {"blockGap": "0"}, "elements": {"link": {"color": {"text": "inherit"}}}},
        "templateParts": [{"name": key, "title": key.title(), "area": key} for key in ("header", "footer")]
    }
    write(WP / "theme.json", json.dumps(settings, indent=2) + "\n")
    nav = block("navigation", {"overlayMenu": "never", "layout": {"type": "flex", "orientation": "vertical"}},
                block("home-link", {"label": "Overview"}) + block("page-list"))
    topics = group(raw('<h2>Topics</h2>') + block("categories"), "pw-side-topics")
    rail = group(block("site-title", {"level": 0}) + raw(MENU), "pw-brand-line")
    rail += group(nav + topics + raw(MODE), "pw-rail-panel", anchor="panelwork-sidebar")
    write(WP / "parts/header.html", group(rail, "pw-sidebar", "header"))
    write(WP / "parts/footer.html", group(group(raw(f"<span>{CREDIT}</span>"), "pw-wrap"), "pw-footer", "footer"))
    search = block("search", {"label": "Search all posts", "showLabel": False, "placeholder": "Search all posts",
                             "buttonText": "Search", "className": "pw-site-search"})
    site_bar = group(block("site-tagline") + search, "pw-top")
    posts = group(raw(FILTER) + native_listing(), "pw-card pw-list", anchor="post-library")
    home = (site_bar + group(title("Publishing overview") + block("paragraph", content=f"<p>{COPY}</p>"), "pw-summary")
            + raw(METRICS) + posts)
    template("home", home + raw(ACTIVITY))
    template("index", site_bar + group(title("Post archive"), "pw-summary") + posts)
    template("archive", site_bar + group(block("query-title", {"type": "archive", "showPrefix": False, "level": 1}) +
                                        block("term-description"), "pw-summary") + posts)
    template("search", site_bar + group(block("query-title", {"type": "search", "level": 1}), "pw-summary") + posts)
    template("404", group(title("Page not found") + search, "pw-summary"))
    article = (block("post-terms", {"term": "category", "className": "pw-post-topics"})
               + block("post-title", {"level": 1}) + block("post-date", {"className": "pw-post-date"})
               + block("post-featured-image") + block("post-content", {"className": "pw-prose", "layout": {"type": "default"}}))
    comments = block("comments", content='<div class="wp-block-comments">' + block("comments-title")
                     + block("comment-template", content=block("comment-author-name") + block("comment-content") + block("comment-reply-link"))
                     + block("post-comments-form") + "</div>")
    template("page", group(block("post-title", {"level": 1}) + block("post-content", {"className": "pw-prose"}), "pw-card pw-article", "article"))
    template("single", group(article + comments, "pw-card pw-article", "article"))
    write(WP / "assets/panelwork.css", CSS)
    # The CSS class is shared with Blogger and React. Mark the native list root for JS.
    write(WP / "assets/panelwork.js", SCRIPT.replace("document.querySelector('[data-pw-list]')", "document.querySelector('[data-pw-list], #post-library')"))
    write(WP / "readme.txt", """=== Panelwork ===
Contributors: amoghacloud
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An original publishing dashboard theme with a sidebar, post library, and public post summaries.

== Installation ==
Upload the WordPress ZIP and activate it. Under Settings > Reading, choose Your latest posts for the dashboard homepage.
Publish posts with categories. Search covers the whole site, while the table filters and chart describe the posts on the current page.
Edit the menu and removable Gonk footer credit through Appearance > Editor.

== Privacy ==
The theme stores the selected appearance locally. Charts are generated from rendered public posts. No traffic analytics, tracking, remote scripts or bundled fonts.

== Resources ==
Code, CSS graphics, and screenshot: Copyright 2026 Gonk Themes, GPL-2.0-or-later.
Source: https://github.com/gonkfun/themes/tree/main/themes/panelwork
""")
    copyfile(ROOT.parents[1] / "LICENSE", WP / "LICENSE")


def post_row(post):
    topics = "".join(f"<span>{escape(topic)}</span>" for topic in post["topics"])
    return (f'<li><div class="pw-post-row"><h3><a href="{post["id"]}.html">{escape(post["title"])}</a></h3>'
            f'<div class="pw-post-topics">{topics}</div><time class="pw-post-date" datetime="{post["date"]}">{post["date"]}</time></div></li>')


def demo(title_text, body, active=""):
    current = lambda key: ' aria-current="page"' if active == key else ''
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>{escape(title_text)} · Panelwork</title>
<link rel="stylesheet" href="panelwork.css"><script src="panelwork.js"></script>
</head>
<body>
<a class="pw-skip" href="#content">Skip to content</a>
<div class="pw-shell">
  <header class="pw-sidebar"><div class="pw-brand-line"><a class="pw-brand" href="./">Panelwork</a>{MENU}</div>
    <div class="pw-rail-panel" id="panelwork-sidebar">
      <nav class="pw-nav" aria-label="Main navigation"><a href="./"{current('home')}>Overview</a><a href="library.html"{current('library')}>Post library</a><a href="react/">React workspace</a></nav>
      {MODE}
    </div>
  </header>
  <main id="content" tabindex="-1"><div class="pw-wrap pw-content">
    <div class="pw-top"><p class="pw-top-service">Publishing desk · Example content</p><a class="pw-quiet-link" href="react/">Open React workspace ↗</a></div>
    {body}
  </div></main>
  <footer class="pw-footer"><div class="pw-wrap">{CREDIT}</div></footer>
</div>
</body>
</html>
"""


def preview():
    directory = ROOT / "preview"
    write(directory / "panelwork.css", CSS)
    write(directory / "panelwork.js", SCRIPT)
    rows = ''.join(map(post_row, POSTS))
    list_view = f'<section class="pw-card pw-list" data-pw-list="">{FILTER}<ul class="pw-post-rows">{rows}</ul></section>'
    intro = f'<section class="pw-summary"><h1>Publishing overview</h1><p>{COPY}</p></section>'
    write(directory / "index.html", demo("Publishing overview", intro + METRICS + list_view + ACTIVITY, "home"))
    write(directory / "library.html", demo("Archive", '<header class="pw-summary"><h1>Archive</h1></header>' + list_view, "library"))
    for post in POSTS:
        article = (f'<article class="pw-card pw-article"><a href="library.html">← Post library</a><h1>{escape(post["title"])}</h1>'
                   f'<time class="pw-post-date" datetime="{post["date"]}">{post["date"]}</time>'
                   f'<div class="pw-prose"><p>{escape(post["summary"])}</p>'
                   '<p>This is a fictional entry for the Panelwork preview. On a real site, this space shows your published article and its native formatting.</p></div></article>')
        write(directory / f'{post["id"]}.html', demo(post["title"], article))


def blogger():
    xml = Template((SHARED / "blogger.xml").read_text())
    write(ROOT / "blogger/panelwork-blogger.xml", xml.substitute(
        styles=CSS, script=SCRIPT, menu=MENU, mode=MODE, metrics=METRICS, activity=ACTIVITY, filter=FILTER, search=SEARCH, credit=CREDIT))


def react_sources():
    for name in ("dashboard-data.js", "panelwork.css", "posts.json"):
        copyfile(SHARED / name, ROOT / "react/src" / name)
    copyfile(ROOT.parents[1] / "LICENSE", ROOT / "react/LICENSE")


if __name__ == "__main__":
    wordpress()
    blogger()
    preview()
    react_sources()
    print("Built Panelwork native templates, preview and React shared assets")
