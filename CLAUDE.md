# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static academic website for Armin Seimel (seimel.io), a Postdoctoral Researcher at the University of Amsterdam.

## Technical Stack

- **Framework:** Pure HTML/CSS (no build tools required)
- **Styling:** LaTeX.css (CDN) + Computer Modern Unicode font (self-hosted)
- **Design:** LaTeX document styling with mobile-first responsive design

## File Structure

```
seimel_website/
├── index.html          # Home/About page
├── cv.html             # CV page
├── papers.html         # Publications page
├── css/
│   └── style.css       # Custom CSS + CMU font declarations
├── assets/
│   ├── fonts/          # CMU Serif WOFF2 files (to be added)
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
2. **CMU Serif fonts:** Download WOFF2 files and place in `assets/fonts/`:
   - `cmu-serif-roman.woff2`
   - `cmu-serif-italic.woff2`
   - `cmu-serif-bold.woff2`

Font source: [CM Unicode](https://sourceforge.net/projects/cm-unicode/) or [CTAN](https://ctan.org/pkg/cm-unicode)

## Design Notes

- Background: Very light sepia (#fefdfb)
- Max content width: 800px
- Header: Boxed title with name and institution
- Navigation: Horizontal links (Home | CV | Papers)

## CSS Guidelines

- **Always use `!important`:** When modifying CSS, always use `!important` on property values. LaTeX.css (loaded from CDN) has high specificity and will override our custom styles without it.

## Workflow

- **Commit after every change:** Always commit changes immediately after completing each task or modification. Do not batch multiple changes into a single commit.
