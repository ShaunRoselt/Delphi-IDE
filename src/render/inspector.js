import { state, activeForm, getSelected } from '../state.js'
import { COMMON_PROPS, EVENT_LIST, FORM_EVENTS } from '../data.js'
import { escapeHtml, panel, colorToCss } from '../util.js'

function renderPropertyRow(name, value, type) {
  const display = Array.isArray(value)
    ? '(TStrings)'
    : value === true ? 'True' : value === false ? 'False' : String(value)

  if (type === 'readonly') {
    return `<div class="property-row"><label>${name}</label><input value="${escapeHtml(display)}" readonly /></div>`
  }
  if (type === 'bool') {
    return `<div class="property-row"><label>${name}</label><select data-prop="${name}"><option ${value ? 'selected' : ''}>True</option><option ${!value ? 'selected' : ''}>False</option></select></div>`
  }
  if (type === 'color') {
    return `<div class="property-row"><label>${name}</label><div class="color-cell"><span class="color-swatch" style="background:${colorToCss(value)}"></span><input data-prop="${name}" value="${escapeHtml(display)}" /></div></div>`
  }
  if (typeof type === 'string' && type.startsWith('enum:')) {
    const opts = type.slice(5).split(',')
    return `<div class="property-row"><label>${name}</label><select data-prop="${name}">${opts.map((o) => `<option ${o === value ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`
  }
  if (type === 'strings') {
    return `<div class="property-row"><label>${name}</label><input class="strings-editor" data-prop="${name}" value="${escapeHtml((value || []).join(' | '))}" placeholder="item1 | item2" /></div>`
  }
  return `<div class="property-row"><label>${name}</label><input data-prop="${name}" value="${escapeHtml(display)}" /></div>`
}

function buildFormRows(f) {
  return [
    ['Name', f.name, 'string'],
    ['Caption', f.caption, 'string'],
    ['ClassName', f.className, 'readonly'],
    ['ClientWidth', f.width, 'int'],
    ['ClientHeight', f.height, 'int'],
    ['BorderStyle', f.borderStyle, 'enum:bsNone,bsSingle,bsSizeable,bsDialog,bsToolWindow,bsSizeToolWin'],
    ['Position', f.position, 'enum:poDesigned,poDefault,poDefaultPosOnly,poDefaultSizeOnly,poScreenCenter,poDesktopCenter,poMainFormCenter,poOwnerFormCenter'],
    ['Color', f.color, 'color'],
  ]
}

function buildComponentRows(comp) {
  const rows = [
    ['Name', comp.id, 'string'],
    ['Left', comp.left, 'int'],
    ['Top', comp.top, 'int'],
    ['Width', comp.width, 'int'],
    ['Height', comp.height, 'int'],
  ]
  for (const [pname, ptype] of COMMON_PROPS[comp.type] || []) {
    rows.push([pname, comp.props[pname], ptype])
  }
  return rows
}

function renderProperties(selected, f) {
  const filter = state.inspector.filter.toLowerCase()
  const rows = selected === f ? buildFormRows(f) : buildComponentRows(selected)
  const visible = filter ? rows.filter(([n]) => n.toLowerCase().includes(filter)) : rows
  return `<div class="property-grid">${visible.map(([n, v, t]) => renderPropertyRow(n, v, t)).join('')}</div>`
}

function renderEvents(selected, f) {
  const events = selected === f ? FORM_EVENTS : EVENT_LIST
  const map = selected === f ? (f.events ||= {}) : (selected.events ||= {})
  return `<div class="property-grid">${events.map((e) => `<div class="property-row"><label>${e}</label><input data-event="${e}" value="${escapeHtml(map[e] || '')}" placeholder="(no handler)" /></div>`).join('')}</div>`
}

export function renderObjectInspector() {
  const f = activeForm()
  if (!f) return panel('Object Inspector', '<div class="empty-state">No form open</div>', 'object-inspector')

  const selected = getSelected()
  const isForm = selected === f
  const objectName = isForm ? f.name : selected.id
  const className = isForm ? f.className : selected.type
  const dropdownItems = [f.name, ...f.components.map((c) => c.id)]
  const body = state.inspector.tab === 'events' ? renderEvents(selected, f) : renderProperties(selected, f)

  return panel(
    'Object Inspector',
    `
      <div class="object-select">
        <select data-action="select-object">
          ${dropdownItems.map((id) => `<option ${id === objectName ? 'selected' : ''}>${id}</option>`).join('')}
        </select>
        <span>${className}</span>
      </div>
      <div class="inspector-tabs">
        <button class="${state.inspector.tab === 'properties' ? 'active' : ''}" data-inspector-tab="properties" type="button">Properties</button>
        <button class="${state.inspector.tab === 'events' ? 'active' : ''}" data-inspector-tab="events" type="button">Events</button>
        <input aria-label="Filter properties" placeholder="Filter..." data-action="inspector-filter" value="${escapeHtml(state.inspector.filter)}" />
      </div>
      ${body}
      <div class="inspector-links">
        <button type="button" data-action="quick-edit">Quick Edit...</button>
        <button type="button" data-action="bind-visually">Bind Visually...</button>
      </div>
    `,
    'object-inspector',
  )
}
