"""Build the three downloadable ZIPs and stage the compiled React preview."""
import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RELEASES = ROOT / "releases"
RELEASES.mkdir(exist_ok=True)
WORDPRESS = ROOT / "wordpress/panelwork"
REACT = ROOT / "react"
PREVIEW = ROOT / "preview/react"
assert (WORDPRESS / "screenshot.png").is_file(), "Create the 1200×900 preview screenshot first."
assert (REACT / "dist/index.html").is_file(), "Build the React app before packaging."
if PREVIEW.exists():
    shutil.rmtree(PREVIEW)
shutil.copytree(REACT / "dist", PREVIEW)
shutil.copyfile(REACT / "REACT-LICENSE.txt", PREVIEW / "REACT-LICENSE.txt")

react_files = [REACT / name for name in ("README.md", "LICENSE", "REACT-LICENSE.txt", "index.html",
                                         "package.json", "package-lock.json")]
react_files.extend(p for p in (REACT / "src").rglob("*") if p.is_file())
packages = {
    "panelwork-wordpress-1.1.0.zip": [(p, Path("panelwork") / p.relative_to(WORDPRESS))
                                    for p in sorted(WORDPRESS.rglob("*")) if p.is_file()],
    "panelwork-blogger-1.1.0.zip": [(ROOT / "blogger/panelwork-blogger.xml", "panelwork-blogger.xml"),
                                  (ROOT / "docs/BLOGGER.md", "INSTALL.md"), (ROOT.parents[1] / "LICENSE", "LICENSE")],
    "panelwork-react-1.1.0.zip": [(p, Path("panelwork-react") / p.relative_to(REACT)) for p in sorted(react_files)]
}
checksums = []
for name, entries in packages.items():
    file = RELEASES / name
    with zipfile.ZipFile(file, "w", zipfile.ZIP_DEFLATED) as archive:
        for source, target in entries:
            archive.write(source, target)
    checksums.append(f"{hashlib.sha256(file.read_bytes()).hexdigest()}  {name}")
(RELEASES / "SHA256SUMS.txt").write_text("\n".join(checksums) + "\n")
