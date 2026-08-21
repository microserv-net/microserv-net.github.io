/* render.js — turns config/*.json into the DOM the spine engine animates.
   Nothing here is hand-authored per project: add/remove entries in
   config/projects.json or config/docs.json and this file re-renders them. */
window.SpineRender = (function () {
  const BAND_TOP = 0.2; // matches the CSS mask in main.css — keep in sync
  const BAND_BOTTOM = 0.8;

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function statusPill(status) {
    if (!status) return "";
    const cls = status === "wip" ? "status-pill wip" : "status-pill";
    return `<span class="${cls}">${esc(status)}</span>`;
  }

  function docSlugFor(proj, docsCfg) {
    if (proj.docs) return proj.docs;
    const hit = (docsCfg.pages || []).find((p) => p.project === proj.id);
    return hit ? hit.slug : "";
  }

  // ---- slot definitions -------------------------------------------------
  function buildSlots(cfg) {
    const { site, projects, docs } = cfg;
    const allProjects = projects.projects || [];
    const featuredProjects = (projects.featured || [])
      .map((id) => allProjects.find((p) => p.id === id))
      .filter(Boolean);

    const slots = [
      { key: "home", tag: "C1", name: "origin", html: () => heroCard(site) },
    ];

    featuredProjects.forEach((proj, i) => {
      slots.push({
        key: "project-" + proj.id,
        tag: "T" + (i + 1),
        name: proj.name.toLowerCase(),
        html: () => featuredCard(proj, docs),
      });
    });

    slots.push({ key: "work", tag: "T-IDX", name: "full manifest", html: () => indexCard(allProjects, docs) });
    slots.push({ key: "patents", tag: "L1", name: "patents", html: () => patentsCard(projects.patents || []) });
    slots.push({ key: "idea", tag: "S1", name: "submit an idea", html: () => ideaCard(site) });
    slots.push({ key: "contact", tag: "COCCYX", name: "end of the line", html: () => footerCard(site) });

    return slots;
  }

  // ---- card content builders --------------------------------------------
  function heroCard(site) {
    const b = site.brand || {};
    const words = String(b.tagline || "").trim().split(/\s+/);
    const last = words.pop() || "";
    return `
      <span class="eyebrow">system online</span>
      <h1 class="hero-title">${esc(words.join(" "))} <span class="rx">${esc(last)}</span></h1>
      <p class="hero-sub">${esc(b.subtagline || "")}</p>
      <div class="hero-cta-row">
        <button class="btn btn-primary" data-goto="work" type="button">See the work</button>
        <button class="btn btn-ghost" data-goto="idea" type="button">Pitch an idea</button>
      </div>
      <div class="scroll-hint"><span class="chev">&darr;</span>&nbsp; scroll, swipe, or press &darr; — the spine carries you</div>
    `;
  }

  function featuredCard(proj, docsCfg) {
    const slug = docSlugFor(proj, docsCfg);
    return `
      <span class="eyebrow">featured build</span>
      <h2>${esc(proj.name)} ${statusPill(proj.status)}</h2>
      <p class="project-tagline">${esc(proj.tagline || "")}</p>
      <p class="project-desc">${esc(proj.description || "")}</p>
      <div class="tag-row">${(proj.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="card-actions">
        ${proj.url ? `<a class="btn btn-primary" href="${esc(proj.url)}" target="_blank" rel="noopener">View repository</a>` : ""}
        ${proj.demoUrl ? `<a class="btn btn-ghost" href="${esc(proj.demoUrl)}" target="_blank" rel="noopener">Live demo</a>` : ""}
        ${slug ? `<a class="btn btn-ghost" href="docs.html?doc=${esc(slug)}">Read the docs</a>` : ""}
        ${proj.sponsorable !== false ? `<button class="btn btn-ember" data-sponsor="${esc(proj.name)}" type="button">Sponsor this</button>` : ""}
      </div>
    `;
  }

  function indexCard(allProjects, docsCfg) {
    if (!allProjects.length) {
      return `<span class="eyebrow">full manifest</span><h2>Everything, indexed</h2><p class="empty-note">config/projects.json is empty — add an entry and it shows up here automatically.</p>`;
    }
    return `
      <span class="eyebrow">full manifest</span>
      <h2>Everything, indexed</h2>
      <p class="project-desc">Every project this config file knows about — sponsor button included.</p>
      <div class="index-grid">
        ${allProjects
          .map((p) => {
            const slug = docSlugFor(p, docsCfg);
            return `
            <div class="index-tile">
              <h3>${esc(p.name)} ${statusPill(p.status)}</h3>
              <p>${esc(p.tagline || "")}</p>
              <div class="tile-actions">
                ${p.url ? `<a class="btn btn-ghost" href="${esc(p.url)}" target="_blank" rel="noopener">Repo</a>` : ""}
                ${slug ? `<a class="btn btn-ghost" href="docs.html?doc=${esc(slug)}">Docs</a>` : ""}
                ${p.sponsorable !== false ? `<button class="btn btn-ember" data-sponsor="${esc(p.name)}" type="button">Sponsor</button>` : ""}
              </div>
            </div>`;
          })
          .join("")}
      </div>
    `;
  }

  function patentsCard(patents) {
    if (!patents.length) {
      return `<span class="eyebrow">lumbar / load-bearing</span><h2>Patents</h2><p class="empty-note">Nothing filed yet — this vertebra is reserved for when there is. Add entries to the "patents" array in config/projects.json.</p>`;
    }
    return `
      <span class="eyebrow">lumbar / load-bearing</span>
      <h2>Patents</h2>
      ${patents
        .map(
          (p) => `
        <div class="patent-item">
          <h3>${esc(p.title)}</h3>
          <div class="patent-meta">${[p.number, p.status, p.filedDate ? "filed " + p.filedDate : ""].filter(Boolean).map(esc).join(" &middot; ")}</div>
          ${p.abstract ? `<p class="patent-abstract">${esc(p.abstract)}</p>` : ""}
          ${p.url ? `<a class="btn btn-ghost" href="${esc(p.url)}" target="_blank" rel="noopener">View filing</a>` : ""}
        </div>`
        )
        .join("")}
    `;
  }

  function ideaCard(site) {
    const contact = site.contact || {};
    const displayName = (site.brand && (site.brand.displayName || site.brand.name)) || "me";
    return `
      <span class="eyebrow">sacral / foundation</span>
      <h2>Submit an idea and I'll build it</h2>
      <p class="project-desc">Half-formed is fine. Weird is preferred.</p>
      <form id="idea-form" novalidate>
        <div class="field"><label for="idea-name">Name (optional)</label><input id="idea-name" name="name" type="text" autocomplete="name" /></div>
        <div class="field"><label for="idea-email">Email (optional, so I can reply)</label><input id="idea-email" name="email" type="email" autocomplete="email" /></div>
        <div class="field"><label for="idea-title">Idea title</label><input id="idea-title" name="title" type="text" required /></div>
        <div class="field"><label for="idea-desc">Describe it</label><textarea id="idea-desc" name="description" required></textarea></div>
        <button class="btn btn-primary" type="submit">Send it to ${esc(displayName)}</button>
        <p class="form-note">Goes straight to ${esc(contact.ideaEmail || "")} — no account, no tracking.</p>
        <p class="form-status" id="idea-form-status" role="status"></p>
      </form>
    `;
  }

  function footerCard(site) {
    const b = site.brand || {};
    return `
      <span class="eyebrow">coccyx / end of the line</span>
      <h2 class="footer-h2">End of the line.</h2>
      <p class="project-desc">${esc(b.handle || "")} — there is no vertebra after this one.</p>
      <div class="footer-links">
        ${(site.social || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("")}
        <a href="#" data-goto="home">Back to C1</a>
      </div>
      <p class="footer-fine">Built with a spine, not a scrollbar.</p>
    `;
  }

  // Catmull-Rom -> cubic Bezier, so the curve threads smoothly through every
  // sampled point instead of kinking at each one.
  function catmullRomPath(pts) {
    if (pts.length < 2) return "";
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    let d = `M ${pts[0].x} ${pts[0].y} `;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y} `;
    }
    return d.trim();
  }

  // ---- spine SVG: an asymmetric C-curve, not a centred line --------------
  // The spine is anchored toward the right at the very top and bottom of
  // the screen and bulges left through the middle — an open C, not stuck
  // on the centreline. That bulge is what leaves a clear column of empty
  // space on the right, which is where every card lives (see
  // spine-engine.js). The bulge widens on wider screens, and a slow
  // secondary wave is layered on top so it reads as organic rather than a
  // perfect geometric arc — randomized a little differently on every load.
  function buildSpine(wrapEl, slots) {
    wrapEl.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("preserveAspectRatio", "none");

    const rail = document.createElementNS(NS, "path");
    rail.setAttribute("class", "spine-rail");
    const fill = document.createElementNS(NS, "path");
    fill.setAttribute("class", "spine-fill");

    svg.appendChild(rail);
    svg.appendChild(fill);

    const nodeEls = slots.map(() => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "spine-node");
      c.setAttribute("r", "4.5");
      svg.appendChild(c);
      return c;
    });

    wrapEl.appendChild(svg);

    const seedPhase = Math.random() * Math.PI * 2; // per-load organic variation

    function curveX(y, w, h, amplitude) {
      const rightAnchor = w * 0.7;
      const t = h > 0 ? y / h : 0;
      const bulge = Math.sin(t * Math.PI); // 0 at top & bottom, 1 at the middle
      const wobble = Math.sin(t * 6.2 + seedPhase) * (amplitude * 0.1);
      return rightAnchor - bulge * amplitude + wobble;
    }

    function layout() {
      const w = window.innerWidth;
      const h = wrapEl.clientHeight || window.innerHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      // Wider viewport -> wider bulge, so the curve reads proportionally
      // the same on a phone and on an ultrawide monitor.
      const amplitude = Math.max(60, Math.min(340, w * 0.24));

      const RAIL_SAMPLES = 26;
      const railPts = [];
      for (let i = 0; i <= RAIL_SAMPLES; i++) {
        const y = (h * i) / RAIL_SAMPLES;
        railPts.push({ x: curveX(y, w, h, amplitude), y });
      }

      const yTop = h * BAND_TOP;
      const yBot = h * BAND_BOTTOM;
      const FILL_SAMPLES = 16;
      const fillPts = [];
      for (let i = 0; i <= FILL_SAMPLES; i++) {
        const y = yTop + ((yBot - yTop) * i) / FILL_SAMPLES;
        fillPts.push({ x: curveX(y, w, h, amplitude), y });
      }

      rail.setAttribute("d", catmullRomPath(railPts));
      fill.setAttribute("d", catmullRomPath(fillPts));

      nodeEls.forEach((node, i) => {
        const frac = slots.length > 1 ? i / (slots.length - 1) : 0.5;
        const y = yTop + (yBot - yTop) * frac;
        node.setAttribute("cx", String(curveX(y, w, h, amplitude)));
        node.setAttribute("cy", String(y));
      });
    }

    layout();
    window.addEventListener("resize", layout);

    return { fillEl: fill, nodeEls, relayout: layout };
  }

  // ---- vertebra tags (always sit left, in the curve's own space) --------
  function buildTags(wrapEl, slots) {
    wrapEl.innerHTML = "";
    return slots.map((slot) => {
      const div = document.createElement("div");
      div.className = "vertebra-tag";
      div.innerHTML = `<div class="vt-index">${esc(slot.tag)}</div><div class="vt-name">${esc(slot.name)}</div><div class="vt-nerve"></div>`;
      wrapEl.appendChild(div);
      return div;
    });
  }

  // ---- progress dots -------------------------------------------------------
  function buildDots(wrapEl, slots, onClick) {
    wrapEl.innerHTML = "";
    return slots.map((slot, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Go to " + slot.tag + " — " + slot.name);
      btn.addEventListener("click", () => onClick(i));
      wrapEl.appendChild(btn);
      return btn;
    });
  }

  // ---- cards --------------------------------------------------------------
  function buildCards(wrapEl, slots) {
    wrapEl.innerHTML = "";
    return slots.map((slot) => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.slot = slot.key;
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "vertebra");
      card.setAttribute("aria-label", slot.tag + " " + slot.name);

      const face = document.createElement("div");
      face.className = "card-face" + (slot.key === "home" ? " hero-face" : slot.key === "contact" ? " footer-face" : "");
      face.innerHTML = slot.html();

      card.appendChild(face);
      wrapEl.appendChild(card);
      return card;
    });
  }

  function mount(cfg) {
    const slots = buildSlots(cfg);
    const cards = buildCards(document.getElementById("spine-carousel"), slots);
    const { fillEl, nodeEls } = buildSpine(document.querySelector(".spine-line-wrap"), slots);
    const tags = buildTags(document.getElementById("vertebra-tags"), slots);

    return { slots, cards, tags, nodeEls, spineFill: fillEl };
  }

  return { mount, buildDots, esc };
})();
