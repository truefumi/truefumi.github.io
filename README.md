# Personal Website Template (HTML + Markdown)

A simple, no-build personal website template for GitHub Pages. The page
"shells" are plain HTML; all the actual writing lives in Markdown files that
get fetched and rendered in the browser.

## Structure

```
personal-website/
├── .github/
│   ├── workflows/build-manifests.yml   Regenerates manifests on every push
│   └── scripts/generate-manifests.js   The script that workflow runs
├── index.html                 Home page — links to the 5 sections
├── assets/
│   ├── style.css               All site styling (edit colors/fonts here)
│   ├── nav.js                  Builds the top navigation on every page
│   ├── markdown-loader.js      Fetches + renders a section's .md pages
│   └── vendor/marked.umd.js    Markdown parser (bundled, no CDN needed)
├── about-me/
│   ├── index.html              Section shell (title/intro only)
│   └── pages/
│       ├── *.md                 The actual nested pages (edit these!)
│       └── manifest.json        Auto-generated — don't edit by hand
├── resume/
│   ├── index.html
│   └── pages/  (*.md + manifest.json)
├── projects/
│   ├── index.html
│   └── pages/  (*.md + manifest.json)
├── certifications/
│   ├── index.html
│   └── pages/  (*.md + manifest.json)
└── resources/
    ├── index.html
    └── pages/  (*.md + manifest.json)
```

## How it works

Each of the 5 sections (About Me, Resume, Projects, Certifications,
Resources) has one `index.html` "shell." Near the bottom of that file you'll
find a small config block like this:

```html
<script>
  window.SECTION_TITLE = "Resume";
  window.SECTION_INTRO = "Experience, education, and skills.";
  initSectionPage();
</script>
```

That's it — no list of pages to maintain. `initSectionPage()` fetches
`pages/manifest.json`, a small JSON file listing every `.md` page in that
section's `pages/` folder, and builds the page list from it. Clicking a page
fetches its `.md` file and renders it in the content area — no page reload,
and the URL updates (`resume/index.html?page=education`) so it's still
linkable/bookmarkable.

**The manifest is auto-generated, not hand-written.** A GitHub Action
(`.github/workflows/build-manifests.yml`) runs on every push, scans each
section's `pages/` folder, and regenerates its `manifest.json` — pulling
each page's title from the first `# Heading` line in the file (or
title-casing the filename if there isn't one). If anything changed, it
commits the updated manifest(s) straight back to the repo.

**To add a new nested page:** just write a new `.md` file in the right
`pages/` folder and push. That's the entire workflow — no HTML file needs to
change, ever.

**To control page order:** files are listed alphabetically by filename. If
you want a specific order, prefix filenames with numbers, e.g.
`01-experience.md`, `02-education.md` — the prefix controls sort order but
is stripped from the URL slug and the title fallback, so it stays invisible
to visitors.

**To edit content:** just edit the `.md` files directly. They're plain
Markdown, so they render the same way here as they do on GitHub itself.

**Testing locally before your first push:** the manifests need to exist for
pages to show up, and locally there's no GitHub Action to generate them. Run
```bash
node .github/scripts/generate-manifests.js
```
once after adding or renaming any `.md` files, then serve the folder as
usual (see below).

**To edit the top navigation** (the 5 links shown on every page): edit
`assets/nav.js` once — it's shared across every page automatically.

**To restyle the whole site:** edit the CSS variables at the top of
`assets/style.css` (colors, fonts, max width, etc).

## Running it locally

Because pages are fetched via JavaScript (`fetch()`), opening `index.html`
directly from your filesystem (`file://`) will be blocked by the browser's
CORS rules. Serve the folder locally instead, for example:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository (for a user site, name it
   `yourusername.github.io`; for a project site, any repo name works).
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and the root folder.
4. Save — GitHub will publish the site at
   `https://yourusername.github.io/` (or `/repo-name/` for a project site).

