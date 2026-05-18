import { DELPHI_COLORS } from './data.js'

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

export function listItems(items, renderer) {
  return items.map(renderer).join('')
}

export function iconButton(label, glyph, action) {
  return `<button class="tool-button" type="button" title="${label}" aria-label="${label}" data-action="${action || ''}">${glyph}</button>`
}

export function panel(title, body, className = '') {
  return `
    <section class="panel ${className}">
      <header class="panel-header">
        <span>${title}</span>
        <div class="panel-tools" aria-hidden="true"><button type="button">⌖</button><button type="button">×</button></div>
      </header>
      <div class="panel-body">${body}</div>
    </section>
  `
}

export function colorToCss(v) {
  if (typeof v === 'string') {
    if (DELPHI_COLORS[v]) return DELPHI_COLORS[v]
    if (v.startsWith('#')) return v
    if (v.startsWith('$')) {
      const hex = v.slice(1).padStart(6, '0')
      const b = hex.substr(0, 2), g = hex.substr(2, 2), r = hex.substr(4, 2)
      return `#${r}${g}${b}`
    }
  }
  return '#f0f0f0'
}
