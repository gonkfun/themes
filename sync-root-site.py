"""Generate the organisation homepage from this repository's catalogue.
Usage: python3 sync-root-site.py /path/to/gonkfun.github.io-checkout
Review and commit that checkout separately; no credentials are stored here.
"""
from pathlib import Path
import sys,json,shutil
root=Path(__file__).resolve().parent
if len(sys.argv)!=2:raise SystemExit('Supply the separate organisation-site checkout directory.')
output=Path(sys.argv[1]).resolve();output.mkdir(parents=True,exist_ok=True)
source=(root/'docs/index.html').read_text().replace('https://gonkfun.github.io/themes/','https://gonkfun.github.io/')
for item in json.loads((root/'catalog.json').read_text()):
 preview=item['id']+'/'+item.get('previewPath','')
 source=source.replace(f'href="{preview}"',f'href="/themes/{preview}"')
(output/'index.html').write_text(source)
shutil.copytree(root/'docs/assets',output/'assets',dirs_exist_ok=True)
(output/'.nojekyll').write_text('')
shutil.copy2(root/'LICENSE',output/'LICENSE')
print('Generated organisation catalogue; previews remain under /themes/<slug>/.')
