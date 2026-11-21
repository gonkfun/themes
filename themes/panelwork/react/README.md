# Panelwork React

A dashboard starter built with React and Vite. It includes Overview, Post Library, Topics, Calendar, Activity and Settings. Charts drill into a date range, and the library supports sorting, filters, pagination and CSV export. Use Hide sidebar in the desktop toolbar to expand the workspace, and Show sidebar to restore it. The desktop choice, appearance and row density are saved. On mobile the sidebar opens through Menu.

Use Node 22.12+ (or Node 20.19+).

```sh
npm ci
npm run dev
```

Run `npm run build` for a production build in `dist/`. The example uses hash navigation so it can run on static hosting without route rewrites. Replace `src/posts.json` with your data source and pass the normalized posts to `App`. Each post has an id, title, ISO publication date, topic names, summary and optional body. Cards and charts summarize that input. The included records are fictional examples.

The dashboard stores the selected appearance in the visitor's browser. The Gonk footer credit in `src/main.jsx` is removable.

Panelwork code and CSS are GPL-2.0-or-later. React and React DOM are MIT licensed. See `REACT-LICENSE.txt`.
