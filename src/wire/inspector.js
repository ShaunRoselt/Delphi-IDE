import { state, activeForm, getSelected, setSelection } from '../state.js'
import { applyProp, selectTab } from '../actions.js'
import { renderApp } from '../main.js'

export function wireStructure() {
  document.querySelectorAll('[data-select-object]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.closest('.design-client')) return
      e.stopPropagation()
      setSelection([el.dataset.selectObject], e.shiftKey || e.ctrlKey)
      renderApp()
    })
  })
  document.querySelectorAll('[data-tab-id]').forEach((el) => {
    el.addEventListener('dblclick', () => {
      selectTab(el.dataset.tabId)
      renderApp()
    })
  })
}

export function wireInspector() {
  document.querySelectorAll('[data-inspector-tab]').forEach((b) => {
    b.addEventListener('click', () => {
      state.inspector.tab = b.dataset.inspectorTab
      renderApp()
    })
  })

  const filter = document.querySelector('[data-action="inspector-filter"]')
  if (filter) {
    filter.addEventListener('input', () => {
      state.inspector.filter = filter.value
      const pos = filter.selectionStart
      renderApp()
      const again = document.querySelector('[data-action="inspector-filter"]')
      if (again) {
        again.focus()
        if (pos != null) again.setSelectionRange(pos, pos)
      }
    })
  }

  const objSel = document.querySelector('[data-action="select-object"]')
  if (objSel) {
    objSel.addEventListener('change', () => {
      setSelection([objSel.value])
      renderApp()
    })
  }

  const f = activeForm()
  if (!f) return
  const selected = getSelected()
  const isForm = selected === f

  document.querySelectorAll('[data-prop]').forEach((input) => {
    input.addEventListener('change', () => {
      applyProp(selected, isForm, input.dataset.prop, input.value)
      state.modified = true
      renderApp()
    })
  })

  document.querySelectorAll('[data-event]').forEach((input) => {
    input.addEventListener('change', () => {
      const ev = input.dataset.event
      const v = input.value.trim()
      const target = isForm ? (f.events ||= {}) : (selected.events ||= {})
      if (v) target[ev] = v
      else delete target[ev]
      state.modified = true
      renderApp()
    })
  })
}
