# Software Map

Interactive, drill-down flowchart of the software taxonomy, built as a static site for GitHub Pages.

## How it's structured

```
index.html          shell page — don't need to touch this to update content
css/style.css        visual styling — don't need to touch this to update content
js/app.js             renders everything from data/taxonomy.json — don't touch to update content
data/taxonomy.json    <- THE FILE YOU EDIT to add/change/remove nodes
content/<id>.md        <- optional longer write-up per node, e.g. content/1.1.md
```

**The rule: to expand the taxonomy, you only ever edit `data/taxonomy.json` (structure)
and optionally add files under `content/` (long-form writeups). You should not need
to touch HTML/CSS/JS for normal updates.**

## Adding a new node

Open `data/taxonomy.json`. Find the parent node's `children` array and add a new object:

```json
{ "id": "1.6", "title": "New Category", "subtitle": "Short descriptor", "summary": "One-liner shown in the panel." }
```

- `id` — used for breadcrumbs, the content-file lookup, and drill navigation. Keep it
  matching your outline numbering (e.g. `1.6`, `1.6.1`).
- `title` — required.
- `subtitle` — optional, shown under the title on the card.
- `summary` — optional, shown in the detail panel if you haven't written a `content/<id>.md`.
- `children` — optional array of the same shape, for going deeper.

There is no fixed depth limit — a node can have children with children with children.

## Adding a longer write-up

Create `content/<id>.md` (must match the node's `id` exactly, e.g. `content/6.1.md`).
Plain Markdown — headings, lists, bold, links, code spans all render. If the file
doesn't exist, the panel just falls back to showing `summary`.

## Running locally

GitHub Pages (and this app) needs to serve files over HTTP — opening `index.html`
directly via `file://` will fail the `fetch()` calls. Run a quick local server from
this folder:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Repo Settings → Pages → Source: deploy from branch → `main` → `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.

Every time you push a change to `data/taxonomy.json` or `content/*.md`, the live
site updates automatically — no build step.
