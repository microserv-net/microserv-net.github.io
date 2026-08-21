/* sponsor.js — "Sponsor this project" panel. No backend: builds a PayPal.me
   / PayPal donate link and a upi:// deep link + QR straight from
   config/site.json's payments block, scoped with the clicked project's name. */
window.SpineSponsor = (function () {
  let siteCfg = null;
  let els = {};
  let state = { project: "", tab: "paypal", amount: null };

  function money(n) {
    return String(n).replace(/[^0-9.]/g, "");
  }

  function buildPaypalMeUrl() {
    const p = siteCfg.payments.paypal;
    let url = "https://www.paypal.com/paypalme/" + encodeURIComponent(p.paypalMeHandle || p.username);
    if (state.amount) url += "/" + money(state.amount) + "USD";
    return url;
  }

  function buildPaypalDonateUrl() {
    const p = siteCfg.payments.paypal;
    const params = new URLSearchParams({
      cmd: "_donations",
      business: p.email,
      item_name: "Sponsor: " + state.project,
      currency_code: "USD",
    });
    if (state.amount) params.set("amount", money(state.amount));
    return "https://www.paypal.com/cgi-bin/webscr?" + params.toString();
  }

  function buildUpiUri() {
    const u = siteCfg.payments.upi;
    const params = new URLSearchParams({
      pa: u.vpa,
      pn: u.payeeName,
      tn: "Sponsor " + state.project,
      cu: "INR",
    });
    if (state.amount) params.set("am", money(state.amount));
    return "upi://pay?" + params.toString();
  }

  function renderQr(container, text) {
    container.innerHTML = "";
    try {
      const qr = window.qrcode(0, "M");
      qr.addData(text);
      qr.make();
      container.innerHTML = qr.createSvgTag(5, 8);
    } catch (e) {
      const p = document.createElement("p");
      p.className = "pay-fineprint";
      p.textContent = "QR unavailable in this browser — use the button above or copy the UPI ID.";
      container.appendChild(p);
    }
  }

  function paintAmountChips(panel) {
    panel.querySelectorAll(".amount-chip").forEach((chip) => {
      chip.classList.toggle("active", String(state.amount) === chip.dataset.amount);
    });
  }

  function refresh() {
    if (!els.modal) return;
    els.paypalLink.href = buildPaypalMeUrl();
    els.paypalDonateLink.href = buildPaypalDonateUrl();
    els.upiLink.href = buildUpiUri();
    els.upiVpaText.textContent = siteCfg.payments.upi.vpa;
    renderQr(els.qrBox, buildUpiUri());
    paintAmountChips(els.usdAmounts);
    paintAmountChips(els.inrAmounts);
  }

  function setTab(tab) {
    state.tab = tab;
    els.tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    els.panels.forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
  }

  function open(projectName) {
    state.project = projectName;
    state.amount = null;
    els.title.textContent = "Sponsor " + projectName;
    setTab("paypal");
    refresh();
    els.overlay.classList.add("open");
    document.body.classList.add("modal-open");
  }

  function close() {
    els.overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  function copyText(text, btn) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        const orig = btn.textContent;
        btn.textContent = "copied";
        setTimeout(() => (btn.textContent = orig), 1400);
      })
      .catch(() => {});
  }

  function init(site) {
    siteCfg = site;
    els.overlay = document.getElementById("sponsor-overlay");
    if (!els.overlay) return;
    els.modal = els.overlay.querySelector(".modal");
    els.title = document.getElementById("sponsor-title");
    els.tabs = Array.from(els.overlay.querySelectorAll(".pay-tab"));
    els.panels = Array.from(els.overlay.querySelectorAll(".pay-panel"));
    els.paypalLink = document.getElementById("paypal-link");
    els.paypalDonateLink = document.getElementById("paypal-donate-link");
    els.upiLink = document.getElementById("upi-link");
    els.upiVpaText = document.getElementById("upi-vpa-text");
    els.qrBox = document.getElementById("upi-qr");
    els.usdAmounts = document.getElementById("usd-amounts");
    els.inrAmounts = document.getElementById("inr-amounts");
    els.copyVpa = document.getElementById("copy-vpa");

    (siteCfg.payments.suggestedAmountsUSD || []).forEach((amt) => {
      const chip = document.createElement("button");
      chip.className = "amount-chip";
      chip.type = "button";
      chip.dataset.amount = String(amt);
      chip.textContent = "$" + amt;
      chip.addEventListener("click", () => {
        state.amount = state.amount === String(amt) ? null : String(amt);
        refresh();
      });
      els.usdAmounts.appendChild(chip);
    });
    (siteCfg.payments.suggestedAmountsINR || []).forEach((amt) => {
      const chip = document.createElement("button");
      chip.className = "amount-chip";
      chip.type = "button";
      chip.dataset.amount = String(amt);
      chip.textContent = "\u20B9" + amt;
      chip.addEventListener("click", () => {
        state.amount = state.amount === String(amt) ? null : String(amt);
        refresh();
      });
      els.inrAmounts.appendChild(chip);
    });

    els.tabs.forEach((t) => {
      t.addEventListener("click", () => {
        state.amount = null;
        setTab(t.dataset.tab);
        refresh();
      });
    });

    els.copyVpa.addEventListener("click", () => copyText(siteCfg.payments.upi.vpa, els.copyVpa));

    els.overlay.addEventListener("click", (e) => {
      if (e.target === els.overlay) close();
    });
    els.overlay.querySelector(".modal-close").addEventListener("click", close);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sponsor]");
      if (btn) open(btn.dataset.sponsor);
    });
  }

  return { init, open, close };
})();
