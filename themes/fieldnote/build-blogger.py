#!/usr/bin/env python3
"""Fieldnote: self-contained Blogger XML theme. Native posts, labels, search, pagination, comments and widgets."""
from pathlib import Path
import json, base64
R = Path(__file__).resolve().parent; F = json.loads((R/'shared/fragments.json').read_text())
css = (R/'preview/assets/fieldnote.css').read_text()
css += '''
/* Blogger: keep the public surface Fieldnote-owned on restored blogs. */
.fn-blogger #navbar-iframe,.fn-blogger #navbar,.fn-blogger .navbar{display:none!important}
.fn-blogger .widget:not(.Blog):not(.Label):not(.BlogArchive):not(.HTML):not(.PageList):not(.Profile){display:none!important}
.fn-blogger .fn-kit .widget{margin:0}.fn-blogger .fn-kit .Header,.fn-blogger .fn-kit .BlogSearch{display:none}
.fn-blogger .fn-footer .PageList h2{display:none}.fn-blogger .fn-footer .PageList ul{gap:20px}.fn-blogger .fn-footer .PageList a{border:0;background:none;padding:0}
body#layout .fn-lead-entry,body#layout .fn-season,body#layout .fn-guide,body#layout .fn-banner{display:none}body#layout .fn-content-grid{display:block}body#layout .widget{display:block!important}body#layout .section{min-height:80px;margin:15px}
'''
js = (R/'shared/fieldnote.js').read_text()
def art(name): return 'data:image/svg+xml;base64,' + base64.b64encode((R/'shared/assets'/f'{name}.svg').read_bytes()).decode()
def link(path): return f"expr:href='data:blog.homepageUrl + &quot;{path}&quot;'"
def convert(fragment):
    return (fragment.replace('href="NOTES"', link('search/label/Notes')).replace('href="ABOUT"', link('p/about.html')).replace('href="FEED"', link('feeds/posts/default?alt=rss'))
            .replace('src="ART/fern.svg"', f'src="{art("fern")}"'))
