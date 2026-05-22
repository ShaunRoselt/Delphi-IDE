import { state } from '../state.js'
import { executeHandler, stopProgram } from '../runtime.js'
import { renderApp } from '../main.js'

function fire(comp, eventName) {
  const handler = comp.events?.[eventName]
  if (!handler) return false
  executeHandler(handler)
  renderApp()
  return true
}

export function wireRuntime() {
  if (!state.running) return

  // Legacy stop action (old selector kept for compatibility)
  document.querySelectorAll('[data-runtime-action]').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.dataset.runtimeAction === 'stop') {
        stopProgram()
        renderApp()
      }
    })
  })

  // ── Drag (move window by caption) ──────────────────────────────────────
  const caption = document.querySelector('[data-floatwin-drag]')
  if (caption) {
    caption.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return
      const win = document.querySelector('[data-floatwin]')
      if (!win) return
      const ox = e.clientX - state.runtimeWindow.x
      const oy = e.clientY - state.runtimeWindow.y
      const onMove = (e) => {
        state.runtimeWindow.x = e.clientX - ox
        state.runtimeWindow.y = e.clientY - oy
        win.style.left = `${state.runtimeWindow.x}px`
        win.style.top = `${state.runtimeWindow.y}px`
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      e.preventDefault()
    })
  }

  // ── Resize handles ─────────────────────────────────────────────────────
  document.querySelectorAll('[data-fw-resize]').forEach((handle) => {
    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      const dir = handle.dataset.fwResize
      const win = document.querySelector('[data-floatwin]')
      if (!win) return
      const startX = e.clientX, startY = e.clientY
      const startW = state.runtimeWindow.width
      const startH = state.runtimeWindow.height
      const startLeft = state.runtimeWindow.x
      const startTop = state.runtimeWindow.y
      const MIN_W = 140, MIN_H = 60

      const onMove = (e) => {
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        let { x, y, width, height } = { x: startLeft, y: startTop, width: startW, height: startH }
        if (dir.includes('e')) width = Math.max(MIN_W, startW + dx)
        if (dir.includes('s')) height = Math.max(MIN_H, startH + dy)
        if (dir.includes('w')) { x = startLeft + dx; width = Math.max(MIN_W, startW - dx) }
        if (dir.includes('n')) { y = startTop + dy; height = Math.max(MIN_H, startH - dy) }
        state.runtimeWindow.x = x
        state.runtimeWindow.y = y
        state.runtimeWindow.width = width
        state.runtimeWindow.height = height
        win.style.left = `${x}px`
        win.style.top = `${y}px`
        win.style.width = `${width}px`
        win.style.height = `${height + 31}px`
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      e.preventDefault()
    })
  })

  // ── Action buttons (minimize, maximize, stop) ──────────────────────────
  document.querySelectorAll('[data-floatwin-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.floatwinAction
      if (action === 'stop') { stopProgram(); renderApp(); return }
      if (action === 'minimize') {
        state.runtimeWindow.minimized = !state.runtimeWindow.minimized
        renderApp()
        return
      }
      if (action === 'maximize') {
        const win = document.querySelector('[data-floatwin]')
        if (!win) return
        if (state.runtimeWindow._savedPos) {
          Object.assign(state.runtimeWindow, state.runtimeWindow._savedPos)
          delete state.runtimeWindow._savedPos
        } else {
          state.runtimeWindow._savedPos = {
            x: state.runtimeWindow.x,
            y: state.runtimeWindow.y,
            width: state.runtimeWindow.width,
            height: state.runtimeWindow.height,
          }
          state.runtimeWindow.x = 0
          state.runtimeWindow.y = 0
          state.runtimeWindow.width = window.innerWidth
          state.runtimeWindow.height = window.innerHeight - 31
        }
        renderApp()
      }
    })
  })

  // ── Component event wiring ─────────────────────────────────────────────
  for (const comp of state.running.components) {
    const el = document.querySelector(`[data-runtime-comp="${comp.id}"]`)
    if (!el) continue

    switch (comp.type) {
      case 'TButton':
      case 'TBitBtn':
      case 'TSpeedButton':
      case 'TLabel':
      case 'TStaticText':
      case 'TPanel':
      case 'TImage':
      case 'TShape':
        el.addEventListener('click', () => fire(comp, 'OnClick'))
        break

      case 'TEdit':
      case 'TMaskEdit':
        el.addEventListener('input', () => { comp.props.Text = el.value })
        el.addEventListener('change', () => {
          comp.props.Text = el.value
          fire(comp, 'OnChange')
        })
        el.addEventListener('click', () => fire(comp, 'OnClick'))
        break

      case 'TMemo':
        el.addEventListener('input', () => { comp.props.Lines = el.value.split('\n') })
        el.addEventListener('change', () => {
          comp.props.Lines = el.value.split('\n')
          fire(comp, 'OnChange')
        })
        break

      case 'TCheckBox':
      case 'TRadioButton': {
        const cb = el.querySelector('input')
        if (!cb) break
        cb.addEventListener('change', () => {
          comp.props.Checked = cb.checked
          if (!fire(comp, 'OnClick')) renderApp()
        })
        break
      }

      case 'TListBox':
      case 'TComboBox':
        el.addEventListener('change', () => {
          comp.props.ItemIndex = el.selectedIndex
          comp.props.Text = el.value
          fire(comp, 'OnChange') || fire(comp, 'OnClick')
        })
        break

      case 'TTrackBar':
        el.addEventListener('input', () => { comp.props.Position = Number(el.value) })
        el.addEventListener('change', () => {
          comp.props.Position = Number(el.value)
          fire(comp, 'OnChange')
        })
        break

      default:
        el.addEventListener('click', () => fire(comp, 'OnClick'))
    }
  }
}
