/* main.js — index.html bootstrap. */
(async function () {
  const body = document.body;
  body.classList.add("loading");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) body.classList.add("no-hijack");

  const loaderRoot = document.getElementById("loader-curve");
  const loaderPromise = loaderRoot
    ? window.SpineLoader.run()
    : new Promise((r) => setTimeout(r, 1200));

  let cfg;
  try {
    cfg = await window.SpineConfig.loadAll();
  } catch (err) {
    console.error(err);
    await loaderPromise;
    window.SpineLoader.finish();
    const stage = document.getElementById("spine-stage");
    if (stage) {
      stage.innerHTML =
        '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:40px;text-align:center;font-family:monospace;color:var(--fg-dim)">Couldn\'t load the site configuration. If you are running this from disk, serve it with a local web server instead (e.g. <code>python3 -m http.server</code>) — <code>fetch()</code> of local JSON files is blocked from <code>file://</code>.</div>';
    }
    return;
  }

  window.SpineTheme.init(cfg.site.theme);

  const { slots, cards, tags, spineCurve } = window.SpineRender.mount(cfg);

  const dotsWrap = document.getElementById("progress-dots");

  function navKeyForSlotKey(key) {
    if (key === "home" || key === "patents" || key === "idea" || key === "contact") return key;
    return "work"; // any project-* slot, or the index slot itself
  }
  function slotIndexForNavTarget(target) {
    if (target === "work") {
      const i = slots.findIndex((s) => s.key.startsWith("project-"));
      return i >= 0 ? i : slots.findIndex((s) => s.key === "work");
    }
    return Math.max(0, slots.findIndex((s) => s.key === target));
  }

  let engine = null;
  const navLinks = Array.from(document.querySelectorAll(".nav-link[data-target]"));

  function highlightNav(activeIndex) {
    const navKey = navKeyForSlotKey(slots[activeIndex].key);
    navLinks.forEach((l) => l.classList.toggle("active", l.dataset.target === navKey));
  }

  function goToTarget(target) {
    const idx = slotIndexForNavTarget(target);
    if (engine) engine.goTo(idx);
    else {
      const el = document.querySelector('.card[data-slot="' + slots[idx].key + '"]');
      el && el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  if (!prefersReducedMotion) {
    const dots = window.SpineRender.buildDots(dotsWrap, slots, (i) => engine && engine.goTo(i));
    engine = window.SpineEngine.create({
      stage: document.getElementById("spine-stage"),
      cards,
      tags,
      dots,
      spineCurve,
      onChange: (activeIndex) => highlightNav(activeIndex),
    });
    highlightNav(0);
  } else {
    dotsWrap && (dotsWrap.style.display = "none");
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      goToTarget(link.dataset.target);
    });
  });

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-goto]");
    if (trigger) {
      e.preventDefault();
      goToTarget(trigger.dataset.goto);
    }
  });

  window.SpineTopbar.init(cfg.site.theme);
  window.SpineSponsor.init(cfg.site);
  window.SpineIdeaForm.init(cfg.site);

  await loaderPromise;
  window.SpineLoader.finish();
})();
