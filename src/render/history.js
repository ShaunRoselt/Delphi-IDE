import { activeForm } from '../state.js'
import { escapeHtml } from '../util.js'
import { renderViewSwitcher } from './chrome.js'

// Placeholder history entries — Delphi's local source history tracks file
// revisions. The real feature would persist per-save snapshots; for now we
// show a static list so the panel has shape.
const HISTORY_ENTRIES = [
  { time: 'Today 14:02', label: 'Buffer (unsaved)', author: 'You', current: true },
  { time: 'Today 13:45', label: 'Saved revision', author: 'You' },
  { time: 'Today 12:18', label: 'Saved revision', author: 'You' },
  { time: 'Yesterday 17:05', label: 'Initial check-in', author: 'You' },
]

export function renderHistoryPage() {
  const f = activeForm()
  if (!f) return '<div class="empty-state">No form</div>'

  const rows = HISTORY_ENTRIES.map((e) => `
    <div class="history-row ${e.current ? 'current' : ''}">
      <span class="history-time">${e.current ? '★' : '·'} ${escapeHtml(e.time)}</span>
      <span class="history-author">${escapeHtml(e.author)}</span>
      <span class="history-label">${escapeHtml(e.label)}</span>
    </div>
  `).join('')

  return `
    <section class="history-page">
      <div class="history-toolbar">
        <strong>${escapeHtml(f.unitName)}.pas</strong>
        <span>· Local source history</span>
      </div>
      <div class="history-body">
        <div class="history-head">
          <span>Revision</span>
          <span>Author</span>
          <span>Description</span>
        </div>
        ${rows}
      </div>
      ${renderViewSwitcher()}
    </section>
  `
}
