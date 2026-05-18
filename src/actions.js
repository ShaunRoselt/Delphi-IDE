import {
  state, activeForm, activeTab, isFormSelected, persistState, snap,
  saveProjectSnapshot,
} from './state.js'
import { COMPONENT_DEFS, COMMON_PROPS, DEFAULT_EVENT } from './data.js'
import { renderApp } from './main.js'
import { startProgram, stopProgram } from './runtime.js'
import { generatePascal } from './pascal.js'
import { compilePascal } from './compiler.js'

export function uniqueComponentName(form, type) {
  const def = COMPONENT_DEFS[type]
  const base = def?.prefix || type.replace(/^T/, '')
  let n = 1
  while (form.components.some((c) => c.id === `${base}${n}`)) n++
  return `${base}${n}`
}

export function addComponent(form, type, x, y) {
  const def = COMPONENT_DEFS[type]
  if (!def) return null
  const id = uniqueComponentName(form, type)
  const props = {}
  const list = COMMON_PROPS[type] || []
  for (const [pname, ptype, pdef] of list) {
    if (pdef !== undefined) { props[pname] = pdef; continue }
    if (ptype === 'string') props[pname] = ''
    else if (ptype === 'bool') props[pname] = false
    else if (ptype === 'int') props[pname] = 0
    else if (ptype === 'strings') props[pname] = []
    else props[pname] = ''
  }
  if (props.Caption !== undefined && props.Caption === '') props.Caption = id
  if (props.Text !== undefined && props.Text === '') props.Text = id
  if (type === 'TMemo') props.Lines = [id]

  const comp = {
    id, type,
    left: snap(x ?? 24), top: snap(y ?? 24),
    width: def.w, height: def.h,
    props, events: {},
  }
  form.components.push(comp)
  state.selection = [id]
  state.modified = true
  return comp
}

export function deleteSelection() {
  const f = activeForm()
  if (!f || isFormSelected()) return
  f.components = f.components.filter((c) => !state.selection.includes(c.id))
  state.selection = [f.name]
  state.modified = true
}

export function copySelection() {
  const f = activeForm()
  if (!f || isFormSelected()) return
  const items = f.components.filter((c) => state.selection.includes(c.id))
  if (!items.length) return
  state.clipboard = JSON.parse(JSON.stringify(items))
  state.statusMessage = `${items.length} component(s) copied`
}

function injectHandlerStub(code, form, handlerName) {
  if (code.includes(`.${handlerName}(`)) return code
  const stub = `\nprocedure ${form.className}.${handlerName}(Sender: TObject);\nbegin\n  { TODO: ${handlerName} body }\nend;\n`
  return /\nend\.\s*$/.test(code)
    ? code.replace(/\nend\.\s*$/, `${stub}\nend.\n`)
    : code + stub
}

export function createHandlerForComponent(comp, form) {
  const evName = DEFAULT_EVENT[comp.type] || 'OnClick'
  const handlerName = `${comp.id}${evName.replace(/^On/, '')}`
  comp.events ||= {}
  if (!comp.events[evName]) {
    comp.events[evName] = handlerName
    // Preserve any user edits — splice a stub into the existing source.
    // If `form.code` is null we don't touch it: the next render generates
    // fresh source that already includes the new procedure.
    if (form.code) form.code = injectHandlerStub(form.code, form, handlerName)
    state.modified = true
  }
  return handlerName
}

export function pasteClipboard() {
  const f = activeForm()
  if (!f || !state.clipboard || state.clipboard.length === 0) return
  const newIds = []
  for (const item of state.clipboard) {
    const fresh = JSON.parse(JSON.stringify(item))
    fresh.id = uniqueComponentName(f, fresh.type)
    if (fresh.props?.Caption !== undefined && typeof fresh.props.Caption === 'string') {
      fresh.props.Caption = fresh.id
    }
    fresh.left += 16; fresh.top += 16
    fresh.events = {}
    f.components.push(fresh)
    newIds.push(fresh.id)
  }
  state.selection = newIds
  state.modified = true
}

