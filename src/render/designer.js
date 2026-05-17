import { state, activeForm } from '../state.js'
import { COMPONENT_DEFS } from '../data.js'
import { renderDesignerComponent } from '../components/index.js'
import { escapeHtml, colorToCss } from '../util.js'
import { renderViewSwitcher } from './chrome.js'

function renderHandles() {
  return ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']
    .map((dir) => `<i class="component-handle ${dir}" data-comp-resize="${dir}"></i>`).join('')
}

export function renderVclControl(c) {
  const def = COMPONENT_DEFS[c.type]
  if (!def) return ''
  const isSelected = state.selection.includes(c.id)
  const sel = isSelected ? 'selected' : ''
  const style = `left:${c.left}px;top:${c.top}px;width:${c.width}px;height:${c.height}px`
  const attrs = `data-component="${c.id}" data-select-object="${c.id}"`
  const handles = isSelected ? renderHandles() : ''
  const body = renderDesignerComponent(c)
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
