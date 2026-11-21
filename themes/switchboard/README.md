# Switchboard

Switchboard is an original React admin suite for operations and commerce. The built-in workspaces use fictional records and run on static hosting.

[Live preview](https://gonkfun.github.io/themes/switchboard/) · [React source ZIP](https://github.com/gonkfun/themes/releases/tag/switchboard-v1.1.0)

## Run the theme

Extract the React release ZIP, open the extracted directory, and run:

```sh
npm ci
npm run dev
```

Use Node.js 20.19+ in the Node 20 line or 22.12+. Run `npm run build` to create `dist/`. The build uses relative assets and hash routes, so it works under a subdirectory on a static host. Run `npm run preview` to check a production build locally.

## Run a connected team workspace

Use Node.js 22.13 or later for the bundled Node and SQLite server. From the source ZIP directory, run:

```bash
npm ci
npm run build
export SWITCHBOARD_OWNER_EMAIL='owner@example.test'
read -rsp 'Initial owner password (12–128 characters): ' SWITCHBOARD_OWNER_PASSWORD
printf '\n'
export SWITCHBOARD_OWNER_PASSWORD
npm start
```

Open [http://localhost:8787](http://localhost:8787) and sign in with the owner account you just created. The bootstrap details are only needed to create the first Owner. Remove the password from the process configuration once the database exists. Older Node versions can still run the frontend-only preview if supported by Vite.

Team Admin generates an invitation link that expires in 48 hours or after one use. Share it privately with the recipient. Creating a replacement for the same email invalidates the earlier link. The app does not send emails. The member opens the link and chooses a name and password.

| Role | What they can do |
| --- | --- |
| Owner | Invite Admins or Members, manage roles and activation, see activity, and manage shared tasks and tickets. |
| Admin | Invite Members, see activity, and manage shared tasks and tickets. |
| Member | View the active directory and create, edit, assign, and move shared tasks and tickets. |

Use **Refresh** to pick up teammate changes. If a record changed after it was opened, the app asks you to refresh before applying an edit. Connected mode includes Team Admin, Kanban, tickets, and appearance settings. The wider dashboards and applications are still available in the static demo.

For a hosted workspace, run one server instance behind an HTTPS reverse proxy, set `SWITCHBOARD_ORIGIN` to the exact public origin, and keep the upstream on loopback. Use `SWITCHBOARD_DB` for a path on persistent storage (default `data/switchboard.sqlite`), and back it up using SQLite tooling. `HOST` and `PORT` select the bind address and port. The built-in rate limiter uses the direct peer address and ignores forwarded headers. When using a reverse proxy, configure client-based request limiting there as well. The starter has no self-service password reset or email provider.

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
| Team Admin | Searchable member directory, sample invitations and role changes in the preview. The Node server adds real sessions, one-time invitations, role enforcement, shared Kanban and tickets, and an activity log. |
| Data ownership | Seed data lives in `src/model.js`. Local records use `switchboard:` keys. Replace browser-local storage with your own API before accepting real customer data. |

The static preview uses fictional browser-local data. The optional server provides its own authentication and stores team and work records in SQLite. Mail, chat, and checkout on the static preview remain sample workflows.

## Development checks

```sh
python3 themes/switchboard/tests/validate.py
```

For browser checks, install Playwright and Chromium, serve `themes/switchboard/preview` on local port 9465, and run `node themes/switchboard/tests/browser.mjs`. You can override `SWITCHBOARD_URL`, `SWITCHBOARD_PLAYWRIGHT`, and `SWITCHBOARD_CHROMIUM`. After building React, run `node themes/switchboard/tests/connected.mjs` to check the backend with two browser contexts and a temporary database.

GPL-2.0-or-later. The footer credit is removable and uses `rel="nofollow"`. Dependency licenses are listed in the source archive.
