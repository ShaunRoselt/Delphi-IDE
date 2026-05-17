import { escapeHtml } from '../../util.js'

export default {
  type: 'TComboBox',
  definition: { kind: 'combobox', w: 145, h: 21, prefix: 'ComboBox', icon: '▼', cat: 'Standard' },
  properties: [['Items', 'strings'], ['ItemIndex', 'int'], ['Text', 'string'], ['Style', 'enum:csDropDown,csSimple,csDropDownList,csOwnerDrawFixed']],
  defaultEvent: 'OnChange',
  renderDesigner: (c) => `<span class="ctl-edit">${escapeHtml(c.props?.Text || c.id)}</span><span class="ctl-combo-arrow">▼</span>`,
  renderRuntime: (c, style, attrs) => {
    const p = c.props || {}
    const items = p.Items || []
    const disabled = p.Enabled === false ? 'disabled' : ''
    return `<select class="rt-combo" style="${style}" ${attrs.id} ${disabled}>${items.map((it, i) => `<option ${p.ItemIndex === i ? 'selected' : ''}>${escapeHtml(it)}</option>`).join('')}</select>`
  },
}
