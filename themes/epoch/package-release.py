from pathlib import Path
import zipfile,hashlib,shutil,json
R=Path(__file__).resolve().parent;dest=R/'releases';dest.mkdir(exist_ok=True)
wp=R/'wordpress/epoch'
with zipfile.ZipFile(dest/'epoch-wordpress-1.0.0.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(wp.rglob('*')):
  if p.is_file():z.write(p,Path('epoch')/p.relative_to(wp))
with zipfile.ZipFile(dest/'epoch-blogger-1.0.0.zip','w',zipfile.ZIP_DEFLATED) as z:

 for p in sorted((R/'blogger/assets').glob('*')):z.write(p,'assets/'+p.name)
 z.write(R/'blogger/epoch-blogger.xml','epoch-blogger.xml');z.write(R/'LICENSE','LICENSE');z.write(R/'docs/BLOGGER.md','INSTALL.md')
checksums=[]
for p in sorted(dest.glob('*.zip')):checksums.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name)
(dest/'SHA256SUMS.txt').write_text('\n'.join(checksums)+'\n')
print('Packaged Blogger XML + WordPress ZIP with checksums. No uploads or publication performed.')
