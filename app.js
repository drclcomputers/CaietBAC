const PROGRESS_KEY = "caiet-bac-v1";

const ui = {
  query: "",
  category: "all",
  onlyMaps: false,
  onlyReview: false,
  view: "fise",
  page: 0,
  zoom: false,
  scale: 1,
  recapCat: "all",
  recapCursor: 0,
  recapShown: false,
};

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return {
      seen: Array.isArray(raw.seen) ? raw.seen : [],
      review: Array.isArray(raw.review) ? raw.review : [],
      known: Array.isArray(raw.known) ? raw.known : [],
    };
  } catch {
    return { seen: [], review: [], known: [] };
  }
}

let progress = loadProgress();

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function esc(value) {
  const names = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "39" };
  return String(value ?? "").replace(/[&<>"']/g, (ch) => "&" + (ch === "'" ? "#" : "") + names[ch] + ";");
}

function norm(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getItem(id) {
  return STUDY_ITEMS.find((item) => item.id === id) || null;
}

function labelOf(id) {
  return CATEGORIES.find((cat) => cat.id === id)?.label || id;
}

function route() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, "").replace(/^\/+/, ""));
  if (raw === "recap" || raw.startsWith("recap/")) return { name: "recap" };
  if (raw.startsWith("studiu/")) {
    const id = raw.slice(7).split(/[?#]/)[0];
    if (id) return { name: "study", id };
  }
  return { name: "home" };
}

function studyHref(id) {
  return "#/studiu/" + encodeURIComponent(id);
}

function pagesOf(item) {
  const pages = [];
  if (item.mindmap) pages.push({ src: item.mindmap, kind: "harta", scanIndex: 0 });
  item.images.forEach((src, scanIndex) => pages.push({ src, kind: "scan", scanIndex }));
  return pages;
}

function haystack(item) {
  return [
    item.title,
    item.author,
    item.movement,
    item.year,
    item.genre,
    item.species,
    item.remember,
    item.conclusion,
    ...(item.blocks || []).flatMap((block) => [block.title, ...block.points]),
  ]
    .filter(Boolean)
    .join(" ");
}

function siblings(id) {
  const item = getItem(id);
  if (!item) return { prev: null, next: null, index: 0, total: 0 };
  const list = STUDY_ITEMS.filter((entry) => entry.category === item.category);
  const index = list.findIndex((entry) => entry.id === id);
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
    index,
    total: list.length,
  };
}

function sameAuthor(item) {
  if (!item.author) return [];
  return STUDY_ITEMS.filter((entry) => entry.author === item.author && entry.id !== item.id);
}

function linkedCurrent(item) {
  if (item.category === "curente" || item.category === "metode") return null;
  const blob = norm((item.movement || "") + " " + (item.species || ""));
  const rules = [
    [/neomodern/, "curente-neomodernismul"],
    [/simbol/, "curente-simbolismul"],
    [/romant/, "curente-romantismul"],
    [/ermet|modern/, "curente-modernismul"],
    [/realis|balzac/, "curente-realismul"],
  ];
  for (const [pattern, id] of rules) {
    if (pattern.test(blob)) return getItem(id);
  }
  return null;
}

function worksForCurrent(item) {
  if (item.category !== "curente") return [];
  const key = norm(item.title);
  return STUDY_ITEMS.filter((other) => {
    if (!other.movement || other.category === "curente") return false;
    const movement = norm(other.movement);
    if (key.startsWith("neomodern")) return movement.includes("neomodern");
    if (key.startsWith("modern")) return movement.includes("modern") && !movement.includes("neomodern");
    if (key.startsWith("simbol")) return movement.includes("simbol");
    if (key.startsWith("romant")) return movement.includes("romant");
    if (key.startsWith("realism")) return movement.includes("realis");
    return false;
  });
}

function markSeen(id) {
  if (!progress.seen.includes(id)) {
    progress.seen.push(id);
    saveProgress();
  }
}

function toggleReview(id) {
  const on = progress.review.includes(id);
  progress.review = on ? progress.review.filter((x) => x !== id) : progress.review.concat(id);
  if (!on) progress.known = progress.known.filter((x) => x !== id);
  saveProgress();
}