lead, banner, notebook, rss = (convert(F[k]) for k in ['lead', 'banner', 'notebook', 'rss'])
icon = base64.b64encode((R/'shared/assets/fieldnote-favicon.svg').read_bytes()).decode()
mark = F['brand'].split('</span><span class="fn-brand-text">')[0] + '</span>'
brand = mark + '<span class="fn-brand-text"><b><data:blog.title/></b><small><data:blog.description/></small></span>'
nav = ''.join(f'<a {link(path)}>{name}</a>' for name, path in [('Journal', ''), ('Birds', 'search/label/Birds'), ('Plants', 'search/label/Plants'), ('Trails', 'search/label/Trails')])
seo = f"""<link href='data:image/svg+xml;base64,{icon}' rel='icon' sizes='any' type='image/svg+xml'/>
<meta content='#f3eee2' name='theme-color'/>
<b:if cond='not data:blog.metaDescription'><b:if cond='data:blog.description'><meta expr:content='data:blog.description' name='description'/></b:if></b:if>
<meta expr:content='data:blog.title' property='og:site_name'/>
<b:if cond='data:blog.pageType == &quot;item&quot;'><meta content='article' property='og:type'/><b:else/><meta content='website' property='og:type'/></b:if>
<b:if cond='data:blog.postImageUrl'><meta content='summary_large_image' name='twitter:card'/><meta expr:content='data:blog.postImageUrl' name='twitter:image'/><b:else/><meta content='summary' name='twitter:card'/></b:if>
<meta expr:content='data:blog.pageTitle' name='twitter:title'/>"""
xml = '''<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:version="2" class="v2" expr:dir="data:blog.languageDirection" xmlns="http://www.w3.org/1999/xhtml" xmlns:b="http://www.google.com/2005/gml/b" xmlns:data="http://www.google.com/2005/gml/data" xmlns:expr="http://www.google.com/2005/gml/expr">
<head><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="light dark" name="color-scheme"/><b:include data="blog" name="all-head-content"/><title><data:blog.pageTitle/></title>''' + seo + '''<b:skin><![CDATA[
''' + css + '''
]]></b:skin></head><body class="fn-blogger"><a class="fn-skip" href="#content">Skip to entries</a>
<header class="fn-header"><div class="fn-wrap fn-header-inner"><a class="fn-brand" expr:href="data:blog.homepageUrl">''' + brand + '''</a><nav aria-label="Main navigation" class="fn-nav">''' + nav + '''</nav><div class="fn-tools">''' + F['toggle'] + '''<details class="fn-mobile"><summary>Menu</summary><nav aria-label="Mobile navigation">''' + nav + '''</nav></details></div></div></header>
<div class="fn-wrap"><b:if cond="data:blog.url == data:blog.homepageUrl">''' + lead + '''</b:if>
''' + F['season'] + '''
<nav aria-label="Field guide topics" class="fn-guide"><span>FIELD GUIDE</span>''' + ''.join(f'<a class="fn-chip" {link("search/label/" + t)}>{t}</a>' for t in F['topics']) + '''</nav>
<div class="fn-content-grid"><main id="content" tabindex="-1">
<b:section class="main" id="main" maxwidgets="1" showaddelement="no"><b:widget id="Blog1" locked="yes" mobile="yes" title="Blog Posts" type="Blog" version="1">
<b:includable id="main" var="top">
 <b:if cond='data:blog.pageType == "item" or data:blog.pageType == "static_page"'>
  <b:loop values="data:posts" var="post"><article class="fn-article">
   <nav aria-label="Breadcrumb" class="fn-breadcrumb"><a expr:href="data:blog.homepageUrl">Journal</a><span aria-hidden="true">/</span><span><data:post.title/></span></nav>
   <div class="fn-kicker"><b:loop values="data:post.labels" var="label"><b:if cond="data:label.isLast"><data:label.name/></b:if></b:loop></div>
   <h1><data:post.title/></h1>
   <div class="fn-entry-meta"><span><data:post.author/></span><span>Written <data:post.timestamp/></span></div>
   <div class="fn-prose post-body entry-content" expr:id='"post-body-" + data:post.id'><data:post.body/></div>
   <div class="fn-share"><button data-fieldnote-copy="" hidden="hidden">Copy link</button></div>
   <b:if cond="data:post.allowComments"><b:include data="post" name="comments"/></b:if>
  </article></b:loop>
 <b:else/>
  <div class="fn-section-heading" id="entries"><h2>Recent entries</h2><p>FROM THE NOTEBOOK</p></div>
  <b:if cond="data:blog.searchQuery"><p class="fn-standfirst">Search: <data:blog.searchQuery/></p></b:if>
  <b:if cond="data:blog.searchLabel"><p class="fn-standfirst">Subject: <data:blog.searchLabel/></p></b:if>
  <div class="fn-cards"><b:loop values="data:posts" var="post"><article class="fn-card">
   <a aria-hidden="true" class="fn-card-art" expr:href="data:post.url" tabindex="-1"><b:if cond="data:post.firstImageUrl"><img alt="" expr:src="data:post.firstImageUrl" height="500" loading="lazy" width="800" style="object-fit:cover;padding:0"/><b:else/><img alt="" height="300" loading="lazy" src="''' + art('oak') + '''" width="400"/></b:if></a>
   <b:loop values="data:post.labels" var="label"><b:if cond="data:label.isLast"><a class="fn-tag" expr:href="data:label.url"><data:label.name/></a></b:if></b:loop>
   <h3><a expr:href="data:post.url"><data:post.title/></a></h3>
   <p><b:eval expr='snippet(data:post.body, {length: 140, links: false, linebreaks: false})'/></p>
   <div class="fn-observed"><span><data:post.timestamp/></span><span><data:post.author/></span></div>
  </article></b:loop></div>
  <b:if cond="data:posts.empty"><div class="fn-empty"><h2>No entries here yet.</h2><p>Try another search or browse a different subject.</p></div></b:if>
  <nav aria-label="Entry pagination" class="fn-pagination"><b:if cond="data:newerPageUrl"><a expr:href="data:newerPageUrl">← Newer entries</a></b:if><b:if cond="data:olderPageUrl"><a expr:href="data:olderPageUrl">Older entries →</a></b:if></nav>
 </b:if>
</b:includable>
</b:widget></b:section></main>
<aside aria-label="Field kit" class="fn-kit"><form class="fn-search" expr:action='data:blog.homepageUrl + "search"' method="get" role="search"><label class="fn-sr" for="fn-search">Search entries</label><input id="fn-search" name="q" placeholder="Search the journal…" type="search"/><button aria-label="Search entries" type="submit">→</button></form>''' + notebook + '''
<b:section class="sidebar" id="sidebar" showaddelement="yes"><b:widget id="Label1" locked="no" mobile="yes" title="Browse by subject" type="Label" version="1"/><b:widget id="BlogArchive1" locked="no" mobile="yes" title="From the archive" type="BlogArchive" version="1"/><b:widget id="HTML1" locked="no" mobile="yes" title="Field links" type="HTML" version="1"/></b:section>
''' + rss + '''</aside></div>''' + banner + '''</div>
<footer class="fn-footer"><div class="fn-wrap"><div class="fn-footer-top"><div><a class="fn-brand" expr:href="data:blog.homepageUrl">''' + brand + '''</a><p>A journal of small observations: birds, plants, weather and the paths between them.</p></div><div><b:section class="footer" id="footer" showaddelement="yes"><b:widget id="PageList1" locked="no" mobile="yes" title="Pages" type="PageList" version="1"/></b:section></div></div><div class="fn-footer-bottom"><span>Written outdoors. No tracking, no ads.</span><span class="fn-credit">Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a></span></div></div></footer>
<script type="text/javascript">//<![CDATA[
''' + js + '''
//]]></script></body></html>'''
(R/'blogger').mkdir(exist_ok=True)
(R/'blogger/fieldnote-blogger.xml').write_text(xml)
print('Built self-contained Blogger XML with dynamic entries, labels, search, pagination and native comments.')
