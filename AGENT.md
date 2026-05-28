# AGENT.md

## Dependency Policy

- Prefer local, vendored copies of CSS, JavaScript, and font assets over CDN or externally hosted resources.
- Avoid runtime third-party asset requests unless explicitly required.
- Keep the LaTeX-style typography as close as practical to Computer Modern. The local `assets/vendor/latex.css` file embeds Latin Modern, an open-source Computer Modern successor.
