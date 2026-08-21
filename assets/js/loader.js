/* loader.js — not a spinner. A spine assembles itself, vertebra by vertebra,
   while a deadpan little terminal voice narrates. When it's done, the same
   spine becomes the real one driving the page. */
window.SpineLoader = (function () {
  const LINES = [
    "counting vertebrae",
    "pressurizing the discs",
    "calibrating the curve",
    "routing the signal",
    "aligning C1 through the coccyx",
    "spine assembled — handing off control",
  ];

  function typeLine(el, text, speed) {
    return new Promise((resolve) => {
      el.textContent = "";
      let i = 0;
      const iv = setInterval(() => {
        el.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
          clearInterval(iv);
          resolve();
        }
      }, speed);
    });
  }

  async function run(textEl, opts) {
    const speed = (opts && opts.speed) || 20;
    const pause = (opts && opts.pause) || 300;
    for (const line of LINES) {
      await typeLine(textEl, line, speed);
      await new Promise((r) => setTimeout(r, pause));
    }
  }

  function finish() {
    const loader = document.getElementById("loader");
    if (!loader) return;
    document.body.classList.remove("loading");
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 1100);
  }

  return { run, finish, LINES };
})();
