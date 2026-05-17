import { state } from '../state.js'
import { renderRuntimeComponent } from '../components/index.js'
import { escapeHtml, colorToCss } from '../util.js'

function controlStyle(c, extra = '') {
  return `position:absolute;left:${c.left}px;top:${c.top}px;width:${c.width}px;height:${c.height}px;${extra}`
}

function renderRuntimeControl(c) {
  const id = `data-runtime-comp="${c.id}"`
  const style = controlStyle(c)
  return renderRuntimeComponent(c, style, { id })
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
