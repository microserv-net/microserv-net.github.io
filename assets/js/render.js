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

  // ---- spine SVG: ONE arc visible at a time, tied to the current scroll
  // transition ---------------------------------------------------------
  // Each transition between one vertebra and the next gets its own S-arc,
  // all pre-built but only ONE shown at a time — whichever transition is
  // currently under the scroll position (see setProgress below, called
  // every frame from spine-engine.js). Before any scrolling, only the top
  // node is visible — a single dot, nothing traced yet, same as
  // Thermite's "ignition".
  //
  // The arc is built to actually reach the card at each end — it swings
  // from centre out toward the outgoing card's position in its top half,
  // back through centre, then out toward the incoming card's position in
  // its bottom half. Cards sit close to the viewport edges (see
  // computeLean() in spine-engine.js, mirrored here so the two always
  // agree), so this is a real cross-screen swing, not a small bow — and
  // because a card is opaque and painted above the curve, the curve's
  // reach toward it visually disappears behind it: the line piercing
  // into the card, not stopping short of it.
  function buildSpine(wrapEl, slots) {
    wrapEl.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("preserveAspectRatio", "none");

    const N = slots.length;
    const segCount = Math.max(0, N - 1);
    const startPhase = Math.random() < 0.5 ? 1 : -1; // which side vertebra 0 sits on, per load

    // Cards alternate sides, plain and simple — the curve below is built
    // FROM these same positions, so it always swings toward wherever the
    // outgoing/incoming card actually is.
    slots.forEach((slot, i) => {
      slot.lean = (i % 2 === 0 ? 1 : -1) * startPhase;
    });

    const segPaths = [];
    for (let i = 0; i < segCount; i++) {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "spine-fill");
      svg.appendChild(p);
      segPaths.push(p);
    }

    const nodeTop = document.createElementNS(NS, "circle");
    nodeTop.setAttribute("class", "spine-node");
    nodeTop.setAttribute("r", "4.5");
    const nodeBot = document.createElementNS(NS, "circle");
    nodeBot.setAttribute("class", "spine-node");
    nodeBot.setAttribute("r", "4.5");
    svg.appendChild(nodeTop);
    svg.appendChild(nodeBot);

    wrapEl.appendChild(svg);

    let segLens = [];

    function layout() {
      const w = window.innerWidth;
      const h = wrapEl.clientHeight || window.innerHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const cx = w / 2;
      const yTop = h * BAND_TOP;
      const yBot = h * BAND_BOTTOM;
      const midY = (yTop + yBot) / 2;

      // Mirrors computeLean() in spine-engine.js exactly — same formula,
      // same breakpoint — so "where each card sits" agrees between files.
      const cardW = Math.min(500, w * 0.78);
      const cardHalf = cardW / 2;
      const edgeMargin = 56;
      const leanPx = w >= 640 ? Math.max(0, w / 2 - cardHalf - edgeMargin) : 0;

      // The curve should visually reach at least 30% of the way INTO the
      // card from its near edge, not just approach it — that's what makes
      // it read as piercing behind the card rather than stopping short.
      // A quadratic bezier's peak deviation from its shared start/end
      // point is exactly half its control point's offset, so the control
      // point has to overshoot the actual visual target by 2x.
      const pierceFrac = 0.3;
      const peakOffset = Math.max(0, leanPx - (0.5 - pierceFrac) * cardW);
      const controlOffset = peakOffset * 2;

      // Where the curve reaches its closest approach to each card,
      // vertically — inside the card's own vertical span, not just at
      // the band's extreme top/bottom edges.
      const upperY = yTop + (midY - yTop) * 0.6;
      const lowerY = midY + (yBot - midY) * 0.4;

      segPaths.forEach((p, i) => {
        const xFrom = cx + (slots[i].lean || 0) * controlOffset;
        const xTo = cx + (slots[i + 1].lean || 0) * controlOffset;
        const d =
          `M ${cx} ${yTop} Q ${xFrom} ${upperY} ${cx} ${midY} ` +
          `Q ${xTo} ${lowerY} ${cx} ${yBot}`;
        p.setAttribute("d", d);
        segLens[i] = p.getTotalLength();
        p.style.strokeDasharray = String(segLens[i]);
      });

      nodeTop.setAttribute("cx", String(cx));
      nodeTop.setAttribute("cy", String(yTop));
      nodeBot.setAttribute("cx", String(cx));
      nodeBot.setAttribute("cy", String(yBot));
    }

    layout();
    window.addEventListener("resize", layout);

    // current: the fractional slot position (0..N-1) from the engine.
    // segIndex = which transition we're in; frac = progress through it,
    // 0 at the top vertebra, 1 at the bottom one — scrolling back up
    // simply drives frac back down, so the same arc un-traces.
    function setProgress(current) {
      if (segCount === 0) {
        nodeTop.style.opacity = "0";
        nodeBot.style.opacity = "0";
        return;
      }
      const segIndex = Math.max(0, Math.min(segCount - 1, Math.floor(current)));
      const frac = Math.max(0, Math.min(1, current - segIndex));

      // Driven by "current" (the whole-journey scroll position) rather
      // than "frac" (progress within just this one segment) — frac would
      // reset to 0 at every segment boundary, making the line visibly
      // snap back each time a new arc took over. Tying it to current
      // instead means the drift accumulates continuously across the
      // entire scroll, the same way the cards never "reset" either: one
      // unbroken upward motion, not N separate ones stitched together.
      const drift = (-current * 22).toFixed(1) + "px";

      segPaths.forEach((p, i) => {
        if (i === segIndex) {
          p.style.opacity = "1";
          const len = segLens[i] || 0;
          p.style.strokeDashoffset = String(len * (1 - frac));
          p.style.transform = "translateY(" + drift + ")";
        } else {
          p.style.opacity = "0";
        }
      });

      // nodeTop is the "ignition" dot — where this transition starts, and
      // the only thing visible before any scrolling happens (frac 0).
      // nodeBot only appears as the trace actually arrives there, fading
      // in with frac rather than sitting there the whole time.
      nodeTop.style.opacity = "1";
      nodeBot.style.opacity = String(frac);
      nodeTop.style.transform = "translateY(" + drift + ")";
      nodeBot.style.transform = "translateY(" + drift + ")";
    }

    setProgress(0);

    return { setProgress };
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
    const spineCurve = buildSpine(document.querySelector(".spine-line-wrap"), slots);
    const cards = buildCards(document.getElementById("spine-carousel"), slots);
    const tags = buildTags(document.getElementById("vertebra-tags"), slots);

    return { slots, cards, tags, spineCurve };
  }

  return { mount, esc };
})();
