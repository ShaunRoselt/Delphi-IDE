import { escapeHtml } from '../../util.js'

export default {
  type: 'TGroupBox',
  definition: { kind: 'groupbox', w: 185, h: 105, prefix: 'GroupBox', icon: '▢', cat: 'Standard' },
  properties: [['Caption', 'string']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => `<fieldset class="ctl-group"><legend>${escapeHtml(c.props?.Caption || c.id)}</legend></fieldset>`,
  renderRuntime: (c, style, attrs) => `<fieldset class="rt-groupbox" style="${style}" ${attrs.id}><legend>${escapeHtml(c.props?.Caption || c.id)}</legend></fieldset>`,
}
