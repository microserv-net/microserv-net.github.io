/* loader.js
   -----------------------------------------------------------------------
   Not a spinner, not a typewriter story. A small preview of the site's
   own trick: the same right-anchored C-curve that the real spine uses
   (see render.js) draws itself here in miniature, with five nodes
   lighting up as the trace reaches them, and a plain percentage readout
   counting up alongside it. No narration, no jokes about the page itself
   — just an instrument finishing a calibration pass before handing off.
   ----------------------------------------------------------------------- */
window.SpineLoader = (function () {
  const W = 220, H = 320;
  const RIGHT_X = 148, BULGE_X = 34;
  const TOP_Y = 16, BOT_Y = H - 16;
  const C1_Y = H * 0.2, C2_Y = H * 0.8;
  const DURATION = 1900; // ms — the curve drawing itself
  const SETTLE = 320; // ms pause once drawn, before handing off control

  function bezierPoint(t) {
    const mt = 1 - t;
    const x = mt * mt * mt * RIGHT_X + 3 * mt * mt * t * BULGE_X + 3 * mt * t * t * BULGE_X + t * t * t * RIGHT_X;
    const y = mt * mt * mt * TOP_Y + 3 * mt * mt * t * C1_Y + 3 * mt * t * t * C2_Y + t * t * t * BOT_Y;
    return { x, y };
  }

  function build(root) {
    root.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("aria-hidden", "true");

    const d = `M ${RIGHT_X} ${TOP_Y} C ${BULGE_X} ${C1_Y}, ${BULGE_X} ${C2_Y}, ${RIGHT_X} ${BOT_Y}`;

    const rail = document.createElementNS(NS, "path");
    rail.setAttribute("class", "lc-rail");
    rail.setAttribute("d", d);
    svg.appendChild(rail);

    const trace = document.createElementNS(NS, "path");
    trace.setAttribute("class", "lc-trace");
    trace.setAttribute("d", d);
    svg.appendChild(trace);

    // five nodes sampled along the same curve, timed to light up roughly
    // as the drawing trace passes each one
    [0.1, 0.32, 0.52, 0.7, 0.9].forEach((t) => {
      const p = bezierPoint(t);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "lc-node");
      c.setAttribute("cx", String(p.x));
      c.setAttribute("cy", String(p.y));
      c.setAttribute("r", "5");
      c.style.transitionDelay = (t * DURATION * 0.85).toFixed(0) + "ms";
      svg.appendChild(c);
    });

    root.appendChild(svg);
    return { trace };
  }

  function run() {
    return new Promise((resolve) => {
      const root = document.getElementById("loader-curve");
      const pctEl = document.getElementById("loader-pct");
      if (!root) {
        resolve();
        return;
      }

      const { trace } = build(root);
      const len = trace.getTotalLength();
      trace.style.strokeDasharray = String(len);
      trace.style.strokeDashoffset = String(len);
      trace.getBoundingClientRect(); // force layout before the transition starts

      requestAnimationFrame(() => {
        trace.style.transition = "stroke-dashoffset " + DURATION + "ms cubic-bezier(.16,.84,.32,1)";
        trace.style.strokeDashoffset = "0";
        root.querySelectorAll(".lc-node").forEach((n) => n.classList.add("show"));
      });

      if (pctEl) {
        const start = performance.now();
        (function tick(now) {
          const p = Math.min(1, ((now || performance.now()) - start) / DURATION);
          pctEl.textContent = String(Math.round(p * 100)).padStart(2, "0") + "%";
          if (p < 1) requestAnimationFrame(tick);
        })();
      }

      setTimeout(resolve, DURATION + SETTLE);
    });
  }

  function finish() {
    const loader = document.getElementById("loader");
    if (!loader) return;
    document.body.classList.remove("loading");
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 950);
  }

  return { run, finish };
})();
