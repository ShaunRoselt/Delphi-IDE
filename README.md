# Delphi-IDE

<p align="center">
  <img src="public/Delphi_Helm_Icon.png" alt="Delphi-IDE project icon" width="240" />
</p>

A browser-based UI prototype of Embarcadero RAD Studio 13 / Delphi. Lays out a form visually, edits the generated Object Pascal source, and runs simple event handlers — all client-side, no install, no backend, no build step.

Live preview: [delphi.test.shaunroselt.com](https://delphi.test.shaunroselt.com)

## What it does

- **Form designer** — drag-and-place VCL-style components (`TButton`, `TLabel`, `TEdit`, `TMemo`, `TCheckBox`, `TRadioButton`, `TListBox`, `TComboBox`, `TPanel`, `TGroupBox`, plus Additional / Win32 / System / Dialogs categories) on a design surface with grid, snap-to-grid, and selection handles.
- **Object Inspector** — Properties and Events tabs with filterable rows, typed editors (string / bool / int / enum / strings), and event-handler stubs.
- **Code editor** — Object Pascal source with a single-pass tokenizing syntax highlighter (keywords, types, strings, comments, numbers). Generated `.pas` is kept in sync with the designer.
- **Pascal compiler (lite)** — Lexes and parses handler bodies and surfaces diagnostics (line, column, code, severity) inline.
- **Mini runtime** — Interprets a useful subset of Pascal so designed forms feel alive: `ShowMessage`, property reads/writes (`Caption`, `Text`, `Visible`, `Enabled`, `Checked`, `Position`, `Color`), `Lines.Add` / `Lines.Clear`, string concatenation, `IntToStr` / `StrToInt` / `FloatToStr` / `Length`, etc. Unrecognized statements degrade gracefully.
- **Persistent state** — The entire IDE state (open tabs, forms, components, layout, prefs) round-trips through `localStorage` under `delphi-ide-state-v2`.
- **Chrome that looks the part** — Menu bar, toolbars, dockable left/right/bottom panels with resizable splitters, status bar, structure tree, history list, Welcome page.

## Tech

Vanilla JavaScript ESM, no framework, **no bundler at runtime**. Source files are loaded directly by the browser via native `<script type="module">` and relative imports — everything in `src/` is served as-is by GitHub Pages and the browser resolves the module graph itself. Vite is available locally for `npm run dev` / `npm run lint` but is not in the deployment path.

Rendering is plain template strings (`render/*.js`) wired up after each render (`wire/*.js`); state lives in a single store (`state.js`) that re-renders the shell on change.

## Project layout

```
index.html               entry point — browser loads /src/main.js as a module
CNAME                    custom domain marker for GitHub Pages
vite.config.js           local dev only (Vite dev server / lint helper)
src/
  main.js                renders the shell and wires listeners
  state.js               single store + localStorage persistence
  data.js                VCL component catalog (props, events, palette categories)
  pascal.js              tokenizer + syntax highlighter
  compiler.js            lexer + parser + diagnostics for handler bodies
  runtime.js             minimal Pascal interpreter for running forms
  actions.js             state-mutating actions invoked by the UI
  render/                pure render functions (shell, designer, inspector, code, ...)
  wire/                  event wiring per surface (keyboard, palette, designer, ...)
  index.css, App.css     styles (linked directly from index.html)
public/                  static assets (favicon, icons)
```

Note: every JS file imports with an explicit `.js` extension and every CSS file is referenced via a `<link>` tag — never `import './foo.css'`. That's what keeps the source browser-runnable without a build.

## Getting started

Either path works.

**Just open it** — any static file server pointed at the repo root will do. Example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

**Or use Vite for dev ergonomics** (HMR, fast reload). Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
```

## Deployment

GitHub Pages serves the `main` branch directly from the repo root — every push publishes automatically. There is no build step and no GitHub Actions workflow in the deploy path.

What makes that work:

- `index.html` lives at the repo root and is the entry point Pages serves at `/`.
- All scripts are native ES modules (`<script type="module">`) and use relative imports with explicit `.js` extensions.
- All stylesheets are linked via `<link rel="stylesheet">`, not imported from JS.
- `CNAME` at the repo root tells Pages the custom domain.

One-time GitHub setup (Settings → Pages):

- **Source**: *Deploy from a branch* → `main` / `/ (root)`
- **Custom domain**: `delphi.test.shaunroselt.com`
- **Enforce HTTPS**: on

## Security

This is a public, static, single-origin app with no backend and no third-party scripts. What's in place:

- **Strict Content-Security-Policy** inline in `index.html`:
  - `default-src 'self'` — no third-party origins.
  - `script-src 'self'` — no inline scripts, no `eval`, no remote JS.
  - `style-src 'self' 'unsafe-inline'` — inline `style="..."` attributes are required for designer component positioning; no remote stylesheets.
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`, `manifest-src 'self'`.
- **Referrer-Policy** `strict-origin-when-cross-origin` via meta tag.
- **HTML escaping** for any user-controlled string rendered into the DOM (`escapeHtml` in `util.js`, used consistently across `render/` and diagnostic output). The Pascal highlighter tokenises before emitting HTML so it cannot be tricked by a user-supplied `class="..."` substring.
- **No `eval`, no `Function(...)`** in the runtime — the Pascal interpreter walks tokens, it does not generate JavaScript.
- **HTTPS** enforced by GitHub Pages on the custom domain.
- **No secrets** in the repo. The app has no API keys, no auth, no PII; all user state lives in `localStorage` on the visitor's own device.

What GitHub Pages can't enforce (header-only directives) and would need a CDN/reverse proxy in front of Pages to add:

- `X-Frame-Options` / CSP `frame-ancestors` (clickjacking — low impact here since there are no auth-gated, state-changing actions)
- `Strict-Transport-Security` (HSTS — Pages already redirects HTTP → HTTPS)
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`

If those become important, put the site behind Cloudflare (or similar) and add a response-header rule there.

## Status

Prototype. Faithful to the RAD Studio 13 look-and-feel for the supported component set; the compiler and runtime cover a deliberate subset of Object Pascal, not the full language.
