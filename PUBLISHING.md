# Publishing — How I Failed to Beat the Tote

This directory is the GitHub Pages source for the blog series. Everything renders straight from markdown via Jekyll (no build step required on your machine).

## One-time setup on GitHub

1. **Commit and push** this `docs/` directory to a branch on a public GitHub repository (or a private one if you have GitHub Pro+).
2. Go to the repo on github.com → **Settings → Pages**.
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** the branch you pushed (probably `master` or `main`) and the folder **`/docs`**
4. Click **Save**. GitHub takes 30–90 seconds to build, then publishes at:
   `https://<your-username>.github.io/<repo-name>/`

That URL is fixed — if you want a custom domain, add a `docs/CNAME` file containing the domain and configure DNS.

## What gets published

```
docs/
├── _config.yml           ← Jekyll config (title, exclude list, defaults)
├── _layouts/
│   ├── default.html      ← Shell with header / footer / mermaid.js loader
│   └── post.html         ← Per-post template with prev/next nav
├── assets/site.css       ← Custom typography (serif body, sans nav, mono code)
├── index.md              ← Landing page with TOC of all 9 posts
├── about.md              ← Author / colophon
├── infographics.md       ← The 4 cross-cutting diagrams as a reference page
└── series/
    ├── 01-…md            ← The 9 posts (Jekyll frontmatter, mermaid blocks)
    ├── 02-…md
    └── …
```

Pre-existing analysis files (`MEMORY_LEAK_AUDIT.md`, `REACT_PERFORMANCE_ANALYSIS.md`, etc.) and the `superpowers/` directory are explicitly excluded from the build via `_config.yml`. They stay in the repo; they just don't get published.

## Mermaid diagrams

The site renders Mermaid diagrams client-side via the `mermaid.esm.min.mjs` ESM bundle, loaded from `_layouts/default.html`. Any fenced ` ```mermaid ` block in any markdown file becomes a rendered diagram in the browser. No GitHub Action needed.

## Chart placeholders

Several posts have `<figure><div class="placeholder">📊 Chart: …</div></figure>` blocks where a matplotlib chart should go. The matplotlib pseudo-code is in `blog/series/_specs/<post>.specs.md` in the repo. To replace a placeholder with a real chart:

1. Lift the pseudo-code into a Jupyter notebook or `.py` script and run it.
2. Save the chart as `docs/assets/figures/<spec-id>.png` (or `.svg`).
3. Replace the placeholder `<div>` with `<img src="../assets/figures/<spec-id>.png" alt="<caption>">`.

The CSS already handles `<figure><img>` layout cleanly.

## Local preview (optional)

```bash
cd docs
bundle install         # one-time: install github-pages gem
bundle exec jekyll serve
# open http://localhost:4000
```

The Gemfile pins to the `github-pages` gem, so what you see locally is what GitHub will build.

## QA fixes applied

The QA panel from the original generation pass flagged three pre-publication issues; all three are now resolved in this directory:

1. ✅ Reference page ranges normalized to en-dashes (`–`) consistently across posts.
2. ✅ `<figure data-spec="…">` placeholders resolved — mermaid blocks inline, matplotlib charts marked as placeholders with paths to the source pseudo-code.
3. ✅ Post 08 ("The Regime That Almost Worked") carries an explicit hedging sentence noting the CI [-41%, +46%] means the gradient locates inefficiency but does not promise it can be harvested.

## Editing posts

Each post in `series/` is plain markdown with Jekyll frontmatter. Edit the markdown; commit; push; GitHub Pages rebuilds automatically.