export function bringSelectionToFront() {
  const f = activeForm()
  if (!f || isFormSelected()) return
  const selected = []
  const rest = []
  for (const c of f.components) {
    if (state.selection.includes(c.id)) selected.push(c)
    else rest.push(c)
  }
  f.components = [...rest, ...selected]
  state.modified = true
}

export function sendSelectionToBack() {
  const f = activeForm()
  if (!f || isFormSelected()) return
  const selected = []
  const rest = []
  for (const c of f.components) {
    if (state.selection.includes(c.id)) selected.push(c)
    else rest.push(c)
  }
  f.components = [...selected, ...rest]
  state.modified = true
}

export function newForm() {
  const ids = Object.keys(state.forms).map((k) => Number(k.replace('form', ''))).filter(Number.isFinite)
  const next = (ids.length ? Math.max(...ids) : 0) + 1
  const id = `form${next}`
  state.forms[id] = {
    unitName: `Unit${next}`, name: `Form${next}`, className: `TForm${next}`,
    caption: `Form${next}`, width: 510, height: 315,
    color: 'clBtnFace', position: 'poDesigned', borderStyle: 'bsSizeable',
    components: [], code: null,
  }
  const tabId = `form-${next}`
  state.openTabs.push({ id: tabId, kind: 'form', title: `Unit${next}`, formId: id })
  state.activeTabId = tabId
  state.selection = [state.forms[id].name]
  state.designerView = 'design'
  state.modified = true
}

export function closeTab(id) {
  const idx = state.openTabs.findIndex((t) => t.id === id)
  if (idx === -1) return
  state.openTabs.splice(idx, 1)
  if (state.openTabs.length === 0) {
    state.openTabs.push({ id: 'welcome', kind: 'welcome', title: 'Welcome Page', formId: null })
    state.activeTabId = 'welcome'
    return
  }
  if (state.activeTabId === id) {
    state.activeTabId = state.openTabs[Math.max(0, idx - 1)]?.id || state.openTabs[0].id
  }
}

export function openWelcomeTab() {
  if (!state.openTabs.find((t) => t.id === 'welcome')) {
    state.openTabs.unshift({ id: 'welcome', kind: 'welcome', title: 'Welcome Page', formId: null })
  }
  state.activeTabId = 'welcome'
}

function saveProject() {
  state.project ||= { name: 'Project1' }
  if (saveProjectSnapshot(state.project.name)) {
    persistState()
    state.modified = false
    state.statusMessage = `Project "${state.project.name}" saved`
  } else {
    state.statusMessage = 'Save failed'
  }
}

function saveActiveUnitAs() {
  const tab = activeTab()
  if (!tab || tab.kind !== 'form') {
    state.statusMessage = 'No unit to save'
    return
  }
  const f = state.forms[tab.formId]
  if (!f) return
  const next = prompt('Save unit as:', f.unitName)
  if (!next) return
  const trimmed = next.trim().replace(/\.pas$/i, '')
  if (!trimmed) return
  f.unitName = trimmed
  tab.title = trimmed
  saveProject()
}

function saveProjectAs() {
  state.project ||= { name: 'Project1' }
  const next = prompt('Save project as:', state.project.name)
  if (!next) return
  const trimmed = next.trim().replace(/\.dproj$/i, '')
  if (!trimmed) return
  state.project.name = trimmed
  saveProject()
}

export function selectTab(id) {
  state.activeTabId = id
  const tab = state.openTabs.find((t) => t.id === id)
  if (tab?.kind === 'form') {
    const f = state.forms[tab.formId]
    if (f) state.selection = [f.name]
  }
}

export function runProgram() {
  if (!compileActiveForm()) {
    renderApp()
    return
  }
  // Short compile/link splash, then hand off to the runtime interpreter.
  state.runDialog = { phase: 'compile', step: 0 }
  renderApp()
  const tick = () => {
    if (!state.runDialog) return
    state.runDialog.step++
    if (state.runDialog.step === 2) state.runDialog.phase = 'link'
    if (state.runDialog.step >= 3) {
      state.runDialog = null
      startProgram()
      renderApp()
      return
    }
    renderApp()
    setTimeout(tick, 220)
  }
  setTimeout(tick, 220)
}

