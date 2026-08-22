# Configurations

Everything on this site is driven by three JSON files in `config/`. They're
read fresh in the browser on every page load — there is no build step, no
regeneration command. Edit a file, push, refresh.

```
config/
  site.json       identity, contact, payment destinations, theme rules
  projects.json   projects, which ones are featured, patents
  docs.json       documentation pages (slug -> markdown file)
```

**Two rules that apply to all three files:**

1. **It must be valid JSON.** No trailing commas, no comments with `//`,
   all strings double-quoted. A single syntax error means the site shows a
   "couldn't load configuration" message instead of loading. Check your
   edit before pushing:
   ```
   python3 -c "import json; json.load(open('config/site.json')); print('OK')"
   ```
2. **`_comment` keys are ignored by the code.** They exist purely as notes
   to yourself inside the file. You can add, edit, or delete them freely,
   and you can add `_comment` to any object.

---

## Table of contents

- [site.json](#sitejson) — brand, contact, payments, theme, social
- [projects.json](#projectsjson) — projects, featured, patents
- [docs.json](#docsjson) — documentation pages
- [Common tasks](#common-tasks)
- [Things that are *not* in config](#things-that-are-not-in-config)
- [Troubleshooting](#troubleshooting)

---

# site.json

## `brand`

| Field | Type | Used for |
|---|---|---|
| `name` | string | Fallback only — used if `displayName` is missing |
| `displayName` | string | The name in the idea form's submit button ("Send it to …") |
| `tagline` | string | The huge headline on the opening section |
| `subtagline` | string | The smaller grey line under the headline |
| `handle` | string | Shown on the final "end of the line" section |

**`tagline` has a deliberate quirk:** the site splits it on whitespace and
renders **the last word in the accent colour**, the rest in normal ink. So

```json
"tagline": "I build the things a sane roadmap wouldn't schedule."
```

renders as *I build the things a sane roadmap wouldn't* **schedule.** —
write your tagline so the last word is the one worth emphasising.

> **Note:** the name in the **top bar** is *not* read from here. It's
> written directly into `index.html` and `docs.html` (search for
> `brand-word` in both). If you rename the site, change it in those two
> files as well as here. Same for the top bar logo link's URL.

## `contact`

| Field | Type | Used for |
|---|---|---|
| `ideaEmail` | string | Where "Submit an idea and I'll build it" sends |
| `ideaFormEndpoint` | string | Optional form relay URL — see below |

**Default behaviour (empty `ideaFormEndpoint`):** the form opens the
visitor's own email client with the subject and body pre-filled, addressed
to `ideaEmail`. Zero setup, works on GitHub Pages immediately. The
trade-off is that the visitor has to actually hit send in their mail app.

**If you want submissions to send silently without leaving the page:** sign
up for a form relay (e.g. [Formspree](https://formspree.io)), create a
form, and paste the endpoint it gives you:

```json
"ideaFormEndpoint": "https://formspree.io/f/abcdwxyz"
```

The form then POSTs there as JSON with the fields `name`, `email`,
`title`, `description`. If that request fails for any reason, the site
automatically falls back to the `mailto:` behaviour, so a dead endpoint
degrades gracefully rather than losing the message.

## `payments`

Drives the "Sponsor this" panel on every project. **No backend and no
processor account of the site's own is involved** — the panel just builds
links and a QR code that hand the visitor off to PayPal or their UPI app.

```json
"payments": {
  "paypal": {
    "email": "you@example.com",
    "username": "yourhandle",
    "paypalMeHandle": "yourhandle"
  },
  "upi": {
    "vpa": "9999999999@bank",
    "payeeName": "Your Name"
  },
  "suggestedAmountsUSD": [5, 15, 50],
  "suggestedAmountsINR": [200, 500, 1500]
}
```

| Field | Used for |
|---|---|
| `paypal.paypalMeHandle` | Builds `paypal.me/<handle>` — the primary button |
| `paypal.username` | Fallback if `paypalMeHandle` is empty |
| `paypal.email` | Used by the secondary "alternate PayPal link" (classic donate URL) |
| `upi.vpa` | The UPI ID — shown as copyable text, and encoded in the QR |
| `upi.payeeName` | The name the visitor's UPI app displays |
| `suggestedAmountsUSD` | Quick-pick chips on the PayPal tab |
| `suggestedAmountsINR` | Quick-pick chips on the UPI tab |

The amount arrays can hold as many or as few numbers as you like; an empty
array `[]` just means no quick-pick chips and the visitor types their own
amount in PayPal / their UPI app. Selected amounts are appended to the
generated links, and the project's name is passed along as the payment
note so you can tell what a sponsorship was for.

## `theme`

```json
"theme": {
  "autoByTimezone": true,
  "dayStartHour": 7,
  "nightStartHour": 19
}
```

| Field | Type | Used for |
|---|---|---|
| `dayStartHour` | number (0–23) | Local hour when light mode begins |
| `nightStartHour` | number (0–23) | Local hour when dark mode begins |
| `autoByTimezone` | boolean | **Currently not read by the code** — see below |

In Auto mode the site reads the **visitor's** IANA timezone via the
browser's `Intl` API and picks light or dark from their local clock — not
from yours. Auto re-evaluates every 15 minutes and whenever the tab
regains focus, so a tab left open overnight flips on its own.

The top-bar button cycles Auto → Light → Dark → Auto, and a manual choice
is remembered in that browser.

> **Honest note:** `autoByTimezone` is currently a no-op. The code always
> supports Auto mode and lets the toggle decide; setting this to `false`
> changes nothing. It's left in place because it documents intent and may
> be wired up later. `dayStartHour` and `nightStartHour` **are** read and
> do work. If they're missing, they default to 7 and 19.

## `social`

An array of links shown on the closing section. Add or remove as many as
you want:

```json
"social": [
  { "label": "GitHub", "url": "https://github.com/microserv-net" },
  { "label": "Email", "url": "mailto:you@example.com" }
]
```

Both fields are required per entry. `mailto:` links are fine. An empty
array simply renders no links.

---

# projects.json

Three top-level keys: `featured`, `projects`, `patents`.

## `featured`

An array of **project `id` strings** — not booleans on the projects
themselves:

```json
"featured": ["thermite-web", "another-project-id"]
```

- Any project whose `id` appears here gets **its own full-size section**
  on the spine, in the order listed here.
- Every project — featured or not — **also** appears in the compact
  "Everything, indexed" section.
- An id here that doesn't match any project is silently ignored, so a typo
  fails quietly rather than breaking the page. If a featured project isn't
  showing, check the id matches exactly.
- `"featured": []` is valid — no project gets a dedicated section, and
  everything lives in the index.

## `projects`

```json
{
  "id": "thermite-web",
  "name": "Thermite",
  "tagline": "Cloud Rust compiler with no application server.",
  "description": "Longer prose about what it is and why it exists.",
  "url": "https://github.com/microserv-net/thermite-web",
  "demoUrl": "https://microservices.net.in/thermite-web/",
  "tags": ["rust", "github-actions", "no-backend"],
  "status": "active",
  "sponsorable": true,
  "docs": "thermite-architecture"
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | **yes** | Must be unique. Referenced by `featured` and by `docs.json`'s `project` field |
| `name` | **yes** | Display name, also used as the payment note when sponsoring |
| `tagline` | no | One line, shown in the accent colour |
| `description` | no | Longer prose. Only shown on a *featured* project's own section |
| `url` | no | Repository link. Omit or leave `""` to hide the button |
| `demoUrl` | no | Live demo link. Omit or leave `""` to hide the button |
| `tags` | no | Array of short strings, rendered as pills |
| `status` | no | See below |
| `sponsorable` | no | Only `false` hides the Sponsor button. Missing = shown |
| `docs` | no | A `slug` from `docs.json`. See below |

**`status`** renders as a small pill next to the name. Any string works and
is displayed as-is — `"active"`, `"archived"`, `"v2 beta"`, whatever. Only
one value is special: **`"wip"`** renders in the orange hazard colour
instead of blue. Omit the field entirely for no pill.

**`sponsorable`** is deliberately opt-*out*. The button appears unless you
explicitly write `"sponsorable": false`, so new projects get it by default.

**`description` is plain text, not markdown.** Asterisks and backticks
render literally. For long-form writeups, use the docs system instead and
link to it via `docs`.

**`docs`** links a project to a documentation page. Two ways to connect
them — you only need one:

1. Set `"docs": "some-slug"` here, pointing at a `slug` in `docs.json`; or
2. Leave `docs` empty and instead set `"project": "this-project-id"` on
   the page in `docs.json`.

If both exist, the `docs` field here wins. If neither, no "Read the docs"
button appears.

## `patents`

```json
{
  "id": "_example-patent",
  "title": "Example Patent Title",
  "number": "US 00/000,000",
  "status": "filed",
  "filedDate": "2026-01-01",
  "abstract": "One or two sentences on what the patent covers.",
  "url": ""
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | **yes** | Heading for the entry |
| `number` | no | Shown in the metadata line |
| `status` | no | Shown in the metadata line, as-is |
| `filedDate` | no | Shown in the metadata line, prefixed "filed" |
| `abstract` | no | Short prose under the title |
| `url` | no | Adds a "View filing" button. Omit or `""` to hide it |
| `id` | no | Not used for rendering; useful for your own tracking |

`number`, `status`, and `filedDate` are joined with `·` separators and any
that are missing are skipped cleanly — so an entry with only a `title` and
`abstract` looks fine.

**An empty `"patents": []` is fully supported** — the section still exists
and shows a short placeholder rather than breaking or looking broken.

---

# docs.json

Documentation pages. Each entry becomes a page at
`docs.html?doc=<slug>`. These pages are ordinary scrollable documents —
no spine, no animation — with just the site's top bar and theme around
them.

```json
{
  "slug": "thermite-architecture",
  "title": "Thermite — Architecture",
  "description": "How Thermite avoids running a backend of its own.",
  "source": "docs/sample-project/README.md",
  "project": "thermite-web",
  "category": "Architecture"
}
```

| Field | Required | Notes |
|---|---|---|
| `slug` | **yes** | Unique. Becomes the URL: `docs.html?doc=<slug>` |
| `title` | **yes** | Page heading and browser tab title |
| `source` | **yes** | Where the markdown lives — see below |
| `description` | no | Grey line under the title |
| `project` | no | A project `id` — auto-links that project to this page |
| `category` | no | Small label above the title. Defaults to "documentation" |

## `source` — the important one

**The markdown file can live anywhere.** This is the whole point of the
config: you keep your `.md` files wherever makes sense, and just tell the
site where to look.

**A path relative to the site root:**
```json
"source": "docs/sample-project/README.md"
"source": "notes/deep-dives/compiler-internals.md"
"source": "README.md"
```
The file does *not* need to be in the `docs/` folder — that folder is a
suggestion, not a requirement. Any path in the repository works.

**A full URL, including a different repository entirely:**
```json
"source": "https://raw.githubusercontent.com/owner/other-repo/main/README.md"
```
This works as long as the URL sends CORS headers.
`raw.githubusercontent.com` does, so you can pull a README straight out of
any public repo without copying it here — it stays in sync with the
source automatically.

> **Security note:** markdown from `source` is rendered with raw HTML
> allowed, the same trust level as writing HTML by hand on your own site.
> Only point `source` at files **you** control. Don't point it at
> user-submitted content or a repo you don't own.

## Navigating to doc pages

- Visiting `docs.html` with no `?doc=` shows an index of all pages.
- A slug that doesn't exist shows a clean "page not found" with the index.
- Entries whose slug starts with `_example` (like `_example-external-doc`)
  are **hidden from the index listing** but still reachable by direct URL.
  That prefix is matched exactly — `_example-anything` is hidden, but a
  slug starting with just `_` or with `example` is not.

---

# Common tasks

### Add a project

1. Add an object to `projects` in `projects.json` with at least `id` and
   `name`.
2. If it deserves its own full section, add its `id` to `featured`.

Nothing else. It appears in the index automatically, with a working
sponsor button.

### Add a documentation page

1. Put the `.md` file anywhere in the repo.
2. Add an entry to `pages` in `docs.json` with `slug`, `title`, and
   `source` pointing at that path.
3. To link it from a project, either set `docs` on the project or set
   `project` on the doc entry.

### Change where sponsorship money goes

Edit `payments` in `site.json`. Note the PayPal/UPI identifiers appear in
**three** places — `paypal.email`, `paypal.username`,
`paypal.paypalMeHandle` — plus a line of visible fineprint in
`index.html` (search for `pay-fineprint`) that names the account. Update
all of them together so nothing contradicts.

### Rename the site

1. `brand` in `site.json`
2. The `brand-word` span in **both** `index.html` and `docs.html`
3. The `<title>` in `index.html`
4. The brand link's `href` in both HTML files, if the GitHub org changed

### Temporarily hide something

- A project: remove it from `projects` (or from `featured` to demote it to
  the index only).
- A doc page: rename its `slug` to start with `_example` to drop it from
  the index while keeping the URL alive.
- A sponsor button: `"sponsorable": false`.

---

# Things that are *not* in config

Worth knowing so you don't hunt through JSON for them:

| Thing | Where it actually lives |
|---|---|
| Top bar site name and logo | `index.html` and `docs.html` (`brand-word`, `brand-mark`) |
| Nav menu items (Home / Work / …) | `index.html` — the `nav-link` anchors |
| Section headings ("Everything, indexed", "Patents", …) | `assets/js/render.js` |
| Vertebra labels (C1, T1, L1, S1, COCCYX) | `assets/js/render.js`, in `buildSlots()` |
| Colours, fonts, sizing | CSS variables at the top of `assets/css/main.css` |
| Loading animation | `assets/js/loader.js` |
| Spine curve shape and motion | `assets/js/render.js` (`buildSpine`) and `assets/js/spine-engine.js` |
| Section order | `buildSlots()` in `assets/js/render.js` |

The order of sections is fixed in code: opening → featured projects →
full index → patents → idea form → closing. Only the *featured projects*
portion is config-driven (via the `featured` array's order).

---

# Troubleshooting

**The whole site shows "couldn't load the site configuration".**
One of the three JSON files has a syntax error. Run the validation command
at the top of this document against each file to find which.

**Running locally shows that same error even though the JSON is fine.**
You opened `index.html` directly from disk. Browsers block `fetch()` of
local files over `file://`. Serve it instead:
```
python3 -m http.server 8000
```
then open `http://localhost:8000`.

**A featured project isn't getting its own section.**
The string in `featured` must match the project's `id` exactly —
case-sensitive, no stray whitespace. Mismatches are ignored silently.

**A doc page shows "Could not load this page's markdown".**
The `source` path is wrong, or it's an external URL without CORS headers.
Paths are relative to the site root, not to `config/`.

**Sponsor button missing on a project.**
Check for `"sponsorable": false`. Note only the exact value `false` hides
it — `"false"` (a string) does not.

**Changes don't show up after pushing.**
GitHub Pages can take a minute, and browsers cache aggressively. Hard
refresh (Ctrl/Cmd + Shift + R). The config files are fetched with
`cache: "no-store"`, so a hard refresh is normally enough.
