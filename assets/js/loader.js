/* loader.js
   -----------------------------------------------------------------------
   Fourth pass, and deliberately nothing like the previous three: no
   curve, no snake, no spine imagery at all. A 7x7 lattice of cells starts
   as pure jittering static — each one vibrating at a random offset,
   flickering — and settles into a fixed grid in a randomized ripple, one
   cell at a time, like a crystal forming out of chaos. A "CONVERGENCE"
   readout counts a jittery error value down to exactly zero as the last
   cells lock in. It's an instrument watching its own noise die down, not
   a story or a shape — weird on its own terms rather than borrowing the
   site's main visual trick.
   ----------------------------------------------------------------------- */
window.SpineLoader = (function () {
  const COLS = 7, ROWS = 7;
  const DURATION = 1900; // ms — cells settling, spread across this window
  const SETTLE = 320; // ms pause once the last cell locks, before handoff

  function build(root) {
    root.innerHTML = "";
    const cells = [];
    const cx = (COLS - 1) / 2;
    const cy = (ROWS - 1) / 2;
    const maxDist = Math.hypot(cx, cy);

    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const dist = Math.hypot(col - cx, row - cy) / maxDist; // 0 centre -> 1 corner

      const cell = document.createElement("div");
      cell.className = "loader-cell";
      const jx = (Math.random() - 0.5) * 46;
      const jy = (Math.random() - 0.5) * 46;
      const jr = (Math.random() - 0.5) * 50;
      cell.style.setProperty("--jx", jx.toFixed(1) + "px");
      cell.style.setProperty("--jy", jy.toFixed(1) + "px");
      cell.style.setProperty("--jr", jr.toFixed(1) + "deg");
      // brighter near the centre once settled, like a soft aperture
      cell.style.setProperty("--final-opacity", Math.max(0.32, 1 - dist * 0.85).toFixed(2));
      cell.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
      root.appendChild(cell);
      cells.push(cell);
    }
    return cells;
  }

  function run() {
    return new Promise((resolve) => {
      const grid = document.getElementById("loader-grid");
      const deltaEl = document.getElementById("loader-delta");
      if (!grid) {
        resolve();
        return;
      }

      const cells = build(grid);

      // randomized settle order, spread across most of the duration —
      // a ripple with no fixed direction, not a sweep
      const order = cells.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      order.forEach((cellIndex, k) => {
        const t = (k / (order.length - 1)) * DURATION * 0.82;
        setTimeout(() => cells[cellIndex].classList.add("settled"), t);
      });

      if (deltaEl) {
        const start = performance.now();
        const startVal = 3 + Math.random() * 3.5;
        (function tick(now) {
          const p = Math.min(1, ((now || performance.now()) - start) / DURATION);
          const eased = p * p; // accelerates toward zero, like settling
          const val = startVal * (1 - eased);
          deltaEl.textContent = val > 0.0005 ? val.toFixed(4) : "0.0000";
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
    setTimeout(() => loader.remove(), 900);
  }

  return { run, finish };
})();
