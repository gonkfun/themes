from pathlib import Path
import json,base64,html
R=Path(__file__).resolve().parent;F=json.loads((R/'shared/fragments.json').read_text())
css=(R/'preview/assets/epoch.css').read_text();art=base64.b64encode((R/'shared/assets/orbital.svg').read_bytes()).decode();css=css.replace("url('orbital.svg')",f"url('data:image/svg+xml;base64,{art}')")
css += """
/* Keep the public surface entirely Epoch-owned, including on restored blogs. */
.ep-blogger #navbar-iframe,.ep-blogger #navbar,.ep-blogger .navbar,.ep-blogger .Attribution{display:none!important}
.ep-blogger .widget:not(.Blog):not(.Label):not(.BlogArchive):not(.HTML):not(.PageList){display:none!important}
.ep-blogger .ep-rail .widget{margin-block:0 28px}
.ep-blogger .ep-rail .widget:last-child{margin-bottom:0}
/* Blogger may carry widgets from the previous theme into the new sidebar. */
.ep-blogger .ep-rail .Header,.ep-blogger .ep-rail .BlogSearch{display:none}
.ep-blogger .ep-rail .Profile{padding:22px;border:1px solid var(--ep-line);border-radius:12px;background:var(--ep-card)}
.ep-blogger .ep-rail .Profile h2{margin:0 0 16px;font-size:18px}
.ep-blogger .ep-rail .Profile img{width:48px;height:48px;object-fit:cover;border-radius:50%;margin-inline-end:12px}
.ep-blogger .ep-rail .Profile .profile-img{float:inline-start}
.ep-blogger .ep-rail .Profile .profile-textblock,.ep-blogger .ep-rail .Profile .profile-link{font-size:13px;line-height:1.7}
.ep-blogger .ep-rail .Profile .widget-content{display:flow-root}
.ep-blogger .ep-rail .HTML h2{margin-bottom:16px}
.ep-blogger .ep-rail .HTML .widget-content{font-size:14px;line-height:1.8;overflow-wrap:anywhere}
.ep-blogger .ep-rail .HTML a{display:inline-flex;align-items:center;min-height:44px;color:var(--ep-accent)}
.ep-blogger .ep-rail .ReportAbuse{font-size:12px;border-top:1px solid var(--ep-line);padding-top:16px}
.ep-blogger .ep-footer .PageList h2{display:none}
.ep-blogger .ep-footer .PageList ul{gap:20px;margin:0;padding:0;display:flex;flex-wrap:wrap}
.ep-blogger .ep-footer .PageList a{min-height:44px;display:inline-flex;align-items:center;text-decoration:none}
.ep-blogger .ep-footer .Attribution{margin-top:16px;font-size:11px;color:var(--ep-muted)}
body#layout .widget{display:block!important}
"""
css+='\nbody#layout .ep-hero,body#layout .ep-topics,body#layout .ep-banner{display:none}body#layout .ep-content-grid{display:block}body#layout .ep-rail{padding:0;border:0}body#layout .section{min-height:80px;margin:15px}\n'
js=(R/'shared/epoch.js').read_text()+"\nif(document.body.id!=='layout'){for(const widget of document.querySelectorAll('.ep-rail .HTML')){const content=widget.querySelector('.widget-content');if(content&&!content.textContent.trim()&&!content.querySelector('img,iframe,video,a'))widget.hidden=true;}}\n"
# XML expressions use native Blogger data. No API dependency or private code.
base='data:blog.homepageUrl'
def link(path):return f"expr:href='data:blog.homepageUrl + &quot;{path}&quot;'"
def convert(fragment):
 return fragment.replace('href="GUIDES"',link('search/label/Guides')).replace('href="SECURITY"',link('search/label/Security'))
hero=convert(F['hero']);banner=convert(F['banner']);notes=convert(F['notes'])
icon=base64.b64encode((R/'blogger/assets/epoch-favicon.svg').read_bytes()).decode()
seo="""
<!-- Native all-head-content above owns canonical, OG title/URL/description and owner-controlled robots metadata. -->
<link href='data:image/svg+xml;base64,FAVICON_DATA' rel='icon' sizes='any' type='image/svg+xml'/>
<meta content='#101216' name='theme-color'/>
<b:if cond='not data:blog.metaDescription'>
 <b:if cond='data:blog.description'><meta expr:content='data:blog.description' name='description'/><b:else/><meta expr:content='data:blog.title + &quot; — independent Solana stories, guides and community perspectives.&quot;' name='description'/></b:if>
</b:if>
<meta expr:content='data:blog.title' property='og:site_name'/>
<b:if cond='data:blog.pageType == &quot;item&quot;'><meta content='article' property='og:type'/><b:else/><meta content='website' property='og:type'/></b:if>
<meta expr:content='data:blog.pageTitle' name='twitter:title'/>
<b:if cond='data:blog.metaDescription'><meta expr:content='data:blog.metaDescription' name='twitter:description'/><b:elseif cond='data:blog.description'/><meta expr:content='data:blog.description' name='twitter:description'/><b:else/><meta expr:content='data:blog.title + &quot; — independent Solana stories, guides and community perspectives.&quot;' name='twitter:description'/></b:if>
<!-- Optional homepage social card: replace the empty string with your publicly hosted image URL. -->
<b:with value='&quot;&quot;' var='epochDefaultImage'>
 <b:if cond='data:blog.postImageUrl'>
  <meta content='summary_large_image' name='twitter:card'/><meta expr:content='data:blog.postImageUrl' name='twitter:image'/>
 <b:elseif cond='data:epochDefaultImage'/>
  <meta content='summary_large_image' name='twitter:card'/><meta expr:content='data:epochDefaultImage' name='twitter:image'/><meta expr:content='data:epochDefaultImage' property='og:image'/>
 <b:else/><meta content='summary' name='twitter:card'/></b:if>
</b:with>
""".replace('FAVICON_DATA',icon)

