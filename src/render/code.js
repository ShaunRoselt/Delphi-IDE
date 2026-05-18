import { state, activeForm } from '../state.js'
import {
  generatePascal, highlightPascal, findProcedureLines,
} from '../pascal.js'
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

// Maps each diagnostic to its line; preserves error severity over warning.
function diagnosticsByLine(diagnostics) {
  const byLine = new Map()
  for (const d of diagnostics || []) {
    if (!byLine.has(d.line)) {
      byLine.set(d.line, { worst: d.severity, items: [d] })
    } else {
      const entry = byLine.get(d.line)
      entry.items.push(d)
      if (d.severity === 'error') entry.worst = 'error'
    }
  }
  return byLine
}

export function renderHighlight(src, diagnostics) {
  const byLine = diagnosticsByLine(diagnostics)
  return src.split('\n').map((line, i) => {
    const entry = byLine.get(i + 1)
    return highlightPascal(line, entry?.items || []) || ' '
  }).join('\n')
}

export function renderGutter(src, diagnostics) {
  const byLine = diagnosticsByLine(diagnostics)
  const total = src.split('\n').length
  let out = ''
  for (let i = 1; i <= total; i++) {
    const sev = byLine.get(i)?.worst
    const cls = sev ? `code-line-num has-${sev}` : 'code-line-num'
    out += `<div class="${cls}">${i}</div>`
  }
  return out
}

export function renderCodePage() {
  const f = activeForm()
  if (!f) return '<div class="empty-state">No form</div>'
  const src = generatePascal(f)
  const procs = findProcedureLines(src)
  const navOptions = [
    '<option value="0">(class declaration)</option>',
    ...procs.map((p) => `<option value="${p.line}">${escapeHtml(p.qualified)}</option>`),
  ].join('')
  return `
    <section class="code-page">
      <div class="code-toolbar">
        <select data-code-type-filter><option>Search for a type</option><option>${escapeHtml(f.className)}</option></select>
        <select data-code-navigator>${navOptions}</select>
      </div>
      <div class="code-editor">
        <div class="code-gutter" data-code-gutter>${renderGutter(src, state.diagnostics || [])}</div>
        <div class="code-surface">
          <pre class="code-highlight" data-code-highlight aria-hidden="true">${renderHighlight(src, state.diagnostics || [])}</pre>
          <textarea class="code-input" data-code-input spellcheck="false" wrap="off" autocomplete="off" autocorrect="off" autocapitalize="off">${escapeHtml(src)}</textarea>
        </div>
      </div>
      <div class="code-insight-popup" data-code-insight hidden></div>
      <section class="compiler-messages" data-compiler-messages>
        <header><strong>Messages</strong><span>${state.diagnostics?.length || 0} item(s)</span></header>
        <div class="diagnostic-list">${renderDiagnostics()}</div>
      </section>
      ${renderViewSwitcher()}
    </section>
  `
}
