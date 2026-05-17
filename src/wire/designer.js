import { state, activeForm, setSelection, snap } from '../state.js'
import { addComponent, createHandlerForComponent } from '../actions.js'
import { renderApp } from '../main.js'

let lastClickId = null
let lastClickTime = 0
const DBLCLICK_MS = 400
const CLICK_SLOP = 4

function jumpToHandler(handlerName) {
  const ed = document.querySelector('[data-code-editor]')
  if (!ed) return
  const lines = [...ed.querySelectorAll('.code-line')]
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].textContent.includes(`.${handlerName}(`)) {
      // procedure decl is `procedure X.Foo(...)`, body line `{ TODO: Foo body }` is two lines down.
      const target = lines[i + 2] || lines[i]
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      const textSpan = target.querySelector('.code-text')
      if (textSpan) {
        const range = document.createRange()
        range.selectNodeContents(textSpan)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
      ed.focus()
      return
    }
  }
}

function startMarquee(canvas, e, f) {
  const rect = canvas.getBoundingClientRect()
  const marquee = { x0: e.clientX - rect.left, y0: e.clientY - rect.top, rect }
  const el = document.createElement('div')
  el.className = 'marquee-rect'
  el.style.left = `${marquee.x0}px`
  el.style.top = `${marquee.y0}px`
  canvas.appendChild(el)
  marquee.el = el
  if (!e.shiftKey) setSelection([f.name])
  return marquee
}

function updateMarquee(marquee, e) {
  const rect = marquee.rect
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  const x = Math.min(marquee.x0, cx)
  const y = Math.min(marquee.y0, cy)
  const w = Math.abs(cx - marquee.x0)
  const h = Math.abs(cy - marquee.y0)
  marquee.el.style.left = `${x}px`
  marquee.el.style.top = `${y}px`
  marquee.el.style.width = `${w}px`
  marquee.el.style.height = `${h}px`
  marquee.box = { x, y, w, h }
}

function finishMarquee(marquee, f) {
  const box = marquee.box
  if (box && box.w > 3 && box.h > 3) {
    const hit = f.components.filter((c) =>
      c.left >= box.x && c.top >= box.y
      && c.left + c.width <= box.x + box.w
      && c.top + c.height <= box.y + box.h,
    )
    if (hit.length) setSelection(hit.map((c) => c.id))
  }
  marquee.el?.remove()
}

function markDomSelection() {
  document.querySelectorAll('[data-component]').forEach((el) => {
    el.classList.toggle('selected', state.selection.includes(el.dataset.component))
  })
  document.querySelectorAll('.component-handle').forEach((handle) => handle.remove())
}

function syncInspectorMetric(name, value) {
  const input = document.querySelector(`[data-prop="${name}"]`)
  if (input) input.value = String(value)
}

function syncComponentInspector(c) {
  if (!state.selection.includes(c.id)) return
  syncInspectorMetric('Left', c.left)
  syncInspectorMetric('Top', c.top)
  syncInspectorMetric('Width', c.width)
  syncInspectorMetric('Height', c.height)
}

function syncFormInspector(f) {
  if (!state.selection.includes(f.name)) return
  syncInspectorMetric('ClientWidth', f.width)
  syncInspectorMetric('ClientHeight', f.height)
}

function applyMove(drag, f, dx, dy) {
  for (const o of drag.originals) {
    const c = f.components.find((x) => x.id === o.id)
    if (!c) continue
    c.left = snap(Math.max(0, o.left + dx))
    c.top = snap(Math.max(0, o.top + dy))
    const dom = document.querySelector(`[data-component="${c.id}"]`)
    if (dom) {
      dom.style.left = `${c.left}px`
      dom.style.top = `${c.top}px`
    }
    syncComponentInspector(c)
  }
}

function applyResizeComp(drag, dx, dy) {
  const c = drag.comp
  if (drag.handle.includes('e')) c.width = snap(Math.max(8, drag.w + dx))
  if (drag.handle.includes('w')) {
    c.width = snap(Math.max(8, drag.w - dx))
    c.left = snap(drag.l + dx)
  }
  if (drag.handle.includes('s')) c.height = snap(Math.max(8, drag.h + dy))
  if (drag.handle.includes('n')) {
    c.height = snap(Math.max(8, drag.h - dy))
    c.top = snap(drag.t + dy)
  }
  const dom = document.querySelector(`[data-component="${c.id}"]`)
  if (dom) {
    dom.style.left = `${c.left}px`
    dom.style.top = `${c.top}px`
    dom.style.width = `${c.width}px`
    dom.style.height = `${c.height}px`
  }
  syncComponentInspector(c)
}

function applyResizeForm(drag, f, dx, dy) {
  if (drag.handle.includes('right')) f.width = snap(Math.max(120, drag.w + dx))
  if (drag.handle.includes('left')) f.width = snap(Math.max(120, drag.w - dx))
  if (drag.handle.includes('bottom')) f.height = snap(Math.max(80, drag.h + dy))
  if (drag.handle.includes('top')) f.height = snap(Math.max(80, drag.h - dy))
  const shell = document.querySelector('.selected-form-shell')
  if (shell) {
    shell.style.width = `${f.width}px`
    shell.style.height = `${f.height + 31}px`
  }
  syncFormInspector(f)
}

function resizeCursorClass(handle) {
  if (handle === 'bottom-right' || handle === 'top-left' || handle === 'se' || handle === 'nw') return 'is-resizing-nwse'
  if (handle === 'bottom-left' || handle === 'top-right' || handle === 'ne' || handle === 'sw') return 'is-resizing-nesw'
  if (handle.includes('right') || handle === 'e' || handle === 'w') return 'is-resizing-ew'
  if (handle.includes('bottom') || handle === 'n' || handle === 's') return 'is-resizing-ns'
  return 'is-resizing-nwse'
}

