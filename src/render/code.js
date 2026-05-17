import { state, activeForm } from '../state.js'
import { generatePascal, highlightPascal } from '../pascal.js'
import { escapeHtml } from '../util.js'
import { renderViewSwitcher } from './chrome.js'

function renderDiagnostics() {
  const diagnostics = state.diagnostics || []
  if (!diagnostics.length) {
    return '<div class="diagnostics-empty">No compiler messages</div>'
  }
  return diagnostics.map((d) => `
    <button type="button" class="diagnostic-row ${d.severity}" data-diagnostic-line="${d.line}">
      <span>${escapeHtml(d.severity === 'error' ? 'Error' : 'Warning')}</span>
      <span>${escapeHtml(d.code)}</span>
      <span>(${d.line},${d.col})</span>
      <strong>${escapeHtml(d.message)}</strong>
    </button>
  `).join('')
}

export function renderCodePage() {
  const f = activeForm()
  if (!f) return '<div class="empty-state">No form</div>'

  const src = generatePascal(f)
  const diagnosticsByLine = new Map()
  for (const d of state.diagnostics || []) {
    if (!diagnosticsByLine.has(d.line)) diagnosticsByLine.set(d.line, d)
  }
  const highlighted = src.split('\n').map((line, i) =>
    `<div class="code-line ${diagnosticsByLine.has(i + 1) ? `has-${diagnosticsByLine.get(i + 1).severity}` : ''}" data-line="${i + 1}"><span class="ln">${i + 1}</span><span class="code-text">${highlightPascal(line) || '&nbsp;'}</span></div>`,
  ).join('')

  return `
    <section class="code-page">
      <div class="code-toolbar">
        <select><option>Search for a type</option></select>
        <select><option>${escapeHtml(f.className)}</option><option>(class declaration)</option></select>
      </div>
      <div class="code-editor" data-code-editor contenteditable="true" spellcheck="false">${highlighted}</div>
      <section class="compiler-messages" data-compiler-messages>
        <header><strong>Messages</strong><span>${state.diagnostics?.length || 0} item(s)</span></header>
        <div class="diagnostic-list">${renderDiagnostics()}</div>
      </section>
      ${renderViewSwitcher()}
    </section>
  `
}
