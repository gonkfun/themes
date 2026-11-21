#!/usr/bin/env python3
"""Package Fieldnote release ZIPs with checksums. No uploads or publication."""
from pathlib import Path
import zipfile, hashlib
R = Path(__file__).resolve().parent; dest = R/'releases'; dest.mkdir(exist_ok=True); V = '1.0.0'
wp = R/'wordpress/fieldnote'
with zipfile.ZipFile(dest/f'fieldnote-wordpress-{V}.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(wp.rglob('*')):
        if p.is_file(): z.write(p, Path('fieldnote')/p.relative_to(wp))
with zipfile.ZipFile(dest/f'fieldnote-blogger-{V}.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted((R/'blogger/assets').glob('*')): z.write(p, 'assets/' + p.name)
    z.write(R/'blogger/fieldnote-blogger.xml', 'fieldnote-blogger.xml'); z.write(R/'LICENSE', 'LICENSE'); z.write(R/'docs/BLOGGER.md', 'INSTALL.md')
(dest/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name + '\n' for p in sorted(dest.glob('*.zip'))))
print('Packaged Blogger XML + WordPress ZIP with checksums. No uploads or publication performed.')
