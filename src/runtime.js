// Runtime entry points for the running form. `startProgram` snapshots the
// current form and parses the unit into an executable Program. Component
// events fire `executeHandler`, which dispatches through the interpreter
// against that Program so mutations land on the running snapshot — never
// the designer-time form definition.

import { state, activeForm } from './state.js'
import { generatePascal } from './pascal.js'
import { makeProgram, InterpreterRuntimeError, ParseError, LexError } from './lang/interpreter.js'

let currentProgram = null

function makeHost() {
  return {
    getComponent: (id) => state.running?.components.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null,
    isFormName: (name) => state.running?.formName?.toLowerCase() === name.toLowerCase(),
    runningState: () => state.running,
    showMessage: (msg) => window.alert(msg),
    showForm: () => {},
    hideForm: () => {},
    closeForm: () => { state.running = null },
    focusComponent: (id) => {
      setTimeout(() => {
        const el = document.querySelector(`[data-runtime-comp="${id}"]`)
        if (!el) return
        const input = el.querySelector('input, textarea, select') || el
        input.focus?.()
      }, 0)
    },
  }
}

export function startProgram() {
  const f = activeForm()
  if (!f) return
  const source = generatePascal(f)
  state.running = {
    formName: f.name,
    formClassName: f.className,
    caption: f.caption,
    width: f.width,
    height: f.height,
    color: f.color,
    components: f.components.map((c) => ({
      id: c.id,
      type: c.type,
      left: c.left,
      top: c.top,
      width: c.width,
      height: c.height,
      props: structuredClone(c.props),
      events: { ...c.events },
    })),
    formCode: source,
  }
  state.runtimeWindow = {
    x: Math.max(20, (window.innerWidth - f.width) / 2 - 60),
    y: Math.max(20, (window.innerHeight - f.height) / 2 - 60),
    width: f.width,
    height: f.height,
    minimized: false,
  }
  try {
    currentProgram = makeProgram(source, makeHost())
    state.statusMessage = `${f.className} running`
  } catch (err) {
    state.running = null
    currentProgram = null
    if (err instanceof ParseError || err instanceof LexError) {
      state.statusMessage = `[dcc32 Error] (${err.line},${err.col}) ${err.message}`
    } else {
      state.statusMessage = `Runtime startup failed: ${err.message}`
    }
  }
}

export function stopProgram() {
  state.running = null
  currentProgram = null
  state.statusMessage = 'Program terminated.'
}

export function getRuntimeComponent(id) {
  return state.running?.components.find((c) => c.id === id)
}

export function executeHandler(handlerName) {
  if (!state.running || !currentProgram) return
  try {
    currentProgram.callHandler(handlerName, { __sender: true })
  } catch (err) {
    if (err instanceof InterpreterRuntimeError) {
      window.alert(`Runtime error in ${handlerName} at (${err.line},${err.col}):\n${err.message}`)
    } else {
      window.alert(`Runtime error in ${handlerName}:\n${err.message || err}`)
    }
  }
}
