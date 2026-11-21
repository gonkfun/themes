from pathlib import Path
import json,re,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];checks=[]
def ok(name,condition):
 assert condition,name
 checks.append(name)
p=R/'blogger/epoch-blogger.xml';root=ET.parse(p).getroot();ns={'b':'http://www.google.com/2005/gml/b'}
widgets=root.findall('.//b:widget',ns);sections=root.findall('.//b:section',ns)
ids=[e.get('id') for e in widgets+sections]
ok('Blogger XML parses; widget and section IDs unique',len(ids)==len(set(ids)))
ok('Blogger post widget present',any(x.get('type')=='Blog' for x in widgets))
ok('Blogger sections contain only widgets',all(all(c.tag=='{'+ns['b']+'}widget' for c in s) for s in sections))
s=p.read_text();ok('Blogger credit is removable and nofollow','Powered by <a href="https://gonk.fun/" rel="nofollow">gonk.fun</a>' in s)
ok('Blogger artwork is self-contained', 'data:image/svg+xml;base64,' in s)
wp=R/'wordpress/epoch';theme=json.loads((wp/'theme.json').read_text());ok('WordPress theme schema version',theme['version']==3)
for name in ['index','home','single','page','search','archive','404']:
 t=wp/'templates'/f'{name}.html';ok('WordPress template '+name,t.exists())
 text=t.read_text();stack=[]
 for m in re.finditer(r'<!--\s*(/?)wp:([\w/-]+)(.*?)-->',text,re.S):
  closing,block,tail=m.groups()
  if closing:ok('Block closing tag '+name+'/'+block,bool(stack) and stack.pop()==block)
  elif not tail.rstrip().endswith('/'):stack.append(block)
 ok('Balanced blocks '+name,not stack)
ok('No private runtime dependencies',all('http://localhost' not in p.read_text() for p in wp.glob('**/*.php')))
for p in list(wp.glob('**/*.php'))+list(wp.glob('**/*.js')):
 ok('No secrets or remote execution '+p.name,not re.search(r'\b(?:eval|shell_exec|base64_decode)\s*\(|sk-[A-Za-z0-9]{20,}|xai-[A-Za-z0-9]{20,}',p.read_text()))
css=(R/'shared/epoch.css').read_text();ok('Owner-approved charcoal-blue tokens','--ep-bg:#101216' in css and '--ep-accent:#8fbaff' in css)
ok('Explicit native navigation spacing','wp-block-page-list{gap:24px' in css)
ok('Reduced-motion and print styles','prefers-reduced-motion' in css and '@media print' in css)
ok('No font/CDN requests',not re.search(r'https?://',css))
s=(R/'blogger/epoch-blogger.xml').read_text()
ok('Blogger CDATA markers are JavaScript comments','//<![CDATA[' in s and '//]]>' in s)
ok('Custom SVG favicon embedded',"rel='icon' sizes='any'" in s and 'data:image/svg+xml;base64,' in s)
ok('Native SEO include retained once',s.count('name="all-head-content"')==1)
ok('Twitter card metadata present',"name='twitter:card'" in s)
ok('Default Blogger gadgets hidden', '.widget:not(.Blog):not(.Label):not(.BlogArchive)' in s)
ok('Uploadable favicon is included',(R/'blogger/assets/epoch-favicon-96.png').exists())
report={'checks':len(checks),'result':'passed','items':checks,'bloggerHomepageVerified':(R/'tests/blogger-results.json').exists(),'bloggerPostsAndCommentsVerified':False}
(R/'tests/validation-results.json').write_text(json.dumps(report,indent=2))
print(f'{len(checks)} structural and distribution checks passed. Blogger homepage verification is recorded separately; post/comment pages remain unverified.')
