// Interacciones del sitio: menú mobile, aparición al hacer scroll,
// parallax del hero, apertura del "momento scroll" y filtros de Work/Lab.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initMenu();
  initReveal();
  initHeroParallax();
  initExpand();
  initFilters();

  function initMenu() {
    const menu = document.getElementById("menu");
    const openBtn = document.querySelector("[data-menu-open]");
    if (!menu || !openBtn) return;
    const closeBtn = menu.querySelector("[data-menu-close]");

    const setOpen = (open, { restoreFocus = true } = {}) => {
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
      openBtn.setAttribute("aria-expanded", String(open));
      root.classList.toggle("menu-open", open);
      if (open) closeBtn.focus();
      else if (restoreFocus) openBtn.focus();
    };

    openBtn.addEventListener("click", () => setOpen(true));
    closeBtn.addEventListener("click", () => setOpen(false));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false, { restoreFocus: false });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", (e) => {
      if (e.matches && menu.classList.contains("is-open")) setOpen(false, { restoreFocus: false });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
  }

  // Las capas con data-depth se desplazan según --mx/--my (ver home.css)
  function initHeroParallax() {
    const stage = document.querySelector("[data-parallax]");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!stage || reduceMotion || !finePointer) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const tick = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      stage.style.setProperty("--mx", x.toFixed(4));
      stage.style.setProperty("--my", y.toFixed(4));
      const settled = Math.abs(targetX - x) < 0.001 && Math.abs(targetY - y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        targetX = (e.clientX / window.innerWidth) * 2 - 1;
        targetY = (e.clientY / window.innerHeight) * 2 - 1;
        kick();
      },
      { passive: true }
    );
    document.documentElement.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      kick();
    });
  }

  // --p va de 0 a 1 mientras el bloque entra en pantalla; el CSS lo usa para el clip-path
  function initExpand() {
    const el = document.querySelector("[data-expand]");
    if (!el || reduceMotion) return;
    let queued = false;

    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.85)));
      el.style.setProperty("--p", (1 - (1 - p) ** 2).toFixed(4));
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  // Botones [data-filter] dentro de [data-filters="id"] filtran los [data-tags] de #id
  function initFilters() {
    document.querySelectorAll("[data-filters]").forEach((group) => {
      const list = document.getElementById(group.dataset.filters);
      if (!list) return;
      const buttons = group.querySelectorAll("[data-filter]");
      const items = list.querySelectorAll("[data-tags]");

      group.addEventListener("click", (e) => {
        const button = e.target.closest("[data-filter]");
        if (!button) return;
        const filter = button.dataset.filter;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        items.forEach((item) => {
          const match = filter === "all" || item.dataset.tags.split(" ").includes(filter);
          const wasHidden = item.classList.contains("is-filtered-out");
          item.classList.toggle("is-filtered-out", !match);
          item.classList.remove("is-filtering-in");
          if (match && wasHidden) {
            item.classList.add("is-visible");
            void item.offsetWidth; // reinicia la animación
            item.classList.add("is-filtering-in");
          }
        });
      });
    });
  }
})();
