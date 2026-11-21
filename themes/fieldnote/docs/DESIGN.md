# Fieldnote design system

## Direction

Theme 02 is a field journal: a quiet, paper-like place to record observations of birds, plants, fungi, weather and walks. It should feel like a well-kept notebook, not a magazine or a dashboard. Composition, hierarchy and card structure differ from Epoch on purpose; it is not a colour variation.

## Tokens

- Paper `#f3eee2` · Card `#fbf8f0` · Sunk `#e9e2d1`
- Ink `#23261f` · Muted `#5b604f` · Lines `#d5ccb6` · Ruling `#e4dccb`
- Moss accent `#3d5a36` · Rust accent `#a9512c`
- Dusk mode: paper `#1b1e19`, ink `#ece6d6`, moss `#9cc08f`, rust `#e39a72`; line artwork is brightness-inverted with hue preserved.
- Type: book serif stack (Iowan Old Style, Palatino, Georgia) for reading; system sans for controls; system mono for metadata.
- Content width 1180px; reading measure 740px; minimum control height 44px.

## Composition

- **Header:** leaf mark in a ring, title with a mono tagline, sans navigation, day/dusk switch.
- **Lead entry ("Today's observation"):** headline with an italic moss second line, and a taped plate holding an illustration and a two-part caption.
- **Season strip:** current season and date (computed in the browser), a dashed rule and a motto.
- **Specimen cards:** ruled paper, an illustration window, a rust subject tag, a title, an excerpt and an "observed" line (date · place · weather).
- **Field kit sidebar:** search, an about-the-notebook box, numbered recent entries, subject chips and RSS.
- **Article:** breadcrumb, kicker, headline, standfirst, observation line, figure plate, prose, and **margin notes** floated into the right gutter at ≥1200px.

## Motion

None beyond hover colour changes. No autoplay, counters or tickers. Reduced-motion disables transitions.

## Accessibility

One H1 per page, skip link, visible focus ring, 44px targets, labelled navigation landmarks, decorative images with empty alt text, content readable without JavaScript.
