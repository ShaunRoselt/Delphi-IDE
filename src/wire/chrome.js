import { state } from '../state.js'
import {
  executeMenu, newForm, closeTab, selectTab, runProgram,
  updateSearchQuery, executeSearchAction
} from '../actions.js'
import { stopProgram } from '../runtime.js'
import { renderApp } from '../main.js'
import { resetLayoutSizes } from './layout.js'

function handleAction(action, el) {
  if (!action || action === 'noop') return
  if (action === 'newform') { newForm(); renderApp(); return }
  if (action === 'run') { runProgram(); return }
  if (action === 'stop-run') {
    state.runDialog = null
    stopProgram()
    state.statusMessage = 'Run stopped'
    renderApp()
    return
  }
  if (action === 'help') { executeMenu('About Embarcadero® Delphi'); return }
  if (action === 'reset-layout') { resetLayoutSizes(); state.statusMessage = 'Layout reset'; renderApp(); return }
  if (action === 'toggle-grid') { state.showGrid = el.checked; renderApp(); return }
  if (action === 'toggle-snap') { state.snapToGrid = el.checked; renderApp(); return }
  if (action.startsWith('menu:')) {
    const parts = action.split(':')
    const shouldRender = executeMenu(parts.slice(2).join(':'))
    if (shouldRender !== false) renderApp()
  }
}

export function wireGlobal() {
  document.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', () => handleAction(el.dataset.action, el))
  })
  document.querySelectorAll('[data-config-target]').forEach((el) => {
    el.addEventListener('change', () => {
      state[el.dataset.configTarget] = el.value
      renderApp()
    })
  })
}

export function wireMenus() {
  document.querySelectorAll('[data-menu]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      state.menuOpen = state.menuOpen === btn.dataset.menu ? null : btn.dataset.menu
      renderApp()
    })
    btn.addEventListener('mouseenter', () => {
      if (state.menuOpen && state.menuOpen !== btn.dataset.menu) {
        state.menuOpen = btn.dataset.menu
        renderApp()
      }
    })
  })
  document.querySelectorAll('[data-menu-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const shouldRender = executeMenu(btn.dataset.menuAction)
      if (shouldRender !== false) renderApp()
    })
  })
  // Nested submenu trigger (e.g. "New ▶")
  document.querySelectorAll('[data-submenu]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      state.subMenuOpen = state.subMenuOpen === btn.dataset.submenu ? null : btn.dataset.submenu
      renderApp()
    })
    btn.addEventListener('mouseenter', () => {
      if (state.subMenuOpen !== btn.dataset.submenu) {
        state.subMenuOpen = btn.dataset.submenu
        renderApp()
      }
    })
  })
  // Actions inside the nested submenu flyout
  document.querySelectorAll('[data-submenu-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const shouldRender = executeMenu(btn.dataset.submenuAction)
      if (shouldRender !== false) renderApp()
    })
  })
}

export function wireTabs() {
  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.addEventListener('click', (e) => {
      if (e.target.dataset.closeTab) return
      selectTab(b.dataset.tab)
      renderApp()
    })
  })
  document.querySelectorAll('[data-close-tab]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation()
      closeTab(b.dataset.closeTab)
      renderApp()
    })
  })
  document.querySelectorAll('[data-designer-view]').forEach((b) => {
    b.addEventListener('click', () => {
      state.designerView = b.dataset.designerView
      renderApp()
    })
  })
}

export function wireWelcome() {
  document.querySelectorAll('[data-welcome-create]').forEach((el) => {
    el.addEventListener('click', () => { newForm(); renderApp() })
  })
}

export function wireSearch() {
  const searchInput = document.getElementById('ide-search-input')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      updateSearchQuery(e.target.value)
      renderApp()
      // Restore focus after re-render
      setTimeout(() => {
        const input = document.getElementById('ide-search-input')
        if (input) {
          input.focus()
          input.selectionStart = input.value.length
        }
      }, 0)
    })

    searchInput.addEventListener('keydown', (e) => {
      if (!state.searchOpen || state.searchResults.length === 0) return
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        state.searchSelectedIndex = (state.searchSelectedIndex + 1) % state.searchResults.length
        renderApp()
        setTimeout(() => document.getElementById('ide-search-input')?.focus(), 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        state.searchSelectedIndex = (state.searchSelectedIndex - 1 + state.searchResults.length) % state.searchResults.length
        renderApp()
        setTimeout(() => document.getElementById('ide-search-input')?.focus(), 0)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        executeSearchAction(state.searchSelectedIndex)
        renderApp()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        state.searchOpen = false
        renderApp()
      }
    })
  }

  document.querySelectorAll('.search-result-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      executeSearchAction(Number(el.dataset.searchIndex))
      renderApp()
    })
  })
}

// Document-level handler that closes any open menu when the user clicks away.
// Registered once at module load — wireMenus() can be called many times safely.
document.addEventListener('click', (e) => {
  let changed = false
  if (state.menuOpen && !e.target.closest('.menubar') && !e.target.closest('.menu-popup')) {
    state.menuOpen = null
    state.subMenuOpen = null
    changed = true
  }
  if (state.searchOpen && !e.target.closest('.ide-search-container')) {
    state.searchOpen = false
    changed = true
  }
  if (changed) renderApp()
})
