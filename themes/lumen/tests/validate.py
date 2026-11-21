"""Check Lumen's Gutenberg templates, Blogger XML and ZIP contents."""
import hashlib
import json
import re
import struct
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
wp = root / "wordpress/lumen"
xml = root / "blogger/lumen-blogger.xml"
assert json.loads((wp / "theme.json").read_text())["version"] == 3
assert "Contributors: amoghacloud" in (wp / "readme.txt").read_text()
assert 'rel="nofollow"' in (wp / "parts/footer.html").read_text()
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
ns = {"b": "http://www.google.com/2005/gml/b", "h": "http://www.w3.org/1999/xhtml"}
blog = ET.parse(xml).getroot()
sections = blog.findall(".//b:section", ns)
widgets = blog.findall(".//b:widget", ns)
identifiers = [node.attrib["id"] for node in sections + widgets]
assert len(identifiers) == len(set(identifiers))
assert {node.attrib["type"] for node in widgets} == {"Blog", "Label", "PageList"}
assert blog.find(".//b:include[@name='all-head-content']", ns) is not None
assert blog.find(".//h:a[@rel='nofollow']", ns) is not None
assert "data:position == 0" in xml.read_text()
assert blog.find(".//h:div[@id='lumen-navigation']", ns) is not None
assert 'id="lumen-navigation"' in (wp / "parts/header.html").read_text()
assert 'lm-shell' in (wp / "templates/home.html").read_text()
assert (root / "shared/lumen.js").read_text() in xml.read_text()
assert "prefers-color-scheme: dark" in (root / "shared/lumen.css").read_text()

releases = root / "releases"
for line in (releases / "SHA256SUMS.txt").read_text().splitlines():
    checksum, name = line.split("  ", 1)
    assert checksum == hashlib.sha256((releases / name).read_bytes()).hexdigest()
    with ZipFile(releases / name) as archive:
        assert archive.testzip() is None
        if "-blogger-" in name:
            assert set(archive.namelist()) == {"lumen-blogger.xml", "INSTALL.md", "LICENSE"}
            assert archive.read("lumen-blogger.xml") == xml.read_bytes()
        else:
            files = {f"lumen/{p.relative_to(wp)}": p for p in wp.rglob("*") if p.is_file()}
            assert set(archive.namelist()) == set(files)
            assert all(archive.read(name) == file.read_bytes() for name, file in files.items())
print("Lumen: native templates, appearance, packaging and checksums verified.")
