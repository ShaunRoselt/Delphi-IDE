import { state, activeForm } from '../state.js'
import { compilePascal } from '../compiler.js'
import {
  collectSymbols, analyzeCompletionContext, findDeclarationLine, findProcedureLines,
} from '../pascal.js'
import { renderHighlight, renderGutter } from '../render/code.js'

// All HTML written via innerHTML in this module is built either from
// renderHighlight/renderGutter (which already escape text) or from DOM
// construction APIs. User text is never inserted raw.

const popup = {
  el: null,
  open: false,
  items: [],
  filtered: [],
  selectedIndex: 0,
  anchorOffset: 0,
}

let measuredCharWidth = null
let measuredLineHeight = null

function measureFont(input) {
  const cs = getComputedStyle(input)
  measuredLineHeight = parseFloat(cs.lineHeight) || 21
  const probe = document.createElement('span')
  probe.style.font = cs.font
  probe.style.letterSpacing = cs.letterSpacing
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.whiteSpace = 'pre'
  probe.textContent = '0'.repeat(40)
  document.body.appendChild(probe)
  measuredCharWidth = probe.getBoundingClientRect().width / 40
  document.body.removeChild(probe)
}

function lineColAt(value, offset) {
  const before = value.slice(0, offset)
  const lastNL = before.lastIndexOf('\n')
  const line = (before.match(/\n/g) || []).length + 1
  const col = (offset - (lastNL + 1)) + 1
  return { line, col }
}

function offsetForLine(value, line) {
  if (line <= 1) return 0
  const lines = value.split('\n')
  let offset = 0
  for (let i = 0; i < line - 1 && i < lines.length; i++) offset += lines[i].length + 1
  return offset
}

function caretViewportPos(input) {
  if (measuredCharWidth == null) measureFont(input)
  const cs = getComputedStyle(input)
  const padL = parseFloat(cs.paddingLeft) || 0
  const padT = parseFloat(cs.paddingTop) || 0
  const { line, col } = lineColAt(input.value, input.selectionStart)
  const rect = input.getBoundingClientRect()
  return {
    x: rect.left + padL + (col - 1) * measuredCharWidth - input.scrollLeft,
    y: rect.top + padT + (line - 1) * measuredLineHeight - input.scrollTop,
    lineHeight: measuredLineHeight,
  }
}

