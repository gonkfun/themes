from pathlib import Path
import json,shutil
R=Path(__file__).resolve().parent;T=R/'wordpress/epoch';F=json.loads((R/'shared/fragments.json').read_text())
def block(name,attrs=None,inner=None,tag=None):
 a=' '+json.dumps(attrs,separators=(',',':')) if attrs else ''
 if inner is None:return f'<!-- wp:{name}{a} /-->'
 return f'<!-- wp:{name}{a} -->\n{inner}\n<!-- /wp:{name} -->'
def group(inner,cls='',tag='div'):
 return block('group',{'className':cls,'tagName':tag,'layout':{'type':'default'}},f'<{tag} class="wp-block-group {cls}">{inner}</{tag}>')
def raw(x):return block('html',inner=x)
def heading(x,level=2,cls=''):
 return block('heading',{'level':level,'className':cls},f'<h{level} class="wp-block-heading {cls}">{x}</h{level}>')
def para(x,cls=''):
 return block('paragraph',{'className':cls},f'<p class="{cls}">{x}</p>')
def pattern(name,body,title):
 # WordPress evaluates URLs when inserting a pattern, supporting subdirectory installs.
 body=body.replace('GUIDES',"<?php echo esc_url( home_url( '/category/guides/' ) ); ?>").replace('SECURITY',"<?php echo esc_url( home_url( '/category/security/' ) ); ?>").replace('FEEDURL',"<?php echo esc_url( get_feed_link() ); ?>")
 (T/'patterns'/f'{name}.php').write_text(f'''<?php
/**
 * Title: {title}
 * Slug: epoch/{name}
 * Categories: epoch
 * Inserter: yes
 */
if ( ! defined( 'ABSPATH' ) ) {{ exit; }}
?>
'''+body)
(T/'style.css').write_text('''/*
Theme Name: Epoch
Theme URI: https://gonk.fun/
Author: Gonk Themes
Author URI: https://gonk.fun/
Description: An original editorial block theme for Solana communities. Readable articles, topic archives, accessible navigation, original artwork and a removable Gonk credit. No wallet, trading or tracking integrations.
Version: 1.0.0
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: epoch
Tags: blog, news, two-columns, block-patterns, full-site-editing, custom-colors, custom-logo, editor-style, featured-images, threaded-comments
*/
''')
(T/'functions.php').write_text('''<?php
/** Epoch theme setup. GPL-2.0-or-later. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
function epoch_setup() {
 load_theme_textdomain( 'epoch', get_template_directory() . '/languages' );
 add_theme_support( 'editor-styles' );
 add_editor_style( 'assets/epoch.css' );
 add_theme_support( 'responsive-embeds' );
 add_theme_support( 'post-thumbnails' );
 add_theme_support( 'automatic-feed-links' );
 add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'epoch_setup' );
function epoch_assets() {
 $version = wp_get_theme()->get( 'Version' );
 wp_enqueue_style( 'epoch', get_theme_file_uri( 'assets/epoch.css' ), array(), $version );
 wp_enqueue_script( 'epoch', get_theme_file_uri( 'assets/epoch.js' ), array(), $version, true );
}
add_action( 'wp_enqueue_scripts', 'epoch_assets' );
function epoch_body_class( $classes ) { $classes[] = 'ep-wp'; return $classes; }
add_filter( 'body_class', 'epoch_body_class' );
function epoch_patterns() {
 register_block_pattern_category( 'epoch', array( 'label' => __( 'Epoch sections', 'epoch' ) ) );
}
add_action( 'init', 'epoch_patterns' );
''')
theme={'$schema':'https://schemas.wp.org/wp/6.6/theme.json','version':3,'settings':{'appearanceTools':True,'layout':{'contentSize':'780px','wideSize':'1240px'},'color':{'defaultPalette':False,'palette':[{'slug':s,'name':n,'color':c} for s,n,c in [('canvas','Canvas','#101216'),('surface','Surface','#191c22'),('ink','Text','#f2f4f8'),('muted','Muted','#aab3c2'),('mint','Blue','#8fbaff'),('violet','Ice','#b5cfff')]]},'typography':{'fluid':True,'fontFamilies':[{'slug':'system','name':'System sans','fontFamily':'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},{'slug':'mono','name':'System mono','fontFamily':'ui-monospace, SFMono-Regular, Consolas, monospace'}],'fontSizes':[{'slug':'small','name':'Small','size':'0.875rem'},{'slug':'medium','name':'Body','size':'1rem'},{'slug':'large','name':'Large','size':'1.5rem'},{'slug':'x-large','name':'Heading','size':'2rem'}]},'spacing':{'units':['px','rem','em','%','vw'],'blockGap':True}},'styles':{'color':{'background':'var:preset|color|canvas','text':'var:preset|color|ink'},'typography':{'fontFamily':'var:preset|font-family|system','fontSize':'16px','lineHeight':'1.65'},'spacing':{'blockGap':'0px'},'blocks':{'core/navigation':{'spacing':{'blockGap':'24px'}}},'elements':{'link':{'color':{'text':'inherit'}},'button':{'color':{'background':'var:preset|color|mint','text':'#101b30'},'border':{'radius':'999px'}}}},'templateParts':[{'name':'header','title':'Header','area':'header'},{'name':'footer','title':'Footer','area':'footer'},{'name':'sidebar','title':'Reading sidebar','area':'uncategorized'}]}
(T/'theme.json').write_text(json.dumps(theme,indent=2))
site=group(raw('<span class="ep-mark" aria-hidden="true">E</span>')+group(block('site-title',{'level':0})+block('site-tagline')), 'ep-brand')
nav=block('navigation',{'overlayMenu':'mobile','layout':{'type':'flex','justifyContent':'right'}},block('home-link',{'label':'Journal'})+block('page-list'))
(T/'parts/header.html').write_text(group(group(site+nav+raw('<div class="ep-tools">'+F['toggle']+'</div>'),'ep-wrap ep-header-inner'),'ep-header','header'))
footer=group(group(group(block('site-title',{'level':0})+para('An independent space for ideas, explanations and the people behind them.'))+block('navigation',{'overlayMenu':'never','layout':{'type':'flex','flexWrap':'wrap'}},block('home-link',{'label':'Journal'})+block('page-list')),'ep-footer-top')+raw('<div class="ep-footer-bottom"><span>Independent publishing. No wallet connection required.</span><span class="ep-credit">Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a></span></div>'),'ep-wrap')
(T/'parts/footer.html').write_text(group(footer,'ep-footer','footer'))
pattern('intro',raw(F['hero']),'Editorial introduction')
pattern('beginner-note',raw(F['notes']),'Beginner reading note')
pattern('safety-banner',raw(F['banner']),'Wallet education banner')
pattern('rss',raw('<section class="ep-rss"><h2>A feed, at your pace.</h2><p>Follow new posts in your favourite RSS reader. No algorithm deciding what you see.</p><a class="ep-button" href="FEEDURL">Follow through RSS ↗</a></section>'),'RSS invitation')
pattern('topics',raw('<nav class="ep-topics" aria-label="Explore topics"><span>FIND YOUR SIGNAL</span>'+''.join(f'<a class="ep-chip" href="<?php echo esc_url( home_url( \'/category/{t.lower()}/\' ) ); ?>">{t}</a>' for t in F['topics'])+'</nav>'),'Topic navigation')
sidebar=block('search',{'label':'Search articles','showLabel':False,'placeholder':'Find a story…','buttonText':'Search'})+block('pattern',{'slug':'epoch/beginner-note'})+heading('The reading list')+block('latest-posts',{'postsToShow':4,'displayPostDate':True})+heading('Explore topics')+block('categories',{'showPostCounts':True})+block('pattern',{'slug':'epoch/rss'})
(T/'parts/sidebar.html').write_text(group(sidebar,'ep-rail','aside'))
card=block('post-featured-image',{'isLink':True,'aspectRatio':'16/10'})+block('post-terms',{'term':'category'})+block('post-title',{'level':3,'isLink':True})+block('post-excerpt',{'moreText':'','excerptLength':23})+group(block('post-author-name')+block('post-date',{'format':'M j, Y'}),'ep-meta')
query=block('query',{'queryId':1,'query':{'perPage':6,'pages':0,'offset':0,'postType':'post','order':'desc','orderBy':'date','author':'','search':'','exclude':[],'sticky':'','inherit':True}},group(block('post-template',{'className':'ep-card-grid','layout':{'type':'default'}},card))+block('query-pagination',{'layout':{'type':'flex','justifyContent':'space-between'}},block('query-pagination-previous',{'label':'← Newer stories'})+block('query-pagination-numbers')+block('query-pagination-next',{'label':'Older stories →'}))+block('query-no-results',inner=group(heading('No stories found.')+para('Try another search, or publish your first story to get started.'),'ep-empty')))
part=lambda slug:block('template-part',{'slug':slug})
start=part('header');end=part('footer')
def template(name,content): (T/'templates'/f'{name}.html').write_text(start+content+end)
main=group(raw('<div class="ep-section-heading" id="latest"><h2>The journal<span style="color:var(--ep-accent)">.</span></h2><p>THOUGHTFULLY CURATED</p></div>')+query,'','main')
template('index',group(block('pattern',{'slug':'epoch/intro'})+block('pattern',{'slug':'epoch/topics'})+group(main+part('sidebar'),'ep-content-grid')+block('pattern',{'slug':'epoch/safety-banner'}),'ep-wrap'))
# A front page must explicitly query posts instead of inheriting the static-page query.
home=(T/'templates/index.html').read_text().replace('"inherit":true','"inherit":false')
(T/'templates/front-page.html').unlink(missing_ok=True);(T/'templates/home.html').write_text((T/'templates/index.html').read_text())
archive=group(block('query-title',{'type':'archive','showPrefix':False})+block('term-description'),'ep-archive-head')
template('archive',group(archive+block('pattern',{'slug':'epoch/topics'})+group(group(query,'','main')+part('sidebar'),'ep-content-grid'),'ep-wrap'))
template('search',group(group(block('query-title',{'type':'search'})+block('search',{'label':'Search articles','showLabel':True,'buttonText':'Search'}),'ep-archive-head')+group(group(query,'','main')+part('sidebar'),'ep-content-grid'),'ep-wrap'))
article=block('post-terms',{'term':'category'})+block('post-title',{'level':1})+group(block('post-author-name',{'isLink':True})+block('post-date',{'format':'F j, Y'}),'ep-meta')+block('post-featured-image')+block('post-content',{'layout':{'type':'constrained'}})+raw('<div class="ep-share"><button data-epoch-copy="" hidden="hidden">Copy article link</button></div>')+block('post-terms',{'term':'post_tag'})+group(block('post-navigation-link',{'type':'previous','showTitle':True})+block('post-navigation-link',{'type':'next','showTitle':True}),'ep-pagination')+block('comments',inner=group(block('comments-title')+block('comment-template',inner=block('comment-author-name')+block('comment-date')+block('comment-content')+block('comment-reply-link'))+block('post-comments-form')))
template('single',group(group(article,'ep-article','article'),'ep-wrap','main'))
template('page',group(group(block('post-title',{'level':1})+block('post-content',{'layout':{'type':'constrained'}}),'ep-article','article'),'ep-wrap','main'))
template('404',group(group(raw('<div class="ep-eyebrow">404 / Wrong turn</div>')+heading('This block<br>is missing.',1)+para('The page may have moved. Search for a story worth reading.','ep-lead')+block('search',{'label':'Search articles','buttonText':'Search'}),'ep-article'),'ep-wrap','main'))
(T/'readme.txt').write_text('''=== Epoch ===
Contributors: gonk-themes
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An original editorial block theme for Solana communities, by Gonk Themes.

== Installation ==
Upload epoch-wordpress-1.0.0.zip in Appearance > Themes > Add New > Upload Theme. Activate Epoch.
Use Appearance > Editor to change the header, navigation, homepage, footer and styles.
The front page shows your latest published posts. Add featured images for the editorial grid.
Create categories named Guides, Ecosystem, DeFi, Builders, Culture and Security, or edit the Topic navigation pattern links.
Use the Site Editor to remove or edit the Powered by gonk.fun footer. Nothing is locked.
No plugins, API keys, external fonts, analytics, wallet access or subscriptions required.

== Credits ==
Design, CSS, scripts and abstract SVG artwork: Gonk Themes, GPL-2.0-or-later.
System fonts use the visitor's operating system fonts; no font files are distributed.

== Changelog ==
= 1.0.0 =
Initial release: editorial homepage, native posts, archives, search, comments, page and 404 templates; five original block patterns; local assets; dark/paper reader modes.
''')
shutil.copy2('/usr/share/common-licenses/GPL-2',T/'LICENSE')
print('Built native WordPress block theme: 7 templates, 3 parts, 5 patterns.')
