import { state, activeForm } from '../state.js'
import { escapeHtml, getCaretOffset } from '../util.js'
import { compilePascal } from '../compiler.js'

function readEditorText(ed) {
  const lines = [...ed.querySelectorAll('.code-text')]
  if (lines.length) return lines.map((line) => line.textContent.replace(/\u00a0/g, '')).join('\n')
  return ed.innerText
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
    list.innerHTML = '<div class="diagnostics-empty">No compiler messages</div>'
    return
  }
  list.innerHTML = diagnostics.map((d) => `
    <button type="button" class="diagnostic-row ${d.severity}" data-diagnostic-line="${d.line}">
      <span>${escapeHtml(d.severity === 'error' ? 'Error' : 'Warning')}</span>
      <span>${escapeHtml(d.code)}</span>
      <span>(${d.line},${d.col})</span>
      <strong>${escapeHtml(d.message)}</strong>
    </button>
  `).join('')
}

function refreshDiagnostics(form, source) {
  const result = compilePascal(form, source)
  state.diagnostics = result.diagnostics
  const errors = result.diagnostics.filter((d) => d.severity === 'error').length
  const warnings = result.diagnostics.length - errors
  state.statusMessage = errors
    ? `[dcc32 Error] ${errors} error(s), ${warnings} warning(s)`
    : 'CodeInsight: Done'
  const status = document.querySelector('.status-msg')
  if (status) status.textContent = state.statusMessage
  renderCompilerMessages()
}

export function wireCodeEditor() {
  const ed = document.querySelector('[data-code-editor]')
  if (!ed) return
  const f = activeForm()
  if (!f) return

  ed.addEventListener('input', () => {
    f.code = readEditorText(ed)
    state.modified = true
    refreshDiagnostics(f, f.code)
  })

  ed.addEventListener('keyup', () => {
    const text = readEditorText(ed)
    const offset = getCaretOffset(ed)
    const before = text.slice(0, offset)
    const line = (before.match(/\n/g) || []).length + 1
    const col = offset - (before.lastIndexOf('\n') + 1) + 1
    state.cursorPos = { line, col }
    const cursorEl = document.querySelector('.cursor-pos')
    if (cursorEl) cursorEl.textContent = `${line}:${col}`
  })

  document.querySelector('[data-compiler-messages]')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-diagnostic-line]')
    if (!row) return
    const line = ed.querySelector(`[data-line="${row.dataset.diagnosticLine}"]`)
    line?.scrollIntoView({ block: 'center' })
  })
}
