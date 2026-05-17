import { escapeHtml } from '../../util.js'

export default {
  type: 'TCheckBox',
  definition: { kind: 'checkbox', w: 97, h: 17, prefix: 'CheckBox', icon: '☑', cat: 'Standard' },
  properties: [['Caption', 'string'], ['Checked', 'bool'], ['State', 'enum:cbUnchecked,cbChecked,cbGrayed'], ['AllowGrayed', 'bool']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => `<span class="ctl-check ${c.props?.Checked ? 'checked' : ''}">☐</span><span class="ctl-text">${escapeHtml(c.props?.Caption || c.id)}</span>`,
  renderRuntime: (c, style, attrs) => {
    const disabled = c.props?.Enabled === false ? 'disabled' : ''
    return `<label class="rt-check" style="${style}"><input type="checkbox" ${attrs.id} ${c.props?.Checked ? 'checked' : ''} ${disabled}/><span>${escapeHtml(c.props?.Caption || c.id)}</span></label>`
  },
}
