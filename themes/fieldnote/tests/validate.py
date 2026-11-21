#!/usr/bin/env python3
"""Fieldnote structural, privacy and distribution checks (run in CI)."""
from pathlib import Path
import json, re, xml.etree.ElementTree as ET
R = Path(__file__).resolve().parents[1]; checks = []
def ok(name, condition):
    assert condition, name
    checks.append(name)
p = R/'blogger/fieldnote-blogger.xml'; root = ET.parse(p).getroot(); ns = {'b': 'http://www.google.com/2005/gml/b'}
widgets = root.findall('.//b:widget', ns); sections = root.findall('.//b:section', ns); ids = [e.get('id') for e in widgets + sections]
ok('Blogger XML parses; widget and section IDs unique', len(ids) == len(set(ids)))
ok('Blogger post widget present', any(x.get('type') == 'Blog' for x in widgets))
ok('Blogger sections contain only widgets', all(all(c.tag == '{' + ns['b'] + '}widget' for c in s) for s in sections))
s = p.read_text()
ok('Blogger credit is removable and nofollow', 'Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a>' in s)
ok('Blogger artwork is self-contained', 'data:image/svg+xml;base64,' in s)
ok('Blogger CDATA markers are JavaScript comments', '//<![CDATA[' in s and '//]]>' in s)
ok('Native SEO include retained once', s.count('name="all-head-content"') == 1)
ok('Default Blogger gadgets hidden', '.widget:not(.Blog):not(.Label)' in s)
wp = R/'wordpress/fieldnote'; theme = json.loads((wp/'theme.json').read_text())
ok('WordPress theme.json schema version 3', theme['version'] == 3)
for name in ['index', 'home', 'single', 'page', 'search', 'archive', '404']:
    t = wp/'templates'/f'{name}.html'; ok('WordPress template ' + name, t.exists())
    text = t.read_text(); stack = []
    for m in re.finditer(r'<!--\s*(/?)wp:([\w/-]+)(.*?)-->', text, re.S):
        closing, block, tail = m.groups()
        if closing: ok('Block closing tag ' + name + '/' + block, bool(stack) and stack.pop() == block)
        elif not tail.rstrip().endswith('/'): stack.append(block)
    ok('Balanced blocks ' + name, not stack)
for part in ['header', 'footer', 'kit']: ok('WordPress part ' + part, (wp/'parts'/f'{part}.html').exists())
ok('WordPress credit is removable and nofollow', 'rel="nofollow">gonk.fun</a>' in (wp/'parts/footer.html').read_text())
ok('WordPress style.css header', 'Theme Name: Fieldnote' in (wp/'style.css').read_text())
ok('Patterns guard direct access', all("defined( 'ABSPATH' )" in f.read_text() for f in (wp/'patterns').glob('*.php')))
for f in list(wp.glob('**/*.php')) + list(wp.glob('**/*.js')):
    ok('No secrets or remote execution ' + f.name, not re.search(r'\b(?:eval|shell_exec|base64_decode)\s*\(|sk-[A-Za-z0-9]{20,}', f.read_text()))
css = (R/'shared/fieldnote.css').read_text()
ok('Paper/ink/moss design tokens', '--fn-paper:#f3eee2' in css and '--fn-moss:#3d5a36' in css)
ok('Dusk reading mode', 'data-fieldnote-mode=dusk' in css)
ok('Reduced-motion and print styles', 'prefers-reduced-motion' in css and '@media print' in css)
ok('Minimum 44px tap targets declared', css.count('min-height:44px') >= 8)
ok('No font or CDN requests in CSS', not re.search(r'https?://', css))
js = (R/'shared/fieldnote.js').read_text()
ok('No network calls in JS', not re.search(r'\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b', js))
for svg in (R/'shared/assets').glob('*.svg'):
    t = svg.read_text(); ok('Artwork is plain SVG (no scripts/links) ' + svg.name, '<script' not in t and 'href' not in t)
for page in ['index', 'archive', 'article', 'about', '404']:
    h = (R/'preview'/f'{page}.html').read_text(); ok('Preview has exactly one h1 ' + page, len(re.findall(r'<h1[\s>]', h)) == 1)
report = {'checks': len(checks), 'result': 'passed', 'items': checks, 'bloggerLiveVerified': False, 'wordpressLiveVerified': False}
(R/'tests/validation-results.json').write_text(json.dumps(report, indent=2))
print(f'{len(checks)} structural, privacy and distribution checks passed. Live Blogger/WordPress installs are not yet verified.')
