/* loader.js
   -----------------------------------------------------------------------
   Third pass. Now that the real spine is an alternating S-wave held near
   centre (not a single right-anchored C), the loader previews that exact
   shape in miniature: two arcs bowing opposite ways, drawn in one
   continuous stroke, three nodes lighting up as the trace passes them.
   No percentage counter this time, no narrated sentences — a single
   status word swaps instantly (not typed) as each stage completes.
   ----------------------------------------------------------------------- */
window.SpineLoader = (function () {
  const W = 200, H = 300;
  const CX = W / 2;
  const TOP_Y = 18, MID_Y = H / 2, BOT_Y = H - 18;
  const AMP = 44;
  const DURATION = 1700; // ms — the S-wave drawing itself
  const SETTLE = 300; // ms pause once drawn, before handing off control
  const WORDS = ["curve", "signal", "spine", "ready"];

  function build(root) {
    root.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("aria-hidden", "true");

    // top -> mid bows left, mid -> bottom bows right: the same alternating
    // logic as the real spine, just two segments instead of many
    const d =
      `M ${CX} ${TOP_Y} Q ${CX - AMP} ${(TOP_Y + MID_Y) / 2} ${CX} ${MID_Y} ` +
      `Q ${CX + AMP} ${(MID_Y + BOT_Y) / 2} ${CX} ${BOT_Y}`;

    const rail = document.createElementNS(NS, "path");
    rail.setAttribute("class", "lc-rail");
    rail.setAttribute("d", d);
    svg.appendChild(rail);

    const trace = document.createElementNS(NS, "path");
    trace.setAttribute("class", "lc-trace");
    trace.setAttribute("d", d);
    svg.appendChild(trace);

    [
      { x: CX, y: TOP_Y, delay: 0 },
      { x: CX, y: MID_Y, delay: DURATION * 0.42 },
      { x: CX, y: BOT_Y, delay: DURATION * 0.86 },
    ].forEach((p) => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "lc-node");
      c.setAttribute("cx", String(p.x));
      c.setAttribute("cy", String(p.y));
      c.setAttribute("r", "5.5");
      c.style.transitionDelay = p.delay.toFixed(0) + "ms";
      svg.appendChild(c);
    });

    root.appendChild(svg);
    return { trace };
  }

  function run() {
    return new Promise((resolve) => {
      const root = document.getElementById("loader-curve");
      const wordEl = document.getElementById("loader-word");
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

      if (wordEl) {
        const step = DURATION / WORDS.length;
        WORDS.forEach((word, i) => {
          setTimeout(() => {
            wordEl.classList.remove("pop");
            void wordEl.offsetWidth; // restart the pop animation each swap
            wordEl.textContent = word;
            wordEl.classList.add("pop");
          }, i * step);
        });
      }

      setTimeout(resolve, DURATION + SETTLE);
    });
  }

  function finish() {
    const loader = document.getElementById("loader");
    if (!loader) return;
    document.body.classList.remove("loading");
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 900);
  }

  return { run, finish };
})();
