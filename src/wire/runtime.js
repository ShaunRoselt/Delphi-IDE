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

  document.querySelectorAll('[data-runtime-action]').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.dataset.runtimeAction === 'stop') {
        stopProgram()
        renderApp()
      }
    })
  })

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
