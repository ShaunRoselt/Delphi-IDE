const STORAGE_KEY = 'delphi-ide-state-v2'

export function defaultState() {
  return {
    activeTabId: 'welcome',
    openTabs: [
      { id: 'welcome', kind: 'welcome', title: 'Welcome Page', formId: null },
      { id: 'form-1', kind: 'form', title: 'Unit1', formId: 'form1' },
    ],
    forms: {
      form1: {
        unitName: 'Unit1', name: 'Form1', className: 'TForm1',
        caption: 'Form1', width: 510, height: 315,
        color: 'clBtnFace', position: 'poDesigned', borderStyle: 'bsSizeable',
        components: [
          {
            id: 'Button1', type: 'TButton',
            left: 17, top: 39, width: 95, height: 33,
            props: { Caption: 'Run', Enabled: true, Visible: true, Default: false, Cancel: false, TabOrder: 0 },
            events: { OnClick: 'Button1Click' },
          },
          {
            id: 'Memo1', type: 'TMemo',
            left: 17, top: 90, width: 360, height: 153,
            props: { Lines: ['Memo1'], ReadOnly: false, ScrollBars: 'ssVertical', WordWrap: true },
            events: {},
          },
        ],
        code: null,
      },
    },
    designerView: 'design',
    selection: ['Form1'],
    inspector: { tab: 'properties', filter: '' },
    paletteSelected: null,
    paletteFilter: '',
    paletteOpen: { Standard: true, Additional: false, Win32: false, System: false, Dialogs: false },
    menuOpen: null,
    statusMessage: 'CodeInsight: Done',
    modified: false,
    platform: 'Windows 64-bit',
    config: 'Debug',
    layout: 'Default Layout',
    showGrid: true,
    snapToGrid: true,
    gridSize: 8,
    layoutSizes: {
      leftDock: 279,
      rightDock: 297,
      leftTop: 376,
      rightTop: 486,
    },
    clipboard: null,
    runDialog: null,
    running: null,
    diagnostics: [],
    quickEditOpen: false,
    contextMenu: null,
    cursorPos: { line: 1, col: 1 },
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    parsed.menuOpen = null
    parsed.runDialog = null
    parsed.running = null
    parsed.diagnostics = []
    parsed.quickEditOpen = false
    parsed.contextMenu = null
    parsed.layoutSizes ||= defaultState().layoutSizes
    return parsed
  } catch {
    return null
  }
}

export const state = loadState() || defaultState()

export function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function activeTab() {
  return state.openTabs.find((t) => t.id === state.activeTabId)
}

export function activeForm() {
  const tab = activeTab()
  if (tab && tab.formId) return state.forms[tab.formId]
  const firstForm = state.openTabs.find((t) => t.kind === 'form')
  return firstForm ? state.forms[firstForm.formId] : null
}

export function getSelected() {
  const f = activeForm()
  if (!f) return null
  if (state.selection.length === 0) return f
  if (state.selection.length === 1 && state.selection[0] === f.name) return f
  return f.components.find((c) => c.id === state.selection[0]) || f
}

export function isFormSelected() {
  const f = activeForm()
  return f && (state.selection.length === 0 || (state.selection.length === 1 && state.selection[0] === f.name))
}

export function setSelection(ids, additive = false) {
  if (additive) {
    const set = new Set(state.selection)
    for (const id of ids) (set.has(id) ? set.delete(id) : set.add(id))
    state.selection = [...set]
  } else {
    state.selection = ids
  }
  const f = activeForm()
  if (state.selection.length === 0 && f) state.selection = [f.name]
}

export function snap(v) {
  return state.snapToGrid ? Math.round(v / state.gridSize) * state.gridSize : Math.round(v)
}
