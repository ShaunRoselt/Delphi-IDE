# Delphi-IDE

A browser-based UI prototype of Embarcadero RAD Studio 13 / Delphi. Lays out a form visually, edits the generated Object Pascal source, and runs simple event handlers — all client-side, no install, no backend.

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

Vanilla JavaScript ESM, no framework. Vite for dev/build. ESLint flat config. Rendering is plain template strings (`render/*.js`) wired up after each render (`wire/*.js`); state lives in a single store (`state.js`) that re-renders the shell on change.

## Project layout

```
index.html               entry point — Vite mounts /src/main.js into #root
vite.config.js           build config + production CSP injector
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
  index.css, App.css     styles
public/                  static assets copied verbatim into dist/ (favicon, icons, CNAME)
.github/workflows/       CI — auto-builds and deploys to GitHub Pages on push to main
```

## Getting started

Requires Node 18+.

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run lint       # eslint
```

Open the dev server URL Vite prints (default `http://localhost:5173`).

## Deployment

Every push to `main` is built and published to [delphi.test.shaunroselt.com](https://delphi.test.shaunroselt.com) automatically by `.github/workflows/deploy.yml`:

1. Checkout
2. `npm ci` → `npm run lint` → `npm run build`
3. Upload `dist/` as a Pages artifact
4. `actions/deploy-pages` publishes it

One-time GitHub setup (Settings → Pages):

- **Source**: *GitHub Actions* (not "Deploy from a branch")
- **Custom domain**: `delphi.test.shaunroselt.com` (Vite copies `public/CNAME` into `dist/` on every build, so this stays in sync)
- **Enforce HTTPS**: on

To deploy manually, run the workflow from the Actions tab (`workflow_dispatch`).

## Security

This is a public, static, single-origin app with no backend and no third-party scripts. The threat surface is small, but the public exposure deserves attention. What's in place:

- **Strict Content-Security-Policy** injected at build time (`vite.config.js`):
  - `default-src 'self'` — no third-party origins.
  - `script-src 'self'` — no inline scripts, no `eval`, no remote JS.
  - `style-src 'self' 'unsafe-inline'` — inline styles are required for designer component positioning; no remote stylesheets.
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`, `manifest-src 'self'`.
- **Referrer-Policy** `strict-origin-when-cross-origin` via meta tag.
- **HTML escaping** for any user-controlled string rendered into the DOM (`escapeHtml` in `util.js`, used consistently across `render/` and diagnostic output). The Pascal highlighter tokenises before emitting HTML so it cannot be tricked by a user-supplied `class="..."` substring.
- **No `eval`, no `Function(...)`** in the runtime — the Pascal interpreter walks tokens, it does not generate JavaScript.
- **HTTPS** enforced by GitHub Pages on the custom domain.
- **CI guardrail** — the deploy workflow runs `npm run lint` and fails the build on lint errors, so syntactically broken code can't reach production.
- **No secrets** in the repo. The app has no API keys, no auth, no PII; all user state lives in `localStorage` on the visitor's own device.

What GitHub Pages can't enforce (header-only directives) and would need a CDN/reverse proxy in front of Pages to add:

- `X-Frame-Options` / CSP `frame-ancestors` (clickjacking — low impact here since there are no auth-gated, state-changing actions)
- `Strict-Transport-Security` (HSTS — Pages already redirects HTTP → HTTPS)
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`

If those become important, put the site behind Cloudflare (or similar) and add a Transform Rule / response-header rule there.

## Status

Prototype. Faithful to the RAD Studio 13 look-and-feel for the supported component set; the compiler and runtime cover a deliberate subset of Object Pascal, not the full language.