function endInteraction(pointerTarget, pointerId, classNames = []) {
  try {
    pointerTarget.releasePointerCapture(pointerId)
  } catch {
    /* pointer capture may already be gone */
  }
  document.body.classList.remove('is-dragging', 'is-moving', 'is-resizing', ...classNames)
}

export function wireDesigner() {
  const canvas = document.querySelector('[data-design-canvas]')
  if (!canvas) return
  const f = activeForm()
  if (!f) return

  let drag = null
  let marquee = null

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target !== canvas) return
    if (state.paletteSelected) {
      const rect = canvas.getBoundingClientRect()
      addComponent(f, state.paletteSelected, e.clientX - rect.left, e.clientY - rect.top)
      state.paletteSelected = null
      state.statusMessage = 'CodeInsight: Done'
      renderApp()
      return
    }

    canvas.setPointerCapture(e.pointerId)
    marquee = startMarquee(canvas, e, f)
    e.preventDefault()
  })

  document.querySelectorAll('[data-component]').forEach((el) => {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      if (e.target.matches('[data-comp-resize]')) return
      if (state.paletteSelected) return
      const id = el.dataset.component
      const comp = f.components.find((c) => c.id === id)
      if (!comp) return

      if (e.shiftKey || e.ctrlKey) setSelection([id], true)
      else if (!state.selection.includes(id)) setSelection([id])
      markDomSelection()
      const moving = f.components.filter((c) => state.selection.includes(c.id))
      drag = {
        kind: 'move',
        pointerId: e.pointerId,
        target: el,
        componentId: id,
        moved: false,
        startX: e.clientX, startY: e.clientY,
        originals: moving.map((c) => ({ id: c.id, left: c.left, top: c.top })),
      }
      el.setPointerCapture(e.pointerId)
      document.body.classList.add('is-dragging', 'is-moving')
      e.preventDefault(); e.stopPropagation()
    })
  })

  document.querySelectorAll('[data-comp-resize]').forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      const compEl = h.closest('[data-component]')
      const id = compEl?.dataset.component
      const comp = f.components.find((c) => c.id === id)
      if (!comp) return
      setSelection([id])
      const cursorClass = resizeCursorClass(h.dataset.compResize)
      drag = {
        kind: 'resize-comp', handle: h.dataset.compResize, comp,
        pointerId: e.pointerId,
        target: h,
        cursorClass,
        moved: false,
        startX: e.clientX, startY: e.clientY,
        l: comp.left, t: comp.top, w: comp.width, h: comp.height,
      }
      h.setPointerCapture(e.pointerId)
      document.body.classList.add('is-dragging', 'is-resizing', cursorClass)
      e.preventDefault(); e.stopPropagation()
    })
  })

  document.querySelectorAll('[data-form-resize]').forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      const cursorClass = resizeCursorClass(h.dataset.formResize)
      drag = {
        kind: 'form-resize', handle: h.dataset.formResize,
        pointerId: e.pointerId,
        target: h,
        cursorClass,
        moved: false,
        startX: e.clientX, startY: e.clientY,
        w: f.width, h: f.height,
      }
      h.setPointerCapture(e.pointerId)
      document.body.classList.add('is-dragging', 'is-resizing', cursorClass)
      e.preventDefault(); e.stopPropagation()
    })
  })

  window.onpointermove = (e) => {
    if (marquee) { updateMarquee(marquee, e); return }
    if (!drag) return
    if (e.pointerId !== drag.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.hypot(dx, dy) > CLICK_SLOP) drag.moved = true
    if (drag.kind === 'move') applyMove(drag, f, dx, dy)
    else if (drag.kind === 'resize-comp') applyResizeComp(drag, dx, dy)
    else if (drag.kind === 'form-resize') applyResizeForm(drag, f, dx, dy)
  }

  window.onpointerup = (e) => {
    if (marquee) {
      const box = marquee.box
      finishMarquee(marquee, f)
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* pointer capture may already be gone */
      }
      marquee = null
      if (!box || box.w <= 3 || box.h <= 3) setSelection([f.name])
      renderApp()
      return
    }
    if (!drag) return
    if (e.pointerId !== drag.pointerId) return
    const finished = drag
    endInteraction(finished.target, finished.pointerId, finished.cursorClass ? [finished.cursorClass] : [])
    drag = null
    if (finished.kind === 'move' && !finished.moved) {
      const now = Date.now()
      if (lastClickId === finished.componentId && now - lastClickTime < DBLCLICK_MS) {
        lastClickId = null
        lastClickTime = 0
        const comp = f.components.find((c) => c.id === finished.componentId)
        if (comp) {
          const handlerName = createHandlerForComponent(comp, f)
          state.designerView = 'code'
          state.statusMessage = `Editing ${handlerName}`
          renderApp()
          requestAnimationFrame(() => jumpToHandler(handlerName))
          return
        }
      }
      lastClickId = finished.componentId
      lastClickTime = now
    }
    if (finished.moved || finished.kind !== 'move') state.modified = true
    renderApp()
  }

  window.onpointercancel = (e) => {
    if (marquee) {
      marquee.el?.remove()
      marquee = null
    }
    if (!drag || e.pointerId !== drag.pointerId) return
    endInteraction(drag.target, drag.pointerId, drag.cursorClass ? [drag.cursorClass] : [])
    drag = null
    renderApp()
  }
}