The included `.nojekyll` file tells GitHub Pages to serve the site as-is
without running it through Jekyll, which is what allows folders like
`assets/` and `pages/` to work exactly as written here.

## The page-manifest GitHub Action

`.github/workflows/build-manifests.yml` runs `.github/scripts/generate-manifests.js`
on every push to `main`, and on demand from the **Actions** tab
(`workflow_dispatch`). The script:

1. Looks at every top-level folder that has both an `index.html` and a
   `pages/` subfolder (so adding a 6th section is picked up automatically,
   with no changes to the workflow itself).
2. For each `.md` file in that folder's `pages/`, pulls a title from its
   first `# Heading` line, or title-cases the filename if there isn't one.
3. Writes the result to that section's `pages/manifest.json`.

If nothing changed, the workflow exits without committing anything. If a
manifest did change, it's committed with the message
`Auto-generate page manifests [skip ci]` and pushed straight back to `main`
using the workflow's own built-in `GITHUB_TOKEN` (that's what the
`permissions: contents: write` line at the top of the workflow file grants).

**Why `[skip ci]` matters:** that commit is itself a push to `main`, which
would normally trigger the same workflow again — an infinite loop. GitHub
has a built-in rule that skips starting a workflow run at all when the
triggering commit's message contains `[skip ci]`, so the loop stops right
there. The workflow's own `if:` condition checks for the same thing as a
second layer of defense, in case you ever add another trigger that isn't
covered by that built-in rule.

You won't normally need to touch either file, but if you ever want to
change how titles are derived, or add more metadata to the manifest (a
publish date, a short description, etc.), `generate-manifests.js` is a
plain, dependency-free Node script — safe to edit directly.

## Editing with Obsidian (optional)

You can use [Obsidian](https://obsidian.md) as your `.md` editor and have it
automatically commit and push your changes to GitHub — no HTML editing, no
manual `git` commands.

**Setup (one time):**

1. Clone this repo locally if you haven't already:
   ```bash
   git clone git@github.com:yourusername/your-repo.git
   ```
2. In Obsidian, choose **Open folder as vault** and select that cloned
   folder directly. (You'll see the `.html`/`.css`/`.js` files too — just
   ignore them and work in the `pages/` folders.)
3. Turn off wikilinks so internal links stay plain Markdown: **Settings →
   Files and Links → "Use [[Wikilinks]]"** → off. (This site's renderer
   understands standard Markdown, not Obsidian's `[[wiki-link]]` or
   `![[embed]]` syntax or callout blocks like `> [!note]`.)
4. Install the **Git** community plugin (by Vinzent03): **Settings →
   Community plugins → Browse → search "Git"**.
5. In the Git plugin's settings:
   - **Auto commit-and-sync interval** → e.g. `10` minutes
   - **Pull on startup** → on
6. Make sure `git push` won't prompt you for credentials every time — the
   easiest way is an SSH remote:
   ```bash
   git remote set-url origin git@github.com:yourusername/your-repo.git
   ```
   (requires an SSH key added to your GitHub account under **Settings →
   SSH and GPG keys**)

**Day to day:** open a note in `about-me/pages/`, `resume/pages/`, etc.,
edit it like any other Obsidian note, and the Git plugin pushes it to
GitHub on its interval (or immediately via the command palette: **Git:
Commit-and-sync**). GitHub Pages rebuilds automatically after each push.

**Creating a brand-new page** is now just: create the note inside the right
`pages/` folder, with a `# Heading` as its first line so it gets a proper
title. Nothing else to do — the GitHub Action described above picks it up
on the next push and adds it to that section automatically.

## Customizing

- Replace "Your Name" in `index.html` and `assets/nav.js`.
- Replace the placeholder text in every `.md` file with your real content.
- Add or remove sections by copying an existing section folder and updating
  the config block and the links in `index.html` / `assets/nav.js`. Its
  `pages/manifest.json` will be generated automatically on the next push
  (or run `node .github/scripts/generate-manifests.js` locally first).
