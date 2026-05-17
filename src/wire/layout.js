import { state, persistState } from '../state.js'

const DEFAULT_LAYOUT = {
  leftDock: 279,
  rightDock: 297,
  leftTop: 376,
  rightTop: 486,
}

let drag = null
let globalsRegistered = false

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ensureLayout() {
  state.layoutSizes ||= { ...DEFAULT_LAYOUT }
  for (const [key, value] of Object.entries(DEFAULT_LAYOUT)) {
    state.layoutSizes[key] ??= value
  }
  return state.layoutSizes
}

function applyLayout() {
  const sizes = ensureLayout()
  const workspace = document.querySelector('.workspace')
  const leftDock = document.querySelector('.left-dock')
  const rightDock = document.querySelector('.right-dock')
  if (workspace) {
    workspace.style.gridTemplateColumns = `${sizes.leftDock}px 5px minmax(560px, 1fr) 5px ${sizes.rightDock}px`
  }
  if (leftDock) {
    leftDock.style.gridTemplateRows = `minmax(160px, ${sizes.leftTop}px) 5px minmax(210px, 1fr)`
  }
  if (rightDock) {
    rightDock.style.gridTemplateRows = `minmax(180px, ${sizes.rightTop}px) 5px minmax(180px, 1fr)`
  }
}

function updateDrag(drag, event) {
  const sizes = ensureLayout()
  const workspace = document.querySelector('.workspace')
  const bounds = workspace?.getBoundingClientRect()
  const maxSide = bounds ? Math.max(220, Math.floor(bounds.width * 0.42)) : 520

  if (drag.kind === 'left-dock') {
    sizes.leftDock = clamp(drag.startValue + event.clientX - drag.startX, 220, maxSide)
  } else if (drag.kind === 'right-dock') {
    sizes.rightDock = clamp(drag.startValue - (event.clientX - drag.startX), 240, maxSide)
  } else if (drag.kind === 'left-stack') {
    sizes.leftTop = clamp(drag.startValue + event.clientY - drag.startY, 140, Math.max(220, drag.dockHeight - 230))
  } else if (drag.kind === 'right-stack') {
    sizes.rightTop = clamp(drag.startValue + event.clientY - drag.startY, 160, Math.max(240, drag.dockHeight - 210))
  }
  applyLayout()
}

export function resetLayoutSizes() {
  state.layoutSizes = { ...DEFAULT_LAYOUT }
  applyLayout()
  persistState()
}

export function wireLayoutResize() {
  ensureLayout()

  document.querySelectorAll('[data-layout-resize]').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return
      const kind = handle.dataset.layoutResize
      const sizes = ensureLayout()
      const isRow = kind.endsWith('stack')
      const dock = kind.startsWith('left') ? document.querySelector('.left-dock') : document.querySelector('.right-dock')
      const startValue = {
        'left-dock': sizes.leftDock,
        'right-dock': sizes.rightDock,
        'left-stack': sizes.leftTop,
        'right-stack': sizes.rightTop,
      }[kind]
      drag = {
        kind,
        startValue,
        startX: event.clientX,
        startY: event.clientY,
        dockHeight: dock?.getBoundingClientRect().height || 600,
      }
      handle.classList.add('dragging')
      document.body.classList.add('is-resizing-layout', isRow ? 'row' : 'col')
      handle.setPointerCapture(event.pointerId)
      event.preventDefault()
    })
  })

  if (globalsRegistered) return
  globalsRegistered = true

  window.addEventListener('pointermove', (event) => {
    if (!drag) return
    updateDrag(drag, event)
  })

  window.addEventListener('pointerup', () => {
    if (!drag) return
    drag = null
    document.querySelectorAll('[data-layout-resize]').forEach((handle) => handle.classList.remove('dragging'))
    document.body.classList.remove('is-resizing-layout', 'row', 'col')
    persistState()
  })
}
