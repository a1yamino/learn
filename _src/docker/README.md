# Docker course sources

`page.py` + `build.py` generate `/docker/l02.html`–`l25.html` from `lNN.py` data modules
(`python3 build.py 2 3 … 25`; set `OUT=dir` to write elsewhere). `l01.html`, `index.html`,
all `lNN.js`, `layout.css` and `motion.js` are maintained directly in `/docker/`.
`extract.py` rebuilds the `lNN.py` modules from the published HTML (used once to resync
sources with merged PR fixes); after editing a published page by hand, rerun it.

`layout.css` is the Docker-only visual system (tokens, type, chrome,
surfaces, micro-interactions). Edit it in `/docker/layout.css`; keep the
store backup in sync. Do not change shared `assets/play.css` for Docker polish.
