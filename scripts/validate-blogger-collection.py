"""Check native Blogger widget structure, archive contents and build consistency."""
import hashlib
import json
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOGGER = "http://www.google.com/2005/gml/b"
DATA = "http://www.google.com/2005/gml/data"
NS = {"b": BLOGGER, "data": DATA}

for theme in json.loads((ROOT / "scripts/wordpress-collection.json").read_text()):
    slug = theme["id"]
    folder = ROOT / "themes" / slug
    file = folder / "blogger" / f"{slug}-blogger.xml"
    root = ET.parse(file).getroot()
    sections = root.findall(".//b:section", NS)
    widgets = root.findall(".//b:widget", NS)
    identifiers = [element.attrib["id"] for element in sections + widgets]
    assert len(identifiers) == len(set(identifiers)), slug
    assert all(all(child.tag == f"{{{BLOGGER}}}widget" for child in section) for section in sections)
    post_widget, = [widget for widget in widgets if widget.attrib["type"] == "Blog"]
    assert post_widget.attrib["locked"] == "yes"
    native_tags = {node.tag for node in post_widget.iter() if node.tag.startswith(f"{{{DATA}}}")}
    assert {f"{{{DATA}}}{name}" for name in ("post.body", "post.title", "label.name", "comment.body")} <= native_tags
    widget_templates = {node.attrib["id"] for node in post_widget.findall("b:includable", NS)}
    assert widget_templates == {"main", "collectionLabels", "collectionComments"}
    assert not root.findall(".//{http://www.w3.org/1999/xhtml}script")
    native_heads = [include for include in root.findall(".//b:include", NS) if include.get("name") == "all-head-content"]
    assert len(native_heads) == 1
    assert root.find(".//{http://www.w3.org/1999/xhtml}a[@rel='nofollow']") is not None
    assert (folder / "preview/theme.css").read_text() in root.find(".//b:skin", NS).text
    release = folder / "releases"
    with zipfile.ZipFile(release / f"{slug}-blogger-1.0.0.zip") as package:
        assert package.testzip() is None
        assert set(package.namelist()) == {file.name, "INSTALL.md", "LICENSE"}
        assert package.read(file.name) == file.read_bytes()
    for line in (release / "SHA256SUMS.txt").read_text().splitlines():
        checksum, filename = line.split("  ", 1)
        assert checksum == hashlib.sha256((release / filename).read_bytes()).hexdigest(), filename
    print(f"{slug}: Blogger XML, widgets and downloadable package verified")
