#!/usr/bin/env python3
"""Fieldnote: native WordPress block theme (theme.json v3, templates, parts, patterns). No plugins required."""
from pathlib import Path
import json, shutil
R = Path(__file__).resolve().parent; T = R/'wordpress/fieldnote'; F = json.loads((R/'shared/fragments.json').read_text())
for d in ['templates', 'parts', 'patterns']:
    (T/d).mkdir(parents=True, exist_ok=True)
def block(name, attrs=None, inner=None):
    a = ' ' + json.dumps(attrs, separators=(',', ':'), ensure_ascii=False) if attrs else ''
    if inner is None: return f'<!-- wp:{name}{a} /-->'
    return f'<!-- wp:{name}{a} -->\n{inner}\n<!-- /wp:{name} -->'
def group(inner, cls='', tag='div'):
    return block('group', {'className': cls, 'tagName': tag, 'layout': {'type': 'default'}}, f'<{tag} class="wp-block-group {cls}">{inner}</{tag}>')
def raw(x): return block('html', inner=x)
def heading(x, level=2, cls=''):
    return block('heading', {'level': level, 'className': cls}, f'<h{level} class="wp-block-heading {cls}">{x}</h{level}>')
def para(x, cls=''):
    return block('paragraph', {'className': cls}, f'<p class="{cls}">{x}</p>')
def url(path): return f"<?php echo esc_url( home_url( '{path}' ) ); ?>"
def wp_links(s):
    return (s.replace('NOTES', url('/category/notes/')).replace('ABOUT', url('/about/')).replace('FEED', "<?php echo esc_url( get_feed_link() ); ?>")
             .replace('ART/', "<?php echo esc_url( get_theme_file_uri( 'assets/' ) ); ?>"))
