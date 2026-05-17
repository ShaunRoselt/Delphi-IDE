import { state } from '../state.js'
import { escapeHtml, colorToCss } from '../util.js'

function controlStyle(c, extra = '') {
  return `position:absolute;left:${c.left}px;top:${c.top}px;width:${c.width}px;height:${c.height}px;${extra}`
}

function renderRuntimeControl(c) {
  const p = c.props || {}
  if (p.Visible === false) return ''
  const id = `data-runtime-comp="${c.id}"`
  const disabled = p.Enabled === false ? 'disabled' : ''
  const style = controlStyle(c)

  switch (c.type) {
    case 'TButton':
    case 'TBitBtn':
    case 'TSpeedButton':
      return `<button class="rt-btn" style="${style}" ${id} ${disabled} type="button">${escapeHtml(p.Caption || c.id)}</button>`

    case 'TLabel':
      return `<span class="rt-label" style="${style}" ${id}>${escapeHtml(p.Caption || c.id)}</span>`

    case 'TStaticText':
      return `<span class="rt-static" style="${style}" ${id}>${escapeHtml(p.Caption || '')}</span>`

    case 'TEdit':
    case 'TMaskEdit':
      return `<input class="rt-edit" style="${style}" ${id} value="${escapeHtml(p.Text ?? '')}" ${p.ReadOnly ? 'readonly' : ''} ${disabled} />`

    case 'TMemo':
      return `<textarea class="rt-memo" style="${style}" ${id} ${p.ReadOnly ? 'readonly' : ''} ${disabled}>${escapeHtml((p.Lines || []).join('\n'))}</textarea>`

    case 'TCheckBox':
      return `<label class="rt-check" style="${style}"><input type="checkbox" ${id} ${p.Checked ? 'checked' : ''} ${disabled}/><span>${escapeHtml(p.Caption || c.id)}</span></label>`

    case 'TRadioButton':
      return `<label class="rt-radio" style="${style}"><input type="radio" ${id} name="rt-radio-${c.id.replace(/\d+$/, '')}" ${p.Checked ? 'checked' : ''} ${disabled}/><span>${escapeHtml(p.Caption || c.id)}</span></label>`

    case 'TListBox': {
      const items = p.Items || []
      const size = Math.max(2, Math.min(items.length || 1, Math.floor(c.height / 16)))
      return `<select class="rt-listbox" style="${style}" ${id} size="${size}" ${disabled}>${items.map((it, i) => `<option ${p.ItemIndex === i ? 'selected' : ''}>${escapeHtml(it)}</option>`).join('')}</select>`
    }

    case 'TComboBox': {
      const items = p.Items || []
      return `<select class="rt-combo" style="${style}" ${id} ${disabled}>${items.map((it, i) => `<option ${p.ItemIndex === i ? 'selected' : ''}>${escapeHtml(it)}</option>`).join('')}</select>`
    }

    case 'TPanel':
      return `<div class="rt-panel" style="${style}" ${id}>${escapeHtml(p.Caption || '')}</div>`

    case 'TGroupBox':
      return `<fieldset class="rt-groupbox" style="${style}" ${id}><legend>${escapeHtml(p.Caption || c.id)}</legend></fieldset>`

    case 'TProgressBar': {
      const range = ((p.Max ?? 100) - (p.Min ?? 0)) || 1
      const frac = Math.min(100, Math.max(0, (((p.Position ?? 0) - (p.Min ?? 0)) / range) * 100))
      return `<div class="rt-pb" style="${style}" ${id}><div class="rt-pb-fill" style="width:${frac}%"></div></div>`
    }

    case 'TTrackBar': {
      const min = p.Min ?? 0
      const max = p.Max ?? 10
      return `<input type="range" class="rt-track" style="${style}" ${id} min="${min}" max="${max}" value="${p.Position ?? min}" ${disabled} />`
    }

    case 'TImage':
      return `<div class="rt-image" style="${style}" ${id}>🖼</div>`

    case 'TShape': {
      const isEllipse = typeof p.Shape === 'string' && (p.Shape.includes('Ellipse') || p.Shape.includes('Circle'))
      return `<svg class="rt-shape" style="${style}" ${id} viewBox="0 0 100 100" preserveAspectRatio="none">${isEllipse ? '<ellipse cx="50" cy="50" rx="48" ry="48" />' : '<rect x="1" y="1" width="98" height="98" />'}</svg>`
    }

    // Non-visual components are not rendered in the runtime form.
    case 'TTimer':
    case 'TOpenDialog':
    case 'TSaveDialog':
    case 'TColorDialog':
    case 'TFontDialog':
      return ''

    default:
      return ''
  }
}

export function renderRuntime() {
  if (!state.running) return ''
  const r = state.running
  return `
    <div class="runtime-overlay">
      <div class="runtime-window" style="width:${r.width}px;height:${r.height + 31}px">
        <header class="runtime-caption">
          <span class="form-icon">D</span>
          <span class="runtime-title">${escapeHtml(r.caption)}</span>
          <span class="form-buttons">
            <button type="button" title="Minimize">−</button>
            <button type="button" title="Maximize">□</button>
            <button type="button" title="Stop" data-runtime-action="stop">×</button>
          </span>
        </header>
        <div class="runtime-client" style="background:${colorToCss(r.color)}">
          ${r.components.map(renderRuntimeControl).join('')}
        </div>
      </div>
    </div>
  `
}
