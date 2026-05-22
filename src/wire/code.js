import { state, activeForm } from '../state.js'
import { compilePascal } from '../compiler.js'
import {
  collectSymbols, analyzeCompletionContext, findDeclarationLine, findProcedureLines,
  findNavigationSections, findTypeLines, completeDelphiBlock, getRoutineSignature,
} from '../pascal.js'
import { renderHighlight, renderGutter, findSearchMatches } from '../render/code.js'

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

const editorHistory = { stack: [], index: -1, applying: false }
const paramHint = { el: null, open: false }


function resetHistory(value) {
  editorHistory.stack = [value]
  editorHistory.index = 0
  editorHistory.applying = false
}

function pushHistory(value) {
  if (editorHistory.applying) return
  if (editorHistory.stack[editorHistory.index] === value) return
  editorHistory.stack = editorHistory.stack.slice(0, editorHistory.index + 1)
  editorHistory.stack.push(value)
  if (editorHistory.stack.length > 80) editorHistory.stack.shift()
  editorHistory.index = editorHistory.stack.length - 1
}

function applyHistory(input, delta, onChange) {
  const next = editorHistory.index + delta
  if (next < 0 || next >= editorHistory.stack.length) return false
  editorHistory.index = next
  editorHistory.applying = true
  input.value = editorHistory.stack[next]
  input.selectionStart = input.selectionEnd = Math.min(input.selectionStart, input.value.length)
  editorHistory.applying = false
  onChange({ skipHistory: true })
  return true
}

function replaceSelection(input, text, selectStart = null, selectEnd = null) {
  const { selectionStart, selectionEnd, value } = input
  input.value = value.slice(0, selectionStart) + text + value.slice(selectionEnd)
  const caret = selectionStart + text.length
  input.selectionStart = selectStart ?? caret
  input.selectionEnd = selectEnd ?? input.selectionStart
}

function updateSearchState(input) {
  state.codeSearch ||= { open: false, query: '', activeIndex: 0, matches: [] }
  state.codeSearch.matches = findSearchMatches(input.value, state.codeSearch.query || '')
  if (state.codeSearch.activeIndex >= state.codeSearch.matches.length) state.codeSearch.activeIndex = Math.max(0, state.codeSearch.matches.length - 1)
}


function updateFindBar(input) {
  const bar = document.querySelector('[data-code-findbar]')
  if (!bar) return
  const search = state.codeSearch || { open: false, query: '', activeIndex: 0, matches: [] }
  bar.hidden = !search.open
  const find = bar.querySelector('[data-code-find]')
  if (find && document.activeElement !== find) find.value = search.query || ''
  const count = bar.querySelector('[data-code-find-count]')
  if (count) {
    const current = search.matches?.length ? Math.min(search.activeIndex + 1, search.matches.length) : 0
    count.textContent = `${current} of ${search.matches?.length || 0}`
  }
}

function renderSearchLayer(searchLayer, text) {
  if (!searchLayer) return
  const search = state.codeSearch || { query: '', activeIndex: 0 }
  const matches = findSearchMatches(text, search.query || '')
  if (!search.query?.trim() || !matches.length) {
    searchLayer.textContent = text || ' '
    return
  }
  searchLayer.replaceChildren()
  let pos = 0
  matches.forEach((m, idx) => {
    searchLayer.append(document.createTextNode(text.slice(pos, m.index)))
    const mark = document.createElement('span')
    mark.className = idx === search.activeIndex ? 'code-search-mark active' : 'code-search-mark'
    mark.textContent = text.slice(m.index, m.index + m.length)
    searchLayer.append(mark)
    pos = m.index + m.length
  })
  searchLayer.append(document.createTextNode(text.slice(pos) || ' '))
}

function activeCallName(text, offset) {
  const head = text.slice(0, offset)
  let parens = 0
  for (let i = head.length - 1; i >= 0; i--) {
    const ch = head[i]
    if (ch === ')') parens++
    else if (ch === '(') {
      if (parens > 0) { parens--; continue }
      let end = i
      let start = end
      while (start > 0 && /[A-Za-z0-9_]/.test(head[start - 1])) start--
      return head.slice(start, end)
    }
  }
  return null
}

function showParamHint(input) {
  if (!paramHint.el) return false
  const name = activeCallName(input.value, input.selectionStart) || findIdentifierAtOffset(input.value, input.selectionStart)
  const signature = getRoutineSignature(name)
  if (!signature) return false
  paramHint.el.textContent = signature
  paramHint.el.hidden = false
  paramHint.open = true
  const { x, y } = caretViewportPos(input)
  paramHint.el.style.left = `${Math.max(8, Math.min(window.innerWidth - 420, x))}px`
  paramHint.el.style.top = `${Math.max(8, y - 34)}px`
  return true
}

function closeParamHint() {
  paramHint.open = false
  if (paramHint.el) paramHint.el.hidden = true
}

