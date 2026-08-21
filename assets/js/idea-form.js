/* idea-form.js — "Submit an idea and I'll build it."
   Zero-setup default: builds a mailto: link (pre-filled) and opens the
   visitor's mail client. If contact.ideaFormEndpoint is set in
   config/site.json (e.g. a Formspree endpoint), it POSTs there instead so
   the visitor never leaves the page. See README > "Wiring the idea form". */
window.SpineIdeaForm = (function () {
  function buildMailto(contact, data) {
    const subject = "Idea: " + data.title;
    const bodyLines = [
      data.description,
      "",
      "-- ",
      data.name ? "From: " + data.name : "",
      data.email ? "Reply to: " + data.email : "",
    ].filter(Boolean);
    const params = new URLSearchParams({ subject, body: bodyLines.join("\n") });
    return "mailto:" + contact.ideaEmail + "?" + params.toString().replace(/\+/g, "%20");
  }

  async function submitToEndpoint(endpoint, data) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Relay responded " + res.status);
    return true;
  }

  function init(siteCfg) {
    const form = document.getElementById("idea-form");
    if (!form) return;
    const statusEl = document.getElementById("idea-form-status");
    const contact = siteCfg.contact || {};

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        title: form.title.value.trim(),
        description: form.description.value.trim(),
      };
      if (!data.title || !data.description) {
        statusEl.textContent = "An idea needs at least a title and a description.";
        statusEl.className = "form-status err";
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      statusEl.className = "form-status";

      if (contact.ideaFormEndpoint) {
        statusEl.textContent = "Sending...";
        try {
          await submitToEndpoint(contact.ideaFormEndpoint, data);
          statusEl.textContent = "Sent. If it's good, expect a very excited reply.";
          statusEl.className = "form-status ok";
          form.reset();
        } catch (err) {
          statusEl.textContent = "Couldn't send it directly — opening your email client instead.";
          statusEl.className = "form-status err";
          window.location.href = buildMailto(contact, data);
        }
      } else {
        statusEl.textContent = "Opening your email client with this idea pre-filled...";
        statusEl.className = "form-status ok";
        window.location.href = buildMailto(contact, data);
      }

      submitBtn.disabled = false;
    });
  }

  return { init };
})();
