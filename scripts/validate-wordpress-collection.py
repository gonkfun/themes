"""Validate source and installable ZIPs for the four WordPress themes."""
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for entry in json.loads((ROOT / "scripts/wordpress-collection.json").read_text()):
    slug = entry["id"]
    theme = ROOT / "themes" / slug
    source = theme / "wordpress" / slug
    assert json.loads((source / "theme.json").read_text())["version"] == 3
    assert f"Text Domain: {slug}" in (source / "style.css").read_text()
    assert "Contributors: amoghacloud" in (source / "readme.txt").read_text()
    assert 'rel="nofollow"' in (source / "parts/footer.html").read_text()
    for template in ("index", "home", "page", "single", "archive", "search", "404"):
        markup = (source / "templates" / f"{template}.html").read_text()
        stack = []
        for close, name, ending in re.findall(r"<!-- (/?)wp:([a-z0-9/-]+)(.*?)-->", markup, re.S):
            if close:
                assert stack and stack.pop() == name, (slug, template, name)
            elif not ending.rstrip().endswith("/"):
                stack.append(name)
        assert not stack, (slug, template)
    assets = [p for p in source.rglob("*") if p.is_file()]
    release = theme / "releases" / f"{slug}-wordpress-1.0.0.zip"
    with zipfile.ZipFile(release) as package:
        assert package.testzip() is None
        assert set(package.namelist()) == {f"{slug}/{p.relative_to(source)}" for p in assets}
        assert all(package.read(f"{slug}/{p.relative_to(source)}") == p.read_bytes() for p in assets)
    print(f"{slug}: metadata, block templates and archive verified")