function syncOverlay(input, highlight, gutter) {
  highlight.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`
  gutter.scrollTop = input.scrollTop
}

function rerenderEditor(highlight, gutter, text) {
  highlight.innerHTML = renderHighlight(text, state.diagnostics || [])
  gutter.innerHTML = renderGutter(text, state.diagnostics || [])
}

function refreshNavigator(src) {
  const nav = document.querySelector('[data-code-navigator]')
  if (!nav) return
  const procs = findProcedureLines(src)
  nav.replaceChildren()
  const head = document.createElement('option')
  head.value = '0'
  head.textContent = '(class declaration)'
  nav.append(head)
  for (const p of procs) {
    const opt = document.createElement('option')
    opt.value = String(p.line)
    opt.textContent = p.qualified
    nav.append(opt)
  }
}

function renderCompilerMessages() {
  const host = document.querySelector('[data-compiler-messages]')
  if (!host) return
  const diagnostics = state.diagnostics || []
  const list = host.querySelector('.diagnostic-list')
  const count = host.querySelector('header span')
  if (count) count.textContent = `${diagnostics.length} item(s)`
  if (!list) return
  if (!diagnostics.length) {
    list.replaceChildren()
    const empty = document.createElement('div')
    empty.className = 'diagnostics-empty'
    empty.textContent = 'No compiler messages'
    list.append(empty)
    return
  }
  list.replaceChildren(...diagnostics.map((d) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `diagnostic-row ${d.severity}`
    btn.dataset.diagnosticLine = String(d.line)
    const sev = document.createElement('span')
    sev.textContent = d.severity === 'error' ? 'Error' : 'Warning'
    const code = document.createElement('span')
    code.textContent = d.code
    const loc = document.createElement('span')
    loc.textContent = `(${d.line},${d.col})`
    const msg = document.createElement('strong')
    msg.textContent = d.message
    btn.append(sev, code, loc, msg)
    return btn
  }))
}

function refreshDiagnostics(form, source) {
  const result = compilePascal(form, source)
  state.diagnostics = result.diagnostics
  const errors = result.diagnostics.filter((d) => d.severity === 'error').length
  const warnings = result.diagnostics.length - errors
  state.statusMessage = errors
    ? `[dcc32 Error] ${errors} error(s), ${warnings} warning(s)`
    : (warnings ? `[dcc32 Warning] ${warnings} warning(s)` : 'CodeInsight: Done')
  const statusEl = document.querySelector('.status-msg')
  if (statusEl) statusEl.textContent = state.statusMessage
  renderCompilerMessages()
}

function updateCursorPos(input) {
  const { line, col } = lineColAt(input.value, input.selectionStart)
  state.cursorPos = { line, col }
  const cursorEl = document.querySelector('.cursor-pos')
  if (cursorEl) cursorEl.textContent = `${line}:${col}`
}

function insertAtCaret(input, text) {
  const { selectionStart, selectionEnd, value } = input
  input.value = value.slice(0, selectionStart) + text + value.slice(selectionEnd)
  input.selectionStart = input.selectionEnd = selectionStart + text.length
}

function jumpToLine(input, line) {
  if (measuredLineHeight == null) measureFont(input)
  input.selectionStart = input.selectionEnd = offsetForLine(input.value, line)
  input.focus()
  input.scrollTop = Math.max(0, (line - 1) * measuredLineHeight - input.clientHeight / 2)
}

function closePopup() {
  popup.open = false
  if (popup.el) popup.el.hidden = true
}

function renderPopupItems() {
  if (!popup.el) return
  popup.el.replaceChildren()
  if (!popup.filtered.length) {
    const empty = document.createElement('div')
    empty.className = 'code-insight-empty'
    empty.textContent = 'No suggestions'
    popup.el.append(empty)
    return
  }
  popup.filtered.forEach((item, idx) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `code-insight-item${idx === popup.selectedIndex ? ' active' : ''}`
    btn.dataset.insightIndex = String(idx)
    const kind = document.createElement('span')
    kind.className = `ci-kind ci-${item.kind}`
    kind.textContent = (item.kind[0] || '?').toUpperCase()
    const label = document.createElement('span')
    label.className = 'ci-label'
    label.textContent = item.label
    const detail = document.createElement('span')
    detail.className = 'ci-detail'
    detail.textContent = item.detail || item.kind
    btn.append(kind, label, detail)
    popup.el.append(btn)
  })
  const active = popup.el.querySelector('.code-insight-item.active')
  if (active) active.scrollIntoView({ block: 'nearest' })
}

function filterPopup(prefix) {
  const lower = prefix.toLowerCase()
  popup.filtered = lower
    ? popup.items.filter((i) => i.label.toLowerCase().startsWith(lower))
    : popup.items.slice()
  popup.selectedIndex = 0
  if (!popup.filtered.length) {
    closePopup()
    return
  }
  renderPopupItems()
}

function positionPopup(input) {
  if (!popup.el) return
  const { x, y, lineHeight } = caretViewportPos(input)
  let top = y + lineHeight + 2
  let left = x
  if (left + 320 > window.innerWidth) left = window.innerWidth - 328
  if (top + 220 > window.innerHeight) top = y - 220 - 4
  popup.el.style.top = `${Math.max(8, top)}px`
  popup.el.style.left = `${Math.max(8, left)}px`
}

function openPopup(input, items, anchorOffset, prefix) {
  if (!popup.el || !items.length) return
  popup.items = items
  popup.anchorOffset = anchorOffset
  popup.open = true
  popup.el.hidden = false
  filterPopup(prefix)
  positionPopup(input)
}

function acceptCurrent(input, form, onChange) {
  if (!popup.open || !popup.filtered.length) return false
  const choice = popup.filtered[popup.selectedIndex]
  if (!choice) return false
  const value = input.value
  const caret = input.selectionStart
  const newValue = value.slice(0, popup.anchorOffset) + choice.label + value.slice(caret)
  input.value = newValue
  input.selectionStart = input.selectionEnd = popup.anchorOffset + choice.label.length
  form.code = newValue
  state.modified = true
  closePopup()
  onChange()
  return true
}

function triggerCompletion(input, form) {
  const text = input.value
  const ctx = analyzeCompletionContext(text, input.selectionStart)
  const { identifiers, members } = collectSymbols(form)
  let items
  if (ctx.dotBase) {
    const list = members[ctx.dotBase.toLowerCase()]
    if (!list || !list.length) { closePopup(); return }
    items = list
  } else {
    items = identifiers
  }
  const seen = new Set()
  items = items.filter((it) => {
    const k = it.label.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  openPopup(input, items, ctx.partialStart, ctx.partial)
}

function findIdentifierAtOffset(text, offset) {
  if (offset < 0 || offset > text.length) return null
  let start = offset
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) start--
  let end = offset
  while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) end++
  if (start === end) return null
  return text.slice(start, end)
}

// Registered once at module load — wireCodeEditor() can be invoked on every
// renderApp() pass without leaking listeners.
document.addEventListener('mousedown', (event) => {
  if (!popup.open) return
  if (event.target.closest('[data-code-insight]')) return
  if (event.target.closest('[data-code-input]')) return
  closePopup()
})

export function wireCodeEditor() {
  const input = document.querySelector('[data-code-input]')
  const highlight = document.querySelector('[data-code-highlight]')
  const gutter = document.querySelector('[data-code-gutter]')
  if (!input || !highlight || !gutter) return
  const form = activeForm()
  if (!form) return

  popup.el = document.querySelector('[data-code-insight]')
  if (popup.el) popup.el.hidden = true
  popup.open = false
  measuredCharWidth = null
  measuredLineHeight = null

  // Run diagnostics on the initial source so squiggles and gutter reflect
  // any issues without waiting for the first keystroke.
  refreshDiagnostics(form, input.value)
  rerenderEditor(highlight, gutter, input.value)
  syncOverlay(input, highlight, gutter)

  const refresh = () => {
    form.code = input.value
    state.modified = true
    refreshDiagnostics(form, input.value)
    rerenderEditor(highlight, gutter, input.value)
    refreshNavigator(input.value)
    updateCursorPos(input)
    syncOverlay(input, highlight, gutter)
    if (popup.open) {
      const ctx = analyzeCompletionContext(input.value, input.selectionStart)
      if (!ctx.dotBase && ctx.partialStart !== popup.anchorOffset) closePopup()
      else { filterPopup(ctx.partial); positionPopup(input) }
    }
  }

  input.addEventListener('input', () => {
    refresh()
    // Auto-trigger member completion right after a '.' is typed.
    if (!popup.open) {
      const caret = input.selectionStart
      if (caret > 0 && input.value[caret - 1] === '.') triggerCompletion(input, form)
    }
  })

  input.addEventListener('scroll', () => {
    syncOverlay(input, highlight, gutter)
    if (popup.open) positionPopup(input)
  })

  input.addEventListener('keyup', () => updateCursorPos(input))
  input.addEventListener('select', () => updateCursorPos(input))

  input.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey) {
      const ident = findIdentifierAtOffset(input.value, input.selectionStart)
      if (ident) {
        const line = findDeclarationLine(input.value, ident)
        if (line > 0) {
          event.preventDefault()
          jumpToLine(input, line)
          updateCursorPos(input)
          return
        }
      }
    }
    updateCursorPos(input)
    if (popup.open) closePopup()
  })

  input.addEventListener('keydown', (event) => {
    if (popup.open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        popup.selectedIndex = Math.min(popup.filtered.length - 1, popup.selectedIndex + 1)
        renderPopupItems()
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        popup.selectedIndex = Math.max(0, popup.selectedIndex - 1)
        renderPopupItems()
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (acceptCurrent(input, form, refresh)) event.preventDefault()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closePopup()
        return
      }
    }

    if (event.key === ' ' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      triggerCompletion(input, form)
      return
    }

    if (event.key === 'Tab' && !event.ctrlKey && !event.altKey) {
      event.preventDefault()
      const { selectionStart, selectionEnd, value } = input
      const multiline = selectionStart !== selectionEnd
        && value.slice(selectionStart, selectionEnd).includes('\n')
      if (multiline) {
        const blockStart = value.lastIndexOf('\n', selectionStart - 1) + 1
        const block = value.slice(blockStart, selectionEnd)
        const indented = event.shiftKey
          ? block.replace(/^[ \t]{1,2}/gm, '')
          : block.replace(/^/gm, '  ')
        input.value = value.slice(0, blockStart) + indented + value.slice(selectionEnd)
        input.selectionStart = blockStart
        input.selectionEnd = blockStart + indented.length
      } else if (event.shiftKey) {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
        const head = value.slice(lineStart, selectionStart)
        const m = head.match(/^[ \t]{1,2}/)
        if (m) {
          input.value = value.slice(0, lineStart) + head.slice(m[0].length) + value.slice(selectionStart)
          input.selectionStart = input.selectionEnd = Math.max(lineStart, selectionStart - m[0].length)
        }
      } else {
        insertAtCaret(input, '  ')
      }
      refresh()
      return
    }

    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      const { selectionStart, selectionEnd, value } = input
      if (selectionStart === selectionEnd) {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
        const head = value.slice(lineStart, selectionStart)
        const indent = (head.match(/^[ \t]*/) || [''])[0]
        const trimmed = head.trim().toLowerCase()
        const extra = (trimmed === 'begin' || /\bthen$/.test(trimmed) || /\bdo$/.test(trimmed))
          ? '  ' : ''
        event.preventDefault()
        insertAtCaret(input, `\n${indent}${extra}`)
        refresh()
      }
    }
  })

  popup.el?.addEventListener('mousedown', (event) => {
    const item = event.target.closest('[data-insight-index]')
    if (!item) return
    // Keep textarea focused; the actual accept happens here.
    event.preventDefault()
    popup.selectedIndex = Number(item.dataset.insightIndex)
    acceptCurrent(input, form, refresh)
    input.focus()
  })

  const navigator = document.querySelector('[data-code-navigator]')
  navigator?.addEventListener('change', () => {
    const line = Number(navigator.value)
    if (line > 0) jumpToLine(input, line)
  })

  document.querySelector('[data-compiler-messages]')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-diagnostic-line]')
    if (!row) return
    jumpToLine(input, Number(row.dataset.diagnosticLine))
  })
}
