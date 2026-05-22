import { state, activeForm } from '../state.js'
import {
  generatePascal, findProcedureLines, findNavigationSections, findTypeLines,
} from '../pascal.js'
import { highlightPascalFull } from '../lang/highlighter.js'
import { escapeHtml } from '../util.js'
import { renderViewSwitcher } from './chrome.js'


function escapeRe(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findSearchMatches(src, query) {
  if (!query.trim()) return []
  const re = new RegExp(escapeRe(query.trim()), 'gi')
  const matches = []
  let match
  while ((match = re.exec(src))) {
    matches.push({ index: match.index, length: match[0].length })
    if (match[0].length === 0) re.lastIndex++
  }
  return matches
}

function renderSearchOverlay(src, search) {
  const query = search?.query || ''
  const matches = findSearchMatches(src, query)
  if (!query.trim() || !matches.length) return escapeHtml(src || ' ')
  let out = ''
  let pos = 0
  matches.forEach((m, idx) => {
    out += escapeHtml(src.slice(pos, m.index))
    const cls = idx === search.activeIndex ? 'code-search-mark active' : 'code-search-mark'
    out += `<span class="${cls}">${escapeHtml(src.slice(m.index, m.index + m.length))}</span>`
    pos = m.index + m.length
  })
  out += escapeHtml(src.slice(pos))
  return out || ' '
}

function renderFindBar(src) {
  const search = state.codeSearch || { open: false, query: '', activeIndex: 0, matches: [] }
  const matches = findSearchMatches(src, search.query)
  const current = matches.length ? Math.min(search.activeIndex + 1, matches.length) : 0
  return `
    <div class="code-findbar" data-code-findbar ${search.open ? '' : 'hidden'}>
      <label>Find</label>
      <input data-code-find value="${escapeHtml(search.query || '')}" autocomplete="off" spellcheck="false" />
      <span data-code-find-count>${current} of ${matches.length}</span>
      <button type="button" title="Previous match" data-code-find-prev>▲</button>
      <button type="button" title="Next match" data-code-find-next>▼</button>
      <label>Line</label>
      <input class="line-jump-input" data-code-line-input inputmode="numeric" />
      <button type="button" data-code-line-go>Go</button>
      <button type="button" title="Close" data-code-find-close>×</button>
    </div>
  `
}

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
  return highlightPascalFull(src || ' ', diagnostics)
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
  const sections = findNavigationSections(src)
  const types = findTypeLines(src)
  const procs = findProcedureLines(src)
  const sectionOptions = [
    '<option value="0">Top of File</option>',
    ...sections.slice(1).map((p) => `<option value="${p.line}">${escapeHtml(p.label)}</option>`),
  ].join('')
  const typeOptions = [
    '<option value="0">Search for a type</option>',
    ...types.map((p) => `<option value="${p.line}">${escapeHtml(p.name)}</option>`),
  ].join('')
  const navOptions = [
    '<option value="0">Search for a method</option>',
    ...procs.map((p) => `<option value="${p.line}">${escapeHtml(p.qualified)}</option>`),
  ].join('')
  return `
    <section class="code-page">
      <div class="code-toolbar">
        <select data-code-section-navigator>${sectionOptions}</select>
        <select data-code-type-filter>${typeOptions}</select>
        <select data-code-navigator>${navOptions}</select>
      </div>
      ${renderFindBar(src)}
      <div class="code-editor">
        <div class="code-gutter" data-code-gutter>${renderGutter(src, state.diagnostics || [])}</div>
        <div class="code-surface">
          <pre class="code-highlight" data-code-highlight aria-hidden="true">${renderHighlight(src, state.diagnostics || [])}</pre>
          <pre class="code-search-layer" data-code-search-layer aria-hidden="true">${renderSearchOverlay(src, state.codeSearch)}</pre>
          <textarea class="code-input" data-code-input spellcheck="false" wrap="off" autocomplete="off" autocorrect="off" autocapitalize="off">${escapeHtml(src)}</textarea>
        </div>
      </div>
      <div class="code-insight-popup" data-code-insight hidden></div>
      <div class="code-param-hint" data-code-param-hint hidden></div>
      <section class="compiler-messages" data-compiler-messages>
        <header><strong>Messages</strong><span>${state.diagnostics?.length || 0} item(s)</span></header>
        <div class="diagnostic-list">${renderDiagnostics()}</div>
      </section>
      ${renderViewSwitcher()}
    </section>
  `
}
