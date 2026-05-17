import { state, activeForm, isFormSelected, persistState } from '../state.js'
import {
  deleteSelection, copySelection, pasteClipboard, runProgram,
} from '../actions.js'
import { renderApp } from '../main.js'

function nudgeSelection(e) {
  const f = activeForm()
  if (!f || isFormSelected()) return false
  const step = e.shiftKey ? state.gridSize : 1
  const moving = f.components.filter((c) => state.selection.includes(c.id))
  if (!moving.length) return false
  for (const c of moving) {
    if (e.key === 'ArrowLeft') c.left = Math.max(0, c.left - step)
    if (e.key === 'ArrowRight') c.left += step
    if (e.key === 'ArrowUp') c.top = Math.max(0, c.top - step)
    if (e.key === 'ArrowDown') c.top += step
  }
  state.modified = true
  return true
}

function isFormField(target) {
  return target.matches('input, textarea, select, [contenteditable]')
}

document.addEventListener('keydown', (e) => {
  // Inside text fields, only Escape (cancel palette drop) is intercepted.
  if (isFormField(e.target)) {
    if (e.key === 'Escape' && state.paletteSelected) {
      state.paletteSelected = null
      renderApp()
    }
    return
  }

  const k = e.key.toLowerCase()

  if (e.key === 'Escape') {
    state.paletteSelected = null
    state.menuOpen = null
    renderApp()
    return
  }

  if (e.key === 'Delete') {
    deleteSelection(); renderApp()
    e.preventDefault(); return
  }

  if (e.key === 'F12') {
    state.designerView = state.designerView === 'design' ? 'code' : 'design'
    renderApp()
    e.preventDefault(); return
  }

  if (e.key === 'F9' && !e.shiftKey) {
    runProgram()
    e.preventDefault(); return
  }

  if (e.ctrlKey || e.metaKey) {
    switch (k) {
      case 's':
        persistState()
        state.modified = false
        state.statusMessage = 'All files saved'
        renderApp()
        e.preventDefault(); return
      case 'c': copySelection(); renderApp(); e.preventDefault(); return
      case 'v': pasteClipboard(); renderApp(); e.preventDefault(); return
      case 'x': copySelection(); deleteSelection(); renderApp(); e.preventDefault(); return
      case 'a': {
        const f = activeForm()
        if (f) {
          state.selection = f.components.length ? f.components.map((c) => c.id) : [f.name]
          renderApp()
          e.preventDefault()
        }
        return
      }
    }
  }

  if (e.key.startsWith('Arrow') && nudgeSelection(e)) {
    renderApp()
    e.preventDefault()
  }
})
