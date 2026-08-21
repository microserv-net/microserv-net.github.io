/* config.js — fetches the JSON config files. Same-origin static fetch, works
   as-is on GitHub Pages with zero build step. */
window.SpineConfig = (function () {
  async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + path + " (" + res.status + ")");
    return res.json();
  }

  async function loadAll() {
    const [site, projects, docs] = await Promise.all([
      loadJSON("config/site.json"),
      loadJSON("config/projects.json"),
      loadJSON("config/docs.json"),
    ]);
    return { site, projects, docs };
  }

  return { loadJSON, loadAll };
})();
