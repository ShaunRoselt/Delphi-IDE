import { state, activeForm } from '../state.js'
import { addComponent } from '../actions.js'
import { renderApp } from '../main.js'

function preserveFocusAndRender(input) {
  const pos = input.selectionStart
  renderApp()
  const again = document.querySelector(`[data-action="${input.dataset.action}"]`)
  if (again) {
    again.focus()
    if (pos != null) again.setSelectionRange(pos, pos)
  }
}

export function wirePalette() {
  document.querySelectorAll('[data-palette-cat]').forEach((el) => {
    el.addEventListener('click', () => {
      const cat = el.dataset.paletteCat
      state.paletteOpen[cat] = !state.paletteOpen[cat]
      renderApp()
    })
  })

  document.querySelectorAll('[data-palette-component]').forEach((el) => {
    el.addEventListener('click', () => {
      const type = el.dataset.paletteComponent
      state.paletteSelected = state.paletteSelected === type ? null : type
      state.statusMessage = state.paletteSelected
        ? `Click on the form to drop ${type}`
        : 'CodeInsight: Done'
      renderApp()
    })
    el.addEventListener('dblclick', () => {
      const type = el.dataset.paletteComponent
      const f = activeForm()
      if (!f) return
      addComponent(f, type, 24, 24)
      state.paletteSelected = null
      state.designerView = 'design'
      renderApp()
    })
  })

  const filter = document.querySelector('[data-action="palette-filter"]')
  if (filter) {
    filter.addEventListener('input', () => {
      state.paletteFilter = filter.value
      preserveFocusAndRender(filter)
    })
  }
}
