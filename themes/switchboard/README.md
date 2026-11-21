# Switchboard

Switchboard is an original React admin suite for operations and commerce. The built-in workspaces use fictional records and run on static hosting.

[Live preview](https://gonkfun.github.io/themes/switchboard/) · [React source ZIP](https://github.com/gonkfun/themes/releases/tag/switchboard-v1.0.0)

## Run the theme

Extract the React release ZIP, open the extracted directory, and run:

```sh
npm ci
npm run dev
```

Use Node.js 20.19+ in the Node 20 line or 22.12+. Run `npm run build` to create `dist/`. The build uses relative assets and hash routes, so it works under a subdirectory on a static host. Run `npm run preview` to check a production build locally.

## Workspaces and controls

| Area | Included |
| --- | --- |
| Navigation | Horizontal, full sidebar, and compact rail layouts. The icon-only desktop collapse button lives inside the sidebar. Mobile drawer, page search, light and dark themes, system preference, six accent colours, and right-to-left layout. |
| Dashboards | Operations and commerce dashboards, period comparisons, KPI sparklines, accessible numeric chart data, order channels, and activity lists. |
| Team apps | Calendar, drag-and-drop Kanban with keyboard-friendly move controls, contacts, chat, mail, notes, support tickets, and profile. Changes are saved in the current browser. |
| Commerce | Catalogue and product details, cart and demo checkout, order register, configurable data table with column reorder, and printable invoices. |
| Examples | Chart gallery, table gallery, forms and a wizard, component examples, a selectable tree, and a block editor with live preview. |
| Public pages | Landing page, about, portfolio, pricing, contact, blog index, and article views. |
| Authentication screens | Sign in, register, account recovery, and lock screen examples. They validate inputs locally and do not create real sessions. |
| Data ownership | Seed data lives in `src/model.js`. Local records use `switchboard:` keys. Replace browser-local storage with your own API before accepting real customer data. |

This package includes no live authentication provider, mail transport, payment processor, or shared backend. Connect those services to your own API and enforce authorization server-side when adapting the suite. The chart gallery and admin examples are Switchboard’s own implementations.

## Development checks

```sh
python3 themes/switchboard/tests/validate.py
```

For browser checks, install Playwright and Chromium, serve `themes/switchboard/preview` on local port 9465, and run `node themes/switchboard/tests/browser.mjs`. You can override `SWITCHBOARD_URL`, `SWITCHBOARD_PLAYWRIGHT`, and `SWITCHBOARD_CHROMIUM`.

GPL-2.0-or-later. The footer credit is removable and uses `rel="nofollow"`. Dependency licenses are listed in the source archive.