function shell(body, recapOn) {
  const dark = document.documentElement.classList.contains("dark");
  return (
    '<header class="header">' +
    '<a class="brand" href="#/" aria-label="Caiet BAC — acasă"><span class="mark">CB</span>' +
    '<span class="brand-name hide-sm">Caiet <span>BAC</span></span></a>' +
    '<nav class="nav"><a href="#/recap" class="' +
    (recapOn ? "on" : "") +
    '"><span class="show-sm">Recap</span><span class="hide-sm">Recapitulare</span></a>' +
    '<button class="icon-btn" type="button" data-act="theme" aria-label="' +
    (dark ? "Temă deschisă" : "Temă întunecată") +
    '">' +
    (dark ? "☀" : "☾") +
    "</button></nav></header><main>" +
    body +
    "</main>"
  );
}

function card(item) {
  const thumb = item.images[0] || item.mindmap || "";
  const review = progress.review.includes(item.id);
  const poster = item.mindmap && !item.images.length;
  return (
    '<li><article class="card"><a class="hit" href="' +
    studyHref(item.id) +
    '">' +
    '<div class="thumb' +
    (poster ? " top" : "") +
    '">' +
    (thumb
      ? '<img src="' + esc(thumb) + '" alt="" loading="lazy">'
      : '<div style="display:grid;height:100%;place-items:center;font-family:var(--display);font-size:2rem;color:var(--accent)">' +
        esc(item.title.slice(0, 1)) +
        "</div>") +
    '<span class="badge">' +
    esc(labelOf(item.category)) +
    "</span>" +
    (item.mindmap ? '<span class="badge map">Hartă</span>' : "") +
    '</div><div class="card-body"><h2>' +
    esc(item.title) +
    "</h2><p class=\"meta\">" +
    esc([item.author, item.year].filter(Boolean).join(" · ") || item.movement || "") +
    "</p>" +
    (item.species ? "<p>" + esc(item.species) + "</p>" : "") +
    '<p class="meta" style="margin-top:auto;padding-top:.6rem;text-transform:uppercase;font-size:.75rem;font-weight:700">' +
    (item.images.length
      ? item.images.length + (item.images.length === 1 ? " pagină" : " pagini")
      : "Fișă") +
    (item.remember ? " · de reținut" : "") +
    "</p></div></a>" +
    '<button class="star' +
    (review ? " on" : "") +
    '" type="button" data-act="review" data-id="' +
    esc(item.id) +
    '" aria-pressed="' +
    review +
    '" aria-label="' +
    (review ? "Scoate de la repetat" : "Pune la repetat") +
    '">' +
    (review ? "★" : "☆") +
    "</button></article></li>"
  );
}

function home() {
  const q = norm(ui.query.trim());
  const filtered = STUDY_ITEMS.filter((item) => {
    if (ui.category !== "all" && item.category !== ui.category) return false;
    if (ui.onlyMaps && !item.mindmap && !(item.blocks || []).length) return false;
    if (ui.onlyReview && !progress.review.includes(item.id)) return false;
    if (!q) return true;
    return norm(haystack(item)).includes(q);
  });
  const maps = STUDY_ITEMS.filter((item) => item.mindmap).length;
  const pills = CATEGORIES.map(
    (cat) =>
      '<button class="pill' +
      (ui.category === cat.id ? " on" : "") +
      '" type="button" data-act="cat" data-id="' +
      esc(cat.id) +
      '">' +
      esc(cat.label) +
      "</button>",
  ).join("");
  let body =
    '<div class="wrap"><p class="kicker">Limba și literatura română</p><h1>Materiale de studiu</h1>' +
    '<p class="lead">' +
    STUDY_ITEMS.length +
    " fișe, " +
    maps +
    " hărți mentale, " +
    progress.known.length +
    " știute. Pe telefon citești punctele; posterul îl mărești când vrei toată harta.</p>" +
    '<div class="toolbar"><label class="search"><span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden">Caută</span>' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>' +
    '<input id="search-input" value="' +
    esc(ui.query) +
    '" placeholder="Titlu, autor, curent, idee…"></label>' +
    '<div class="views"><button type="button" data-act="view" data-id="fise" class="' +
    (ui.view === "fise" ? "on" : "") +
    '">Fișe</button><button type="button" data-act="view" data-id="programa" class="' +
    (ui.view === "programa" ? "on" : "") +
    '">Programă</button></div></div>';

  if (ui.view === "fise") {
    body +=
      '<div class="pills">' +
      pills +
      '<button class="pill' +
      (ui.onlyMaps ? " on-accent" : "") +
      '" type="button" data-act="maps">Cu hartă</button>' +
      '<button class="pill' +
      (ui.onlyReview ? " on-accent" : "") +
      '" type="button" data-act="only-review">De repetat' +
      (progress.review.length ? " · " + progress.review.length : "") +
      "</button></div>";
  }
  body +=
    '<p class="meta">' +
    (ui.view === "fise"
      ? filtered.length +
        (filtered.length === 1 ? " rezultat" : " rezultate") +
        " · " +
        progress.seen.length +
        " deschise"
      : "Programă orientativă pentru subiectul al III-lea. Rândurile cu fișă se deschid.") +
    "</p>";
  body += ui.view === "programa" ? syllabus() : filtered.length ? '<ul class="cards">' + filtered.map(card).join("") + "</ul>" : '<p class="lead" style="text-align:center;padding:3rem 0">Niciun rezultat.</p>';
  body += '<p class="foot">Sursele originale sunt la fiecare fișă. Hărțile mentale stau lângă comentariile scanate, nu le înlocuiesc.</p></div>';
  return body;
}

