# Blogger installation and customisation

## Back up first

1. In Blogger, select a **test blog** first.
2. Open **Theme** → the menu next to Customize → **Backup**. Save the current theme.
3. Record your current Layout widgets. Installing a different theme may move widgets.

## Install Epoch

1. Extract `epoch-blogger-1.0.0.zip`.
2. In **Theme** → **Restore**, upload `epoch-blogger.xml`.
3. If Restore fails, use **Theme → Edit HTML**, replace the template with the XML and save. Keep the original backup.
4. In the mobile-theme settings, select the desktop/custom theme for mobile rather than Blogger's separate legacy mobile template.
5. Set your publication name and short description under **Settings**. Epoch reads both dynamically. A short description fits the header best.
6. Create a real post with an image, title, body and labels. The homepage is populated from your own posts; no demo posts are silently imported.

## Layout widgets

- `Blog1`: real posts and the native Blogger comments include. Keep this widget.
- `Label1`: editable topic list.
- `BlogArchive1`: the archive selector.
- `HTML1`: an optional Community links box. Add your official community links here, or remove the widget.
- `PageList1`: footer pages. Add About, Contact and Privacy pages and select them in this widget.

Keep widget and section IDs unique. Do not paste arbitrary elements inside a `b:section`; Blogger sections contain widgets.

## Topics and navigation

The default navigation expects labels named `Guides`, `Ecosystem`, `DeFi`, `Builders`, `Culture` and `Security`, with matching capitalisation. Apply these labels to your posts or edit the `search/label/...` URLs in Theme → Edit HTML.

Search uses Blogger's native `/search?q=...` endpoint. RSS points to the publication's own `/feeds/posts/default?alt=rss`.

## Hero and cards

Edit the hero copy in the `ep-hero` section of the XML. The bundled orbital artwork is embedded in the CSS as a data URI so there is no theme-author hosting dependency. Listing cards use the post's first image when available and the bundled artwork otherwise. The post body is rendered as native Blogger content on the article page.

The default snippet strips links and markup to keep listing cards readable. Detailed long-form content, images, embeds and tables remain on the article page.

## Colours, spacing and typography

The first `:root` rule in `b:skin` contains named CSS variables. Start with `--ep-bg`, `--ep-text`, `--ep-accent` and `--ep-line`. The paper-mode override follows it. Keep text/background contrast readable in both modes. System fonts are intentional; no font download is required.

The header uses an expandable mobile menu. Reader colour mode is stored in the visitor's local browser storage; it does not track the visitor or change your publication settings.

## Footer credit

Search for `Powered by` in Theme → Edit HTML. Edit or remove the `ep-credit` span. This does not affect any other theme function. The author link has `rel="nofollow"`; do not claim it guarantees search ranking credit.

## Before publishing

Check Home, a post, a static page, a label, search, older/newer pagination and the comments section. Test at phone and desktop widths. Confirm the blog's own title, description, feed, labels and pages are correct. Use Blogger's native privacy/comment settings.

**Verification limit:** the delivered XML is structurally validated. A successful import, save and rendered comments on your Blogger account are still required; no account-level import was performed by this build.

## Blogger chrome suppression

The public theme hides Blogger's navbar, attribution, default profile, duplicate Header/Search, Report Abuse and other automatically carried-over gadget types. Only native posts, Labels, BlogArchive, custom HTML gadgets and the selected Pages menu are permitted in the visible theme. Existing gadget settings remain in Blogger; hidden gadgets are not deleted, and the Layout editor can still show them. Empty Community links gadgets are hidden until populated. The theme's own Gonk credit remains removable.

## Custom favicon and search metadata

Epoch embeds its own blue E SVG for the browser tab. Also upload `assets/epoch-favicon-96.png` (or the supplied ICO) under **Blogger → Settings → Favicon**. This changes Blogger's publicly hosted `/favicon.ico`, which search engines can crawl; the XML alone cannot replace that hosted file. Use your own square brand icon later if you prefer.

Enable **Settings → Meta tags → Enable search description** and write the publication's real description. Add a specific Search description when editing each post. Blogger's native canonical, robots preferences, feeds and Open Graph tags remain authoritative; the theme adds a fallback HTML description, site name, content type, Twitter cards and nested WebSite / Blog / article microdata.

Posts with a first image use that image for their Twitter card. For a homepage cover, upload `assets/epoch-social-card.png` somewhere public (for example a Blogger image upload), copy the actual image URL and replace the empty string in the `epochDefaultImage` setting in Theme → Edit HTML. Social previews need a public image URL, not a local file or data URI. No unverified or invented image URL is emitted.

Titles, authors and post bodies come from your own Blogger content. No fake reviews, ratings, FAQ markup, financial figures or ranking guarantees are included. Search-engine favicon and preview updates depend on recrawling.
