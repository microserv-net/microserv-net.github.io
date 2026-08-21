/* spine-engine.js
   -----------------------------------------------------------------------
   No native scrollbar. Instead: wheel / trackpad gesture / touch drag /
   arrow keys accumulate into a single float "target" (in slot units).
   Every frame, "current" eases toward "target" (lerp).

   There is no rotation drum here anymore. The spine path is what governs
   everything: "current" decomposes into segIndex (which transition we're
   in — see render.js buildSpine) and frac (progress through it, 0..1).
   Exactly two cards are ever visible — the one we're leaving (fromIdx)
   and the one we're arriving at (toIdx) — cross-fading as frac moves,
   each rising into place from below and exiting upward as it goes,
   mirroring the same "line traces / feels like it's scrolling up" motion
   the curve itself has (spineCurve.setProgress gets the same "current"
   every frame). Scrolling back up runs the exact same motion in reverse.

   Each card's LEFT/RIGHT position is fixed per-card (data-lean, set by
   render.js from the curve's own shape) and applied via the element's
   `left` — a plain layout property — rather than a transform, so there's
   no perspective/rotation math left to interact with it at all.
   ----------------------------------------------------------------------- */
window.SpineEngine = (function () {
  function create(opts) {
    const {
      stage, // container that owns the wheel/touch listeners
      cards, // array of card elements, in slot order
      tags, // array of vertebra-tag elements, in slot order
      dots, // array of progress-dot <button> elements, in slot order
      spineCurve, // { setProgress(current) } — see render.js buildSpine()
      onChange, // (activeIndex, fraction) => void
    } = opts;

    const N = cards.length;
    const leans = cards.map((c) => parseFloat(c.dataset.lean || "0") || 0); // -1, 0, or 1 per card
    let target = 0;
    let current = 0;
    let raf = null;

    function computeLean() {
      const w = window.innerWidth;

      // Mirrors --card-w: min(500px, 78vw) in main.css.
      const cardW = Math.min(500, w * 0.78);
      const cardHalf = cardW / 2;
      const clearance = 28; // gap between the card's INNER edge and centre
      const edgeMargin = 24; // gap between the card's OUTER edge and the viewport edge

      let leanPx = 0;
      if (w >= 1120) {
        // Below this width there isn't room for a 500px-capped card to
        // clear the centreline with a real margin — see the main.css
        // comment on .spine-line-wrap for the matching breakpoint.
        const minLean = cardHalf + clearance; // guarantees the near edge clears centre
        const maxLean = w / 2 - cardHalf - edgeMargin; // guarantees the far edge stays on screen
        if (maxLean >= minLean) {
          const desired = minLean + 80; // a bit of breathing room past the minimum
          leanPx = Math.max(minLean, Math.min(maxLean, desired));
        }
        // if maxLean < minLean, the viewport's too narrow for a card this
        // wide to clear centre without going off-screen — leanPx stays 0
        // and the card centres instead (curve is CSS-hidden at this width
        // regardless — see main.css).
      }

      cards.forEach((card, i) => {
        card.style.left = "calc(50% + " + (leans[i] * leanPx).toFixed(1) + "px)";
      });
    }
    computeLean();

    function clamp(v) {
      return Math.max(0, Math.min(N - 1, v));
    }

    // ---- input handlers ----
    function onWheel(e) {
      e.preventDefault();
      const delta = e.deltaY !== undefined ? e.deltaY : e.detail || 0;
      target = clamp(target + delta * 0.0026);
    }

    let touchY = null;
    let touchX = null;
    function onTouchStart(e) {
      touchY = e.touches[0].clientY;
      touchX = e.touches[0].clientX;
    }
    function onTouchMove(e) {
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      const x = e.touches[0].clientX;
      const dy = touchY - y;
      const dx = touchX - x;
      // only hijack when the gesture is more vertical than horizontal,
      // so a horizontal swipe inside a card (e.g. a wide table) isn't eaten
      if (Math.abs(dy) > Math.abs(dx)) {
        e.preventDefault();
        target = clamp(target + dy * 0.014);
      }
      touchY = y;
      touchX = x;
    }
    function onTouchEnd() {
      touchY = null;
      touchX = null;
    }

    function onKey(e) {
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        target = clamp(target + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        target = clamp(target - 1);
      } else if (e.key === "Home") {
        target = 0;
      } else if (e.key === "End") {
        target = N - 1;
      }
    }

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", computeLean);

    // ---- render loop ----
    let lastActive = -1;
    const RISE = 36; // px a card travels in/out as it cross-fades

    function frame() {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.0006) current = target;

      const segIndex = N > 1 ? Math.max(0, Math.min(N - 2, Math.floor(current))) : 0;
      const frac = N > 1 ? Math.max(0, Math.min(1, current - segIndex)) : 0;
      const fromIdx = segIndex;
      const toIdx = N > 1 ? Math.min(N - 1, segIndex + 1) : 0;

      for (let i = 0; i < N; i++) {
        const card = cards[i];
        let opacity = 0;
        let rise = RISE;
        let z = 1000;

        if (i === fromIdx && i === toIdx) {
          opacity = 1;
          rise = 0;
          z = 1005;
        } else if (i === fromIdx) {
          opacity = 1 - frac;
          rise = -frac * RISE; // exits upward
          z = 1000;
        } else if (i === toIdx) {
          opacity = frac;
          rise = (1 - frac) * RISE; // arrives from below
          z = 1010;
        }

        if (opacity > 0.001) {
          const scale = 0.97 + 0.03 * opacity;
          card.style.transform = "translate(-50%,-50%) translateY(" + rise.toFixed(1) + "px) scale(" + scale.toFixed(3) + ")";
          card.style.opacity = opacity.toFixed(3);
          card.style.zIndex = String(z);
          card.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
        } else {
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
        }
      }

      const activeIndex = Math.round(current);
      if (activeIndex !== lastActive) {
        lastActive = activeIndex;
        for (let i = 0; i < N; i++) {
          const isActive = i === activeIndex;
          if (tags[i]) tags[i].classList.toggle("show", isActive);
          if (dots[i]) dots[i].classList.toggle("active", isActive);
          cards[i].setAttribute("aria-hidden", isActive ? "false" : "true");
          cards[i].toggleAttribute("inert", !isActive);
        }
        onChange && onChange(activeIndex, N > 1 ? current / (N - 1) : 0);
      }

      spineCurve && spineCurve.setProgress(current);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      goTo(i) {
        target = clamp(i);
      },
      next() {
        target = clamp(Math.round(target) + 1);
      },
      prev() {
        target = clamp(Math.round(target) - 1);
      },
      currentIndex() {
        return Math.round(current);
      },
      destroy() {
        cancelAnimationFrame(raf);
        stage.removeEventListener("wheel", onWheel);
        stage.removeEventListener("touchstart", onTouchStart);
        stage.removeEventListener("touchmove", onTouchMove);
        stage.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", computeLean);
      },
    };
  }

  return { create };
})();
