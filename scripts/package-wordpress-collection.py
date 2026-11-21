"""Package installable themes; keep previews, fixtures and build tooling out of the ZIP."""
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for entry in json.loads((ROOT / "scripts/wordpress-collection.json").read_text()):
    slug = entry["id"]
    directory = ROOT / "themes" / slug
    release = directory / "releases"
    release.mkdir(exist_ok=True)
    source = directory / "wordpress" / slug
    assert (source / "screenshot.png").is_file(), slug
    archive = release / f"{slug}-wordpress-1.0.0.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as package:
        for file in sorted(source.rglob("*")):
            if file.is_file():
                package.write(file, Path(slug) / file.relative_to(source))
    (release / "SHA256SUMS.txt").write_text(f"{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n")
