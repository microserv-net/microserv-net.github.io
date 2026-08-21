/* spine-engine.js
   -----------------------------------------------------------------------
   No native scrollbar. Instead: wheel / trackpad gesture / touch drag /
   arrow keys accumulate into a single float "target" (in slot units).
   Every frame, "current" eases toward "target" (lerp), and every card is
   given a transform of rotateY(relativeAngle) translateZ(radius) — i.e.
   each card sits on the surface of a drum whose axis is the curved spine
   line rendered on screen. As current changes,
   the whole drum appears to revolve around that line, continuously,
   in lockstep with the input — not a slide-to-the-next-slot snap.
   The card nearest angle 0 is the one facing the viewer: full opacity,
   full scale, in focus. Neighbours recede in opacity/blur/scale with
   their angular distance, exactly like looking at a rotating cylinder
   from a fixed camera.

   Every card also carries the same fixed rightward offset (computed in
   computeRadius() below), so it settles into the open space the C-curve
   leaves on the right rather than sitting dead-centre. That offset is
   applied as the outermost transform, in screen space, so it stays a
   clean, constant placement no matter how the card is currently rotated.
   ----------------------------------------------------------------------- */
window.SpineEngine = (function () {
  function create(opts) {
    const {
      stage, // container that owns the wheel/touch listeners
      cards, // array of card elements, in slot order
      tags, // array of vertebra-tag elements, in slot order
      nodes, // array of spine-node <circle> elements, in slot order
      dots, // array of progress-dot <button> elements, in slot order
      spineFill, // the SVG path element that "traces" downward
      onChange, // (activeIndex, fraction) => void
    } = opts;

    const N = cards.length;
    const SEGMENT = 52; // degrees between adjacent slots on the drum
    let target = 0;
    let current = 0;
    let radius = 620;
    let cardOffsetPx = 0; // shared rightward offset — see computeRadius()
    let spineLength = 0;
    let raf = null;

    function computeRadius() {
      const w = window.innerWidth;
      radius = Math.max(300, Math.min(680, w * 0.34));

      // Mirrors --card-w: min(500px, 78vw) in main.css. The curve's own
      // right anchor sits at ~70% of viewport width (see render.js), so
      // aim the card a bit further right than that, clamped so it never
      // runs off-screen and never gets pushed left of true centre.
      const cardW = Math.min(500, w * 0.78);
      const cardHalf = cardW / 2;
      const margin = 28;
      const desiredCenterX = w * 0.82;
      const maxCenterX = w - cardHalf - margin;
      const minCenterX = w * 0.5;
      const centerX = Math.max(minCenterX, Math.min(maxCenterX, desiredCenterX));
      cardOffsetPx = centerX - w * 0.5;
    }
    computeRadius();

    function computeSpineLength() {
      spineLength = spineFill ? spineFill.getTotalLength() : 0;
      if (spineFill) {
        spineFill.style.strokeDasharray = String(spineLength);
        spineFill.style.strokeDashoffset = String(spineLength);
      }
    }
    computeSpineLength();

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
    window.addEventListener("resize", computeRadius);
    window.addEventListener("resize", computeSpineLength);

    // ---- render loop ----
    let lastActive = -1;

    function frame() {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.0006) current = target;

      for (let i = 0; i < N; i++) {
        const card = cards[i];
        const rel = (i - current) * SEGMENT; // degrees
        const rad = (rel * Math.PI) / 180;
        const facing = Math.cos(rad); // 1 = dead centre, -1 = directly behind
        const absRel = Math.abs(rel);
        const opacity = Math.max(0, Math.min(1, 1 - absRel / 96));
        const scale = 0.8 + 0.2 * Math.max(0, facing);
        const blur = Math.min(11, absRel / 8.5);
        const bright = 0.5 + 0.5 * Math.max(0, facing);
        const bob = Math.sin(rad) * 16;

        card.style.transform =
          "translateX(" + cardOffsetPx.toFixed(1) + "px) " +
          "translate(-50%,-50%) rotateY(" + rel.toFixed(2) + "deg) " +
          "translateZ(" + radius + "px) translateY(" + bob.toFixed(1) + "px) " +
          "scale(" + scale.toFixed(3) + ")";
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = "blur(" + blur.toFixed(2) + "px) brightness(" + bright.toFixed(2) + ")";
        card.style.zIndex = String(Math.round(1000 + facing * 100));
        card.style.pointerEvents = absRel < SEGMENT * 0.5 ? "auto" : "none";
      }

      const activeIndex = Math.round(current);
      if (activeIndex !== lastActive) {
        lastActive = activeIndex;
        for (let i = 0; i < N; i++) {
          const isActive = i === activeIndex;
          if (tags[i]) tags[i].classList.toggle("show", isActive);
          if (nodes[i]) nodes[i].classList.toggle("active", isActive);
          if (dots[i]) dots[i].classList.toggle("active", isActive);
          cards[i].setAttribute("aria-hidden", isActive ? "false" : "true");
          cards[i].toggleAttribute("inert", !isActive);
        }
        onChange && onChange(activeIndex, N > 1 ? current / (N - 1) : 0);
      }

      if (spineFill && spineLength) {
        const frac = N > 1 ? current / (N - 1) : 0;
        spineFill.style.strokeDashoffset = String(spineLength * (1 - frac));
      }

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
        window.removeEventListener("resize", computeRadius);
        window.removeEventListener("resize", computeSpineLength);
      },
    };
  }

  return { create };
})();
