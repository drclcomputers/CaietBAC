# Caiet BAC — Limba și Literatura Română

A fast, serverless study hub for BAC Romanian-language materials.

## What's inside

```
index.html        the single page (structure + modal markup)
app.js             rendering, search, filters, dark mode, focus-viewer logic
data.js            generated data — one object per study item (title, author, category, image pages, source link, optional pdf)
styles.css         small CSS helpers Tailwind's utility classes can't express (pills, tags, modal nav buttons, custom scrollbar)
assets/            all images + source PDFs, organized by category/work
```

## Content

22 and counting study items across 4 categories, all pulled from the [Prof. Cristea - In Memoriam](https://web.facebook.com/noualimba) Facebook page:

- **Poezie** (7): Floare albastră, Eu nu strivesc corola de minuni a lumii, Plumb, Flori de mucigai, Testament, Riga Crypto și Lapona Enigel, Leoaica tânără, iubirea
- **Proză** (8): Enigma Otiliei, Baltagul, Moara cu noroc, Ion, Iona, O scrisoare pierdută, Moromeții, Ultima noapte de dragoste, întâia noapte de război
- **Curente literare** (5): Modernismul, Neomodernismul, Realismul, Romantismul, Simbolismul
- **Repere** (2): Lista Opere Bac, Tipurile de text — quick-reference sheets

Each work keeps every scanned page as a separate image (viewable in the focus viewer), and the original Facebook source link is shown in the modal's "Sursă & drepturi" drawer.

## Features

- Instant search (title + author) with `/` or `Ctrl/Cmd+K` to focus the search box
- Category filter pills (Toate / Poezie / Proză / Curente literare / Repere)
- Focus-viewer modal: centered image, page dots, prev/next page (buttons, arrow keys, or swipe on mobile), double-click / trackpad-pinch to zoom, collapsible source drawer, and prev/next-work navigation across the current filtered list
- Dark mode toggle (persisted in `localStorage`, defaults to system preference)
- Fully static — works from any static host
