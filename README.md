# World News — Wed 18 Nov 2026

A single 1024x1024 poster summarising six verified world-news stories of 18 November 2026.
`main.ts` copies the committed `assets/entry.png` to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`).
To rebuild the image: edit `art/poster.html`, then run `CHROME_BIN=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome node tools/render.mjs`.
The renderer validates dimensions, size and prints the sha256; source research is in `research/notes.md`.
