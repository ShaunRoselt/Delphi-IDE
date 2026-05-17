import { state, activeForm } from '../state.js'
import { COMPONENT_DEFS } from '../data.js'
import { escapeHtml, colorToCss } from '../util.js'
import { renderViewSwitcher } from './chrome.js'

function renderHandles() {
  return ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']
    .map((dir) => `<i class="component-handle ${dir}" data-comp-resize="${dir}"></i>`).join('')
}

function renderControlBody(c, def) {
  const p = c.props || {}
  switch (def.kind) {
    case 'button':
    case 'bitbtn':
      return `<span class="ctl-text">${escapeHtml(p.Caption || c.id)}</span>`
    case 'speedbutton':
      return `<span class="ctl-text">${escapeHtml(p.Caption || '')}</span>`
    case 'label':
      return `<span class="ctl-label">${escapeHtml(p.Caption || c.id)}</span>`
    case 'edit':
      return `<span class="ctl-edit">${escapeHtml(p.Text || c.id)}</span>`
    case 'memo':
      return `<span class="ctl-memo">${escapeHtml((p.Lines || []).join('\n'))}</span>`
    case 'checkbox':
      return `<span class="ctl-check ${p.Checked ? 'checked' : ''}">☐</span><span class="ctl-text">${escapeHtml(p.Caption || c.id)}</span>`
    case 'radio':
      return `<span class="ctl-radio ${p.Checked ? 'checked' : ''}">○</span><span class="ctl-text">${escapeHtml(p.Caption || c.id)}</span>`
    case 'listbox': {
      const items = p.Items && p.Items.length ? p.Items : ['(empty)']
      return `<div class="ctl-listbox">${items.slice(0, 8).map((i) => `<div>${escapeHtml(i)}</div>`).join('')}</div>`
    }
    case 'combobox':
      return `<span class="ctl-edit">${escapeHtml(p.Text || c.id)}</span><span class="ctl-combo-arrow">▼</span>`
    case 'groupbox':
      return `<fieldset class="ctl-group"><legend>${escapeHtml(p.Caption || c.id)}</legend></fieldset>`
    case 'panel':
      return `<span class="ctl-text">${escapeHtml(p.Caption || c.id)}</span>`
    case 'progressbar': {
      const range = (p.Max - p.Min) || 1
      const frac = Math.min(100, Math.max(0, ((p.Position - p.Min) / range) * 100))
      return `<div class="ctl-pb-track"><div class="ctl-pb-fill" style="width:${frac}%"></div></div>`
    }
    case 'trackbar': {
      const range = (p.Max - p.Min) || 1
      const frac = Math.min(100, Math.max(0, ((p.Position - p.Min) / range) * 100))
      return `<div class="ctl-tb-track"></div><div class="ctl-tb-thumb" style="left:${frac}%"></div>`
    }
    case 'updown':
      return '<div class="ctl-updown"><span>▲</span><span>▼</span></div>'
    case 'image':
      return '<div class="ctl-image">🖼</div>'
    case 'shape': {
      const isEllipse = typeof p.Shape === 'string' && (p.Shape.includes('Ellipse') || p.Shape.includes('Circle'))
      return `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${isEllipse ? '<ellipse cx="50" cy="50" rx="48" ry="48" />' : '<rect x="1" y="1" width="98" height="98" />'}</svg>`
    }
    case 'bevel':
      return ''
    case 'statictext':
      return `<span class="ctl-text">${escapeHtml(p.Caption || c.id)}</span>`
    case 'grid':
      return `<div class="ctl-grid">${Array.from({ length: 5 }).map(() =>
        `<div class="ctl-grid-row">${Array.from({ length: 5 }).map(() => '<div class="ctl-grid-cell"></div>').join('')}</div>`,
      ).join('')}</div>`
    case 'pagecontrol':
    case 'tabcontrol':
      return '<div class="ctl-tabs"><span class="ctl-tab active">Tab1</span><span class="ctl-tab">Tab2</span></div><div class="ctl-tab-body"></div>'
    case 'treeview':
      return '<div class="ctl-tree">▾ Root<br>&nbsp;&nbsp;▸ Item1<br>&nbsp;&nbsp;▸ Item2</div>'
    case 'listview':
      return '<div class="ctl-listview"><div class="ctl-lv-head">Name | Size | Date</div><div>File1.txt | 1KB | Today</div><div>File2.txt | 2KB | Today</div></div>'
    case 'statusbar':
      return '<span class="ctl-text">Ready</span>'
    case 'toolbar':
      return '<div class="ctl-toolbar"><span>▰</span><span>▣</span><span>⌕</span></div>'
    case 'paintbox':
      return '<div class="ctl-paintbox"></div>'
    case 'scrollbar':
      return '<div class="ctl-scrollbar"><span>◀</span><div class="ctl-sb-track"><div class="ctl-sb-thumb"></div></div><span>▶</span></div>'
    case 'nonvisual':
      return `<div class="ctl-nonvis">${COMPONENT_DEFS[c.type].icon}<br><small>${escapeHtml(c.id)}</small></div>`
    default:
      return ''
  }
}

export function renderVclControl(c) {
  const def = COMPONENT_DEFS[c.type]
  if (!def) return ''
  const isSelected = state.selection.includes(c.id)
  const sel = isSelected ? 'selected' : ''
  const style = `left:${c.left}px;top:${c.top}px;width:${c.width}px;height:${c.height}px`
  const attrs = `data-component="${c.id}" data-select-object="${c.id}"`
  const handles = isSelected ? renderHandles() : ''
  const body = renderControlBody(c, def)
  return `<div class="vcl-control ${def.kind} ${sel}" style="${style}" ${attrs}>${body}${handles}</div>`
}

export function renderDesignerPage() {
  const f = activeForm()
  if (!f) return '<div class="empty-state">No form open</div>'

  const isFormSel = state.selection.includes(f.name)
  const gridClass = state.showGrid ? 'show-grid' : ''
  const placingClass = state.paletteSelected ? 'placing-component' : ''
  const paletteHint = state.paletteSelected
    ? `<div class="palette-hint">Placing: <strong>${state.paletteSelected}</strong> — click on form to drop, Esc to cancel</div>`
    : ''
  const formHandles = isFormSel ? `
    <span class="resize-handle top-left" data-form-resize="top-left"></span>
    <span class="resize-handle top-right" data-form-resize="top-right"></span>
    <span class="resize-handle mid-right" data-form-resize="right"></span>
    <span class="resize-handle bottom-left" data-form-resize="bottom-left"></span>
    <span class="resize-handle bottom-center" data-form-resize="bottom"></span>
    <span class="resize-handle bottom-right" data-form-resize="bottom-right"></span>
  ` : ''

  return `
    <section class="designer-page">
      <div class="design-surface">
        ${paletteHint}
        <div class="selected-form-shell ${isFormSel ? 'selected' : ''}" style="width:${f.width}px;height:${f.height + 31}px" data-select-object="${f.name}">
          ${formHandles}
          <div class="vcl-form" style="background:${colorToCss(f.color)}">
            <header class="form-caption">
              <span class="form-icon">D</span>
              <span>${escapeHtml(f.caption)}</span>
              <span class="form-buttons"><button type="button">−</button><button type="button">□</button><button type="button">×</button></span>
            </header>
            <div class="form-client">
              <section class="design-client ${gridClass} ${placingClass}" data-design-canvas>
                ${f.components.map((c) => renderVclControl(c)).join('')}
              </section>
            </div>
          </div>
        </div>
      </div>
      ${renderViewSwitcher()}
    </section>
  `
}
