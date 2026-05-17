import { escapeHtml } from '../../util.js'

export default {
  type: 'TRadioButton',
  definition: { kind: 'radio', w: 113, h: 17, prefix: 'RadioButton', icon: '◉', cat: 'Standard' },
  properties: [['Caption', 'string'], ['Checked', 'bool']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => `<span class="ctl-radio ${c.props?.Checked ? 'checked' : ''}">○</span><span class="ctl-text">${escapeHtml(c.props?.Caption || c.id)}</span>`,
  renderRuntime: (c, style, attrs) => {
    const disabled = c.props?.Enabled === false ? 'disabled' : ''
    return `<label class="rt-radio" style="${style}"><input type="radio" ${attrs.id} name="rt-radio-${c.id.replace(/\d+$/, '')}" ${c.props?.Checked ? 'checked' : ''} ${disabled}/><span>${escapeHtml(c.props?.Caption || c.id)}</span></label>`
  },
}