function jumpToSearchMatch(input, index) {
  updateSearchState(input)
  const matches = state.codeSearch.matches || []
  if (!matches.length) return false
  state.codeSearch.activeIndex = ((index % matches.length) + matches.length) % matches.length
  const m = matches[state.codeSearch.activeIndex]
  input.selectionStart = m.index
  input.selectionEnd = m.index + m.length
  input.focus()
  const { line } = lineColAt(input.value, m.index)
  jumpToLine(input, line, false)
  input.selectionStart = m.index
  input.selectionEnd = m.index + m.length
  return true
}

function measureFont(input) {
  const cs = getComputedStyle(input)
  measuredLineHeight = parseFloat(cs.lineHeight) || 21
  const probe = document.createElement('span')
  probe.style.fontFamily = cs.fontFamily
  probe.style.fontSize = cs.fontSize
  probe.style.fontWeight = cs.fontWeight
  probe.style.fontStyle = cs.fontStyle
  probe.style.lineHeight = cs.lineHeight
  probe.style.letterSpacing = cs.letterSpacing
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.whiteSpace = 'pre'
  probe.textContent = '0'.repeat(40)
  document.body.appendChild(probe)
  measuredCharWidth = probe.getBoundingClientRect().width / 40
  if (!Number.isFinite(measuredCharWidth) || measuredCharWidth <= 0) measuredCharWidth = parseFloat(cs.fontSize) * 0.6
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

function syncOverlay(input, highlight, gutter, searchLayer = null) {
  const transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`
  highlight.style.transform = transform
  if (searchLayer) searchLayer.style.transform = transform
  gutter.scrollTop = input.scrollTop
}

function rerenderEditor(highlight, gutter, searchLayer, text) {
  highlight.innerHTML = renderHighlight(text, state.diagnostics || [])
  gutter.innerHTML = renderGutter(text, state.diagnostics || [])
  renderSearchLayer(searchLayer, text)
}

function fillSelect(select, headLabel, items, labelKey = 'label') {
  if (!select) return
  select.replaceChildren()
  const head = document.createElement('option')
  head.value = '0'
  head.textContent = headLabel
  select.append(head)
  for (const p of items) {
    const opt = document.createElement('option')
    opt.value = String(p.line)
    opt.textContent = p[labelKey]
    select.append(opt)
  }
}

function refreshNavigator(src) {
  fillSelect(document.querySelector('[data-code-section-navigator]'), 'Top of File', findNavigationSections(src).slice(1))
  fillSelect(document.querySelector('[data-code-type-filter]'), 'Search for a type', findTypeLines(src), 'name')
  fillSelect(document.querySelector('[data-code-navigator]'), 'Search for a method', findProcedureLines(src), 'qualified')
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

function jumpToLine(input, line, moveCaret = true) {
  if (measuredLineHeight == null) measureFont(input)
  if (moveCaret) input.selectionStart = input.selectionEnd = offsetForLine(input.value, line)
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
    ? popup.items.filter((i) => i.label.toLowerCase().includes(lower))
      .sort((a, b) => a.label.toLowerCase().indexOf(lower) - b.label.toLowerCase().indexOf(lower))
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
  const searchLayer = document.querySelector('[data-code-search-layer]')
  if (!input || !highlight || !gutter) return
  const form = activeForm()
  if (!form) return

  popup.el = document.querySelector('[data-code-insight]')
  paramHint.el = document.querySelector('[data-code-param-hint]')
  if (paramHint.el) paramHint.el.hidden = true
  paramHint.open = false
  if (popup.el) popup.el.hidden = true
  popup.open = false
  measuredCharWidth = null
  measuredLineHeight = null

  // Run diagnostics on the initial source so squiggles and gutter reflect
  // any issues without waiting for the first keystroke.
  refreshDiagnostics(form, input.value)
  updateSearchState(input)
  resetHistory(input.value)
  updateFindBar(input)
  rerenderEditor(highlight, gutter, searchLayer, input.value)
  syncOverlay(input, highlight, gutter, searchLayer)

  const refresh = (options = {}) => {
    if (!options.viewOnly) {
      form.code = input.value
      state.modified = true
    }
    refreshDiagnostics(form, input.value)
    updateSearchState(input)
    updateFindBar(input)
    if (!options.skipHistory) pushHistory(input.value)
    rerenderEditor(highlight, gutter, searchLayer, input.value)
    refreshNavigator(input.value)
    updateCursorPos(input)
    syncOverlay(input, highlight, gutter, searchLayer)
    if (popup.open) {
      const ctx = analyzeCompletionContext(input.value, input.selectionStart)
      if (!ctx.dotBase && ctx.partialStart !== popup.anchorOffset) closePopup()
      else { filterPopup(ctx.partial); positionPopup(input) }
    }
  }

  input.addEventListener('input', () => {
    refresh()
    if (paramHint.open) showParamHint(input)
    // Auto-trigger member completion right after a '.' is typed.
    if (!popup.open) {
      const caret = input.selectionStart
      if (caret > 0 && input.value[caret - 1] === '.') triggerCompletion(input, form)
    }
  })

  input.addEventListener('scroll', () => {
    syncOverlay(input, highlight, gutter, searchLayer)
    if (popup.open) positionPopup(input)
    if (paramHint.open) showParamHint(input)
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
    if (paramHint.open) closeParamHint()
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

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) applyHistory(input, 1, refresh)
      else applyHistory(input, -1, refresh)
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault()
      applyHistory(input, 1, refresh)
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault()
      state.codeSearch ||= { open: false, query: '', activeIndex: 0, matches: [] }
      state.codeSearch.open = true
      const selected = input.selectionStart !== input.selectionEnd ? input.value.slice(input.selectionStart, input.selectionEnd) : ''
      if (selected && !selected.includes('\n')) state.codeSearch.query = selected
      refresh({ skipHistory: true, viewOnly: true })
      setTimeout(() => document.querySelector('[data-code-find]')?.focus(), 0)
      return
    }

    if (event.key === 'F3') {
      event.preventDefault()
      const delta = event.shiftKey ? -1 : 1
      jumpToSearchMatch(input, (state.codeSearch?.activeIndex || 0) + delta)
      refresh({ skipHistory: true, viewOnly: true })
      return
    }

    if (event.altKey && event.key.toLowerCase() === 'g') {
      event.preventDefault()
      const line = Number(prompt('Go to line:', String(state.cursorPos?.line || 1)))
      if (Number.isFinite(line) && line > 0) jumpToLine(input, line)
      return
    }

    if (event.key === ' ' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      event.preventDefault()
      showParamHint(input)
      return
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
        replaceSelection(input, '  ')
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
        const completion = completeDelphiBlock(head, indent)
        event.preventDefault()
        replaceSelection(input, completion.text)
        if (completion.caretBack) {
          input.selectionStart = input.selectionEnd = input.selectionStart - completion.caretBack
        }
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

  document.querySelectorAll('[data-code-section-navigator], [data-code-type-filter], [data-code-navigator]').forEach((navigator) => {
    navigator.addEventListener('change', () => {
      const line = Number(navigator.value)
      if (line > 0) jumpToLine(input, line)
      navigator.value = '0'
    })
  })


  const findInput = document.querySelector('[data-code-find]')
  findInput?.addEventListener('input', () => {
    state.codeSearch.query = findInput.value
    state.codeSearch.activeIndex = 0
    updateSearchState(input)
    refresh({ skipHistory: true, viewOnly: true })
  })
  findInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      jumpToSearchMatch(input, (state.codeSearch?.activeIndex || 0) + (event.shiftKey ? -1 : 1))
      refresh({ skipHistory: true, viewOnly: true })
    }
    if (event.key === 'Escape') {
      state.codeSearch.open = false
      refresh({ skipHistory: true, viewOnly: true })
      input.focus()
    }
  })
  document.querySelector('[data-code-find-next]')?.addEventListener('click', () => {
    jumpToSearchMatch(input, (state.codeSearch?.activeIndex || 0) + 1)
    refresh({ skipHistory: true, viewOnly: true })
  })
  document.querySelector('[data-code-find-prev]')?.addEventListener('click', () => {
    jumpToSearchMatch(input, (state.codeSearch?.activeIndex || 0) - 1)
    refresh({ skipHistory: true, viewOnly: true })
  })
  document.querySelector('[data-code-find-close]')?.addEventListener('click', () => {
    state.codeSearch.open = false
    refresh({ skipHistory: true, viewOnly: true })
    input.focus()
  })
  const lineInput = document.querySelector('[data-code-line-input]')
  const goLine = () => {
    const line = Number(lineInput?.value)
    if (Number.isFinite(line) && line > 0) jumpToLine(input, line)
  }
  document.querySelector('[data-code-line-go]')?.addEventListener('click', goLine)
  lineInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); goLine() }
  })

  window.onDelphiEditorCommand = (command) => {
    if (command === 'undo') { input.focus(); return applyHistory(input, -1, refresh) }
    if (command === 'redo') { input.focus(); return applyHistory(input, 1, refresh) }
    if (command === 'select-all') { input.focus(); input.select(); return true }
    if (command === 'find') { state.codeSearch.open = true; refresh({ skipHistory: true, viewOnly: true }); setTimeout(() => document.querySelector('[data-code-find]')?.focus(), 0); return true }
    if (command === 'find-next') { jumpToSearchMatch(input, (state.codeSearch?.activeIndex || 0) + 1); refresh({ skipHistory: true, viewOnly: true }); return true }
    if (command === 'find-prev') { jumpToSearchMatch(input, (state.codeSearch?.activeIndex || 0) - 1); refresh({ skipHistory: true, viewOnly: true }); return true }
    if (command === 'go-line') { const line = Number(prompt('Go to line:', String(state.cursorPos?.line || 1))); if (Number.isFinite(line) && line > 0) jumpToLine(input, line); return true }
    if (command === 'code-completion') { triggerCompletion(input, form); return true }
    if (command === 'parameter-hint') { showParamHint(input); return true }
    return false
  }

  document.querySelector('[data-compiler-messages]')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-diagnostic-line]')
    if (!row) return
    jumpToLine(input, Number(row.dataset.diagnosticLine))
  })
}