export function compileActiveForm() {
  const f = activeForm()
  if (!f) return false
  const result = compilePascal(f, generatePascal(f))
  state.diagnostics = result.diagnostics
  const errors = result.diagnostics.filter((d) => d.severity === 'error').length
  const warnings = result.diagnostics.length - errors
  if (errors) {
    state.statusMessage = `[dcc32 Error] ${errors} error(s), ${warnings} warning(s)`
    state.designerView = 'code'
    return false
  }
  state.statusMessage = warnings
    ? `[dcc32 Warning] Build succeeded with ${warnings} warning(s)`
    : 'Build succeeded'
  return true
}

export function executeMenu(label) {
  state.menuOpen = null
  const clean = label.split('|')[0].trim().replace(/\.\.\.$/, '').replace(/ ▶$/, '')
  switch (clean) {
    case 'New': newForm(); break
    case 'Open Project':
    case 'Open File': state.statusMessage = 'Open dialog (stub)'; break
    case 'Save':
    case 'Save All':
      saveProject()
      break
    case 'Save As':
      saveActiveUnitAs()
      break
    case 'Save Project As':
      saveProjectAs()
      break
    case 'Close': closeTab(state.activeTabId); break
    case 'Close All':
      state.openTabs = [{ id: 'welcome', kind: 'welcome', title: 'Welcome Page', formId: null }]
      state.activeTabId = 'welcome'
      break
    case 'Exit': persistState(); state.statusMessage = 'Use the tab × to close'; break
    case 'Cut': copySelection(); deleteSelection(); break
    case 'Copy': copySelection(); break
    case 'Paste': pasteClipboard(); break
    case 'Delete': deleteSelection(); break
    case 'Select All': {
      const f = activeForm()
      if (f) state.selection = f.components.length ? f.components.map((c) => c.id) : [f.name]
      break
    }
    case 'Toggle Form/Unit':
      state.designerView = state.designerView === 'design' ? 'code' : 'design'
      break
    case 'Build':
    case 'Compile':
    case 'Build All Projects':
      compileActiveForm()
      break
    case 'Run':
    case 'Run Without Debugging': runProgram(); return false
    case 'Program Reset':
      state.runDialog = null
      stopProgram()
      state.statusMessage = 'Program reset'
      break
    case 'Step Over':
    case 'Trace Into':
    case 'Run to Cursor': state.statusMessage = `Debug: ${clean}`; break
    case 'Welcome Page': openWelcomeTab(); break
    case 'About Embarcadero RAD Studio':
      alert('RAD Studio 12 Athens (Web Prototype)\nVCL Form Designer · Object Inspector · Pascal Editor')
      return false
    default: state.statusMessage = clean
  }
  return true
}

export function applyProp(selected, isForm, name, raw) {
  const f = activeForm()
  const isBool = raw === 'True' || raw === 'False'
  const value = isBool ? raw === 'True' : (/^-?\d+$/.test(raw) ? Number(raw) : raw)

  if (isForm) {
    if (name === 'Name') {
      const old = f.name
      f.name = raw
      f.className = `T${raw}`
      state.selection = state.selection.map((s) => (s === old ? raw : s))
      return
    }
    if (name === 'Caption') { f.caption = raw; return }
    if (name === 'ClientWidth') { f.width = Number(raw) || f.width; return }
    if (name === 'ClientHeight') { f.height = Number(raw) || f.height; return }
    if (name === 'BorderStyle') { f.borderStyle = raw; return }
    if (name === 'Position') { f.position = raw; return }
    if (name === 'Color') { f.color = raw; return }
    return
  }

  if (name === 'Name') {
    const old = selected.id
    selected.id = raw
    state.selection = state.selection.map((s) => (s === old ? raw : s))
    return
  }
  if (name === 'Left') { selected.left = Number(raw) || 0; return }
  if (name === 'Top') { selected.top = Number(raw) || 0; return }
  if (name === 'Width') { selected.width = Number(raw) || selected.width; return }
  if (name === 'Height') { selected.height = Number(raw) || selected.height; return }
  if (name === 'Lines' || name === 'Items' || name === 'Tabs') {
    selected.props[name] = raw.split('|').map((s) => s.trim()).filter(Boolean)
    return
  }
  selected.props[name] = value
}
