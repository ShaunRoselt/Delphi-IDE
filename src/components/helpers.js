import { escapeHtml } from '../util.js'

export function textBody(c, className = 'ctl-text', fallback = c.id) {
  return `<span class="${className}">${escapeHtml(c.props?.Caption || fallback)}</span>`
}

export function editBody(c) {
  return `<span class="ctl-edit">${escapeHtml(c.props?.Text || c.id)}</span>`
}

export function memoBody(c) {
  return `<span class="ctl-memo">${escapeHtml((c.props?.Lines || []).join('\n'))}</span>`
}

export function buttonRuntime(c, style, attrs) {
  const p = c.props || {}
  const disabled = p.Enabled === false ? 'disabled' : ''
  return `<button class="rt-btn" style="${style}" ${attrs.id} ${disabled} type="button">${escapeHtml(p.Caption || c.id)}</button>`
}

export function labelRuntime(c, style, attrs) {
  return `<span class="rt-label" style="${style}" ${attrs.id}>${escapeHtml(c.props?.Caption || c.id)}</span>`
}

export function staticRuntime(c, style, attrs) {
  return `<span class="rt-static" style="${style}" ${attrs.id}>${escapeHtml(c.props?.Caption || '')}</span>`
}

export function editRuntime(c, style, attrs) {
  const p = c.props || {}
  const disabled = p.Enabled === false ? 'disabled' : ''
  return `<input class="rt-edit" style="${style}" ${attrs.id} value="${escapeHtml(p.Text ?? '')}" ${p.ReadOnly ? 'readonly' : ''} ${disabled} />`
}

export function memoRuntime(c, style, attrs) {
  const p = c.props || {}
  const disabled = p.Enabled === false ? 'disabled' : ''
  return `<textarea class="rt-memo" style="${style}" ${attrs.id} ${p.ReadOnly ? 'readonly' : ''} ${disabled}>${escapeHtml((p.Lines || []).join('\n'))}</textarea>`
}

export function emptyRuntime() {
  return ''
}