function syllabus() {
  const q = norm(ui.query.trim());
  const rows = SYLLABUS.filter((row) => {
    if (!q) return true;
    return norm(row.era + " " + row.period + " " + row.orientation + " " + row.species + " " + row.work).includes(q);
  });
  if (!rows.length) return '<p class="lead">Nicio operă din programă nu se potrivește.</p>';
  const groups = [];
  rows.forEach((row) => {
    const key = row.era + "|||" + row.period;
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) groups.push({ key, era: row.era, period: row.period, footnote: row.footnote, rows: [row] });
    else last.rows.push(row);
  });
  return (
    '<div class="groups">' +
    groups
      .map((group) => {
        const items = group.rows
          .map((row) => {
            const inner =
              '<p class="meta" style="color:var(--accent);font-weight:700">' +
              esc(row.orientation) +
              '</p><p style="font-family:var(--display);font-size:1.1rem;font-weight:650;margin:.2rem 0">' +
              esc(row.work) +
              '</p><p class="meta">' +
              esc(row.species) +
              "</p><p class=\"meta\" style=\"margin-top:.5rem;font-weight:700;color:var(--stamp)\">" +
              (row.studyId ? "Deschide fișa" : "Doar în programă, fără scanări aici") +
              "</p>";
            return "<li>" + (row.studyId ? '<a href="' + studyHref(row.studyId) + '">' + inner + "</a>" : "<article>" + inner + "</article>") + "</li>";
          })
          .join("");
        return (
          "<section><p class=\"meta\" style=\"text-transform:uppercase;font-size:.75rem;font-weight:700\">" +
          esc(group.era) +
          "</p><h2>" +
          esc(group.period) +
          "</h2>" +
          (group.footnote ? '<p class="meta">' + esc(group.footnote) + "</p>" : "") +
          '<ul class="rows">' +
          items +
          "</ul></section>"
        );
      })
      .join("") +
    "</div>"
  );
}

function workLink(item) {
  const thumb = item.mindmap || item.images[0];
  return (
    "<li><a href=\"" +
    studyHref(item.id) +
    '">' +
    (thumb ? '<img src="' + esc(thumb) + '" alt="">' : "") +
    "<span><strong style=\"font-family:var(--display)\">" +
    esc(item.title) +
    '</strong><span class="meta" style="display:block">' +
    esc(item.author || item.movement || "") +
    "</span></span></a></li>"
  );
}

