// ============================================================
// Caiet BAC — app.js
// Renders study cards from STUDY_ITEMS (data.js), handles search,
// category filtering, dark mode, and the focus-viewer modal.
// ============================================================

(function () {
    "use strict";

    const CATEGORIES = [
        { id: "all", label: "Toate" },
        { id: "poezie", label: "Poezie" },
        { id: "proza", label: "Proză" },
        { id: "curente", label: "Curente literare" },
        { id: "repere", label: "Repere" },
    ];

    const TAG_CLASS = {
        poezie: "tag-poezie",
        proza: "tag-proza",
        curente: "tag-curente",
        repere: "tag-repere",
    };

    const state = {
        query: "",
        category: "all",
        filtered: STUDY_ITEMS.slice(),
        modal: {
            open: false,
            workIndex: -1, // index into state.filtered
            pageIndex: 0,
            zoomed: false,
        },
    };

    // ---------- DOM refs ----------
    const $grid = document.getElementById("study-grid");
    const $empty = document.getElementById("empty-state");
    const $count = document.getElementById("results-count");
    const $pills = document.getElementById("filter-pills");
    const $search = document.getElementById("search-input");
    const $themeToggle = document.getElementById("theme-toggle");

    const $modalRoot = document.getElementById("modal-root");
    const $modalBackdrop = document.getElementById("modal-backdrop");
    const $modalClose = document.getElementById("modal-close");
    const $modalTitle = document.getElementById("modal-title");
    const $modalAuthor = document.getElementById("modal-author");
    const $modalPageIndicator = document.getElementById("modal-page-indicator");
    const $modalImg = document.getElementById("modal-img");
    const $modalImgWrap = document.getElementById("modal-img-wrap");
    const $modalPrevPage = document.getElementById("modal-prev-page");
    const $modalNextPage = document.getElementById("modal-next-page");
    const $modalDots = document.getElementById("modal-dots");
    const $modalDrawerToggle = document.getElementById("modal-drawer-toggle");
    const $modalDrawerBody = document.getElementById("modal-drawer-body");
    const $modalDrawerChevron = document.getElementById("modal-drawer-chevron");
    const $modalSourceLine = document.getElementById("modal-source-line");
    const $modalPdfLink = document.getElementById("modal-pdf-link");
    const $modalPrevWork = document.getElementById("modal-prev-work");
    const $modalNextWork = document.getElementById("modal-next-work");

    // ============================================================
    // THEME
    // ============================================================
    function initTheme() {
        const saved = localStorage.getItem("bac-theme");
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches;
        const isDark = saved ? saved === "dark" : prefersDark;
        document.documentElement.classList.toggle("dark", isDark);
    }
    $themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("bac-theme", isDark ? "dark" : "light");
    });

    // ============================================================
    // FILTER PILLS
    // ============================================================
    function renderPills() {
        $pills.innerHTML = "";
        CATEGORIES.forEach((cat) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = cat.label;
            btn.className =
                "pill " +
                (state.category === cat.id ? "pill-active" : "pill-inactive");
            btn.addEventListener("click", () => {
                state.category = cat.id;
                applyFilters();
                renderPills();
            });
            $pills.appendChild(btn);
        });
    }

    // ============================================================
    // SEARCH + FILTER
    // ============================================================
    function normalize(str) {
        return (str || "")
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function applyFilters() {
        const q = normalize(state.query.trim());
        state.filtered = STUDY_ITEMS.filter((item) => {
            const matchesCategory =
                state.category === "all" || item.category === state.category;
            if (!matchesCategory) return false;
            if (!q) return true;
            const haystack =
                normalize(item.title) + " " + normalize(item.author || "");
            return haystack.includes(q);
        });
        renderGrid();
    }

    $search.addEventListener("input", (e) => {
        state.query = e.target.value;
        applyFilters();
    });

    // keyboard shortcuts: "/" or Ctrl/Cmd+K focuses search
    document.addEventListener("keydown", (e) => {
        const tag =
            (document.activeElement && document.activeElement.tagName) || "";
        const typing = tag === "INPUT" || tag === "TEXTAREA";

        if (!state.modal.open) {
            if (
                (e.key === "/" && !typing) ||
                ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
            ) {
                e.preventDefault();
                $search.focus();
                $search.select();
            }
            return;
        }

        // modal is open — handle its own shortcuts
        if (e.key === "Escape") {
            closeModal();
            return;
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            stepPage(-1);
            return;
        }
        if (e.key === "ArrowRight") {
            e.preventDefault();
            stepPage(1);
            return;
        }
    });

    // ============================================================
    // GRID / CARDS
    // ============================================================
    function renderGrid() {
        $grid.innerHTML = "";
        $count.textContent =
            state.filtered.length +
            (state.filtered.length === 1 ? " rezultat" : " rezultate");

        if (state.filtered.length === 0) {
            $grid.classList.add("hidden");
            $empty.classList.remove("hidden");
            $empty.classList.add("flex");
            return;
        }
        $grid.classList.remove("hidden");
        $empty.classList.add("hidden");
        $empty.classList.remove("flex");

        const frag = document.createDocumentFragment();
        state.filtered.forEach((item, idx) => {
            frag.appendChild(buildCard(item, idx));
        });
        $grid.appendChild(frag);
    }

    function catLabel(id) {
        const found = CATEGORIES.find((c) => c.id === id);
        return found ? found.label : id;
    }

    function buildCard(item, idx) {
        const card = document.createElement("article");
        card.className = "study-card group";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", "Deschide " + item.title);

        const thumb = item.images && item.images[0] ? item.images[0] : "";
        const pageCount = item.images ? item.images.length : 0;

        card.innerHTML = `
      <div class="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img src="${thumb}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async"
             class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ${pageCount > 1 ? `<span class="absolute bottom-2 right-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-900/70 text-white backdrop-blur-sm">${pageCount} pag.</span>` : ""}
      </div>
      <div class="p-4">
        <span class="tag ${TAG_CLASS[item.category] || "tag-repere"}">${escapeHtml(catLabel(item.category))}</span>
        <h3 class="mt-2 font-display font-semibold text-[1.05rem] leading-snug tracking-tight line-clamp-2">${escapeHtml(item.title)}</h3>
        ${item.author ? `<p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">${escapeHtml(item.author)}</p>` : ""}
      </div>
    `;

        const open = () => openModal(idx);
        card.addEventListener("click", open);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
            }
        });

        return card;
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : str;
        return div.innerHTML;
    }

    // ============================================================
    // MODAL / FOCUS VIEWER
    // ============================================================
    function openModal(workIndex) {
        state.modal.open = true;
        state.modal.workIndex = workIndex;
        state.modal.pageIndex = 0;
        state.modal.zoomed = false;
        $modalRoot.classList.remove("hidden");
        document.body.style.overflow = "hidden";
        renderModal();
    }

    function closeModal() {
        state.modal.open = false;
        $modalRoot.classList.add("hidden");
        document.body.style.overflow = "";
    }

    function currentWork() {
        return state.filtered[state.modal.workIndex];
    }

    function renderModal() {
        const work = currentWork();
        if (!work) {
            closeModal();
            return;
        }

        $modalTitle.textContent = work.title;
        $modalAuthor.textContent = work.author || catLabel(work.category);

        const total = work.images.length;
        const page = Math.min(state.modal.pageIndex, total - 1);
        state.modal.pageIndex = page;

        $modalPageIndicator.textContent =
            total > 1 ? `${page + 1} / ${total}` : "";
        $modalPageIndicator.classList.toggle("hidden", total <= 1);

        setImage(work.images[page]);

        // page dots
        $modalDots.innerHTML = "";
        if (total > 1) {
            work.images.forEach((_, i) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.setAttribute("aria-label", "Pagina " + (i + 1));
                dot.className = "dot " + (i === page ? "dot-active" : "");
                dot.addEventListener("click", () => {
                    state.modal.pageIndex = i;
                    renderModal();
                });
                $modalDots.appendChild(dot);
            });
        }

        $modalPrevPage.disabled = page <= 0;
        $modalNextPage.disabled = page >= total - 1;
        $modalPrevPage.classList.toggle("hidden", total <= 1);
        $modalNextPage.classList.toggle("hidden", total <= 1);

        // drawer / source
        if (work.source) {
            $modalSourceLine.innerHTML = `Sursă originală: <a href="${escapeHtml(work.source)}" target="_blank" rel="noopener" class="text-accent hover:underline break-all">${escapeHtml(work.source)}</a>`;
        } else {
            $modalSourceLine.textContent =
                "Sursă originală neindicată pentru acest material.";
        }
        if (work.pdf) {
            $modalPdfLink.href = work.pdf;
            $modalPdfLink.classList.remove("hidden");
        } else {
            $modalPdfLink.classList.add("hidden");
        }

        $modalPrevWork.disabled = state.modal.workIndex <= 0;
        $modalNextWork.disabled =
            state.modal.workIndex >= state.filtered.length - 1;
        $modalPrevWork.style.opacity = $modalPrevWork.disabled ? ".35" : "1";
        $modalNextWork.style.opacity = $modalNextWork.disabled ? ".35" : "1";
    }

    function setImage(src) {
        state.modal.zoomed = false;
        $modalImg.style.transform = "scale(1)";
        $modalImg.classList.remove("cursor-zoom-out");
        $modalImg.classList.add("cursor-zoom-in");
        $modalImg.src = src;
    }

    function stepPage(delta) {
        const work = currentWork();
        if (!work) return;
        const next = state.modal.pageIndex + delta;
        if (next < 0 || next >= work.images.length) return;
        state.modal.pageIndex = next;
        renderModal();
    }

    function stepWork(delta) {
        const next = state.modal.workIndex + delta;
        if (next < 0 || next >= state.filtered.length) return;
        state.modal.workIndex = next;
        state.modal.pageIndex = 0;
        renderModal();
    }

    $modalClose.addEventListener("click", closeModal);
    $modalBackdrop.addEventListener("click", closeModal);
    $modalPrevPage.addEventListener("click", () => stepPage(-1));
    $modalNextPage.addEventListener("click", () => stepPage(1));
    $modalPrevWork.addEventListener("click", () => stepWork(-1));
    $modalNextWork.addEventListener("click", () => stepWork(1));

    $modalDrawerToggle.addEventListener("click", () => {
        const hidden = $modalDrawerBody.classList.toggle("hidden");
        $modalDrawerChevron.style.transform = hidden
            ? "rotate(0deg)"
            : "rotate(180deg)";
    });

    // double-click / double-tap to zoom (simple pinch-friendly zoom toggle)
    $modalImg.addEventListener("dblclick", () => {
        state.modal.zoomed = !state.modal.zoomed;
        $modalImg.style.transform = state.modal.zoomed
            ? "scale(2)"
            : "scale(1)";
        $modalImg.classList.toggle("cursor-zoom-in", !state.modal.zoomed);
        $modalImg.classList.toggle("cursor-zoom-out", state.modal.zoomed);
    });

    // trackpad pinch (Chrome/Edge fire wheel + ctrlKey on pinch gestures)
    $modalImgWrap.addEventListener(
        "wheel",
        (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            const current =
                parseFloat(
                    (/scale\(([\d.]+)\)/.exec($modalImg.style.transform) || [
                        0, 1,
                    ])[1],
                ) || 1;
            const next = Math.min(3, Math.max(1, current - e.deltaY * 0.01));
            $modalImg.style.transform = `scale(${next})`;
            state.modal.zoomed = next > 1.02;
        },
        { passive: false },
    );

    // swipe left/right on mobile to change pages
    (function enableSwipe() {
        let startX = null,
            startY = null;
        $modalImgWrap.addEventListener(
            "touchstart",
            (e) => {
                if (e.touches.length !== 1) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            },
            { passive: true },
        );
        $modalImgWrap.addEventListener(
            "touchend",
            (e) => {
                if (startX === null) return;
                const endX = (e.changedTouches[0] || {}).clientX ?? startX;
                const endY = (e.changedTouches[0] || {}).clientY ?? startY;
                const dx = endX - startX,
                    dy = endY - startY;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    stepPage(dx < 0 ? 1 : -1);
                }
                startX = null;
                startY = null;
            },
            { passive: true },
        );
    })();

    // ============================================================
    // INIT
    // ============================================================
    initTheme();
    renderPills();
    applyFilters();
})();
