/* topbar.js — theme cycle button + mobile menu. Shared by index.html and docs.html. */
window.SpineTopbar = (function () {
  const MODES = ["auto", "light", "dark"];

  function initThemeSwitch(themeCfg) {
    const btn = document.getElementById("theme-cycle");
    if (!btn) return;

    function paint(mode) {
      btn.dataset.mode = mode;
      btn.setAttribute("aria-label", "Theme: " + mode + " (tap to change)");
    }

    paint(window.SpineTheme.getMode());

    btn.addEventListener("click", () => {
      const current = window.SpineTheme.getMode();
      const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
      window.SpineTheme.setMode(next, themeCfg);
      paint(next);
    });

    window.addEventListener("spine:theme-change", (e) => paint(e.detail.mode));
  }

  function initHamburger() {
    const burger = document.getElementById("hamburger");
    const nav = document.getElementById("primary-nav");
    if (!burger || !nav) return;
    burger.addEventListener("click", () => {
      const open = burger.classList.toggle("open");
      nav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        burger.classList.remove("open");
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  function init(themeCfg) {
    initThemeSwitch(themeCfg);
    initHamburger();
  }

  return { init };
})();
