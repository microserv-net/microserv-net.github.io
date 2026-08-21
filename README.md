# the spine

A GitHub Pages site built around one idea: no scrollbar, no stacked sections
— everything rotates around a vertical spine line rendered in the center of
the screen, driven by however you scroll (wheel, trackpad, touch, arrow
keys). It's a static site — no build step, no backend, no database. Fork it,
edit the JSON files, push.

```
index.html              the spine experience
docs.html                doc-page renderer (no spine, plain scroll)
404.html                 on-brand 404
.nojekyll                 tells GitHub Pages not to run Jekyll on this repo

config/
  site.json               brand, contact/idea-mail routing, payment destinations, theme rules
  projects.json           projects + featured flag + patents
  docs.json               slug -> markdown file location, for documentation pages

assets/
  css/main.css             all styling (design tokens at the top)
  js/
    config.js              fetches the JSON config files
    theme.js                auto (timezone) + manual light/dark
    loader.js                the intro animation
    topbar.js                theme switch + mobile menu wiring
    render.js                 turns config JSON into DOM (cards, spine, tags, dots)
    spine-engine.js            the scroll-hijack / 3D rotation engine
    sponsor.js                 sponsor modal (PayPal + UPI + QR)
    idea-form.js                idea form -> email
    docs.js                     powers docs.html
    vendor/
      marked.umd.js             markdown -> HTML (MIT, markedjs/marked)
      qrcode.js, qrcode-utf8.js   QR code generation (MIT, davidshimjs / kazuhikoarase)

docs/
  sample-project/README.md    an example doc file — can live anywhere, see below
```

## Deploying

1. Create a repository named `<your-username>.github.io` (for a user site)
   or any name (for a project site — GitHub Pages will serve it at
   `<username>.github.io/<repo>/`, which still works fine since every link
   in this project is relative).
2. Copy everything in this folder into the repository root.
3. Settings → Pages → Source: **Deploy from a branch**, branch `main`,
   folder `/ (root)`. Push.
4. Wait ~1 minute, then visit the Pages URL GitHub gives you.

No Actions workflow, no build step. `.nojekyll` is already included so
GitHub Pages serves the files exactly as they are.

### Running it locally

Serve it, don't open `index.html` directly from disk — `fetch()` of the
local `config/*.json` files is blocked under `file://`:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Editing content — you should rarely need to touch HTML/CSS/JS

### Projects, featured projects, and patents — `config/projects.json`

- Add a project by adding an entry to `"projects"`. Every project
  automatically appears in the "full manifest" index vertebra, with a
  working Sponsor button.
- Add its `id` to the top-level `"featured"` array to also give it its own
  large vertebra (`T1`, `T2`, …) between the hero and the index.
- Set `"sponsorable": false` on a project to hide its Sponsor button.
- Set `"docs"` to a slug from `config/docs.json` to add a "Read the docs"
  link (or leave it blank/omit it — the site also auto-links a project to
  any doc page whose `"project"` field matches the project's `id`).
- Add patents to the `"patents"` array the same way; leave it empty and the
  L1 vertebra shows a placeholder instead of breaking.

### Documentation pages — `config/docs.json`

Each entry maps a URL (`docs.html?doc=<slug>`) to a markdown file:

```json
{
  "slug": "my-project-architecture",
  "title": "My Project — Architecture",
  "source": "wherever/you/saved/it.md",
  "project": "my-project-id",
  "category": "Architecture"
}
```

`source` can be:
- **a path relative to the repo root** — the `.md` file can live anywhere
  in the repository, it does *not* need to sit next to `docs.json`, and
  doesn't need to be inside the `docs/` folder either. That folder is just
  a suggestion, not a requirement.
- **a full `https://` URL** — including a raw file in a *different*
  repository (e.g. `https://raw.githubusercontent.com/you/other-repo/main/README.md`).
  This works as long as that URL sends CORS headers; `raw.githubusercontent.com`
  does.

These pages deliberately have no spine — they're meant to be read normally,
scrolled normally, and linked normally.

> Markdown on these pages is rendered as-is (raw HTML in the markdown is
> not stripped). That's fine as long as you only point `source` at files
> you wrote yourself — treat it the same trust level as hand-written HTML
> on your own site, not as a place to render arbitrary third-party or
> user-submitted markdown.

### Site identity, contact, payments, theme — `config/site.json`

Every field has an inline `"_comment"` explaining it. The three sections
that matter most:

- **`contact.ideaEmail`** — where "Submit an idea and I'll build it" goes.
  By default the form opens the visitor's email client with a pre-filled
  `mailto:` link — this needs no setup at all and works on GitHub Pages
  as-is.
- **`payments.paypal` / `payments.upi`** — used to build every project's
  Sponsor panel: a PayPal.me link, a fallback classic PayPal donate link,
  a `upi://pay` deep link, and a generated UPI QR code. No processor
  account of ours is involved — sponsoring literally just opens PayPal or
  the visitor's UPI app with the amount and a note pre-filled.
- **`theme`** — `dayStartHour` / `nightStartHour` control when auto mode
  switches, based on the *visitor's own* timezone (read via the `Intl`
  API), not yours.