def pattern(name, body, title):
    (T/'patterns'/f'{name}.php').write_text(f'''<?php
/**
 * Title: {title}
 * Slug: fieldnote/{name}
 * Categories: fieldnote
 * Inserter: yes
 */
if ( ! defined( 'ABSPATH' ) ) {{ exit; }}
?>
''' + body)
(T/'style.css').write_text('''/*
Theme Name: Fieldnote
Theme URI: https://gonkfun.github.io/themes/
Author: Gonk Themes
Author URI: https://gonk.fun/
Description: An original nature-journal block theme for naturalists, gardeners, birdwatchers and walkers. Specimen-card entries, margin notes, a season strip, day/dusk reading modes and hand-drawn line artwork. No tracking, external fonts or plugin dependencies.
Version: 1.0.0
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: fieldnote
Tags: blog, two-columns, block-patterns, full-site-editing, custom-colors, editor-style, featured-images, threaded-comments
*/
''')
(T/'functions.php').write_text('''<?php
/** Fieldnote theme setup. GPL-2.0-or-later. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function fieldnote_setup() {
 load_theme_textdomain( 'fieldnote', get_template_directory() . '/languages' );
 add_theme_support( 'editor-styles' );
 add_editor_style( 'assets/fieldnote.css' );
 add_theme_support( 'responsive-embeds' );
 add_theme_support( 'post-thumbnails' );
 add_theme_support( 'automatic-feed-links' );
 add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'fieldnote_setup' );
function fieldnote_assets() {
 $version = wp_get_theme()->get( 'Version' );
 wp_enqueue_style( 'fieldnote', get_theme_file_uri( 'assets/fieldnote.css' ), array(), $version );
 wp_enqueue_script( 'fieldnote', get_theme_file_uri( 'assets/fieldnote.js' ), array(), $version, true );
}
add_action( 'wp_enqueue_scripts', 'fieldnote_assets' );
function fieldnote_body_class( $classes ) { $classes[] = 'fn-wp'; return $classes; }
add_filter( 'body_class', 'fieldnote_body_class' );
function fieldnote_patterns() {
 register_block_pattern_category( 'fieldnote', array( 'label' => __( 'Fieldnote sections', 'fieldnote' ) ) );
 register_block_style( 'core/group', array( 'name' => 'margin-note', 'label' => __( 'Margin note', 'fieldnote' ), 'inline_style' => '' ) );
}
add_action( 'init', 'fieldnote_patterns' );
/** Margin-note block style uses the theme's .fn-margin look. */
function fieldnote_margin_note_class( $block_content, $block ) {
 if ( isset( $block['attrs']['className'] ) && false !== strpos( $block['attrs']['className'], 'is-style-margin-note' ) ) {
  $block_content = preg_replace( '/class="/', 'class="fn-margin ', $block_content, 1 );
 }
 return $block_content;
}
add_filter( 'render_block_core/group', 'fieldnote_margin_note_class', 10, 2 );
''')
pal = [('paper', 'Paper', '#f3eee2'), ('card', 'Card', '#fbf8f0'), ('ink', 'Ink', '#23261f'), ('muted', 'Muted', '#5b604f'), ('moss', 'Moss', '#3d5a36'), ('rust', 'Rust', '#a9512c')]
theme = {'$schema': 'https://schemas.wp.org/wp/6.6/theme.json', 'version': 3,
 'settings': {'appearanceTools': True, 'layout': {'contentSize': '740px', 'wideSize': '1180px'},
  'color': {'defaultPalette': False, 'palette': [{'slug': s, 'name': n, 'color': c} for s, n, c in pal]},
  'typography': {'fluid': True, 'fontFamilies': [
   {'slug': 'serif', 'name': 'Book serif', 'fontFamily': '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif'},
   {'slug': 'sans', 'name': 'System sans', 'fontFamily': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
   {'slug': 'mono', 'name': 'System mono', 'fontFamily': 'ui-monospace, SFMono-Regular, Consolas, monospace'}],
   'fontSizes': [{'slug': 'small', 'name': 'Small', 'size': '0.9rem'}, {'slug': 'medium', 'name': 'Body', 'size': '1.0625rem'}, {'slug': 'large', 'name': 'Large', 'size': '1.5rem'}, {'slug': 'x-large', 'name': 'Heading', 'size': '2.2rem'}]},
  'spacing': {'units': ['px', 'rem', 'em', '%', 'vw'], 'blockGap': True}},
 'styles': {'color': {'background': 'var:preset|color|paper', 'text': 'var:preset|color|ink'},
  'typography': {'fontFamily': 'var:preset|font-family|serif', 'fontSize': '17px', 'lineHeight': '1.7'},
  'spacing': {'blockGap': '0px'}, 'blocks': {'core/navigation': {'spacing': {'blockGap': '26px'}}},
  'elements': {'link': {'color': {'text': 'inherit'}}, 'button': {'color': {'background': 'var:preset|color|moss', 'text': '#fbf8f0'}, 'border': {'radius': '4px'}}}},
 'templateParts': [{'name': 'header', 'title': 'Header', 'area': 'header'}, {'name': 'footer', 'title': 'Footer', 'area': 'footer'}, {'name': 'kit', 'title': 'Field kit sidebar', 'area': 'uncategorized'}]}
(T/'theme.json').write_text(json.dumps(theme, indent=2, ensure_ascii=False))
mark = F['brand'].split('</span><span class="fn-brand-text">')[0] + '</span>'
site = group(raw(mark) + group(block('site-title', {'level': 0}) + block('site-tagline'), 'fn-brand-text'), 'fn-brand')
nav = block('navigation', {'overlayMenu': 'mobile', 'layout': {'type': 'flex', 'justifyContent': 'right'}}, block('home-link', {'label': 'Journal'}) + block('page-list'))
(T/'parts/header.html').write_text(group(group(site + nav + raw('<div class="fn-tools">' + F['toggle'] + '</div>'), 'fn-wrap fn-header-inner'), 'fn-header', 'header'))
foot = group(group(group(block('site-title', {'level': 0}) + para('A journal of small observations: birds, plants, weather and the paths between them.')) +
       block('navigation', {'overlayMenu': 'never', 'layout': {'type': 'flex', 'flexWrap': 'wrap'}}, block('home-link', {'label': 'Journal'}) + block('page-list')), 'fn-footer-top') +
       raw('<div class="fn-footer-bottom"><span>Written outdoors. No tracking, no ads.</span><span class="fn-credit">Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a></span></div>'), 'fn-wrap')
(T/'parts/footer.html').write_text(group(foot, 'fn-footer', 'footer'))
pattern('lead-entry', raw(wp_links(F['lead'])), 'Today’s observation (homepage lead)')
pattern('season', raw(F['season']), 'Season strip')
pattern('field-guide', raw('<nav class="fn-guide" aria-label="Field guide topics"><span>FIELD GUIDE</span>' + ''.join(f'<a class="fn-chip" href="{url("/category/" + t.lower() + "/")}">{t}</a>' for t in F['topics']) + '</nav>'), 'Field guide topics')
pattern('invitation', raw(wp_links(F['banner'])), 'Notebook invitation banner')
pattern('notebook', raw(wp_links(F['notebook'])), 'About the notebook')
pattern('follow', raw(wp_links(F['rss'])), 'Follow by RSS')
pattern('margin-note', block('group', {'className': 'is-style-margin-note', 'layout': {'type': 'default'}}, '<div class="wp-block-group is-style-margin-note">' + para('<b>Margin note</b>An aside to the main text: a count, a time, a piece of kit.') + '</div>'), 'Margin note')
pattern('observation-details', raw('<div class="fn-entry-meta"><span>Observed: date</span><span>Place</span><span>Weather</span></div>'), 'Observation details line')
kit = (block('search', {'label': 'Search entries', 'showLabel': False, 'placeholder': 'Search the journal…', 'buttonText': '→'}) + block('pattern', {'slug': 'fieldnote/notebook'}) +
       heading('Recent entries') + block('latest-posts', {'postsToShow': 4, 'displayPostDate': True}) + heading('Browse by subject') + block('categories', {'showPostCounts': True}) + block('pattern', {'slug': 'fieldnote/follow'}))
(T/'parts/kit.html').write_text(group(kit, 'fn-kit', 'aside'))
card = (block('post-featured-image', {'isLink': True, 'aspectRatio': '16/10'}) + block('post-terms', {'term': 'category'}) + block('post-title', {'level': 3, 'isLink': True}) +
        block('post-excerpt', {'moreText': '', 'excerptLength': 22}) + group(block('post-date', {'format': 'M j, Y'}) + block('post-author-name'), 'fn-observed'))
query = block('query', {'queryId': 1, 'query': {'perPage': 6, 'pages': 0, 'offset': 0, 'postType': 'post', 'order': 'desc', 'orderBy': 'date', 'author': '', 'search': '', 'exclude': [], 'sticky': '', 'inherit': True}},
        group(block('post-template', {'className': 'fn-cards', 'layout': {'type': 'default'}}, card)) +
        block('query-pagination', {'layout': {'type': 'flex', 'justifyContent': 'space-between'}}, block('query-pagination-previous', {'label': '← Newer entries'}) + block('query-pagination-numbers') + block('query-pagination-next', {'label': 'Older entries →'})) +
        block('query-no-results', inner=group(heading('No entries yet.') + para('Try another search, or write your first observation.'), 'fn-empty')))
part = lambda slug: block('template-part', {'slug': slug})
def template(name, content): (T/'templates'/f'{name}.html').write_text(part('header') + content + part('footer'))
main = group(raw('<div class="fn-section-heading" id="entries"><h2>Recent entries</h2><p>FROM THE NOTEBOOK</p></div>') + query, '', 'main')
template('index', group(block('pattern', {'slug': 'fieldnote/lead-entry'}) + block('pattern', {'slug': 'fieldnote/season'}) + block('pattern', {'slug': 'fieldnote/field-guide'}) +
         group(main + part('kit'), 'fn-content-grid') + block('pattern', {'slug': 'fieldnote/invitation'}), 'fn-wrap'))
(T/'templates/home.html').write_text((T/'templates/index.html').read_text())
head = group(block('query-title', {'type': 'archive', 'showPrefix': False}) + block('term-description'), 'fn-article')
template('archive', group(head + block('pattern', {'slug': 'fieldnote/field-guide'}) + group(group(query, '', 'main') + part('kit'), 'fn-content-grid'), 'fn-wrap'))
template('search', group(group(block('query-title', {'type': 'search'}) + block('search', {'label': 'Search entries', 'showLabel': True, 'buttonText': 'Search'}), 'fn-article') + group(group(query, '', 'main') + part('kit'), 'fn-content-grid'), 'fn-wrap'))
article = (block('post-terms', {'term': 'category', 'className': 'fn-kicker'}) + block('post-title', {'level': 1}) + block('post-excerpt', {'className': 'fn-standfirst'}) +
           group(block('post-author-name', {'isLink': True}) + block('post-date', {'format': 'F j, Y'}), 'fn-entry-meta') + block('post-featured-image', {'className': 'fn-figure'}) +
           block('post-content', {'layout': {'type': 'constrained'}, 'className': 'fn-prose'}) + raw('<div class="fn-share"><button data-fieldnote-copy="" hidden="hidden">Copy link</button></div>') +
           block('post-terms', {'term': 'post_tag'}) + group(block('post-navigation-link', {'type': 'previous', 'showTitle': True}) + block('post-navigation-link', {'type': 'next', 'showTitle': True}), 'fn-pagination') +
           block('comments', inner=group(block('comments-title') + block('comment-template', inner=block('comment-author-name') + block('comment-date') + block('comment-content') + block('comment-reply-link')) + block('post-comments-form'))))
template('single', group(group(article, 'fn-article', 'article'), 'fn-wrap', 'main'))
template('page', group(group(block('post-title', {'level': 1}) + block('post-content', {'layout': {'type': 'constrained'}, 'className': 'fn-prose'}), 'fn-article', 'article'), 'fn-wrap', 'main'))
template('404', group(group(raw('<div class="fn-kicker">404 · Off the path</div>') + heading('This page<br>wandered off.', 1) + para('It may have moved. Try a search, or head back to the journal.', 'fn-standfirst') +
         block('search', {'label': 'Search entries', 'buttonText': 'Search'}), 'fn-article'), 'fn-wrap', 'main'))
(T/'readme.txt').write_text('''=== Fieldnote ===
Contributors: gonk-themes
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An original nature-journal block theme for naturalists, gardeners, birdwatchers and walkers, by Gonk Themes.

== Installation ==
Upload fieldnote-wordpress-1.0.0.zip in Appearance > Themes > Add New > Upload Theme. Activate Fieldnote.
The front page shows your latest posts as specimen cards. Add a featured image (a photo or drawing) to each entry.
Create categories named Birds, Plants, Fungi, Weather, Trails and Notes, or edit the Field guide pattern links.
In the editor: insert the "Margin note" pattern (or choose the Margin note style on a Group) for side annotations, and the "Observation details line" pattern for date, place and weather.
The season strip reads the visitor's own clock. For the southern hemisphere add data-fieldnote-hemisphere="south" via a small custom HTML or code-snippet edit.
Use the Site Editor to change or remove the Powered by gonk.fun footer. Nothing is locked.
No plugins, API keys, external fonts, analytics or subscriptions required.

== Credits ==
Design, CSS, scripts and line artwork: Gonk Themes (designed by Claude), GPL-2.0-or-later.
System fonts use the visitor's installed fonts; no font files are distributed.

== Changelog ==
= 1.0.0 =
Initial release: journal homepage, specimen-card entries, archives, search, comments, page and 404 templates; eight block patterns; margin-note block style; day/dusk reading modes.
''')
shutil.copy2(R/'LICENSE', T/'LICENSE')
print('Built native WordPress block theme: 7 templates, 3 parts, 8 patterns.')
