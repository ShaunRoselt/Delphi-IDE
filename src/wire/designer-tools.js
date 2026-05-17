import { state, activeForm, getSelected, setSelection } from '../state.js'
import {
  applyProp, bringSelectionToFront, copySelection, deleteSelection,
  pasteClipboard, sendSelectionToBack,
} from '../actions.js'
import { renderApp } from '../main.js'
import { resetLayoutSizes } from './layout.js'

function closeContextMenu() {
  if (!state.contextMenu) return false
  state.contextMenu = null
  return true
}

function openQuickEdit() {
  closeContextMenu()
  state.quickEditOpen = true
  renderApp()
}

function closeQuickEdit() {
  state.quickEditOpen = false
  renderApp()
}

function chooseContextSelection(event) {
  const form = activeForm()
  if (!form) return
  const componentEl = event.target.closest('[data-component]')
  if (componentEl) {
    const id = componentEl.dataset.component
    if (!state.selection.includes(id)) setSelection([id])
    return
  }
  if (event.target.closest('[data-design-canvas], .selected-form-shell')) {
    setSelection([form.name])
  }
}

function runContextAction(action) {
  const form = activeForm()
  switch (action) {
    case 'quick-edit': openQuickEdit(); return
    case 'view-code': state.designerView = 'code'; break
    case 'cut': copySelection(); deleteSelection(); break
    case 'copy': copySelection(); break
    case 'paste': pasteClipboard(); break
    case 'delete': deleteSelection(); break
    case 'bring-front': bringSelectionToFront(); break
    case 'send-back': sendSelectionToBack(); break
    case 'select-all':
      if (form) state.selection = form.components.length ? form.components.map((c) => c.id) : [form.name]
      break
    case 'toggle-grid': state.showGrid = !state.showGrid; break
    case 'toggle-snap': state.snapToGrid = !state.snapToGrid; break
    case 'reset-layout': resetLayoutSizes(); state.statusMessage = 'Layout reset'; break
    default: break
  }
  closeContextMenu()
  renderApp()
}

function submitQuickEdit(formEl) {
  const form = activeForm()
  const selected = getSelected()
  if (!form || !selected) return
  const isForm = selected === form
  const data = new FormData(formEl)
  for (const [name, value] of data.entries()) {
    applyProp(selected, isForm, name, String(value))
  }
  state.quickEditOpen = false
  state.modified = true
  state.statusMessage = `Updated ${isForm ? form.name : selected.id}`
  renderApp()
}

export function wireDesignerTools() {
  document.querySelectorAll('[data-action="quick-edit"]').forEach((button) => {
    button.addEventListener('click', openQuickEdit)
  })

  document.querySelectorAll('[data-action="bind-visually"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.statusMessage = 'Visual LiveBindings designer (stub)'
      renderApp()
    })
  })

  document.querySelectorAll('[data-action="quick-edit-close"]').forEach((button) => {
    button.addEventListener('click', closeQuickEdit)
  })

  document.querySelector('[data-quick-edit-backdrop]')?.addEventListener('click', (event) => {
    if (event.target.matches('[data-quick-edit-backdrop]')) closeQuickEdit()
  })

  document.querySelector('[data-quick-edit-form]')?.addEventListener('submit', (event) => {
    event.preventDefault()
    submitQuickEdit(event.currentTarget)
  })

  document.querySelector('.document-host')?.addEventListener('contextmenu', (event) => {
    if (!event.target.closest('.designer-page')) return
    event.preventDefault()
    chooseContextSelection(event)
    state.contextMenu = { x: event.clientX, y: event.clientY }
    renderApp()
  })

  document.querySelector('[data-designer-context-menu]')?.addEventListener('click', (event) => {
    const item = event.target.closest('[data-context-action]')
    if (!item || item.disabled) return
    runContextAction(item.dataset.contextAction)
  })

}

document.addEventListener('click', (event) => {
  if (!state.contextMenu || event.target.closest('[data-designer-context-menu]')) return
  closeContextMenu()
  renderApp()
})
