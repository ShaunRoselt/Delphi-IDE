import { state, activeForm } from '../state.js'
import { MENU_DEFS, PLATFORMS, CONFIGURATIONS, LAYOUTS } from '../data.js'
import { escapeHtml, iconButton } from '../util.js'

export function renderTitleBar() {
  const f = activeForm()
  const title = f
    ? `${f.unitName}.pas - ${f.className} - RAD Studio 12 Web Prototype${state.modified ? ' *' : ''}`
    : 'RAD Studio 12 Web Prototype'
  return `
    <header class="titlebar">
      <div class="app-badge">RAD</div>
      <div class="window-title">${escapeHtml(title)}</div>
      <input aria-label="IDE search" placeholder="Search the IDE..." />
      <select aria-label="Layout" data-config-target="layout">
        ${LAYOUTS.map((l) => `<option ${l === state.layout ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <nav class="app-actions">
        <button type="button" data-action="newform">New Form</button>
        <button type="button" data-action="run">Run ▶</button>
        <button type="button" data-action="help">Help</button>
      </nav>
    </header>
  `
}

export function renderMenubar() {
  const items = Object.keys(MENU_DEFS).map((name) => {
    const open = state.menuOpen === name
    const submenu = open
      ? `<div class="menu-popup">${MENU_DEFS[name].map((entry) => {
          if (entry === '-') return '<div class="menu-sep"></div>'
          const [lbl, sc] = entry.split('|').map((s) => s.trim())
          return `<button type="button" data-menu-action="${escapeHtml(lbl)}"><span>${escapeHtml(lbl)}</span>${sc ? `<kbd>${escapeHtml(sc)}</kbd>` : ''}</button>`
        }).join('')}</div>`
      : ''
    return `<div class="menu-item ${open ? 'open' : ''}"><button type="button" data-menu="${name}">${name}</button>${submenu}</div>`
  }).join('')
  return `<nav class="menubar">${items}</nav>`
}

export function renderToolbar() {
  return `
    <section class="toolbar">
      <div class="tool-group">
        ${iconButton('New', '◰', 'menu:File:New')}
        ${iconButton('Open', '▰', 'menu:File:Open Project')}
        ${iconButton('Save', '▣', 'menu:File:Save')}
        ${iconButton('Save All', '▤', 'menu:File:Save All')}
        ${iconButton('Project', '▥', 'newform')}
      </div>
      <div class="tool-group">
        ${iconButton('Run', '▶', 'run')}
        ${iconButton('Debug', '◆', 'menu:Run:Step Over')}
        ${iconButton('Pause', 'Ⅱ', 'menu:Run:Step Over')}
        ${iconButton('Stop', '■', 'menu:Run:Program Reset')}
      </div>
      <div class="tool-group">
        ${iconButton('Undo', '↶', 'noop')}
        ${iconButton('Redo', '↷', 'noop')}
        ${iconButton('Search', '⌕', 'noop')}
      </div>
      <div class="tool-group">
        ${iconButton('Back', '◀', 'noop')}
        ${iconButton('Forward', '▶', 'noop')}
      </div>
      <div class="tool-group">
        ${iconButton('Reset Layout', '▦', 'reset-layout')}
      </div>
      <select data-config-target="platform" aria-label="Platform">
        ${PLATFORMS.map((p) => `<option ${p === state.platform ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
      <select data-config-target="config" aria-label="Configuration">
        ${CONFIGURATIONS.map((c) => `<option ${c === state.config ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      <label class="grid-toggle"><input type="checkbox" data-action="toggle-grid" ${state.showGrid ? 'checked' : ''}/> Grid</label>
      <label class="grid-toggle"><input type="checkbox" data-action="toggle-snap" ${state.snapToGrid ? 'checked' : ''}/> Snap</label>
    </section>
  `
}

export function renderDocumentTabs() {
  return `<div class="document-tabs">${state.openTabs.map((t) => `<button class="${state.activeTabId === t.id ? 'active' : ''} ${t.kind}-tab" data-tab="${t.id}">${escapeHtml(t.title)}${t.id !== 'welcome' ? `<span class="tab-close" data-close-tab="${t.id}" title="Close">×</span>` : ''}</button>`).join('')}<button class="add-tab" title="New form" data-action="newform">+</button></div>`
}

export function renderStatusBar() {
  const sel = state.selection.length === 1 ? state.selection[0] : `${state.selection.length} selected`
  return `
    <footer class="statusbar">
      <span class="status-msg">${escapeHtml(state.statusMessage)}</span>
      <span>${state.platform}</span>
      <span>${state.config}</span>
      <span>Sel: ${escapeHtml(sel)}</span>
      <span class="cursor-pos">${state.cursorPos.line}:${state.cursorPos.col}</span>
      <span>${state.modified ? 'Modified' : 'Saved'}</span>
    </footer>
  `
}

// Bottom-of-document switcher used by every form view (Design, Code, History).
export function renderViewSwitcher() {
  const tab = (view, label) =>
    `<button class="${state.designerView === view ? 'active' : ''}" data-designer-view="${view}">${label}</button>`
  return `<div class="designer-tabs">${tab('code', 'Code')}${tab('design', 'Design')}${tab('history', 'History')}</div>`
}

export function renderRunDialog() {
  if (!state.runDialog) return ''
  const phases = { compile: 'Compiling...', link: 'Linking...', running: 'Program running' }
  const pct = (state.runDialog.step / 7) * 100
  return `<div class="run-overlay"><div class="run-dialog"><h3>${phases[state.runDialog.phase]}</h3><div class="run-progress"><div class="run-bar" style="width:${pct}%"></div></div><p>${state.runDialog.phase === 'running' ? 'Press Stop to terminate.' : 'Building project Project1.exe...'}</p><button type="button" data-action="stop-run">Stop</button></div></div>`
}