function study(item) {
  markSeen(item.id);
  const pages = pagesOf(item);
  if (ui.page >= pages.length) ui.page = 0;
  const page = pages[ui.page];
  const scans = pages.filter((entry) => entry.kind === "scan").length;
  const pageLabel = !page
    ? "Fără imagine"
    : page.kind === "harta"
      ? "Hartă mentală"
      : scans > 1
        ? "Pagina " + (page.scanIndex + 1) + " / " + scans
        : "Comentariu";
  const nav = siblings(item.id);
  const review = progress.review.includes(item.id);
  const blocks = (item.blocks || [])
    .map(
      (block) =>
        '<article class="block"><h2>' +
        esc(block.title) +
        "</h2><ul>" +
        block.points
          .map((point) => "<li><span class=\"dot\"></span><span>" + esc(point) + "</span></li>")
          .join("") +
        "</ul></article>",
    )
    .join("");
  const current = linkedCurrent(item);
  const related = worksForCurrent(item);
  const authorWorks = sameAuthor(item);
  let media = "";
  if (page) {
    const thumbs = pages
      .map(
        (entry, index) =>
          '<button type="button" class="' +
          (index === ui.page ? "on" : "") +
          '" data-act="page" data-id="' +
          index +
          '" aria-label="' +
          (entry.kind === "harta" ? "Hartă mentală" : "Pagina " + (entry.scanIndex + 1)) +
          '"><img src="' +
          esc(entry.src) +
          '" alt=""></button>',
      )
      .join("");
    media =
      '<div class="stage-box"><div class="stage-head"><p data-label style="margin:0;font-weight:700">' +
      esc(pageLabel) +
      '</p><button class="btn solid no-print" type="button" data-act="zoom">Mărește</button></div>' +
      '<div class="stage" data-stage><button type="button" data-act="zoom" aria-label="Mărește ' +
      esc(item.title) +
      '" style="border:0;background:transparent;padding:0;width:100%;max-width:100%"><img data-main decoding="async" src="' +
      esc(page.src) +
      '" alt="' +
      esc(page.kind === "harta" ? "Hartă mentală: " + item.title : item.title + ", pagina " + (page.scanIndex + 1)) +
      '"></button></div>' +
      (pages.length > 1
        ? '<div class="pager no-print"><button class="btn" type="button" data-act="step" data-id="-1" aria-label="Anterior"' +
          (ui.page === 0 ? " disabled" : "") +
          '>← <span class="hide-sm">Anterior</span></button><strong data-count>' +
          (ui.page + 1) +
          " / " +
          pages.length +
          '</strong><button class="btn" type="button" data-act="step" data-id="1" aria-label="Următor"' +
          (ui.page === pages.length - 1 ? " disabled" : "") +
          '><span class="hide-sm">Următor</span> →</button></div><div class="film no-print">' +
          thumbs +
          "</div>"
        : "") +
      "</div>";
  } else {
    media = '<p class="sheet">Fișa asta are doar punctele de mai jos, fără scanare.</p>';
  }

  let html =
    '<div class="wrap"><div class="topbar"><a class="back" href="#/">← Toate fișele</a>' +
    '<p class="meta" style="font-weight:700;margin:0">' +
    esc(labelOf(item.category)) +
    (nav.total > 1 ? " · " + (nav.index + 1) + " / " + nav.total : "") +
    "</p></div>" +
    '<div class="title-row"><div><h1>' +
    esc(item.title) +
    '</h1><p class="meta" style="font-size:1.05rem">' +
    esc([item.author, item.year, item.movement].filter(Boolean).join(" · ") || labelOf(item.category)) +
    "</p>" +
    (item.species ? "<p>" + esc(item.species) + "</p>" : "") +
    "</div>" +
    '<button class="btn no-print' +
    (review ? " accent" : "") +
    '" type="button" data-act="review" data-id="' +
    esc(item.id) +
    '" aria-pressed="' +
    review +
    '">' +
    (review ? "La repetat" : "Pune la repetat") +
    "</button></div>";
  if (item.remember) html += '<p class="remember"><strong>De reținut: </strong>' + esc(item.remember) + "</p>";
  if (page) html += '<a class="jump no-print" href="#material">Vezi harta sau paginile</a>';
  html +=
    '<div class="study"><section class="material" id="material">' +
    media +
    '</section><aside class="notes">' +
    (blocks || '<p class="sheet">Pentru opera asta ai comentariul scanat. Deschide paginile și mărește-le ca să citești liniile.</p>') +
    (item.conclusion ? '<p class="sheet">' + esc(item.conclusion) + "</p>" : "") +
    (item.source
      ? '<p class="meta">Sursă originală: <a href="' +
        esc(item.source) +
        '" target="_blank" rel="noreferrer" style="color:var(--accent);font-weight:700;word-break:break-all">' +
        esc(item.source) +
        "</a></p>"
      : "") +
    "</aside></div>";
  if (current) html += '<p>Curent: <a href="' + studyHref(current.id) + '" style="color:var(--accent);font-weight:700">' + esc(current.title) + "</a></p>";
  if (related.length) html += "<h2>Opere din " + esc(item.title.toLowerCase()) + '</h2><ul class="links">' + related.map(workLink).join("") + "</ul>";
  if (authorWorks.length) html += "<h2>Tot de " + esc(item.author) + '</h2><ul class="links">' + authorWorks.map(workLink).join("") + "</ul>";
  html += '<nav class="sibs no-print">';
  html += nav.prev
    ? '<a href="' + studyHref(nav.prev.id) + '"><span class="meta">Anterior</span><strong style="display:block;font-family:var(--display);font-size:1.15rem">' + esc(nav.prev.title) + "</strong></a>"
    : "<span></span>";
  if (nav.next) {
    html +=
      '<a href="' +
      studyHref(nav.next.id) +
      '" style="text-align:right"><span class="meta">Următor</span><strong style="display:block;font-family:var(--display);font-size:1.15rem">' +
      esc(nav.next.title) +
      "</strong></a>";
  }
  html += "</nav></div>";
  if (ui.zoom && page) html += zoom(item, page, pageLabel, pages.length > 1);
  return html;
}

