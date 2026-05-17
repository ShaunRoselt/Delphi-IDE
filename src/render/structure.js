import { state, activeForm } from '../state.js'
import { COMPONENT_DEFS, PALETTE_CATEGORIES } from '../data.js'
import { escapeHtml } from '../util.js'

export function renderStructureTree() {
  const f = activeForm()
  if (!f) return '<div class="empty-state">No form</div>'

  const formLine = `<li class="${state.selection.includes(f.name) ? 'selected' : ''}" style="--depth:0" data-select-object="${f.name}">`
    + `<span class="tree-glyph">▾</span><span class="node-icon">▰</span>${f.name}: ${f.className}</li>`

  const compLines = f.components.map((c) =>
    `<li class="${state.selection.includes(c.id) ? 'selected' : ''}" style="--depth:1" data-select-object="${c.id}">`
    + `<span class="tree-glyph">▸</span><span class="node-icon">${COMPONENT_DEFS[c.type]?.icon || '◆'}</span>${c.id}: ${c.type}</li>`,
  ).join('')

  return `<ul class="structure-tree">${formLine}${compLines}</ul>`
}

export function renderProjectTree() {
  const formTabs = state.openTabs.filter((t) => t.kind === 'form')
  const items = [
    { name: 'Project1.dproj', depth: 0, icon: '▥' },
    { name: 'Project1.exe', depth: 1, icon: '▣' },
    { name: `Build Configurations (${state.config})`, depth: 2, icon: '⚙' },
    { name: `Target Platforms (${state.platform})`, depth: 2, icon: '⚙' },
  ]
  for (const t of formTabs) {
    const f = state.forms[t.formId]
    if (!f) continue
    items.push({ name: `${f.unitName}.pas`, depth: 2, icon: '⊟', tabId: t.id })
  }
  return `<ul class="project-tree">${items.map((i, idx) =>
    `<li style="--depth:${i.depth}" data-project-row="${idx}" ${i.tabId ? `data-tab-id="${i.tabId}"` : ''}>`
    + `<span class="tree-glyph">${i.depth >= 2 ? '·' : '▾'}</span><span class="node-icon">${i.icon}</span>${escapeHtml(i.name)}</li>`,
  ).join('')}</ul>`
}

export function renderPalette() {
  const filter = state.paletteFilter.toLowerCase()

  const sections = PALETTE_CATEGORIES.map((cat) => {
    const open = state.paletteOpen[cat] ?? false
    const entries = Object.entries(COMPONENT_DEFS)
      .filter(([, d]) => d.cat === cat)
      .map(([name, d]) => ({ name, d }))
      .filter(({ name }) => !filter || name.toLowerCase().includes(filter))

    if (filter && entries.length === 0) return ''
    const isOpen = filter ? true : open

    const body = isOpen
      ? entries.map(({ name, d }) =>
          `<li class="palette-component ${state.paletteSelected === name ? 'active' : ''}" data-palette-component="${name}" title="${name}">`
          + `<span class="palette-icon">${d.icon}</span>${name}</li>`,
        ).join('')
      : ''

    return `<li class="palette-section ${isOpen ? 'open' : ''}" data-palette-cat="${cat}" style="--depth:0">`
      + `<span class="tree-glyph">${isOpen ? '▾' : '▸'}</span><span class="node-icon">▦</span>${cat}</li>`
      + (isOpen ? `<ul class="palette-sublist">${body}</ul>` : '')
  }).filter(Boolean).join('')

  return `<ul class="palette-tree">${sections}</ul>`
}
