"""Verify the released Switchboard source and static preview."""
from hashlib import sha256
from io import BytesIO
from pathlib import Path, PurePosixPath
import json
import re
import struct
import zipfile

theme = Path(__file__).resolve().parents[1]
source = theme / "react"
preview = theme / "preview"
version = json.loads((source / "package.json").read_text())["version"]
archive_name = f"switchboard-react-{version}.zip"
archive = theme / "releases" / archive_name
expected = (theme / "releases" / "SHA256SUMS.txt").read_text().split()
assert expected == [sha256(archive.read_bytes()).hexdigest(), archive_name]
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    for name in package.namelist():
        path = PurePosixPath(name)
        assert not path.is_absolute() and ".." not in path.parts
        assert "node_modules" not in path.parts and not any(part.startswith(".env") for part in path.parts)
    for path in (source / "src").glob("*"):
        assert package.read(f"src/{path.name}") == path.read_bytes(), path
    for asset in ("package.json", "package-lock.json", "index.html"):
        assert package.read(asset) == (source / asset).read_bytes(), asset
    assert package.read("public/art/switchboard-art.webp").startswith(b"RIFF")
    assert package.read("README.md") and package.read("LICENSE") and package.read("THIRD_PARTY_LICENSES.txt")
screenshot = BytesIO((source / "screenshot.png").read_bytes())
assert screenshot.read(16).startswith(b"\x89PNG")
assert struct.unpack(">II", screenshot.read(8)) == (1200, 900)
html = (preview / "index.html").read_text()
assets = re.findall(r'["\']\./(assets/[^"\']+)', html)
assert len(assets) == 2 and all((preview / path).is_file() for path in assets)
assert (preview / "art" / "switchboard-art.webp").read_bytes() == (source / "public" / "art" / "switchboard-art.webp").read_bytes()
print(f"Switchboard {version}: source ZIP, checksum, screenshot, and preview verified")
