<p align="center"><img src="docs/hero.svg" alt="dsh-project-guide" width="100%"></p>

<p align="center">
  <b>English</b> · <a href="README.md">简体中文</a>
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-0.2.0-5b8cff?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3fb950?style=flat-square">
  <img alt="platform" src="https://img.shields.io/badge/DSH-Desktop%20%2B%20Web-6b5cff?style=flat-square">
</p>

# Three things that happen when you build with an AI coding agent

- **You open a blind box.** The agent says "done"; you have no independent way to check, so you roll again.
- **You can only say "continue".** Not because you don't care, but because describing a problem needs vocabulary.
- **You finish a project and learn nothing.** The explanation scrolled away with the conversation.

`dsh-project-guide` gives a project a **structure you can read**: an IDE-style tree on the left, an explanation for whatever you click, and a **Detail** button when you want depth.

## What it looks like

A tree of folders and files — collapsible, root files included — and a detail pane.

```
▾ dsh-project-guide            17
  ▸ dev                         1
  ▸ docs                        4
    client.js
    index.js                    ← click it; the right side explains it
    package.json
    README.md
```

- **Collapse**: every folder row has a ▸/▾ on the right; toggling never changes the pane.
- **Order**: folders first, then names (natural order, Chinese sorted by pinyin).
- **Search**: matches anywhere in the tree and flattens the result.
- **Splitter**: drag the divider, double-click to reset; the width is remembered.

## How it works

Two separate jobs — only the second costs model tokens:

| | When | Model usage |
| --- | --- | --- |
| Scan structure | once per project, `readdir` only | none — names only, no file contents |
| Explain | when you press **Detail** | one call; cached by file mtime |

So **opening a project is instant and free**. Until you press Detail, the words come from a built-in dictionary (60+ common folder and file names) plus file facts (lines, exports, imports) — that part cannot hallucinate.

Each detail card shows facts and judgment side by side. Risk has four states:

**safe / careful / hands-off / not assessed**

Without positive evidence the answer is "not assessed" — no defaulting to safe. Press **Assess all** to grade a whole level in one model call (a few seconds); those verdicts are marked as *assessed*.

## Install

```bash
git clone https://github.com/yxyusage/dsh-project-guide.git
```

Then install it from that directory in dsh's plugin page (Plugin Manager → Install → pick the folder). A **Guide** entry appears in the sidebar.

## Limits

- Imports cover JS / TS / JSX / Vue / Svelte / Astro relative imports only.
- **"Imported by" is not implemented** — a reverse index would have to read every code file, which conflicts with instant open. You get "it imports" for the folder you open.
- 400 KB per file; binaries are reported as unreadable.
- Tree caps: depth 8, 5000 nodes, 200 files per folder; the UI says when a cap was hit.
- Hidden files (`.env`, `.git`) and dependency folders (`node_modules`, `dist`) are never listed and never sent to a model.
- On open, a local import index runs in the background (code files only, no model, capped at 400 files / 1.5 s) to count inbound references; when the cap is hit the index is partial but opening never blocks.

## Development

```
index.js          host half: tree scan, facts, model calls, four read-only endpoints
client.js         browser half: sidebar tree + detail pane (no build step, plain JS)
cordis.patch.yml  bundle declaration
locale/           display name and description
dev/probe.mjs     dev probe: hit the API directly to judge real output
```

Endpoints under `/api/project-guide/`: `projects` / `tree` / `node` / `detail`.

Applying changes:

- `client.js`: refresh the page;
- `index.js`: toggle the plugin off and on in Plugin Manager (hot reload, no dsh restart).

Probe usage:

```bash
node dev/probe.mjs /Users/you/project          # tree + concise copy
node dev/probe.mjs --detail /Users/you/project src   # also run one Detail
# add --port 12345 when the web port changed (default 54622)
```

## License

MIT © yxynbglass
