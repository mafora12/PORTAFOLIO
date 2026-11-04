// Interacciones del sitio (frame "D · Interacciones" de Figma): menú mobile, texto que aparece
// por líneas, parallax, anagramas del nombre, cursor propio, botones magnéticos, retrato que se
// abre al hacer scroll, hover con segunda vista en proyectos, Lab horizontal y filtros.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // Raíz del sitio a partir de este script, para que las rutas sirvan desde cualquier página
  const siteRoot = new URL("../../", document.currentScript.src);
  // Segunda vista de cada caso para el hover de las tarjetas (los del Lab usan su portada)
  const SECOND_VIEW = {
    "atig-finance": "assets/img/cases/atig-finance/tablero.webp",
    "singer-500a": "assets/img/home/hero-thumb-singer.webp",
    abismal: "assets/img/cases/abismal/models.webp",
    ariel: "assets/img/cases/ariel/stand.webp",
    "beans-brew": "assets/img/cases/beans-brew/feature-map.webp",
    "app-portafolio": "assets/img/cases/app-portafolio/components.webp",
  };

  initMenu();
  initTextLines(); // antes de initReveal: convierte parte de los [data-reveal] en texto por líneas
  initReveal();
  initHeroParallax();
  initExpand();
  initFilters();
  initMailtoForm();
  initAnagrams();
  initCursor();
  initMagnetic();
  initCardHover();
  initLabScroll();

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

  // GitHub Pages no tiene backend: el formulario arma el correo y abre el cliente de correo
  function initMailtoForm() {
    const form = document.querySelector("form[data-mailto]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const company = data.get("company");
      const subject = `${data.get("topic")} — ${data.get("name")}${company ? ` (${company})` : ""}`;
      const body = `${data.get("message")}\n\n${data.get("name")}\n${data.get("email")}${company ? `\n${company}` : ""}`;
      window.location.href =
        `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // 9 · Títulos y párrafos entran línea por línea: cada palabra es un span y sabe en qué línea cae
  function initTextLines() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const selector = [
      "main h1", "main h2", ".case-head__lead", ".case-section__body p", ".case-points li",
      ".page-head__lead", ".page-head__tags", ".hero__about > p", ".about-hero__p", ".about-hero__tagline",
      ".about__tagline", ".about-do__text p", ".sec-head__note", ".lab__intro", ".lab__tags", ".statement p",
      ".contact__lead", ".contact-hero__lead", ".contact-hero__tags", ".cv-band__text", ".lab-banner__tags",
      ".not-found__tagline", ".not-found__text",
    ].join(", ");
    const skip = ".hero__name, .not-found__code, .case-card, .mini-card, .lab-card, .lab-group__label, .step, .passion, .case-next, .form-card, .menu";
    const items = [...document.querySelectorAll(selector)].filter((el) => !el.closest(skip));

    items.forEach((el) => {
      splitWords(el);
      el.removeAttribute("data-reveal");
      el.setAttribute("data-lines", "");
    });

    const markLines = () =>
      items.forEach((el) => {
        let line = -1;
        let top = null;
        el.querySelectorAll(".w").forEach((w) => {
          if (top === null || Math.abs(w.offsetTop - top) > 4) {
            line += 1;
            top = w.offsetTop;
          }
          w.style.setProperty("--l", line);
        });
      });
    markLines();
    if (document.fonts) document.fonts.ready.then(markLines);
    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(markLines, 150);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  function splitWords(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(part);
            return;
          }
          const word = document.createElement("span");
          word.className = "w";
          word.textContent = part;
          frag.append(word);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        splitWords(child);
      }
    });
  }

  // 2 · Al pasar el cursor por el nombre, las letras se reordenan en otras palabras y vuelven
  function initAnagrams() {
    if (reduceMotion || !finePointer) return;
    const hero = document.querySelector(".hero__name");
    if (hero && window.matchMedia("(min-width: 900px)").matches) {
      setupAnagram(hero, [hero.querySelector(".hero__first"), hero.querySelector(".hero__last")], ["zona real", "firma"]);
    }
    const logo = document.querySelector(".nav__logo");
    if (logo) setupAnagram(logo, [logo], ["firma real zona"]);
  }

  function setupAnagram(owner, lines, targets) {
    const makeChar = (c) => {
      const span = document.createElement("span");
      span.className = c === " " ? "ch ch--space" : "ch";
      span.textContent = c;
      span.setAttribute("aria-hidden", "true");
      return span;
    };
    owner.setAttribute("aria-label", lines.map((l) => l.textContent.trim()).join(" "));
    const letters = [];
    const original = lines.map((line) => {
      const chars = [...line.textContent.trim()].map(makeChar);
      chars.forEach((c) => c.textContent !== " " && letters.push(c));
      line.replaceChildren(...chars);
      return chars;
    });
    // La versión anagrama reutiliza los mismos spans, así cada letra viaja a su nuevo lugar
    const pool = [...letters];
    const anagram = targets.map((word) =>
      [...word].map((c) => (c === " " ? makeChar(" ") : pool.splice(pool.findIndex((s) => s.textContent.toLowerCase() === c), 1)[0]))
    );

    // FLIP: mide, reordena, invierte y anima hasta la posición nueva
    const arrange = (toAnagram) => {
      const first = new Map(letters.map((s) => [s, s.getBoundingClientRect()]));
      letters.forEach((s) => {
        s.style.transition = "none";
        s.style.transform = "";
      });
      owner.classList.toggle("is-anagram", toAnagram);
      (toAnagram ? anagram : original).forEach((chars, i) => lines[i].replaceChildren(...chars));
      letters.forEach((s) => {
        const a = first.get(s);
        const b = s.getBoundingClientRect();
        s.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
      });
      void owner.offsetWidth;
      letters.forEach((s, i) => {
        s.style.transition = `transform 0.9s var(--ease-out) ${i * 18}ms`;
        s.style.transform = "";
      });
    };

    let busy = false;
    owner.addEventListener("pointerenter", () => {
      if (busy) return;
      busy = true;
      arrange(true);
      setTimeout(() => {
        arrange(false);
        setTimeout(() => (busy = false), 1200);
      }, 1800);
    });
  }

  // 3 · Punto rosa en lugar del cursor; sobre proyectos crece y dice "View case"
  function initCursor() {
    if (reduceMotion || !finePointer) return;
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "cursor__shape";
    cursor.append(label);
    document.body.append(cursor);
    root.classList.add("has-cursor");

    document.querySelectorAll(".case-card, .mini-card").forEach((el) => (el.dataset.cursor = "View case"));
    document.querySelectorAll(".lab-card, .lab-banner").forEach((el) => (el.dataset.cursor = "View project"));
    document.querySelectorAll(".case-next").forEach((el) => {
      el.dataset.cursor = el.pathname.includes("/lab/") ? "View project" : "View case";
    });

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;
    const tick = () => {
      x += (tx - x) * 0.25;
      y += (ty - y) * 0.25;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(tick) : 0;
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        if (!cursor.classList.contains("is-on")) {
          x = tx = e.clientX;
          y = ty = e.clientY;
          cursor.classList.add("is-on");
        }
        tx = e.clientX;
        ty = e.clientY;
        const target = e.target instanceof Element ? e.target : null;
        const card = target && target.closest("[data-cursor]");
        label.textContent = card ? card.dataset.cursor : "";
        cursor.classList.toggle("is-view", !!card);
        cursor.classList.toggle("is-link", !card && !!(target && target.closest("a, button, label")));
        cursor.classList.toggle("is-hidden", !!(target && target.closest("input, textarea, select")));
        if (!frame) frame = requestAnimationFrame(tick);
      },
      { passive: true }
    );
    root.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
  }

  // 4 · Los botones se acercan suavemente al cursor
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll(".btn, .filter, .nav__menu-btn").forEach((btn) => {
      btn.classList.add("is-magnetic");
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--bx", `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        btn.style.setProperty("--by", `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.setProperty("--bx", "0px");
        btn.style.setProperty("--by", "0px");
      });
    });
  }

  // 6 · Al pasar por un proyecto, la imagen hace zoom y cambia a una segunda vista del caso
  function initCardHover() {
    if (!finePointer) return;
    document.querySelectorAll(".case-card, .mini-card, .lab-card").forEach((card) => {
      const media = card.querySelector(".case-card__media, .mini-card__media, .lab-card__media");
      const slug = card.getAttribute("href").replace(/\/$/, "").split("/").pop();
      const src = card.classList.contains("lab-card") ? `assets/img/cases/${slug}/cover.webp` : SECOND_VIEW[slug];
      if (!media || !src) return;
      // La segunda imagen se carga en el primer hover, no al abrir la página
      card.addEventListener(
        "pointerenter",
        () => {
          const img = new Image();
          img.className = "card-alt";
          img.alt = "";
          img.decoding = "async";
          img.onload = () => media.classList.add("has-alt");
          img.src = new URL(src, siteRoot).href;
          media.append(img);
        },
        { once: true }
      );
    });
  }

  // 7 · En Home, el scroll vertical mueve la tira del Lab hacia los lados (solo desktop)
  function initLabScroll() {
    const section = document.querySelector(".lab-section");
    if (!section || reduceMotion) return;
    const block = section.querySelector(".lab");
    const strip = section.querySelector(".lab__grid");
    const wide = window.matchMedia("(min-width: 1100px)");
    let distance = 0;
    let queued = false;

    const update = () => {
      queued = false;
      if (!wide.matches || !distance) return;
      const top = parseFloat(block.style.top) || 0;
      const p = Math.min(1, Math.max(0, (top - section.getBoundingClientRect().top) / distance));
      strip.style.transform = `translate3d(${(-p * distance).toFixed(1)}px, 0, 0)`;
    };

    const layout = () => {
      section.classList.toggle("is-pinned", wide.matches);
      strip.style.transform = "";
      section.style.height = "";
      block.style.top = "";
      if (!wide.matches) return;
      distance = Math.max(0, strip.scrollWidth - strip.clientWidth);
      block.style.top = `${Math.max(24, (window.innerHeight - block.offsetHeight) / 2)}px`;
      section.style.height = `${block.offsetHeight + distance}px`;
      update();
    };

    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    window.addEventListener("resize", layout);
    wide.addEventListener("change", layout);
    layout();
    window.addEventListener("load", layout);
  }
})();