toggle=F['toggle'].replace('hidden="hidden"','hidden="hidden"')
nav=''.join(f'<a {link(path)}>{name}</a>' for name,path in [('Journal',''),('Guides','search/label/Guides'),('Builders','search/label/Builders')])
brand='<span aria-hidden="true" class="ep-mark">E</span><span><data:blog.title/><small><data:blog.description/></small></span>'
xml='''<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:version="2" class="v2" expr:dir="data:blog.languageDirection" xmlns="http://www.w3.org/1999/xhtml" xmlns:b="http://www.google.com/2005/gml/b" xmlns:data="http://www.google.com/2005/gml/data" xmlns:expr="http://www.google.com/2005/gml/expr">
<head><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="dark light" name="color-scheme"/><b:include data="blog" name="all-head-content"/><title><data:blog.pageTitle/></title><b:skin><![CDATA[
'''+css+'''
]]></b:skin></head><body class="ep-blogger"><a class="ep-skip" href="#content">Skip to articles</a>
<header class="ep-header"><div class="ep-wrap ep-header-inner"><a class="ep-brand" expr:href="data:blog.homepageUrl">'''+brand+'''</a><nav aria-label="Main navigation" class="ep-nav">'''+nav+'''</nav><div class="ep-tools">'''+toggle+'''<details class="ep-mobile"><summary>Menu</summary><nav aria-label="Mobile navigation">'''+nav+'''</nav></details></div></div></header>
<div class="ep-wrap"><b:if cond="data:blog.url == data:blog.homepageUrl">'''+hero+'''</b:if>
<nav aria-label="Explore topics" class="ep-topics"><span>FIND YOUR SIGNAL</span>'''+''.join(f'<a class="ep-chip" {link("search/label/"+t)}>{t}</a>' for t in F['topics'])+'''</nav>
<div class="ep-content-grid"><main id="content" tabindex="-1">
<b:section class="main" id="main" maxwidgets="1" showaddelement="no"><b:widget id="Blog1" locked="yes" mobile="yes" title="Blog Posts" type="Blog" version="1">
<b:includable id="main" var="top">
 <b:if cond='data:blog.pageType == "item" or data:blog.pageType == "static_page"'>
  <b:loop values="data:posts" var="post"><article class="ep-article">
   <nav aria-label="Breadcrumb" class="ep-breadcrumb"><a expr:href="data:blog.homepageUrl">Journal</a><span aria-hidden="true">/</span><span><data:post.title/></span></nav>
   <div class="ep-meta"><b:loop values="data:post.labels" var="label"><a class="ep-category" expr:href="data:label.url"><data:label.name/></a></b:loop></div>
   <h1><data:post.title/></h1><div class="ep-meta"><span><data:post.author/></span><span><data:post.timestamp/></span></div>
   <div class="ep-prose post-body entry-content" expr:id='"post-body-" + data:post.id'><data:post.body/></div>
   <div class="ep-share"><button data-epoch-copy="" hidden="hidden">Copy article link</button></div>
   <b:if cond="data:post.allowComments"><b:include data="post" name="comments"/></b:if>
  </article></b:loop>
 <b:else/>
  <div class="ep-section-heading" id="latest"><h1 style="font-size:26px;margin:0;letter-spacing:-.9px">The journal<span style="color:var(--ep-accent)">.</span></h1><p>LATEST STORIES</p></div>
  <b:if cond="data:blog.searchQuery"><p class="ep-lead">Search results for: <data:blog.searchQuery/></p></b:if>
  <b:if cond="data:blog.searchLabel"><p class="ep-lead">Topic: <data:blog.searchLabel/></p></b:if>
  <div class="ep-card-grid"><b:loop values="data:posts" var="post"><article class="ep-card">
   <a aria-hidden="true" class="ep-card-image" expr:href="data:post.url" tabindex="-1"><b:if cond="data:post.firstImageUrl"><img alt="" expr:src="data:post.firstImageUrl" height="500" loading="lazy" width="800"/><b:else/><div class="ep-cover" style="width:100%;height:100%;border:0;border-radius:0"/></b:if></a>
   <div class="ep-meta"><b:loop values="data:post.labels" var="label"><b:if cond="data:label.isLast"><a class="ep-category" expr:href="data:label.url"><data:label.name/></a></b:if></b:loop></div>
   <h2 style="font-size:23px;line-height:1.3;letter-spacing:-.6px"><a expr:href="data:post.url" style="text-decoration:none"><data:post.title/></a></h2>
   <p><b:eval expr='snippet(data:post.body, {length: 150, links: false, linebreaks: false})'/></p>
   <div class="ep-byline"><span><data:post.author/></span><span aria-hidden="true">·</span><span><data:post.timestamp/></span></div>
  </article></b:loop></div>
  <b:if cond="data:posts.empty"><div class="ep-empty"><h2>No stories here yet.</h2><p>Try another search or explore a different topic.</p><a class="ep-button secondary" expr:href="data:blog.homepageUrl">Back to the journal</a></div></b:if>
  <nav aria-label="Post pagination" class="ep-pagination"><b:if cond="data:newerPageUrl"><a expr:href="data:newerPageUrl">← Newer stories</a></b:if><b:if cond="data:olderPageUrl"><a expr:href="data:olderPageUrl">Older stories →</a></b:if></nav>
 </b:if>
</b:includable>
</b:widget></b:section></main>
<aside aria-label="Reading sidebar" class="ep-rail"><form class="ep-search" expr:action='data:blog.homepageUrl + "search"' method="get" role="search"><label class="ep-sr" for="ep-search">Search articles</label><input id="ep-search" name="q" placeholder="Find a story…" type="search"/><button aria-label="Search articles" type="submit">↗</button></form>'''+notes+'''
<b:section class="sidebar" id="sidebar" showaddelement="yes"><b:widget id="Label1" locked="no" mobile="yes" title="Explore topics" type="Label" version="1"/><b:widget id="BlogArchive1" locked="no" mobile="yes" title="From the archive" type="BlogArchive" version="1"/><b:widget id="HTML1" locked="no" mobile="yes" title="Community links" type="HTML" version="1"/></b:section>
<section class="ep-rss"><h2>A feed, at your pace.</h2><p>Follow new posts in your favourite RSS reader. No algorithm deciding what you see.</p><a class="ep-button" '''+link('feeds/posts/default?alt=rss')+'''>Follow through RSS ↗</a></section></aside></div>'''+banner+'''</div>
<footer class="ep-footer"><div class="ep-wrap"><div class="ep-footer-top"><div><a class="ep-brand" expr:href="data:blog.homepageUrl">'''+brand+'''</a><p>An independent space for ideas, explanations and the people behind them.</p></div><div><b:section class="footer" id="footer" showaddelement="yes"><b:widget id="PageList1" locked="no" mobile="yes" title="Pages" type="PageList" version="1"/></b:section></div></div><div class="ep-footer-bottom"><span>Independent publishing. No wallet connection required.</span><span class="ep-credit">Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a></span></div></div></footer>
<script type="text/javascript">//<![CDATA[
'''+js+'''
//]]></script></body></html>'''
# There should be exactly one H1 on homepage; hero supplies it.
xml=xml.replace('<h1 style="font-size:26px;margin:0;letter-spacing:-.9px">The journal','<h2 style="font-size:26px;margin:0;letter-spacing:-.9px">The journal').replace('.</span></h1><p>LATEST STORIES','.</span></h2><p>LATEST STORIES')
xml=xml.replace('<title><data:blog.pageTitle/></title>', '<title><data:blog.pageTitle/></title>'+seo)
xml=xml.replace('<body class="ep-blogger">','<body class="ep-blogger" itemscope="itemscope" itemtype="https://schema.org/WebSite"><meta expr:content="data:blog.title" itemprop="name"/><meta expr:content="data:blog.homepageUrl" itemprop="url"/>')
xml=xml.replace('<main id="content" tabindex="-1">','<main id="content" tabindex="-1" itemscope="itemscope" itemtype="https://schema.org/Blog" itemprop="mainEntity">')
xml=xml.replace('<article class="ep-article">',"""<article class="ep-article" itemscope="itemscope" expr:itemtype='data:blog.pageType == &quot;item&quot; ? &quot;https://schema.org/BlogPosting&quot; : &quot;https://schema.org/WebPage&quot;' expr:itemprop='data:blog.pageType == &quot;item&quot; ? &quot;blogPost&quot; : &quot;hasPart&quot;'>""")
xml=xml.replace('<h1><data:post.title/></h1>','<h1 itemprop="headline"><data:post.title/></h1>')
xml=xml.replace('<span><data:post.author/></span><span><data:post.timestamp/></span>', '<span itemprop="author" itemscope="itemscope" itemtype="https://schema.org/Person"><span itemprop="name"><data:post.author/></span></span><span><data:post.timestamp/></span>')
xml=xml.replace('class="ep-prose post-body entry-content"','class="ep-prose post-body entry-content" itemprop="articleBody"')
(R/'blogger/epoch-blogger.xml').write_text(xml)
print('Built self-contained Blogger XML with dynamic posts, labels, search, pagination and native comments.')
