/* theme.js — Auto mode reads the visitor's IANA timezone via Intl and picks
   day/night by local clock hour. A manual 3-way switch (Auto/Light/Dark) in
   the top bar can override it; the override is remembered in localStorage. */
window.SpineTheme = (function () {
  const KEY = "spine-theme-pref"; // "auto" | "light" | "dark"

  function computeAutoIsDark(themeCfg) {
    const dayStart = (themeCfg && themeCfg.dayStartHour) ?? 7;
    const nightStart = (themeCfg && themeCfg.nightStartHour) ?? 19;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        hour12: false,
      }).format(new Date());
      const hour = parseInt(hourStr, 10) % 24;
      return !(hour >= dayStart && hour < nightStart);
    } catch (e) {
      const h = new Date().getHours();
      return !(h >= dayStart && h < nightStart);
    }
  }

  function apply(mode, themeCfg) {
    const isDark = mode === "dark" ? true : mode === "light" ? false : computeAutoIsDark(themeCfg);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme-mode", mode);
    return isDark;
  }

  function getMode() {
    return localStorage.getItem(KEY) || "auto";
  }

  function setMode(mode, themeCfg) {
    localStorage.setItem(KEY, mode);
    apply(mode, themeCfg);
    window.dispatchEvent(new CustomEvent("spine:theme-change", { detail: { mode } }));
  }

  function init(themeCfg) {
    const mode = getMode();
    apply(mode, themeCfg);
    // Re-evaluate auto mode roughly every 15 minutes and whenever the tab
    // regains visibility, so a day-long open tab still flips at dusk/dawn.
    setInterval(() => {
      if (getMode() === "auto") apply("auto", themeCfg);
    }, 15 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && getMode() === "auto") apply("auto", themeCfg);
    });
    return mode;
  }

  return { init, setMode, getMode, computeAutoIsDark };
})();
