import { state, activeForm, getSelected } from '../state.js'
import { COMMON_PROPS } from '../data.js'
import { escapeHtml } from '../util.js'

function field(name, label, value, type = 'text') {
  return `
    <label class="quick-field">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" value="${escapeHtml(value ?? '')}" type="${type}" />
    </label>
  `
}

function quickComponentFields(comp) {
  const rows = [
    field('Name', 'Name', comp.id),
    field('Left', 'Left', comp.left, 'number'),
    field('Top', 'Top', comp.top, 'number'),
    field('Width', 'Width', comp.width, 'number'),
    field('Height', 'Height', comp.height, 'number'),
  ]
  const quickProps = new Set(['Caption', 'Text', 'Lines', 'Items'])
  for (const [name] of COMMON_PROPS[comp.type] || []) {
    if (!quickProps.has(name)) continue
    const value = Array.isArray(comp.props[name]) ? comp.props[name].join(' | ') : comp.props[name]
    rows.push(field(name, name, value))
  }
  return rows.join('')
}

function quickFormFields(form) {
  return [
    field('Name', 'Name', form.name),
    field('Caption', 'Caption', form.caption),
    field('ClientWidth', 'ClientWidth', form.width, 'number'),
    field('ClientHeight', 'ClientHeight', form.height, 'number'),
    field('Color', 'Color', form.color),
  ].join('')
}

export function renderQuickEdit() {
  if (!state.quickEditOpen) return ''
  const form = activeForm()
  const selected = getSelected()
  if (!form || !selected) return ''
  const isForm = selected === form
  const title = isForm ? `${form.name}: ${form.className}` : `${selected.id}: ${selected.type}`
  const fields = isForm ? quickFormFields(form) : quickComponentFields(selected)

  return `
    <div class="designer-modal-backdrop" data-quick-edit-backdrop>
      <form class="quick-edit-dialog" data-quick-edit-form>
        <header>
          <strong>Quick Edit</strong>
          <button type="button" data-action="quick-edit-close" aria-label="Close">×</button>
        </header>
        <div class="quick-edit-target">${escapeHtml(title)}</div>
        <div class="quick-edit-fields">${fields}</div>
        <footer>
          <button type="button" data-action="quick-edit-close">Cancel</button>
          <button type="submit">Apply</button>
        </footer>
      </form>
    </div>
  `
}

function menuButton(action, label, disabled = false) {
  return `<button type="button" data-context-action="${action}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)}</button>`
}

export function renderDesignerContextMenu() {
  const menu = state.contextMenu
  if (!menu) return ''
  const form = activeForm()
  const hasComponent = form && state.selection.some((id) => form.components.some((c) => c.id === id))
  const hasClipboard = !!state.clipboard?.length
  const left = Math.max(4, Math.min(menu.x, window.innerWidth - 230))
  const top = Math.max(4, Math.min(menu.y, window.innerHeight - 320))

  return `
    <div class="designer-context-menu" style="left:${left}px;top:${top}px" data-designer-context-menu>
      ${menuButton('quick-edit', 'Quick Edit...')}
      ${menuButton('view-code', 'View as Text')}
      <div class="context-sep"></div>
      ${menuButton('cut', 'Cut', !hasComponent)}
      ${menuButton('copy', 'Copy', !hasComponent)}
      ${menuButton('paste', 'Paste', !hasClipboard)}
      ${menuButton('delete', 'Delete', !hasComponent)}
      <div class="context-sep"></div>
      ${menuButton('bring-front', 'Bring to Front', !hasComponent)}
      ${menuButton('send-back', 'Send to Back', !hasComponent)}
      <div class="context-sep"></div>
      ${menuButton('select-all', 'Select All')}
      ${menuButton('toggle-grid', `${state.showGrid ? 'Hide' : 'Show'} Grid`)}
      ${menuButton('toggle-snap', `${state.snapToGrid ? 'Disable' : 'Enable'} Snap to Grid`)}
      ${menuButton('reset-layout', 'Reset IDE Layout')}
    </div>
  `
}
