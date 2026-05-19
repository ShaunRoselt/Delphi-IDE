import { state, activeForm } from '../state.js'
import { MENU_DEFS, MENU_DISABLED_NO_PROJECT, PLATFORMS, CONFIGURATIONS, LAYOUTS, NEW_SUBMENU } from '../data.js'
import { escapeHtml, iconButton } from '../util.js'

export function renderTitleBar() {
  const f = activeForm()
  const projectName = state.project?.name || 'Project1'
  const title = f
    ? `${projectName} - ${f.unitName}.pas - ${f.className} - RAD Studio 12 Web Prototype${state.modified ? ' *' : ''}`
    : `${projectName} - RAD Studio 12 Web Prototype`
  return `
    <header class="titlebar">
      <div class="app-badge">RAD</div>
      <div class="window-title">${escapeHtml(title)}</div>
      <div class="ide-search-container">
        <input id="ide-search-input" type="text" aria-label="IDE search" placeholder="Search the IDE..." value="${escapeHtml(state.searchQuery)}" autocomplete="off" />
        ${state.searchOpen && state.searchResults.length > 0 ? `
          <div class="ide-search-popup">
            ${state.searchResults.map((res, i) => `
              <div class="search-result-item ${i === state.searchSelectedIndex ? 'selected' : ''}" data-search-index="${i}">
                <span class="search-cat">${escapeHtml(res.category)}</span>
                <span class="search-lbl">${escapeHtml(res.label)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
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

const ic = (g, bg, fg = '#e0eef8') =>
  `<i style="background:${bg};color:${fg}">${g}</i>`

const MENU_ICONS = {
  // File
  New: ic('◻', '#3a6e92'),
  'Open...': ic('▤', '#3a6e92'),
  'Open Project...': ic('▤', '#3a6e92'),
  'Open From Version Control...': ic('⎘', '#3a6080'),
  'Open Recent': ic('⏱', '#3a5e7a'),
  'Open Favorite': ic('♥', '#7a3a5a'),
  Save: ic('▣', '#2a5e9a'),
  'Save As...': ic('▣', '#2a5e9a'),
  'Save Project As...': ic('▣', '#2a5e9a'),
  'Save All': ic('▤', '#2a5e9a'),
  Close: ic('✕', '#8c2020', '#ffb0b0'),
  'Close All': ic('✕', '#8c2020', '#ffb0b0'),
  'Use Unit...': ic('⊞', '#3a6080'),
  'Print...': ic('⎙', '#4a6a7a'),
  Exit: ic('⎋', '#4a5a6a'),
  // Edit
  Undo: ic('↶', '#2a6a7a'),
  Redo: ic('↷', '#2a6a7a'),
  Cut: ic('✂', '#4a5a6a'),
  Copy: ic('⧉', '#3a6080'),
  Paste: ic('⧈', '#3a6080'),
  MultiPaste: ic('⧈', '#3a5a70'),
  Delete: ic('✕', '#7a2828', '#ffb0b0'),
  'Select All': ic('▦', '#4a5a6a'),
  Compare: ic('⧸', '#4a5a6a'),
  'Align to Grid': ic('⊟', '#4a5a6a'),
  'Bring to Front': ic('▲', '#4a5e7a'),
  'Send to Back': ic('▼', '#4a5e7a'),
  'Show Non-Visual Components': ic('◎', '#4a5a6a'),
  // Search
  'Find...': ic('⌕', '#2a5e90'),
  'Find in Files...': ic('⌕', '#2a5e90'),
  'Replace...': ic('⌕', '#2a5a80'),
  'Search Again': ic('⌕', '#2a5a80'),
  'Incremental Search': ic('⌕', '#2a5070'),
  'IDE Insight...': ic('⌕', '#3a5a7a'),
  'Go to Definition': ic('▶', '#3a5e7a'),
  'Go to Implementation': ic('▶', '#3a5e7a'),
  'Go to Line Number...': ic('↓', '#3a5060'),
  'Go to Address': ic('↓', '#3a5060'),
  // View
  'Debug Windows': ic('⊞', '#3a5a7a'),
  'Tool Windows': ic('⊟', '#3a5a7a'),
  'Welcome Page': ic('⌂', '#2a5e90'),
  'Configuration Manager': ic('⚙', '#4a5a6a'),
  // Run
  Run: ic('▶', '#1e6e32', '#80ff90'),
  'Run Without Debugging': ic('▷', '#2a6e3a', '#b0ffb8'),
  'Step Over': ic('⤵', '#2a5e78'),
  'Trace Into': ic('↳', '#2a5e78'),
  'Trace to Next Source Line': ic('↓', '#2a5e78'),
  'Run to Cursor': ic('▷', '#2a6040'),
  'Run Until Return': ic('↑', '#2a5e78'),
  'Program Pause': ic('⏸', '#7a5e10', '#ffe090'),
  'Program Reset': ic('■', '#8a1c1c', '#ffb0b0'),
  'Show Execution Point': ic('▶', '#2a6040'),
  'Inspect...': ic('⌕', '#3a5e7a'),
  'Evaluate/Modify...': ic('⌕', '#3a5e7a'),
  'Add Watch...': ic('⊕', '#2a5e7a'),
  'Add Breakpoint': ic('⊕', '#8a1c1c', '#ffb0b0'),
  'Load Process...': ic('▤', '#3a5a70'),
  'Attach to Process...': ic('⊞', '#3a5a70'),
  // Project
  'Add to Project...': ic('⊞', '#2a5e80'),
  'Remove from Project...': ic('✕', '#7a2828', '#ffb0b0'),
  'Add to Repository...': ic('⊞', '#2a5e80'),
  'Add New Project...': ic('⊞', '#2a5e80'),
  'Add Existing Project...': ic('▤', '#2a5e80'),
  Compile: ic('⚒', '#4e5e28'),
  Build: ic('⚒', '#485828'),
  'Build All Projects': ic('⚒', '#485828'),
  'Compile All Projects': ic('⚒', '#485828'),
  Deploy: ic('⬆', '#2a5e90'),
  'Options...': ic('⚙', '#3a5060'),
  // Component
  'New Component...': ic('⊞', '#2a5e80'),
  'Install Component...': ic('⬇', '#2a5e80'),
  'Create Component Template...': ic('◻', '#3a5060'),
  'Install Packages...': ic('⬇', '#2a5e80'),
  'Import Component...': ic('⬇', '#3a5070'),
  'Import WSDL...': ic('⬇', '#3a5070'),
  // Tools
  'Configure Tools...': ic('⚙', '#3a5060'),
  'Build Tools...': ic('⚙', '#3a5060'),
  'Manage Features...': ic('⚙', '#3a5060'),
  'Template Libraries...': ic('▤', '#3a5060'),
  'GetIt Package Manager...': ic('⬇', '#2a5e80'),
  'Reload LSP Server': ic('↺', '#3a5e70'),
  'Bitmap Style Designer': ic('◈', '#3a5060'),
  'FireDAC Explorer': ic('◎', '#2a5e80'),
  'FireDAC Monitor': ic('◎', '#2a5e80'),
  'REST Debugger': ic('◎', '#2a5e80'),
  'RAD Server Console': ic('⊟', '#3a5060'),
  // Tabs
  'Next Tab': ic('▶', '#2a5070'),
  'Previous Tab': ic('◀', '#2a5070'),
  // Help
  'RAD Studio Help': ic('?', '#1a5080', '#90d0ff'),
  'RAD Studio Docwiki': ic('◎', '#2a5e90'),
  'Embarcadero Home Page': ic('⌂', '#2a5e90'),
  'Embarcadero Developer Support Page': ic('⌂', '#2a5e90'),
  'Embarcadero Community Site': ic('⌂', '#2a5e90'),
  'Delphi Home Page': ic('⌂', '#2a5e90'),
  'Embarcadero Blogs': ic('◎', '#2a5e90'),
  'License Manager...': ic('⚿', '#3a5060'),
  'Welcome Configuration': ic('⚙', '#3a5060'),
  'About Embarcadero® Delphi': ic('ℹ', '#1a5080', '#90d0ff'),
}

// Icons for the New ▶ submenu items
const NEW_SUBMENU_ICONS = {
  'Windows VCL Application - Delphi': ic('▣', '#1e5fa0'),
  'Multi-Device Application - Delphi': ic('⊞', '#1a6e78'),
  'Package - Delphi': ic('⬡', '#5a3a80'),
  'Console Application - Delphi': ic('⌨', '#2a4e30'),
  'Dynamic Library - Delphi': ic('⚙', '#5a4a1a'),
  'VCL Form - Delphi': ic('◻', '#1e5fa0'),
  'VCL Frame - Delphi': ic('▣', '#1e5fa0'),
  'Data Module - Delphi': ic('⊟', '#2a4e6a'),
  'FireMonkey Frame - Delphi': ic('◈', '#8c2060'),
  'Multi-Device Form - Delphi': ic('⊞', '#1a6e78'),
  'Unit - Delphi': ic('◻', '#2a5e6a'),
  'Other...': ic('…', '#4a5a6a'),
  'Customize...': ic('⚙', '#3a5060'),
}

function renderNewSubMenu() {
  return `<div class="menu-popup menu-sub-popup">${NEW_SUBMENU.map((entry) => {
    if (entry === '-') return '<div class="menu-sep"></div>'
    const iconHtml = NEW_SUBMENU_ICONS[entry] || ''
    return `<button type="button" data-submenu-action="${escapeHtml(entry)}"><span class="menu-icon">${iconHtml}</span><span class="menu-lbl">${escapeHtml(entry)}</span></button>`
  }).join('')}</div>`
}

export function renderMenubar() {
  const hasProject = state.openTabs.some((t) => t.kind === 'form')
  const items = Object.keys(MENU_DEFS).map((name) => {
    const open = state.menuOpen === name
    const disabledSet = hasProject ? null : MENU_DISABLED_NO_PROJECT[name]
    const submenu = open
      ? `<div class="menu-popup">${MENU_DEFS[name].map((entry) => {
          if (entry === '-') return '<div class="menu-sep"></div>'
          const [lbl, sc] = entry.split('|').map((s) => s.trim())
          const isSub = lbl.endsWith(' ►') || lbl.endsWith(' ▶')
          const cleanLbl = isSub ? lbl.slice(0, lbl.lastIndexOf(' ')).trimEnd() : lbl
          if (cleanLbl.startsWith('(') && cleanLbl.endsWith(')')) {
            return `<div class="menu-info">${escapeHtml(cleanLbl)}</div>`
          }
          const dis = disabledSet?.has(cleanLbl) ? ' disabled' : ''
          const iconHtml = MENU_ICONS[cleanLbl] || ''

          // Special case: "New" triggers a nested submenu
          if (isSub && cleanLbl === 'New') {
            const subOpen = state.subMenuOpen === 'New'
            const subHtml = subOpen ? renderNewSubMenu() : ''
            return `<div class="menu-sub-item${subOpen ? ' sub-open' : ''}" data-submenu-trigger="New"><button type="button" data-submenu="New"${dis}><span class="menu-icon">${iconHtml}</span><span class="menu-lbl">${escapeHtml(cleanLbl)}</span><span class="menu-arrow">&#9658;</span></button>${subHtml}</div>`
          }

          const right = isSub
            ? '<span class="menu-arrow">&#9658;</span>'
            : (sc ? `<kbd>${escapeHtml(sc)}</kbd>` : '')
          return `<button type="button" data-menu-action="${escapeHtml(cleanLbl)}"${dis}><span class="menu-icon">${iconHtml}</span><span class="menu-lbl">${escapeHtml(cleanLbl)}</span>${right}</button>`
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
  return `<div class="document-tabs">${state.openTabs.map((t) => `<button class="${state.activeTabId === t.id ? 'active' : ''} ${t.kind}-tab" data-tab="${t.id}">${escapeHtml(t.title)}<span class="tab-close" data-close-tab="${t.id}" title="Close">×</span></button>`).join('')}<button class="add-tab" title="New form" data-action="newform">+</button></div>`
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
