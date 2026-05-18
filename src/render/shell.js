import { state, activeTab } from '../state.js'
import { panel, escapeHtml } from '../util.js'
import {
  renderTitleBar, renderMenubar, renderToolbar,
  renderDocumentTabs, renderStatusBar, renderRunDialog,
} from './chrome.js'
import { renderObjectInspector } from './inspector.js'
import { renderStructureTree, renderProjectTree, renderPalette } from './structure.js'
import { renderWelcomePage } from './welcome.js'
import { renderDesignerPage } from './designer.js'
import { renderCodePage } from './code.js'
import { renderHistoryPage } from './history.js'
import { renderRuntime } from './runtime.js'
import { renderQuickEdit, renderDesignerContextMenu } from './designer-tools.js'

function renderDocument() {
  const tab = activeTab()
  if (!tab || tab.kind === 'welcome') return renderWelcomePage()
  if (tab.kind === 'form') {
    if (state.designerView === 'code') return renderCodePage()
    if (state.designerView === 'history') return renderHistoryPage()
    return renderDesignerPage()
  }
  return renderWelcomePage()
}

function renderLeftDock() {
  const structureBody = `<div class="dock-search"><span>⚙</span><input placeholder="Filter" /></div>${renderStructureTree()}`
  const top = state.layoutSizes?.leftTop ?? 376
  return `
    <aside class="left-dock" style="grid-template-rows:minmax(160px, ${top}px) 5px minmax(210px, 1fr)">
      ${panel('Structure', structureBody)}
      <div class="dock-splitter horizontal" data-layout-resize="left-stack" title="Resize panels"></div>
      ${renderObjectInspector()}
    </aside>
  `
}

function renderRightDock() {
  const projectName = state.project?.name || 'Project1'
  const projectBody = `<div class="project-tools">⚙ &nbsp; ${escapeHtml(projectName)} &nbsp; ⌕</div>${renderProjectTree()}`
  const paletteBody = `<div class="palette-filter"><button type="button" title="Toggle view">◰</button><input data-action="palette-filter" value="${escapeHtml(state.paletteFilter)}" placeholder="Search palette..." /></div>${renderPalette()}`
  const top = state.layoutSizes?.rightTop ?? 486
  return `
    <aside class="right-dock" style="grid-template-rows:minmax(180px, ${top}px) 5px minmax(180px, 1fr)">
      ${panel(`${escapeHtml(projectName)}.dproj - Projects`, projectBody, 'project-panel')}
      <div class="dock-splitter horizontal" data-layout-resize="right-stack" title="Resize panels"></div>
      ${panel('Palette', paletteBody, 'palette-panel')}
    </aside>
  `
}

export function renderShell() {
  const sizes = state.layoutSizes || {}
  const left = sizes.leftDock ?? 279
  const right = sizes.rightDock ?? 297
  return `
    <main class="ide-shell">
      ${renderTitleBar()}
      ${renderMenubar()}
      ${renderToolbar()}
      <div class="workspace" style="grid-template-columns:${left}px 5px minmax(560px, 1fr) 5px ${right}px">
        ${renderLeftDock()}
        <div class="dock-splitter vertical" data-layout-resize="left-dock" title="Resize left dock"></div>
        <section class="center-dock">
          ${renderDocumentTabs()}
          <div class="document-host">${renderDocument()}</div>
        </section>
        <div class="dock-splitter vertical" data-layout-resize="right-dock" title="Resize right dock"></div>
        ${renderRightDock()}
      </div>
      ${renderStatusBar()}
      ${renderRunDialog()}
      ${renderRuntime()}
      ${renderQuickEdit()}
      ${renderDesignerContextMenu()}
    </main>
  `
}
