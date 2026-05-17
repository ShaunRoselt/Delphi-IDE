import { renderShell } from './render/shell.js'
import { wireAll } from './wire/index.js'
import { persistState } from './state.js'

const root = document.querySelector('#root')

export function renderApp() {
  // Replace the IDE root with a freshly rendered shell, then wire up listeners.
  root.innerHTML = renderShell()
  wireAll()
  persistState()
}

renderApp()
