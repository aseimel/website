# AGENT.md

## Dependency Policy

- Prefer local, vendored copies of CSS, JavaScript, and font assets over CDN or externally hosted resources.
- Avoid runtime third-party asset requests unless explicitly required.
- Keep the LaTeX-style typography as close as practical to Computer Modern. The local `assets/vendor/latex.css` file embeds Latin Modern, an open-source Computer Modern successor.

## Chrome Consistency (strict)

The header, nav, and theme strip are identical on all six pages (`index.html`, `cv.html`, `papers.html`, `datenschutz.html`, `impressum.html`, `party2d/index.html`). There is no build step and no human editor, so the agent enforces consistency by procedure on every single edit touching chrome:

- Never change chrome on fewer than all six pages. A chrome edit applied to one page and not the other five is a broken change. No exceptions.
- Chrome means everything above `<main>`: the header box, both nav rows, and the theme strip below the header.
- All chrome layout lives in `css/style.css` only. Page stylesheets (`css/cv.css`, `party2d/css/style.css`) must never set rules on `.site-header`, `.site-nav`, `.nav-row`, `.nav-label`, `.nav-links`, or `.theme-strip`. The single allowed exception is `party2d/css/style.css` constraining `.site-header` to the site content width, because that page uses a wider body for its data content.
- Spacing rhythm is shared: content width `--content-width` (700px), `main` top margin 2rem on every page, theme strip pulled under the header by the same offset everywhere. Never introduce a page-specific margin above or around the header.
- Relative paths are the only per-page difference: root pages use `party2d/` and `index.html`-style links, `party2d/index.html` uses `../` prefixes and `./` for its self link. Active states mark the current page only.
- After any chrome edit, parse-check all six pages, then push. The site has no preview step, so the six-page check is the gate.
- Bump the `css/style.css?v=` query string on every page that loads it whenever `css/style.css` changes, so visitors never see a mix of old CSS and new markup.

## Width Discipline (strict)

Every page renders at exactly one measure. The token is `--content-width` (700px) in `css/style.css`, and every page body uses it.

- Never set a page-specific `body` max-width. No page gets a wider body for any reason without an explicit user decision.
- Header, nav, theme strip, text, controls, figures, and tables all share the same edges on every page. A narrow header over wide content, or wide figures under narrow text, is a broken layout.
- Figure blocks must fit the frame instead of widening it: use responsive grids such as `repeat(auto-fit, minmax(...))` for control panels, and `overflow-x: auto` wrappers for tables that need more room.
- If a future page genuinely needs a different width, the user decides first, and then the entire page including the header moves to the new measure together. Partial-width pages are never allowed.
