"""Validate the native templates, static preview manifest and three release archives."""
import hashlib
import json
import re
import struct
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
wp = root / "wordpress/panelwork"
react = root / "react"
blogger = root / "blogger/panelwork-blogger.xml"
releases = root / "releases"

assert json.loads((wp / "theme.json").read_text())["version"] == 3
assert "Contributors: amoghacloud" in (wp / "readme.txt").read_text()
assert struct.unpack(">II", (wp / "screenshot.png").read_bytes()[16:24]) == (1200, 900)
for name in ("home", "index", "single", "page", "archive", "search", "404"):
    markup = (wp / "templates" / f"{name}.html").read_text()
    stack = []
    for close, tag, tail in re.findall(r"<!-- (/?)wp:([\w/-]+)(.*?)-->", markup, re.S):
        if close:
            assert stack and stack.pop() == tag, name
        elif not tail.rstrip().endswith("/"):
            stack.append(tag)
    assert not stack, name
assert 'data-pw-metrics' in (wp / "templates/home.html").read_text()
assert 'rel="nofollow"' in (wp / "parts/footer.html").read_text()

ns = {"b": "http://www.google.com/2005/gml/b", "h": "http://www.w3.org/1999/xhtml"}
blog = ET.parse(blogger).getroot()
widgets = blog.findall(".//b:widget", ns)
sections = blog.findall(".//b:section", ns)
ids = [node.attrib["id"] for node in sections + widgets]
assert len(ids) == len(set(ids))
assert {node.attrib["type"] for node in widgets} == {"Blog", "Label", "PageList"}
assert blog.find(".//b:include[@name='all-head-content']", ns) is not None
assert blog.find(".//h:a[@rel='nofollow']", ns) is not None
assert 'data:post.timestampISO8601' in blogger.read_text()
assert 'data-pw-list' in blogger.read_text()
for asset in ("dashboard-data.js", "panelwork.css", "posts.json"):
    assert (root / "shared" / asset).read_bytes() == (react / "src" / asset).read_bytes()
assert (root / "preview/react/index.html").is_file()

checksums = dict(reversed(line.split("  ", 1)) for line in (releases / "SHA256SUMS.txt").read_text().splitlines())
expected = {"panelwork-blogger-1.0.0.zip", "panelwork-wordpress-1.0.0.zip", "panelwork-react-1.0.0.zip"}
assert set(checksums) == expected
for name, digest in checksums.items():
    assert hashlib.sha256((releases / name).read_bytes()).hexdigest() == digest
    with ZipFile(releases / name) as archive:
        assert archive.testzip() is None
        names = set(archive.namelist())
        if "-blogger-" in name:
            assert names == {"panelwork-blogger.xml", "INSTALL.md", "LICENSE"}
            assert archive.read(blogger.name) == blogger.read_bytes()
        elif "-wordpress-" in name:
            files = {f"panelwork/{p.relative_to(wp)}": p for p in wp.rglob("*") if p.is_file()}
            assert names == set(files)
            assert all(archive.read(entry) == file.read_bytes() for entry, file in files.items())
        else:
            files = {p for p in (react / "src").rglob("*") if p.is_file()}
            files.update(react / name for name in ("README.md", "LICENSE", "REACT-LICENSE.txt",
                                                    "index.html", "package.json", "package-lock.json"))
            assert names == {f"panelwork-react/{p.relative_to(react)}" for p in files}
            assert all(archive.read(f"panelwork-react/{p.relative_to(react)}") == p.read_bytes() for p in files)
print("Panelwork: Blogger, WordPress and React source archives verified.")