function zoom(item, page, pageLabel, canStep) {
  const wide = ui.scale > 1;
  return (
    '<div class="zoom" role="dialog" aria-modal="true" aria-label="' +
    esc(pageLabel) +
    '"><div class="zoom-bar"><p>' +
    esc(item.title) +
    " · " +
    esc(pageLabel) +
    '</p><button type="button" data-act="scale" data-id="-1" aria-label="Micșorează">−</button><span>' +
    Math.round(ui.scale * 100) +
    '%</span><button type="button" data-act="scale" data-id="1" aria-label="Mărește">+</button><button type="button" data-act="close" aria-label="Închide">Închide</button></div>' +
    '<div class="zoom-view" data-zoom><img src="' +
    esc(page.src) +
    '" alt="' +
    esc(item.title) +
    '" style="' +
    (wide ? "width:" + ui.scale * 90 + "vw;max-width:none;max-height:none" : "") +
    '"></div>' +
    (canStep
      ? '<div class="zoom-nav"><button type="button" data-act="step" data-id="-1">← Anterior</button><button type="button" data-act="step" data-id="1" style="margin-left:auto">Următor →</button></div>'
      : "") +
    "</div>"
  );
}

function recap() {
  const pool = STUDY_ITEMS.filter((item) => ui.recapCat === "all" || item.category === ui.recapCat);
  const due = pool.filter((item) => progress.review.includes(item.id));
  const fresh = pool.filter((item) => !progress.known.includes(item.id));
  const queue = due.length ? due : fresh.length ? fresh : pool;
  const item = queue.length ? queue[ui.recapCursor % queue.length] : null;
  const knownCount = STUDY_ITEMS.filter((entry) => progress.known.includes(entry.id)).length;
  const pills = CATEGORIES.map(
    (cat) =>
      '<button class="pill' +
      (ui.recapCat === cat.id ? " on" : "") +
      '" type="button" data-act="recap-cat" data-id="' +
      esc(cat.id) +
      '">' +
      esc(cat.label) +
      "</button>",
  ).join("");
  let cardHtml = '<p class="lead" style="text-align:center">Nimic în categoria asta.</p>';
  if (item) {
    cardHtml =
      '<article class="flash"><p class="meta">' +
      esc([item.author, item.year, item.species].filter(Boolean).join(" · ") || item.movement || "") +
      "</p><h2 style=\"font-size:clamp(1.7rem,4vw,2.3rem);margin:.3rem 0 0\">" +
      esc(item.title) +
      "</h2>" +
      (ui.recapShown
        ? '<div style="margin-top:1rem;font-size:1.15rem;line-height:1.5">' +
          (item.remember ? "<p><strong>De reținut: </strong>" + esc(item.remember) + "</p>" : "") +
          (item.conclusion ? "<p>" + esc(item.conclusion) + "</p>" : "") +
          (item.movement ? '<p class="meta">' + esc(item.movement) + "</p>" : "") +
          "</div>"
        : '<p class="meta" style="font-size:1.1rem">An, curent, specie, formula de reținut.</p>') +
      '<div class="actions">' +
      (ui.recapShown
        ? '<button class="btn" type="button" data-act="again">Mai repet</button><button class="btn solid" type="button" data-act="known">Știam</button>'
        : '<button class="btn accent" type="button" data-act="show">Arată răspunsul</button>') +
      '<a class="btn" href="' +
      studyHref(item.id) +
      '" style="color:var(--accent)">Deschide fișa</a></div></article>';
  }
  return (
    '<div class="wrap" style="max-width:52rem"><p class="kicker">Recapitulare</p><h1>Spune formula, apoi verifică</h1>' +
    '<p class="lead">' +
    knownCount +
    " știute din " +
    STUDY_ITEMS.length +
    '. Dacă ai fișe puse la repetat, apar primele.</p><div class="progress" role="progressbar" aria-valuenow="' +
    knownCount +
    '" aria-valuemin="0" aria-valuemax="' +
    STUDY_ITEMS.length +
    '"><span style="width:' +
    (knownCount / STUDY_ITEMS.length) * 100 +
    '%"></span></div><div class="pills">' +
    pills +
    "</div>" +
    cardHtml +
    "</div>"
  );
}

