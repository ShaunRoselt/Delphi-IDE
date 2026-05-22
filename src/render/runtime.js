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
  const w = state.runtimeWindow
  if (!w) return ''

  const minimized = w.minimized
  const clientStyle = minimized ? ' style="display:none"' : ''
  const winClass = minimized ? 'runtime-floatwin minimized' : 'runtime-floatwin'

  return `
    <div class="${winClass}" data-floatwin style="left:${w.x}px;top:${w.y}px;width:${w.width}px;height:${w.height + 31}px">
      <header class="runtime-floatwin-caption" data-floatwin-drag>
        <span class="form-icon">D</span>
        <span class="runtime-title">${escapeHtml(r.caption)}</span>
        <div class="form-buttons">
          <button type="button" title="Minimize" data-floatwin-action="minimize">−</button>
          <button type="button" title="Maximize" data-floatwin-action="maximize">□</button>
          <button type="button" title="Stop/Close" data-floatwin-action="stop">×</button>
        </div>
      </header>
      <div class="runtime-client"${clientStyle} style="background:${colorToCss(r.color)}">
        ${r.components.map(renderRuntimeControl).join('')}
      </div>
      <div class="fw-resize fw-n" data-fw-resize="n"></div>
      <div class="fw-resize fw-ne" data-fw-resize="ne"></div>
      <div class="fw-resize fw-e" data-fw-resize="e"></div>
      <div class="fw-resize fw-se" data-fw-resize="se"></div>
      <div class="fw-resize fw-s" data-fw-resize="s"></div>
      <div class="fw-resize fw-sw" data-fw-resize="sw"></div>
      <div class="fw-resize fw-w" data-fw-resize="w"></div>
      <div class="fw-resize fw-nw" data-fw-resize="nw"></div>
    </div>
  `
}
