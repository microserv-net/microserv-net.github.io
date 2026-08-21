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

  // ---- spine SVG: an alternating S-wave, held near the centreline -------
  // The spine is not anchored to one side of the screen. Each node sits
  // on the centreline (it's an inflection point), and the segment between
  // one node and the next bows out left or right — alternating direction
  // every segment, the way a curved line actually moves, not one single
  // bulge for the whole page. The bulge amplitude scales with viewport
  // width. Which side segment 0 bows toward is randomized per load.
  //
  // Every vertebra's card sits on the *inner* side of the curve near it —
  // the side the curve is NOT bowing toward — so cards and curve stay
  // opposite one another the whole way down (see spine-engine.js, which
  // reads slot.lean, set below).
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

    const startPhase = Math.random() < 0.5 ? 1 : -1; // which way it bows first, per load
    const N = slots.length;
    // the side segment i (between node i and node i+1) bows toward
    function bowSide(i) {
      return (i % 2 === 0 ? 1 : -1) * startPhase;
    }

    // assign each vertebra's card to the opposite side once, up front —
    // it doesn't depend on viewport size so it doesn't need to live in
    // layout() below
    slots.forEach((slot, i) => {
      slot.lean = -bowSide(i);
    });

    function layout() {
      const w = window.innerWidth;
      const h = wrapEl.clientHeight || window.innerHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const cx = w / 2;

      // Wider viewport -> a wider bow, capped well inside where the cards
      // sit so the curve never visually collides with one.
      const amplitude = Math.max(28, Math.min(90, w * 0.055));

      const yTop = h * BAND_TOP;
      const yBot = h * BAND_BOTTOM;

      const nodeYs = slots.map((slot, i) => {
        const frac = N > 1 ? i / (N - 1) : 0.5;
        return yTop + (yBot - yTop) * frac;
      });

      // fill points: node, bow-point, node, bow-point, ... — the bow
      // points alternate sides, which is what makes catmull-rom read as
      // an S-wave instead of one arc
      const fillPts = [];
      for (let i = 0; i < N; i++) {
        fillPts.push({ x: cx, y: nodeYs[i] });
        if (i < N - 1) {
          fillPts.push({ x: cx + bowSide(i) * amplitude, y: (nodeYs[i] + nodeYs[i + 1]) / 2 });
        }
      }

      const railPts = [
        { x: cx, y: 0 },
        { x: cx, y: yTop * 0.6 },
        ...fillPts,
        { x: cx, y: yBot + (h - yBot) * 0.4 },
        { x: cx, y: h },
      ];

      rail.setAttribute("d", catmullRomPath(railPts));
      fill.setAttribute("d", catmullRomPath(fillPts));

      nodeEls.forEach((node, i) => {
        node.setAttribute("cx", String(cx));
        node.setAttribute("cy", String(nodeYs[i]));
      });
    }

    layout();
    window.addEventListener("resize", layout);

    return { fillEl: fill, nodeEls, relayout: layout };
  }

  // ---- vertebra tags (opposite side from that vertebra's card) ----------
  function buildTags(wrapEl, slots) {
    wrapEl.innerHTML = "";
    return slots.map((slot) => {
      const div = document.createElement("div");
      const tagSide = (slot.lean || 0) > 0 ? "side-left" : "side-right";
      div.className = "vertebra-tag " + tagSide;
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
      card.dataset.lean = String(slot.lean || 0);
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
    // buildSpine assigns slot.lean as a side effect (the curve is the
    // source of truth for which side each card belongs on) — it has to
    // run before buildCards/buildTags consume that value.
    const { fillEl, nodeEls } = buildSpine(document.querySelector(".spine-line-wrap"), slots);
    const cards = buildCards(document.getElementById("spine-carousel"), slots);
    const tags = buildTags(document.getElementById("vertebra-tags"), slots);

    return { slots, cards, tags, nodeEls, spineFill: fillEl };
  }

  return { mount, buildDots, esc };
})();