function render(scroll) {
  const search = document.getElementById("search-input");
  const caret = search && document.activeElement === search ? search.selectionStart : null;
  const current = route();
  let title = "Caiet BAC · Limba și literatura română";
  let body = "";
  if (current.name === "recap") {
    title = "Recapitulare · Caiet BAC";
    body = recap();
  } else if (current.name === "study") {
    const item = getItem(current.id);
    if (!item) {
      title = "Fișă · Caiet BAC";
      body = '<div class="wrap" style="text-align:center;padding:4rem 1rem"><h1>Fișa nu există</h1><p><a href="#/">Toate fișele</a></p></div>';
    } else {
      title = item.title + " · Caiet BAC";
      body = study(item);
    }
  } else {
    body = home();
  }
  document.title = title;
  document.getElementById("app").innerHTML = shell(body, current.name === "recap");
  if (caret != null) {
    const next = document.getElementById("search-input");
    if (next) {
      next.focus();
      next.setSelectionRange(caret, caret);
    }
  }
  if (scroll) window.scrollTo(0, 0);
  if (current.name === "study") {
    const item = getItem(current.id);
    if (item) {
      const pages = pagesOf(item);
      warmAround(pages, ui.page);
      window.setTimeout(() => pages.forEach((page) => warm(page.src)), 300);
    }
  }
  const stage = document.querySelector("[data-stage]");
  if (stage) {
    let start = null;
    stage.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length === 1) start = event.touches[0].clientX;
      },
      { passive: true },
    );
    stage.addEventListener("touchend", (event) => {
      if (start == null) return;
      const dx = event.changedTouches[0].clientX - start;
      start = null;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    });
  }
}

function labelFor(pages, index) {
  const page = pages[index];
  if (!page) return "Fără imagine";
  const scans = pages.filter((entry) => entry.kind === "scan").length;
  if (page.kind === "harta") return "Hartă mentală";
  if (scans > 1) return "Pagina " + (page.scanIndex + 1) + " / " + scans;
  return "Comentariu";
}

