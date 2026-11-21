# Panelwork

A publishing dashboard with a compact left sidebar, four publishing cards, a selectable monthly activity chart, a topic breakdown, a sortable library, and a publication timeline. It includes a plain article view and a System, Light, or Dark appearance setting.

- [Native theme preview](https://gonkfun.github.io/themes/panelwork/)
- [React demo](https://gonkfun.github.io/themes/panelwork/react/) · [React source ZIP](https://github.com/gonkfun/themes/releases/tag/panelwork-v1.2.1)
- [Blogger and WordPress downloads](https://github.com/gonkfun/themes/releases/tag/panelwork-v1.1.0)

**WordPress:** Upload the WordPress ZIP from **Appearance → Themes → Add New → Upload Theme**. Activate it and set **Settings → Reading → Your latest posts** for the publishing dashboard. The chart and topic counts use the public posts shown on that page.

**Blogger:** Restore the XML inside the Blogger ZIP. See the [Blogger setup guide](docs/BLOGGER.md).

**React:** Extract the React source ZIP, then run `npm ci` and `npm run dev`. The React workspace includes a hideable desktop sidebar, six screens, chart drill-downs, date and topic filters, paging, CSV export and saved appearance and row spacing. See the [starter guide](react/README.md) for the data format and production build.

The demos use fictional posts. Installed themes do not measure traffic or collect reader data. The appearance choice is stored locally.

To rebuild in this repository, run `python3 themes/panelwork/build.py`, install the React dependencies with `npm ci --prefix themes/panelwork/react`, and run `npm run build --prefix themes/panelwork/react`. Run `python3 themes/panelwork/package.py` to package the themes and stage the React demo. Pass `--react-only` when releasing only the React starter. Keep the 1200 × 900 screenshots current with their respective previews.

Free to use and modify under GPL-2.0-or-later. The discreet, nofollow Gonk footer credit is removable.
