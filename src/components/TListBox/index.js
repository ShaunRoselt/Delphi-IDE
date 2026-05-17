import { escapeHtml } from '../../util.js'

export default {
  type: 'TListBox',
  definition: { kind: 'listbox', w: 121, h: 97, prefix: 'ListBox', icon: '☰', cat: 'Standard' },
  properties: [['Items', 'strings'], ['ItemIndex', 'int'], ['Sorted', 'bool'], ['MultiSelect', 'bool']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => {
    const items = c.props?.Items?.length ? c.props.Items : ['(empty)']
    return `<div class="ctl-listbox">${items.slice(0, 8).map((i) => `<div>${escapeHtml(i)}</div>`).join('')}</div>`
  },
  renderRuntime: (c, style, attrs) => {
    const p = c.props || {}
    const items = p.Items || []
    const size = Math.max(2, Math.min(items.length || 1, Math.floor(c.height / 16)))
    const disabled = p.Enabled === false ? 'disabled' : ''
    return `<select class="rt-listbox" style="${style}" ${attrs.id} size="${size}" ${disabled}>${items.map((it, i) => `<option ${p.ItemIndex === i ? 'selected' : ''}>${escapeHtml(it)}</option>`).join('')}</select>`
  },
}