const warmed = new Set();
function warm(src) {
  if (!src || warmed.has(src)) return;
  warmed.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

function warmAround(pages, index) {
  pages.forEach((page, i) => {
    if (Math.abs(i - index) <= 2) warm(page.src);
  });
}

function paintPage() {
  const current = route();
  if (current.name !== "study") return false;
  const item = getItem(current.id);
  const img = document.querySelector("[data-main]");
  if (!item || !img) return false;
  const pages = pagesOf(item);
  const page = pages[ui.page];
  if (!page) return false;
  img.src = page.src;
  img.alt = page.kind === "harta" ? "Hartă mentală: " + item.title : item.title + ", pagina " + (page.scanIndex + 1);
  const label = document.querySelector("[data-label]");
  if (label) label.textContent = labelFor(pages, ui.page);
  const count = document.querySelector("[data-count]");
  if (count) count.textContent = ui.page + 1 + " / " + pages.length;
  document.querySelectorAll("[data-act=page]").forEach((button) => {
    button.classList.toggle("on", Number(button.dataset.id) === ui.page);
  });
  document.querySelectorAll("[data-act=step][data-id='-1']").forEach((button) => {
    button.disabled = ui.page === 0;
  });
  document.querySelectorAll("[data-act=step][data-id='1']").forEach((button) => {
    button.disabled = ui.page === pages.length - 1;
  });
  const zoomImg = document.querySelector("[data-zoom] img");
  if (zoomImg) {
    zoomImg.src = page.src;
    if (ui.scale <= 1) zoomImg.removeAttribute("style");
  }
  warmAround(pages, ui.page);
  return true;
}

function step(delta) {
  const current = route();
  if (current.name !== "study") return;
  const item = getItem(current.id);
  if (!item) return;
  const total = pagesOf(item).length;
  const next = ui.page + delta;
  if (next < 0 || next >= total) return;
  ui.page = next;
  ui.scale = 1;
  if (!paintPage()) render(false);
}

function answer(remembered) {
  const pool = STUDY_ITEMS.filter((item) => ui.recapCat === "all" || item.category === ui.recapCat);
  const due = pool.filter((item) => progress.review.includes(item.id));
  const fresh = pool.filter((item) => !progress.known.includes(item.id));
  const queue = due.length ? due : fresh.length ? fresh : pool;
  const item = queue[ui.recapCursor % queue.length];
  if (!item) return;
  if (remembered) {
    if (!progress.known.includes(item.id)) progress.known.push(item.id);
    progress.review = progress.review.filter((id) => id !== item.id);
    if (!progress.seen.includes(item.id)) progress.seen.push(item.id);
  } else {
    if (!progress.review.includes(item.id)) progress.review.push(item.id);
    progress.known = progress.known.filter((id) => id !== item.id);
    if (!progress.seen.includes(item.id)) progress.seen.push(item.id);
  }
  saveProgress();
  ui.recapShown = false;
  ui.recapCursor += 1;
  render(false);
}

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act === "theme") {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("caiet-theme", next ? "dark" : "light");
    render(false);
  } else if (act === "cat") {
    ui.category = el.dataset.id;
    render(false);
  } else if (act === "view") {
    ui.view = el.dataset.id;
    render(false);
  } else if (act === "maps") {
    ui.onlyMaps = !ui.onlyMaps;
    render(false);
  } else if (act === "only-review") {
    ui.onlyReview = !ui.onlyReview;
    render(false);
  } else if (act === "review") {
    event.preventDefault();
    event.stopPropagation();
    toggleReview(el.dataset.id);
    render(false);
  } else if (act === "zoom") {
    ui.zoom = true;
    ui.scale = 1;
    render(false);
  } else if (act === "close") {
    ui.zoom = false;
    ui.scale = 1;
    render(false);
  } else if (act === "step") {
    step(Number(el.dataset.id));
  } else if (act === "page") {
    const index = Number(el.dataset.id);
    if (index === ui.page) return;
    ui.page = index;
    ui.scale = 1;
    if (!paintPage()) render(false);
  } else if (act === "scale") {
    ui.scale = Math.min(4, Math.max(1, ui.scale + Number(el.dataset.id) * 0.25));
    render(false);
  } else if (act === "recap-cat") {
    ui.recapCat = el.dataset.id;
    ui.recapCursor = 0;
    ui.recapShown = false;
    render(false);
  } else if (act === "show") {
    ui.recapShown = true;
    render(false);
  } else if (act === "known") {
    answer(true);
  } else if (act === "again") {
    answer(false);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "search-input") {
    ui.query = event.target.value;
    render(false);
  }
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName.toLowerCase() || "";
  const typing = tag === "input" || tag === "textarea";
  if (typing) {
    if (event.key === "Escape") document.activeElement.blur();
    return;
  }
  if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
    const input = document.getElementById("search-input");
    if (input) {
      event.preventDefault();
      input.focus();
    }
  } else if (event.key === "Escape" && ui.zoom) {
    ui.zoom = false;
    ui.scale = 1;
    render(false);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    step(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    step(1);
  } else if ((event.key === "+" || event.key === "=") && ui.zoom) {
    ui.scale = Math.min(4, ui.scale + 0.25);
    render(false);
  } else if ((event.key === "-" || event.key === "_") && ui.zoom) {
    ui.scale = Math.max(1, ui.scale - 0.25);
    render(false);
  }
});

let lastHash = location.hash;
window.addEventListener("hashchange", () => {
  if (location.hash !== lastHash) {
    lastHash = location.hash;
    ui.page = 0;
    ui.zoom = false;
    ui.scale = 1;
    render(true);
  }
});

render(false);
