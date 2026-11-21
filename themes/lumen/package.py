"""Package the native themes and record release hashes."""
import hashlib
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RELEASES = ROOT / "releases"
RELEASES.mkdir(exist_ok=True)
WORDPRESS = ROOT / "wordpress/lumen"
assert (WORDPRESS / "screenshot.png").is_file(), "Capture the 1200x900 preview first."
packages = {
    "lumen-wordpress-1.1.0.zip": [(p, Path("lumen") / p.relative_to(WORDPRESS))
                                for p in sorted(WORDPRESS.rglob("*")) if p.is_file()],
    "lumen-blogger-1.1.0.zip": [(ROOT / "blogger/lumen-blogger.xml", "lumen-blogger.xml"),
                              (ROOT / "docs/BLOGGER.md", "INSTALL.md"),
                              (ROOT.parents[1] / "LICENSE", "LICENSE")],
}
checksums = []
for name, entries in packages.items():
    target = RELEASES / name
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for file, relative in entries:
            archive.write(file, relative)
    checksums.append(f"{hashlib.sha256(target.read_bytes()).hexdigest()}  {name}")
(RELEASES / "SHA256SUMS.txt").write_text("\n".join(checksums) + "\n")