### Wiring the idea form to send without opening a mail client

If you'd rather the form send silently instead of opening the visitor's
email app, set up a free form relay (e.g. [Formspree](https://formspree.io))
and paste its endpoint into `contact.ideaFormEndpoint` in `site.json`. The
form will `POST` there instead, and fall back to `mailto:` automatically if
that request fails.

## The spine mechanic, if you want to tune it

Rotation and input, in `assets/js/spine-engine.js`:

- `SEGMENT` — degrees between adjacent cards on the drum. Smaller = cards
  overlap more before the current one is fully in focus; larger = a more
  dramatic swing between them.
- the `0.09` lerp factor in `frame()` — how quickly the rotation eases
  toward your scroll input. Lower = heavier/slower, higher = snappier.
- the wheel/touch multipliers (`0.0026`, `0.014`) — how much scroll/swipe
  distance maps to rotation.
- `leanPx` (computed in `computeRadius()`) — how far a card sits left or
  right of the spine once it's in focus. It's derived from viewport and
  card width so it never pushes a card off-screen; the `190` cap is the
  most it will ever lean on a wide screen.

The curve itself, in `assets/js/render.js`:

- `generateLeans()` — decides, per vertebra, which side of the spine it
  sits on (a card's `data-lean` of `-1`/`+1`, read by the engine above).
  It's randomized per page load and biased to alternate sides rather than
  drift the same direction for long — see the `0.72` swap probability.
- `AMPLITUDE` in `buildSpine()` — how far the spine curve itself bends
  toward a leaning vertebra. This is a much smaller number than `leanPx`
  on purpose: the line should visibly lean, not travel as far as the card
  does.
- Both the rail and the fill are built with `catmullRomPath()`, which
  threads a smooth curve through those same per-vertebra points — nothing
  about the trace/dash-offset progress mechanic needed to change when the
  line went from straight to curved, since SVG path length is geometric
  either way.

The visible band of the spine line (the middle 60% of the screen) is set in
two places that need to stay in sync: the `mask-image` stops in
`main.css` (`#spine-stage .spine-line-wrap`) and `BAND_TOP` / `BAND_BOTTOM`
in `render.js`.

## Accessibility & fallbacks

- `prefers-reduced-motion: reduce` is honored: the whole 3D/scroll-hijack
  engine is skipped and the same content renders as an ordinary stacked,
  scrollable page instead.
- Non-active cards are marked `inert` and `aria-hidden`, so keyboard focus
  and screen readers only see the card currently in view.
- Arrow keys / Page Up / Page Down / Home / End all move through the spine
  without a mouse.

## Colors, type, and the rest of the visual system

Every design token is a CSS custom property at the top of
`assets/css/main.css` (`:root` for dark, `[data-theme="light"]` for the
light overrides) — palette, fonts, card width, spine radius defaults, and
the rotation easing curve. Swap values there rather than hunting through
individual rules.

## Third-party code

Both vendored files in `assets/js/vendor/` are MIT-licensed and used
client-side only, with no accounts or API keys:
- `marked.umd.js` — [markedjs/marked](https://github.com/markedjs/marked),
  renders the documentation pages.
- `qrcode.js` / `qrcode-utf8.js` — [kazuhikoarase/qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator),
  renders the UPI QR code in the sponsor panel.

Everything else — the spine engine, the loader, the config renderer, the
top bar, the modal — is original code written for this site.
