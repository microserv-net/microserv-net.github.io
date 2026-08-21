# Thermite — Architecture Notes

This page is served as a documentation page through the site's docs system.
The file you're reading lives at `docs/sample-project/README.md` — an
arbitrary path inside the repository. `config/docs.json` points the slug
`thermite-architecture` at this exact path, which is the whole mechanism:
put a markdown file *anywhere* in the repo (or reference one in a completely
different repo via a raw URL), then tell the config file where it is.

## Why no backend

Thermite compiles Rust on GitHub's own hosted Actions runners, inside the
visitor's own GitHub account, against their own quota. The website is a
static page: no server holding credentials, no shared queue, no database.
A stateless relay is used for exactly one thing — the OAuth handshake for
"Sign in with GitHub" — and even that is optional.

## Editing this page

- Replace this file's contents, or point the `thermite-architecture` entry
  in `config/docs.json` at a different file entirely.
- Add more pages by adding more entries to `config/docs.json`. Each needs a
  unique `slug`, a `title`, and a `source`.
- Markdown here supports headings, lists, links, code blocks, tables, and
  the usual inline formatting — it's rendered client-side, so nothing needs
  to be pre-built.

```rust
fn pour() -> Result<Ingot, Slag> {
    // the runner does the actual work
    Ok(Ingot::default())
}
```

That's it. No build step, no template engine — just a file and a line in a
config pointing at it.
