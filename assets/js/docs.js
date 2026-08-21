/* docs.js — powers docs.html. Markdown files are treated as first-party
   content the site owner controls (via config/docs.json), so raw HTML in
   them is rendered as-is, same trust level as hand-written HTML would be.
   Do not point 'source' at markdown you don't control. */
(async function () {
  // Apply whatever theme preference is already stored so the page doesn't
  // flash the wrong theme while config loads (topbar interactivity is wired
  // once below, after config.site.theme is available).
  window.SpineTheme && window.SpineTheme.init();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("doc");

  const els = {
    eyebrow: document.getElementById("docs-eyebrow"),
    title: document.getElementById("docs-title"),
    desc: document.getElementById("docs-desc"),
    body: document.getElementById("docs-body"),
    indexList: document.getElementById("docs-index-list"),
  };

  let cfg;
  try {
    cfg = await window.SpineConfig.loadAll();
  } catch (err) {
    els.title.textContent = "Couldn't load configuration";
    els.desc.textContent = String(err.message || err);
    return;
  }

  window.SpineTheme.init(cfg.site.theme);
  window.SpineTopbar.init(cfg.site.theme);

  const pages = cfg.docs.pages || [];

  function renderIndex(excludeSlug) {
    const others = pages.filter((p) => p.slug !== excludeSlug && !p.slug.startsWith("_example"));
    if (!others.length) {
      els.indexList.parentElement.style.display = "none";
      return;
    }
    els.indexList.innerHTML = others
      .map((p) => `<li><a href="docs.html?doc=${encodeURIComponent(p.slug)}">${p.title}</a></li>`)
      .join("");
  }

  if (!slug) {
    els.eyebrow.textContent = "documentation";
    els.title.textContent = "Pick a page";
    els.desc.textContent = "No ?doc= given — here's everything config/docs.json knows about.";
    els.body.innerHTML = "";
    renderIndex(null);
    document.title = "Docs — index";
    return;
  }

  const page = pages.find((p) => p.slug === slug);
  if (!page) {
    els.eyebrow.textContent = "documentation";
    els.title.textContent = "Page not found";
    els.desc.textContent = `No entry for "${slug}" in config/docs.json.`;
    els.body.innerHTML = "";
    renderIndex(null);
    document.title = "Docs — not found";
    return;
  }

  els.eyebrow.textContent = page.category || "documentation";
  els.title.textContent = page.title;
  els.desc.textContent = page.description || "";
  document.title = page.title;
  renderIndex(page.slug);

  try {
    const res = await fetch(page.source);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const md = await res.text();
    els.body.innerHTML = window.marked.parse(md);
  } catch (err) {
    els.body.innerHTML =
      '<p style="color:var(--ember)">Could not load this page\'s markdown from <code>' +
      page.source.replace(/[<>]/g, "") +
      "</code> (" +
      String(err.message || err).replace(/[<>]/g, "") +
      "). If that path is on another domain, make sure it serves CORS headers (raw.githubusercontent.com does).</p>";
  }
})();
