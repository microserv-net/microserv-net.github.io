/* topbar.js — theme switch + mobile menu. Shared by index.html and docs.html. */
window.SpineTopbar = (function () {
  function initThemeSwitch(themeCfg) {
    const switchEl = document.getElementById("theme-switch");
    if (!switchEl) return;
    const pill = switchEl.querySelector(".switch-pill");
    const buttons = Array.from(switchEl.querySelectorAll("button"));

    function paint(mode) {
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
      const idx = buttons.findIndex((b) => b.dataset.mode === mode);
      if (pill && idx >= 0) pill.style.transform = `translateX(${idx * 30}px)`;
    }

    paint(window.SpineTheme.getMode());

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        window.SpineTheme.setMode(btn.dataset.mode, themeCfg);
        paint(btn.dataset.mode);
      });
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
