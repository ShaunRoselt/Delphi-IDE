# Delphi-IDE

A browser-based UI prototype of Embarcadero RAD Studio 12 / Delphi. Lays out a form visually, edits the generated Object Pascal source, and runs simple event handlers — all client-side, no install, no backend.

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
src/
  main.js              entry point — renders the shell and wires listeners
  state.js             single store + localStorage persistence
  data.js              VCL component catalog (props, events, palette categories)
  pascal.js            tokenizer + syntax highlighter
  compiler.js          lexer + parser + diagnostics for handler bodies
  runtime.js           minimal Pascal interpreter for running forms
  actions.js           state-mutating actions invoked by the UI
  render/              pure render functions (shell, designer, inspector, code, ...)
  wire/                event wiring per surface (keyboard, palette, designer, ...)
  index.css, App.css   styles
public/                static assets served as-is (favicon, icons)
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

Static site — the contents of `dist/` can be hosted anywhere. The included `CNAME` deploys to `delphi.test.shaunroselt.com` via GitHub Pages.

## Status

Prototype. Faithful to the RAD Studio 13 look-and-feel for the supported component set; the compiler and runtime cover a deliberate subset of Object Pascal, not the full language.
