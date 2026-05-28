# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static academic website for Armin Seimel (seimel.io), a Senior Researcher at GESIS - Leibniz Institute for the Social Sciences.

## Technical Stack

- **Framework:** Pure HTML/CSS (no build tools required)
- **Styling:** Local LaTeX.css + embedded Latin Modern font
- **Design:** LaTeX document styling with mobile-first responsive design

## File Structure

```
seimel_website/
├── index.html          # Home/About page
├── cv.html             # CV page
├── papers.html         # Publications page
├── css/
│   └── style.css       # Custom CSS + local LaTeX.css import
├── assets/
│   ├── vendor/         # Local copies of third-party CSS/JS assets
│   ├── fonts/          # Optional additional self-hosted fonts
│   └── images/
│       └── profile.jpg # Profile photo (to be added)
├── arminseimel.WordPress.2026-01-31.xml  # Original WordPress export
└── CLAUDE.md
```

## Development

To view the website locally, simply open `index.html` in a web browser. No build step required.

### Missing Assets

Before deployment, add:
1. **Profile photo:** Save as `assets/images/profile.jpg`

### Dependency Policy

- Prefer local, vendored copies of CSS, JavaScript, and font assets over CDN or externally hosted resources.
- Avoid runtime third-party asset requests unless explicitly required.
- Keep the LaTeX-style typography as close as practical to Computer Modern; the local `assets/vendor/latex.css` file embeds Latin Modern, an open-source Computer Modern successor.

## Design Notes

- Background: Very light sepia (#fefdfb)
- Max content width: 800px
- Header: Boxed title with name and institution
- Navigation: Horizontal links (Home | CV | Papers)

## CSS Guidelines

- **Always use `!important`:** When modifying CSS, always use `!important` on property values. LaTeX.css has high specificity and will override our custom styles without it.

## Workflow

- **Commit after every change:** Always commit changes immediately after completing each task or modification. Do not batch multiple changes into a single commit.
