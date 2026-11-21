# WordPress installation and customisation

## Requirements

WordPress 6.6 or newer, PHP 7.4 or newer. Runtime testing uses WordPress 6.8 with PHP 8.3. No page builder or companion plugin is required. Use a test installation first and keep a backup.

## Install

1. Open **Appearance → Themes → Add New → Upload Theme**.
2. Upload `epoch-wordpress-1.0.0.zip`. Do not upload the whole source folder.
3. Activate Epoch.
4. In **Settings → General**, enter your publication name and a short tagline.
5. In **Settings → Reading**, choose your latest posts for the journal homepage. The native homepage respects the posts-per-page setting.
6. Add posts with featured images and excerpts. Without an excerpt, WordPress creates one from the body.

For a static front page, WordPress uses the normal page template and your page content. Insert the Epoch introduction and other patterns through the editor if you want a custom landing page. No hidden installation routine changes your Reading settings.

## Site Editor

Use **Appearance → Editor** to change:

- **Header:** site name, tagline, navigation and logo/mark group.
- **Footer:** page navigation, publication description and the author credit.
- **Reading sidebar:** search, beginner note, recent posts, categories and RSS invitation.
- **Templates:** blog, archive, search, article, static page and 404.
- **Patterns:** introduction, topic navigation, beginner note, safety banner and RSS invitation.

Theme files provide defaults. WordPress saves Site Editor changes in your database. To see a newly updated default template, review/reset that specific customisation only after backing it up; an update should not silently delete owner edits.

## Topics and links

The Topic navigation pattern initially uses categories with slugs `guides`, `ecosystem`, `defi`, `builders`, `culture` and `security`. Create these categories or update the pattern links to yours. Pattern links are generated with WordPress URL helpers, including sites installed in a subdirectory.

Navigation uses native page links, so draft pages stay out of the public menu. Edit the Navigation block to choose the exact pages/order you want instead of automatically listing every published page.

## Article features

Single posts render title, category, author, publication date, featured image, full block content, tags, previous/next links, copy-link control and native comments. Comment availability is controlled by WordPress Discussion settings and the post's settings.

Tables, quotes, lists, embeds and code remain normal core blocks. Install a plugin only if you actually need additional functionality such as an email signup service; the theme does not contain a fake subscription form.

## Reader appearance

The header button switches the front end between dark and paper reader modes. This preference is local to the visitor's browser. Editor palette changes are made in Styles; advanced token changes belong in a child theme or your own maintained fork so a future update does not overwrite them.

All fonts are system fonts. Included SVGs are original decorative artwork. WordPress still applies its normal upload-type restrictions; the theme does not enable arbitrary SVG uploads.

## Footer credit

In the Site Editor, open the Footer part and edit/remove the final `Powered by gonk.fun` HTML block. No payment or unlock key is required. The link is qualified `nofollow`.

## Updates and portability

Keep backups of content and database settings before updating. This theme does not register custom post types or store posts in a proprietary structure. Changing themes leaves posts, pages, categories and comments in WordPress.

## Local demonstration

`tests/blueprint.json` and `tests/seed.php` create a **disposable test site** using the official WordPress Playground CLI. The seed removes fixture posts and creates labelled sample content. Never apply it to a real existing publication. The demo-only attachment URL filter is deliberately excluded from the installable theme.
