# Caiet BAC — Limba și Literatura Română

Un hub de studiu rapid și serverless pentru materialele de BAC la Limba și Literatura Română.

> 📜 *Derulează în jos pentru a explora structura proiectului, conținutul și funcționalitățile disponibile.*
> 💡 *Sfat: Folosește scurtăturile de la tastatură pentru a naviga rapid prin materiale și opere.*

## Ce găsești în interior

```
index.html         pagina unică (structură + markup pentru modal)
app.js             randare, căutare, filtre, modul întunecat, logica vizualizatorului
data.js            date generate — câte un obiect pentru fiecare material (titlu, autor, categorie, imagini pagini, link sursă, pdf opțional)
styles.css         mici ajutoare CSS pe care clasele utilitare Tailwind nu le pot exprima (pastile, etichete, butoane navigare modal, scrollbar personalizat)
assets/            toate imaginile + PDF-urile sursă, organizate pe categorii/opere

```

## Conținut

22 de materiale de studiu (numărul este în creștere) împărțite în 4 categorii, toate preluate de pe pagina de Facebook [Prof. Cristea - In Memoriam](https://web.facebook.com/noualimba):

* **Poezie** (7): Floare albastră, Eu nu strivesc corola de minuni a lumii, Plumb, Flori de mucigai, Testament, Riga Crypto și Lapona Enigel, Leoaica tânără, iubirea
* **Proză** (8): Enigma Otiliei, Baltagul, Moara cu noroc, Ion, Iona, O scrisoare pierdută, Moromeții, Ultima noapte de dragoste, întâia noapte de război
* **Curente literare** (5): Modernismul, Neomodernismul, Realismul, Romantismul, Simbolismul
* **Repere** (2): Lista Opere Bac, Tipurile de text — fișe de referință rapidă

Fiecare operă păstrează fiecare pagină scanată ca o imagine separată (vizibilă în modul focalizat), iar linkul original de Facebook este afișat în secțiunea "Sursă & drepturi" din modal.

## Funcționalități

* Căutare instantă (titlu + autor) folosind tasta `/` sau comanda `Ctrl/Cmd+K` pentru a activa caseta de căutare
* Filtrare pe categorii (Toate / Poezie / Proză / Curente literare / Repere)
* Vizualizator modal focalizat: imagine centrată, puncte de navigare între pagini, pagina anterioară/următoare (butoane, taste sageti sau glisare pe mobil), dublu-click / pinch pe trackpad pentru zoom, secțiune de sursă pliabilă și navigare între opere din lista filtrată curent
* Comutator pentru modul întunecat (salvat în `localStorage`, implicit preia preferința sistemului)
* Complet static — funcționează de pe orice gazdă statică

---

# BAC Notebook — Romanian Language & Literature

A fast, serverless study hub for BAC Romanian-language materials.

> 📜 *Scroll down to explore the project structure, contents, and available features.*
> 💡 *Tip: Use keyboard shortcuts to quickly search and navigate through study materials.*

## What's inside

```
index.html         the single page (structure + modal markup)
app.js             rendering, search, filters, dark mode, focus-viewer logic
data.js            generated data — one object per study item (title, author, category, image pages, source link, optional pdf)
styles.css         small CSS helpers Tailwind's utility classes can't express (pills, tags, modal nav buttons, custom scrollbar)
assets/            all images + source PDFs, organized by category/work

```

## Content

22 and counting study items across 4 categories, all pulled from the [Prof. Cristea - In Memoriam](https://web.facebook.com/noualimba) Facebook page:

* **Poezie** (7): Floare albastră, Eu nu strivesc corola de minuni a lumii, Plumb, Flori de mucigai, Testament, Riga Crypto și Lapona Enigel, Leoaica tânără, iubirea
* **Proză** (8): Enigma Otiliei, Baltagul, Moara cu noroc, Ion, Iona, O scrisoare pierdută, Moromeții, Ultima noapte de dragoste, întâia noapte de război
* **Curente literare** (5): Modernismul, Neomodernismul, Realismul, Romantismul, Simbolismul
* **Repere** (2): Lista Opere Bac, Tipurile de text — quick-reference sheets

Each work keeps every scanned page as a separate image (viewable in the focus viewer), and the original Facebook source link is shown in the modal's "Sursă & drepturi" drawer.

## Features

* Instant search (title + author) with `/` or `Ctrl/Cmd+K` to focus the search box
* Category filter pills (Toate / Poezie / Proză / Curente literare / Repere)
* Focus-viewer modal: centered image, page dots, prev/next page (buttons, arrow keys, or swipe on mobile), double-click / trackpad-pinch to zoom, collapsible source drawer, and prev/next-work navigation across the current filtered list
* Dark mode toggle (persisted in `localStorage`, defaults to system preference)
* Fully static — works from any static host
