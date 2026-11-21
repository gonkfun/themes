"""Build native Blogger templates with the collection's four original layouts."""
import hashlib
import json
import zipfile
from html import escape
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
TEMPLATE = Template((SCRIPTS / "blogger-collection.xml").read_text())
BLOGGER_CSS = (SCRIPTS / "blogger-collection.css").read_text()
ART = "<div class='gc-art' aria-hidden='true'></div>"
VERSION = "1.0.0"


def intro(theme):
    # Blogger Settings supplies the blog title and description after installation.
    return f"""<section class='gc-hero gc-wrap'>
      <div class='gc-copy'>
        <p class='gc-label'>{escape(theme['label'])}</p>
        <h1><data:blog.title/></h1>
        <b:if cond='data:blog.description'><p class='gc-intro'><data:blog.description/></p></b:if>
        <a class='gc-action' href='#overview'>{escape(theme['action'])} ↘</a>
      </div>
      {ART}
    </section>"""


def overview(theme):
    cards = "\n".join(
        f"""<article class='gc-card'>
          {ART}
          <p class='gc-label'>{escape(label)}</p>
          <h3>{escape(title)}</h3>
          <p>{escape(body)}</p>
        </article>"""
        for label, title, body in theme["entries"]
    )
    return f"""<section class='gc-content gc-wrap' id='overview'>
      <h2 class='gc-section-title'>{escape(theme['section'])}</h2>
      <div class='gc-deck'>{cards}</div>
    </section>"""


def build(theme):
    slug, name = theme["id"], theme["name"]
    folder = ROOT / "themes" / slug
    styles = (folder / "preview/theme.css").read_text() + "\n" + BLOGGER_CSS
    xml = TEMPLATE.substitute(background=theme["colors"][0], styles=styles, hero=intro(theme),
                              overview=overview(theme), section=escape(theme["section"]),
                              updates=escape(theme["updates"]))
    blogger = folder / "blogger"
    blogger.mkdir(exist_ok=True)
    xml_file = blogger / f"{slug}-blogger.xml"
    xml_file.write_text(xml, encoding="utf-8")
    guide = blogger / "INSTALL.md"
    guide.write_text(f"""# {name} for Blogger

1. On a test blog, open **Theme → More → Backup** to save the current theme.
2. Extract this ZIP and choose **Theme → More → Restore**. Select `{xml_file.name}`.
3. Under **Settings**, set the blog title, description, and your own favicon. The title and description appear on the homepage automatically.
4. Create posts and add labels in the post editor. The archive, label pages, search and post cards use your Blogger content. When a post has an image, its first image can appear on the card.
5. Use **Layout** to configure Pages, Topics and Archive in the footer.
6. To edit the starter **{theme['section']}** section, go to **Theme → Edit HTML** and find `id='overview'`. Replace the sample entries before publishing. The removable, nofollow Gonk credit is in the footer.
7. To accept comments, enable them in Blogger Settings. The theme displays existing comments and links to Blogger's comment form when available.

The design uses local CSS and system fonts. Blogger supplies publishing, search, labels and comments.

GPL-2.0-or-later · Copyright 2026 Gonk Themes.
""", encoding="utf-8")
    release = folder / "releases"
    archive = release / f"{slug}-blogger-{VERSION}.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as package:
        for file in (xml_file, guide, ROOT / "LICENSE"):
            package.write(file, file.name)
    archive_names = (archive.name, f"{slug}-wordpress-{VERSION}.zip")
    lines = []
    for name in archive_names:
        checksum = hashlib.sha256((release / name).read_bytes()).hexdigest()
        lines.append(f"{checksum}  {name}")
    (release / "SHA256SUMS.txt").write_text("\n".join(lines) + "\n")
    print(f"Built {theme['name']} Blogger XML and ZIP")


for theme in json.loads((SCRIPTS / "wordpress-collection.json").read_text()):
    build(theme)
